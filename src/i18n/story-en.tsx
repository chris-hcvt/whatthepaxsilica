import { cloneElement } from 'react';
import type { StoryStep } from './types';
import type { Chapter } from '../content/story';
import { REFS, CITY_STATS, HUB_HA, HUB_COURTS, COURTS_PER_HECTARE } from '../content/story';
import {
  ACWA_AVG_MW,
  ACWA_MW,
  BCDA_LNG_STUDY_MW,
  BENCH_SOLAR_HA,
  BENCH_SOLAR_TIMES_ZONE,
  GAP_SHARE,
  HUB_MW,
  LINED_UP_MW,
  DAYS_MONTH,
  DAYS_WEEK,
  ENERGY,
  HUB_SHARE_OF_LUZON_PEAK,
  billOf,
  depthPerDay,
  householdsOf,
  poolsOf,
  shortfall,
  solarPanelsMW,
} from '../content/power';
import { Cite, CityBars, Timeline } from '../components/bits';
import { Assumption, BigNumber, Bullets, DotChart, EnergyPicker, FillOptions, GapBar, HomePicker, ProsCons, RefPicker, ScoreCard, WaterPicker } from '../components/story-bits';

export const chaptersEn: Record<Chapter, string> = {
  basics: 'The basics',
  plan: 'The plan',
  size: 'How big',
  people: 'The people',
  power: 'Power & water',
  proscons: 'Pros & cons',
  benefit: 'Who benefits?',
  next: 'What’s next',
};

const TAGS = {
  doc: 'In documents',
  promised: 'Promised',
  proposed: 'Proposed, not law',
  unclear: 'Unclear',
  planned: 'Planned',
  reported: 'Reported',
  goal: 'Main goal',
};

/** 3,110 · 10.2 million · 2.27 billion */
const bigEn = (n: number) => {
  const trim = (s: string) => s.replace(/\.0$/, '');
  if (n >= 1e9) return `${trim((n / 1e9).toFixed(n >= 1e10 ? 1 : 2))} billion`;
  if (n >= 1e6) return `${trim((n / 1e6).toFixed(n >= 1e8 ? 0 : 1))} million`;
  return (n >= 1e5 ? Math.round(n / 1000) * 1000 : Math.round(n)).toLocaleString('en-US');
};
/** a range rounded to a step: [11126, 11680] → "11,100–11,700" */
const rangeEn = ([a, b]: [number, number] | number[], step: number) =>
  `${(Math.round(a / step) * step).toLocaleString('en-US')}–${(Math.round(b / step) * step).toLocaleString('en-US')}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
/** homes, rounded the way people say them: 2 · 3,300 · 22,600 · 730,000 · 11 million */
const homesEn = (n: number) => {
  if (n >= 1e6) return `${Math.round(n / 1e6)} million`;
  if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString('en-US');
  return String(Math.round(n));
};

/* controls shown in full in the text and, on phones, compact under the short caption */
const homePickerEn = (
  <HomePicker
    names={{ regular: 'Regular home', medium: 'Medium home', large: 'Large home', mansion: 'Mansion' }}
    lot={(m2) => `${m2.toLocaleString('en-US')} square meters per lot`}
    count={(n) => (
      <>
        <b>{n}</b> homes
      </>
    )}
  />
);

const refPickerEn = (
  <RefPicker
    malls="Malls"
    districts="Business districts"
    result={(k, times) => {
      const r = REFS[k];
      return (
        <>
          <div className="ref-big">
            <b>{times}×</b> {r.name}
          </div>
          <p className="muted">
            {r.kind === 'mall'
              ? `Based on area (${r.ha} hectares each). In 3D: ${r.packed} whole copies, packed with the gaps that leaves.`
              : `By area, the zone equals about ${times} ${r.name}s. Because the zone is long and narrow, ${r.packed} whole copies fit inside it side by side (shown in 3D), with land to spare. ${
                  r.basis === 'square'
                    ? 'BGC is about 240 hectares (BCDA); it has no published boundary, so it’s shown as a square.'
                    : `Its outline follows its main bounding roads: about ${Math.round(r.ha)} hectares.`
                }`}
          </p>
        </>
      );
    }}
  />
);

const energyPickerEn = (
  <EnergyPicker
    names={{
      regular: 'Regular home',
      medium: 'Medium home',
      large: 'Large home',
      mansion: 'Mansion',
      office: 'Office tower',
      mall: 'Big mall',
      fab: 'Chip factory',
      hub: 'The zone (3 gigawatts)',
    }}
    kwh={(n) => `${bigEn(n)} kWh a month`}
    peso={(n) => `₱${bigEn(n)}`}
    tap={'Tap to add'}
    next={(name) => <>Add the next one: <b>{name}</b> →</>}
    restart={'↺ Start again from one home'}
    detail={(k, homes) =>
      k === 'regular' ? (
        <>
          <b>Meralco’s typical household</b>, about ₱3,110 at November 2026 rates.
        </>
      ) : k === 'hub' ? (
        <>
          As much as <b>about {homesEn(homes)} typical homes</b>, about <b>{pct(HUB_SHARE_OF_LUZON_PEAK)} of Luzon’s forecast 2026 peak</b>. BCDA
          calls 3 GW a conservative first estimate.
        </>
      ) : (
        <>
          {k === 'office' ? 'A 50,000-square-meter office tower' : k === 'mall' ? 'One big mall (SM City Fairview)' : k === 'fab' ? 'One advanced chip factory' : 'This home'}{' '}
          uses as much as <b>{homesEn(homes)} typical homes</b>.
        </>
      )
    }
  />
);

const gapBarEn = (
  <GapBar
    parts={[
      {
        share: ACWA_AVG_MW[1] / HUB_MW,
        color: '#36d39a',
        label: (
          <>
            <b>≈ {rangeEn(ACWA_AVG_MW, 1)} MW</b> ACWA Power solar + batteries: lease signed June 2026, not built ({ACWA_MW} MW at full sun only)
            <Cite s={['acwa-lease', 'moa-solar', 'sm-fairview']} />
          </>
        ),
      },
      {
        share: BCDA_LNG_STUDY_MW / HUB_MW,
        color: '#ffb020',
        striped: true,
        label: (
          <>
            <b>{BCDA_LNG_STUDY_MW} MW</b> gas (LNG) plant for New Clark City: under study
            <Cite s="lng-40mw" />
          </>
        ),
      },
    ]}
    rest={
      <>
        <b>≈ {pct(GAP_SHARE[0])}</b> no published plan yet
      </>
    }
  />
);

const waterPickerEn = (
  <WaterPicker
    names={{ low: '65 million', high: '90 million', max: '130 million' }}
    tags={{ low: 'BCDA, low end', high: 'BCDA, high end', max: 'Highest estimate (Science.ph)' }}
    result={(k, mld) => (
      <>
        <b>{mld} million liters a day</b> = {poolsOf(mld)} Olympic pools. On 1 hectare: <b>{depthPerDay(mld)} m</b> deep after a day,{' '}
        {depthPerDay(mld) * DAYS_WEEK} m after a week, <b>{depthPerDay(mld) * DAYS_MONTH} m</b> after a month (30 days)
        {k === 'max' ? <>, about what {householdsOf(mld).toLocaleString('en-US')} households use at 200 liters each.</> : '.'}
      </>
    )}
  />
);

export const storyEn: Record<string, StoryStep> = {
  hero: {
    kicker: 'Capas, Tarlac · Philippines',
    title: 'What the Pax Silica?',
    body: (
      <p className="lead">
        A 1,619-hectare tech zone is planned on this land, where Aeta families and farmers live. Here’s what every Filipino should know — in about 4
        minutes.
      </p>
    ),
  },
  'basics-1': {
    brief: (
      <>
        Its goal: make computer chips, AI and the minerals they need, <b>without relying on China</b>.
      </>
    ),
    kicker: 'Pax Silica in 30 seconds',
    title: 'A US-led club of about 25 countries',
    body: (
      <p>
        Its goal: make computer chips, AI and the minerals they need — <b>without relying on China</b>.
        <Cite s={['state-paxsilica', 'techpolicy']} />
      </p>
    ),
    more: (
      <p>
        The US State Department launched it in December 2025 with a non-binding declaration. Members include Japan, South Korea, Australia, the UK,
        Israel, India and several European and Latin American countries. “Pax Silica” means “silicon peace.”
        <Cite s={['wikipedia', 'techpolicy']} />
      </p>
    ),
  },
  'basics-2': {
    brief: (
      <>
        The government offered land for a giant factory zone, <b>right here in Tarlac</b>.
      </>
    ),
    title: 'The Philippines joined in April 2026',
    body: (
      <p>
        As part of it, the government offered land for a giant factory zone — <b>right here in Tarlac</b>.
        <Cite s={['pna-joins', 'state-apr16']} />
      </p>
    ),
    more: (
      <p>
        Trade Undersecretary Ceferino Rodolfo signed on April 17. The US and the Philippines announced a 4,000-acre “Economic Security Zone,” the first
        industrial hub under Pax Silica.
        <Cite s={['pna-joins', 'state-apr16']} />
      </p>
    ),
  },
  'plan-where': {
    brief: (
      <>
        About 75 km north of Manila, on former US base land run by the government’s <b>BCDA</b>.
      </>
    ),
    title: 'Where: New Clark City, Capas, Tarlac',
    body: (
      <p>
        About 75 km north of Manila, on former US military base land. The government’s Bases Conversion and Development Authority (<b>BCDA</b>) runs it.
        <Cite s={['rfa', 'gma-relocation']} />
      </p>
    ),
    more: <p>Yellow dashes: New Clark City (about 9,450 hectares). Red: the planned tech zone.</p>,
  },
  'plan-what': {
    brief: (
      <>
        Plus nickel processing. <b>No data centers</b>, officials say. Construction target: <b>2028</b>.
        <span className="tap-hint">Tap a label to see an example photo.</span>
      </>
    ),
    title: 'What: factories for chips and AI parts',
    body: (
      <p>
        Plus processing of minerals like nickel. Officials say there will be <b>no data centers</b>. Construction is targeted for <b>2028</b>.
        <Cite s={['gma-sovereignty', 'cna']} />
      </p>
    ),
  },
  'plan-land': {
    brief: (
      <>
        Investors could lease it for up to <b>99 years</b>. No tenant is confirmed yet.
      </>
    ),
    title: 'The land stays Philippine-owned — but it will be rented out',
    body: (
      <p>
        Investors could lease it for up to <b>99 years</b>. Foxconn and Moog are named as possible first tenants, but <b>none is confirmed</b>.
        <Cite s={['mongabay', 'context-anchors', 'tribune-afp']} />
      </p>
    ),
  },
  'plan-status': {
    brief: (
      <>
        No signed agreement, no environmental study, no official map. The red outline is an <b>independent estimate</b>.
      </>
    ),
    title: 'Nothing is final yet',
    body: (
      <>
        <Bullets
          items={[
            <>
              The main agreement isn’t signed. Target: end of 2026.
              <Cite s="pna-signing" />
            </>,
            <>
              No environmental study has been filed.
              <Cite s="gma-denr" />
            </>,
            <>
              The official boundary map hasn’t been released.
              <Cite s="afp" />
            </>,
          ]}
        />
        <p className="note">
          The red outline is an independent estimate by geographers at Countermapping PH, so it’s approximate.
          <Cite s="countermapping" />
        </p>
      </>
    ),
    more: (
      <p>
        We matched the Countermapping PH map (published by Human Rights Watch) to satellite images. Our outline covers about 1,738 hectares, close to the
        official 1,619 hectares. Details are in the full report.
      </p>
    ),
  },
  'size-hectare': {
    brief: (
      <>
        <b>10,000 square meters</b>: a square 100 meters on each side, about <b>{Math.round(COURTS_PER_HECTARE)} basketball courts</b>.
      </>
    ),
    title: 'First, how big is 1 hectare?',
    body: (
      <>
        <p>
          <b>1 hectare = 10,000 square meters.</b> That’s a square 100 meters long on each side.
        </p>
        <p>
          It’s about the size of <b>{Math.round(COURTS_PER_HECTARE)} basketball courts</b>. Walking once around it takes about 5 minutes.
          <Cite s="court" />
        </p>
      </>
    ),
    more: <p>A full-size basketball court is 28 × 15 meters, or 420 square meters. 10,000 ÷ 420 ≈ 24. One court is drawn in the square to scale.</p>,
  },
  'size-homes': {
    brief: (
      <>
        Every house sits on a lot. Tap a size:
      </>
    ),
    control: cloneElement(homePickerEn, { compact: true }),
    title: 'How many homes fit in 1 hectare?',
    body: (
      <>
        <p>Every house sits on a lot. Tap a size to fill the square:</p>
        {homePickerEn}
      </>
    ),
    more: (
      <p>
        Regular: the smallest lot allowed for a house in socialized housing (64 square meters). Medium: the smallest lot for a house in an open-market
        subdivision (120 square meters). Large (300 square meters) and mansion (1,000 square meters) are example sizes. Counts are 10,000 ÷ lot size,
        leaving out roads.
        <Cite s={['bp220', 'pd957']} />
      </p>
    ),
  },
  'size-number': {
    brief: (
      <>
        Each small square is 1 hectare: <b>16.19 million square meters</b>, about {HUB_COURTS.toLocaleString('en-US')} basketball courts.
      </>
    ),
    title: <BigNumber value="1,619" unit="hectares" />,
    body: (
      <p>
        Now zoom out. Each small square on the zone is 1 hectare, and there are <b>1,619</b> of them: <b>16.19 million square meters</b>, or
        about <b>{HUB_COURTS.toLocaleString('en-US')} basketball courts</b>.
      </p>
    ),
    more: <p>1,619 hectares is the official size (4,000 acres). The grid is drawn on our approximate outline, so it shows a few more squares.</p>,
  },
  'size-flat': {
    brief: (
      <>
        We flattened the zone so you can compare it with places you know.
      </>
    ),
    title: 'Now imagine it leveled',
    body: <p>We flattened the land inside the zone so you can compare it with places you know.</p>,
    more: <p>This is only an illustration for comparing sizes. It is not a construction plan.</p>,
  },
  'size-compare': {
    brief: (
      <>
        Pick a mall or a business district:
      </>
    ),
    control: cloneElement(refPickerEn, { compact: true }),
    title: 'How many would fit?',
    body: refPickerEn,
    more: (
      <p>
        Mall sizes are the mall lots mapped on OpenStreetMap. Makati CBD: EDSA, Gil Puyat, Chino Roces and Arnaiz avenues. Ortigas Center: EDSA, Ortigas
        Ave, Meralco Ave and Shaw Blvd (its association lists about 108 hectares).
        <Cite s="osm" />
      </p>
    ),
  },
  'size-cities': {
    brief: (
      <>
        At {HUB_HA.toLocaleString('en-US')} hectares, the zone is almost as big as <b>Makati City</b> ({Math.round(CITY_STATS.makati).toLocaleString('en-US')} hectares) and bigger than <b>Mandaluyong</b> ({Math.round(CITY_STATS.mandaluyong).toLocaleString('en-US')}).
      </>
    ),
    title: 'Bigger than some whole cities',
    body: (
      <CityBars
        unit="hectares"
        hubLabel={<b>Pax Silica zone</b>}
        rows={[
          { name: 'Makati City', ha: CITY_STATS.makati },
          { name: 'Mandaluyong', ha: CITY_STATS.mandaluyong },
          { name: 'San Juan', ha: CITY_STATS.sanjuan },
          { name: 'UP Diliman', ha: CITY_STATS.updiliman },
          { name: 'Luneta Park', ha: CITY_STATS.rizalpark },
        ]}
      />
    ),
    more: (
      <p>
        Areas from OpenStreetMap boundaries; the zone uses the official {HUB_HA.toLocaleString('en-US')} hectares.
        <Cite s="osm" />
      </p>
    ),
  },
  'size-map': {
    brief: (
      <>
        Pick a city, or search your town. The outline keeps its real size.
      </>
    ),
    title: 'Drop it on your city',
    body: <p>Pick a city, or search your town. The outline keeps its real size.</p>,
  },
  'people-1': {
    brief: (
      <>
        On the independent map, their village is <b>inside the zone</b>. They have claimed it as ancestral land since 1994; the claim was never approved.
        <span className="tap-hint">Tap a village name to see the place.</span>
      </>
    ),
    title: 'About 200 Aeta Hungey families live in Sapang Kawayan',
    body: (
      <p>
        On the independent map, their village is <b>inside the zone</b>. They have claimed this land as ancestral domain since 1994. The claim has never
        been approved.
        <Cite s={['rfa', 'hrw']} />
      </p>
    ),
  },
  'people-2': {
    brief: (
      <>
        Farmers in <b>Binyayan</b> and the <b>Ayta Mag-antsi</b> of Manabayucan, who get water and fish from the Bangot River.
      </>
    ),
    title: 'Their neighbors would be affected too',
    body: (
      <p>
        Farmers in <b>Sitio Binyayan</b>, and the <b>Ayta Mag-antsi</b> of Manabayucan. Families here get their water and fish from the Bangot River.
        <Cite s={['hrw', 'rfa']} />
      </p>
    ),
  },
  'people-numbers': {
    title: 'How many people would be moved? No one has an official count.',
    body: (
      <>
        <div className="ncharts">
          <div className="snap">
            <DotChart
              legend="= 10 people"
              rows={[
                { people: 92, display: '92 people', who: 'BCDA letter', what: 'in Barangay O’Donnell', cite: 'hrw', side: 'gov' },
                { people: 200, display: '~200 people', who: 'BCDA', what: 'in 40 households, “pushed a little bit”', cite: 'rfa', side: 'gov' },
                { people: 20000, display: '~20,000 people', who: 'Kalikasan', what: 'Aetas and farmers (the Palace disputes this)', cite: 'summit', side: 'critic' },
              ]}
            />
            <p className="note">
              The Aeta Hungey chieftain counts about 1,000 families on their ancestral land — a count of families, not people.
              <Cite s="pressenza" />
            </p>
          </div>
          <div className="offer snap">
            <h3>What’s been offered so far</h3>
            <Bullets
              items={[
                <>
                  About <b>50 houses</b> and <b>100 hectares</b> of farmland elsewhere in New Clark City.
                  <Cite s="gma-relocation" />
                </>,
                <>
                  Residents say the houses are <b>30 square meters</b> and the offer for land was <b>₱30 per square meter</b>. They said no.
                  <Cite s={['hrw', 'afp']} />
                </>,
                <>
                  BCDA and the NCIP are counting families now.
                  <Cite s="bcda-census" />
                </>,
              ]}
            />
          </div>
        </div>
      </>
    ),
  },
  'power-ladder': {
    brief: (
      <>
        BCDA expects <b>3 gigawatts</b>. Add buildings one by one and compare their monthly bills:
      </>
    ),
    control: cloneElement(energyPickerEn, { compact: true, short: { regular: 'Regular', medium: 'Medium', large: 'Large', mansion: 'Mansion', office: 'Office', mall: 'Mall', fab: 'Chip factory', hub: 'The zone' } }),
    title: 'How much electricity is 3 gigawatts?',
    body: (
      <>
        <p>
          BCDA estimates about <b>3 gigawatts</b> at full development. Tap a row to add that building beside the others, with its bill:
          <Cite s="gma-3gw" />
        </p>
        {energyPickerEn}
        <Assumption title="Read with care:">
          3 GW is a demand estimate, not measured use; the zone’s row assumes 3 GW nonstop (× 730 hours). *Bills use Meralco’s November 2026 household
          rate, ₱15.5510 per kWh, only to compare: ₱{bigEn(billOf(ENERGY.hub))} is not the zone’s real industrial bill.
          <Cite s="meralco-nov" />
        </Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>Zone: 3,000,000 kW × 730 hours = 2.19 billion kWh a month; × ₱15.5510 = ₱34.1 billion (illustration only).</li>
        <li>Office tower: 50,000 square meters of leased offices × 157 kWh per square meter a year (Ayala Land’s 2024 office average) ÷ 12 = 654,000 kWh.</li>
        <li>Mall: SM City Fairview’s rooftop solar makes 5,960 MWh a year, which SM says is 11% of the mall’s use: 5,960 ÷ 0.11 ÷ 12 ≈ 4.5 million kWh.</li>
        <li>Chip factory: about 200 megawatts per advanced wafer factory (Taipower) × 730 hours = 146 million kWh.</li>
        <li>Homes: 200 kWh is Meralco’s typical household; 400, 800 and 2,000 kWh are examples.</li>
        <li>Luzon: 3,000 ÷ 14,600 megawatts (IEMOP’s 2026 peak forecast) ≈ 21%.
          <Cite s={['ayala-offices', 'sm-fairview', 'fab-power', 'iemop']} />
        </li>
      </ul>
    ),
  },
  'power-supply': {
    brief: (
      <>
        Only about <b>{pct(1 - GAP_SHARE[0])}</b> is lined up: ACWA’s planned solar and a gas plant still under study. The rest has <b>no published plan</b>.
      </>
    ),
    control: cloneElement(gapBarEn, { compact: true }),
    title: 'How could they power it?',
    body: (
      <>
        <p>
          Against the 3 gigawatts BCDA expects, this is what is lined up, averaged over day and night:
          <Cite s="gma-3gw" />
        </p>
        {gapBarEn}
        <p className="fill-head">
          <b>Ways to fill the gap</b> (none chosen):
        </p>
        <FillOptions
          items={[
            {
              icon: 'sun',
              title: 'Solar + batteries',
              zones: Math.round(BENCH_SOLAR_TIMES_ZONE[0]),
              land: <>≈ {Math.round(BENCH_SOLAR_TIMES_ZONE[0])}× the zone’s land for 2 GW, spread over Central Luzon</>,
              fuel: 'No fuel; batteries for the night',
            },
            { icon: 'flame', title: 'Gas (LNG)', land: 'A plant site: far less land than solar', fuel: <>Imported fuel; prices follow world markets<Cite s="mendoza" /></> },
            {
              icon: 'grid',
              title: 'Luzon grid',
              land: 'No new land at the zone',
              fuel: (
                <>
                  3 GW ≈ {pct(HUB_SHARE_OF_LUZON_PEAK)} of Luzon’s forecast peak: new plants needed somewhere
                  <Cite s="iemop" />
                </>
              ),
            },
            { icon: 'atom', title: 'Nuclear', land: 'A plant site', fuel: <>≈ US$6–10 billion per GW; no permanent waste site<Cite s="scienceph" /></> },
          ]}
        />
      </>
    ),
    more: (
      <ul className="calc">
        <li>
          ACWA averaged: {ACWA_MW} MW × capacity factor 17.1–18.0% (SM Mall of Asia’s and SM City Fairview’s rooftop solar) = {rangeEn(ACWA_AVG_MW, 1)} MW.
          Batteries move solar power to the night; they add no energy. The gas plant counts at {BCDA_LNG_STUDY_MW} MW if it ran nonstop.
        </li>
        <li>No plan yet: 1 − (≈ {Math.round(LINED_UP_MW[1])} ÷ 3,000) ≈ {pct(GAP_SHARE[0])}. A dedicated plant is being studied by the project’s proponents.</li>
        <li>
          Solar land for 2 GW round-the-clock: 2,000 MW ÷ 0.180–0.171 = {rangeEn(solarPanelsMW(2000), 100)} MW of panels × ≈ 1 hectare per MW (MTerra
          Solar, ACWA) = {rangeEn(BENCH_SOLAR_HA, 100)} hectares ≈ {Math.round(BENCH_SOLAR_TIMES_ZONE[0])}× the zone’s 1,619 hectares. One analysis says
          20,000 hectares. No sites have been chosen.
        </li>
        <li>
          The gas and nuclear lines describe independent scenarios (an Inquirer analysis, Science.ph), not BCDA plans.
          <Cite s={['gma-dedicated', 'mterra', 'mendoza', 'scienceph']} />
        </li>
      </ul>
    ),
  },
  'water-volume': {
    brief: (
      <>
        BCDA’s estimate for the zone. Pick a daily amount to stack it on one hectare:
      </>
    ),
    control: cloneElement(waterPickerEn, {
      compact: true,
      result: (_k: string, mld: number) => (
        <>
          <b>{poolsOf(mld)} Olympic pools</b> a day · <b>{depthPerDay(mld) * DAYS_MONTH} m</b> deep after a month
        </>
      ),
    }),
    title: 'And 65–90 million liters of water a day',
    body: (
      <>
        <p>
          That’s BCDA’s estimate for the zone. Pick a daily amount to see it as a column on the 1-hectare square:
          <Cite s={['tribune-water', 'scienceph']} />
        </p>
        {waterPickerEn}
        <Assumption title="The column shows volume only.">It is not a planned reservoir or its height.</Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>Depth = million liters × 1,000 cubic meters ÷ 10,000 square meters. 90 million liters: 90 × 1,000 ÷ 10,000 = 9 m. A week is 7 days, a month 30.</li>
        <li>An Olympic pool holds 2.5 million liters (50 × 25 × 2 m); BCDA itself compares 90 million liters to 36 pools.</li>
        <li>65 and 90 million: BCDA’s initial assessment, told to the Senate in August 2026. 130 million: Science.ph, an independent higher-end figure.
          <Cite s={['tribune-water', 'scienceph']} />
        </li>
      </ul>
    ),
  },
  'water-supply': {
    brief: (
      <>
        BCDA’s preliminary plan: three rivers and storage tanks. Critics’ dry-season math: up to <b>{shortfall(90)[1]} million liters a day short</b> at BCDA’s own estimate.
      </>
    ),
    title: 'Where would the water come from?',
    body: (
      <>
        <Bullets
          items={[
            <>
              <b>BCDA’s plan (preliminary):</b> the Bangut, O’Donnell and Abacan rivers, stored in tanks, not groundwater. It says the Bangut alone could
              give 130–200 million liters a day, from an initial dry-season assessment, not a published hydrological study.
              <Cite s={['tribune-water', 'gma-water']} />
            </>,
            <>
              <b>Also explored by BCDA:</b> desalinated seawater, piped along SCTEX.
              <Cite s="tribune-water" />
            </>,
            <>
              <b>Critics’ dry-season math:</b> at 130 million liters a day with reservoirs giving 65–120 million, the zone would be 10–65 million short. At
              BCDA’s 90 million, the same math gives {shortfall(90)[0]}–{shortfall(90)[1]} million.
              <Cite s="scienceph" />
            </>,
            <>
              <b>Recycling</b> 85–95% of used water would cut new water to 5–15% of demand, says one analysis, which warns that without it the zone may
              draw on wells families use.
              <Cite s="mendoza" />
            </>,
          ]}
        />
        <Assumption title="Map: conceptual area, not a site.">
          Blue: 390–780 hectares of reservoirs from one analysis. Area isn’t storage volume or daily supply.
        </Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>
          Reservoir area vs. volume vs. supply: area is the land a reservoir covers; volume is how much it stores (area × average depth); supply is what
          it can deliver each day. The 390–780 hectares has no published method; it matches storing half a year of the analysis’s 39 billion liters a
          year (19.5 million cubic meters) 5 m or 2.5 m deep (our reconstruction).
        </li>
        <li>The shortfall is subtraction: 130 − 120 = 10 and 130 − 65 = 65 million liters a day (Science.ph, citing a 2026 report by Magno).</li>
        <li>
          Rivers: the Bangut is “Bangot” on OpenStreetMap; GeoNames lists “Bangut River”. The O’Donnell River is drawn from OpenStreetMap. The Abacan
          River is in Angeles City, off this map. The analysis says El Niño cuts rainfall by 40–60%.
        </li>
        <li>
          Separately, BCDA is set to award New Clark City’s ₱14.8-billion water and wastewater project to Maynilad and K-Water after no rival bid
          (award hoped for by December). It would raise the city’s supply from about 20 to 150–200 million liters a day, for the whole city; BCDA
          hasn’t said how much would go to Pax Silica.
        
          <Cite s={['mendoza', 'scienceph', 'osm', 'geonames', 'ncc-water']} />
        </li>
      </ul>
    ),
  },
  proscons: {
    kicker: 'Pros & cons',
    title: 'The good and the bad, according to each side',
    body: (
      <ProsCons
        prosTitle="What supporters say"
        consTitle="What critics say"
        pros={[
          { title: 'Jobs', text: '130,000–190,000 jobs once fully built (government estimate).', cite: 'pna-signing' },
          { title: 'Investment', text: 'US$40–70 billion could come in.', cite: 'pna-signing' },
          { title: 'Better industry', text: 'Move from simple chip assembly to making high-tech parts.', cite: 'techpolicy' },
          { title: 'Use our own minerals', text: 'Process nickel here instead of shipping raw ore abroad.', cite: 'rfa' },
          { title: 'The land stays ours', text: 'The government keeps ownership; no diplomatic immunity for foreigners.', cite: 'gma-sovereignty' },
        ]}
        cons={[
          { title: 'Families could lose their land', text: 'Aeta ancestral land, farms and burial grounds are at risk.', cite: 'hrw' },
          { title: 'Huge power and water needs', text: 'About 3 GW of power and 65–90 million liters of water a day, by BCDA’s estimates.', cite: ['gma-3gw', 'tribune-water'] },
          { title: 'No study, little consultation', text: 'No environmental impact assessment yet. Communities say they weren’t consulted.', cite: ['gma-denr', 'hrw'] },
          { title: 'Generous terms for investors', text: 'Leases of up to 99 years; a bill proposes 7-year tax holidays.', cite: ['mongabay', 'gma-hb11758'] },
          { title: 'Jobs may not be good jobs', text: 'Unions warn of minimum-wage work and little technology transfer.', cite: ['techpolicy', 'cna'] },
          { title: 'Caught in the US–China rivalry', text: 'Critics say it ties the country to US strategic interests.', cite: 'techpolicy' },
        ]}
      />
    ),
  },
  benefit: {
    kicker: 'Who benefits more?',
    title: 'Filipinos or foreign countries?',
    body: (
      <>
        <p className="lead">Here’s what each side gets, based on what’s documented. We don’t give a verdict, because the deal isn’t signed yet.</p>
        <ScoreCard
          head={['', 'The Philippines', 'Foreign countries & investors']}
          tags={TAGS}
          rows={[
            {
              topic: 'Land',
              ph: { text: 'Stays government property and returns when the lease ends.', tag: 'doc', cite: ['boi-docs', 'mayonai'] },
              foreign: { text: 'Leases of up to 99 years; 2 years rent-free was offered.', tag: 'doc', cite: ['mongabay', 'boi-docs'] },
            },
            {
              topic: 'Money',
              ph: { text: 'US$40–70B investment target, plus rent for BCDA.', tag: 'promised', cite: 'pna-signing' },
              foreign: { text: 'A 7-year income tax holiday, then a 5% tax in place of other taxes.', tag: 'proposed', cite: 'gma-hb11758' },
            },
            {
              topic: 'Jobs',
              ph: { text: '130,000–190,000 jobs when fully built.', tag: 'promised', cite: 'pna-signing' },
              foreign: { text: 'Companies set wages and hiring. Unions warn of minimum-wage jobs.', tag: 'unclear', cite: 'techpolicy' },
            },
            {
              topic: 'Technology',
              ph: { text: 'Hope to move up from assembly; a bill would require skills transfer.', tag: 'proposed', cite: ['techpolicy', 'gma-hb11758'] },
              foreign: { text: 'A secure source of chips, parts and processed minerals outside China.', tag: 'goal', cite: ['techpolicy', 'state-apr16'] },
            },
            {
              topic: 'Power & water',
              ph: { text: 'Investors must build their own power and water systems.', tag: 'promised', cite: 'afp' },
              foreign: { text: 'Factories would use about 3 GW and 65–90 million liters a day (BCDA estimates).', tag: 'planned', cite: ['gma-3gw', 'tribune-water'] },
            },
            {
              topic: 'Who pays the price',
              ph: { text: 'Aeta and farming families risk losing land, farms and river access.', tag: 'reported', cite: 'hrw' },
              foreign: { text: 'Investors pay for their buildings and utilities.', tag: 'promised', cite: ['hrw', 'afp'] },
            },
          ]}
        />
        <div className="verdict snap">
          <h3>So who benefits more?</h3>
          <p>It can’t be scored yet. It depends on terms nobody has seen. Watch for these when the agreement is signed:</p>
          <ol>
            <li>How much rent and tax investors actually pay</li>
            <li>How many jobs go to Filipinos — and at what wages</li>
            <li>Whether real technology transfer is required</li>
            <li>Who gets water and power first in a drought</li>
            <li>Whether the Aeta and farmers give free, prior and informed consent</li>
          </ol>
        </div>
      </>
    ),
  },
  next: {
    kicker: 'What’s next',
    title: 'What happens next',
    body: (
      <Timeline
        items={[
          { date: 'By end-2026', text: 'Target signing of the main agreement.', cite: 'pna-signing', tag: 'next' },
          { date: 'Still needed', text: 'An environmental clearance for the zone itself. None had been filed as of August.', cite: 'gma-denr', tag: 'next' },
          { date: '2028', text: 'Target start of construction.', cite: 'cna', tag: 'next' },
        ]}
      />
    ),
  },
};
