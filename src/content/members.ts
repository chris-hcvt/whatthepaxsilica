/**
 * Pax Silica Declaration signatories and joining dates, per the Wikipedia
 * membership list (accessed Nov 17, 2026). Other sources count 23–26
 * signatories depending on how they treat the Netherlands ("non-signing
 * partner"), the EU and observers, so the site always shows this caveat.
 */
export interface Member {
  iso3: string;
  name: string;
  date: string; // ISO date of signing/joining
  founding?: boolean;
  /** marker position for countries too small for the 1:110m outlines */
  marker?: [number, number];
}

export const MEMBERS: Member[] = [
  { iso3: 'USA', name: 'United States', date: '2025-12-12', founding: true },
  { iso3: 'AUS', name: 'Australia', date: '2025-12-12', founding: true },
  { iso3: 'ISR', name: 'Israel', date: '2025-12-12', founding: true },
  { iso3: 'JPN', name: 'Japan', date: '2025-12-12', founding: true },
  { iso3: 'KOR', name: 'South Korea', date: '2025-12-12', founding: true },
  { iso3: 'SGP', name: 'Singapore', date: '2025-12-12', founding: true, marker: [103.82, 1.35] },
  { iso3: 'GBR', name: 'United Kingdom', date: '2025-12-12', founding: true },
  { iso3: 'NLD', name: 'Netherlands', date: '2025-12-17' },
  { iso3: 'QAT', name: 'Qatar', date: '2026-01-13' },
  { iso3: 'ARE', name: 'United Arab Emirates', date: '2026-01-14' },
  { iso3: 'IND', name: 'India', date: '2026-02-20' },
  { iso3: 'SWE', name: 'Sweden', date: '2026-03-17' },
  { iso3: 'FIN', name: 'Finland', date: '2026-04-16' },
  { iso3: 'PHL', name: 'Philippines', date: '2026-04-17' },
  { iso3: 'NOR', name: 'Norway', date: '2026-05-06' },
  { iso3: 'DEU', name: 'Germany', date: '2026-06-23' },
  { iso3: 'GRC', name: 'Greece', date: '2026-06-23' },
  { iso3: 'ARG', name: 'Argentina', date: '2026-06-26' },
  { iso3: 'CHL', name: 'Chile', date: '2026-06-26' },
  { iso3: 'CRI', name: 'Costa Rica', date: '2026-06-26' },
  { iso3: 'SLV', name: 'El Salvador', date: '2026-06-26' },
  { iso3: 'KAZ', name: 'Kazakhstan', date: '2026-06-26' },
  { iso3: 'PAN', name: 'Panama', date: '2026-06-26' },
  { iso3: 'PRY', name: 'Paraguay', date: '2026-06-26' },
  { iso3: 'PRT', name: 'Portugal', date: '2026-06-26' },
  { iso3: 'ITA', name: 'Italy', date: '2026-07-31' },
];

/** Participants that have not signed as full members. */
export const OBSERVERS = [
  { iso3: 'TWN', name: 'Taiwan' },
  { iso3: 'CAN', name: 'Canada' },
];
