export type SourceKind = 'official' | 'state-media' | 'news' | 'rights' | 'analysis' | 'advocacy' | 'mapping' | 'data' | 'reference';

export interface Source {
  id: string;
  publisher: string;
  title: string;
  date: string; // human-readable, English
  url: string;
  kind: SourceKind;
  note?: string;
}

/**
 * Every figure on the site points to one or more of these entries.
 * Order here defines the citation numbers shown on the slides.
 */
export const SOURCES: Source[] = [
  {
    id: 'state-paxsilica',
    publisher: 'U.S. Department of State',
    title: 'Pax Silica (initiative page and declaration)',
    date: 'Dec 2025 –',
    url: 'https://www.state.gov/pax-silica',
    kind: 'official',
  },
  {
    id: 'state-apr16',
    publisher: 'U.S. Department of State',
    title:
      'The United States and the Philippines Launch Plans for 4,000-Acre Economic Security Zone to Shore Up Supply Chains: First AI-Native Industrial Acceleration Hub Under Pax Silica',
    date: 'Apr 16, 2026',
    url: 'https://www.state.gov/releases/office-of-the-spokesperson/2026/04/the-united-states-and-the-philippines-launch-plans-for-4000-acre-economic-security-zone-to-shore-up-supply-chains-first-ai-native-industrial-acceleration-hub-under-pax-silica',
    kind: 'official',
  },
  {
    id: 'boi-docs',
    publisher: 'Board of Investments (Philippines)',
    title:
      'Discussion on Pax Silica and the AI-Native Industrial Acceleration Hub — Pax Silica Declaration; BCDA proposal (Apr 9, 2026); U.S. reply (Apr 16, 2026); AI Opportunity Partnership (Jun 25, 2026)',
    date: 'Apr–Jul 2026',
    url: 'https://boi.gov.ph/discussion-on-pax-silica-and-the-ai-native-industrial-acceleration-hub/',
    kind: 'official',
    note: 'Primary documents. The BCDA proposal refers to a map (“Annex A”) that is not in the published copy.',
  },
  {
    id: 'bcda-census',
    publisher: 'Bases Conversion and Development Authority (BCDA)',
    title: 'BCDA, NCIP update community census in Capas, Tarlac for proposed Clark Advanced Manufacturing Park',
    date: 'Sep 4, 2026',
    url: 'https://bcda.gov.ph/news/bcda-ncip-update-community-census-capas-tarlac-proposed-clark-advanced-manufacturing-park',
    kind: 'official',
  },
  {
    id: 'pna-joins',
    publisher: 'Philippine News Agency',
    title: 'PH joins US-led Pax Silica; plan for industrial hub in Luzon unveiled',
    date: 'Apr 17, 2026',
    url: 'https://www.pna.gov.ph/articles/1273139',
    kind: 'state-media',
  },
  {
    id: 'pna-signing',
    publisher: 'Philippine News Agency',
    title: 'Palace: Signing of Pax Silica framework eyed before year-end',
    date: 'Oct 13, 2026',
    url: 'https://www.pna.gov.ph/article/palace-signing-of-pax-silica-framework-eyed-before-year-end',
    kind: 'state-media',
  },
  {
    id: 'hrw',
    publisher: 'Human Rights Watch',
    title: 'Philippines: US Tech Hub to Displace Hundreds',
    date: 'Nov 16, 2026',
    url: 'https://www.hrw.org/news/2026/11/16/philippines-us-tech-hub-to-displace-hundreds',
    kind: 'rights',
  },
  {
    id: 'countermapping',
    publisher: 'A. Ortega / Countermapping PH (graphic by Human Rights Watch)',
    title: 'Location of the Pax Silica Hub, New Clark City, and the Aeta’s Indigenous Land in Tarlac',
    date: 'Nov 16, 2026',
    url: 'https://www.hrw.org/news/2026/11/16/philippines-us-tech-hub-to-displace-hundreds',
    kind: 'mapping',
    note: 'Independent map built from satellite imagery, BCDA website material and NCIP data. Our approximate outline is traced from it.',
  },
  {
    id: 'rfa',
    publisher: 'Radio Free Asia',
    title: 'Residents say Philippines’ Pax Silica Hub will force them off their ancestral land',
    date: 'Sep 22, 2026',
    url: 'https://www.rfa.org/english/southchinasea/2026/09/22/aeta-philippines-pax-silica-tech-hub/',
    kind: 'news',
  },
  {
    id: 'afp',
    publisher: 'AFP (via GMA News)',
    title: 'Aeta community in Capas, Tarlac in limbo over Pax Silica hub',
    date: 'Sep 2026',
    url: 'https://www.gmanetwork.com/news/topstories/nation/1003201/aeta-community-in-capas-tarlac-in-limbo-over-pax-silica-hub/story/',
    kind: 'news',
  },
  {
    id: 'mongabay',
    publisher: 'Mongabay (republished by Grist)',
    title: 'Planned US tech hub in Philippines hit over environmental and Indigenous land concerns',
    date: 'Sep 23, 2026',
    url: 'https://news.mongabay.com/2026/09/planned-us-tech-hub-in-philippines-hit-over-environmental-and-indigenous-land-concerns/',
    kind: 'news',
  },
  {
    id: 'philstar-marcos',
    publisher: 'The Philippine Star',
    title: 'Pax Silica won’t displace Tarlac IP groups – Marcos',
    date: 'Oct 15, 2026',
    url: 'https://www.philstar.com/nation/2026/10/15/2563303/pax-silica-wont-displace-tarlac-ip-groups-marcos',
    kind: 'news',
  },
  {
    id: 'gma-sovereignty',
    publisher: 'GMA News',
    title: 'Pax Silica agreement to include clause affirming PH sovereignty',
    date: 'Sep 21, 2026',
    url: 'https://www.gmanetwork.com/news/money/economy/1003144/pax-silica-agreement-to-include-clause-affirming-ph-sovereignty/story/',
    kind: 'news',
  },
  {
    id: 'gma-relocation',
    publisher: 'GMA News',
    title: 'BCDA estimates P30M cost to relocate New Clark City settlers for Pax Silica',
    date: 'Oct 19, 2026',
    url: 'https://www.gmanetwork.com/news/money/economy/1006438/bcda-estimates-p30m-cost-to-relocate-new-clark-city-settlers-for-pax-silica/story/',
    kind: 'news',
  },
  {
    id: 'gma-denr',
    publisher: 'GMA News',
    title: 'DENR: No environmental impact assessment yet for Pax Silica hub in Tarlac',
    date: 'Aug 26, 2026',
    url: 'https://www.gmanetwork.com/news/money/economy/999955/denr-no-environmental-impact-assessment-yet-for-pax-silica-hub-in-tarlac/story/',
    kind: 'news',
  },
  {
    id: 'gma-hb11758',
    publisher: 'GMA News',
    title: 'Bill filed establishing ecozone for Pax Silica ops, other critical industries',
    date: 'Oct 26, 2026',
    url: 'https://www.gmanetwork.com/news/topstories/nation/1007221/bill-filed-establishing-ecozone-for-pax-silica-ops-other-critical-industries/story/',
    kind: 'news',
  },
  {
    id: 'cna',
    publisher: 'CNA',
    title: 'Philippines eyes billions in investment from Pax Silica tech hub, but farmers fear for their livelihoods',
    date: 'Oct 16, 2026',
    url: 'https://www.channelnewsasia.com/asia/philippines-pax-silica-tech-hub-investment-farmers-fear-livelihoods-6465486',
    kind: 'news',
  },
  {
    id: 'techpolicy',
    publisher: 'Tech Policy Press',
    title: 'Trump’s Philippines Visit Sparks Protests Over US-led Pax Silica Project',
    date: 'Nov 16, 2026',
    url: 'https://www.techpolicy.press/trumps-philippines-visit-sparks-protests-over-usled-pax-silica-project/',
    kind: 'news',
  },
  {
    id: 'summit',
    publisher: 'The Summit Express',
    title: 'Pax Silica: Groups warn 20,000 Aetas and farmers could be displaced; Palace disputes claim',
    date: 'Aug 2026',
    url: 'https://www.thesummitexpress.com/2026/08/pax-silica-displacement-aetas-farmers-palace-denies.html',
    kind: 'news',
  },
  {
    id: 'tribune-afp',
    publisher: 'Daily Tribune (AFP)',
    title: 'Aeta tribe fears tech hub uprooting',
    date: 'Sep 20, 2026',
    url: 'https://tribune.net.ph/2026/09/20/aeta-tribe-fears-tech-hub-uprooting',
    kind: 'news',
  },
  {
    id: 'pressenza',
    publisher: 'Pressenza / BAN Toxics',
    title: 'Who will really benefit from Pax Silica?',
    date: 'Sep 2026',
    url: 'https://www.pressenza.com/2026/09/who-will-really-benefit-from-pax-silica/',
    kind: 'advocacy',
  },
  {
    id: 'context-anchors',
    publisher: 'Context.ph',
    title: 'Foxconn, Moog eyed to anchor New Clark tech hub',
    date: 'Jul 10, 2026',
    url: 'https://context.ph/2026/07/10/foxconn-moog-eyed-to-anchor-new-clark-tech-hub/',
    kind: 'news',
  },
  {
    id: 'mayonai',
    publisher: 'MayonAI',
    title: 'Pax Silica in New Clark City — review of the published agreements, proposal, environmental certificate and records',
    date: 'Evidence cutoff Oct 27, 2026',
    url: 'https://mayonai.com/research/pax-silica-new-clark-city-2026/',
    kind: 'analysis',
  },
  {
    id: 'wikipedia',
    publisher: 'Wikipedia',
    title: 'Pax Silica — membership list (accessed Nov 17, 2026)',
    date: 'Nov 2026',
    url: 'https://en.wikipedia.org/wiki/Pax_Silica',
    kind: 'reference',
    note: 'Used only for the member list and joining dates; counts differ across sources.',
  },
  {
    id: 'copernicus',
    publisher: 'European Union / ESA — Copernicus',
    title: 'Sentinel-2 L2A imagery (Sep 13 – Oct 18, 2026) and Copernicus DEM GLO-30 elevation',
    date: '2026',
    url: 'https://dataspace.copernicus.eu/',
    kind: 'data',
    note: 'Contains modified Copernicus Sentinel data 2026. Elevation © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the EU and ESA.',
  },
  {
    id: 'osm',
    publisher: 'OpenStreetMap contributors',
    title: 'Mall footprints, city boundaries and village locations; base map tiles via OpenFreeMap',
    date: 'Nov 2026',
    url: 'https://www.openstreetmap.org/copyright',
    kind: 'data',
  },
];

export const SOURCE_INDEX: Record<string, number> = Object.fromEntries(SOURCES.map((s, i) => [s.id, i + 1]));
export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
