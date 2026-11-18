// Regression test for every derived power & water number (and the hectare comparisons).
// Bundles src/content/power.ts with esbuild (already installed with Vite), then re-computes each value by hand.
// Run: npm run check:numbers
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'numbers-'));
const out = join(dir, 'content.mjs');
await build({ entryPoints: ['src/content/story.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const P = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

let failed = 0;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const eq = (name, got, want, tol) => {
  const ok = Array.isArray(want) ? want.every((w, i) => near(got[i], w, tol)) : near(got, want, tol);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : `  (expected ${JSON.stringify(want)})`}`);
};

// electricity
eq('Meralco rate (₱/kWh, Nov 2026)', P.MERALCO_RATE, 15.551);
eq('hours per month', P.HOURS_PER_MONTH, 8760 / 12);
eq('regular home kWh', P.ENERGY.regular, 200);
eq('office kWh/month = 50,000 × 157 ÷ 12', P.ENERGY.office, 654166.6666666666);
eq('mall kWh/month = 5,960,000 ÷ 0.11 ÷ 12', P.ENERGY.mall, 4515151.515151515);
eq('fab kWh/month = 200,000 × 730', P.ENERGY.fab, 146e6);
eq('zone kWh/month = 3,000,000 × 730', P.ENERGY.hub, 2.19e9);
eq('regular bill = 200 × 15.551', P.billOf(200), 3110.2);
eq('zone bill = 2.19e9 × 15.551', P.billOf(P.ENERGY.hub), 34056690000, 1e-12);
eq('zone in typical homes', P.homesOf(P.ENERGY.hub), 10.95e6);
eq('zone share of Luzon peak = 3,000 ÷ 14,600', P.HUB_SHARE_OF_LUZON_PEAK, 0.2054794520547945);
eq('zone TWh a year = 3 GW × 8,760 h', P.HUB_TWH_YEAR, 26.28);

// solar
eq('capacity factor MOA = 3,000 MWh ÷ (2 MW × 8,760 h)', P.SOLAR_CF[0], 3000 / (2 * 8760));
eq('capacity factor Fairview = 5,960 ÷ (3.785 × 8,760)', P.SOLAR_CF[1], 5960 / (3.785 * 8760));
eq('hectares per MW (MTerra 3,500 ha ÷ 3,500 MWp)', P.HA_PER_MW, 1);
eq('ACWA average MW = 500 × CF', P.ACWA_AVG_MW, [500 * 3000 / 17520, 500 * 5960 / (3.785 * 8760)]);
eq('ACWA share of 3 GW (≈3%)', P.ACWA_SHARE.map((x) => Math.round(x * 1000) / 10), [2.9, 3]);
const cfF = 5960 / (3.785 * 8760), cfM = 3000 / (2 * 8760);
eq('solar land for 2 GW round-the-clock (ha) = 2,000 ÷ CF × 1 ha/MW', P.BENCH_SOLAR_HA.map(Math.round), [Math.round(2000 / cfF), Math.round(2000 / cfM)]);
eq('  …which is about 11,100–11,700 ha', P.BENCH_SOLAR_HA.map((x) => Math.round(x / 100) * 100), [11100, 11700]);
eq('solar land for 3 GW round-the-clock (ha)', P.solarLandHa(3000).map(Math.round), [Math.round(3000 / cfF), Math.round(3000 / cfM)]);

// water
eq('depth per day on 1 ha (m): 65 / 90 / 130', [65, 90, 130].map(P.depthPerDay), [6.5, 9, 13]);
eq('week depth (m) at 90', P.depthPerDay(90) * P.DAYS_WEEK, 63);
eq('month depth (m) at 90', P.depthPerDay(90) * P.DAYS_MONTH, 270);
eq('month depth (m) at 65 / 130', [65, 130].map((m) => P.depthPerDay(m) * 30), [195, 390]);
eq('Olympic pools: 65 / 90 / 130', [65, 90, 130].map(P.poolsOf), [26, 36, 52]);
eq('households at 200 L/day for 130 million L', P.householdsOf(130), 650000);
eq('shortfall at 130 vs reservoirs 65–120', P.shortfall(130), [10, 65]);
eq('shortfall at 90 vs reservoirs 65–120', P.shortfall(90), [0, 25]);
eq('reservoir reconstruction (ha) = 19.5 million m³ ÷ 5 or 2.5 m', P.RECON_RESERVOIR_HA, [390, 780]);
eq('new water with recycling at 130 (million L/day)', P.newWaterWithRecycling(130), [6.5, 19.5]);
eq('new water with recycling at 90 (million L/day)', P.newWaterWithRecycling(90), [4.5, 13.5]);

// hectare comparisons used earlier in the story
eq('basketball courts per hectare = 10,000 ÷ 420', P.COURTS_PER_HECTARE, 10000 / 420);
eq('basketball courts in 1,619 ha (rounded to 100)', P.HUB_COURTS, 38500);
eq('regular homes per hectare = ⌊10,000 ÷ 64⌋', P.HOME_LOTS.regular.perHectare, 156);

console.log(failed ? `\n${failed} check(s) failed` : '\nall numbers check out');
process.exit(failed ? 1 : 0);
