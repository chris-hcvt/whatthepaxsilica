import * as THREE from 'three';
import { pointInRing, ringCentroid } from './geo';
import type { SiteScene } from './site';
import { buildHouse, facadeTexture, roofTexture, type Geo } from './houses';
import { buildFab, buildMall, buildOffice, glassTexture, panelTexture } from './buildings';
import { ENERGY, ENERGY_KEYS, billOf, homesOf, type EnergyKey } from '../content/power';

/**
 * "How much electricity is 3 gigawatts?" in 3D: the buildings from the ladder, side by side at true scale on the
 * levelled zone. Tapping a row shows that building next to the smaller ones, with an electric bill above it; the
 * camera pulls back to fit them. "The zone" flies out to the whole zone.
 */

export interface BillLabels {
  title: string;
  names: Record<EnergyKey, string>;
  kwh: (n: number) => string;
  peso: (n: number) => string;
  homes: (n: number) => string;
  zoneNote: string;
}

type Item = { key: EnergyKey; group: THREE.Group; x: number; w: number; d: number; h: number; grow: number };

const LOTS: Record<'regular' | 'medium' | 'large' | 'mansion', [number, number]> = {
  regular: [7.69, 8.33],
  medium: [14.29, 8.33],
  large: [16.67, 16.67],
  mansion: [50, 20],
};
/** metres left free before each item */
const GAP: Partial<Record<EnergyKey, number>> = { medium: 5, large: 6, mansion: 8, office: 28, mall: 55, fab: 70 };
const WALLS: Record<string, string> = { regular: '#f4dccd', medium: '#dbe8f0', large: '#f1e3c4', mansion: '#f7f4ec' };
const ROOFS: Record<string, string> = { regular: '#b23a2a', medium: '#2f5f8f', large: '#2f6b4f', mansion: '#4a4f57' };

export class LineupFx {
  readonly group = new THREE.Group();
  private items: Item[] = [];
  /** lineup origin (left end, centre line) in scene km, and its length */
  private ox: number;
  private oz: number;
  private length: number;
  private ground: THREE.Mesh;
  private key: EnergyKey = 'regular';
  private visible = false;
  private bills = new Map<EnergyKey, HTMLDivElement>();
  private zonePos = new THREE.Vector3();
  lite = false;

  constructor(private site: SiteScene) {
    const facade = new THREE.MeshLambertMaterial({ map: facadeTexture(), side: THREE.DoubleSide });
    const roof = new THREE.MeshLambertMaterial({ map: roofTexture(), side: THREE.DoubleSide });
    const plain = new THREE.MeshLambertMaterial({ vertexColors: true });
    const glass = new THREE.MeshLambertMaterial({ map: glassTexture() });
    const solar = new THREE.MeshLambertMaterial({ map: panelTexture() });
    const lawn = new THREE.MeshLambertMaterial({ color: '#7aa865' });

    // lay the items out left to right (metres), then fit the line inside the zone
    let x = 0;
    for (const key of ENERGY_KEYS) {
      if (key === 'hub') continue;
      x += GAP[key] ?? 0;
      const g = new THREE.Group();
      let w: number;
      let d: number;
      let h: number;
      const add = (geo: Geo | undefined, mat: THREE.Material, color?: string) => {
        if (!geo) return;
        const m = new THREE.Mesh(geo, color ? (mat.clone() as THREE.MeshLambertMaterial) : mat);
        if (color) (m.material as THREE.MeshLambertMaterial).color.set(color);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
      };
      if (key === 'regular' || key === 'medium' || key === 'large' || key === 'mansion') {
        const [lw, ld] = LOTS[key];
        const parts = buildHouse(key, lw, ld);
        add(parts.walls, facade, WALLS[key]);
        add(parts.roofs, roof, ROOFS[key]);
        add(parts.details, plain);
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.4, ld - 0.4).rotateX(-Math.PI / 2), lawn);
        lot.position.y = 0.05;
        lot.receiveShadow = true;
        g.add(lot);
        [w, d, h] = [lw, ld, key === 'regular' ? 4.3 : key === 'mansion' ? 10.6 : 8.4];
      } else {
        const b = key === 'office' ? buildOffice() : key === 'mall' ? buildMall() : buildFab();
        add(b.glass, glass);
        add(b.solar, solar);
        add(b.plain, plain);
        [w, d, h] = [b.w, b.d, b.h];
      }
      this.items.push({ key, group: g, x: x + w / 2, w, d, h, grow: 1 });
      this.group.add(g);
      x += w;
    }
    this.length = x / 1000;

    // a strip of paving under the whole line, so the close-up has a crisp ground
    const depth = Math.max(...this.items.map((i) => i.d)) / 1000 + 0.04;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(this.length + 0.06, depth).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#b9b4a8' }));
    this.ground.receiveShadow = true;
    this.group.add(this.ground);

    [this.ox, this.oz] = this.pickSpot(depth);
    this.group.visible = false;
    site.scene.add(this.group);

    for (const key of ENERGY_KEYS) {
      const el = document.createElement('div');
      el.className = `bill b-${key}`;
      el.style.display = 'none';
      site.labelLayer.appendChild(el);
      this.bills.set(key, el);
    }
    this.place();
  }

  /** the left end of a straight strip inside the zone, as close to its middle as possible */
  private pickSpot(depth: number): [number, number] {
    const ring = this.site.hubXZ;
    const [cx, cz] = ringCentroid(ring);
    const L = this.length + 0.06;
    let best: [number, number] = [cx - L / 2, cz];
    let bestD = Infinity;
    for (let dx = -2.5; dx <= 2.5; dx += 0.05) {
      for (let dz = -2.5; dz <= 2.5; dz += 0.05) {
        const x0 = cx + dx - L / 2;
        const z0 = cz + dz;
        let ok = true;
        for (let i = 0; i <= 12 && ok; i++) for (let j = -2; j <= 2 && ok; j++) ok = pointInRing(x0 + (i / 12) * L, z0 + (j / 2) * (depth / 2 + 0.03), ring);
        const dd = Math.hypot(dx, dz);
        if (ok && dd < bestD) {
          bestD = dd;
          best = [x0 + 0.03, z0];
        }
      }
    }
    return best;
  }

  get zoneShown() {
    return this.key === 'hub';
  }

  /** half-size (km) of the sun's shadow box: enough for the buildings now on show */
  get shadowHalf() {
    const f = this.frame(this.key);
    return Math.min(0.6, Math.max(0.05, f.span / 2 + 0.06));
  }

  /** the lineup's middle, for the sun's shadow box */
  centre(): [number, number] {
    return [this.ox + this.length / 2, this.oz];
  }

  /** what the camera should frame for a row: everything up to and including it */
  frame(key: EnergyKey) {
    const upto = this.items.slice(0, Math.max(1, this.items.findIndex((i) => i.key === key) + 1 || this.items.length));
    const last = upto[upto.length - 1];
    const left = this.ox + (upto[0].x - upto[0].w / 2) / 1000;
    const right = this.ox + (last.x + last.w / 2) / 1000;
    const maxH = Math.max(...upto.map((i) => i.h)) / 1000;
    const maxD = Math.max(...upto.map((i) => i.d)) / 1000;
    const y = this.site.heightAt(this.ox, this.oz);
    return { cx: (left + right) / 2, cz: this.oz, y, span: right - left, maxH, maxD };
  }

  setVisible(on: boolean) {
    this.visible = on;
    this.group.visible = on;
    this.applyKey(true);
  }

  setKey(key: EnergyKey) {
    if (key === this.key) return;
    const before = ENERGY_KEYS.indexOf(this.key);
    this.key = key;
    // newly added buildings grow up out of the ground
    for (const it of this.items) if (ENERGY_KEYS.indexOf(it.key) > before && ENERGY_KEYS.indexOf(it.key) <= ENERGY_KEYS.indexOf(key)) it.grow = this.lite ? 1 : 0;
    this.applyKey(false);
  }

  private applyKey(reset: boolean) {
    const k = ENERGY_KEYS.indexOf(this.key);
    for (const it of this.items) {
      it.group.visible = ENERGY_KEYS.indexOf(it.key) <= k;
      if (reset) it.grow = 1;
    }
    this.place();
  }

  place() {
    const y = this.site.heightAt(this.ox + this.length / 2, this.oz);
    for (const it of this.items) {
      it.group.position.set(this.ox + it.x / 1000, y + 0.0002, this.oz);
      const e = it.grow * it.grow * (3 - 2 * it.grow);
      it.group.scale.set(0.001, 0.001 * Math.max(0.001, e), 0.001);
    }
    this.ground.position.set(this.ox + this.length / 2, y + 0.00012, this.oz);
    const [hx, hz] = ringCentroid(this.site.hubXZ);
    this.zonePos.set(hx, this.site.heightAt(hx, hz) + 0.3, hz);
  }

  update(dt: number) {
    let moving = false;
    for (const it of this.items) {
      if (it.group.visible && it.grow < 1) {
        it.grow = Math.min(1, it.grow + dt / 0.9);
        moving = true;
      }
    }
    if (moving) this.place();
    return moving;
  }

  setLabels(t: BillLabels) {
    for (const key of ENERGY_KEYS) {
      const kwh = ENERGY[key];
      const el = this.bills.get(key)!;
      const zone = key === 'hub';
      el.innerHTML = `
        <div class="bill-top"><span>${t.title}</span><b>${t.names[key]}</b></div>
        <div class="bill-line"><span>${t.kwh(kwh)}</span><span>× ₱15.5510</span></div>
        <div class="bill-amt">${t.peso(billOf(kwh))}${zone ? '*' : ''}</div>
        <div class="bill-foot">${zone ? t.zoneNote : t.homes(homesOf(kwh))}</div>
        <div class="bill-mini"><b>${t.names[key]}</b><span>${t.peso(billOf(kwh))}${zone ? '*' : ''}</span></div>`;
    }
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    const k = ENERGY_KEYS.indexOf(this.key);
    const v = new THREE.Vector3();
    for (const key of ENERGY_KEYS) {
      const el = this.bills.get(key)!;
      const i = ENERGY_KEYS.indexOf(key);
      // the chosen row gets the full bill; the two before it a small tag; the zone only when chosen
      const mode = !this.visible ? '' : i === k ? 'full' : key !== 'hub' && this.key !== 'hub' && i < k && i >= k - 2 ? 'mini' : '';
      if (!mode) {
        if (el.style.display !== 'none') el.style.display = 'none';
        continue;
      }
      if (key === 'hub') v.copy(this.zonePos);
      else {
        const it = this.items.find((x) => x.key === key)!;
        v.set(it.group.position.x, it.group.position.y + (it.h / 1000) * Math.max(0.05, it.grow) + 0.0015, it.group.position.z);
      }
      v.project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = '';
      // (not "full": that class name belongs to the story's full-width sections)
      el.classList.toggle('bill-on', mode === 'full');
      el.classList.toggle('bill-tag', mode === 'mini');
      el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  hideLabels() {
    for (const el of this.bills.values()) el.style.display = 'none';
  }
}
