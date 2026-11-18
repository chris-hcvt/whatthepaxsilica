import * as THREE from 'three';
import { LocalProj, outerRing, pointInRing, ringCentroid, type LL, type SiteData, type Sitio } from './geo';
import { SiteFx, type Fx, type FxLabels } from './fx';
import type { HomeKey } from './hectare';
import { addGroundDetail } from './ground';

export const EXAG = 2.4; // vertical exaggeration for readability
const WALL_H = 0.32; // km, visual height of the boundary "curtain"
const FLAT_BAND = 0.45; // km, width of the slope between the levelled pad and natural ground

export type SiteView = 'hero' | 'overview' | 'hub' | 'hubClose' | 'hectare' | 'water' | 'solar' | 'top' | 'communities' | 'compare' | 'handoff' | 'ambient';

export interface SiteLayers {
  ncc?: boolean;
  hub?: boolean;
  wall?: boolean;
  sitios?: 'key' | 'all';
  ref?: string | null;
  flat?: boolean;
  fx?: Fx[];
  /** home size shown in the one-hectare square */
  home?: HomeKey | null;
}

export interface SiteLabels {
  hub: string;
  ncc: string;
  inside: string;
  outside: (km: string) => string;
  refCount: (shown: number, name: string, kind: 'mall' | 'district') => string;
  levelled: string;
  fx: FxLabels;
}

interface Label {
  el: HTMLDivElement;
  pos: THREE.Vector3;
  on: boolean;
}

const KEY_SITIOS = ['Sapang Kawayan', 'Binyayan', 'Manabayucan'];

export class SiteScene {
  readonly scene = new THREE.Scene();
  readonly proj: LocalProj;
  /** the light that casts the close-up shadows, the ground mesh and its satellite image */
  readonly sun: THREE.DirectionalLight;
  readonly terrain: THREE.Mesh;
  readonly imagery: THREE.Texture;
  private nx: number;
  private ny: number;
  private widthKm: number;
  private depthKm: number;
  private geo: THREE.PlaneGeometry;
  private base: Float32Array; // natural heights (scene units)
  private weight: Float32Array; // 0..1 levelling weight per vertex
  private cur: Float32Array; // current heights
  private hFlat = 0;
  private flat = 0;
  private flatTarget = 0;
  private normalsDirty = false;
  private overlayCanvas = document.createElement('canvas');
  private overlayTex: THREE.CanvasTexture;
  private wall: THREE.Group;
  private wallPts: [number, number][] = [];
  private sitioGroup = new THREE.Group();
  private refMesh: THREE.InstancedMesh | null = null;
  private refKey: string | null = null;
  private refShown = 0;
  private labels: Label[] = [];
  readonly labelLayer: HTMLElement;
  readonly hubXZ: [number, number][];
  readonly nccXZ: [number, number][];
  private fx!: SiteFx;
  private wallMat!: THREE.ShaderMaterial;
  readonly hubCenter: THREE.Vector3;
  readonly nccCenter: THREE.Vector3;
  private hubLabelXZ: [number, number];
  private hubLabel: Label;
  private nccLabel: Label;
  private refLabel: Label;
  private flatLabel: Label;
  private sitioLabels = new Map<string, Label>();
  private sitioXZ = new Map<string, { x: number; z: number; height: number; group: THREE.Group }>();
  private layerKey = '';
  private overlayKey = '';

  constructor(
    readonly data: SiteData,
    demBuffer: ArrayBuffer,
    imagery: THREE.Texture,
    labelLayer: HTMLElement,
  ) {
    this.labelLayer = labelLayer;
    const { bbox, dem } = data.scene;
    this.proj = new LocalProj(bbox);
    this.nx = dem.nx;
    this.ny = dem.ny;
    const raw = new Uint16Array(demBuffer);
    this.widthKm = (bbox[2] - bbox[0]) * this.proj.kx;
    this.depthKm = (bbox[3] - bbox[1]) * this.proj.ky;

    this.scene.background = new THREE.Color('#06080c');
    this.scene.fog = new THREE.Fog('#06080c', 38, 80);
    this.scene.add(new THREE.HemisphereLight('#e8f1ff', '#1b2a1b', 1.15));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.9);
    sun.position.set(-12, 18, -8);
    this.scene.add(sun);
    this.sun = sun;
    this.imagery = imagery;

    this.hubXZ = data.hub.map((p) => this.proj.xz(p));
    this.nccXZ = data.ncc.map((p) => this.proj.xz(p));

    // terrain heights + levelling weights
    this.geo = new THREE.PlaneGeometry(this.widthKm, this.depthKm, this.nx - 1, this.ny - 1);
    this.geo.rotateX(-Math.PI / 2);
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    this.base = new Float32Array(pos.count);
    this.weight = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) this.base[i] = (raw[i] * dem.scale * EXAG) / 1000;
    this.cur = this.base.slice();
    this.computeWeights(pos);
    for (let i = 0; i < pos.count; i++) pos.setY(i, this.cur[i]);
    this.geo.computeVertexNormals();
    imagery.colorSpace = THREE.SRGBColorSpace;
    const groundMat = new THREE.MeshLambertMaterial({ map: imagery });
    addGroundDetail(groundMat);
    this.terrain = new THREE.Mesh(this.geo, groundMat);
    this.scene.add(this.terrain);
    this.scene.add(this.buildSkirt());

    // overlay drawn on a canvas and draped on the same geometry
    const ow = 2048;
    const oh = Math.round((ow * (bbox[3] - bbox[1])) / (bbox[2] - bbox[0]));
    this.overlayCanvas.width = ow;
    this.overlayCanvas.height = oh;
    this.overlayTex = new THREE.CanvasTexture(this.overlayCanvas);
    this.overlayTex.colorSpace = THREE.SRGBColorSpace;
    this.overlayTex.anisotropy = 4;
    const overlay = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({ map: this.overlayTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    );
    overlay.renderOrder = 1;
    this.scene.add(overlay);

    const hc = ringCentroid(this.hubXZ);
    const nc = ringCentroid(this.nccXZ);
    this.hubCenter = new THREE.Vector3(hc[0], this.heightAt(hc[0], hc[1]), hc[1]);
    this.nccCenter = new THREE.Vector3(nc[0], this.heightAt(nc[0], nc[1]), nc[1]);

    this.wall = this.buildWall(this.hubXZ);
    this.scene.add(this.wall);
    this.scene.add(this.sitioGroup);

    // hub label near the southern tip, away from the village labels (north, east, west)
    const south = this.hubXZ.reduce((a, b) => (b[1] > a[1] ? b : a));
    this.hubLabelXZ = [south[0] * 0.7 + hc[0] * 0.3, south[1] * 0.7 + hc[1] * 0.3];
    this.hubLabel = this.addLabel('', new THREE.Vector3(), 'label3d hub');
    const nccTop = this.nccXZ.reduce((a, b) => (b[1] < a[1] ? b : a));
    this.nccLabel = this.addLabel('', new THREE.Vector3(nccTop[0] + 1.2, this.heightAt(nccTop[0], nccTop[1]) + 0.3, nccTop[1] + 0.4), 'label3d ncc');
    this.refLabel = this.addLabel('', new THREE.Vector3(), 'label3d mall');
    this.flatLabel = this.addLabel('', new THREE.Vector3(), 'label3d flat');
    this.buildSitios(data.sitios);
    this.fx = new SiteFx(this);
    this.placeDynamic();
  }

  /** 0 = natural ground, 1 = fully levelled */
  get flatAmount() {
    return this.flat;
  }

  get halfWidth() {
    return this.widthKm / 2;
  }

  get halfDepth() {
    return this.depthKm / 2;
  }

  /** for the 3D → map handoff: the hub's bounding box centre and size (km) */
  hubBox() {
    const xs = this.hubXZ.map((p) => p[0]);
    const zs = this.hubXZ.map((p) => p[1]);
    return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cz: (Math.min(...zs) + Math.max(...zs)) / 2, w: Math.max(...xs) - Math.min(...xs), d: Math.max(...zs) - Math.min(...zs) };
  }

  set lite(v: boolean) {
    this.fx.lite = v;
  }

  private computeWeights(pos: THREE.BufferAttribute) {
    const xs = this.hubXZ.map((p) => p[0]);
    const zs = this.hubXZ.map((p) => p[1]);
    const [x0, x1, z0, z1] = [Math.min(...xs) - FLAT_BAND, Math.max(...xs) + FLAT_BAND, Math.min(...zs) - FLAT_BAND, Math.max(...zs) + FLAT_BAND];
    let sum = 0;
    let n = 0;
    const ring = this.hubXZ;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      if (pointInRing(x, z, ring)) {
        this.weight[i] = 1;
        sum += this.base[i];
        n++;
        continue;
      }
      let d = Infinity;
      for (let k = 0; k < ring.length - 1; k++) {
        const [ax, az] = ring[k];
        const [bx, bz] = ring[k + 1];
        const vx = bx - ax;
        const vz = bz - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
        d = Math.min(d, Math.hypot(x - ax - t * vx, z - az - t * vz));
      }
      if (d < FLAT_BAND) {
        const s = 1 - d / FLAT_BAND;
        this.weight[i] = s * s * (3 - 2 * s);
      }
    }
    this.hFlat = n ? sum / n : 0;
  }

  /** bilinear terrain height (scene units) at local x/z (km), including any levelling */
  heightAt(x: number, z: number) {
    const u = (x + this.widthKm / 2) / this.widthKm;
    const v = (z + this.depthKm / 2) / this.depthKm;
    const fx = Math.min(Math.max(u * (this.nx - 1), 0), this.nx - 1.001);
    const fy = Math.min(Math.max(v * (this.ny - 1), 0), this.ny - 1.001);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const g = (i: number, j: number) => this.cur[j * this.nx + i];
    // same two triangles per cell as the rendered PlaneGeometry (diagonal from (ix, iy+1) to (ix+1, iy)),
    // so objects placed on the ground sit exactly on it
    if (tx + ty <= 1) return g(ix, iy) + (g(ix + 1, iy) - g(ix, iy)) * tx + (g(ix, iy + 1) - g(ix, iy)) * ty;
    const c = g(ix + 1, iy + 1);
    return c + (g(ix, iy + 1) - c) * (1 - tx) + (g(ix + 1, iy) - c) * (1 - ty);
  }

  /** animate levelling and effects; returns true while something moves */
  update(dt: number) {
    let moving = this.fx.update(dt);
    this.wallMat.uniforms.uPulse.value = this.fx.wallPulse();
    if (Math.abs(this.flat - this.flatTarget) < 1e-3) {
      if (this.normalsDirty) {
        this.geo.computeVertexNormals();
        this.normalsDirty = false;
        return true;
      }
      return moving;
    }
    const step = dt / 1.4;
    this.flat = this.flat < this.flatTarget ? Math.min(this.flatTarget, this.flat + step) : Math.max(this.flatTarget, this.flat - step);
    this.applyFlat();
    moving = true;
    return moving;
  }

  setFlatInstant(on: boolean) {
    this.flatTarget = this.flat = on ? 1 : 0;
    this.applyFlat();
    this.geo.computeVertexNormals();
  }

  private applyFlat() {
    const e = this.flat * this.flat * (3 - 2 * this.flat);
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.cur.length; i++) {
      const w = this.weight[i];
      if (w === 0) continue;
      this.cur[i] = this.base[i] + (this.hFlat - this.base[i]) * w * e;
      pos.setY(i, this.cur[i]);
    }
    pos.needsUpdate = true;
    this.normalsDirty = true;
    this.placeDynamic();
  }

  /** move everything that sits on the levelled area */
  private placeDynamic() {
    const wp = (this.wall.children[0] as THREE.Mesh).geometry.attributes.position as THREE.BufferAttribute;
    const lp = (this.wall.children[1] as THREE.Line).geometry.attributes.position as THREE.BufferAttribute;
    this.wallPts.forEach(([x, z], i) => {
      const h = this.heightAt(x, z);
      wp.setY(i * 2, h);
      wp.setY(i * 2 + 1, h + WALL_H);
      lp.setY(i, h + WALL_H);
    });
    wp.needsUpdate = true;
    lp.needsUpdate = true;
    for (const [name, s] of this.sitioXZ) {
      const h = this.heightAt(s.x, s.z);
      s.group.position.y = h;
      this.sitioLabels.get(name)!.pos.y = h + s.height + 0.12;
    }
    const [lx, lz] = this.hubLabelXZ;
    this.hubLabel.pos.set(lx, this.heightAt(lx, lz) + WALL_H + 0.2, lz);
    const hc = this.hubCenter;
    this.refLabel.pos.set(hc.x, this.heightAt(hc.x, hc.z) + 0.45, hc.z - 1.2);
    this.flatLabel.pos.set(lx, this.heightAt(lx, lz) + 0.25, lz);
    if (this.refMesh) this.positionRefs();
    this.fx?.place();
  }

  private buildSkirt() {
    const base = -0.6;
    const positions: number[] = [];
    const edge = (pts: [number, number][]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i];
        const [x1, z1] = pts[i + 1];
        const h0 = this.heightAt(x0, z0);
        const h1 = this.heightAt(x1, z1);
        positions.push(x0, h0, z0, x0, base, z0, x1, h1, z1, x1, h1, z1, x0, base, z0, x1, base, z1);
      }
    };
    const w = this.widthKm / 2;
    const d = this.depthKm / 2;
    const steps = 120;
    const line = (a: [number, number], b: [number, number]) =>
      Array.from({ length: steps + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps] as [number, number]);
    edge(line([-w + 1e-3, d - 1e-3], [w - 1e-3, d - 1e-3]));
    edge(line([w - 1e-3, d - 1e-3], [w - 1e-3, -d + 1e-3]));
    edge(line([w - 1e-3, -d + 1e-3], [-w + 1e-3, -d + 1e-3]));
    edge(line([-w + 1e-3, -d + 1e-3], [-w + 1e-3, d - 1e-3]));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#141a22', side: THREE.DoubleSide }));
  }

  private densify(ring: [number, number][], step = 0.06) {
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

  private buildWall(ring: [number, number][]) {
    this.wallPts = this.densify(ring);
    const pos: number[] = [];
    const t: number[] = [];
    const top: number[] = [];
    for (const [x, z] of this.wallPts) {
      const h = this.heightAt(x, z);
      pos.push(x, h, z, x, h + WALL_H, z);
      t.push(0, 1);
      top.push(x, h + WALL_H, z);
    }
    const idx: number[] = [];
    for (let i = 0; i < this.wallPts.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color('#ff3b3b') }, uPulse: { value: 1 } },
      vertexShader: `attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform vec3 uColor; uniform float uPulse; varying float vT; void main(){ float a = mix(0.62, 0.0, pow(vT, 0.8)) * uPulse; gl_FragColor = vec4(uColor + vec3(0.25)*(1.0-vT), a);} `,
    });
    this.wallMat = mat;
    const mesh = new THREE.Mesh(g, mat);
    mesh.renderOrder = 2;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
    const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: '#ff7a7a', transparent: true, opacity: 0.7 }));
    const group = new THREE.Group();
    group.add(mesh, line);
    return group;
  }

  private buildSitios(sitios: Sitio[]) {
    const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6);
    pinGeo.translate(0, 0.5, 0);
    const headGeo = new THREE.SphereGeometry(0.075, 16, 12);
    for (const s of sitios) {
      const [x, z] = this.proj.xz(s.lonlat);
      const key = KEY_SITIOS.includes(s.name);
      const color = s.insideHub ? '#ff4d4d' : key ? '#ffc94d' : '#d9d2c3';
      const height = key ? 0.55 : 0.32;
      const pin = new THREE.Mesh(pinGeo, new THREE.MeshBasicMaterial({ color }));
      pin.scale.y = height;
      const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color }));
      head.position.y = height;
      const g = new THREE.Group();
      g.add(pin, head);
      g.position.set(x, 0, z);
      g.userData.name = s.name;
      this.sitioGroup.add(g);
      this.sitioXZ.set(s.name, { x, z, height, group: g });
      const label = this.addLabel(s.name, new THREE.Vector3(x, 0, z), `label3d sitio${s.insideHub ? ' inside' : ''}${key ? ' key' : ''}`);
      this.sitioLabels.set(s.name, label);
    }
  }

  addLabel(text: string, pos: THREE.Vector3, cls: string): Label {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    el.style.display = 'none';
    this.labelLayer.appendChild(el);
    const l = { el, pos, on: false };
    this.labels.push(l);
    return l;
  }

  private drawOverlay(ncc: boolean, hub: boolean, flat: boolean) {
    const key = `${ncc}${hub}${flat}${this.fx.overlayKey()}`;
    if (key === this.overlayKey) return;
    this.overlayKey = key;
    const ctx = this.overlayCanvas.getContext('2d')!;
    const W = this.overlayCanvas.width;
    const H = this.overlayCanvas.height;
    const [w, s, e, n] = this.data.scene.bbox;
    const px = ([lon, lat]: LL) => [((lon - w) / (e - w)) * W, ((n - lat) / (n - s)) * H] as const;
    ctx.clearRect(0, 0, W, H);
    const path = (ring: LL[]) => {
      ctx.beginPath();
      ring.forEach((p, i) => {
        const [x, y] = px(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };
    if (ncc) {
      path(this.data.ncc);
      ctx.fillStyle = 'rgba(255,190,60,0.06)';
      ctx.fill();
      ctx.setLineDash([16, 12]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,196,77,0.95)';
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (hub) {
      path(this.data.hub);
      ctx.fillStyle = flat ? 'rgba(196,178,146,0.86)' : 'rgba(255,59,59,0.30)';
      ctx.fill();
      if (!this.fx.has('grid')) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = flat ? 'rgba(150,130,100,0.35)' : 'rgba(255,120,120,0.35)';
        ctx.lineWidth = 2;
        const stepPx = flat ? 26 : 18;
        for (let k = -H; k < W; k += stepPx) {
          ctx.beginPath();
          ctx.moveTo(k, 0);
          ctx.lineTo(k + H, H);
          ctx.stroke();
        }
        ctx.restore();
      }
      path(this.data.hub);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,80,80,1)';
      ctx.stroke();
    }
    this.fx.drawOverlay(ctx, px);
    if (hub && (this.fx.has('solar') || this.fx.has('reservoir'))) {
      // keep the zone's outline on top of the drawings
      path(this.data.hub);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,80,80,1)';
      ctx.stroke();
    }
    this.overlayTex.needsUpdate = true;
  }

  private buildRef(key: string) {
    if (this.refMesh) {
      this.scene.remove(this.refMesh);
      this.refMesh.geometry.dispose();
      (this.refMesh.material as THREE.Material).dispose();
      this.refMesh = null;
    }
    const ref = this.data.refs?.[key];
    if (!ref) return 0;
    const ring = outerRing(ref.geom);
    // footprint relative to its vertex mean, x = east, y = north (km): same convention as data-prep/pack_malls.py
    const clon = ring.reduce((a, p) => a + p[0], 0) / ring.length;
    const clat = ring.reduce((a, p) => a + p[1], 0) / ring.length;
    const kx = 111.32 * Math.cos((clat * Math.PI) / 180);
    const pts = ring.map(([lon, lat]) => new THREE.Vector2((lon - clon) * kx, (lat - clat) * 110.574));
    const district = ref.kind === 'district';
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: district ? 0.035 : 0.07, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    // every whole copy that fits inside the outline (data-prep/pack_malls.py, pack_districts.py)
    const placements = ref.placements ?? [];
    const mat = district
      ? new THREE.MeshLambertMaterial({ color: '#9cc4ff', emissive: '#1d3a66', emissiveIntensity: 0.5, transparent: true, opacity: 0.88 })
      : new THREE.MeshLambertMaterial({ color: '#f4f1ea', emissive: '#3a3020', emissiveIntensity: 0.35 });
    const mesh = new THREE.InstancedMesh(geo, mat, placements.length);
    mesh.userData.placements = placements;
    this.refMesh = mesh;
    this.positionRefs();
    this.scene.add(mesh);
    return placements.length;
  }

  private positionRefs() {
    const mesh = this.refMesh!;
    const m = new THREE.Matrix4();
    (mesh.userData.placements as [number, number, number][]).forEach(([x, z, a], i) => {
      m.makeRotationY(a);
      m.setPosition(x, this.heightAt(x, z) + 0.004, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  setLayers(layers: SiteLayers, t: SiteLabels, instant = false) {
    const key = JSON.stringify(layers);
    if (key !== this.layerKey) {
      this.layerKey = key;
      if (layers.home) this.fx.setHome(layers.home);
      this.fx.set(layers.fx ?? [], instant);
      this.drawOverlay(!!layers.ncc, layers.hub !== false, !!layers.flat);
      this.wall.visible = !!layers.wall;
      // the zone glows amber while its electricity use is on screen
      (this.wallMat.uniforms.uColor.value as THREE.Color).set((layers.fx ?? []).includes('power') ? '#ffb020' : '#ff3b3b');
      this.sitioGroup.visible = !!layers.sitios;
      for (const g of this.sitioGroup.children) g.visible = layers.sitios === 'all' || KEY_SITIOS.includes(g.userData.name);
      this.flatTarget = layers.flat ? 1 : 0;
      if (instant) this.setFlatInstant(!!layers.flat);
      if (layers.ref) {
        if (layers.ref !== this.refKey || !this.refMesh) {
          this.refShown = this.buildRef(layers.ref);
          this.refKey = layers.ref;
        }
        if (this.refMesh) this.refMesh.visible = true;
      } else if (this.refMesh) this.refMesh.visible = false;
    }
    const ref = layers.ref ? this.data.refs?.[layers.ref] : null;
    this.fx.setLabels(t.fx);
    const busy = (layers.fx ?? []).some((f) => ['icons', 'lease', 'unknowns', 'makati', 'hectare', 'homes', 'grid', 'power', 'solar', 'water', 'reservoir'].includes(f));
    this.hubLabel.el.textContent = t.hub;
    this.hubLabel.on = layers.hub !== false && !ref && !layers.flat && !busy;
    this.nccLabel.el.textContent = t.ncc;
    this.nccLabel.on = !!layers.ncc;
    this.flatLabel.el.textContent = t.levelled;
    this.flatLabel.on = !!layers.flat && !ref && !busy;
    if (ref) {
      this.refLabel.el.textContent = t.refCount(this.refShown, ref.name, ref.kind);
      this.refLabel.on = true;
    } else this.refLabel.on = false;
    for (const s of this.data.sitios) {
      const l = this.sitioLabels.get(s.name)!;
      const visible = !!layers.sitios && (layers.sitios === 'all' || KEY_SITIOS.includes(s.name));
      l.on = visible;
      if (visible && KEY_SITIOS.includes(s.name)) {
        l.el.innerHTML = '';
        const name = document.createElement('b');
        name.textContent = s.name;
        const sub = document.createElement('span');
        sub.textContent = s.insideHub ? t.inside : t.outside((s.metersToHubEdge / 1000).toFixed(1));
        l.el.append(name, sub);
      } else l.el.textContent = s.name;
    }
  }

  view(v: SiteView, aspect: number, frac = 1) {
    const far = (aspect < 0.9 ? 1.55 : aspect < 1.3 ? 1.25 : 1) * Math.pow(frac, -0.7);
    const hc = this.hubCenter;
    const sk = this.data.sitios.find((s) => s.name === 'Sapang Kawayan')!;
    const [skx, skz] = this.proj.xz(sk.lonlat);
    const views: Record<SiteView, { target: THREE.Vector3; offset: THREE.Vector3 }> = {
      hero: { target: hc.clone().add(new THREE.Vector3(1.2, 0, -0.4)), offset: new THREE.Vector3(-6, 9.5, 12.5) },
      overview: { target: this.nccCenter.clone().add(new THREE.Vector3(0.5, 0, 1)), offset: new THREE.Vector3(7, 19, 18) },
      hub: { target: hc.clone(), offset: new THREE.Vector3(5.5, 9, 10) },
      hubClose: { target: hc.clone(), offset: new THREE.Vector3(2.6, 6.2, 6.0) },
      // close on the one-hectare square, from the same direction as hubClose so the zoom-out is a straight pull-back
      hectare: { target: this.fx.hectareTarget(), offset: new THREE.Vector3(2.6, 6.2, 6.0).normalize().multiplyScalar(aspect < 0.9 ? 0.25 : 0.215) },
      // lower and further back, so a month of water (270 m) fits above the square
      water: { target: this.fx.hectareTarget().add(new THREE.Vector3(0, 0.13, 0)), offset: new THREE.Vector3(0.62, 0.36, 0.78).normalize().multiplyScalar(0.62) },
      // high enough to see the 14 km solar square around the zone
      solar: { target: hc.clone().add(new THREE.Vector3(0, 0, 1)), offset: new THREE.Vector3(3, 22, 15) },
      ambient: { target: hc.clone(), offset: new THREE.Vector3(9, 15, 15) },
      handoff: { target: hc.clone(), offset: new THREE.Vector3(0, 1, 0) },
      compare: { target: new THREE.Vector3(hc.x, this.hFlat, hc.z), offset: new THREE.Vector3(2.2, 7.4, 5.6) },
      top: { target: hc.clone().add(new THREE.Vector3(0, 0, 0.5)), offset: new THREE.Vector3(0, 19, 3.2) },
      communities: { target: new THREE.Vector3((skx + hc.x) / 2 - 0.6, this.heightAt(skx, skz), (skz + hc.z) / 2), offset: new THREE.Vector3(3.6, 6.2, 7.2) },
    };
    if (v === 'handoff') {
      // straight down, north up, framing the hub the way the 2D map will
      const b = this.hubBox();
      const t = Math.tan(((38 / 2) * Math.PI) / 180) * 2;
      const need = Math.max((b.d * 1.25) / frac, (b.w * 1.25) / (aspect * frac));
      const target = new THREE.Vector3(b.cx, this.hFlat, b.cz);
      return { target, position: target.clone().add(new THREE.Vector3(0, need / t, 0.001)) };
    }
    const { target, offset } = views[v];
    return { target, position: target.clone().add(offset.multiplyScalar(far)) };
  }

  updateLabels(camera: THREE.Camera, w: number, h: number) {
    const v = new THREE.Vector3();
    for (const l of this.labels) {
      if (!l.on) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      v.copy(l.pos).project(camera);
      if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    }
    this.fx.updateLabels(camera, w, h);
  }

  hideLabels() {
    for (const l of this.labels) l.el.style.display = 'none';
    this.fx.hideLabels();
  }
}
