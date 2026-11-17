import * as THREE from 'three';
import { MEMBERS, OBSERVERS } from '../content/members';

type Country = { id: string; n: string; t: 'Polygon' | 'MultiPolygon'; c: number[][][] | number[][][][] };
export type GlobeHighlight = 'none' | 'members' | 'ph';

const W = 2048;
const H = 1024;

const COLORS = {
  ocean: '#0a1220',
  grid: 'rgba(120,160,210,0.10)',
  land: '#2a3442',
  landEdge: 'rgba(170,190,215,0.35)',
  member: '#2bb8a5',
  memberEdge: 'rgba(190,255,245,0.8)',
  observer: '#4b6a8a',
  ph: '#ffb020',
  dim: '#22403c',
};

export class GlobeScene {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group(); // tilt (x)
  readonly spinner = new THREE.Group(); // longitude (y)
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private countries: Country[] = [];
  private current: GlobeHighlight | null = null;
  private smallMarkers = new THREE.Group();

  // animation state
  private rotY = 0;
  private rotX = 0;
  private targetY = 0;
  private targetX = 0;
  spin = false;
  zoom = 1;
  targetZoom = 1;

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 64),
      new THREE.MeshBasicMaterial({ map: this.texture }),
    );
    this.spinner.add(sphere);
    this.spinner.add(this.smallMarkers);
    this.root.add(this.spinner);
    this.scene.add(this.root);

    // soft atmosphere rim
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { c: { value: new THREE.Color('#3aa0ff') } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.6 - dot(vN, vec3(0.0,0.0,1.0)), 3.2); gl_FragColor = vec4(c, clamp(i*1.1,0.0,0.32)); }`,
      }),
    );
    this.scene.add(atmo);
    this.scene.background = new THREE.Color('#05070b');
    this.drawBase();
  }

  async load() {
    const res = await fetch('/data/geo/countries.json');
    this.countries = await res.json();
    this.current = null;
    this.setHighlight('none');
  }

  /** lon/lat → position on the unit sphere in spinner space */
  static toVec(lon: number, lat: number, r = 1) {
    const phi = ((lon + 180) / 360) * Math.PI * 2;
    const theta = ((90 - lat) / 180) * Math.PI;
    return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
  }

  focus(lon: number, lat: number, zoom = 1, instant = false) {
    let ty = -Math.PI / 2 - (lon * Math.PI) / 180;
    // take the shortest way round
    while (ty - this.rotY > Math.PI) ty -= Math.PI * 2;
    while (ty - this.rotY < -Math.PI) ty += Math.PI * 2;
    this.targetY = ty;
    this.targetX = (lat * Math.PI) / 180 * 0.85;
    this.targetZoom = zoom;
    if (instant) {
      this.rotY = this.targetY;
      this.rotX = this.targetX;
      this.zoom = zoom;
    }
  }

  /** returns true while still moving */
  update(dt: number) {
    if (this.spin) this.targetY += dt * 0.05;
    const k = 1 - Math.pow(0.0015, dt);
    this.rotY += (this.targetY - this.rotY) * k;
    this.rotX += (this.targetX - this.rotX) * k;
    this.zoom += (this.targetZoom - this.zoom) * k;
    this.spinner.rotation.y = this.rotY;
    this.root.rotation.x = this.rotX;
    const moving =
      this.spin ||
      Math.abs(this.targetY - this.rotY) > 1e-4 ||
      Math.abs(this.targetX - this.rotX) > 1e-4 ||
      Math.abs(this.targetZoom - this.zoom) > 1e-4;
    return moving;
  }

  setHighlight(h: GlobeHighlight) {
    if (h === this.current || !this.countries.length) return;
    this.current = h;
    this.drawBase();
    const memberSet = new Set(MEMBERS.map((m) => m.iso3));
    const observerSet = new Set(OBSERVERS.map((m) => m.iso3));
    const ctx = this.ctx;
    for (const c of this.countries) {
      let fill = COLORS.land;
      let edge = COLORS.landEdge;
      if (h !== 'none' && memberSet.has(c.id)) {
        fill = h === 'ph' ? (c.id === 'PHL' ? COLORS.ph : COLORS.dim) : c.id === 'PHL' ? COLORS.ph : COLORS.member;
        edge = h === 'ph' && c.id !== 'PHL' ? 'rgba(120,200,190,0.4)' : COLORS.memberEdge;
      } else if (h === 'members' && observerSet.has(c.id)) {
        fill = COLORS.observer;
      }
      this.drawCountry(c, fill, edge);
    }
    // markers for members too small to draw at this scale
    this.smallMarkers.clear();
    if (h !== 'none') {
      for (const m of MEMBERS.filter((m) => m.marker)) {
        const [lon, lat] = m.marker!;
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = h === 'ph' ? COLORS.dim : COLORS.member;
        ctx.fill();
        ctx.strokeStyle = COLORS.memberEdge;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    if (h === 'ph') {
      // pulse ring around the Philippines
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.075, 0.085, 48),
        new THREE.MeshBasicMaterial({ color: COLORS.ph, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
      );
      const p = GlobeScene.toVec(121.5, 13.5, 1.002);
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      this.smallMarkers.add(ring);
    }
    this.texture.needsUpdate = true;
  }

  private drawBase() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  private drawCountry(c: Country, fill: string, edge: string) {
    const ctx = this.ctx;
    const polys = (c.t === 'Polygon' ? [c.c] : c.c) as number[][][][];
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length; i++) {
          const x = ((ring[i][0] + 180) / 360) * W;
          const y = ((90 - ring[i][1]) / 180) * H;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
    }
    ctx.fillStyle = fill;
    ctx.fill('evenodd');
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}
