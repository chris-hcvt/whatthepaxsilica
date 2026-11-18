import * as THREE from 'three';
import { pointInRing, ringCentroid } from './geo';
import type { SiteScene } from './site';
import { buildHouse, facadeTexture, roofTexture, type Geo } from './houses';
import { buildFab, buildMall, buildOffice, glassTexture, panelTexture } from './buildings';
import { ENERGY, ENERGY_EVENT, ENERGY_KEYS, billOf, homesOf, type EnergyKey } from '../content/power';

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
  /** the tap-me tag on the empty plot where the next building goes */
  add: (name: string) => string;
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
/** lot lawns, as in the one-hectare scene (the small home's lot is mostly bare ground and concrete) */
const LAWNS: Record<string, string> = { regular: '#a9a58f', medium: '#6f9d55', large: '#5f9a4a', mansion: '#58954a' };
/** metres of grass per texture tile */
const GRASS_TILE = 24;

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
  /** dashed outline of the next building's plot, and its tap-me tag */
  private ghost: THREE.LineSegments;
  private ghostFill: THREE.Mesh;
  private nextTag: HTMLButtonElement;
  private names: Record<EnergyKey, string> | null = null;
  private addLabel: ((name: string) => string) | null = null;
  lite = false;

  constructor(private site: SiteScene) {
    const facade = new THREE.MeshLambertMaterial({ map: facadeTexture(), side: THREE.DoubleSide });
    const roof = new THREE.MeshLambertMaterial({ map: roofTexture(), side: THREE.DoubleSide });
    const plain = new THREE.MeshLambertMaterial({ vertexColors: true });
    const glass = new THREE.MeshLambertMaterial({ map: glassTexture() });
    const solar = new THREE.MeshLambertMaterial({ map: panelTexture() });

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
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.4, ld - 0.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: LAWNS[key] }));
        lot.position.y = 0.06;
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

    // a field of mown grass under the whole line, so the close-up has a crisp, green ground
    const depth = Math.max(...this.items.map((i) => i.d)) / 1000 + 0.08;
    const gw = this.length + 0.1;
    const gg = new THREE.PlaneGeometry(gw, depth).rotateX(-Math.PI / 2);
    const guv = gg.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < guv.count; i++) guv.setXY(i, (guv.getX(i) * gw * 1000) / GRASS_TILE, (guv.getY(i) * depth * 1000) / GRASS_TILE);
    this.ground = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ map: grassTexture() }));
    this.ground.receiveShadow = true;
    this.group.add(this.ground);

    [this.ox, this.oz] = this.pickSpot(depth);
    this.group.visible = false;
    site.scene.add(this.group);

    // the next building's empty plot: a unit square outline, scaled to its footprint
    const sq = new THREE.BufferGeometry().setFromPoints(
      [[-0.5, -0.5], [0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
    );
    this.ghost = new THREE.LineSegments(sq, new THREE.LineDashedMaterial({ color: '#ffd166', dashSize: 0.004, gapSize: 0.003, transparent: true, opacity: 0.95 }));
    this.ghost.visible = false;
    this.ghostFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.ghostFill.visible = false;
    site.scene.add(this.ghost, this.ghostFill);
    this.nextTag = document.createElement('button');
    this.nextTag.type = 'button';
    this.nextTag.className = 'next-tag';
    this.nextTag.style.display = 'none';
    this.nextTag.addEventListener('click', () => {
      const next = this.nextKey();
      if (next) window.dispatchEvent(new CustomEvent(ENERGY_EVENT, { detail: next }));
    });
    site.labelLayer.appendChild(this.nextTag);

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
    const L = this.length + 0.1;
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
          best = [x0 + 0.05, z0];
        }
      }
    }
    return best;
  }

  /** the building that tapping "next" adds (none once the zone is shown, or for the zone itself) */
  private nextKey(): EnergyKey | null {
    return ENERGY_KEYS[ENERGY_KEYS.indexOf(this.key) + 1] ?? null;
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
    const next = this.items.find((i) => i.key === this.nextKey());
    this.ghost.visible = this.ghostFill.visible = this.visible && !!next;
    if (next) {
      // the plot, a little inset so the dashes read as an empty lot
      this.ghost.position.set(this.ox + next.x / 1000, y + 0.0004, this.oz);
      this.ghost.scale.set((next.w * 0.94) / 1000, 1, (next.d * 0.94) / 1000);
      this.ghostFill.position.copy(this.ghost.position);
      this.ghostFill.scale.copy(this.ghost.scale);
      const m = this.ghost.material as THREE.LineDashedMaterial;
      // keep the dashes about the same size on small and big plots
      const k = Math.max(next.w, next.d) / 1000;
      m.dashSize = Math.max(0.0012, k * 0.05);
      m.gapSize = m.dashSize * 0.7;
      this.ghost.computeLineDistances();
      // computeLineDistances works in local units: scale them back to km along each side
      const ld = this.ghost.geometry.attributes.lineDistance as THREE.BufferAttribute;
      const sx = this.ghost.scale.x;
      const sz = this.ghost.scale.z;
      const sides = [sx, sx, sz, sz, sx, sx, sz, sz];
      for (let i = 0; i < ld.count; i++) ld.setX(i, i % 2 ? sides[i] : 0);
      ld.needsUpdate = true;
    }
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
    this.names = t.names;
    this.addLabel = t.add;
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
    this.updateNextTag(camera, w, h);
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
      // centred over its building, slid in from the screen edge if it would be cut off
      const bw = el.offsetWidth;
      const bx = Math.min(Math.max((v.x * 0.5 + 0.5) * w, bw / 2 + 6), w - bw / 2 - 6);
      el.style.transform = `translate(${bx.toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  /** "+ Medium home": over the empty plot, or pinned to the right edge (the line grows to the right) */
  private updateNextTag(camera: THREE.Camera, w: number, h: number) {
    const tag = this.nextTag;
    const next = this.nextKey();
    if (!this.visible || !next || next === 'hub' || !this.names || !this.addLabel) {
      if (tag.style.display !== 'none') tag.style.display = 'none';
      return;
    }
    const it = this.items.find((x) => x.key === next)!;
    const v = new THREE.Vector3(this.ox + it.x / 1000, this.ghost.position.y + Math.min(it.h, 12) / 1000, this.oz).project(camera);
    // pinned to the edge: sit at ground level, below the roofs and bills
    if (v.x > 1) v.set(this.ox + it.x / 1000, this.ghost.position.y, this.oz).project(camera);
    if (v.z > 1) {
      tag.style.display = 'none';
      return;
    }
    const text = this.addLabel(this.names[next]);
    if (tag.dataset.text !== text) {
      tag.dataset.text = text;
      tag.textContent = text;
    }
    let x = (v.x * 0.5 + 0.5) * w;
    let y = (-v.y * 0.5 + 0.5) * h;
    const edge = x > w - 24;
    if (edge) y -= 22;
    tag.classList.toggle('edge', edge);
    if (edge) x = w - 12;
    y = Math.min(Math.max(y, 90), h - 60);
    tag.style.display = '';
    tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${edge ? '-100%' : '-50%'}, -50%)`;
  }

  hideLabels() {
    for (const el of this.bills.values()) el.style.display = 'none';
    this.nextTag.style.display = 'none';
  }
}

/** mown grass: a mottled green tile with faint mowing stripes */
function grassTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#65944a';
  g.fillRect(0, 0, S, S);
  // mowing stripes, 4 per tile
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? 'rgba(255, 255, 220, 0.022)' : 'rgba(0, 30, 0, 0.022)';
    g.fillRect(0, (i * S) / 4, S, S / 4);
  }
  // speckles of lighter and darker blades (seeded, so every load looks the same)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const light = rnd() < 0.5;
    g.fillStyle = light ? `rgba(160, 200, 110, ${0.12 + rnd() * 0.18})` : `rgba(40, 80, 30, ${0.12 + rnd() * 0.2})`;
    g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
