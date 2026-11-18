import * as THREE from 'three';
import { outerRing, pointInRing, ringCentroid, type LL } from './geo';
import type { SiteScene } from './site';
import { HectareFx, type HomeKey } from './hectare';
import { ANALYSIS_SOLAR_HA, BENCH_SOLAR_HA, RESERVOIR_HA } from '../content/story';

/** One extra visual per story step, added on top of the base scene. */
export type Fx =
  | 'nccDraw'
  | 'manila'
  | 'icons'
  | 'lease'
  | 'unknowns'
  | 'hectare'
  | 'court'
  | 'homes'
  | 'grid'
  | 'makati'
  | 'rings'
  | 'river'
  | 'farms'
  | 'power'
  | 'solar'
  | 'water'
  | 'reservoir';

export interface FxLabels {
  manila: string;
  icons: [string, string, string];
  noDataCentres: string;
  lease: string;
  unknowns: [string, string, string];
  /** "100 m" side labels on the one-hectare square */
  side: string;
  court: string;
  oneHectare: string;
  power: string;
  /** solar land squares: title and the two sizes */
  solar: [string, string];
  reservoir: string;
  odonnell: string;
  /** the rising water column: day counter, and marks at 1 day, 1 week, 1 month */
  waterDay: (day: number, meters: number, mld: number) => string;
  waterTick: (days: number, meters: number) => string;
  makati: string;
  families: string;
  river: string;
  creek: string;
  farms: string;
}

interface FxLabel {
  key: Fx;
  el: HTMLDivElement;
  pos: THREE.Vector3;
  xz: [number, number];
  lift: number;
}

const ICONS = {
  chip: '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>',
  factory: '<svg viewBox="0 0 24 24"><path d="M3 21V10l6 4V10l6 4V6h6v15H3Z"/></svg>',
  mineral: '<svg viewBox="0 0 24 24"><path d="M7 3h10l4 6-9 12L3 9l4-6Zm-4 6h18"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/></svg>',
  q: '<span class="fx-q">?</span>',
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9H3z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 3s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-6 1-8.5Z"/></svg>',
};

const MANILA: LL = [120.9822, 14.5995];

export class SiteFx {
  private active = new Set<Fx>();
  private labels: FxLabel[] = [];
  private t = 0;
  // ribbons
  private nccRibbon: THREE.Mesh;
  private nccProgress = 0;
  private manilaGroup: THREE.Group;
  private manilaProgress = 0;
  private makatiMesh: THREE.Mesh;
  private rings: THREE.Mesh[] = [];
  private ringCentre: [number, number];
  private manilaEnd: [number, number];
  readonly hectare: HectareFx;
  /** illustrative solar land, as squares centred on the zone (lon/lat corners): [benchmark estimate, one analysis] */
  private solarSquares: [LL[], LL[]];
  private reservoirParts: LL[][];
  private liteMode = false;

  get lite() {
    return this.liteMode;
  }

  set lite(v: boolean) {
    this.liteMode = v;
    this.hectare.lite = v;
  }

  constructor(private site: SiteScene) {
    const sc = site.scene;
    // New Clark City boundary, drawn on progressively
    this.nccRibbon = this.ribbon(this.densify(site.nccXZ, 0.08), 0.07, '#ffc94d');
    this.nccRibbon.visible = false;
    sc.add(this.nccRibbon);

    // line toward Manila
    const [hx, hz] = site.proj.xz([120.4875, 15.3075]);
    const [mx, mz] = site.proj.xz(MANILA);
    const dx = mx - hx;
    const dz = mz - hz;
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    // run to just inside the edge of the terrain block
    const hw = site.halfWidth - 0.6;
    const hd = site.halfDepth - 0.6;
    const tEdge = Math.min(ux > 0 ? (hw - hx) / ux : (-hw - hx) / ux, uz > 0 ? (hd - hz) / uz : (-hd - hz) / uz);
    const pts: [number, number][] = [];
    const run = Math.min(tEdge, 7.5);
    for (let s = 0.6; s <= run; s += 0.08) pts.push([hx + ux * s, hz + uz * s]);
    this.manilaEnd = pts[pts.length - 1];
    this.manilaGroup = new THREE.Group();
    const line = this.ribbon(pts, 0.09, '#9cc4ff');
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 16), new THREE.MeshBasicMaterial({ color: '#9cc4ff' }));
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ux, 0, uz));
    this.manilaGroup.add(line, head);
    this.manilaGroup.visible = false;
    sc.add(this.manilaGroup);

    // Makati City laid onto the levelled zone
    const mk = site.data.fx?.makati;
    const ring = mk ? outerRing(mk.geom) : [];
    const clon = ring.reduce((a, p) => a + p[0], 0) / Math.max(1, ring.length);
    const clat = ring.reduce((a, p) => a + p[1], 0) / Math.max(1, ring.length);
    const kx = 111.32 * Math.cos((clat * Math.PI) / 180);
    const shape = new THREE.Shape(ring.map(([lon, lat]) => new THREE.Vector2((lon - clon) * kx, (lat - clat) * 110.574)));
    const mg = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
    mg.rotateX(-Math.PI / 2);
    this.makatiMesh = new THREE.Mesh(
      mg,
      new THREE.MeshLambertMaterial({ color: '#9cc4ff', emissive: '#1d3a66', emissiveIntensity: 0.6, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.makatiMesh.renderOrder = 3;
    this.makatiMesh.visible = false;
    sc.add(this.makatiMesh);

    // pulsing rings at Sapang Kawayan
    const sk = site.data.sitios.find((s) => s.name === 'Sapang Kawayan')!;
    this.ringCentre = site.proj.xz(sk.lonlat);
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 64),
        new THREE.MeshBasicMaterial({ color: '#ff6b6b', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      );
      r.rotation.x = -Math.PI / 2;
      r.visible = false;
      r.renderOrder = 4;
      this.rings.push(r);
      sc.add(r);
    }

    this.hectare = new HectareFx(site);

    // power & water: the land a 2-gigawatt solar farm would need, as a square centred on the zone
    const [hlon, hlat] = ringCentroid(site.data.hub as [number, number][]);
    const square = (ha: number): LL[] => {
      const half = Math.sqrt(ha / 100) / 2; // km
      const dlon = half / (111.32 * Math.cos((hlat * Math.PI) / 180));
      const dlat = half / 110.574;
      return [
        [hlon - dlon, hlat + dlat],
        [hlon + dlon, hlat + dlat],
        [hlon + dlon, hlat - dlat],
        [hlon - dlon, hlat - dlat],
      ];
    };
    this.solarSquares = [square(BENCH_SOLAR_HA[1]), square(ANALYSIS_SOLAR_HA)];
    // reservoirs: the northern part of the zone with the same area as 390 and 780 hectares
    this.reservoirParts = RESERVOIR_HA.map((ha) => this.northPart(ha / 100));

    this.buildLabels();
    this.place();
  }

  hectareTarget() {
    const { cx, cz } = this.hectare;
    return new THREE.Vector3(cx, this.site.heightAt(cx, cz), cz);
  }

  setHome(k: HomeKey) {
    this.hectare.setHome(k);
  }

  /** the part of the zone north of a line, with the given area (km²), as lon/lat */
  private northPart(km2: number): LL[] {
    const ring = this.site.hubXZ;
    const clip = (zc: number) => {
      const out: [number, number][] = [];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        const ina = a[1] <= zc;
        const inb = b[1] <= zc;
        if (ina) out.push(a);
        if (ina !== inb) {
          const t = (zc - a[1]) / (b[1] - a[1]);
          out.push([a[0] + (b[0] - a[0]) * t, zc]);
        }
      }
      return out;
    };
    const area = (p: [number, number][]) => {
      let s = 0;
      for (let i = 0; i < p.length; i++) {
        const [x1, z1] = p[i];
        const [x2, z2] = p[(i + 1) % p.length];
        s += x1 * z2 - x2 * z1;
      }
      return Math.abs(s) / 2;
    };
    const zs = ring.map((p) => p[1]);
    let lo = Math.min(...zs);
    let hi = Math.max(...zs);
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (area(clip(mid)) < km2) lo = mid;
      else hi = mid;
    }
    const p = this.site.proj;
    return clip(hi).map(([x, z]) => [p.lon0 + x / p.kx, p.lat0 - z / p.ky] as LL);
  }

  private densify(ring: [number, number][], step: number) {
    const out: [number, number][] = [];
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, z0] = ring[i];
      const [x1, z1] = ring[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step));
      for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
    }
    out.push(ring[ring.length - 1]);
    return out;
  }

  /** a flat strip that follows the ground; its index count can be animated */
  private ribbon(pts: [number, number][], width: number, color: string) {
    const pos = new Float32Array(pts.length * 2 * 3);
    const idx: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false }));
    m.userData.pts = pts;
    m.userData.width = width;
    m.renderOrder = 3;
    return m;
  }

  private placeRibbon(m: THREE.Mesh, lift = 0.03) {
    const pts = m.userData.pts as [number, number][];
    const w = (m.userData.width as number) / 2;
    const p = (m.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const [nx, nz] = pts[Math.min(i + 1, pts.length - 1)];
      const [px, pz] = pts[Math.max(i - 1, 0)];
      let tx = nx - px;
      let tz = nz - pz;
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      const h = this.site.heightAt(x, z) + lift;
      p.set([x - tz * w, h, z + tx * w, x + tz * w, h, z - tx * w], i * 6);
    }
    m.geometry.attributes.position.needsUpdate = true;
    m.geometry.computeBoundingSphere();
  }

  private inHub(x: number, z: number) {
    return pointInRing(x, z, this.site.hubXZ);
  }

  /** a point inside the hub, offset from its centre */
  private hubPoint(dx: number, dz: number): [number, number] {
    const [cx, cz] = ringCentroid(this.site.hubXZ);
    for (let k = 1; k >= 0; k -= 0.1) {
      const x = cx + dx * k;
      const z = cz + dz * k;
      if (this.inHub(x, z)) return [x, z];
    }
    return [cx, cz];
  }

  private addLabel(key: Fx, xz: [number, number], lift: number, cls: string, html: string) {
    const el = document.createElement('div');
    el.className = `label3d fx ${cls}`;
    el.innerHTML = html;
    el.style.display = 'none';
    this.site.labelLayer.appendChild(el);
    const l: FxLabel = { key, el, pos: new THREE.Vector3(), xz, lift };
    this.labels.push(l);
    return l;
  }

  private buildLabels() {
    const s = this.site;
    this.addLabel('manila', this.manilaEnd, 0.35, 'fx-manila', '');
    const pts: [number, number][] = [this.hubPoint(-2.2, 0.9), this.hubPoint(0.2, -0.2), this.hubPoint(2.2, -1.0)];
    (['chip', 'factory', 'mineral'] as const).forEach((ic, i) => this.addLabel('icons', pts[i], 0.55, `fx-icon bob${i}`, ICONS[ic]));
    this.addLabel('icons', this.hubPoint(0.2, 1.6), 0.25, 'fx-tag', '');
    this.addLabel('lease', this.hubPoint(0, 0), 0.45, 'fx-lease', '');
    const qs: [number, number][] = [this.hubPoint(-2.0, 0.6), this.hubPoint(0.4, -0.4), this.hubPoint(2.3, -1.1)];
    qs.forEach((p) => this.addLabel('unknowns', p, 0.45, 'fx-unknown', ''));
    const a = this.hectare.anchors();
    this.addLabel('hectare', a.south, 0.002, 'fx-side', '');
    this.addLabel('hectare', a.east, 0.002, 'fx-side', '');
    this.addLabel('court', a.court, 0.004, 'fx-court', '');
    this.addLabel('grid', a.centre, 0.6, 'fx-onehectare', '');
    this.addLabel('power', this.hubPoint(0.2, -0.4), 0.55, 'fx-power', '');
    const [sw, se] = [this.solarSquares[1][3], this.solarSquares[1][2]];
    this.addLabel('solar', s.proj.xz([(sw[0] + se[0]) / 2, sw[1]]), 0.35, 'fx-solar', '');
    const rp = this.reservoirParts[1].map((q) => s.proj.xz(q));
    this.addLabel('reservoir', ringCentroid(rp), 0.35, 'fx-reservoir', '');
    this.addLabel('makati', this.hubPoint(0, -0.3), 0.45, 'fx-makati', '');
    this.addLabel('rings', this.ringCentre, 1.6, 'fx-families', '');
    // rivers and farms: label at a point along each named line / the largest farm
    const rivers = s.data.fx?.rivers ?? [];
    const bangot = rivers.find((r) => r.name === 'Bangot River');
    if (bangot) {
      const mid = bangot.coords[Math.floor(bangot.coords.length * 0.55)] as LL;
      this.addLabel('river', s.proj.xz(mid), 0.2, 'fx-river', '');
    }
    const odonnell = rivers.find((r) => r.name === "O'Donnell River");
    if (odonnell) {
      const mid = odonnell.coords[Math.floor(odonnell.coords.length * 0.62)] as LL;
      this.addLabel('river', s.proj.xz(mid), 0.2, 'fx-river odonnell', '');
    }
    const creek = rivers.filter((r) => r.name === 'Sapang Kawayan').sort((a, b) => b.coords.length - a.coords.length)[0];
    if (creek) {
      const mid = creek.coords[Math.floor(creek.coords.length * 0.4)] as LL;
      this.addLabel('river', s.proj.xz(mid), 0.2, 'fx-river creek', '');
    }
    const farms = s.data.fx?.farms ?? [];
    if (farms.length) {
      // label the farmland nearest to Sitio Binyayan
      const bin = s.data.sitios.find((x) => x.name === 'Binyayan')!;
      const [bx, bz] = s.proj.xz(bin.lonlat);
      let best: [number, number] = [bx, bz];
      let bd = Infinity;
      for (const f of farms) {
        const c = ringCentroid(f.coords.map((p) => s.proj.xz(p as LL)));
        const d = Math.hypot(c[0] - bx, c[1] - bz);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      this.addLabel('farms', best, 0.2, 'fx-farms', '');
    }
  }

  setLabels(t: FxLabels) {
    const by = (k: Fx) => this.labels.filter((l) => l.key === k);
    by('manila')[0].el.innerHTML = `<span>${t.manila}</span>`;
    const icons = by('icons');
    icons.slice(0, 3).forEach((l, i) => (l.el.innerHTML = `${[ICONS.chip, ICONS.factory, ICONS.mineral][i]}<span>${t.icons[i]}</span>`));
    icons[3].el.innerHTML = `<span>${t.noDataCentres}</span>`;
    by('lease')[0].el.innerHTML = `${ICONS.key}<span>${t.lease}</span>`;
    by('unknowns').forEach((l, i) => (l.el.innerHTML = `${ICONS.q}<span>${t.unknowns[i]}</span>`));
    by('hectare').forEach((l) => (l.el.innerHTML = `<span>${t.side}</span>`));
    by('court')[0].el.innerHTML = `<span>${t.court}</span>`;
    by('grid')[0].el.innerHTML = `<span>${t.oneHectare}</span>`;
    by('power')[0].el.innerHTML = `${ICONS.bolt}<span>${t.power}</span>`;
    by('solar')[0].el.innerHTML = `${ICONS.sun}<span><b>${t.solar[0]}</b><br>${t.solar[1]}</span>`;
    by('reservoir')[0].el.innerHTML = `${ICONS.drop}<span>${t.reservoir}</span>`;
    this.hectare.setWaterLabels(t.waterDay, t.waterTick);
    by('makati')[0].el.innerHTML = `<span>${t.makati}</span>`;
    by('rings')[0].el.innerHTML = `${ICONS.home}<span>${t.families}</span>`;
    const rl = by('river');
    if (rl[0]) rl[0].el.innerHTML = `${ICONS.drop}<span>${t.river}</span>`;
    for (const l of rl.slice(1)) l.el.innerHTML = `<span>${l.el.classList.contains('odonnell') ? t.odonnell : t.creek}</span>`;
    const fl = by('farms')[0];
    if (fl) fl.el.innerHTML = `<span>${t.farms}</span>`;
  }

  set(list: Fx[], instant: boolean) {
    const next = new Set(list);
    const was = this.active;
    this.active = next;
    if (next.has('nccDraw') && !was.has('nccDraw')) this.nccProgress = instant || this.lite ? 1 : 0;
    if (next.has('manila') && !was.has('manila')) this.manilaProgress = instant || this.lite ? 1 : 0;
    this.nccRibbon.visible = next.has('nccDraw');
    this.manilaGroup.visible = next.has('manila');
    this.makatiMesh.visible = next.has('makati');
    this.rings.forEach((r) => (r.visible = next.has('rings')));
    this.hectare.set(
      {
        plot: next.has('hectare') || next.has('homes') || next.has('grid') || next.has('water'),
        court: next.has('court'),
        homes: next.has('homes'),
        grid: next.has('grid'),
        water: next.has('water'),
      },
      instant,
    );
    this.applyProgress();
  }

  has(k: Fx) {
    return this.active.has(k);
  }

  private applyProgress() {
    const nccIdx = this.nccRibbon.geometry.index!.count;
    this.nccRibbon.geometry.setDrawRange(0, Math.floor((nccIdx * this.nccProgress) / 6) * 6);
    const ml = this.manilaGroup.children[0] as THREE.Mesh;
    const mIdx = ml.geometry.index!.count;
    ml.geometry.setDrawRange(0, Math.floor((mIdx * this.manilaProgress) / 6) * 6);
    this.manilaGroup.children[1].visible = this.manilaProgress > 0.98;
  }

  /** re-sample heights after the terrain changes */
  place() {
    this.placeRibbon(this.nccRibbon, 0.04);
    this.placeRibbon(this.manilaGroup.children[0] as THREE.Mesh, 0.06);
    const head = this.manilaGroup.children[1];
    const [ex, ez] = this.manilaEnd;
    head.position.set(ex, this.site.heightAt(ex, ez) + 0.25, ez);
    const [hx, hz] = ringCentroid(this.site.hubXZ);
    this.makatiMesh.position.set(hx, this.site.heightAt(hx, hz) + 0.006, hz);
    const [rx, rz] = this.ringCentre;
    this.rings.forEach((r) => r.position.set(rx, this.site.heightAt(rx, rz) + 0.05, rz));
    this.hectare.place();
    for (const l of this.labels) l.pos.set(l.xz[0], this.site.heightAt(l.xz[0], l.xz[1]) + l.lift, l.xz[1]);
  }

  /** returns true while something is moving */
  update(dt: number) {
    this.t += dt;
    let moving = false;
    if (this.active.has('nccDraw') && this.nccProgress < 1) {
      this.nccProgress = Math.min(1, this.nccProgress + dt / 2.2);
      moving = true;
    }
    if (this.active.has('manila') && this.manilaProgress < 1) {
      this.manilaProgress = Math.min(1, this.manilaProgress + dt / 1.4);
      moving = true;
    }
    if (moving) this.applyProgress();
    if (this.hectare.update(dt)) moving = true;
    if (this.active.has('rings')) {
      this.rings.forEach((r, i) => {
        const ph = this.lite ? 0.35 + i * 0.25 : (this.t * 0.45 + i / 3) % 1;
        const s = 0.15 + ph * 0.95;
        r.scale.setScalar(s);
        (r.material as THREE.MeshBasicMaterial).opacity = this.lite ? 0.5 : 0.8 * (1 - ph);
      });
      if (!this.lite) moving = true;
    }
    if ((this.active.has('unknowns') || this.active.has('power')) && !this.lite) moving = true; // the wall pulses
    return moving;
  }

  /** pulse factor for the boundary wall (1 = normal) */
  wallPulse() {
    if (this.lite) return 1;
    if (this.active.has('unknowns')) return 0.55 + 0.45 * Math.sin(this.t * 3.2);
    if (this.active.has('power')) return 1.1 + 0.45 * Math.sin(this.t * 4.2);
    return 1;
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    this.hectare.updateLabels(camera, w, h);
    const v = new THREE.Vector3();
    for (const l of this.labels) {
      if (!this.active.has(l.key)) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      if (l.key === 'manila' && this.manilaProgress < 0.98) {
        l.el.style.display = 'none';
        continue;
      }
      v.copy(l.pos).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      l.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  hideLabels() {
    for (const l of this.labels) l.el.style.display = 'none';
    this.hectare.hideLabels();
  }

  /** extra drawings on the ground overlay */
  drawOverlay(ctx: CanvasRenderingContext2D, px: (p: LL) => readonly [number, number]) {
    const s = this.site;
    const poly = (ring: LL[]) => {
      ctx.beginPath();
      ring.forEach((p, i) => {
        const [x, y] = px(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };
    if (this.active.has('solar')) {
      // illustrative only: the analysis's 20,000 ha as a light dashed square, the benchmark estimate as solid panels
      const [bench, analysis] = this.solarSquares;
      poly(analysis);
      ctx.fillStyle = 'rgba(30, 60, 105, 0.42)';
      ctx.fill();
      ctx.setLineDash([18, 12]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(160, 200, 255, 0.95)';
      ctx.stroke();
      ctx.setLineDash([]);
      poly(bench);
      ctx.save();
      ctx.fillStyle = 'rgba(18, 44, 82, 0.88)';
      ctx.fill();
      ctx.clip();
      const [x0, y0] = px(bench[0]);
      const [x1, y1] = px(bench[2]);
      ctx.strokeStyle = 'rgba(120, 175, 240, 0.32)';
      ctx.lineWidth = 1;
      for (let y = y0; y < y1; y += 3) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(10, 20, 40, 0.55)';
      ctx.lineWidth = 2;
      for (let x = x0; x < x1; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1);
        ctx.stroke();
      }
      ctx.restore();
      poly(bench);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8fc0ff';
      ctx.stroke();
    }
    if (this.active.has('reservoir')) {
      const [big, small] = [this.reservoirParts[1], this.reservoirParts[0]];
      poly(big);
      ctx.fillStyle = 'rgba(70, 160, 255, 0.38)';
      ctx.fill();
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(150, 205, 255, 0.95)';
      ctx.stroke();
      ctx.setLineDash([]);
      poly(small);
      ctx.fillStyle = 'rgba(40, 130, 240, 0.7)';
      ctx.fill();
    }
    if (this.active.has('farms')) {
      ctx.fillStyle = 'rgba(214, 232, 90, 0.38)';
      ctx.strokeStyle = 'rgba(234, 245, 140, 0.9)';
      ctx.lineWidth = 2;
      for (const f of s.data.fx?.farms ?? []) {
        ctx.beginPath();
        f.coords.forEach((p, i) => {
          const [x, y] = px(p as LL);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    if (this.active.has('river')) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const r of s.data.fx?.rivers ?? []) {
        ctx.beginPath();
        r.coords.forEach((p, i) => {
          const [x, y] = px(p as LL);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(10, 40, 80, 0.6)';
        ctx.lineWidth = r.kind === 'river' ? 9 : 6;
        ctx.stroke();
        ctx.strokeStyle = r.kind === 'river' ? '#5fb7ff' : '#8fd0ff';
        ctx.lineWidth = r.kind === 'river' ? 5 : 3;
        ctx.stroke();
      }
    }
  }

  overlayKey() {
    return ['farms', 'river', 'grid', 'solar', 'reservoir'].filter((k) => this.active.has(k as Fx)).join(',');
  }
}
