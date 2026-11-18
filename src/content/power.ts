/**
 * Power & water: every input with its source, and every derived number as a formula.
 * The story cards, the 3D scenes and the full report all read from here, and
 * scripts/check-numbers.mjs re-computes each derived value as a regression test.
 *
 * Kinds of numbers (kept apart in the copy):
 *  - "estimate"  official planning figure (BCDA), not a measurement
 *  - "measured"  reported real-world figure (a utility bill rate, a running solar plant)
 *  - "scenario"  independent analysis or our own illustrative arithmetic
 */

const HECTARE_M2 = 10_000;

/* ---------- inputs ---------- */

/** BCDA estimate of the zone's power demand at full development (MW). A demand estimate, not measured use. [gma-3gw] */
export const HUB_MW = 3_000;
export const HUB_GW = HUB_MW / 1000;
/** average hours in a month: 8,760 ÷ 12 */
export const HOURS_PER_MONTH = 730;
/** Meralco overall rate for a typical household, November 2026 (₱ per kWh). [meralco-nov] */
export const MERALCO_RATE = 15.551;
/** Luzon's forecast peak demand for 2026 (MW). [iemop] */
export const LUZON_PEAK_MW = 14_600;

/** comparison inputs */
export const TYPICAL_HOME_KWH = 200; // Meralco's "typical household" (kWh a month) [meralco-nov]
export const OFFICE_M2 = 50_000; // an office tower's leased floor area (illustrative)
export const OFFICE_KWH_M2_YEAR = 157; // Ayala Land offices, 2024, per m² of occupied leased area [ayala-offices]
export const FAIRVIEW_SOLAR_MWH_YEAR = 5_960; // SM City Fairview rooftop solar, expected output [sm-fairview]
export const FAIRVIEW_SOLAR_SHARE = 0.11; // ... = 11% of the mall's yearly use [sm-fairview]
export const FAIRVIEW_SOLAR_KWP = 3_785; // its peak rating [sm-fairview]
export const MOA_SOLAR_MWH_YEAR = 3_000; // SM Mall of Asia rooftop solar, expected output [moa-solar]
export const MOA_SOLAR_KWP = 2_000; // its peak rating [moa-solar]
export const FAB_MW = 200; // one advanced wafer fab (Taipower) [fab-power]

export type EnergyKey = 'regular' | 'medium' | 'large' | 'mansion' | 'office' | 'mall' | 'fab' | 'hub';
export const ENERGY_KEYS: EnergyKey[] = ['regular', 'medium', 'large', 'mansion', 'office', 'mall', 'fab', 'hub'];
/** window event the 3D "add the next building" tag fires, with the key as `detail`; the story sets the picker */
export const ENERGY_EVENT = 'pax:energy';
/**
 * Electricity per month (kWh), smallest to largest.
 *  regular  Meralco's typical household
 *  medium / large / mansion  example amounts (2×, 4×, 10× a typical home)
 *  office   OFFICE_M2 × OFFICE_KWH_M2_YEAR ÷ 12
 *  mall     FAIRVIEW_SOLAR_MWH_YEAR ÷ FAIRVIEW_SOLAR_SHARE × 1,000 ÷ 12
 *  fab      FAB_MW × 1,000 × HOURS_PER_MONTH            (running nonstop)
 *  hub      HUB_MW × 1,000 × HOURS_PER_MONTH            (running nonstop: an upper-bound illustration)
 */
export const ENERGY: Record<EnergyKey, number> = {
  regular: TYPICAL_HOME_KWH,
  medium: 400,
  large: 800,
  mansion: 2_000,
  office: (OFFICE_M2 * OFFICE_KWH_M2_YEAR) / 12,
  mall: ((FAIRVIEW_SOLAR_MWH_YEAR / FAIRVIEW_SOLAR_SHARE) * 1000) / 12,
  fab: FAB_MW * 1000 * HOURS_PER_MONTH,
  hub: HUB_MW * 1000 * HOURS_PER_MONTH,
};
/** illustrative bill: kWh × the household rate (big users pay less per kWh) */
export const billOf = (kwh: number) => kwh * MERALCO_RATE;
export const homesOf = (kwh: number) => kwh / TYPICAL_HOME_KWH;
/** 3 GW as a share of Luzon's forecast peak demand */
export const HUB_SHARE_OF_LUZON_PEAK = HUB_MW / LUZON_PEAK_MW;
/** a year of 3 GW nonstop, in terawatt-hours */
export const HUB_TWH_YEAR = (HUB_MW * 8_760) / 1_000_000;

/* ---------- power supply ---------- */

/** ACWA Power: lease (June 2026) for a solar + battery project of up to 500 MW on 500 hectares; not built. [acwa-lease] */
export const ACWA_MW = 500;
export const ACWA_HA = 500;
/** BCDA is assessing a 40 MW LNG plant for New Clark City (Nov 2026). [lng-40mw] */
export const BCDA_LNG_STUDY_MW = 40;
/** Philippine solar capacity factors from two running rooftop systems: MOA 17.1%, Fairview 18.0% */
export const SOLAR_CF: [number, number] = [MOA_SOLAR_MWH_YEAR / (MOA_SOLAR_KWP / 1000) / 8_760, FAIRVIEW_SOLAR_MWH_YEAR / (FAIRVIEW_SOLAR_KWP / 1000) / 8_760];
/** land per MW of solar panels: MTerra Solar, 3,500 MWp on about 3,500 hectares (ACWA: up to 500 MW on 500 ha). [mterra] */
export const MTERRA_MWP = 3_500;
export const MTERRA_HA = 3_500;
export const HA_PER_MW = MTERRA_HA / MTERRA_MWP;
/** average output of ACWA's 500 MW, and its share of 3 GW: ACWA_MW × capacity factor */
export const ACWA_AVG_MW: [number, number] = [ACWA_MW * SOLAR_CF[0], ACWA_MW * SOLAR_CF[1]];
export const ACWA_SHARE: [number, number] = [ACWA_AVG_MW[0] / HUB_MW, ACWA_AVG_MW[1] / HUB_MW];
/** panels needed for an average (round-the-clock) supply: average MW ÷ capacity factor; land = that × HA_PER_MW */
export const solarPanelsMW = (avgMW: number): [number, number] => [avgMW / SOLAR_CF[1], avgMW / SOLAR_CF[0]];
export const solarLandHa = (avgMW: number): [number, number] => solarPanelsMW(avgMW).map((mw) => mw * HA_PER_MW) as [number, number];
/** the independent analysis's mix: 2 GW from solar + 1 GW LNG; it puts the solar land at about 20,000 ha. [mendoza] */
export const SCENARIO_SOLAR_MW = 2_000;
export const SCENARIO_LNG_MW = 1_000;
export const ANALYSIS_SOLAR_HA = 20_000;
/** our benchmark estimate for the same 2 GW of round-the-clock solar (batteries' own losses and land not included) */
export const BENCH_SOLAR_HA = solarLandHa(SCENARIO_SOLAR_MW);
/** …as a multiple of the zone's official 1,619 hectares */
export const ZONE_HA = 1_619;
export const BENCH_SOLAR_TIMES_ZONE: [number, number] = [BENCH_SOLAR_HA[0] / ZONE_HA, BENCH_SOLAR_HA[1] / ZONE_HA];

/** the gap: what is lined up, averaged over day and night, against the 3 GW BCDA expects */
export const LINED_UP_MW: [number, number] = [ACWA_AVG_MW[0] + BCDA_LNG_STUDY_MW, ACWA_AVG_MW[1] + BCDA_LNG_STUDY_MW];
export const GAP_SHARE: [number, number] = [1 - LINED_UP_MW[1] / HUB_MW, 1 - LINED_UP_MW[0] / HUB_MW];

/* ---------- water ---------- */

/** BCDA estimate: 65–90 million liters a day [tribune-water]; highest reported estimate 130 [scienceph] */
export const WATER_MLD_BCDA: [number, number] = [65, 90];
export const WATER_MLD_HIGH = 130;
export type WaterKey = 'low' | 'high' | 'max';
export const WATER_KEYS: WaterKey[] = ['low', 'high', 'max'];
export const WATER_MLD: Record<WaterKey, number> = { low: WATER_MLD_BCDA[0], high: WATER_MLD_BCDA[1], max: WATER_MLD_HIGH };
/** depth on one hectare: million liters × 1,000 m³ ÷ 10,000 m² */
export const depthPerDay = (mld: number) => (mld * 1000) / HECTARE_M2;
export const DAYS_WEEK = 7;
export const DAYS_MONTH = 30;
/** Olympic pool = 50 × 25 × 2 m = 2,500 m³ = 2.5 million liters (BCDA: 90 million ≈ 36 pools) */
export const POOL_ML = 2.5;
export const poolsOf = (mld: number) => mld / POOL_ML;
/** households at 200 liters a day each (Science.ph's assumption) */
export const HOUSEHOLD_L_DAY = 200;
export const householdsOf = (mld: number) => (mld * 1_000_000) / HOUSEHOLD_L_DAY;

/** BCDA (preliminary, dry-season): the Bangut River alone 130–200 million liters a day [tribune-water] */
export const BANGUT_MLD: [number, number] = [130, 200];
/** Science.ph: reservoirs supplying 65–120 million liters a day; shortfall = demand − reservoir supply */
export const RESERVOIR_SUPPLY_MLD: [number, number] = [65, 120];
export const shortfall = (demandMld: number): [number, number] => [
  Math.max(0, demandMld - RESERVOIR_SUPPLY_MLD[1]),
  Math.max(0, demandMld - RESERVOIR_SUPPLY_MLD[0]),
];
/** independent analysis: 39 billion liters a year; reservoirs of 390–780 hectares [mendoza] */
export const ANALYSIS_WATER_L_YEAR = 39e9;
export const RESERVOIR_HA: [number, number] = [390, 780];
/** our reconstruction (the analysis does not publish its method): half a year of demand stored 2.5–5 m deep */
export const RECON_STORAGE_M3 = ANALYSIS_WATER_L_YEAR / 1000 / 2;
export const RECON_DEPTH_M: [number, number] = [5, 2.5];
export const RECON_RESERVOIR_HA: [number, number] = [RECON_STORAGE_M3 / RECON_DEPTH_M[0] / HECTARE_M2, RECON_STORAGE_M3 / RECON_DEPTH_M[1] / HECTARE_M2];
/** recycling (zero liquid discharge) recovering 85–95% [mendoza]: new water = demand × (1 − recovery) */
export const ZLD_RECOVERY: [number, number] = [0.85, 0.95];
export const newWaterWithRecycling = (mld: number): [number, number] => [mld * (1 - ZLD_RECOVERY[1]), mld * (1 - ZLD_RECOVERY[0])];
/** Maynilad–K-Water New Clark City water system: from about 20 to 150–200 million liters a day, whole city [maynilad] */
export const NCC_WATER_NOW_MLD = 20;
export const NCC_WATER_PLANNED_MLD: [number, number] = [150, 200];
