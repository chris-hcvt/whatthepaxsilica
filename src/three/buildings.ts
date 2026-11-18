import * as THREE from 'three';
import { box, car, merge, paint, tree, type Geo } from './houses';

/**
 * Big buildings for the electricity lineup, in metres (x = east, z = south = front, y = up), centred on (0, 0).
 * Sizes are illustrative but realistic:
 *  - office tower: 50,000 m² of offices ≈ 40 floors of ~1,300 m², ~150 m tall
 *  - big mall: ~300 × 180 m, 4 levels, with ~4.3 ha of rooftop solar (as SM City Fairview has)
 *  - chip factory: a ~280 × 170 m cleanroom block with roof plant, a utility building and tanks
 * Each returns `glass` (curtain-wall texture, optional), `solar` (panel texture, optional) and `plain` (vertex colours).
 */
export interface BuildingParts {
  glass?: Geo;
  solar?: Geo;
  plain: Geo;
  /** footprint (x by z) and height, metres */
  w: number;
  d: number;
  h: number;
}

function cylinder(r: number, h: number, x: number, z: number, color: THREE.ColorRepresentation, base = 0, seg = 16): Geo {
  const g = new THREE.CylinderGeometry(r, r, h, seg).toNonIndexed();
  g.translate(x, base + h / 2, z);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.04, 0.97);
  return paint(g, color);
}

/** a flat panel field on a roof: uv in 4 m tiles so the panel texture repeats */
function panels(w: number, d: number, x: number, y: number, z: number): Geo {
  const g = new THREE.PlaneGeometry(w, d).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  g.translate(x, y, z);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 4), uv.getY(i) * (d / 4));
  return paint(g, '#ffffff');
}

export function buildOffice(): BuildingParts {
  const glass: Geo[] = [];
  const plain: Geo[] = [];
  // podium (lobby, retail) and the tower: glass curtain wall, one window tile per bay and floor
  glass.push(box(56, 14, 50, 0, 0, 0, '#ffffff', 3));
  glass.push(box(38, 140, 36, 0, 14, -2, '#ffffff', 37));
  plain.push(box(40, 1.2, 38, 0, 154, -2, '#3a4047'));
  plain.push(box(26, 7, 22, 0, 155.2, -2, '#2c3138'));
  plain.push(box(6, 3, 6, 9, 162, 4, '#9aa3ad'), box(6, 3, 6, -9, 162, -8, '#9aa3ad'));
  // plaza and trees
  plain.push(box(80, 0.3, 76, 0, 0, 2, '#c9c4b8'));
  for (const [x, z] of [[-34, 30], [-20, 34], [20, 34], [34, 30], [-36, -20], [36, -20]]) plain.push(...tree(x, z, 1.1));
  return { glass: merge(glass), plain: merge(plain), w: 80, d: 76, h: 165 };
}

export function buildMall(): BuildingParts {
  const glass: Geo[] = [];
  const plain: Geo[] = [];
  const [W, D, H] = [300, 180, 24];
  // main block in two tones, a sign band and glass entrances on the front
  plain.push(box(W, H, D, 0, 0, -20, '#ece5d6'));
  plain.push(box(W + 1, 3, D + 1, 0, 9, -20, '#d8cfbd'));
  plain.push(box(140, 6, 2, 0, 15, D / 2 - 20 + 1, '#2f6fbf'));
  for (const x of [-100, 0, 100]) glass.push(box(34, 14, 4, x, 0, D / 2 - 20 + 2, '#ffffff', 3));
  // ~4.3 ha of rooftop solar panels (SM City Fairview's rooftop system covers 4.3 hectares)
  const solar = panels(270, 160, 0, H + 0.6, -20);
  plain.push(box(W - 6, 0.5, D - 6, 0, H, -20, '#9da3a8'));
  // parking in front with cars, trees along the road
  plain.push(box(W, 0.25, 64, 0, 0, D / 2 - 20 + 34, '#5a5f66'));
  const colours = ['#e8e8e8', '#1f2328', '#9aa0a6', '#b23a2a', '#2f5f8f', '#f1f1f1', '#3b4250'];
  let n = 0;
  for (let row = 0; row < 3; row++) {
    for (let x = -140; x <= 140; x += 9) {
      if ((x * 7 + row * 13) % 5 === 0) continue; // a few empty bays
      plain.push(...car(x, D / 2 - 20 + 12 + row * 17, colours[n++ % colours.length]));
    }
  }
  for (let x = -145; x <= 145; x += 22) plain.push(...tree(x, D / 2 - 20 + 70, 1.1));
  return { glass: merge(glass), solar, plain: merge(plain), w: W, d: D + 64, h: H + 2 };
}

export function buildFab(): BuildingParts {
  const plain: Geo[] = [];
  const [W, D, H] = [280, 170, 32];
  // cleanroom block with a darker band at each level
  plain.push(box(W, H, D, 0, 0, -10, '#eef1f3'));
  for (const y of [8, 18]) plain.push(box(W + 0.8, 1.2, D + 0.8, 0, y, -10, '#cfd6dc'));
  // roof plant: air handlers and exhaust stacks
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) plain.push(box(22, 6, 12, -105 + i * 30, H, -70 + j * 38, '#c4cad1'));
  for (let i = 0; i < 6; i++) plain.push(cylinder(2.2, 16, -100 + i * 40, 55, '#b8bfc7', H));
  // utility building, chemical and gas tanks
  plain.push(box(120, 20, 60, -60, 0, D / 2 + 34, '#d6dce2'));
  for (let i = 0; i < 6; i++) plain.push(cylinder(6, 18, 30 + i * 18, D / 2 + 30, '#e9edf0'));
  plain.push(box(W, 0.25, 120, 0, 0, D / 2 + 34, '#8e949b'));
  for (let x = -130; x <= 130; x += 26) plain.push(...tree(x, D / 2 + 98, 1.2));
  return { plain: merge(plain), w: W, d: D + 140, h: H + 16 };
}

/** curtain wall: glass with slim mullions and a spandrel at the floor line (one tile = one bay × one floor) */
export function glassTexture() {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#9fc3dd');
  grad.addColorStop(0.5, '#5f86a6');
  grad.addColorStop(1, '#3d5f7c');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#d9e2ea';
  g.fillRect(0, 0, 3, S);
  g.fillStyle = '#2b3a48';
  g.fillRect(0, S - 9, S, 9);
  // a plain corner for tops and bottoms
  g.fillStyle = '#c9d2da';
  g.fillRect(0, 0, 10, 10);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** rows of solar panels (4 m tile) */
export function panelTexture() {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#1d3554';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(150, 190, 235, 0.55)';
  g.lineWidth = 1;
  for (let x = 0; x <= S; x += 8) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, S * 0.8);
    g.stroke();
  }
  g.fillStyle = '#9da3a8';
  g.fillRect(0, S * 0.8, S, S * 0.2);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
