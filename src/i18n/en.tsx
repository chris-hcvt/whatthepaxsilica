import type { Locale } from './types';
import {
  Actors,
  Cite,
  CityBars,
  DocList,
  GainsTable,
  Goals,
  Lead,
  MallPicker,
  Note,
  NumberChart,
  Quote,
  SourceList,
  Stat,
  StatGrid,
  Timeline,
  TwoCol,
} from '../components/bits';
import { FACTS, timesFit } from '../content/slides';
import { MEMBERS } from '../content/members';
import { chaptersEn, storyEn } from './story-en';

const fmt = (n: number) => n.toLocaleString('en-US');

export const en: Locale = {
  code: 'en',
  name: 'English',
  ui: {
    siteTitle: 'What the Pax Silica?',
    tagline: 'A 1,619-hectare tech zone is planned in Capas, Tarlac. What every Filipino should know — in about 4 minutes.',
    sources: 'Sources',
    allSources: 'Sources & documents',
    close: 'Close',
    language: 'Language',
    share: 'Share',
    copied: 'Link copied',
    loading3d: 'Loading 3D terrain…',
    error3d: 'The 3D view could not load. Check your connection and reload.',
    noWebgl: 'Your device cannot show 3D graphics, but all the facts are in the text.',
    dragHint: 'Drag to look around · pinch or scroll to zoom',
    approx: 'approx. outline',
    skipTo: 'Skip to content',
    fullReport: 'Full report',
    backToStory: '← Back to the story',
    learnMore: 'Learn more',
    scrollCue: 'Scroll to start',
    chooseLanguage: 'Choose your language',
    moreLanguagesSoon: 'More languages coming soon',
    soon: 'soon',
    mapSearch: 'Search a city or town…',
    mapSearchGo: 'Go',
    mapNotFound: 'Place not found. Try another spelling, or pick a town from the suggestions.',
    mapSearchBusy: 'Online search is busy right now. Pick a town from the suggestions, or tap the map.',
    mapHint: 'Tip: tap anywhere on the map to move the outline there.',
    hectares: 'hectares',
    reportTitle: 'Full report',
    reportIntro: 'The detailed version: every claim, number and document, with sources. Official claims and their critics are shown side by side.',
    contents: 'Contents',
    reportError: 'Report an error',
    insetPlace: 'Capas, Tarlac',
    insetNote: 'The Philippines is one of about 25 Pax Silica countries.',
    stepOf: (k, n) => `${k} of ${n}`,
    credits: 'Map outline: A. Ortega / Countermapping PH (via Human Rights Watch), georeferenced. Imagery: Copernicus Sentinel-2 (2026). Terrain: Copernicus DEM. Maps: © OpenStreetMap contributors, OpenFreeMap. Place search: GeoNames.',
    prev: 'Previous',
    next: 'Next',
  },
  acts: {
    intro: '',
    what: 'What is Pax Silica?',
    ph: 'The Philippines’ part',
    size: 'How big is it?',
    people: 'Who lives there?',
    who: 'Who’s involved',
    next: 'What happens next',
  },
  kinds: {
    official: 'Official documents & statements',
    'state-media': 'Government news agency',
    rights: 'Human rights organizations',
    mapping: 'Independent mapping',
    analysis: 'Independent analysis',
    news: 'News reports',
    advocacy: 'Advocacy groups',
    reference: 'Reference',
    data: 'Map & satellite data',
  },
  site: {
    hub: 'Pax Silica hub · approx. outline',
    ncc: 'New Clark City',
    inside: 'inside the mapped hub',
    outside: (km) => `${km} km outside the edge`,
    refCount: (n, name, kind) => (kind === 'mall' ? `${n} whole ${name} sites, to scale` : n === 1 ? `1 whole ${name}, to scale` : `${n} whole ${name}s, to scale`),
    levelled: 'Leveled for comparison (illustration)',
    fx: {
      manila: 'Manila · about 75 km',
      icons: ['Chips & AI parts', 'High-tech factories', 'Mineral processing'],
      noDataCentres: 'No data centers, says DTI',
      lease: 'BCDA owns the land · investors lease it up to 99 years',
      unknowns: ['No signed agreement yet', 'No environmental study yet', 'No official map yet'],
      side: '100 meters',
      court: '1 basketball court',
      oneHectare: '1 hectare',
      makati: 'Makati City · 1,815 hectares',
      families: '≈ 200 Aeta Hungey families',
      river: 'Bangot River',
      creek: 'Sapang Kawayan creek',
      farms: 'Farmland (OpenStreetMap)',
    },
  },
  cities: {
    makati: 'Makati (Ayala)',
    qc: 'Quezon City',
    manila: 'Manila (Quiapo)',
    bgc: 'BGC, Taguig',
    ortigas: 'Ortigas',
    cebu: 'Cebu City',
    davao: 'Davao City',
    baguio: 'Baguio',
    iloilo: 'Iloilo City',
    cdo: 'Cagayan de Oro',
    bacolod: 'Bacolod',
    zamboanga: 'Zamboanga City',
    tarlac: 'Tarlac City',
    capas: '↩ Real site (Capas)',
  },
  chapters: chaptersEn,
  story: storyEn,
  slides: {
    intro: {
      title: 'What the Pax Silica?',
      body: (
        <>
          <Lead>
            A US-led pact to control the supply chain for chips and AI — and a {fmt(FACTS.hubHa)}-hectare industrial hub planned on land where Aeta
            communities and farmers live in Capas, Tarlac.
          </Lead>
          <p className="muted">
            An evidence-first explainer. Official claims and their critics are shown side by side, and every number links to its source. Use ← → or swipe.
          </p>
        </>
      ),
    },
    name: {
      kicker: 'The name',
      title: 'Pax + Silica',
      body: (
        <>
          <p>
            <b>Pax</b> is Latin for “peace” — as in <i>Pax Romana</i> or <i>Pax Americana</i>, a peace kept by a dominant power. <b>Silica</b> points to
            silicon, the material computer chips are made from.
          </p>
          <p>
            Put together: a “silicon peace” — an order built around <b>who makes, controls and supplies</b> the world’s chips, the minerals inside them,
            and the AI that runs on them.
            <Cite s={['state-paxsilica', 'wikipedia']} />
          </p>
        </>
      ),
    },
    launch: {
      kicker: 'Launched December 12, 2025 · Washington, D.C.',
      title: 'A US State Department initiative',
      body: (
        <>
          <p>
            Pax Silica is the US State Department’s flagship initiative on AI and supply-chain security. It began with a <b>non-binding declaration</b>{' '}
            signed by partner governments, led by Under Secretary <b>Jacob Helberg</b>.
            <Cite s={['state-paxsilica', 'techpolicy']} />
          </p>
          <Quote
            text="If the 20th century ran on oil and steel, the 21st century runs on compute and the minerals that feed it."
            who="Jacob Helberg, US Under Secretary of State"
            cite="techpolicy"
          />
          <p className="muted">Non-binding means it is a statement of shared intent, not a treaty. Concrete deals are negotiated country by country.</p>
        </>
      ),
    },
    goals: {
      kicker: 'Its stated goals',
      title: 'Secure the whole “tech stack” among trusted partners',
      body: (
        <>
          <p>
            The State Department lists areas for cooperation that cover the full chain — from digging up minerals to running AI models.
            <Cite s={['state-paxsilica', 'wikipedia']} />
          </p>
          <Goals
            items={[
              { icon: 'mineral', title: 'Critical minerals', text: 'Mining, refining and processing — e.g. nickel, copper, rare earths.' },
              { icon: 'energy', title: 'Energy', text: 'Power for chip plants and data centers.' },
              { icon: 'chip', title: 'Compute & semiconductors', text: 'Making chips and the computing power AI needs.' },
              { icon: 'factory', title: 'Advanced manufacturing', text: 'High-end factories and components.' },
              { icon: 'logistics', title: 'Logistics', text: 'Shipping routes and trusted trade corridors.' },
              { icon: 'network', title: 'Connectivity & data', text: 'Networks and data infrastructure.' },
            ]}
          />
          <Note>
            Officials describe it as reducing “coercive dependencies.” The declaration avoids naming a country, but US officials and most analysts say the
            aim is to compete with China in these supply chains.
            <Cite s={['wikipedia', 'techpolicy']} />
          </Note>
        </>
      ),
    },
    members: {
      kicker: 'Membership is by US invitation',
      title: 'From 7 signatories to about 25',
      body: (
        <>
          <p>
            Seven governments signed on day one: the US, Australia, Israel, Japan, South Korea, Singapore and the UK. By November 2026 the list had grown
            to about <b>25</b>, across Asia, Europe, the Middle East and Latin America.
            <Cite s={['wikipedia', 'techpolicy']} />
          </p>
          <p className="memberlist">
            {MEMBERS.map((m) => (
              <span key={m.iso3} className={m.iso3 === 'PHL' ? 'ph' : m.founding ? 'founding' : ''}>
                {m.name}
              </span>
            ))}
          </p>
          <Note>
            Counts differ between sources (23–26), depending on how they treat the Netherlands, the European Union and observers. Taiwan takes part
            without signing.
          </Note>
        </>
      ),
    },
    'ph-joins': {
      kicker: 'April 16–17, 2026',
      title: 'The Philippines signs on',
      body: (
        <>
          <p>
            On <b>April 16</b>, Washington and Manila announced plans for a <b>4,000-acre “Economic Security Zone”</b> — billed as the “first AI-native
            industrial acceleration hub under Pax Silica.”
            <Cite s="state-apr16" />
          </p>
          <p>
            On <b>April 17</b>, Trade Undersecretary <b>Ceferino Rodolfo</b> signed the declaration, making the Philippines the 13th signatory by the
            government news agency’s count.
            <Cite s="pna-joins" />
          </p>
          <StatGrid>
            <Stat value="~US$50B" label="semiconductors & electronics exports in 2025 — the country’s top export" cite="cna" tone="teal" />
            <Stat value="#2" label="nickel producer in the world, after Indonesia" cite="cna" tone="teal" />
          </StatGrid>
          <Note>Most of that chip work is assembly, testing and packaging — the lower-value end. Officials say the hub is meant to move the country up.</Note>
        </>
      ),
    },
    'paper-trail': {
      kicker: 'What has actually been signed',
      title: 'The paper trail',
      body: (
        <>
          <p>
            The Board of Investments has published the key documents.
            <Cite s="boi-docs" /> Here is what they establish — and what is still missing.
            <Cite s="mayonai" />
          </p>
          <DocList
            items={[
              {
                date: 'Apr 9',
                title: 'BCDA’s proposal to the US',
                text: 'Offers about 4,000 acres for a “coordination office,” with two years free of rent. It refers to a site map (“Annex A”) that is not in the published copy.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Apr 16',
                title: 'US reply',
                text: 'Accepts — but only “subject to” confirming the exact location and boundaries and signing a lease.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Jun 25',
                title: 'AI Opportunity Partnership',
                text: 'A broader cooperation package that also encourages investment in data centers.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Pending',
                title: 'Framework / master lease agreement',
                text: 'Not yet signed. The Palace targets signing “before the end of 2026.”',
                cite: ['pna-signing', 'hrw'],
                status: 'pending',
              },
              {
                date: 'Missing',
                title: 'Environmental impact assessment',
                text: 'DENR said in August that none had been applied for, and that there was “no clear project description.”',
                cite: 'gma-denr',
                status: 'missing',
              },
            ]}
          />
        </>
      ),
    },
    'the-hub': {
      kicker: 'Capas, Tarlac · ~75 km north of Manila',
      title: 'The hub: “Clark Advanced Manufacturing Park”',
      body: (
        <>
          <p>
            The hub is planned inside <b>New Clark City</b> — a {fmt(FACTS.nccHa)}-hectare government estate on land that was once part of the US Clark
            military reservation, returned to the Philippines in 1991.
            <Cite s={['rfa', 'gma-relocation']} />
          </p>
          <p>
            It would cover about <b>{fmt(FACTS.hubHa)} hectares (4,000 acres)</b>. The land stays owned by the Bases Conversion and Development Authority
            (<b>BCDA</b>); investors would lease it. The Investors’ Lease Act, signed in September, allows leases of up to <b>99 years</b>.
            <Cite s={['gma-sovereignty', 'mongabay', 'pna-signing']} />
          </p>
          <Note>
            The New Clark City and hub outlines used in the story are approximate — see “Where exactly?” for how they were made.
          </Note>
        </>
      ),
    },
    specs: {
      kicker: 'Projections, not commitments',
      title: 'The hub by the numbers',
      body: (
        <>
          <StatGrid>
            <Stat value={`${fmt(FACTS.hubHa)} hectares`} label={`≈ ${FACTS.hubKm2} square kilometers · 4,000 acres`} cite={['rfa', 'pna-signing']} tone="red" />
            <Stat value="US$40–70B" label="investment at full development (BCDA); US$10B initial target" cite={['pna-signing', 'gma-sovereignty']} />
            <Stat value="130k–190k" label="jobs at full development (BCDA). Another official estimate: up to 150k direct, 50k construction, 800k indirect" cite={['pna-signing', 'gma-sovereignty']} />
            <Stat value="~3 GW" label="electricity needed at full development (BCDA)" cite={['mongabay', 'cna']} tone="amber" />
            <Stat value="60–90M L" label="of water per day (BCDA)" cite={['cna', 'techpolicy']} tone="amber" />
            <Stat value="2028" label="target start of construction" cite={['cna', 'techpolicy']} />
          </StatGrid>
          <p>
            <b>What would be built:</b> high-tech components for AI and semiconductors, and mineral processing. In September, DTI said there would be{' '}
            <b>no data centers</b> — earlier BCDA briefings had mentioned them.
            <Cite s={['gma-sovereignty', 'mayonai']} />
          </p>
          <p>
            <b>Who might come:</b> PEZA named Taiwan’s <b>Foxconn</b> and US-based <b>Moog</b> as prospective anchor investors. No tenant has been
            confirmed.
            <Cite s={['context-anchors', 'tribune-afp']} />
          </p>
        </>
      ),
    },
    outline: {
      kicker: 'The government hasn’t published the boundary',
      title: 'Where exactly?',
      body: (
        <>
          <p>
            BCDA turned down a freedom-of-information request for the site’s official boundary map, saying it was “withheld temporarily until the official
            action is finalized or published.”
            <Cite s={['afp', 'tribune-afp']} />
          </p>
          <p>
            Independent geographers supporting the Aeta — <b>A. Ortega / Countermapping PH</b> — mapped the hub from the available information. Human
            Rights Watch published their map on November 16.
            <Cite s={['countermapping', 'hrw']} />
          </p>
          <p>
            We matched that map to satellite imagery to place it on real coordinates. Our outline encloses about <b>{fmt(FACTS.outlineHa)} hectares</b>, close to
            the official {fmt(FACTS.hubHa)} hectares (+7%). Village positions agree with OpenStreetMap to within a few hundred meters.
            <Cite s={['copernicus', 'osm']} />
          </p>
          <Note>Treat the outline as approximate (±~0.5 km). If BCDA publishes the real boundary, we will replace it.</Note>
        </>
      ),
    },
    malls: {
      kicker: 'A sense of scale',
      title: `${timesFit(FACTS.malls.moa)} Malls of Asia`,
      body: (
        <>
          <p>
            Using the official {fmt(FACTS.hubHa)} hectares and the mall lots as mapped on OpenStreetMap, here is how many times each mall’s whole site fits in the
            hub.
            <Cite s="osm" />
          </p>
          <MallPicker
            label={(n, name, ha, packed) => (
              <>
                <b className="big">{n}×</b> {name} <span className="muted">({ha} hectares each)</span>
                <span className="packed">
                  That’s by area. Packed as whole buildings, with the gaps that leaves, <b>{packed}</b> copies fit inside the mapped outline (see the 3D view in the story).
                </span>
              </>
            )}
          />
          <StatGrid>
            <Stat value={`≈ ${fmt(Math.round((FACTS.hubHa * 10000) / 420 / 100) * 100)}`} label="basketball courts (28 × 15 meters each)" cite="court" />
            <Stat value={`${fmt(FACTS.hubHa * 10000)}`} label="square meters (1 hectare = 10,000 square meters)" />
          </StatGrid>
          
        </>
      ),
    },
    cities: {
      kicker: 'Compared with Metro Manila',
      title: 'Bigger than some whole cities',
      body: (
        <>
          <p>
            The hub’s official area, against city and campus boundaries in Metro Manila as drawn on OpenStreetMap.
            <Cite s="osm" />
          </p>
          <CityBars
            unit="hectares"
            hubLabel={<b>Pax Silica hub</b>}
            rows={[
              { name: 'Makati City', ha: FACTS.cities.makati },
              { name: 'Mandaluyong City', ha: FACTS.cities.mandaluyong },
              { name: 'San Juan City', ha: FACTS.cities.sanjuan },
              { name: 'UP Diliman campus', ha: FACTS.cities.updiliman },
              { name: 'Rizal Park (Luneta)', ha: FACTS.cities.rizalpark },
            ]}
          />
          <StatGrid>
            <Stat value="≈ 2.8×" label="San Juan City" tone="red" />
            <Stat value="≈ 1.4×" label="Mandaluyong City" tone="red" />
            <Stat value="≈ 89%" label="of Makati City" tone="red" />
            <Stat value="≈ 3.2×" label="UP Diliman campus" tone="red" />
          </StatGrid>
          <Note>Boundary areas are computed from OpenStreetMap and can differ slightly from official land-area figures.</Note>
        </>
      ),
    },
    communities: {
      kicker: 'Barangays Aranguren and O’Donnell, Capas',
      title: 'Who lives there',
      body: (
        <>
          <p>
            <b className="red">Sapang Kawayan</b> (Brgy. Aranguren) — home of the <b>Aeta Hungey</b>, about 200 households. On the independent map it lies{' '}
            <b>inside</b> the hub. Their ancestral-domain claim was filed in 1994 and refiled in 1999; it has never been titled.
            <Cite s={['rfa', 'hrw', 'countermapping']} />
          </p>
          <p>
            <b className="amber">Sitio Binyayan</b> (Brgy. O’Donnell) — farming families without land titles. BCDA told them their farmland, not their
            homes, would be affected.
            <Cite s="hrw" />
          </p>
          <p>
            <b className="amber">Sitio Manabayucan</b> — the <b>Ayta Mag-antsi</b>, just outside the mapped edge.
            <Cite s={['hrw', 'countermapping']} />
          </p>
          <Note>
            Communities are shown at village level only. Residents depend on the Bangot River for water and fish.
            <Cite s="rfa" />
          </Note>
        </>
      ),
    },
    voices: {
      kicker: 'In their words',
      title: 'Voices from both sides',
      body: (
        <div className="quotes">
          <Quote
            side="community"
            text="We do not want to give up our community. How do we give up our burial grounds, our church, our livelihood? This is where we source our water, this is where we plant."
            who="Petronila Capiz-Muñoz, chieftain of the Aeta Hungey"
            cite="hrw"
          />
          <Quote side="community" text="Money is temporary; land is forever." who="A farmer in Sitio Binyayan" cite="hrw" />
          <Quote
            side="gov"
            text="They will not be displaced. They will just be pushed a little bit but they will still be in the same barangay, the same community, the same BCDA land."
            who="Joshua Bingcang, then BCDA president"
            cite="rfa"
          />
          <Quote
            side="gov"
            text="I cannot see how such a development will endanger local livelihood."
            who="President Ferdinand Marcos Jr., Oct 13, 2026"
            cite="cna"
          />
          <Quote
            side="community"
            text="We’re not saying we’re against Pax Silica… please afford us with public consultations so we know the details of the project…"
            who="Roseller Rodriguez, mayor of Capas"
            cite="cna"
          />
        </div>
      ),
    },
    numbers: {
      kicker: 'There is no official count yet',
      title: 'How many people would be affected?',
      body: (
        <>
          <p>
            Figures range from dozens to tens of thousands, and they measure different things. No official household total has been published; BCDA and
            the NCIP began updating a census in September.
            <Cite s="bcda-census" />
          </p>
          <div className="ncharts">
            <NumberChart
              title="People"
              max={20000}
              rows={[
                { value: 92, display: '92', who: 'BCDA letter, Jul 16', what: '“affected persons” in Brgy. O’Donnell, incl. Binyayan farmers', cite: 'hrw', side: 'gov' },
                { value: 200, display: '~200', who: 'BCDA (Bingcang), Sep', what: 'people; ~10 hectares of the site', cite: 'rfa', side: 'gov' },
                { value: 1000, display: '~1,000', who: 'AFP report', what: 'Aetas concerned about displacement', cite: 'tribune-afp', side: 'media' },
                { value: 20000, display: '~20,000', who: 'Kalikasan PNE', what: 'Aeta residents and farmers (disputed by the Palace)', cite: 'summit', side: 'critic' },
              ]}
            />
            <NumberChart
              title="Households / families"
              max={20000}
              rows={[
                { value: 40, display: '40', who: 'BCDA (Bingcang), Sep', what: 'Aeta households to be “pushed a little bit”', cite: ['rfa', 'hrw'], side: 'gov' },
                { value: 200, display: '~200', who: 'RFA', what: 'households in Sapang Kawayan village', cite: 'rfa', side: 'media' },
                { value: 1000, display: '~1,000', who: 'Chieftain Capiz-Muñoz', what: 'families on their ancestral land', cite: 'pressenza', side: 'critic' },
              ]}
            />
          </div>
          <Note>Bars use a logarithmic scale so that very different numbers fit side by side. Human Rights Watch says “hundreds” would be displaced.</Note>
        </>
      ),
    },
    offer: {
      kicker: 'Relocation and compensation',
      title: 'What is being offered',
      body: (
        <>
          <p>
            <b>BCDA’s plan (Oct 19):</b> about <b>50 houses</b> on a 10-hectare site elsewhere in New Clark City (₱25–30 million in total), <b>100 hectares</b> of
            alternative farmland inside a 3,000-hectare no-build zone, and possible jobs on a BCDA farming project.
            <Cite s="gma-relocation" />
          </p>
          <p>
            <b>Where:</b> officials told the House on Nov 11 that the relocation site is in Sitio Binyayan, about 3 km from Sapang Kawayan — away from the
            streams residents use for water.
            <Cite s="hrw" />
          </p>
          <p>
            <b>What residents report:</b> new homes of 30 m² per family, a request to leave by December, and offers of ₱300,000 per hectare (₱30 per m²)
            for land, which they refused.
            <Cite s={['hrw', 'afp', 'summit']} />
          </p>
          <Note>BCDA says it has a “general understanding” with the communities. The Aeta Hungey chieftain told reporters there had been no consultation with her tribe.</Note>
        </>
      ),
    },
    'two-sides': {
      kicker: 'The core dispute',
      title: 'The government’s case — and the critics’',
      body: (
        <TwoCol
          leftTitle="Government says"
          rightTitle="Critics say"
          left={
            <ul>
              <li>
                No Indigenous communities or Aeta burial grounds will be displaced.
                <Cite s="philstar-marcos" />
              </li>
              <li>
                The site is public land zoned for industry under the 1992 Bases Conversion law (RA 7227); “there is no ancestral domain title in that area.”
                <Cite s={['techpolicy', 'mongabay']} />
              </li>
              <li>
                It sits within a 3,500-hectare “buildable zone” identified in 2019.
                <Cite s="summit" />
              </li>
              <li>
                It stays Philippine territory — “no diplomatic immunity or carve-out of any kind.”
                <Cite s="gma-sovereignty" />
              </li>
              <li>
                A census with the NCIP will guide assistance; “no community is left behind.”
                <Cite s="bcda-census" />
              </li>
            </ul>
          }
          right={
            <ul>
              <li>
                BCDA never obtained the free, prior and informed consent of the Aeta.
                <Cite s="hrw" />
              </li>
              <li>
                The site overlaps the Aeta Hungey ancestral-domain claim, pending since 1999. A missing title doesn’t erase the claim.
                <Cite s={['hrw', 'mongabay']} />
              </li>
              <li>
                No environmental impact assessment; “no clear project description” (DENR, August).
                <Cite s="gma-denr" />
              </li>
              <li>
                Local officials are still waiting for public consultation.
                <Cite s={['hrw', 'cna']} />
              </li>
              <li>
                Water and power demands would compete with farms and households.
                <Cite s={['cna', 'mongabay']} />
              </li>
            </ul>
          }
        />
      ),
    },
    actors: {
      kicker: 'Who is behind it, and who is pushing back',
      title: 'Who’s involved',
      body: (
        <Actors
          groups={[
            {
              title: 'United States',
              tone: 'us',
              items: [
                { name: 'State Department', role: 'Runs Pax Silica; Under Secretary Jacob Helberg leads it', cite: 'state-paxsilica' },
                { name: 'Sec. Marco Rubio', role: 'Visited Manila in July to affirm the project', cite: 'mongabay' },
              ],
            },
            {
              title: 'Philippine government',
              tone: 'gov',
              items: [
                { name: 'President Marcos Jr.', role: 'Champions the hub; says no one will be displaced', cite: 'philstar-marcos' },
                { name: 'BCDA', role: 'Landowner and developer. Joshua Bingcang (outgoing), Ariel Nepomuceno (incoming)', cite: ['bcda-census', 'techpolicy'] },
                { name: 'DTI / Board of Investments', role: 'Usec. Ceferino Rodolfo signed the declaration', cite: 'pna-joins' },
                { name: 'NCIP · DENR · PEZA', role: 'Indigenous census · environmental review · investor promotion', cite: ['bcda-census', 'gma-denr', 'context-anchors'] },
              ],
            },
            {
              title: 'Companies (none confirmed)',
              tone: 'biz',
              items: [
                { name: 'Foxconn, Moog', role: 'Named by PEZA as prospective anchor investors', cite: 'context-anchors' },
                { name: 'Power & water', role: 'A 500 MW solar supply contract awarded to a Saudi firm; a water concession for New Clark City under bidding', cite: ['techpolicy', 'mayonai'] },
              ],
            },
            {
              title: 'Congress',
              tone: 'congress',
              items: [{ name: 'House Bill 11758', role: 'Proposes an Advanced Industries Zone with tax holidays for locators', cite: 'gma-hb11758' }],
            },
            {
              title: 'Affected communities',
              tone: 'people',
              items: [
                { name: 'Aeta Hungey', role: 'Sapang Kawayan, Brgy. Aranguren', cite: 'hrw' },
                { name: 'Ayta Mag-antsi', role: 'Sitio Manabayucan', cite: 'hrw' },
                { name: 'Farmers of Sitio Binyayan', role: 'Brgy. O’Donnell', cite: 'hrw' },
              ],
            },
            {
              title: 'Watchdogs & opposition',
              tone: 'watch',
              items: [
                { name: 'NO to Pax Silica network', role: '70+ groups launched Aug 31 — farmers, Aeta, scientists, churches, youth', cite: 'pressenza' },
                { name: 'Human Rights Watch', role: 'Documented displacement risks', cite: 'hrw' },
                { name: 'Countermapping PH', role: 'Mapped the hub and ancestral domains', cite: 'countermapping' },
              ],
            },
          ]}
        />
      ),
    },
    gains: {
      kicker: 'As claimed by each side',
      title: 'Who stands to gain — and who bears the cost',
      body: (
        <GainsTable
          head={['', 'Expected gains (as claimed)', 'Costs & risks (as raised)']}
          rows={[
            {
              who: 'United States',
              gains: (
                <>
                  A trusted supply chain for chips, AI parts and processed minerals outside China.
                  <Cite s={['techpolicy', 'state-apr16']} />
                </>
              ),
              costs: (
                <>
                  Critics say the pact mainly serves US strategic and defense interests.
                  <Cite s="techpolicy" />
                </>
              ),
            },
            {
              who: 'Investors',
              gains: (
                <>
                  Long leases (up to 99 years) and proposed incentives such as a 7-year income tax holiday.
                  <Cite s={['mongabay', 'gma-hb11758']} />
                </>
              ),
              costs: (
                <>
                  Must build their own power and water systems.
                  <Cite s="afp" />
                </>
              ),
            },
            {
              who: 'Government & BCDA',
              gains: (
                <>
                  Investment, lease income, and a move up the semiconductor value chain.
                  <Cite s={['pna-signing', 'techpolicy']} />
                </>
              ),
              costs: (
                <>
                  Pressure on the grid and water; questions over sovereignty and transparency.
                  <Cite s={['cna', 'techpolicy']} />
                </>
              ),
            },
            {
              who: 'Workers',
              gains: (
                <>
                  Up to 150,000 direct jobs promised.
                  <Cite s="gma-sovereignty" />
                </>
              ),
              costs: (
                <>
                  Unions and economists warn of minimum-wage jobs and little technology transfer.
                  <Cite s={['techpolicy', 'cna']} />
                </>
              ),
            },
            {
              who: 'Aeta & farmers',
              gains: (
                <>
                  Relocation housing, alternative farmland, possible farm jobs.
                  <Cite s="gma-relocation" />
                </>
              ),
              costs: (
                <>
                  Loss of ancestral land, farms, burial grounds and river access.
                  <Cite s={['hrw', 'rfa']} />
                </>
              ),
            },
          ]}
        />
      ),
    },
    resources: {
      kicker: 'Power and water',
      title: 'A city-sized appetite',
      body: (
        <>
          <StatGrid>
            <Stat value="~3 GW" label="≈ the output of three coal plants" cite={['techpolicy', 'mongabay']} tone="amber" />
            <Stat value="26.3 TWh" label="a year if run nonstop — vs. 28 TWh used by the whole PH services sector in 2024" cite="mongabay" tone="amber" />
            <Stat value="60–90M L" label="water a day ≈ 600,000 households" cite={['cna', 'techpolicy']} tone="amber" />
          </StatGrid>
          <p>
            <b>The plan:</b> harvest and recycle surface water, a 500 MW solar contract, talks on a gas (LNG) plant; investors to build their own power
            and water systems.
            <Cite s={['techpolicy', 'afp']} />
          </p>
          <p>
            <b>The worry:</b> the dry season (December–May) is also when farmers need water for irrigation.
            <Cite s={['mongabay', 'cna']} />
          </p>
          <Note>These are planning estimates for full development, not measured use.</Note>
        </>
      ),
    },
    timeline: {
      kicker: 'December 2025 → today',
      title: 'Timeline',
      body: (
        <Timeline
          items={[
            { date: 'Dec 12, 2025', text: 'Pax Silica Declaration signed in Washington by 7 governments.', cite: 'wikipedia', tag: 'us' },
            { date: 'Apr 9, 2026', text: 'BCDA proposes ~4,000 acres to the US.', cite: 'boi-docs', tag: 'gov' },
            { date: 'Apr 16–17', text: 'US–PH hub announced; Philippines signs the declaration.', cite: ['state-apr16', 'pna-joins'], tag: 'gov' },
            { date: 'Jul 16', text: 'BCDA letter lists 92 “affected persons” in Brgy. O’Donnell.', cite: 'hrw', tag: 'people' },
            { date: 'Jul 23', text: 'BCDA confirms the hub will be inside New Clark City.', cite: 'hrw', tag: 'gov' },
            { date: 'Aug 13', text: 'Protest march in Manila.', cite: 'rfa', tag: 'people' },
            { date: 'Aug 26', text: 'DENR: no environmental impact assessment applied for.', cite: 'gma-denr', tag: 'gov' },
            { date: 'Aug 31', text: 'NO to Pax Silica network (70+ groups) launched.', cite: 'pressenza', tag: 'people' },
            { date: 'Sep 4', text: 'BCDA and NCIP begin updating the Sapang Kawayan census.', cite: 'bcda-census', tag: 'gov' },
            { date: 'Sep 10', text: 'Protests at the Luzon Economic Corridor investors’ forum; arrests.', cite: 'mongabay', tag: 'people' },
            { date: 'Sep 21', text: 'DTI: sovereignty clause, no diplomatic immunity, no data centers.', cite: 'gma-sovereignty', tag: 'gov' },
            { date: 'Oct 13', text: 'Marcos: no displacement. Palace: signing “before the end of 2026.”', cite: ['philstar-marcos', 'pna-signing'], tag: 'gov' },
            { date: 'Oct 19', text: 'BCDA relocation plan: ~50 houses, 100 hectares of farmland.', cite: 'gma-relocation', tag: 'gov' },
            { date: 'Oct 26', text: 'House Bill 11758 filed for an Advanced Industries Zone.', cite: 'gma-hb11758', tag: 'gov' },
            { date: 'Nov 11', text: 'House told the relocation site is in Sitio Binyayan.', cite: 'hrw', tag: 'gov' },
            { date: 'Nov 16', text: 'HRW report; protests as Trump arrives for the ASEAN Summit.', cite: ['hrw', 'techpolicy'], tag: 'people' },
            { date: 'By end-2026', text: 'Target: framework agreement signing.', cite: 'pna-signing', tag: 'next' },
            { date: '2028', text: 'Target: start of construction.', cite: 'cna', tag: 'next' },
          ]}
        />
      ),
    },
    unknowns: {
      kicker: 'Open questions',
      title: 'What we still don’t know',
      body: (
        <ul className="checklist">
          <li>
            <b>The official boundary.</b> The map requested under FOI has not been released.
            <Cite s="afp" />
          </li>
          <li>
            <b>The final agreement.</b> Lease terms, rent and governance are still being negotiated.
            <Cite s={['pna-signing', 'boi-docs']} />
          </li>
          <li>
            <b>An environmental impact assessment.</b> None has been filed for the hub itself.
            <Cite s="gma-denr" />
          </li>
          <li>
            <b>Where the power and water will come from</b>, especially in the dry season.
            <Cite s="mongabay" />
          </li>
          <li>
            <b>How many households will be moved</b>, and whether consent will be sought.
            <Cite s={['bcda-census', 'hrw']} />
          </li>
          <li>
            <b>Which companies will actually come</b>, and what jobs they will offer.
            <Cite s="context-anchors" />
          </li>
        </ul>
      ),
    },
    sources: {
      kicker: 'How this was made',
      title: 'Sources & method',
      body: (
        <>
          <p>
            Every figure comes from a named source below. Where official and critical figures disagree, both are shown. Projections are labeled as
            projections.
          </p>
          <details className="method">
            <summary>How the hub outline was mapped</summary>
            <p>
              BCDA has not released the boundary. We took the map by A. Ortega / Countermapping PH (as published by Human Rights Watch), matched it to
              Esri and Copernicus satellite imagery with automated feature matching (26 matched points, ~1.5 px error), and converted its outlines to
              coordinates. Checks: the outline encloses ~{fmt(FACTS.outlineHa)} hectares vs. the official {fmt(FACTS.hubHa)} hectares; New Clark City ~9,634 hectares vs.
              the official {fmt(FACTS.nccHa)} hectares; sitio dots fall within ~120–420 m of the same villages in OpenStreetMap. The scripts are in the project’s
              <code> data-prep/</code> folder.
            </p>
            <p>
              3D terrain: Copernicus GLO-30 elevation (heights exaggerated ×2.4). Imagery: cloud-free Sentinel-2 composite, Sep–Oct 2026 (10 m).
            </p>
          </details>
          <SourceList />
          <p className="muted">
            Spotted an error or have a better source? Open an issue at{' '}
            <a href="https://github.com/chris-hcvt/whatthepaxsilica/issues" target="_blank" rel="noopener noreferrer">
              github.com/chris-hcvt/whatthepaxsilica
            </a>
            .
          </p>
        </>
      ),
    },
  },
};
