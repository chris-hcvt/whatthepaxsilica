import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GlobeScene } from './globe';
import { SiteScene, type SiteLabels } from './site';
import type { ScenePreset } from '../content/slides';
import type { SiteData } from './geo';

export interface Insets {
  left: number; // px of the screen covered by the text panel on the left
  bottom: number; // px covered by a bottom sheet (mobile)
  top?: number; // px covered by the top bar
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.01, 200);
  readonly controls: OrbitControls;
  readonly globe = new GlobeScene();
  site: SiteScene | null = null;
  private sitePromise: Promise<SiteScene> | null = null;
  private mode: 'globe' | 'site' | 'none' = 'none';
  private raf = 0;
  private last = performance.now();
  private dirty = true;
  private fly: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t: number; dur: number } | null = null;
  private insets: Insets = { left: 0, bottom: 0 };
  private w = 1;
  private h = 1;
  reducedMotion = false;
  onModeChange?: (mode: 'globe' | 'site' | 'none') => void;
  onSiteProgress?: (state: 'loading' | 'ready' | 'error') => void;

  constructor(
    canvas: HTMLCanvasElement,
    private labelLayer: HTMLElement,
  ) {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, alpha: false, powerPreference: 'default' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 45;
    this.controls.enabled = false;
    this.controls.addEventListener('change', () => (this.dirty = true));
    this.controls.addEventListener('start', () => (this.fly = null));
    this.globe.load().then(() => (this.dirty = true));
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.renderer.dispose();
  }

  resize(w: number, h: number, insets: Insets) {
    this.w = w;
    this.h = h;
    this.insets = insets;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // shift the projection so the subject sits in the part of the screen not covered by text
    const ox = -insets.left / 2;
    const oy = (insets.bottom - (insets.top ?? 0)) / 2;
    if (ox || oy) this.camera.setViewOffset(w, h, ox, oy, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    // re-frame the 3D site when the free screen area changes (e.g. the text sheet is collapsed)
    if (this.mode === 'site' && this.site && this.lastSite) {
      const { position, target } = this.site.view(this.lastSite.preset.view, this.visibleAspect(), this.visibleFrac());
      this.flyTo(position, target, 0.9);
    }
    this.dirty = true;
  }

  private visibleAspect() {
    return (this.w - this.insets.left) / Math.max(1, this.h - this.insets.bottom - (this.insets.top ?? 0));
  }

  /** share of the screen height left for the 3D scene (1 on desktop, ~0.4 on phones) */
  private visibleFrac() {
    return Math.max(0.25, (this.h - this.insets.bottom - (this.insets.top ?? 0)) / Math.max(1, this.h));
  }

  private lastSite: { preset: Extract<ScenePreset, { kind: 'site' }> } | null = null;

  loadSite(): Promise<SiteScene> {
    if (this.sitePromise) return this.sitePromise;
    this.onSiteProgress?.('loading');
    const small = window.innerWidth < 900 || (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4;
    const imgUrl = small ? '/data/site/imagery-1024.jpg' : '/data/site/imagery-2048.jpg';
    this.sitePromise = Promise.all([
      fetch('/data/geo/site.json').then((r) => r.json() as Promise<SiteData>),
      fetch('/data/site/dem.bin').then((r) => r.arrayBuffer()),
      new THREE.TextureLoader().loadAsync(imgUrl),
    ])
      .then(([data, dem, tex]) => {
        tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.site = new SiteScene(data, dem, tex, this.labelLayer);
        this.onSiteProgress?.('ready');
        this.dirty = true;
        return this.site;
      })
      .catch((e) => {
        this.onSiteProgress?.('error');
        this.sitePromise = null;
        throw e;
      });
    return this.sitePromise;
  }

  async setPreset(preset: ScenePreset, opts: { mall: string; labels: SiteLabels }) {
    if (preset.kind === 'globe') {
      this.switchMode('globe');
      this.controls.enabled = false;
      this.globe.setHighlight(preset.highlight);
      this.globe.spin = !!preset.spin && !this.reducedMotion;
      this.globe.focus(preset.focus[0], preset.focus[1], preset.zoom ?? 1, this.reducedMotion);
      this.dirty = true;
      return;
    }
    if (preset.kind === 'site') {
      const site = await this.loadSite();
      const firstTime = this.mode !== 'site';
      this.switchMode('site');
      this.controls.enabled = true;
      site.setLayers(
        { ncc: preset.ncc, hub: preset.hub, wall: preset.wall, sitios: preset.sitios, mall: preset.malls ? opts.mall : null },
        opts.labels,
      );
      this.lastSite = { preset };
      const { position, target } = site.view(preset.view, this.visibleAspect(), this.visibleFrac());
      if (firstTime) {
        // start high above and fly in
        const start = target.clone().add(new THREE.Vector3(0, 34, 26));
        this.camera.position.copy(this.reducedMotion ? position : start);
        this.controls.target.copy(target);
      }
      this.flyTo(position, target, firstTime ? 2.6 : 1.7);
      return;
    }
    this.switchMode('none');
    this.controls.enabled = false;
  }

  private switchMode(m: 'globe' | 'site' | 'none') {
    if (m === this.mode) return;
    this.mode = m;
    if (m !== 'site') this.site?.hideLabels();
    if (m === 'globe') {
      this.camera.position.set(0, 0, 3.9);
      this.controls.target.set(0, 0, 0);
      this.camera.lookAt(0, 0, 0);
    }
    this.onModeChange?.(m);
    this.dirty = true;
  }

  private flyTo(position: THREE.Vector3, target: THREE.Vector3, dur: number) {
    if (this.reducedMotion) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.fly = null;
      this.dirty = true;
      return;
    }
    this.fly = { from: this.camera.position.clone(), to: position, tFrom: this.controls.target.clone(), tTo: target, t: 0, dur };
  }

  refreshLabels(labels: SiteLabels, preset: ScenePreset, mall: string) {
    if (this.site && preset.kind === 'site') {
      this.site.setLayers(
        { ncc: preset.ncc, hub: preset.hub, wall: preset.wall, sitios: preset.sitios, mall: preset.malls ? mall : null },
        labels,
      );
      this.dirty = true;
    }
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden) return;
    let active = false;
    if (this.mode === 'globe') {
      active = this.globe.update(dt);
      const z = (this.w < 760 ? 4.6 : 3.9) / this.globe.zoom;
      if (Math.abs(this.camera.position.z - z) > 1e-4) {
        this.camera.position.set(0, 0, z);
        active = true;
      }
    } else if (this.mode === 'site') {
      if (this.fly) {
        const f = this.fly;
        f.t = Math.min(1, f.t + dt / f.dur);
        const k = ease(f.t);
        this.camera.position.lerpVectors(f.from, f.to, k);
        this.controls.target.lerpVectors(f.tFrom, f.tTo, k);
        if (f.t >= 1) this.fly = null;
        active = true;
      }
      if (this.controls.update()) active = true;
    }
    if (active || this.dirty) {
      this.dirty = false;
      if (this.mode === 'globe') {
        this.camera.lookAt(0, 0, 0);
        this.renderer.render(this.globe.scene, this.camera);
      } else if (this.mode === 'site' && this.site) {
        this.renderer.render(this.site.scene, this.camera);
        this.site.updateLabels(this.camera, this.w, this.h, true);
      } else {
        this.renderer.setClearColor('#06080c');
        this.renderer.clear();
      }
    }
  }
}
