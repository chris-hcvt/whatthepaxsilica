import * as THREE from 'three';
import { LocalProj, outerRing, ringCentroid, type LL, type SiteData, type Sitio } from './geo';

export const EXAG = 2.4; // vertical exaggeration for readability
const WALL_H = 0.32; // km, visual height of the boundary "curtain"

export type SiteView = 'overview' | 'hub' | 'top' | 'communities' | 'malls';

export interface SiteLayers {
  ncc?: boolean;
  hub?: boolean;
  wall?: boolean;
  sitios?: 'key' | 'all';
  mall?: string | null;
}

export interface SiteLabels {
  hub: string;
  ncc: string;
  inside: string;
  outside: (km: string) => string;
  mallCount: (n: number, name: string) => string;
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
  private dem: Uint16Array;
  private nx: number;
  private ny: number;
  private widthKm: number;
  private depthKm: number;
  private overlayCanvas = document.createElement('canvas');
  private overlayTex: THREE.CanvasTexture;
  private wall: THREE.Group;
  private sitioGroup = new THREE.Group();
  private mallMesh: THREE.InstancedMesh | null = null;
  private mallKey: string | null = null;
  private labels: Label[] = [];
  private labelLayer: HTMLElement;
  private hubXZ: [number, number][];
  private nccXZ: [number, number][];
  readonly hubCenter: THREE.Vector3;
  readonly nccCenter: THREE.Vector3;
  private hubLabel: Label;
  private nccLabel: Label;
  private mallLabel: Label;
  private sitioLabels = new Map<string, Label>();
  private layerKey = '';
  private t: SiteLabels | null = null;

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
    this.dem = new Uint16Array(demBuffer);
    this.widthKm = (bbox[2] - bbox[0]) * this.proj.kx;
    this.depthKm = (bbox[3] - bbox[1]) * this.proj.ky;

    this.scene.background = new THREE.Color('#06080c');
    this.scene.fog = new THREE.Fog('#06080c', 38, 80);
    this.scene.add(new THREE.HemisphereLight('#e8f1ff', '#1b2a1b', 1.15));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.9);
    sun.position.set(-12, 18, -8);
    this.scene.add(sun);

    // terrain
    const geo = new THREE.PlaneGeometry(this.widthKm, this.depthKm, this.nx - 1, this.ny - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, (this.dem[i] * dem.scale * EXAG) / 1000);
    geo.computeVertexNormals();
    imagery.colorSpace = THREE.SRGBColorSpace;
    const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: imagery }));
    this.scene.add(terrain);

    // a skirt so the terrain block reads as a slab, not a sheet
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
      geo,
      new THREE.MeshBasicMaterial({
        map: this.overlayTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      }),
    );
    overlay.renderOrder = 1;
    this.scene.add(overlay);

    this.hubXZ = data.hub.map((p) => this.proj.xz(p));
    this.nccXZ = data.ncc.map((p) => this.proj.xz(p));
    const hc = ringCentroid(this.hubXZ);
    const nc = ringCentroid(this.nccXZ);
    this.hubCenter = new THREE.Vector3(hc[0], this.heightAt(hc[0], hc[1]), hc[1]);
    this.nccCenter = new THREE.Vector3(nc[0], this.heightAt(nc[0], nc[1]), nc[1]);

    this.wall = this.buildWall(this.hubXZ);
    this.scene.add(this.wall);
    this.scene.add(this.sitioGroup);

    // anchor the hub label near the southern tip, away from the village labels (north, east, west)
    const south = this.hubXZ.reduce((a, b) => (b[1] > a[1] ? b : a));
    const lx = south[0] * 0.7 + hc[0] * 0.3;
    const lz = south[1] * 0.7 + hc[1] * 0.3;
    this.hubLabel = this.addLabel('', new THREE.Vector3(lx, this.heightAt(lx, lz) + WALL_H + 0.2, lz), 'label3d hub');
    const nccTop = this.nccXZ.reduce((a, b) => (b[1] < a[1] ? b : a));
    this.nccLabel = this.addLabel('', new THREE.Vector3(nccTop[0] + 1.2, this.heightAt(nccTop[0], nccTop[1]) + 0.3, nccTop[1] + 0.4), 'label3d ncc');
    this.mallLabel = this.addLabel('', new THREE.Vector3(hc[0], this.hubCenter.y + WALL_H + 0.25, hc[1]), 'label3d mall');
    this.buildSitios(data.sitios);
  }

  /** bilinear terrain height (scene units) at local x/z (km) */
  heightAt(x: number, z: number) {
    const u = (x + this.widthKm / 2) / this.widthKm;
    const v = (z + this.depthKm / 2) / this.depthKm;
    const fx = Math.min(Math.max(u * (this.nx - 1), 0), this.nx - 1.001);
    const fy = Math.min(Math.max(v * (this.ny - 1), 0), this.ny - 1.001);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const g = (i: number, j: number) => this.dem[j * this.nx + i];
    const h =
      g(ix, iy) * (1 - tx) * (1 - ty) + g(ix + 1, iy) * tx * (1 - ty) + g(ix, iy + 1) * (1 - tx) * ty + g(ix + 1, iy + 1) * tx * ty;
    return (h * this.data.scene.dem.scale * EXAG) / 1000;
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
    const pts = this.densify(ring);
    const pos: number[] = [];
    const t: number[] = [];
    const top: number[] = [];
    for (const [x, z] of pts) {
      const h = this.heightAt(x, z);
      pos.push(x, h, z, x, h + WALL_H, z);
      t.push(0, 1);
      top.push(x, h + WALL_H, z);
    }
    const idx: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
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
      uniforms: { uColor: { value: new THREE.Color('#ff3b3b') }, uOpacity: { value: 1 } },
      vertexShader: `attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vT; void main(){ float a = mix(0.62, 0.0, pow(vT, 0.8)); gl_FragColor = vec4(uColor + vec3(0.25)*(1.0-vT), a*uOpacity);} `,
    });
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
      const h = this.heightAt(x, z);
      const color = s.insideHub ? '#ff4d4d' : KEY_SITIOS.includes(s.name) ? '#ffc94d' : '#d9d2c3';
      const height = KEY_SITIOS.includes(s.name) ? 0.55 : 0.32;
      const pin = new THREE.Mesh(pinGeo, new THREE.MeshBasicMaterial({ color }));
      pin.scale.y = height;
      pin.position.set(x, h, z);
      const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color }));
      head.position.set(x, h + height, z);
      const g = new THREE.Group();
      g.add(pin, head);
      g.userData.name = s.name;
      this.sitioGroup.add(g);
      const label = this.addLabel(s.name, new THREE.Vector3(x, h + height + 0.12, z), `label3d sitio${s.insideHub ? ' inside' : ''}${KEY_SITIOS.includes(s.name) ? ' key' : ''}`);
      this.sitioLabels.set(s.name, label);
    }
  }

  private addLabel(text: string, pos: THREE.Vector3, cls: string): Label {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    el.style.display = 'none';
    this.labelLayer.appendChild(el);
    const l = { el, pos, on: false };
    this.labels.push(l);
    return l;
  }

  private drawOverlay(ncc: boolean, hub: boolean) {
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
      ctx.fillStyle = 'rgba(255,59,59,0.30)';
      ctx.fill();
      // diagonal hatching inside the hub
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,120,120,0.35)';
      ctx.lineWidth = 2;
      for (let k = -H; k < W; k += 18) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k + H, H);
        ctx.stroke();
      }
      ctx.restore();
      path(this.data.hub);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,80,80,1)';
      ctx.stroke();
    }
    this.overlayTex.needsUpdate = true;
  }

  private buildMalls(key: string) {
    if (this.mallMesh) {
      this.scene.remove(this.mallMesh);
      this.mallMesh.geometry.dispose();
      (this.mallMesh.material as THREE.Material).dispose();
      this.mallMesh = null;
    }
    const mall = this.data.malls[key];
    if (!mall) return 0;
    const ring = outerRing(mall.geom);
    // footprint relative to its vertex mean, x = east, y = north (km) — same convention as data-prep/pack_malls.py
    const clon = ring.reduce((a, p) => a + p[0], 0) / ring.length;
    const clat = ring.reduce((a, p) => a + p[1], 0) / ring.length;
    const kx = 111.32 * Math.cos((clat * Math.PI) / 180);
    const pts = ring.map(([lon, lat]) => [(lon - clon) * kx, (lat - clat) * 110.574] as [number, number]);
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const height = 0.07;
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const placements = mall.placements ?? [];
    const mat = new THREE.MeshLambertMaterial({ color: '#f4f1ea', emissive: '#3a3020', emissiveIntensity: 0.35 });
    const mesh = new THREE.InstancedMesh(geo, mat, placements.length);
    const m = new THREE.Matrix4();
    placements.forEach(([x, z, a], i) => {
      m.makeRotationY(a);
      m.setPosition(x, this.heightAt(x, z) - 0.01, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.mallMesh = mesh;
    this.scene.add(mesh);
    return placements.length;
  }

  setLayers(layers: SiteLayers, t: SiteLabels) {
    this.t = t;
    const key = JSON.stringify(layers);
    if (key !== this.layerKey) {
      this.layerKey = key;
      this.drawOverlay(!!layers.ncc, layers.hub !== false);
      this.wall.visible = !!layers.wall;
      this.sitioGroup.visible = !!layers.sitios;
      for (const g of this.sitioGroup.children) {
        g.visible = layers.sitios === 'all' || KEY_SITIOS.includes(g.userData.name);
      }
      if (layers.mall) {
        if (layers.mall !== this.mallKey || !this.mallMesh) {
          const n = this.buildMalls(layers.mall);
          this.mallKey = layers.mall;
          this.mallLabel.el.dataset.count = String(n);
        }
        this.mallMesh!.visible = true;
      } else if (this.mallMesh) {
        this.mallMesh.visible = false;
      }
    }
    // labels (text depends on language)
    this.hubLabel.el.textContent = t.hub;
    this.hubLabel.on = layers.hub !== false && !layers.mall;
    this.nccLabel.el.textContent = t.ncc;
    this.nccLabel.on = !!layers.ncc;
    if (layers.mall && this.data.malls[layers.mall]) {
      this.mallLabel.el.textContent = t.mallCount(Number(this.mallLabel.el.dataset.count || 0), this.data.malls[layers.mall].name);
      this.mallLabel.on = true;
    } else this.mallLabel.on = false;
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
      } else {
        l.el.textContent = s.name;
      }
    }
  }

  view(v: SiteView, aspect: number, frac = 1) {
    const far = (aspect < 0.9 ? 1.55 : aspect < 1.3 ? 1.25 : 1) * Math.pow(frac, -0.7);
    const hc = this.hubCenter;
    const sk = this.data.sitios.find((s) => s.name === 'Sapang Kawayan')!;
    const [skx, skz] = this.proj.xz(sk.lonlat);
    const views: Record<SiteView, { target: THREE.Vector3; offset: THREE.Vector3 }> = {
      overview: { target: this.nccCenter.clone().add(new THREE.Vector3(0.5, 0, 1)), offset: new THREE.Vector3(7, 19, 18) },
      hub: { target: hc.clone(), offset: new THREE.Vector3(5.5, 9, 10) },
      malls: { target: hc.clone(), offset: new THREE.Vector3(2.8, 5.8, 6.4) },
      top: { target: hc.clone().add(new THREE.Vector3(0, 0, 0.5)), offset: new THREE.Vector3(0, 19, 3.2) },
      communities: { target: new THREE.Vector3((skx + hc.x) / 2 - 0.6, this.heightAt(skx, skz), (skz + hc.z) / 2), offset: new THREE.Vector3(3.6, 6.2, 7.2) },
    };
    const { target, offset } = views[v];
    return { target, position: target.clone().add(offset.multiplyScalar(far)) };
  }

  updateLabels(camera: THREE.Camera, w: number, h: number, active: boolean) {
    const v = new THREE.Vector3();
    for (const l of this.labels) {
      if (!active || !l.on) {
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
  }

  hideLabels() {
    for (const l of this.labels) l.el.style.display = 'none';
  }

  get labelsText() {
    return this.t;
  }
}
