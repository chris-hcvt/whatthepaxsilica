import * as THREE from 'three';
import { ringCentroid } from './geo';
import type { SiteScene } from './site';
import { ACWA_AVG_MW, ACWA_MW, BCDA_LNG_STUDY_MW, HUB_MW } from '../content/power';

/**
 * "How could they power it?": a glass gauge rising from the zone, as tall as the 3 GW BCDA expects.
 * It is filled only by what is lined up, averaged over day and night (ACWA's solar, the 40 MW gas study);
 * a dashed outline marks ACWA's 500 MW panel peak (full sun only). The rest stays empty: no published plan.
 */

const KM_PER_MW = 0.8 / 1000; // 1 GW = 0.8 km of gauge
const WIDTH = 0.7; // km

export interface GaugeLabels {
  need: string;
  peak: string;
  lined: string;
  gap: string;
}

export class GaugeFx {
  readonly group = new THREE.Group();
  private acwa: THREE.Mesh;
  private lng: THREE.Mesh;
  private fill = 0;
  private on = false;
  private labels: { el: HTMLDivElement; mw: number; side: 1 | -1 }[] = [];
  private base = new THREE.Vector3();
  lite = false;

  constructor(private site: SiteScene) {
    const H = HUB_MW * KM_PER_MW;
    // the glass tube with its edges and a tick ring every gigawatt
    const tube = new THREE.BoxGeometry(WIDTH, H, WIDTH);
    tube.translate(0, H / 2, 0);
    const glass = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.16, depthWrite: false, emissive: '#1b2f4a', emissiveIntensity: 0.4 }));
    glass.renderOrder = 6;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(tube), new THREE.LineBasicMaterial({ color: '#e6f0ff', transparent: true, opacity: 0.75 }));
    this.group.add(glass, edges);
    for (let gw = 1; gw < HUB_MW / 1000; gw++) {
      const ring = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(WIDTH, 0.0001, WIDTH)),
        new THREE.LineBasicMaterial({ color: '#e6f0ff', transparent: true, opacity: 0.35 }),
      );
      ring.position.y = gw * 1000 * KM_PER_MW;
      this.group.add(ring);
    }
    // what is lined up, averaged: ACWA's solar, then the gas study, stacked
    const seg = (color: string) => {
      const g = new THREE.BoxGeometry(WIDTH * 0.98, 1, WIDTH * 0.98);
      g.translate(0, 0.5, 0);
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 }));
      this.group.add(m);
      return m;
    };
    this.acwa = seg('#36d39a');
    this.lng = seg('#ffb020');
    // ACWA's 500 MW peak rating: dashed outline only
    const peakH = ACWA_MW * KM_PER_MW;
    const peakBox = new THREE.BoxGeometry(WIDTH * 1.02, peakH, WIDTH * 1.02);
    peakBox.translate(0, peakH / 2, 0);
    const peak = new THREE.LineSegments(new THREE.EdgesGeometry(peakBox), new THREE.LineDashedMaterial({ color: '#7dffcf', dashSize: 0.03, gapSize: 0.02 }));
    peak.computeLineDistances();
    this.group.add(peak);

    this.group.visible = false;
    site.scene.add(this.group);
    const mk = (mw: number, side: 1 | -1, cls: string) => {
      const el = document.createElement('div');
      el.className = `label3d fx gauge-label ${cls}`;
      el.style.display = 'none';
      site.labelLayer.appendChild(el);
      this.labels.push({ el, mw, side });
    };
    mk(HUB_MW, 1, 'g-need');
    mk(ACWA_MW, -1, 'g-peak');
    mk(ACWA_AVG_MW[1] + BCDA_LNG_STUDY_MW, 1, 'g-lined');
    mk(HUB_MW * 0.55, -1, 'g-gap');
    this.place();
  }

  setLabels(t: GaugeLabels) {
    const [need, peak, lined, gap] = this.labels;
    need.el.innerHTML = `<span>${t.need}</span>`;
    peak.el.innerHTML = `<span>${t.peak}</span>`;
    lined.el.innerHTML = `<span>${t.lined}</span>`;
    gap.el.innerHTML = `<span>${t.gap}</span>`;
  }

  setVisible(on: boolean, instant: boolean) {
    if (on && !this.on) this.fill = instant || this.lite ? 1 : 0;
    this.on = on;
    this.group.visible = on;
    this.place();
  }

  /**
   * Phones: what the camera keeps in view: the whole gauge (base to the 3 GW top), a little ground around its
   * foot, and room beside it for the notes.
   */
  fitPoints() {
    const H = HUB_MW * KM_PER_MW;
    const r = WIDTH * 0.9;
    const pts: THREE.Vector3[] = [];
    for (const y of [0, H + 0.12]) for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push(this.base.clone().add(new THREE.Vector3(sx * r, y, sz * r)));
    return pts;
  }

  /** the camera target for this scene */
  target() {
    return this.base.clone().add(new THREE.Vector3(0, (HUB_MW * KM_PER_MW) / 2.4, 0));
  }

  place() {
    const [x, z] = ringCentroid(this.site.hubXZ);
    this.base.set(x, this.site.heightAt(x, z) + 0.01, z);
    this.group.position.copy(this.base);
    const e = this.fill * this.fill * (3 - 2 * this.fill);
    const a = ACWA_AVG_MW[1] * KM_PER_MW * Math.max(0.001, e);
    const l = BCDA_LNG_STUDY_MW * KM_PER_MW * Math.max(0.001, e);
    this.acwa.scale.y = a;
    this.lng.scale.y = l;
    this.lng.position.y = a;
  }

  update(dt: number) {
    if (!this.on) return false;
    if (this.fill < 1) {
      this.fill = Math.min(1, this.fill + dt / 1.2);
      this.place();
      return true;
    }
    // follow the ground while it changes (the zone un-levels after the lineup step)
    const [x, z] = ringCentroid(this.site.hubXZ);
    if (Math.abs(this.site.heightAt(x, z) + 0.01 - this.base.y) > 1e-5) {
      this.place();
      return true;
    }
    return false;
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    const v = new THREE.Vector3();
    // placed from the top of the gauge down; on a narrow screen a label that would sit on another one drops below it
    const placed: [number, number, number, number][] = [];
    const order = [...this.labels].sort((a, b) => b.mw - a.mw);
    for (const l of order) {
      if (!this.on) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      v.copy(this.base).add(new THREE.Vector3((l.side * WIDTH) / 2, l.mw * KM_PER_MW, 0)).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      // beside the tube, but never past the screen edge (phones): slide in and overlap the glass if needed
      const lw = l.el.offsetWidth;
      const lh = l.el.offsetHeight;
      const px = (v.x * 0.5 + 0.5) * w;
      const left = Math.min(Math.max(l.side > 0 ? px + 8 : px - 8 - lw, 6), w - 6 - lw);
      let cy = (-v.y * 0.5 + 0.5) * h;
      for (let k = 0; k < 4; k++) {
        const hit = placed.find((p) => left < p[2] && left + lw > p[0] && cy - lh / 2 < p[3] && cy + lh / 2 > p[1]);
        if (!hit) break;
        cy = hit[3] + lh / 2 + 3;
      }
      placed.push([left - 2, cy - lh / 2 - 2, left + lw + 2, cy + lh / 2 + 2]);
      l.el.style.transform = `translate(${left.toFixed(1)}px, ${cy.toFixed(1)}px) translate(0, -50%)`;
    }
  }

  hideLabels() {
    for (const l of this.labels) l.el.style.display = 'none';
  }
}
