import type { SceneState } from '../three/engine';
import type { LL } from '../three/geo';

/** Language-independent structure of the scrolling story. Text lives in src/i18n/story-*.tsx. */

export type Chapter = 'basics' | 'plan' | 'size' | 'people' | 'proscons' | 'benefit' | 'next';
export const CHAPTERS: Chapter[] = ['basics', 'plan', 'size', 'people', 'proscons', 'benefit', 'next'];

export type StepKind = 'hero' | 'card' | 'full' | 'map';

export interface StepDef {
  id: string;
  chapter: Chapter | null;
  kind: StepKind;
  scene: SceneState;
  /** show the small Philippines inset map */
  inset?: boolean;
}

const site = (s: Omit<Extract<SceneState, { kind: 'site' }>, 'kind'>): SceneState => ({ kind: 'site', ...s });
/** behind full-width reading sections: the zone, slowly turning, dimmed by the page */
const AMBIENT: SceneState = site({ view: 'ambient', hub: true, wall: true, ncc: true, spin: true });

export const STEPS: StepDef[] = [
  { id: 'hero', chapter: null, kind: 'hero', scene: site({ view: 'hero', hub: true, wall: true, spin: true }) },
  { id: 'basics-1', chapter: 'basics', kind: 'card', inset: true, scene: site({ view: 'overview', hub: true, wall: true }) },
  { id: 'basics-2', chapter: 'basics', kind: 'card', inset: true, scene: site({ view: 'overview', hub: true, wall: true, fx: ['nccDraw'] }) },
  { id: 'plan-where', chapter: 'plan', kind: 'card', scene: site({ view: 'overview', hub: true, wall: true, ncc: true, fx: ['manila'] }) },
  { id: 'plan-what', chapter: 'plan', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, fx: ['icons'] }) },
  { id: 'plan-land', chapter: 'plan', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, ncc: true, fx: ['lease'] }) },
  { id: 'plan-status', chapter: 'plan', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, fx: ['unknowns'] }) },
  { id: 'size-number', chapter: 'size', kind: 'card', scene: site({ view: 'hubClose', hub: true, wall: true, fx: ['pitches'] }) },
  { id: 'size-flat', chapter: 'size', kind: 'card', scene: site({ view: 'compare', hub: true, flat: true }) },
  { id: 'size-compare', chapter: 'size', kind: 'card', scene: site({ view: 'compare', hub: true, flat: true, ref: true }) },
  { id: 'size-cities', chapter: 'size', kind: 'card', scene: site({ view: 'top', hub: true, flat: true, fx: ['makati'] }) },
  { id: 'size-map', chapter: 'size', kind: 'map', scene: site({ view: 'handoff', hub: true }) },
  { id: 'people-1', chapter: 'people', kind: 'card', scene: site({ view: 'communities', hub: true, wall: true, ncc: true, sitios: 'all', fx: ['rings'] }) },
  { id: 'people-2', chapter: 'people', kind: 'card', scene: site({ view: 'communities', hub: true, sitios: 'key', fx: ['river', 'farms'] }) },
  { id: 'people-numbers', chapter: 'people', kind: 'full', scene: AMBIENT },
  { id: 'proscons', chapter: 'proscons', kind: 'full', scene: AMBIENT },
  { id: 'benefit', chapter: 'benefit', kind: 'full', scene: AMBIENT },
  { id: 'next', chapter: 'next', kind: 'full', scene: AMBIENT },
];

export type RefKey = 'moa' | 'glorietta' | 'northedsa' | 'megamall' | 'smpampanga' | 'smclark' | 'bgc' | 'makaticbd' | 'ortigas';

/** Static copy of the figures in public/data/geo/site.json (areas in hectares, whole copies packed). */
export const REFS: Record<RefKey, { name: string; kind: 'mall' | 'district'; ha: number; packed: number; basis: 'osm' | 'roads' | 'square' }> = {
  moa: { name: 'SM Mall of Asia', kind: 'mall', ha: 19.7, packed: 48, basis: 'osm' },
  glorietta: { name: 'Glorietta', kind: 'mall', ha: 5.0, packed: 177, basis: 'osm' },
  northedsa: { name: 'SM North EDSA', kind: 'mall', ha: 15.4, packed: 52, basis: 'osm' },
  megamall: { name: 'SM Megamall', kind: 'mall', ha: 11.4, packed: 84, basis: 'osm' },
  smpampanga: { name: 'SM City Pampanga', kind: 'mall', ha: 24.7, packed: 35, basis: 'osm' },
  smclark: { name: 'SM City Clark', kind: 'mall', ha: 22.7, packed: 46, basis: 'osm' },
  bgc: { name: 'BGC', kind: 'district', ha: 240, packed: 1, basis: 'square' },
  makaticbd: { name: 'Makati CBD', kind: 'district', ha: 258.5, packed: 1, basis: 'roads' },
  ortigas: { name: 'Ortigas Center', kind: 'district', ha: 136.8, packed: 1, basis: 'roads' },
};

export const HUB_HA = 1619;

export const fitTimes = (k: RefKey) => {
  const r = FACT_RATIO(REFS[k].ha);
  return REFS[k].kind === 'district' ? r.toFixed(1) : String(Math.round(r));
};
const FACT_RATIO = (ha: number) => HUB_HA / ha;

/** Where each city preset lands: its main business district or downtown core. */
export const CITY_CENTRES: { id: string; ll: LL }[] = [
  { id: 'makati', ll: [121.0239, 14.5556] }, // Ayala Triangle
  { id: 'qc', ll: [121.0493, 14.6514] }, // Quezon Memorial Circle
  { id: 'manila', ll: [120.9838, 14.5989] }, // Quiapo
  { id: 'bgc', ll: [121.0493, 14.5512] }, // Bonifacio High Street
  { id: 'ortigas', ll: [121.0605, 14.5866] }, // Ortigas Center
  { id: 'cebu', ll: [123.9046, 10.3178] }, // Cebu Business Park
  { id: 'davao', ll: [125.6095, 7.0647] }, // San Pedro St. downtown
  { id: 'baguio', ll: [120.5975, 16.4125] }, // Session Road
  { id: 'iloilo', ll: [122.5737, 10.6926] }, // Plaza Libertad
  { id: 'cdo', ll: [124.6421, 8.4754] }, // Gaston Park / Divisoria
  { id: 'bacolod', ll: [122.9505, 10.6675] }, // Public Plaza
  { id: 'zamboanga', ll: [122.0764, 6.9054] }, // Plaza Pershing
  { id: 'tarlac', ll: [120.5881, 15.4877] }, // downtown Tarlac City
  { id: 'capas', ll: [120.4875, 15.3075] }, // the real site
];

export const CITY_STATS = { sanjuan: 581.7, mandaluyong: 1142.5, makati: 1815.2, updiliman: 501.0, rizalpark: 28.9 };
