import * as THREE from 'three';
import { pointInRing, ringCentroid } from './geo';
import type { SiteScene } from './site';
import { HOME_LOTS, type HomeKey } from '../content/story';

/**
 * "How big is one hectare?" — a real 100 m × 100 m square on the site, filled with homes of a chosen size,
 * a basketball court for scale, and a grid of one-hectare squares across the whole hub for the zoom-out.
 * Scene units are kilometres, so 1 hectare = 0.1 × 0.1.
 */

export type { HomeKey };

/** How each home size is drawn. The number of homes is HOME_LOTS[k].perHectare (10,000 ÷ lot size, rounded down). */
interface HomeLayout {
  /** lots laid out rows × cols across the square; spare lots stay as open space */
  rows: number;
  cols: number;
  /** house footprint as a share of the lot, wall and roof heights in metres */
  fw: number;
  fd: number;
  wall: number;
  roof: number;
  lawn: string;
}

const HOMES: Record<HomeKey, HomeLayout> = {
  regular: { rows: 12, cols: 13, fw: 0.62, fd: 0.66, wall: 2.7, roof: 1.5, lawn: '#b9a98a' },
  medium: { rows: 12, cols: 7, fw: 0.68, fd: 0.7, wall: 5.6, roof: 1.8, lawn: '#7ea866' },
  large: { rows: 6, cols: 6, fw: 0.6, fd: 0.6, wall: 6.4, roof: 2.4, lawn: '#6c9f58' },
  mansion: { rows: 5, cols: 2, fw: 0.52, fd: 0.58, wall: 8, roof: 3, lawn: '#5f9a4e' },
};

const SIDE = 0.1; // km
const COURT: [number, number] = [0.028, 0.015]; // FIBA court, 28 × 15 m
const WALLS = ['#f3efe5', '#ecdcc0', '#d8e5ee', '#f2d8c9', '#dde9d0', '#f5e6b2', '#e6e1f0'];
const ROOFS = ['#b4462f', '#8b3a2d', '#3e6e8e', '#696d74', '#a65d29', '#2f6a55', '#7b4b8f'];
const MAX = 160;

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
  private lots: THREE.InstancedMesh;
  private walls: THREE.InstancedMesh;
  private roofs: THREE.InstancedMesh;
  private pools: THREE.InstancedMesh;
  private grid: THREE.LineSegments;
  private gridMat: THREE.ShaderMaterial;
  private home: HomeKey = 'regular';
  private builtHome: HomeKey | null = null;
  private grow = 1;
  private reveal = 0;
  private placedFlat = -1;
  private gridPlacedFlat = -1;
  private houseCells: { x: number; z: number; delay: number; i: number }[] = [];
  lite = false;
  show = { plot: false, court: false, homes: false, grid: false };

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

    // homes
    const lotG = new THREE.PlaneGeometry(1, 1);
    lotG.rotateX(-Math.PI / 2);
    this.lots = new THREE.InstancedMesh(lotG, new THREE.MeshLambertMaterial({ color: '#ffffff' }), MAX);
    const wallG = new THREE.BoxGeometry(1, 1, 1);
    wallG.translate(0, 0.5, 0);
    this.walls = new THREE.InstancedMesh(wallG, new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#2a2622' }), MAX);
    const roofG = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    roofG.rotateY(Math.PI / 4);
    roofG.translate(0, 0.5, 0);
    this.roofs = new THREE.InstancedMesh(roofG, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), MAX);
    const poolG = new THREE.BoxGeometry(1, 1, 1);
    poolG.translate(0, 0.5, 0);
    this.pools = new THREE.InstancedMesh(poolG, new THREE.MeshLambertMaterial({ color: '#3fb6e8', emissive: '#0d4f7a', emissiveIntensity: 0.6 }), 12);
    for (const m of [this.lots, this.walls, this.roofs, this.pools]) {
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

    this.group.add(this.plot, this.frame, this.court, this.beacon, this.lots, this.walls, this.roofs, this.pools, this.grid);
    site.scene.add(this.group);
    this.apply();
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
  set(show: { plot: boolean; court: boolean; homes: boolean; grid: boolean }, instant: boolean) {
    const was = this.show;
    this.show = show;
    if (show.homes && (!was.homes || this.builtHome !== this.home)) {
      this.buildHomes();
      this.grow = instant || this.lite ? 1 : 0;
    }
    if (show.grid && !was.grid) this.reveal = instant || this.lite ? 9 : 0;
    this.apply();
    this.place();
  }

  private apply() {
    const { plot, court, homes, grid } = this.show;
    this.plot.visible = plot;
    this.frame.visible = plot;
    // zoomed out, the square is filled in solid so it stays visible
    this.plotMat.opacity = grid ? 0.95 : homes ? 0.0 : 0.22;
    this.court.visible = court;
    this.beacon.visible = grid;
    for (const m of [this.lots, this.walls, this.roofs, this.pools]) m.visible = homes;
    this.grid.visible = grid;
    this.gridMat.uniforms.uReveal.value = this.reveal;
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
    const c = new THREE.Color();
    this.houseCells = [];
    let n = 0;
    for (let r = 0; r < spec.rows; r++) {
      for (let q = 0; q < spec.cols; q++) {
        const idx = r * spec.cols + q;
        const x = this.x0 + (q + 0.5) * lw;
        const z = this.z0 + (r + 0.5) * ld;
        this.lots.setColorAt(idx, c.set(empty.has(idx) ? '#4f8f45' : spec.lawn));
        if (empty.has(idx)) continue;
        const delay = ((r + q) / (spec.rows + spec.cols)) * 0.9 + ((idx * 37) % 11) * 0.012;
        this.houseCells.push({ x, z, delay, i: n });
        // a fixed shuffle so neighbouring houses differ without forming stripes
        const mix = (idx * 2654435761) >>> 0;
        const wall = this.home === 'mansion' ? '#f6f4ee' : WALLS[(mix >>> 8) % WALLS.length];
        const roof = this.home === 'mansion' ? '#4a4f57' : ROOFS[(mix >>> 16) % ROOFS.length];
        this.walls.setColorAt(n, c.set(wall));
        this.roofs.setColorAt(n, c.set(roof));
        n++;
      }
    }
    this.lots.count = total;
    this.walls.count = n;
    this.roofs.count = n;
    this.pools.count = this.home === 'mansion' ? n : 0;
    for (const m of [this.lots, this.walls, this.roofs]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  /** re-sample heights after the terrain changes (only for the parts on show) */
  place() {
    const s = this.site;
    const flatNow = s.flatAmount;
    if (this.show.plot && this.placedFlat !== flatNow) {
      this.placedFlat = flatNow;
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
        const h = s.heightAt(x, z) + 0.0025;
        const w = width / 2;
        fp.set([x - tz * w, h, z + tx * w, x + tz * w, h, z - tx * w], i * 6);
      });
      this.frame.geometry.attributes.position.needsUpdate = true;
      this.frame.geometry.computeBoundingSphere();
      const ccx = this.cx + 0.012;
      const ccz = this.cz - 0.026;
      this.court.position.set(ccx, s.heightAt(ccx, ccz) + 0.0018, ccz);
      this.beacon.position.set(this.cx, s.heightAt(this.cx, this.cz), this.cz);
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
    const s = this.site;
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
        m.compose(v.set(x, s.heightAt(x, z) + 0.0016, z), q, sc.set(lw - 0.0012, 1, ld - 0.0012));
        this.lots.setMatrixAt(r * spec.cols + c, m);
      }
    }
    const hw = lw * spec.fw;
    const hd = ld * spec.fd;
    for (const cell of this.houseCells) {
      const g = Math.min(1, Math.max(0, (this.grow * 1.9 - cell.delay) / 0.45));
      const e = g * g * (3 - 2 * g);
      const hx = this.home === 'mansion' ? cell.x - lw * 0.12 : cell.x;
      const y = s.heightAt(cell.x, cell.z) + 0.0016;
      const wallH = (spec.wall / 1000) * Math.max(0.001, e);
      m.compose(v.set(hx, y, cell.z), q, sc.set(hw, wallH, hd));
      this.walls.setMatrixAt(cell.i, m);
      m.compose(v.set(hx, y + wallH, cell.z), q, sc.set(hw * 1.1, (spec.roof / 1000) * Math.max(0.001, e), hd * 1.1));
      this.roofs.setMatrixAt(cell.i, m);
      if (this.home === 'mansion') {
        m.compose(v.set(cell.x + lw * 0.33, y, cell.z), q, sc.set(0.009 * Math.max(0.001, e), 0.0007, 0.0045 * Math.max(0.001, e)));
        this.pools.setMatrixAt(cell.i, m);
      }
    }
    for (const mesh of [this.lots, this.walls, this.roofs, this.pools]) mesh.instanceMatrix.needsUpdate = true;
  }

  /** returns true while animating */
  update(dt: number) {
    let moving = false;
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
