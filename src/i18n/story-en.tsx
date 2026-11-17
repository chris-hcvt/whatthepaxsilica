import type { StoryStep } from './types';
import type { Chapter } from '../content/story';
import { REFS, CITY_STATS, HUB_HA } from '../content/story';
import { Cite, CityBars, Timeline } from '../components/bits';
import { BigNumber, Bullets, DotChart, ProsCons, RefPicker, ScoreCard } from '../components/story-bits';

export const chaptersEn: Record<Chapter, string> = {
  basics: 'The basics',
  plan: 'The plan',
  size: 'How big',
  people: 'The people',
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
    more: <p>Yellow dashes: New Clark City (about 9,450 ha). Red: the planned tech zone.</p>,
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
        We matched the Countermapping PH map (published by Human Rights Watch) to satellite images. Our outline covers about 1,738 ha, close to the
        official 1,619 ha. Details are in the full report.
      </p>
    ),
  },
  'size-number': {
    title: <BigNumber value="1,619" unit="hectares" />,
    body: (
      <p>
        That’s <b>16 square kilometers</b> — about <b>2,270 football fields</b>.
      </p>
    ),
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
                  ? `Based on area (${r.ha} ha each). In 3D: ${r.packed} whole copies, packed with the gaps that leaves.`
                  : r.basis === 'square'
                    ? `BGC is about 240 ha (BCDA). It has no published boundary, so it’s shown as a simple square.`
                    : `Outline traced along its main bounding roads: about ${Math.round(r.ha)} ha. One copy is shown in 3D.`}
              </p>
            </>
          );
        }}
      />
    ),
    more: (
      <p>
        Mall sizes are the mall lots mapped on OpenStreetMap. Makati CBD: EDSA, Gil Puyat, Chino Roces and Arnaiz avenues. Ortigas Center: EDSA, Ortigas
        Ave, Meralco Ave and Shaw Blvd (its association lists about 108 ha).
        <Cite s="osm" />
      </p>
    ),
  },
  'size-cities': {
    title: 'Bigger than some whole cities',
    body: (
      <CityBars
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
        Areas from OpenStreetMap boundaries; the zone uses the official {HUB_HA.toLocaleString('en-US')} ha.
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
                  Residents say the houses are <b>30 m²</b> and the offer for land was <b>₱30 per m²</b>. They said no.
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
