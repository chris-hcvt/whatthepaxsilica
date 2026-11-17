import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { HomeKey } from '../content/story';

/**
 * Low-poly house models for the one-hectare square, built in metres around the lot centre
 * (x = east, z = south = the street side, y = up). Each size has three parts so they can be
 * instanced with different tints: walls (facade texture), roofs (corrugated-sheet texture) and
 * details (doors, fences, cars, trees, pools — coloured per vertex).
 */

export interface HouseParts {
  walls: THREE.BufferGeometry;
  roofs: THREE.BufferGeometry;
  details: THREE.BufferGeometry;
}

const PLAIN_UV: [number, number] = [0.04, 0.97]; // a window-free patch of the facade texture

type Geo = THREE.BufferGeometry;

function paint(g: Geo, color: THREE.ColorRepresentation) {
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/**
 * A box standing on y = base. With `storeys`, side faces get facade UVs: one window per bay and storey,
 * bays spread evenly along each face; top and bottom faces map to a plain patch.
 */
function box(w: number, h: number, d: number, x: number, base: number, z: number, color: THREE.ColorRepresentation, storeys = 0): Geo {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  g.translate(x, base + h / 2, z);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (!storeys || Math.abs(nor.getY(i)) > 0.5) {
      uv.setXY(i, PLAIN_UV[0], PLAIN_UV[1]);
      continue;
    }
    const alongX = Math.abs(nor.getZ(i)) > 0.5;
    const span = alongX ? w : d;
    const start = alongX ? x - w / 2 : z - d / 2;
    const bays = Math.max(1, Math.round(span / 3));
    const t = ((alongX ? pos.getX(i) : pos.getZ(i)) - start) / span;
    uv.setXY(i, t * bays, ((pos.getY(i) - base) / h) * storeys);
  }
  return paint(g, color);
}

/** triangles from a flat list of [x, y, z] corners (3 per triangle), with given per-vertex UVs */
function tris(points: number[][], uvs: number[][], color: THREE.ColorRepresentation): Geo {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.flat(), 2));
  g.computeVertexNormals();
  return paint(g, color);
}

const quad = (a: number[], b: number[], c: number[], d: number[]) => [a, b, c, a, c, d];

/** gable roof over a w × d footprint centred at (x, z), eaves at height h; ridge along x unless `alongZ` */
function gable(w: number, d: number, x: number, z: number, h: number, rise: number, over: number, alongZ = false) {
  // build with the ridge along x, then swap axes if needed
  const W = alongZ ? d : w;
  const D = alongZ ? w : d;
  const slope = rise / (D / 2);
  const he = h - over * slope;
  const xa = -W / 2 - over;
  const xb = W / 2 + over;
  const zf = D / 2 + over;
  const top = h + rise;
  const front = quad([xa, he, zf], [xb, he, zf], [xb, top, 0], [xa, top, 0]);
  const back = quad([xb, he, -zf], [xa, he, -zf], [xa, top, 0], [xb, top, 0]);
  const map = (p: number[][]) => p.map(([px, py, pz]) => (alongZ ? [x + pz, py, z - px] : [x + px, py, z + pz]));
  const roofPts = [...front, ...back];
  // u along the ridge, v up the slope from the eave, in 2 m units (the sheet texture repeats every 2 m)
  const uvs = roofPts.map((p, i) => [p[0] / 2, Math.hypot(p[2] - (i < 6 ? zf : -zf), p[1] - he) / 2]);
  const roofs = tris(map(roofPts), uvs, '#ffffff');
  // the triangular wall ends under the ridge
  const ends: number[][] = [];
  for (const sx of [-W / 2, W / 2]) ends.push([sx, h, D / 2], [sx, h, -D / 2], [sx, top, 0]);
  const gables = tris(
    map(ends),
    ends.map(() => PLAIN_UV),
    '#ffffff',
  );
  return { roofs, gables };
}

/** hip roof: four slopes meeting at a short ridge along the longer side */
function hip(w: number, d: number, x: number, z: number, h: number, rise: number, over: number) {
  const alongX = w >= d;
  const W = alongX ? w : d;
  const D = alongX ? d : w;
  const slope = rise / (D / 2);
  const he = h - over * slope;
  const ex = W / 2 + over;
  const ez = D / 2 + over;
  const rx = Math.max(0, W / 2 - D / 2);
  const top = h + rise;
  const pts: number[][] = [];
  const uvs: number[][] = [];
  // long sides (trapezoids)
  for (const s of [1, -1]) {
    const q = s > 0 ? quad([-ex, he, ez], [ex, he, ez], [rx, top, 0], [-rx, top, 0]) : quad([ex, he, -ez], [-ex, he, -ez], [-rx, top, 0], [rx, top, 0]);
    pts.push(...q);
    uvs.push(...q.map((p) => [p[0] / 2, Math.hypot(p[2] - s * ez, p[1] - he) / 2]));
  }
  // short ends (triangles)
  for (const s of [1, -1]) {
    const t = s > 0 ? [[ex, he, ez], [ex, he, -ez], [rx, top, 0]] : [[-ex, he, -ez], [-ex, he, ez], [-rx, top, 0]];
    pts.push(...t);
    uvs.push(...t.map((p) => [p[2] / 2, Math.hypot(p[0] - s * ex, p[1] - he) / 2]));
  }
  const placed = pts.map(([px, py, pz]) => (alongX ? [x + px, py, z + pz] : [x + pz, py, z - px]));
  return tris(placed, uvs, '#ffffff');
}

function tree(x: number, z: number, s: number, color = '#4f8a3a'): Geo[] {
  const trunk = new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 2.2 * s, 6).toNonIndexed();
  trunk.translate(x, 1.1 * s, z);
  const top = new THREE.IcosahedronGeometry(1.9 * s, 0).toNonIndexed();
  top.scale(1, 0.85, 1);
  top.translate(x, 3.2 * s, z);
  return [paint(trunk, '#6b4e33'), paint(top, color)];
}

function car(x: number, z: number, color: THREE.ColorRepresentation, alongZ = true): Geo[] {
  const [l, wd] = alongZ ? [1.75, 4.3] : [4.3, 1.75];
  const [cl, cw] = alongZ ? [1.55, 2.3] : [2.3, 1.55];
  return [box(l, 0.75, wd, x, 0.25, z, color), box(cl, 0.6, cw, x, 1.0, z + (alongZ ? -0.2 : 0), '#2b3440')];
}

/** perimeter wall around the lot with an opening on the street side from x0 to x1 */
function fence(lotW: number, lotD: number, h: number, x0: number, x1: number, color: THREE.ColorRepresentation): Geo[] {
  const t = 0.18;
  const ix = lotW / 2 - 0.25;
  const iz = lotD / 2 - 0.25;
  const out = [box(t, h, 2 * iz, -ix, 0, 0, color), box(t, h, 2 * iz, ix, 0, 0, color), box(2 * ix, h, t, 0, 0, -iz, color)];
  if (x0 > -ix) out.push(box(x0 + ix, h, t, (-ix + x0) / 2, 0, iz, color));
  if (x1 < ix) out.push(box(ix - x1, h, t, (x1 + ix) / 2, 0, iz, color));
  return out;
}

const merge = (parts: Geo[]) => {
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
  g.computeBoundingSphere();
  return g;
};

/** the three parts for one home size, sized for a lot of lotW × lotD metres */
export function buildHouse(k: HomeKey, lotW: number, lotD: number): HouseParts {
  const walls: Geo[] = [];
  const roofs: Geo[] = [];
  const details: Geo[] = [];
  const door = (x: number, z: number, w = 0.95, h = 2.1) => details.push(box(w, h, 0.12, x, 0, z, '#6e4b2e'));
  const slab = (w: number, d: number, x: number, z: number, color = '#bdb8ad') => details.push(box(w, 0.08, d, x, 0, z, color));

  if (k === 'regular') {
    // one-storey row-type house with a front-facing gable and a small concrete front yard
    const [w, d, h, z] = [5.0, 5.6, 2.8, -0.9];
    walls.push(box(w, h, d, 0, 0, z, '#ffffff', 1));
    const g = gable(w, d, 0, z, h, 1.5, 0.45, true);
    roofs.push(g.roofs);
    walls.push(g.gables);
    door(-1.3, z + d / 2 + 0.06);
    slab(lotW - 1.0, lotD / 2 - (z + d / 2) - 0.2, 0, (z + d / 2 + lotD / 2) / 2);
  } else if (k === 'medium') {
    // two storeys, carport with a car, low front wall and a sliding gate
    const [w, d, h, x, z] = [8.2, 6.0, 6.0, -2.6, -0.7];
    walls.push(box(w, h, d, x, 0, z, '#ffffff', 2));
    const g = gable(w, d, x, z, h, 1.9, 0.5);
    roofs.push(g.roofs);
    walls.push(g.gables);
    door(x - 1.8, z + d / 2 + 0.06);
    slab(4.4, 7.4, lotW / 2 - 2.6, 0.2);
    details.push(...car(lotW / 2 - 2.6, 1.0, '#c9ced6'));
    details.push(...fence(lotW, lotD, 1.3, lotW / 2 - 4.9, lotW / 2 - 0.3, '#e8e0cc'));
    details.push(box(4.4, 1.5, 0.08, lotW / 2 - 2.6, 0, lotD / 2 - 0.25, '#3a3f46'));
  } else if (k === 'large') {
    // two-storey house with a hip roof, a garage wing, driveway, perimeter wall and garden trees
    const [w, d, h, x, z] = [10, 8.4, 6.2, -2.2, -2.4];
    walls.push(box(w, h, d, x, 0, z, '#ffffff', 2));
    roofs.push(hip(w, d, x, z, h, 2.4, 0.6));
    const [gw, gd, gh, gx, gz] = [4.4, 6.2, 3.2, 5.2, -1.3];
    walls.push(box(gw, gh, gd, gx, 0, gz, '#ffffff', 1));
    roofs.push(hip(gw, gd, gx, gz, gh, 1.2, 0.4));
    details.push(box(3.4, 2.5, 0.1, gx, 0, gz + gd / 2 + 0.06, '#4a4f57'));
    door(x - 1.5, z + d / 2 + 0.06, 1.5, 2.3);
    slab(4.2, lotD / 2 - (gz + gd / 2), gx, (gz + gd / 2 + lotD / 2) / 2);
    details.push(...fence(lotW, lotD, 1.7, gx - 2.1, gx + 2.1, '#efe9dc'));
    details.push(...tree(-6.4, 5.6, 0.95), ...tree(-1.8, 6.2, 0.8, '#5c9a44'));
  } else {
    // mansion: big two-storey hip-roofed house, a wing, pool with deck, long driveway, cars, high wall, trees
    const [w, d, h, x, z] = [20, 10, 7.2, -9, -3.6];
    walls.push(box(w, h, d, x, 0, z, '#ffffff', 2));
    roofs.push(hip(w, d, x, z, h, 3.4, 0.9));
    const [ww, wd, wh, wx, wz] = [9, 7.5, 3.8, 7.5, -5.2];
    walls.push(box(ww, wh, wd, wx, 0, wz, '#ffffff', 1));
    roofs.push(hip(ww, wd, wx, wz, wh, 1.8, 0.6));
    door(x, z + d / 2 + 0.06, 2.0, 2.6);
    details.push(box(14, 0.12, 8, 9.5, 0, 4.6, '#ded6c5'));
    details.push(box(10, 0.3, 4.6, 9.5, 0, 4.6, '#38b4e6'));
    slab(5.2, 9.6, -21.5, 4.6);
    details.push(...car(-21.5, 2.6, '#1f2328'), ...car(-21.5, 7.0, '#e8e8e8'));
    details.push(...fence(lotW, lotD, 2.2, -24.1, -18.9, '#f4efe4'));
    details.push(...tree(-14, 6.8, 1.1), ...tree(-6, 7.2, 1.0, '#5c9a44'), ...tree(2, 7.4, 1.15), ...tree(20.5, -6.2, 1.2, '#477f35'), ...tree(21, 5.8, 1.0));
  }
  return { walls: merge(walls), roofs: merge(roofs), details: merge(details) };
}

/** facade tile: one window per bay and storey (u, v in bays/storeys); the top-left corner stays plain */
export function facadeTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, S, S);
  // a darker skirting at floor level
  g.fillStyle = '#d9d4cb';
  g.fillRect(0, S - 7, S, 7);
  // window: frame, glass with a soft reflection, sill
  const x0 = S * 0.28;
  const x1 = S * 0.72;
  const y0 = S * 0.24;
  const y1 = S * 0.66;
  g.fillStyle = '#f2f2f0';
  g.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
  const glass = g.createLinearGradient(x0, y0, x1, y1);
  glass.addColorStop(0, '#5f7d96');
  glass.addColorStop(0.55, '#2b3c4c');
  glass.addColorStop(1, '#22303d');
  g.fillStyle = glass;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = '#e9e9e6';
  g.fillRect((x0 + x1) / 2 - 1.5, y0, 3, y1 - y0);
  g.fillStyle = '#cfcac0';
  g.fillRect(x0 - 6, y1 + 4, x1 - x0 + 12, 4);
  // keep the corner used for gables and tops plain
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 14, 14);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** corrugated metal sheet ("yero"), 2 m square: ribs run down the slope */
export function roofTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  const ribs = 8;
  for (let i = 0; i < S; i++) {
    const p = (i / S) * ribs * Math.PI * 2;
    const v = 0.78 + 0.22 * Math.sin(p);
    const c = Math.round(255 * v);
    g.fillStyle = `rgb(${c},${c},${c})`;
    g.fillRect(i, 0, 1, S);
  }
  // sheet overlaps
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, S / 2 - 1, S, 2);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
