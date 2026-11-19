import * as THREE from 'three';
import type { SiteScene } from './site';
import type { HectareFx } from './hectare';
import { DAYS_MONTH, DAYS_WEEK, JUG_H_M, JUG_L, JUG_W_M, JUGS_PER_ROW_HA, WATER_MLD, jugsOf, jugStackM, jugStackPerDay } from '../content/power';

/**
 * The zone's daily water as 5-gallon jugs, stacked on the one-hectare square.
 *
 * A short film: the square, then one jug up close, a row of 10, a block of 100, a patch of 10,000, then a day
 * (millions) and a month, each step faster than the one before while the camera pulls back. Every jug is drawn as
 * its own little 3D jug, never a block. A screen can't show millions of real-size jugs one by one, so as the camera
 * pulls back each jug drawn stands for more real ones, and the label says so: true size, then 1 drawn jug =
 * 1,000 jugs (10 × 10 × 10), then ≈ 50,653 (37 × 37 × 37). The stack's height stays true at every step.
 */

export interface JugLabels {
  area: string;
  /** "1 jug · 18.9 liters", "10,000 jugs · 189,000 liters" */
  few: (n: number, liters: number) => string;
  /** "Day 1 · 4.8 million jugs · 17 m tall" */
  day: (day: number, jugs: number, meters: number) => string;
  /** what one drawn jug stands for: true size, 1,000 jugs, ≈ 50,653 jugs */
  scale: [string, string, string];
  tick: (days: number, meters: number) => string;
}

/** a drawn jug k real jugs wide stands for k³ real jugs; 370 real jugs to a row, so k divides 370 */
const LEVELS = [
  { k: 1, cap: 100 * 100 },
  { k: 10, cap: 0 },
  { k: 37, cap: 0 },
] as const;

/** seconds from the start of each part: the square; flying in; one jug; a row; 100; 10,000; a day; a month */
const T = { fly: 1.3, one: 2.6, row: 3.6, hundred: 5.6, tenK: 7.0, day: 8.6, month: 10.5, end: 13.0 };

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** a 5-gallon jug, in metres: base band, body with two ridges, shoulders, neck and cap (vertex colours) */
function jugGeometry() {
  const prof: [number, number][] = [
    [0, 0],
    [0.122, 0],
    [0.135, 0.018],
    [0.135, 0.33],
    [0.118, 0.385],
    [0.06, 0.425],
    [0.034, 0.44],
    [0.034, 0.462],
    [0.041, 0.462],
    [0.041, 0.49],
    [0, 0.49],
  ];
  // indexed, so the normals are shared and the body shades smooth
  const g = new THREE.LatheGeometry(
    prof.map(([r, y]) => new THREE.Vector2(r, y)),
    14,
  );
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0.455) c.set('#1d4fc4'); // cap
    else if (y < 0.06) c.set('#2f73d6'); // base band
    else if ((y > 0.16 && y < 0.19) || (y > 0.26 && y < 0.29)) c.set('#d8efff'); // ridges
    else c.set('#9ccff7'); // clear blue body
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class JugFx {
  readonly group = new THREE.Group();
  private meshes: THREE.InstancedMesh[] = [];
  private mats: THREE.MeshLambertMaterial[] = [];
  /** -1: waiting for the camera; then seconds into the film */
  private clock = -1;
  private on = false;
  private rate = WATER_MLD.high;
  private rateShown = WATER_MLD.high;
  /** set when the month starts: the engine then flies out to the whole tower */
  cue = false;
  private counter: HTMLDivElement;
  private ticks: { el: HTMLDivElement; day: number }[] = [];
  private t: JugLabels | null = null;
  private v = new THREE.Vector3();
  lite = false;

  constructor(
    site: SiteScene,
    private hectare: HectareFx,
  ) {
    const geo = jugGeometry();
    const caps = this.capacities();
    LEVELS.forEach((lv, i) => {
      const mat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#0b2c52', emissiveIntensity: 0.3 });
      const mesh = new THREE.InstancedMesh(geo, mat, caps[i]);
      mesh.count = 0;
      mesh.frustumCulled = false;
      const m = new THREE.Matrix4();
      const per = JUGS_PER_ROW_HA / lv.k;
      for (let n = 0; n < caps[i]; n++) {
        const [r, c, layer] = i === 0 ? patchCell(n) : towerCell(n, per);
        // the corner nearest the camera is (0, 0); rows go north, columns west, layers up
        m.makeScale(lv.k, lv.k, lv.k);
        m.setPosition(-(c + 0.5) * JUG_W_M * lv.k, layer * JUG_H_M * lv.k, -(r + 0.5) * JUG_W_M * lv.k);
        mesh.setMatrixAt(n, m);
      }
      this.meshes.push(mesh);
      this.mats.push(mat);
      this.group.add(mesh);
    });
    this.group.scale.setScalar(0.001); // metres → km
    this.group.visible = false;
    site.scene.add(this.group);

    this.counter = document.createElement('div');
    this.counter.className = 'label3d fx jug-counter';
    this.counter.style.display = 'none';
    site.labelLayer.appendChild(this.counter);
    for (const day of [1, DAYS_WEEK, DAYS_MONTH]) {
      const el = document.createElement('div');
      el.className = 'label3d fx fx-watertick';
      el.style.display = 'none';
      site.labelLayer.appendChild(el);
      this.ticks.push({ el, day });
    }
  }

  /** instances each level needs at the largest daily amount */
  private capacities() {
    const top = jugsOf(Math.max(...Object.values(WATER_MLD)));
    return [LEVELS[0].cap, Math.ceil(top / 1000) + 50, Math.ceil((top * DAYS_MONTH) / 37 ** 3) + 20];
  }

  /** the month's tower at the largest amount, in km: the far camera frames this so the amounts compare by height */
  get monthKm() {
    return (jugStackPerDay(Math.max(...Object.values(WATER_MLD))) * DAYS_MONTH) / 1000;
  }

  /** the near corner of the square, on the level pad (scene km) */
  private corner() {
    const h = this.hectare;
    return new THREE.Vector3(h.x0 + 0.1, h.baseY, h.z0 + 0.1);
  }

  setLabels(t: JugLabels) {
    this.t = t;
  }

  setRate(mld: number) {
    this.rate = mld;
    if (!this.on) this.rateShown = mld;
  }

  setVisible(on: boolean, instant: boolean) {
    if (on && !this.on) {
      this.clock = instant || this.lite ? T.end : -1;
      this.cue = false;
      this.rateShown = this.rate;
    }
    this.on = on;
    this.group.visible = on;
    this.place();
  }

  /** the film is still running (the engine follows `scriptCamera` until the month starts) */
  get playing() {
    return this.on && this.clock < T.end;
  }

  /** before the film starts, and once it has ended, the camera rests on these */
  restingView(phone: boolean) {
    if (this.on && this.clock < T.fly) return this.areaView(phone);
    return null;
  }

  private areaView(phone: boolean) {
    const h = this.hectare;
    const target = new THREE.Vector3(h.cx, h.baseY, h.cz);
    return { target, position: target.clone().add(new THREE.Vector3(2.6, 6.2, 6.0).normalize().multiplyScalar(phone ? 0.3 : 0.24)) };
  }

  /** the camera for the film's close part (from the square to the first day); null otherwise */
  scriptCamera(phone: boolean) {
    if (!this.on || this.clock < T.fly || this.clock >= T.month) return null;
    const C = this.corner();
    const m = (x: number, y: number, z: number) => C.clone().add(new THREE.Vector3(x / 1000, y / 1000, z / 1000));
    const h = this.hectare;
    const dirArea = new THREE.Vector3(2.6, 6.2, 6.0).normalize();
    const dirNear = new THREE.Vector3(0.62, 0.3, 0.78).normalize();
    const dirFar = new THREE.Vector3(0.62, 0.36, 0.78).normalize();
    const area = this.areaView(phone);
    const day1 = jugStackPerDay(this.rateShown);
    const keys: { t: number; target: THREE.Vector3; dist: number; dir: THREE.Vector3 }[] = [
      { t: T.fly, target: area.target, dist: phone ? 0.3 : 0.24, dir: dirArea },
      // phones aim a little higher, so the jug and its label sit in the open part above the card
      { t: T.one, target: m(-0.135, phone ? 0.36 : 0.26, -0.135), dist: phone ? 0.003 : 0.0021, dir: dirNear },
      { t: T.row, target: m(-0.135, phone ? 0.36 : 0.26, -0.135), dist: phone ? 0.003 : 0.0021, dir: dirNear },
      { t: T.hundred, target: m(-1.35, 0.3, -0.135), dist: phone ? 0.0062 : 0.0045, dir: dirNear },
      { t: T.tenK, target: m(-1.35, 0.3, -1.35), dist: phone ? 0.01 : 0.0078, dir: dirNear },
      { t: T.day, target: m(-13.5, 1, -13.5), dist: phone ? 0.058 : 0.045, dir: dirNear },
      { t: T.month, target: new THREE.Vector3(h.cx, h.baseY + day1 / 2000, h.cz), dist: phone ? 0.36 : 0.27, dir: dirFar },
    ];
    let i = 0;
    while (i < keys.length - 2 && this.clock >= keys[i + 1].t) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const s = smooth((this.clock - a.t) / (b.t - a.t));
    const target = a.target.clone().lerp(b.target, s);
    const dist = Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * s);
    const dir = a.dir.clone().lerp(b.dir, s).normalize();
    return { target, position: target.clone().addScaledVector(dir, dist) };
  }

  /** real jugs on the square at this point of the film */
  private count() {
    const t = this.clock;
    const day = jugsOf(this.rateShown);
    const p = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
    if (t < T.one) return 0;
    if (t < T.row) return 1;
    if (t < T.hundred) return 1 + Math.floor(9 * p(T.row, T.hundred - 0.2) + 1e-9); // one by one
    if (t < T.tenK) return Math.round(10 * Math.pow(10, p(T.hundred, T.tenK - 0.1)));
    if (t < T.day) return Math.round(100 * Math.pow(100, p(T.tenK, T.day - 0.1)));
    if (t < T.month) return 1e4 * Math.pow(day / 1e4, p(T.day, T.month - 0.1));
    return day * Math.pow(DAYS_MONTH, p(T.month, T.end - 0.1)); // from 1 day to a month, faster and faster
  }

  /** which level of drawn jugs shows, and how much (0..1), for the cross-fades between them */
  private levelWeights(): [number, number, number] {
    const t = this.clock;
    const f = (a: number) => smooth((t - a) / 0.5);
    const w1 = t < T.day ? 1 : 1 - f(T.day);
    const w2 = t < T.day ? 0 : t < T.month ? f(T.day) : 1 - f(T.month);
    const w3 = t < T.month ? 0 : f(T.month);
    return [w1, w2, w3];
  }

  place() {
    if (!this.on) return;
    this.group.position.copy(this.corner());
    const n = this.count();
    const w = this.levelWeights();
    LEVELS.forEach((lv, i) => {
      const mesh = this.meshes[i];
      const mat = this.mats[i];
      const per = lv.k ** 3;
      mesh.count = w[i] > 0 ? Math.min(mesh.instanceMatrix.count, Math.floor(n / per + 1e-9)) : 0;
      mesh.visible = w[i] > 0.001 && mesh.count > 0;
      const fading = w[i] < 0.999;
      if (mat.transparent !== fading) {
        mat.transparent = fading;
        mat.needsUpdate = true;
      }
      mat.opacity = w[i];
    });
  }

  /** returns true while animating */
  update(dt: number, cameraBusy: boolean) {
    if (!this.on) return false;
    let moving = false;
    if (Math.abs(this.rateShown - this.rate) > 0.01) {
      this.rateShown += (this.rate - this.rateShown) * Math.min(1, dt * 4);
      if (Math.abs(this.rateShown - this.rate) < 0.05) this.rateShown = this.rate;
      moving = true;
    }
    if (this.clock < 0) {
      // wait for the camera to arrive over the square
      if (!cameraBusy) this.clock = 0;
      moving = true;
    } else if (this.clock < T.end) {
      const before = this.clock;
      this.clock = Math.min(T.end, this.clock + dt);
      if (before < T.month && this.clock >= T.month) this.cue = true;
      moving = true;
    }
    if (moving) this.place();
    return moving;
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    const t = this.t;
    if (!this.on || !t || this.clock < 0) {
      this.hideLabels();
      return;
    }
    const C = this.corner();
    const n = this.count();
    const lvl = this.clock < T.day ? 0 : this.clock < T.month ? 1 : 2;
    // the counter: over the square at first, then over the newest jugs, then over the tower
    let text: string;
    let anchor: THREE.Vector3;
    if (this.clock < T.one) {
      text = `<b>${t.area}</b>`;
      anchor = new THREE.Vector3(this.hectare.cx, this.hectare.baseY + 0.02, this.hectare.cz);
    } else {
      const perDay = jugsOf(this.rateShown);
      const days = n / perDay;
      const stackKm = (jugStackPerDay(this.rateShown) * Math.max(days, 0)) / 1000;
      // jugs and liters while the first day piles up; then the day count and the stack's height
      const d = Math.max(1, Math.round(days));
      const main = days < 0.999 ? t.few(n, n * JUG_L) : t.day(d, n, jugStackM(this.rateShown, d));
      text = `<b>${main}</b><small>${t.scale[lvl]}</small>`;
      const k = LEVELS[lvl].k;
      const drawn = n / k ** 3;
      const perRow = JUGS_PER_ROW_HA / k;
      if (lvl === 0 || drawn < perRow * perRow) {
        // over the jugs placed so far (a row, then a patch spreading from the corner), just above their tops
        const side = lvl === 0 && n <= 10 ? 1 : Math.ceil(Math.sqrt(Math.max(1, drawn)));
        const along = lvl === 0 && n <= 10 ? n : side;
        const cell = JUG_W_M * k;
        anchor = C.clone().add(new THREE.Vector3((-along * cell) / 2000, (JUG_H_M * k + 0.1 + side * cell * 0.04) / 1000, (-side * cell) / 2000));
      } else anchor = new THREE.Vector3(this.hectare.cx, this.hectare.baseY + stackKm + 0.006, this.hectare.cz);
    }
    if (this.counter.dataset.text !== text) {
      this.counter.dataset.text = text;
      this.counter.innerHTML = text;
    }
    this.place2d(this.counter, anchor, camera, w, h, 'translate(-50%, -100%)');
    // day, week and month marks on the tower's near edge, once the month is building
    for (const k of this.ticks) {
      const perDay = jugStackPerDay(this.rateShown) / 1000;
      const on = lvl === 2 && n >= jugsOf(this.rateShown) * k.day - 1;
      if (!on) {
        k.el.style.display = 'none';
        continue;
      }
      const html = `<span>${t.tick(k.day, jugStackM(this.rateShown, k.day))}</span>`;
      if (k.el.dataset.text !== html) {
        k.el.dataset.text = html;
        k.el.innerHTML = html;
      }
      this.place2d(k.el, C.clone().add(new THREE.Vector3(0.004, perDay * k.day, 0)), camera, w, h, 'translate(0, -50%)');
    }
  }

  private place2d(el: HTMLElement, p: THREE.Vector3, camera: THREE.Camera, w: number, h: number, anchor: string) {
    const v = this.v.copy(p).project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px) ${anchor}`;
  }

  hideLabels() {
    this.counter.style.display = 'none';
    for (const k of this.ticks) k.el.style.display = 'none';
  }
}

/**
 * Real-size jugs, in the order they are set down: a row of 10 from the corner, then rows behind it to a block of
 * 10 × 10, then the block grows square by square to 100 × 100.
 */
function patchCell(n: number): [number, number, number] {
  if (n < 100) return [Math.floor(n / 10), n % 10, 0];
  // squares 11 × 11 … 100 × 100: each adds a new row and column
  let s = 11;
  let start = 100;
  while (start + (2 * s - 1) <= n) {
    start += 2 * s - 1;
    s++;
  }
  const i = n - start;
  return i < s ? [s - 1, i, 0] : [i - s, s - 1, 0];
}

/** drawn jugs on the whole square: layer by layer, each layer spreading out from the near corner */
function towerCell(n: number, per: number): [number, number, number] {
  const perLayer = per * per;
  const layer = Math.floor(n / perLayer);
  let i = n % perLayer;
  // square shells from the corner: shell s holds 2s + 1 cells
  let s = 0;
  while (i >= 2 * s + 1) {
    i -= 2 * s + 1;
    s++;
  }
  return i <= s ? [s, i, layer] : [i - s - 1, s, layer];
}
