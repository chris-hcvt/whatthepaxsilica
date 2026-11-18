import type { StoryStep } from './types';
import type { Chapter } from '../content/story';
import { REFS, CITY_STATS, HUB_HA, HUB_COURTS, COURTS_PER_HECTARE } from '../content/story';
import { Cite, CityBars, Timeline } from '../components/bits';
import { BigNumber, Bullets, DotChart, EnergyPicker, HomePicker, ProsCons, RefPicker, ScoreCard } from '../components/story-bits';

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
/** homes, rounded the way people say them: 2 · 3,300 · 22,600 · 730,000 · 11 million */
const homesEn = (n: number) => {
  if (n >= 1e6) return `${Math.round(n / 1e6)} million`;
  if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString('en-US');
  return String(Math.round(n));
};

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
    title: 'What: factories for chips and AI parts',
    body: (
      <p>
        Plus processing of minerals like nickel. Officials say there will be <b>no data centers</b>. Construction is targeted for <b>2028</b>.
        <Cite s={['gma-sovereignty', 'cna']} />
      </p>
    ),
  },
  'plan-land': {
    title: 'The land stays Philippine-owned — but it will be rented out',
    body: (
      <p>
        Investors could lease it for up to <b>99 years</b>. Foxconn and Moog are named as possible first tenants, but <b>none is confirmed</b>.
        <Cite s={['mongabay', 'context-anchors', 'tribune-afp']} />
      </p>
    ),
  },
  'plan-status': {
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
    title: 'How many homes fit in 1 hectare?',
    body: (
      <>
        <p>Every house sits on a lot. Tap a size to fill the square:</p>
        <HomePicker
          names={{ regular: 'Regular home', medium: 'Medium home', large: 'Large home', mansion: 'Mansion' }}
          lot={(m2) => `${m2.toLocaleString('en-US')} square meters per lot`}
          count={(n) => (
            <>
              <b>{n}</b> homes
            </>
          )}
        />
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
    title: 'Now imagine it leveled',
    body: <p>We flattened the land inside the zone so you can compare it with places you know.</p>,
    more: <p>This is only an illustration for comparing sizes. It is not a construction plan.</p>,
  },
  'size-compare': {
    title: 'How many would fit?',
    body: (
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
    ),
    more: (
      <p>
        Mall sizes are the mall lots mapped on OpenStreetMap. Makati CBD: EDSA, Gil Puyat, Chino Roces and Arnaiz avenues. Ortigas Center: EDSA, Ortigas
        Ave, Meralco Ave and Shaw Blvd (its association lists about 108 hectares).
        <Cite s="osm" />
      </p>
    ),
  },
  'size-cities': {
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
    title: 'Drop it on your city',
    body: <p>Pick a city, or search your town. The outline keeps its real size.</p>,
  },
  'people-1': {
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
    title: 'How much electricity is 3 gigawatts?',
    body: (
      <>
        <p>
          BCDA expects about <b>3 gigawatts</b> at full development. Monthly use and bill at Meralco’s household rate (₱15.55 per kWh):
          <Cite s={['gma-3gw', 'meralco-nov']} />
        </p>
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
          detail={(k, homes) =>
            k === 'regular' ? (
              <>
                <b>Meralco’s typical household:</b> 200 kWh a month, about ₱3,110 at November 2026 rates.
              </>
            ) : k === 'hub' ? (
              <>
                As much as <b>about {homesEn(homes)} typical homes</b>, and about <b>a fifth of Luzon’s peak demand</b>. BCDA calls 3 gigawatts a
                conservative first estimate.
              </>
            ) : (
              <>
                {k === 'office' ? 'A 50,000-square-meter office tower' : k === 'mall' ? 'One big mall (SM City Fairview)' : k === 'fab' ? 'One advanced chip factory' : 'This home'}{' '}
                uses as much as <b>{homesEn(homes)} typical homes</b>.
              </>
            )
          }
        />
      </>
    ),
    more: (
      <p>
        The same household rate is used for everything so the bills compare directly; big users usually pay less per kWh. Medium, large and mansion
        homes are example amounts. Office tower: 50,000 square meters at Ayala Land’s 2024 office average (157 kWh per square
        meter a year). Mall: SM City Fairview’s rooftop solar makes 5,960 MWh a year, which SM says is 11% of the mall’s use. Chip factory: about 200
        megawatts for each advanced wafer factory (Taipower). The zone: 3 gigawatts running all month (730 hours). Luzon’s forecast peak for 2026: about
        14,600 megawatts.
        <Cite s={['ayala-offices', 'sm-fairview', 'fab-power', 'iemop']} />
      </p>
    ),
  },
  'power-supply': {
    title: 'How could they power it?',
    body: (
      <Bullets
        items={[
          <>
            <b>BCDA’s plan: mostly solar.</b> It says 500 megawatts is already available, a sixth of the need.
            <Cite s="gma-3gw" />
          </>,
          <>
            <b>Solar stops at night,</b> so one analysis adds a 1-gigawatt gas (LNG) plant in New Clark City, on imported fuel.
            <Cite s="mendoza" />
          </>,
          <>
            <b>The solar farms would need about 20,000 hectares</b>, 12 times the zone (the blue square), mostly elsewhere in Central Luzon.
            <Cite s="mendoza" />
          </>,
          <>
            <b>Nuclear has been raised too,</b> at about US$6–10 billion for 1 gigawatt.
            <Cite s="scienceph" />
          </>,
        ]}
      />
    ),
    more: (
      <p>
        The analysis pairs about 2 gigawatts of solar with the gas plant, and puts the energy and water setup at ₱301–424 billion up front, plus about
        50 kilometers of power lines to the solar farms. BCDA says it is studying solar with battery storage. For nuclear, the country has no permanent
        site for nuclear waste. No final power plan has been published.
        <Cite s={['mendoza', 'tribune-water']} />
      </p>
    ),
  },
  'water-volume': {
    title: 'And 65–90 million liters of water a day',
    body: (
      <>
        <p>
          That’s BCDA’s own estimate: up to <b>36 Olympic-size pools every day</b>.
          <Cite s="tribune-water" />
        </p>
        <p>
          Pour one day of it on the 1-hectare square and it stands <b>9 meters deep</b>. In a week, 63 meters. In a month, <b>270 meters</b>, as tall
          as a 90-storey building.
        </p>
        <p className="muted small">
          The highest estimate reported is 130 million liters a day, about what 600,000 households use.
          <Cite s="scienceph" />
        </p>
      </>
    ),
    more: <p>90 million liters is 90,000 cubic meters. Spread over 1 hectare (10,000 square meters), that is 9 meters deep. A storey is about 3 meters.</p>,
  },
  'water-supply': {
    title: 'Where would the water come from?',
    body: (
      <>
        <Bullets
          items={[
            <>
              <b>Rivers, not groundwater, says BCDA:</b> the Bangut, O’Donnell and Abacan, stored in tanks. It says the Bangut alone gives 130–200
              million liters a day.
              <Cite s="tribune-water" />
            </>,
            <>
              <b>Desalinated seawater</b>, piped along SCTEX, is also being studied.
              <Cite s="tribune-water" />
            </>,
            <>
              <b>Dry years are the worry:</b> in El Niño years the reservoirs could run 10–65 million liters a day short.
              <Cite s={['mendoza', 'scienceph']} />
            </>,
            <>
              <b>Recycling</b> could cut new water to 6–20 million liters a day, for ₱10–20 billion. Without it, the zone may lean on wells families use.
              <Cite s="mendoza" />
            </>,
          ]}
        />
        <p className="muted small">Blue: 390–780 hectares of reservoirs (one analysis), drawn in the zone for size.</p>
      </>
    ),
    more: (
      <p>
        BCDA’s river figure comes from a dry-season study, and it expects more water in the rainy season. Critics note that rain falls 40–60% in El
        Niño years. The Bangut is the river labelled “Bangot” on the map. The analysis adds that recycling would cost ₱0.8–2 billion a year to run.
        <Cite s={['tribune-water', 'mendoza']} />
      </p>
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
          { title: 'Huge power and water needs', text: 'About 3 GW of power and 60–90 million liters of water a day.', cite: 'cna' },
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
              foreign: { text: 'Factories would use about 3 GW and 60–90 million liters a day.', tag: 'planned', cite: 'cna' },
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
