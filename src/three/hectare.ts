import * as THREE from 'three';
import { pointInRing, ringCentroid } from './geo';
import type { SiteScene } from './site';
import { DAYS_MONTH, DAYS_WEEK, HOME_LOTS, WATER_MLD, depthPerDay, type HomeKey } from '../content/story';
import { buildHouse, facadeTexture, roofTexture } from './houses';

/**
 * "How big is one hectare?" — a real 100 m × 100 m square on the site, filled with homes of a chosen size,
 * a basketball court for scale, and a grid of one-hectare squares across the whole hub for the zoom-out.
 * Scene units are kilometres, so 1 hectare = 0.1 × 0.1.
 */

export type { HomeKey };

/** How each home size is laid out. The number of homes is HOME_LOTS[k].perHectare (10,000 ÷ lot size, rounded down). */
interface HomeLayout {
  /** lots laid out rows × cols across the square; spare lots stay as open space */
  rows: number;
  cols: number;
  lawn: string;
}

const HOMES: Record<HomeKey, HomeLayout> = {
  regular: { rows: 12, cols: 13, lawn: '#bdb3a0' },
  medium: { rows: 12, cols: 7, lawn: '#86a86a' },
  large: { rows: 6, cols: 6, lawn: '#6fa25a' },
  mansion: { rows: 5, cols: 2, lawn: '#67a052' },
};

const SIDE = 0.1; // km
const COURT: [number, number] = [0.028, 0.015]; // FIBA court, 28 × 15 m
// pastel walls and painted corrugated-iron roofs, as on many Filipino houses
const WALLS = ['#f4f0e6', '#f1e3c4', '#dbe8f0', '#f4dccd', '#e0ecd2', '#f7e9b6', '#ece6f2', '#ffffff'];
const ROOFS = ['#b23a2a', '#8c2f28', '#2f5f8f', '#9aa0a6', '#a65d29', '#2f6b4f', '#5b6168', '#3b4d8a'];
const MAX = 160;
const SHADOW_HALF = 0.3; // km: the sun's shadow box around the square
// in the close-up the sun comes from the south-west, so the house fronts facing the camera are lit
const CLOSE_SUN = new THREE.Vector3(-0.35, 1, 0.8).normalize();

export class HectareFx {
  /** south-west corner and centre of the square (scene x/z, km) */
  readonly x0: number;
  readonly z0: number;
  readonly cx: number;
  readonly cz: number;
  readonly group = new THREE.Group();
  private plot: THREE.Mesh;
  private plotMat: THREE.MeshBasicMaterial;
  private frame: THREE.Mesh;
  private court: THREE.Mesh;
  private beacon: THREE.Mesh;
  /** a level, graded pad the homes stand on (top at padTop) */
  private ground: THREE.Mesh;
  private padTop = 0;
  private sunDir = new THREE.Vector3();
  private lots: THREE.InstancedMesh;
  private walls: THREE.InstancedMesh;
  private roofs: THREE.InstancedMesh;
  private details: THREE.InstancedMesh;
  private treeTops: THREE.InstancedMesh;
  private trunks: THREE.InstancedMesh;
  private trees: { x: number; z: number; s: number; h: number; a: number }[] = [];
  /** a month of the zone's water, poured on the square: rises one day at a time */
  private water: THREE.Group;
  private waterSides: THREE.Mesh;
  private waterTop: THREE.Mesh;
  private waterTex: THREE.CanvasTexture;
  private days = 0;
  /** seconds to wait before the water starts rising (lets the camera arrive first) */
  private waterWait = 0;
  private waterLabels: { el: HTMLDivElement; day: number; pos: THREE.Vector3 }[] = [];
  private waterDayText: (day: number, meters: number, mld: number) => string = (d, m) => `${d} · ${m} m`;
  private waterTickText: (days: number, meters: number) => string = (d, m) => `${d} · ${m} m`;
  /** liters a day (millions) being shown, and the value the column is easing towards */
  private rate = WATER_MLD.high;
  private rateShown = WATER_MLD.high;

  /** the tallest scenario's month of water, in km: the camera frames this so the scenarios compare by height */
  get waterMonthKm() {
    return (depthPerDay(Math.max(...Object.values(WATER_MLD))) * DAYS_MONTH) / 1000;
  }
  private grid: THREE.LineSegments;
  private gridMat: THREE.ShaderMaterial;
  private home: HomeKey = 'regular';
  private builtHome: HomeKey | null = null;
  private grow = 1;
  private reveal = 0;
  private placedFlat = -1;
  private gridPlacedFlat = -1;
  private houseCells: { x: number; z: number; delay: number; i: number }[] = [];
  private liteMode = false;
  show = { plot: false, court: false, homes: false, grid: false, water: false };

  get lite() {
    return this.liteMode;
  }

  set lite(v: boolean) {
    if (v === this.liteMode) return;
    this.liteMode = v;
    this.buildTrees();
    this.apply();
    this.place(true);
  }

  constructor(private site: SiteScene) {
    const [x0, z0] = this.pickSpot();
    this.x0 = x0;
    this.z0 = z0;
    this.cx = x0 + SIDE / 2;
    this.cz = z0 + SIDE / 2;

    // the square itself, following the ground
    const pg = new THREE.PlaneGeometry(SIDE, SIDE, 10, 10);
    pg.rotateX(-Math.PI / 2);
    this.plotMat = new THREE.MeshBasicMaterial({ color: '#ffd34d', transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    this.plot = new THREE.Mesh(pg, this.plotMat);
    this.plot.renderOrder = 5;

    // its border: a strip 1.6 m wide, raised slightly
    const pts: [number, number][] = [];
    const corners: [number, number][] = [
      [x0, z0],
      [x0 + SIDE, z0],
      [x0 + SIDE, z0 + SIDE],
      [x0, z0 + SIDE],
      [x0, z0],
    ];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i];
      const [bx, bz] = corners[i + 1];
      for (let k = 0; k < 10; k++) pts.push([ax + ((bx - ax) * k) / 10, az + ((bz - az) * k) / 10]);
    }
    pts.push(corners[4]);
    this.frame = this.strip(pts, 0.0016, '#ffd34d');

    // one basketball court for scale
    const cg = new THREE.PlaneGeometry(COURT[0], COURT[1]);
    cg.rotateX(-Math.PI / 2);
    this.court = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: courtTexture(), transparent: true, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }));
    this.court.renderOrder = 6;

    // a tall marker so the square can still be found when zoomed out
    const bg = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 12, 1, true);
    bg.translate(0, 0.275, 0);
    this.beacon = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: '#ffd34d', transparent: true, opacity: 0.85, depthWrite: false }));

    // homes: concrete under the lots (the gaps read as lanes), the lots, and three instanced house parts
    const padG = new THREE.BoxGeometry(SIDE + 0.003, 1, SIDE + 0.003);
    padG.translate(0, -0.5, 0);
    this.ground = new THREE.Mesh(padG, new THREE.MeshLambertMaterial({ color: '#b5b0a5' }));
    this.ground.receiveShadow = true;
    const lotG = new THREE.PlaneGeometry(1, 1);
    lotG.rotateX(-Math.PI / 2);
    this.lots = new THREE.InstancedMesh(lotG, new THREE.MeshLambertMaterial({ color: '#ffffff' }), MAX);
    this.lots.receiveShadow = true;
    const empty = new THREE.BufferGeometry();
    this.walls = new THREE.InstancedMesh(empty, new THREE.MeshLambertMaterial({ map: facadeTexture(), side: THREE.DoubleSide }), MAX);
    this.roofs = new THREE.InstancedMesh(empty, new THREE.MeshLambertMaterial({ map: roofTexture(), side: THREE.DoubleSide }), MAX);
    this.details = new THREE.InstancedMesh(empty, new THREE.MeshLambertMaterial({ vertexColors: true }), MAX);
    for (const m of [this.walls, this.roofs, this.details]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }

    // trees around the square, where the satellite image is green
    const top = new THREE.IcosahedronGeometry(2.4, 0);
    top.scale(1, 0.85, 1);
    top.translate(0, 4.4, 0);
    this.treeTops = new THREE.InstancedMesh(top, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), 7000);
    const trunk = new THREE.CylinderGeometry(0.18, 0.28, 3, 5);
    trunk.translate(0, 1.5, 0);
    this.trunks = new THREE.InstancedMesh(trunk, new THREE.MeshLambertMaterial({ color: '#6b4e33' }), 7000);
    for (const m of [this.treeTops, this.trunks]) m.castShadow = true;
    for (const m of [this.lots, this.walls, this.roofs, this.details, this.treeTops, this.trunks]) {
      m.frustumCulled = false;
      m.count = 0;
    }

    // one-hectare grid over the hub, lined up with the square
    this.gridMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uCentre: { value: new THREE.Vector2(this.cx, this.cz) }, uReveal: { value: 0 } },
      vertexShader: `varying vec2 vXZ; void main(){ vXZ = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec2 uCentre; uniform float uReveal; varying vec2 vXZ;
        void main(){ float d = distance(vXZ, uCentre); if (d > uReveal) discard;
          float front = smoothstep(uReveal - 0.5, uReveal, d);
          gl_FragColor = vec4(mix(vec3(1.0), vec3(1.0, 0.83, 0.3), front), 0.42 + 0.45 * front); }`,
    });
    this.grid = new THREE.LineSegments(this.buildGrid(), this.gridMat);
    this.grid.renderOrder = 4;
    this.grid.frustumCulled = false;

    // the water column: open 4-sided "box" (a square cylinder) with one band per day, and a lid
    this.waterTex = dayBandTexture();
    const sides = new THREE.CylinderGeometry(SIDE / Math.SQRT2, SIDE / Math.SQRT2, 1, 4, 1, true);
    sides.rotateY(Math.PI / 4);
    sides.translate(0, 0.5, 0);
    this.waterSides = new THREE.Mesh(
      sides,
      new THREE.MeshLambertMaterial({ color: '#58b4ff', map: this.waterTex, transparent: true, opacity: 0.72, emissive: '#0b3a66', emissiveIntensity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    );
    const lid = new THREE.PlaneGeometry(SIDE, SIDE);
    lid.rotateX(-Math.PI / 2);
    this.waterTop = new THREE.Mesh(lid, new THREE.MeshLambertMaterial({ color: '#7cc6ff', transparent: true, opacity: 0.8, emissive: '#0d4f8a', emissiveIntensity: 0.45, depthWrite: false }));
    this.water = new THREE.Group();
    this.water.add(this.waterSides, this.waterTop);
    this.water.renderOrder = 8;
    this.waterSides.renderOrder = 8;
    this.waterTop.renderOrder = 9;
    for (const day of [0, 1, DAYS_WEEK, DAYS_MONTH]) {
      const el = document.createElement('div');
      el.className = `label3d fx ${day === 0 ? 'fx-waterday' : 'fx-watertick'}`;
      el.style.display = 'none';
      site.labelLayer.appendChild(el);
      this.waterLabels.push({ el, day, pos: new THREE.Vector3() });
    }

    this.group.add(this.plot, this.frame, this.court, this.beacon, this.ground, this.lots, this.walls, this.roofs, this.details, this.treeTops, this.trunks, this.grid, this.water);
    site.scene.add(this.group);

    // the sun casts shadows in a box around the square (only while the close-up is on screen)
    const sun = site.sun;
    this.sunDir.copy(sun.position).sub(sun.target.position).normalize();
    sun.target.position.set(this.cx, site.heightAt(this.cx, this.cz), this.cz);
    site.scene.add(sun.target);
    sun.position.copy(sun.target.position).addScaledVector(this.sunDir, 2.5);
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -SHADOW_HALF;
    cam.right = cam.top = SHADOW_HALF;
    cam.near = 1;
    cam.far = 4;
    cam.updateProjectionMatrix();
    sun.shadow.bias = -0.00012;
    sun.shadow.normalBias = 0.00015;

    this.buildTrees();
    this.apply();
  }

  /** scatter low-poly trees near the square, denser where the satellite image is dark green (tree cover) */
  private buildTrees() {
    const s = this.site;
    const R = 0.42;
    const step = this.liteMode ? 0.012 : 0.0078;
    const img = s.imagery.image as (HTMLImageElement | ImageBitmap) | undefined;
    let sample: ((x: number, z: number) => [number, number, number] | null) | null = null;
    if (img && img.width) {
      const W = img.width;
      const H = img.height;
      const toPx = (x: number, z: number) => [((x + s.halfWidth) / (2 * s.halfWidth)) * W, ((z + s.halfDepth) / (2 * s.halfDepth)) * H];
      const [ax, ay] = toPx(this.cx - R, this.cz - R);
      const [bx, by] = toPx(this.cx + R, this.cz + R);
      const sx = Math.max(0, Math.floor(ax));
      const sy = Math.max(0, Math.floor(ay));
      const sw = Math.min(W - sx, Math.ceil(bx) - sx + 1);
      const sh = Math.min(H - sy, Math.ceil(by) - sy + 1);
      try {
        const cv = document.createElement('canvas');
        cv.width = sw;
        cv.height = sh;
        const ctx = cv.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const data = ctx.getImageData(0, 0, sw, sh).data;
        sample = (x, z) => {
          const [px, py] = toPx(x, z);
          const i = Math.floor(px) - sx;
          const j = Math.floor(py) - sy;
          if (i < 0 || j < 0 || i >= sw || j >= sh) return null;
          const k = (j * sw + i) * 4;
          return [data[k], data[k + 1], data[k + 2]];
        };
      } catch {
        sample = null;
      }
    }
    let seed = 1234567;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const margin = 0.012;
    this.trees = [];
    for (let gx = -R; gx <= R; gx += step) {
      for (let gz = -R; gz <= R; gz += step) {
        const x = this.cx + gx + (rnd() - 0.5) * step * 0.9;
        const z = this.cz + gz + (rnd() - 0.5) * step * 0.9;
        const d = Math.hypot(x - this.cx, z - this.cz);
        if (d > R) continue;
        if (x > this.x0 - margin && x < this.x0 + SIDE + margin && z > this.z0 - margin && z < this.z0 + SIDE + margin) continue;
        let p = 0.3;
        const c = sample?.(x, z);
        if (c) {
          const [r, g, b] = c;
          const bright = (r + g + b) / 765;
          const exg = (2 * g - r - b) / (r + g + b + 1);
          p = Math.min(1, Math.max(0, (0.2 - bright) / 0.075)) * Math.min(1, Math.max(0, (exg - 0.25) / 0.3));
        }
        // thin out towards the edge so the forest fades into the satellite image
        const edge = 1 - Math.max(0, (d - R * 0.7) / (R * 0.3));
        if (rnd() < p * 0.75 * edge) this.trees.push({ x, z, s: 0.7 + rnd() * 0.75, h: 0.8 + rnd() * 0.5, a: rnd() * Math.PI });
        // otherwise, now and then a shrub or small tree on the grassland
        else if (rnd() < (0.16 + p * 0.3) * edge) this.trees.push({ x, z, s: 0.25 + rnd() * 0.3, h: 0.7 + rnd() * 0.4, a: rnd() * Math.PI });
      }
    }
    this.trees = this.trees.slice(0, this.treeTops.instanceMatrix.count);
    const greens = ['#3f7a34', '#4f8a3a', '#356b2c', '#5c9a44', '#47803a', '#2f5f29'];
    const col = new THREE.Color();
    this.trees.forEach((_t, i) => this.treeTops.setColorAt(i, col.set(greens[Math.floor(rnd() * greens.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.06)));
    if (this.treeTops.instanceColor) this.treeTops.instanceColor.needsUpdate = true;
    this.treeTops.count = this.trunks.count = this.trees.length;
  }

  /** the flattest 100 m square near the middle of the hub */
  private pickSpot(): [number, number] {
    const s = this.site;
    const [hx, hz] = ringCentroid(s.hubXZ);
    let best: [number, number] = [hx - SIDE / 2, hz - SIDE / 2];
    let bestScore = Infinity;
    for (let dx = -1.4; dx <= 1.4; dx += 0.1) {
      for (let dz = -1.4; dz <= 1.4; dz += 0.1) {
        const x0 = hx + dx;
        const z0 = hz + dz;
        let lo = Infinity;
        let hi = -Infinity;
        let ok = true;
        for (let i = 0; i <= 4 && ok; i++) {
          for (let j = 0; j <= 4; j++) {
            const x = x0 + (i / 4) * SIDE;
            const z = z0 + (j / 4) * SIDE;
            if (!pointInRing(x, z, s.hubXZ)) {
              ok = false;
              break;
            }
            const h = s.heightAt(x, z);
            lo = Math.min(lo, h);
            hi = Math.max(hi, h);
          }
        }
        if (!ok) continue;
        const score = (hi - lo) * 40 + Math.hypot(dx, dz) * 0.02;
        if (score < bestScore) {
          bestScore = score;
          best = [x0, z0];
        }
      }
    }
    return best;
  }

  private strip(pts: [number, number][], width: number, color: string) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 6), 3));
    const idx: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    m.userData = { pts, width };
    m.renderOrder = 7;
    return m;
  }

  private buildGrid() {
    const s = this.site;
    const xs = s.hubXZ.map((p) => p[0]);
    const zs = s.hubXZ.map((p) => p[1]);
    const iMin = Math.floor((Math.min(...xs) - this.x0) / SIDE);
    const iMax = Math.ceil((Math.max(...xs) - this.x0) / SIDE);
    const jMin = Math.floor((Math.min(...zs) - this.z0) / SIDE);
    const jMax = Math.ceil((Math.max(...zs) - this.z0) / SIDE);
    const segs: number[] = [];
    const SUB = 4;
    const add = (ax: number, az: number, bx: number, bz: number) => {
      for (let k = 0; k < SUB; k++) {
        const x1 = ax + ((bx - ax) * k) / SUB;
        const z1 = az + ((bz - az) * k) / SUB;
        const x2 = ax + ((bx - ax) * (k + 1)) / SUB;
        const z2 = az + ((bz - az) * (k + 1)) / SUB;
        if (pointInRing((x1 + x2) / 2, (z1 + z2) / 2, s.hubXZ)) segs.push(x1, 0, z1, x2, 0, z2);
      }
    };
    for (let i = iMin; i <= iMax; i++) {
      const x = this.x0 + i * SIDE;
      for (let j = jMin; j < jMax; j++) add(x, this.z0 + j * SIDE, x, this.z0 + (j + 1) * SIDE);
    }
    for (let j = jMin; j <= jMax; j++) {
      const z = this.z0 + j * SIDE;
      for (let i = iMin; i < iMax; i++) add(this.x0 + i * SIDE, z, this.x0 + (i + 1) * SIDE, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    return g;
  }

  setHome(k: HomeKey) {
    if (k === this.home) return;
    this.home = k;
    if (this.show.homes) {
      this.buildHomes();
      this.grow = this.lite ? 1 : 0;
      this.placeHomes();
    }
  }

  /** which parts are on; `instant` skips the animations */
  set(show: { plot: boolean; court: boolean; homes: boolean; grid: boolean; water: boolean }, instant: boolean) {
    const was = this.show;
    this.show = show;
    if (show.water && !was.water) {
      this.days = instant ? 30 : 0;
      this.waterWait = instant ? 0 : 2.6;
    }
    if (show.homes && (!was.homes || this.builtHome !== this.home)) {
      this.buildHomes();
      this.grow = instant || this.lite ? 1 : 0;
    }
    if (show.grid && !was.grid) this.reveal = instant || this.lite ? 9 : 0;
    this.apply();
    this.place(true);
  }

  private apply() {
    const { plot, court, homes, grid } = this.show;
    const close = plot && !grid;
    this.plot.visible = plot && !homes;
    this.frame.visible = plot;
    // zoomed out, the square is filled in solid so it stays visible
    this.plotMat.opacity = grid ? 0.95 : 0.22;
    this.court.visible = court;
    this.beacon.visible = grid;
    this.ground.visible = homes;
    for (const m of [this.lots, this.walls, this.roofs, this.details]) m.visible = homes;
    this.treeTops.visible = this.trunks.visible = close;
    this.grid.visible = grid;
    this.gridMat.uniforms.uReveal.value = this.reveal;
    this.water.visible = this.show.water;
    this.placeWater();
  }

  /** true while the one-hectare close-up is on screen (it wants sun shadows) */
  get closeUp() {
    return this.show.plot && !this.show.grid;
  }

  /**
   * Point the sun at a spot. With `half` (km), shadows are cast in a box of that half-size around it,
   * lit from the south-west; without, the sun goes back to its normal direction and shadows are off.
   */
  aimSun(x: number, z: number, half: number | null) {
    const sun = this.site.sun;
    sun.target.position.set(x, this.site.heightAt(x, z), z);
    const shadows = half !== null && !this.liteMode;
    sun.castShadow = shadows;
    this.site.terrain.receiveShadow = shadows;
    if (half !== null) {
      const cam = sun.shadow.camera;
      cam.left = cam.bottom = -half;
      cam.right = cam.top = half;
      cam.far = Math.max(4, half * 6);
      cam.updateProjectionMatrix();
    }
    sun.position.copy(sun.target.position).addScaledVector(half !== null ? CLOSE_SUN : this.sunDir, Math.max(2.5, (half ?? 0) * 4));
  }

  /** the square's centre (scene x/z) */
  get centreXZ(): [number, number] {
    return [this.cx, this.cz];
  }

  private buildHomes() {
    const spec = HOMES[this.home];
    this.builtHome = this.home;
    const total = spec.rows * spec.cols;
    const spare = Math.max(0, total - HOME_LOTS[this.home].perHectare);
    // spread the empty lots out (they read as small parks)
    const empty = new Set<number>();
    for (let k = 0; k < spare; k++) empty.add(Math.floor(((k + 0.5) * total) / spare));
    const lw = SIDE / spec.cols;
    const ld = SIDE / spec.rows;
    const parts = buildHouse(this.home, lw * 1000, ld * 1000);
    for (const [mesh, g] of [
      [this.walls, parts.walls],
      [this.roofs, parts.roofs],
      [this.details, parts.details],
    ] as const) {
      if (mesh.geometry.attributes.position) mesh.geometry.dispose();
      mesh.geometry = g;
    }
    const c = new THREE.Color();
    this.houseCells = [];
    let n = 0;
    for (let r = 0; r < spec.rows; r++) {
      for (let q = 0; q < spec.cols; q++) {
        const idx = r * spec.cols + q;
        const x = this.x0 + (q + 0.5) * lw;
        const z = this.z0 + (r + 0.5) * ld;
        this.lots.setColorAt(idx, c.set(empty.has(idx) ? '#4f8f45' : spec.lawn).offsetHSL(0, 0, ((((idx * 2654435761) >>> 4) % 7) - 3) * 0.006));
        if (empty.has(idx)) continue;
        const delay = ((r + q) / (spec.rows + spec.cols)) * 0.9 + ((idx * 37) % 11) * 0.012;
        this.houseCells.push({ x, z, delay, i: n });
        // a fixed shuffle so neighbouring houses differ without forming stripes
        const mix = (idx * 2654435761) >>> 0;
        const wall = this.home === 'mansion' ? ['#f7f4ec', '#efe6d4', '#ffffff'][(mix >>> 8) % 3] : WALLS[(mix >>> 8) % WALLS.length];
        const roof = this.home === 'mansion' ? ['#4a4f57', '#7a3b2c', '#3b4250'][(mix >>> 16) % 3] : ROOFS[(mix >>> 16) % ROOFS.length];
        this.walls.setColorAt(n, c.set(wall));
        this.roofs.setColorAt(n, c.set(roof));
        n++;
      }
    }
    this.lots.count = total;
    this.walls.count = n;
    this.roofs.count = n;
    this.details.count = n;
    for (const m of [this.lots, this.walls, this.roofs]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  /** re-sample heights after the terrain changes (only for the parts on show) */
  place(force = false) {
    const s = this.site;
    const flatNow = s.flatAmount;
    if (force) this.placedFlat = -1;
    if (this.show.plot && this.placedFlat !== flatNow) {
      this.placedFlat = flatNow;
      // level pad: top just above the highest ground under the square, sides down to the lowest
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i <= 10; i++) {
        for (let j = 0; j <= 10; j++) {
          const h = s.heightAt(this.x0 + (i / 10) * SIDE, this.z0 + (j / 10) * SIDE);
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
      }
      this.padTop = hi + 0.0004;
      this.ground.position.set(this.cx, this.padTop, this.cz);
      this.ground.scale.set(1, this.padTop - lo + 0.003, 1);

      const pp = this.plot.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i) + 0; // geometry is centred; positioned by the mesh
        const z = pp.getZ(i);
        pp.setY(i, s.heightAt(this.cx + x, this.cz + z) + 0.0012);
      }
      pp.needsUpdate = true;
      this.plot.geometry.computeBoundingSphere();
      this.plot.position.set(this.cx, 0, this.cz);
      const { pts, width } = this.frame.userData as { pts: [number, number][]; width: number };
      const fp = (this.frame.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      pts.forEach(([x, z], i) => {
        // offset outward/inward across the edge direction
        const [nx, nz] = pts[Math.min(i + 1, pts.length - 1)];
        const [px, pz] = pts[Math.max(i - 1, 0)];
        let tx = nx - px;
        let tz = nz - pz;
        const l = Math.hypot(tx, tz) || 1;
        tx /= l;
        tz /= l;
        const h = this.show.homes ? this.padTop + 0.0003 : s.heightAt(x, z) + 0.0025;
        const w = width / 2;
        fp.set([x - tz * w, h, z + tx * w, x + tz * w, h, z - tx * w], i * 6);
      });
      this.frame.geometry.attributes.position.needsUpdate = true;
      this.frame.geometry.computeBoundingSphere();
      const ccx = this.cx + 0.012;
      const ccz = this.cz - 0.026;
      this.court.position.set(ccx, s.heightAt(ccx, ccz) + 0.0018, ccz);
      this.beacon.position.set(this.cx, s.heightAt(this.cx, this.cz), this.cz);
      this.placeTrees();
    }
    if (this.show.homes) this.placeHomes();
    if (this.show.grid && this.gridPlacedFlat !== flatNow) {
      this.gridPlacedFlat = flatNow;
      const gp = this.grid.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < gp.count; i++) gp.setY(i, s.heightAt(gp.getX(i), gp.getZ(i)) + 0.005);
      gp.needsUpdate = true;
    }
  }

  private placeHomes() {
    const spec = HOMES[this.home];
    const lw = SIDE / spec.cols;
    const ld = SIDE / spec.rows;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const x = this.x0 + (c + 0.5) * lw;
        const z = this.z0 + (r + 0.5) * ld;
        m.compose(v.set(x, this.padTop + 0.00012, z), q, sc.set(lw - 0.0012, 1, ld - 0.0012));
        this.lots.setMatrixAt(r * spec.cols + c, m);
      }
    }
    // houses are modelled in metres: scale to km, and grow upwards when they appear
    for (const cell of this.houseCells) {
      const g = Math.min(1, Math.max(0, (this.grow * 1.9 - cell.delay) / 0.45));
      const e = Math.max(0.001, g * g * (3 - 2 * g));
      m.compose(v.set(cell.x, this.padTop + 0.00012, cell.z), q, sc.set(0.001, 0.001 * e, 0.001));
      this.walls.setMatrixAt(cell.i, m);
      this.roofs.setMatrixAt(cell.i, m);
      this.details.setMatrixAt(cell.i, m);
    }
    for (const mesh of [this.lots, this.walls, this.roofs, this.details]) mesh.instanceMatrix.needsUpdate = true;
  }

  private placeTrees() {
    const s = this.site;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    this.trees.forEach((t, i) => {
      q.setFromAxisAngle(up, t.a);
      m.compose(v.set(t.x, s.heightAt(t.x, t.z) - 0.0003, t.z), q, sc.set(0.001 * t.s, 0.001 * t.s * t.h, 0.001 * t.s));
      this.treeTops.setMatrixAt(i, m);
      this.trunks.setMatrixAt(i, m);
    });
    this.treeTops.instanceMatrix.needsUpdate = true;
    this.trunks.instanceMatrix.needsUpdate = true;
  }

  /** text for the water labels: a day counter and the 1 day / 1 week / 1 month marks */
  setWaterLabels(day: (day: number, meters: number, mld: number) => string, tick: (days: number, meters: number) => string) {
    this.waterDayText = day;
    this.waterTickText = tick;
    this.placeWater();
  }

  /** switch the daily amount (million liters); the column eases to the new height */
  setWaterRate(mld: number) {
    if (mld === this.rate) return;
    this.rate = mld;
    if (!this.show.water) this.rateShown = mld;
    this.placeWater();
  }

  private placeWater() {
    if (!this.show.water) return;
    const base = this.padTop || this.site.heightAt(this.cx, this.cz);
    const shown = Math.max(0.02, this.days);
    const perDay = depthPerDay(this.rateShown);
    const h = (shown * perDay) / 1000;
    this.water.position.set(this.cx, base, this.cz);
    this.waterSides.scale.set(1, h, 1);
    this.waterTop.position.y = h;
    this.waterTex.repeat.set(1, shown);
    this.waterTex.offset.set(0, (1 - (shown % 1)) % 1);
    const whole = Math.floor(this.days + 1e-6);
    const day = this.waterLabels[0];
    const dayNo = Math.max(1, Math.ceil(this.days - 1e-6));
    day.el.innerHTML = `<span>${this.waterDayText(dayNo, Math.round(dayNo * depthPerDay(this.rate) * 10) / 10, this.rate)}</span>`;
    day.pos.set(this.cx, base + h + 0.012, this.cz);
    for (const l of this.waterLabels.slice(1)) {
      l.pos.set(this.x0 + SIDE + 0.004, base + (l.day * perDay) / 1000, this.z0 + SIDE);
      l.el.innerHTML = `<span>${this.waterTickText(l.day, Math.round(l.day * depthPerDay(this.rate) * 10) / 10)}</span>`;
      l.el.dataset.on = whole >= l.day ? '1' : '';
    }
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    const v = new THREE.Vector3();
    for (const l of this.waterLabels) {
      const on = this.show.water && (l.day === 0 ? this.days > 0.05 : l.el.dataset.on === '1');
      if (!on) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      v.copy(l.pos).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      const anchor = l.day === 0 ? 'translate(-50%, -100%)' : 'translate(0, -50%)';
      l.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px) ${anchor}`;
    }
  }

  hideLabels() {
    for (const l of this.waterLabels) l.el.style.display = 'none';
  }

  /** returns true while animating */
  update(dt: number) {
    let moving = false;
    if (this.show.water && Math.abs(this.rateShown - this.rate) > 0.01) {
      // a new scenario: ease the column to its height
      this.rateShown += (this.rate - this.rateShown) * Math.min(1, dt * 4);
      if (Math.abs(this.rateShown - this.rate) < 0.05) this.rateShown = this.rate;
      this.placeWater();
      moving = true;
    }
    if (this.show.water && this.days < 30) {
      // wait for the camera, then a month in about 6 seconds (slow at first, faster as it piles up)
      if (this.waterWait > 0) this.waterWait -= dt;
      else this.days = Math.min(30, this.days + dt * (2 + this.days * 0.25));
      this.placeWater();
      moving = true;
    }
    if (this.show.homes && this.grow < 1) {
      this.grow = Math.min(1, this.grow + dt / 1.5);
      this.placeHomes();
      moving = true;
    }
    if (this.show.grid && this.reveal < 9) {
      // wait for the camera to pull back a little, then spread outwards
      this.reveal = Math.min(9, this.reveal + dt * (this.reveal < 0.05 ? 0.12 : 2.6));
      this.gridMat.uniforms.uReveal.value = Math.max(0, this.reveal - 0.05);
      moving = true;
    }
    return moving;
  }

  /** anchor points for labels (scene x/z) */
  anchors() {
    return {
      south: [this.cx, this.z0 + SIDE + 0.012] as [number, number],
      east: [this.x0 + SIDE + 0.016, this.cz] as [number, number],
      court: [this.cx + 0.012, this.cz - 0.026] as [number, number],
      centre: [this.cx, this.cz] as [number, number],
    };
  }
}

/** a basketball court drawn on a canvas (28 × 15 m, FIBA markings, simplified) */
function courtTexture() {
  const W = 560;
  const H = 300;
  const k = W / 28; // px per metre
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#c9864f';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2f6fb0';
  const key = (x: number) => g.fillRect(x, H / 2 - 2.45 * k, 5.8 * k, 4.9 * k);
  key(0);
  key(W - 5.8 * k);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 4;
  g.strokeRect(2, 2, W - 4, H - 4);
  g.beginPath();
  g.moveTo(W / 2, 0);
  g.lineTo(W / 2, H);
  g.stroke();
  g.beginPath();
  g.arc(W / 2, H / 2, 1.8 * k, 0, Math.PI * 2);
  g.stroke();
  for (const side of [0, 1]) {
    const bx = side ? W - 1.575 * k : 1.575 * k;
    const dir = side ? -1 : 1;
    g.strokeRect(side ? W - 5.8 * k : 0, H / 2 - 2.45 * k, 5.8 * k, 4.9 * k);
    g.beginPath();
    // three-point line: straight parts 0.9 m from the sidelines, then an arc of 6.75 m
    const yEdge = 0.9 * k;
    const dx = Math.sqrt(Math.max(0, (6.75 * k) ** 2 - (H / 2 - yEdge) ** 2));
    g.moveTo(side ? W : 0, yEdge);
    g.lineTo(bx + dir * dx, yEdge);
    const a = Math.atan2(H / 2 - yEdge, dx);
    if (side) g.arc(bx, H / 2, 6.75 * k, Math.PI + a, Math.PI - a, true);
    else g.arc(bx, H / 2, 6.75 * k, -a, a);
    g.lineTo(side ? W : 0, H - yEdge);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** one band per day of water: a thin bright line where each day starts */
function dayBandTexture() {
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 64;
  const g = cv.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#cfe6ff');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 62, 4, 2);
  g.fillStyle = 'rgba(20, 60, 110, 0.45)';
  g.fillRect(0, 60, 4, 2);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
