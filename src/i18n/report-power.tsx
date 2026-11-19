import type { ReactNode } from 'react';
import type { SlideText } from './types';
import { Cite, DataTable, Note, Stat, StatGrid } from '../components/bits';
import { bigNum } from './fmt';
import {
  ACWA_AVG_MW,
  ACWA_MW,
  BCDA_LNG_STUDY_MW,
  BENCH_SOLAR_HA,
  BENCH_SOLAR_TIMES_ZONE,
  DAYS_MONTH,
  DAYS_WEEK,
  ENERGY,
  ENERGY_KEYS,
  GAP_SHARE,
  HUB_MW,
  HUB_SHARE_OF_LUZON_PEAK,
  LINED_UP_MW,
  HUB_TWH_YEAR,
  NCC_WATER_NOW_MLD,
  NCC_WATER_PLANNED_MLD,
  RESERVOIR_SUPPLY_MLD,
  WATER_KEYS,
  WATER_MLD,
  billOf,
  depthPerDay,
  jugsOf,
  jugStackM,
  JUG_H_M,
  JUG_W_M,
  JUGS_PER_LAYER_HA,
  homesOf,
  householdsOf,
  newWaterWithRecycling,
  poolsOf,
  shortfall,
  solarLandHa,
  solarPanelsMW,
  type EnergyKey,
  type WaterKey,
} from '../content/power';

/** Report sections for the "Power and water" part, in English and Tagalog. All figures come from content/power.ts. */

const big = (n: number, million: string, billion: string) => {
  const trim = (s: string) => s.replace(/\.0$/, '');
  if (n >= 1e9) return `${trim((n / 1e9).toFixed(n >= 1e10 ? 1 : 2))} ${billion}`;
  if (n >= 1e6) return `${trim((n / 1e6).toFixed(n >= 1e8 ? 0 : 1))} ${million}`;
  return (n >= 1e5 ? Math.round(n / 1000) * 1000 : Math.round(n)).toLocaleString('en-US');
};
const homes = (n: number, million: string) => (n >= 1e6 ? `${Math.round(n / 1e6)} ${million}` : n >= 1000 ? (Math.round(n / 100) * 100).toLocaleString('en-US') : String(Math.round(n)));
const range = ([a, b]: [number, number] | number[], step: number) => `${(Math.round(a / step) * step).toLocaleString('en-US')}–${(Math.round(b / step) * step).toLocaleString('en-US')}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const tag = (kind: 'official' | 'study' | 'scenario' | 'ours', text: ReactNode) => <span className={`tag ${kind}`}>{text}</span>;

interface Words {
  million: string;
  billion: string;
  energyNames: Record<EnergyKey, string>;
  waterWho: Record<WaterKey, ReactNode>;
}

const EN: Words = {
  million: 'million',
  billion: 'billion',
  energyNames: {
    regular: 'Regular home (Meralco’s typical household)',
    medium: 'Medium home (example)',
    large: 'Large home (example)',
    mansion: 'Mansion (example)',
    office: 'Office tower, 50,000 m² of leased offices',
    mall: 'Big mall (SM City Fairview)',
    fab: 'Advanced chip factory (one wafer fab)',
    hub: 'The zone at 3 gigawatts, nonstop',
  },
  waterWho: { low: 'BCDA, low end', high: 'BCDA, high end', max: 'Science.ph, highest estimate' },
};

const TL: Words = {
  million: 'milyon',
  billion: 'bilyon',
  energyNames: {
    regular: 'Karaniwang bahay (ayon sa Meralco)',
    medium: 'Katamtamang bahay (halimbawa)',
    large: 'Malaking bahay (halimbawa)',
    mansion: 'Mansyon (halimbawa)',
    office: 'Office tower, 50,000 m² na inuupahang opisina',
    mall: 'Malaking mall (SM City Fairview)',
    fab: 'Modernong pabrika ng chips (isang wafer fab)',
    hub: 'Ang zone sa 3 gigawatt, tuloy-tuloy',
  },
  waterWho: { low: 'BCDA, pinakamababa', high: 'BCDA, pinakamataas', max: 'Science.ph, pinakamataas na tantiya' },
};

const energyRows = (w: Words) =>
  ENERGY_KEYS.map((k) => [
    w.energyNames[k],
    `${big(ENERGY[k], w.million, w.billion)} kWh`,
    <>
      ₱{big(billOf(ENERGY[k]), w.million, w.billion)}
      {k === 'hub' ? '*' : ''}
    </>,
    homes(homesOf(ENERGY[k]), w.million),
  ]);

const waterRows = (w: Words) =>
  WATER_KEYS.map((k) => {
    const mld = WATER_MLD[k];
    return [
      <>
        {mld} {w.million}
      </>,
      w.waterWho[k],
      String(poolsOf(mld)),
      `${depthPerDay(mld)} m`,
      `${depthPerDay(mld) * DAYS_WEEK} m`,
      `${depthPerDay(mld) * DAYS_MONTH} m`,
    ];
  });

/** the same amounts in 5-gallon jugs, stacked on one hectare */
const jugRows = (w: Words) =>
  WATER_KEYS.map((k) => {
    const mld = WATER_MLD[k];
    return [
      <>
        {mld} {w.million}
      </>,
      bigNum(jugsOf(mld), w.million, w.billion),
      `${jugStackM(mld, 1)} m`,
      `${jugStackM(mld, DAYS_WEEK)} m`,
      `${jugStackM(mld, DAYS_MONTH)} m`,
    ];
  });

const shortfallRows = (w: Words, label: Record<WaterKey, ReactNode>) =>
  WATER_KEYS.map((k) => {
    const [a, b] = shortfall(WATER_MLD[k]);
    return [label[k], `${RESERVOIR_SUPPLY_MLD[0]}–${RESERVOIR_SUPPLY_MLD[1]} ${w.million}`, a === b ? `${a}` : `${a}–${b} ${w.million}`];
  });

export const powerSlidesEn: Record<string, SlideText> = {
  electricity: {
    kicker: 'Estimates, not measurements',
    title: 'How much electricity is 3 gigawatts?',
    body: (
      <>
        <StatGrid>
          <Stat value="3 GW" label="BCDA’s estimate of the zone’s power demand at full development, which it calls conservative" cite="gma-3gw" tone="amber" />
          <Stat value={`≈ ${pct(HUB_SHARE_OF_LUZON_PEAK)}`} label="of Luzon’s forecast 2026 peak demand (about 14,600 MW)" cite="iemop" tone="amber" />
          <Stat value={`${HUB_TWH_YEAR.toFixed(1)} TWh`} label="a year, if it drew 3 GW every hour (3 GW × 8,760 hours)" />
        </StatGrid>
        <DataTable
          head={['', 'Electricity a month', 'Bill at household rate', 'Typical homes']}
          num={[1, 2, 3]}
          emphasis={7}
          rows={energyRows(EN)}
          caption={
            <>
              * An illustration at Meralco’s November 2026 household rate (₱15.5510 per kWh), not the zone’s actual industrial bill; big users pay less
              per kWh. “Typical homes” = kWh ÷ 200.
              <Cite s="meralco-nov" />
            </>
          }
        />
        <ul className="calc">
          <li>The zone: 3,000,000 kW × 730 hours (8,760 ÷ 12) = 2.19 billion kWh a month; × ₱15.5510 = ₱34.1 billion.</li>
          <li>
            Office tower: 50,000 m² × 157 kWh per m² a year (Ayala Land’s 2024 office average, per m² of occupied leased area) ÷ 12 = 654,000 kWh.
            <Cite s="ayala-offices" />
          </li>
          <li>
            Mall: SM City Fairview’s rooftop solar makes 5,960 MWh a year, which SM says is 11% of the mall’s use: 5,960 ÷ 0.11 ÷ 12 ≈ 4.5 million kWh.
            <Cite s="sm-fairview" />
          </li>
          <li>
            Chip factory: about 200 MW for each advanced wafer factory (Taipower) × 730 hours = 146 million kWh.
            <Cite s="fab-power" />
          </li>
          <li>Homes: 200 kWh is Meralco’s typical household; 400, 800 and 2,000 kWh are example amounts.</li>
        </ul>
        <Note>
          3 gigawatts is a planning estimate of demand, not measured use. The monthly figure assumes the zone draws 3 gigawatts every hour, an
          upper-end illustration; actual use would depend on how much is built and how hard it runs.
        </Note>
      </>
    ),
  },
  'power-sources': {
    kicker: 'Signed, under study, or a scenario',
    title: 'How could they power it?',
    body: (
      <>
        <p>
          <b>What is lined up against 3 gigawatts, averaged over day and night</b>
        </p>
        <DataTable
          head={['', 'Average power', 'Share of 3 GW']}
          num={[1, 2]}
          emphasis={2}
          rows={[
            ['ACWA Power solar + batteries (lease signed, not built)', `${range(ACWA_AVG_MW, 1)} MW`, `${(ACWA_AVG_MW[0] / HUB_MW * 100).toFixed(1)}–${(ACWA_AVG_MW[1] / HUB_MW * 100).toFixed(1)}%`],
            ['Gas (LNG) plant for New Clark City (under study)', `${BCDA_LNG_STUDY_MW} MW`, `${(BCDA_LNG_STUDY_MW / HUB_MW * 100).toFixed(1)}%`],
            ['No published plan yet', `≈ ${range([HUB_MW - LINED_UP_MW[1], HUB_MW - LINED_UP_MW[0]], 10)} MW`, `≈ ${pct(GAP_SHARE[0])}`],
          ]}
          caption={`ACWA: ${ACWA_MW} MW peak × capacity factor 17.1–18.0%. The gas plant is counted as if it ran nonstop. The story shows this as a glass gauge rising from the zone.`}
        />
        <DataTable
          head={['Option', 'Size', 'Status', 'Kind']}
          rows={[
            [
              'ACWA Power solar + battery storage, New Clark City',
              <>
                up to {ACWA_MW} MW peak (≈ {range(ACWA_AVG_MW, 1)} MW averaged over day and night), 500 hectares
              </>,
              <>
                Land lease signed June 2026; size “at full build-out”. No construction reported.
                <Cite s={['acwa-lease', 'gma-dedicated']} />
              </>,
              tag('official', 'Signed lease'),
            ],
            [
              'A dedicated power plant for Pax Silica',
              'not stated',
              <>
                Being studied by the project’s proponents (Aug 2026).
                <Cite s="gma-dedicated" />
              </>,
              tag('study', 'Under study'),
            ],
            [
              'Gas (LNG) plant for New Clark City',
              `${BCDA_LNG_STUDY_MW} MW`,
              <>
                BCDA signed agreements to assess its feasibility (Nov 2026).
                <Cite s="lng-40mw" />
              </>,
              tag('study', 'Under study'),
            ],
            [
              '2 GW of solar + a 1 GW LNG plant',
              '3 GW',
              <>
                An independent analysis (Dr. Teodoro C. Mendoza, Philippine Daily Inquirer).
                <Cite s="mendoza" />
              </>,
              tag('scenario', 'Scenario'),
            ],
            [
              'Nuclear',
              '1 GW, about US$6–10 billion',
              <>
                Discussed by Science.ph; no plan.
                <Cite s="scienceph" />
              </>,
              tag('scenario', 'Scenario'),
            ],
          ]}
        />
        <div className="defs">
          <div>
            <b>Peak (installed) capacity</b>What solar panels make in full sun, in MW. ACWA’s {ACWA_MW} MW is this kind.
          </div>
          <div>
            <b>Average generation</b>What they actually make across days and nights: peak × capacity factor (17.1–18.0% for two Philippine rooftop
            systems). {ACWA_MW} MW → about {range(ACWA_AVG_MW, 1)} MW on average.
          </div>
          <div>
            <b>Battery storage</b>Moves daytime solar power to the night. It adds no energy, and some is lost.
          </div>
          <div>
            <b>Reliable continuous supply</b>Power available every hour, which a 3 GW factory zone needs. With solar this takes several times more
            panels plus batteries; otherwise it comes from gas, geothermal, nuclear or the grid.
          </div>
        </div>
        <p>
          <b>How much land would round-the-clock solar need?</b>
        </p>
        <DataTable
          head={['Scenario', 'Average power', 'Panels needed', 'Land']}
          num={[1, 2, 3]}
          rows={[
            ['2 GW (the analysis’s solar share)', '2,000 MW', `${range(solarPanelsMW(2000), 100)} MW`, `${range(BENCH_SOLAR_HA, 100)} ha`],
            ['All 3 GW from solar', '3,000 MW', `${range(solarPanelsMW(3000), 100)} MW`, `${range(solarLandHa(3000), 100)} ha`],
            ['The analysis’s own figure for 2 GW', '2,000 MW', 'not published', '≈ 20,000 ha'],
          ]}
          caption="Panels = average power ÷ capacity factor (0.171–0.180). Land = panels × 1 hectare per MW. Battery losses and battery land are not included."
        />
        <ul className="calc">
          <li>
            Capacity factor: SM Mall of Asia’s rooftop solar, 3,000 MWh a year ÷ (2 MW × 8,760 hours) = 17.1%; SM City Fairview’s, 5,960 ÷ (3.785 ×
            8,760) = 18.0%. Large ground-mounted farms may do somewhat better, which would need less land.
            <Cite s={['moa-solar', 'sm-fairview']} />
          </li>
          <li>
            Land per MW: MTerra Solar has 3,500 MW of panels on about 3,500 hectares; ACWA leases 500 hectares for up to 500 MW → about 1 hectare per MW.
            <Cite s={['mterra', 'acwa-lease']} />
          </li>
          <li>
            2 GW of round-the-clock solar is about {Math.round(BENCH_SOLAR_TIMES_ZONE[0])} times the zone’s 1,619 hectares, spread over Central Luzon. No
            sites have been chosen; these are size comparisons, not proposed locations.
          </li>
        </ul>
        <Note>No published plan yet covers the full 3 gigawatts.</Note>
      </>
    ),
  },
  'water-amount': {
    kicker: 'Estimates for full development',
    title: '65–90 million liters of water a day',
    body: (
      <>
        <DataTable
          head={['Liters a day', 'Who says', 'Olympic pools', 'On 1 hectare: a day', 'a week', 'a month']}
          num={[2, 3, 4, 5]}
          rows={waterRows(EN)}
          caption="Depth = million liters × 1,000 m³ ÷ 10,000 m². A week = 7 days, a month = 30. An Olympic pool holds 2.5 million liters."
        />
        <DataTable
          head={['Liters a day', '5-gallon jugs a day', 'Jugs on 1 hectare: a day', 'a week', 'a month']}
          num={[1, 2, 3, 4]}
          rows={jugRows(EN)}
          caption={`A 5-gallon jug holds 18.9 liters (5 US gallons). A round jug is about ${JUG_W_M * 100} cm wide and ${JUG_H_M * 100} cm tall, so ${JUGS_PER_LAYER_HA.toLocaleString('en-US')} stand on one hectare (370 × 370), ${JUG_H_M} m to a layer. Jugs leave gaps, so the stack is about twice the height of the water alone.`}
        />
        <ul className="calc">
          <li>
            65 and 90 million: BCDA’s initial assessment, told to the Senate in August 2026 (“up to 36 Olympic-sized pools”).
            <Cite s="tribune-water" />
          </li>
          <li>
            130 million: Science.ph’s higher-end figure, about what {householdsOf(130).toLocaleString('en-US')} households use at 200 liters each (it writes
            “about 600,000”).
            <Cite s="scienceph" />
          </li>
          <li>
            One analysis uses 39 billion liters a year (about 107 million a day).
            <Cite s="mendoza" />
          </li>
        </ul>
        <Note>The story’s 3D stack of jugs only pictures the amount. It is not a plan to store water in jugs, a planned reservoir or its height.</Note>
      </>
    ),
  },
  'water-sources': {
    kicker: 'Plans, studies and critics',
    title: 'Where would the water come from?',
    body: (
      <>
        <p>
          <b>BCDA’s plan (preliminary)</b>
        </p>
        <ul className="calc">
          <li>
            Surface water from the Bangut, O’Donnell and Abacan rivers, stored in detention tanks: “We will not get it from ground extraction.”
            <Cite s="tribune-water" />
          </li>
          <li>
            BCDA says the Bangut River alone could supply 130–200 million liters a day. This is from an initial assessment made in the dry season; we
            found no published hydrological study behind it.
            <Cite s="tribune-water" />
          </li>
          <li>
            Harvested rainwater in impounding facilities, to limit groundwater use.
            <Cite s={['gma-water', 'gma-dedicated']} />
          </li>
          <li>
            Desalination is being explored, with the water piped along SCTEX.
            <Cite s="tribune-water" />
          </li>
        </ul>
        <p>
          <b>Critics and independent analyses</b>
        </p>
        <DataTable
          head={['Daily demand', 'Reservoirs supply', 'Shortfall (dry season)']}
          num={[1, 2]}
          rows={shortfallRows(EN, { low: '65 million (BCDA low)', high: '90 million (BCDA high)', max: '130 million (Science.ph)' })}
          caption={
            <>
              Shortfall = demand − reservoir supply, simple subtraction. Science.ph reports the 130-million row (10–65 million), citing a 2026 report by
              Magno; the other rows apply the same arithmetic.
              <Cite s="scienceph" />
            </>
          }
        />
        <ul className="calc">
          <li>
            Reservoir land: one analysis says 390–780 hectares. It does not publish its method; the range matches storing half a year of its 39
            billion liters a year (19.5 million m³) at an average depth of 5 m or 2.5 m (our reconstruction).
            <Cite s="mendoza" />
          </li>
          <li>
            El Niño: the same analysis says rainfall drops 40–60% in El Niño years.
            <Cite s="mendoza" />
          </li>
          <li>
            Recycling (zero liquid discharge) of 85–95% would cut new water to 5–15% of demand: {range(newWaterWithRecycling(90), 0.5)} million liters a
            day at 90 million, {range(newWaterWithRecycling(130), 0.5)} at 130 (the analysis writes 6–20). It would cost ₱10–20 billion to build and
            ₱0.8–2 billion a year to run; without it, the analysis warns of reliance on groundwater and community water systems.
            <Cite s="mendoza" />
          </li>
        </ul>
        <div className="defs">
          <div>
            <b>Reservoir area</b>The land it covers, in hectares (the blue area on the story’s 3D map).
          </div>
          <div>
            <b>Storage volume</b>How much it holds: area × average depth. 1 hectare 5 m deep holds 50,000 m³ (50 million liters).
          </div>
          <div>
            <b>Daily supply</b>How much can be drawn and treated each day, which depends on rain, river flow, storage and treatment plants.
          </div>
        </div>
        <p>
          <b>New Clark City’s own water system.</b> Maynilad and K-Water got original proponent status on Aug 28, 2026 for a ₱14.8-billion water and
          wastewater project; no rival bid came in the Swiss challenge, and BCDA hopes to award it by December. It would raise New Clark City’s supply
          from about {NCC_WATER_NOW_MLD} million to {NCC_WATER_PLANNED_MLD[0]}–{NCC_WATER_PLANNED_MLD[1]} million liters a day for industry, business and
          homes. BCDA has not said how much would go to Pax Silica.
          <Cite s="ncc-water" />
        </p>
        <p>
          <b>The rivers on the map.</b> The Bangut (“Bangot” in OpenStreetMap, “Bangut River” in GeoNames) and O’Donnell rivers are drawn from
          OpenStreetMap ways 135629603, 135629605 and 52502498. The Abacan River is in Angeles City, off the map.
          <Cite s={['osm', 'geonames']} />
        </p>
        <Note>The blue reservoir area on the story’s 3D map is a conceptual size comparison, not a confirmed location or land acquisition.</Note>
      </>
    ),
  },
};

export const powerSlidesTl: Record<string, SlideText> = {
  electricity: {
    kicker: 'Mga tantiya, hindi sukat',
    title: 'Gaano kalaki ang 3 gigawatt na kuryente?',
    body: (
      <>
        <StatGrid>
          <Stat value="3 GW" label="tantiya ng BCDA sa kailangang kuryente ng zone kapag buo na, na tinawag nitong maingat" cite="gma-3gw" tone="amber" />
          <Stat value={`≈ ${pct(HUB_SHARE_OF_LUZON_PEAK)}`} label="ng tinatayang pinakamataas na pangangailangan ng Luzon sa 2026 (mga 14,600 MW)" cite="iemop" tone="amber" />
          <Stat value={`${HUB_TWH_YEAR.toFixed(1)} TWh`} label="bawat taon, kung 3 GW ang gamit bawat oras (3 GW × 8,760 oras)" />
        </StatGrid>
        <DataTable
          head={['', 'Kuryente bawat buwan', 'Singil sa presyong pambahay', 'Karaniwang bahay']}
          num={[1, 2, 3]}
          emphasis={7}
          rows={energyRows(TL)}
          caption={
            <>
              * Paglalarawan sa presyong pambahay ng Meralco noong Nobyembre 2026 (₱15.5510 bawat kWh), hindi ang aktuwal na singil pang-industriya ng
              zone; mas mababa ang bawat kWh ng malalaking gumagamit. “Karaniwang bahay” = kWh ÷ 200.
              <Cite s="meralco-nov" />
            </>
          }
        />
        <ul className="calc">
          <li>Ang zone: 3,000,000 kW × 730 oras (8,760 ÷ 12) = 2.19 bilyong kWh bawat buwan; × ₱15.5510 = ₱34.1 bilyon.</li>
          <li>
            Office tower: 50,000 m² × 157 kWh bawat m² bawat taon (karaniwan sa mga opisina ng Ayala Land, 2024) ÷ 12 = 654,000 kWh.
            <Cite s="ayala-offices" />
          </li>
          <li>
            Mall: 5,960 MWh bawat taon ang gawa ng solar sa bubong ng SM City Fairview, na 11% daw ng gamit ng mall: 5,960 ÷ 0.11 ÷ 12 ≈ 4.5 milyong kWh.
            <Cite s="sm-fairview" />
          </li>
          <li>
            Pabrika ng chips: mga 200 MW bawat modernong wafer factory (Taipower) × 730 oras = 146 milyong kWh.
            <Cite s="fab-power" />
          </li>
          <li>Bahay: 200 kWh ang karaniwang bahay ayon sa Meralco; halimbawa lang ang 400, 800 at 2,000 kWh.</li>
        </ul>
        <Note>
          Tantiya ng pangangailangan ang 3 gigawatt, hindi aktuwal na sukat. Ipinapalagay ng buwanang bilang na 3 gigawatt ang gamit bawat oras,
          kaya pinakamataas na paglalarawan ito; nakadepende ang tunay na gamit sa kung gaano karami ang maitatayo at gagana.
        </Note>
      </>
    ),
  },
  'power-sources': {
    kicker: 'Napirmahan, pinag-aaralan, o senaryo',
    title: 'Paano nila ito papailawin?',
    body: (
      <>
        <p>
          <b>Ang nakalinya laban sa 3 gigawatt, sa karaniwan sa araw at gabi</b>
        </p>
        <DataTable
          head={['', 'Karaniwang kuryente', 'Bahagi ng 3 GW']}
          num={[1, 2]}
          emphasis={2}
          rows={[
            ['Solar + baterya ng ACWA Power (napirmahang upa, hindi pa naitatayo)', `${range(ACWA_AVG_MW, 1)} MW`, `${(ACWA_AVG_MW[0] / HUB_MW * 100).toFixed(1)}–${(ACWA_AVG_MW[1] / HUB_MW * 100).toFixed(1)}%`],
            ['Planta ng gas (LNG) para sa New Clark City (pinag-aaralan)', `${BCDA_LNG_STUDY_MW} MW`, `${(BCDA_LNG_STUDY_MW / HUB_MW * 100).toFixed(1)}%`],
            ['Wala pang inilalabas na plano', `≈ ${range([HUB_MW - LINED_UP_MW[1], HUB_MW - LINED_UP_MW[0]], 10)} MW`, `≈ ${pct(GAP_SHARE[0])}`],
          ]}
          caption={`ACWA: ${ACWA_MW} MW sa peak × capacity factor 17.1–18.0%. Binilang ang planta ng gas na parang tuloy-tuloy ang takbo. Sa kuwento, ipinapakita ito bilang basong panukat sa gitna ng zone.`}
        />
        <DataTable
          head={['Opsyon', 'Laki', 'Kalagayan', 'Uri']}
          rows={[
            [
              'Solar + baterya ng ACWA Power, New Clark City',
              <>
                hanggang {ACWA_MW} MW sa peak (≈ {range(ACWA_AVG_MW, 1)} MW kung aaraw-gabihin), 500 ektarya
              </>,
              <>
                Napirmahan ang pag-upa ng lupa noong Hunyo 2026; laki “kapag buo na”. Wala pang naiulat na konstruksyon.
                <Cite s={['acwa-lease', 'gma-dedicated']} />
              </>,
              tag('official', 'Napirmahang upa'),
            ],
            [
              'Sariling planta ng kuryente para sa Pax Silica',
              'hindi binanggit',
              <>
                Pinag-aaralan ng mga proponent ng proyekto (Ago 2026).
                <Cite s="gma-dedicated" />
              </>,
              tag('study', 'Pinag-aaralan'),
            ],
            [
              'Planta ng gas (LNG) para sa New Clark City',
              `${BCDA_LNG_STUDY_MW} MW`,
              <>
                Pumirma ang BCDA ng kasunduan para suriin kung kaya ito (Nob 2026).
                <Cite s="lng-40mw" />
              </>,
              tag('study', 'Pinag-aaralan'),
            ],
            [
              '2 GW na solar + 1 GW na planta ng LNG',
              '3 GW',
              <>
                Pagsusuri ng ibang eksperto (Dr. Teodoro C. Mendoza, Philippine Daily Inquirer).
                <Cite s="mendoza" />
              </>,
              tag('scenario', 'Senaryo'),
            ],
            [
              'Nukleyar',
              '1 GW, mga US$6–10 bilyon',
              <>
                Tinalakay ng Science.ph; walang plano.
                <Cite s="scienceph" />
              </>,
              tag('scenario', 'Senaryo'),
            ],
          ]}
        />
        <div className="defs">
          <div>
            <b>Peak (naka-install na) kapasidad</b>Ang kaya ng mga panel sa tirik na araw, sa MW. Ganito ang {ACWA_MW} MW ng ACWA.
          </div>
          <div>
            <b>Karaniwang nalilikha</b>Ang aktuwal na gawa sa buong araw at gabi: peak × capacity factor (17.1–18.0% sa dalawang solar sa bubong sa
            Pilipinas). {ACWA_MW} MW → mga {range(ACWA_AVG_MW, 1)} MW sa karaniwan.
          </div>
          <div>
            <b>Battery storage</b>Inililipat ang kuryente ng araw sa gabi. Hindi ito nagdadagdag, at may nasasayang.
          </div>
          <div>
            <b>Tuloy-tuloy at maaasahang suplay</b>Kuryenteng laging handa bawat oras, na kailangan ng 3 GW na zone ng pabrika. Sa solar, kailangan ng
            ilang ulit na mas maraming panel at baterya; kung hindi, mula sa gas, geothermal, nukleyar o grid.
          </div>
        </div>
        <p>
          <b>Gaano kalaking lupa ang kailangan ng solar na pang-araw at gabi?</b>
        </p>
        <DataTable
          head={['Senaryo', 'Karaniwang kuryente', 'Kailangang panel', 'Lupa']}
          num={[1, 2, 3]}
          rows={[
            ['2 GW (bahagi ng solar sa pagsusuri)', '2,000 MW', `${range(solarPanelsMW(2000), 100)} MW`, `${range(BENCH_SOLAR_HA, 100)} ektarya`],
            ['Solar lahat ng 3 GW', '3,000 MW', `${range(solarPanelsMW(3000), 100)} MW`, `${range(solarLandHa(3000), 100)} ektarya`],
            ['Sariling bilang ng pagsusuri para sa 2 GW', '2,000 MW', 'hindi inilathala', '≈ 20,000 ektarya'],
          ]}
          caption="Panel = karaniwang kuryente ÷ capacity factor (0.171–0.180). Lupa = panel × 1 ektarya bawat MW. Hindi kasama ang nasasayang at lupa ng baterya."
        />
        <ul className="calc">
          <li>
            Capacity factor: solar sa bubong ng SM Mall of Asia, 3,000 MWh bawat taon ÷ (2 MW × 8,760 oras) = 17.1%; SM City Fairview, 5,960 ÷ (3.785 ×
            8,760) = 18.0%. Maaaring mas mataas nang kaunti sa malalaking solar farm, kaya mas kaunting lupa.
            <Cite s={['moa-solar', 'sm-fairview']} />
          </li>
          <li>
            Lupa bawat MW: 3,500 MW ng panel sa mga 3,500 ektarya ang MTerra Solar; 500 ektarya para sa hanggang 500 MW ang inuupahan ng ACWA → mga 1
            ektarya bawat MW.
            <Cite s={['mterra', 'acwa-lease']} />
          </li>
          <li>
            Mga {Math.round(BENCH_SOLAR_TIMES_ZONE[0])} beses ng 1,619 ektarya ng zone ang 2 GW na solar araw at gabi, nakakalat sa Gitnang Luzon. Wala pang
            napiling lugar; paghahambing lang ito ng laki, hindi mungkahing lokasyon.
          </li>
        </ul>
        <Note>Wala pang inilalabas na plano para sa buong 3 gigawatt.</Note>
      </>
    ),
  },
  'water-amount': {
    kicker: 'Mga tantiya kapag buo na',
    title: '65–90 milyong litro ng tubig bawat araw',
    body: (
      <>
        <DataTable
          head={['Litro bawat araw', 'Ayon kay', 'Olympic pool', 'Sa 1 ektarya: isang araw', 'isang linggo', 'isang buwan']}
          num={[2, 3, 4, 5]}
          rows={waterRows(TL)}
          caption="Lalim = milyong litro × 1,000 m³ ÷ 10,000 m². Isang linggo = 7 araw, isang buwan = 30. 2.5 milyong litro ang isang Olympic pool."
        />
        <DataTable
          head={['Litro bawat araw', '5-gallon na galon bawat araw', 'Galon sa 1 ektarya: isang araw', 'isang linggo', 'isang buwan']}
          num={[1, 2, 3, 4]}
          rows={jugRows(TL)}
          caption={`18.9 litro ang isang 5-gallon na galon (5 US gallon). Mga ${JUG_W_M * 100} cm ang lapad at ${JUG_H_M * 100} cm ang taas ng bilog na galon, kaya ${JUGS_PER_LAYER_HA.toLocaleString('en-US')} ang kasya sa isang ektarya (370 × 370), ${JUG_H_M} m bawat patong. May puwang sa pagitan ng mga galon, kaya halos doble ang taas ng salansan kaysa sa tubig lang.`}
        />
        <ul className="calc">
          <li>
            65 at 90 milyon: unang pagtatasa ng BCDA, sinabi sa Senado noong Agosto 2026 (“hanggang 36 na Olympic-sized pool”).
            <Cite s="tribune-water" />
          </li>
          <li>
            130 milyon: mas mataas na tantiya ng Science.ph, halos gamit ng {householdsOf(130).toLocaleString('en-US')} na sambahayan sa 200 litro bawat isa
            (“mga 600,000” ang isinulat nito).
            <Cite s="scienceph" />
          </li>
          <li>
            39 bilyong litro bawat taon (mga 107 milyon bawat araw) ang ginamit ng isang pagsusuri.
            <Cite s="mendoza" />
          </li>
        </ul>
        <Note>Paglalarawan lang ng dami ang 3D na salansan ng galon sa kuwento. Hindi ito planong mag-imbak ng tubig sa galon, planong imbakan, o ang taas nito.</Note>
      </>
    ),
  },
  'water-sources': {
    kicker: 'Mga plano, pag-aaral at kritiko',
    title: 'Saan manggagaling ang tubig?',
    body: (
      <>
        <p>
          <b>Plano ng BCDA (paunang tantiya)</b>
        </p>
        <ul className="calc">
          <li>
            Tubig mula sa mga ilog na Bangut, O’Donnell at Abacan, iipunin sa mga tangke: “Hindi namin ito kukunin sa ilalim ng lupa.”
            <Cite s="tribune-water" />
          </li>
          <li>
            Sabi ng BCDA, kaya ng Ilog Bangut pa lang ang 130–200 milyong litro bawat araw. Galing ito sa unang pagtatasa noong tag-init; wala kaming
            nakitang inilathalang pag-aaral ng tubig na nagpapatunay dito.
            <Cite s="tribune-water" />
          </li>
          <li>
            Inipong tubig-ulan sa mga impounding facility, para mabawasan ang paggamit ng tubig sa ilalim ng lupa.
            <Cite s={['gma-water', 'gma-dedicated']} />
          </li>
          <li>
            Tinitingnan ang desalination, at idadaan ang tubig sa tabi ng SCTEX.
            <Cite s="tribune-water" />
          </li>
        </ul>
        <p>
          <b>Mga kritiko at ibang pagsusuri</b>
        </p>
        <DataTable
          head={['Gamit bawat araw', 'Kaya ng imbakan', 'Kakulangan (tag-init)']}
          num={[1, 2]}
          rows={shortfallRows(TL, { low: '65 milyon (BCDA, mababa)', high: '90 milyon (BCDA, mataas)', max: '130 milyon (Science.ph)' })}
          caption={
            <>
              Kakulangan = gamit − kaya ng imbakan, simpleng pagbabawas. Ang hanay na 130 milyon (10–65 milyon) ay mula sa Science.ph, batay sa ulat ni
              Magno (2026); parehong kuwenta ang ibang hanay.
              <Cite s="scienceph" />
            </>
          }
        />
        <ul className="calc">
          <li>
            Lupa ng imbakan: 390–780 ektarya ayon sa isang pagsusuri. Hindi nito inilathala ang paraan; tugma ito sa pag-iimbak ng kalahating taon ng 39
            bilyong litro bawat taon (19.5 milyong m³) sa karaniwang lalim na 5 o 2.5 metro (sariling muling pagkuwenta).
            <Cite s="mendoza" />
          </li>
          <li>
            El Niño: sabi ng parehong pagsusuri, bumababa nang 40–60% ang ulan tuwing El Niño.
            <Cite s="mendoza" />
          </li>
          <li>
            Recycling (zero liquid discharge) ng 85–95%: 5–15% na lang ng kailangan ang bagong tubig, {range(newWaterWithRecycling(90), 0.5)} milyong litro
            bawat araw sa 90 milyon, {range(newWaterWithRecycling(130), 0.5)} sa 130 (6–20 ang isinulat ng pagsusuri). ₱10–20 bilyon ang pagtatayo at
            ₱0.8–2 bilyon bawat taon ang pagpapatakbo; kung wala ito, nagbabala ang pagsusuri na aasa sa tubig sa ilalim ng lupa at sa tubig ng komunidad.
            <Cite s="mendoza" />
          </li>
        </ul>
        <div className="defs">
          <div>
            <b>Laki ng imbakan</b>Ang lupang sakop nito, sa ektarya (ang asul sa 3D na mapa ng kuwento).
          </div>
          <div>
            <b>Dami ng naiimbak</b>Gaano karami ang laman: laki × karaniwang lalim. Ang 1 ektaryang 5 metro ang lalim ay may 50,000 m³ (50 milyong litro).
          </div>
          <div>
            <b>Suplay bawat araw</b>Gaano karami ang makukuha at malilinis bawat araw, depende sa ulan, daloy ng ilog, imbakan at planta.
          </div>
        </div>
        <p>
          <b>Sariling sistema ng tubig ng New Clark City.</b> Nakuha ng Maynilad at K-Water ang original proponent status noong Ago 28, 2026 para sa
          ₱14.8-bilyong proyekto sa tubig at wastewater; walang ibang nag-bid sa Swiss challenge, at target ng BCDA na igawad ito bago mag-Disyembre.
          Itataas nito ang suplay ng New Clark City mula mga {NCC_WATER_NOW_MLD} milyon tungong {NCC_WATER_PLANNED_MLD[0]}–{NCC_WATER_PLANNED_MLD[1]} milyong
          litro bawat araw para sa industriya, negosyo at tahanan. Hindi pa sinasabi ng BCDA kung magkano ang mapupunta sa Pax Silica.
          <Cite s="ncc-water" />
        </p>
        <p>
          <b>Ang mga ilog sa mapa.</b> Iginuhit ang Bangut (“Bangot” sa OpenStreetMap, “Bangut River” sa GeoNames) at O’Donnell mula sa OpenStreetMap
          (ways 135629603, 135629605 at 52502498). Nasa Lungsod ng Angeles ang Ilog Abacan, labas sa mapa.
          <Cite s={['osm', 'geonames']} />
        </p>
        <Note>Konseptong paghahambing ng laki ang asul na imbakan sa 3D na mapa ng kuwento, hindi kumpirmadong lokasyon o nabiling lupa.</Note>
      </>
    ),
  },
};
