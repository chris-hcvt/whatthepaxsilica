export type LL = [number, number];
export type BBox = [number, number, number, number]; // west, south, east, north

export interface Sitio {
  name: string;
  lonlat: LL;
  insideHub: boolean;
  metersToHubEdge: number;
  barangay?: string;
  people?: string;
}

export interface MallData {
  name: string;
  city: string;
  area_ha: number;
  placements?: [number, number, number][];
  geom: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}

export interface SiteData {
  meta: Record<string, unknown>;
  scene: { bbox: BBox; dem: { nx: number; ny: number; scale: number; min: number; max: number } };
  hub: LL[];
  ncc: LL[];
  sitios: Sitio[];
  malls: Record<string, MallData>;
  comparatorsHa: Record<string, number>;
}

/** Simple local equirectangular projection in kilometres (x = east, z = south). */
export class LocalProj {
  readonly lon0: number;
  readonly lat0: number;
  readonly kx: number;
  readonly ky = 110.574;
  constructor(bbox: BBox) {
    this.lon0 = (bbox[0] + bbox[2]) / 2;
    this.lat0 = (bbox[1] + bbox[3]) / 2;
    this.kx = 111.32 * Math.cos((this.lat0 * Math.PI) / 180);
  }
  x(lon: number) {
    return (lon - this.lon0) * this.kx;
  }
  z(lat: number) {
    return -(lat - this.lat0) * this.ky;
  }
  xz([lon, lat]: LL): [number, number] {
    return [this.x(lon), this.z(lat)];
  }
}

export function pointInRing(x: number, y: number, ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function ringCentroid(ring: [number, number][]): [number, number] {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

/** Outer ring of the largest polygon in a GeoJSON Polygon/MultiPolygon. */
export function outerRing(geom: MallData['geom']): LL[] {
  if (geom.type === 'Polygon') return (geom.coordinates as number[][][])[0] as LL[];
  const polys = geom.coordinates as number[][][][];
  let best = polys[0][0];
  let bestLen = 0;
  for (const p of polys) {
    if (p[0].length > bestLen) {
      best = p[0];
      bestLen = p[0].length;
    }
  }
  return best as LL[];
}

/** Move a lon/lat ring so its centroid sits on `to`, preserving its true ground size. */
export function translateRing(ring: LL[], to: LL): LL[] {
  const [clon, clat] = ringCentroid(ring as [number, number][]);
  const kx0 = 111320 * Math.cos((clat * Math.PI) / 180);
  const kx1 = 111320 * Math.cos((to[1] * Math.PI) / 180);
  const ky = 110574;
  return ring.map(([lon, lat]) => {
    const dx = (lon - clon) * kx0;
    const dy = (lat - clat) * ky;
    return [to[0] + dx / kx1, to[1] + dy / ky] as LL;
  });
}
