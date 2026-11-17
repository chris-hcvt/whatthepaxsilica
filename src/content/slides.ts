/** Language-independent slide order and the 3D/map scene each slide shows. */

export type MallKey = 'moa' | 'megamall' | 'northedsa' | 'smclark';

export type GlobePreset = {
  kind: 'globe';
  focus: [number, number]; // lon, lat to face the camera
  zoom?: number; // 1 = whole globe
  highlight: 'none' | 'members' | 'ph';
  spin?: boolean;
};

export type SitePreset = {
  kind: 'site';
  view: 'overview' | 'hub' | 'top' | 'communities' | 'malls';
  ncc?: boolean;
  hub?: boolean;
  wall?: boolean;
  sitios?: 'key' | 'all';
  malls?: boolean; // mall key comes from UI state
};

export type ScenePreset = GlobePreset | SitePreset | { kind: 'map' } | { kind: 'plain' };

export type Act = 'intro' | 'what' | 'ph' | 'size' | 'people' | 'who' | 'next';

export interface SlideDef {
  id: string;
  act: Act;
  scene: ScenePreset;
  /** layout: 'side' = text panel beside a 3D scene; 'wide' = text-first slide */
  layout: 'side' | 'wide' | 'hero';
}

const PH: [number, number] = [121.5, 13.5];

export const SLIDES: SlideDef[] = [
  { id: 'intro', act: 'intro', layout: 'hero', scene: { kind: 'globe', focus: [125, 12], highlight: 'none', spin: true } },
  { id: 'name', act: 'what', layout: 'side', scene: { kind: 'globe', focus: [10, 25], highlight: 'none', spin: true } },
  { id: 'launch', act: 'what', layout: 'side', scene: { kind: 'globe', focus: [-77, 30], highlight: 'none' } },
  { id: 'goals', act: 'what', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'members', act: 'what', layout: 'side', scene: { kind: 'globe', focus: [40, 25], highlight: 'members', spin: true } },
  { id: 'ph-joins', act: 'ph', layout: 'side', scene: { kind: 'globe', focus: PH, zoom: 1.7, highlight: 'ph' } },
  { id: 'paper-trail', act: 'ph', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'the-hub', act: 'ph', layout: 'side', scene: { kind: 'site', view: 'overview', ncc: true, hub: true, wall: true } },
  { id: 'specs', act: 'ph', layout: 'side', scene: { kind: 'site', view: 'hub', ncc: true, hub: true, wall: true } },
  { id: 'outline', act: 'size', layout: 'side', scene: { kind: 'site', view: 'top', ncc: true, hub: true, sitios: 'key' } },
  { id: 'malls', act: 'size', layout: 'side', scene: { kind: 'site', view: 'malls', hub: true, wall: true, malls: true } },
  { id: 'cities', act: 'size', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'drop', act: 'size', layout: 'side', scene: { kind: 'map' } },
  { id: 'communities', act: 'people', layout: 'side', scene: { kind: 'site', view: 'communities', ncc: true, hub: true, wall: true, sitios: 'all' } },
  { id: 'voices', act: 'people', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'numbers', act: 'people', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'offer', act: 'people', layout: 'side', scene: { kind: 'site', view: 'communities', hub: true, sitios: 'key' } },
  { id: 'two-sides', act: 'people', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'actors', act: 'who', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'gains', act: 'who', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'resources', act: 'who', layout: 'side', scene: { kind: 'site', view: 'overview', ncc: true, hub: true, wall: true } },
  { id: 'timeline', act: 'next', layout: 'wide', scene: { kind: 'plain' } },
  { id: 'unknowns', act: 'next', layout: 'side', scene: { kind: 'site', view: 'top', hub: true, ncc: true } },
  { id: 'sources', act: 'next', layout: 'wide', scene: { kind: 'plain' } },
];

/** Key numbers used across languages, kept in one place. */
export const FACTS = {
  hubHa: 1619,
  hubAcres: 4000,
  hubKm2: 16.2,
  nccHa: 9450,
  outlineHa: 1738,
  malls: { moa: 19.7, megamall: 11.4, northedsa: 15.4, smclark: 22.7 } as Record<MallKey, number>,
  /** whole copies packed inside the mapped outline by data-prep/pack_malls.py */
  mallsPacked: { moa: 48, megamall: 84, northedsa: 52, smclark: 46 } as Record<MallKey, number>,
  cities: { sanjuan: 581.7, mandaluyong: 1142.5, makati: 1815.2, pasay: 3413.6, updiliman: 501.0, rizalpark: 28.9 },
};

export const timesFit = (areaHa: number) => Math.round(FACTS.hubHa / areaHa);
