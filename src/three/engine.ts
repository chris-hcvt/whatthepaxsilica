import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SiteScene, type SiteLabels, type SiteView } from './site';
import type { Fx } from './fx';
import type { HomeKey } from './hectare';
import { dataUrl } from '../content/data-url';
import type { SiteData } from './geo';

export interface Insets {
  left: number; // px of the screen covered by text on the left (desktop)
  bottom: number; // px covered at the bottom (phones)
  top?: number; // px covered by the header
}

export type SceneState =
  | {
      kind: 'site';
      view: SiteView;
      ncc?: boolean;
      hub?: boolean;
      wall?: boolean;
      sitios?: 'key' | 'all';
      flat?: boolean;
      /** show the reference currently picked in the UI */
      ref?: boolean;
      spin?: boolean;
      fx?: Fx[];
    }
  | { kind: 'none' };

export interface StateOpts {
  refKey: string;
  homeKey: HomeKey;
  labels: SiteLabels;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.01, 200);
  readonly controls: OrbitControls;
  site: SiteScene | null = null;
  private sitePromise: Promise<SiteScene> | null = null;
  private mode: 'site' | 'none' = 'none';
  private flownIn = false;
  private raf = 0;
  private last = performance.now();
  private dirty = true;
  private fly: {
    tFrom: THREE.Vector3;
    tTo: THREE.Vector3;
    dFrom: THREE.Vector3; // unit direction target → camera
    dTo: THREE.Vector3;
    lnFrom: number; // log of the camera's distance from its target
    lnTo: number;
    t: number;
    dur: number;
  } | null = null;
  private insets: Insets = { left: 0, bottom: 0 };
  private w = 1;
  private h = 1;
  private lastState: Extract<SceneState, { kind: 'site' }> | null = null;
  reducedMotion = false;
  /** simpler rendering for slow devices: lower resolution, no looping animations */
  lite = false;
  private perf = { frames: 0, time: 0, checked: false };
  onSiteProgress?: (state: 'loading' | 'ready' | 'error') => void;

  constructor(
    canvas: HTMLCanvasElement,
    private labelLayer: HTMLElement,
  ) {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    this.lite = mem <= 2 || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const dpr = this.lite ? 1 : Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, alpha: false, powerPreference: 'default' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // soft sun shadows, used only in the one-hectare close-up (and never in lite mode)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor('#06080c');
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 0.05; // km: the one-hectare close-up sits about 300 m away
    this.controls.maxDistance = 45;
    this.controls.autoRotateSpeed = 0.35;
    // the story is driven by scrolling, so the camera is not user-controlled:
    // this keeps page scrolling and pinch-zoom working over the 3D view on phones
    this.controls.enabled = false;
    canvas.style.touchAction = 'auto';
    this.controls.addEventListener('change', () => (this.dirty = true));
    this.controls.addEventListener('start', () => {
      this.fly = null;
      this.controls.autoRotate = false;
    });
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
    if (this.mode === 'site' && this.site && this.lastState) {
      const { position, target } = this.site.view(this.lastState.view, this.visibleAspect(), this.visibleFrac());
      this.flyTo(position, target, 0.9);
    }
    this.dirty = true;
  }

  private visibleAspect() {
    return (this.w - this.insets.left) / Math.max(1, this.h - this.insets.bottom - (this.insets.top ?? 0));
  }

  private visibleFrac() {
    return Math.max(0.25, (this.h - this.insets.bottom - (this.insets.top ?? 0)) / Math.max(1, this.h));
  }

  loadSite(): Promise<SiteScene> {
    if (this.sitePromise) return this.sitePromise;
    this.onSiteProgress?.('loading');
    const small = window.innerWidth < 900 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4;
    const imgUrl = dataUrl(small ? '/data/site/imagery-1024.jpg' : '/data/site/imagery-2048.jpg');
    this.sitePromise = Promise.all([
      fetch(dataUrl('/data/geo/site.json')).then((r) => r.json() as Promise<SiteData>),
      fetch(dataUrl('/data/site/dem.bin')).then((r) => r.arrayBuffer()),
      new THREE.TextureLoader().loadAsync(imgUrl),
    ])
      .then(([data, dem, tex]) => {
        tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.site = new SiteScene(data, dem, tex, this.labelLayer);
        this.site.lite = this.lite;
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

  private layers(s: Extract<SceneState, { kind: 'site' }>, opts: StateOpts) {
    const fx = s.fx ?? [];
    return { ncc: s.ncc, hub: s.hub, wall: s.wall, sitios: s.sitios, flat: s.flat, ref: s.ref ? opts.refKey : null, fx, home: fx.includes('homes') ? opts.homeKey : null };
  }

  async setState(state: SceneState, opts: StateOpts) {
    if (state.kind === 'none') {
      this.mode = 'none';
      this.site?.hideLabels();
      return;
    }
    const site = await this.loadSite();
    const wasSite = this.mode === 'site';
    this.mode = 'site';
    this.controls.autoRotate = !!state.spin && !this.reducedMotion && !this.lite;
    site.setLayers(this.layers(state, opts), opts.labels, this.reducedMotion);
    this.lastState = state;
    const { position, target } = site.view(state.view, this.visibleAspect(), this.visibleFrac());
    if (!this.flownIn) {
      this.flownIn = true;
      this.controls.target.copy(target);
      this.camera.position.copy(this.reducedMotion ? position : target.clone().add(new THREE.Vector3(0, 34, 26)));
      this.flyTo(position, target, 2.8);
    } else {
      this.flyTo(position, target, wasSite ? 1.6 : 0.01);
    }
    this.dirty = true;
  }

  refresh(state: SceneState, opts: StateOpts) {
    if (this.site && state.kind === 'site') {
      this.site.setLayers(this.layers(state, opts), opts.labels, this.reducedMotion);
      this.dirty = true;
    }
  }

  private flyTo(position: THREE.Vector3, target: THREE.Vector3, dur: number) {
    if (this.reducedMotion || dur < 0.05) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.fly = null;
      this.dirty = true;
      return;
    }
    // fly along the view direction with the distance changing on a log scale, so a big zoom (one hectare →
    // the whole zone) reads as one steady pull-back instead of a jump
    const from = this.camera.position.clone().sub(this.controls.target);
    const to = position.clone().sub(target);
    const lnFrom = Math.log(Math.max(1e-4, from.length()));
    const lnTo = Math.log(Math.max(1e-4, to.length()));
    const zoom = Math.abs(lnTo - lnFrom);
    if (zoom > 1.2) dur = Math.max(dur, Math.min(3.4, 1.3 + zoom * 0.55));
    this.fly = { tFrom: this.controls.target.clone(), tTo: target.clone(), dFrom: from.normalize(), dTo: to.normalize(), lnFrom, lnTo, t: 0, dur };
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden || this.mode !== 'site' || !this.site) return;
    let active = false;
    if (this.fly) {
      const f = this.fly;
      f.t = Math.min(1, f.t + dt / f.dur);
      const k = ease(f.t);
      this.controls.target.lerpVectors(f.tFrom, f.tTo, k);
      const dir = new THREE.Vector3().lerpVectors(f.dFrom, f.dTo, k);
      if (dir.lengthSq() < 1e-6) dir.copy(f.dTo);
      dir.normalize().multiplyScalar(Math.exp(f.lnFrom + (f.lnTo - f.lnFrom) * k));
      this.camera.position.copy(this.controls.target).add(dir);
      if (f.t >= 1) this.fly = null;
      active = true;
    }
    if (this.site.update(dt)) active = true;
    if (this.controls.update()) active = true;
    if (active || this.dirty) {
      this.dirty = false;
      this.renderer.render(this.site.scene, this.camera);
      this.site.updateLabels(this.camera, this.w, this.h);
      this.watchPerformance(dt);
    }
  }

  /** after ~2 s of animation, drop to a lighter mode if frames are slow */
  private watchPerformance(dt: number) {
    if (this.perf.checked || this.lite) return;
    if (dt > 0.5) return; // ignore pauses (tab switches)
    this.perf.frames++;
    this.perf.time += dt;
    if (this.perf.frames < 90) return;
    this.perf.checked = true;
    if (this.perf.time / this.perf.frames > 1 / 24) {
      this.lite = true;
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(this.w, this.h, false);
      this.controls.autoRotate = false;
      if (this.site) this.site.lite = true;
      this.dirty = true;
    }
  }
}
