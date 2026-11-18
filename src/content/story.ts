import type { SceneState } from '../three/engine';
import type { LL } from '../three/geo';

/** Language-independent structure of the scrolling story. Text lives in src/i18n/story-*.tsx. */

export type Chapter = 'basics' | 'plan' | 'size' | 'people' | 'power' | 'proscons' | 'benefit' | 'next';
export const CHAPTERS: Chapter[] = ['basics', 'plan', 'size', 'people', 'power', 'proscons', 'benefit', 'next'];

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
  { id: 'size-hectare', chapter: 'size', kind: 'card', scene: site({ view: 'hectare', hub: false, fx: ['hectare', 'court'] }) },
  { id: 'size-homes', chapter: 'size', kind: 'card', scene: site({ view: 'hectare', hub: false, fx: ['hectare', 'homes'] }) },
  { id: 'size-number', chapter: 'size', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, fx: ['grid'] }) },
  { id: 'size-flat', chapter: 'size', kind: 'card', scene: site({ view: 'compare', hub: true, flat: true }) },
  { id: 'size-compare', chapter: 'size', kind: 'card', scene: site({ view: 'compare', hub: true, flat: true, ref: true }) },
  { id: 'size-cities', chapter: 'size', kind: 'card', scene: site({ view: 'top', hub: true, flat: true, fx: ['makati'] }) },
  { id: 'size-map', chapter: 'size', kind: 'map', scene: site({ view: 'handoff', hub: true }) },
  { id: 'people-1', chapter: 'people', kind: 'card', scene: site({ view: 'communities', hub: true, wall: true, ncc: true, sitios: 'all', fx: ['rings'] }) },
  { id: 'people-2', chapter: 'people', kind: 'card', scene: site({ view: 'communities', hub: true, sitios: 'key', fx: ['river', 'farms'] }) },
  { id: 'people-numbers', chapter: 'people', kind: 'full', scene: AMBIENT },
  { id: 'power-ladder', chapter: 'power', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, fx: ['power'] }) },
  { id: 'power-supply', chapter: 'power', kind: 'card', scene: site({ view: 'solar', hub: true, ncc: true, fx: ['solar'] }) },
  { id: 'water-volume', chapter: 'power', kind: 'card', scene: site({ view: 'water', hub: false, fx: ['water'] }) },
  { id: 'water-supply', chapter: 'power', kind: 'card', scene: site({ view: 'hub', hub: true, wall: true, fx: ['river', 'reservoir'] }) },
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
  bgc: { name: 'BGC', kind: 'district', ha: 240, packed: 3, basis: 'square' },
  makaticbd: { name: 'Makati CBD', kind: 'district', ha: 258.5, packed: 4, basis: 'roads' },
  ortigas: { name: 'Ortigas Center', kind: 'district', ha: 136.8, packed: 8, basis: 'roads' },
};

export const HUB_HA = 1619;

/** one hectare = 10,000 square meters (a square 100 m on each side) */
export const HECTARE_M2 = 10_000;
/** a FIBA basketball court is 28 m × 15 m */
export const COURT_M2 = 28 * 15;
export const COURTS_PER_HECTARE = HECTARE_M2 / COURT_M2; // ≈ 23.8
export const HUB_COURTS = Math.round((HUB_HA * HECTARE_M2) / COURT_M2 / 100) * 100; // ≈ 38,500

export type HomeKey = 'regular' | 'medium' | 'large' | 'mansion';
export const HOME_KEYS: HomeKey[] = ['regular', 'medium', 'large', 'mansion'];
/**
 * Lot (land) size per home, in square meters, and how many such lots fit in one hectare (10,000 ÷ lot, rounded
 * down, not counting roads). Regular: minimum lot for a single-detached house in socialized housing (BP 220 rules).
 * Medium: minimum lot for a single-detached house in an open-market subdivision (PD 957 rules). Large and mansion:
 * round example sizes, not standards.
 */
export const HOME_LOTS: Record<HomeKey, { lot: number; perHectare: number; basis: 'bp220' | 'pd957' | 'example' }> = {
  regular: { lot: 64, perHectare: Math.floor(HECTARE_M2 / 64), basis: 'bp220' },
  medium: { lot: 120, perHectare: Math.floor(HECTARE_M2 / 120), basis: 'pd957' },
  large: { lot: 300, perHectare: Math.floor(HECTARE_M2 / 300), basis: 'example' },
  mansion: { lot: 1000, perHectare: Math.floor(HECTARE_M2 / 1000), basis: 'example' },
};

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

/* ---------- power & water ---------- */

/** Meralco's overall rate for a typical household, November 2026 (₱ per kWh) */
export const MERALCO_RATE = 15.551;
/** average hours in a month (8,760 ÷ 12) */
export const HOURS_PER_MONTH = 730;
/** BCDA: about 3 gigawatts at full development, a "conservative" first estimate */
export const HUB_GW = 3;
/** Luzon's forecast peak demand for 2026 (IEMOP), megawatts */
export const LUZON_PEAK_MW = 14_600;

export type EnergyKey = 'regular' | 'medium' | 'large' | 'mansion' | 'office' | 'mall' | 'fab' | 'hub';
export const ENERGY_KEYS: EnergyKey[] = ['regular', 'medium', 'large', 'mansion', 'office', 'mall', 'fab', 'hub'];
/**
 * Electricity per month (kWh), smallest to largest.
 * regular: Meralco's "typical household" (200 kWh). medium / large / mansion: example amounts.
 * office: a 50,000-square-meter office tower at Ayala Land's 2024 office average of 157 kWh per square meter a year.
 * mall: SM City Fairview, whose 5,960 MWh-a-year rooftop solar covers 11% of the mall's yearly use.
 * fab: one advanced chip factory (wafer fab), about 200 megawatts (Taipower), running all month.
 * hub: 3 gigawatts running all month.
 */
export const ENERGY: Record<EnergyKey, number> = {
  regular: 200,
  medium: 400,
  large: 800,
  mansion: 2_000,
  office: (50_000 * 157) / 12,
  mall: 5_960_000 / 0.11 / 12,
  fab: 200_000 * HOURS_PER_MONTH,
  hub: HUB_GW * 1_000_000 * HOURS_PER_MONTH,
};
export const billOf = (kwh: number) => kwh * MERALCO_RATE;
export const homesOf = (kwh: number) => kwh / ENERGY.regular;

/** water: BCDA's estimate, liters a day (and the highest reported estimate) */
export const WATER_MLD: [number, number] = [65, 90];
export const WATER_HIGH_MLD = 130;
/** one day of the upper BCDA figure, poured on one hectare: 90,000 cubic meters ÷ 10,000 square meters */
export const WATER_DAY_M = (WATER_MLD[1] * 1_000) / HECTARE_M2;
/** analysis: reservoirs of 390–780 hectares; solar farms of about 20,000 hectares for 2 gigawatts */
export const RESERVOIR_HA: [number, number] = [390, 780];
export const SOLAR_HA = 20_000;
