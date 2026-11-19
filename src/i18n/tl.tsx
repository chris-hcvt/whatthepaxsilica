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
import { ACWA_MW, BCDA_LNG_STUDY_MW, GAP_SHARE, LINED_UP_MW } from '../content/power';
import { bigNum, homesNum, pctNum } from './fmt';
import { powerSlidesTl } from './report-power';
import { chaptersTl, storyTl } from './story-tl';

const fmt = (n: number) => n.toLocaleString('en-US');

export const tl: Locale = {
  code: 'tl',
  name: 'Tagalog',
  ui: {
    siteTitle: 'What the Pax Silica?',
    tagline: 'May planong 1,619-ektaryang tech zone sa Capas, Tarlac. Ang dapat malaman ng bawat Pilipino — sa mga 4 na minuto.',
    sources: 'Sanggunian',
    allSources: 'Mga sanggunian at dokumento',
    close: 'Isara',
    language: 'Wika',
    share: 'Ibahagi',
    copied: 'Nakopya ang link',
    loading3d: 'Nilo-load ang 3D na lupain…',
    error3d: 'Hindi ma-load ang 3D. Tingnan ang koneksyon at i-reload.',
    noWebgl: 'Hindi kaya ng device mo ang 3D, pero nasa teksto ang lahat ng impormasyon.',
    dragHint: 'I-drag para umikot · i-pinch o i-scroll para mag-zoom',
    approx: 'tantiyang balangkas',
    skipTo: 'Lumaktaw sa nilalaman',
    fullReport: 'Buong ulat',
    backToStory: '← Bumalik sa kuwento',
    learnMore: 'Alamin pa',
    details: 'Detalye',
    menu: 'Menu',
    chaptersTitle: 'Mga kabanata',
    scrollCue: 'Mag-scroll para magsimula',
    chooseLanguage: 'Piliin ang wika',
    moreLanguagesSoon: 'Darating pa ang ibang wika',
    soon: 'malapit na',
    mapSearch: 'Maghanap ng lungsod o bayan…',
    mapSearchGo: 'Hanapin',
    mapNotFound: 'Hindi makita ang lugar. Subukan ang ibang baybay, o pumili ng bayan sa mga mungkahi.',
    mapSearchBusy: 'Abala ang online na paghahanap ngayon. Pumili ng bayan sa mga mungkahi, o mag-tap sa mapa.',
    mapHint: 'Tip: i-drag ang mapa para tumingin sa paligid (dalawang daliri sa phone). Mag-tap o mag-click kahit saan para ilipat doon ang balangkas.',
    hectares: 'ektarya',
    mapTwoFingers: 'Gumamit ng dalawang daliri para igalaw ang mapa',
    reportTitle: 'Buong ulat',
    reportIntro: 'Ang detalyadong bersyon: bawat pahayag, numero at dokumento, may sanggunian. Magkatabi ang opisyal na pahayag at ang mga kritiko.',
    contents: 'Nilalaman',
    reportError: 'Mag-ulat ng mali',
    insetPlace: 'Capas, Tarlac',
    insetNote: 'Isa ang Pilipinas sa mga 25 bansa ng Pax Silica.',
    stepOf: (k, n) => `${k} sa ${n}`,
    credits: 'Balangkas ng mapa: A. Ortega / Countermapping PH (sa pamamagitan ng Human Rights Watch), inilagay sa koordinado. Imahe: Copernicus Sentinel-2 (2026). Lupain: Copernicus DEM. Mapa: © mga kontribyutor ng OpenStreetMap, OpenFreeMap. Paghahanap ng lugar: GeoNames.',
    prev: 'Nakaraan',
    next: 'Susunod',
  },
  acts: {
    intro: '',
    what: 'Ano ang Pax Silica?',
    ph: 'Ang papel ng Pilipinas',
    size: 'Gaano ito kalaki?',
    people: 'Sino ang nakatira roon?',
    power: 'Kuryente at tubig',
    who: 'Sino ang sangkot',
    next: 'Ano ang susunod',
  },
  kinds: {
    official: 'Opisyal na dokumento at pahayag',
    'state-media': 'Ahensya ng balita ng gobyerno',
    rights: 'Organisasyong pangkarapatang pantao',
    mapping: 'Malayang pagmamapa',
    analysis: 'Malayang pagsusuri',
    news: 'Mga ulat-balita',
    advocacy: 'Mga grupong adbokasiya',
    reference: 'Sanggunian',
    data: 'Datos ng mapa at satellite',
  },
  site: {
    hub: 'Pax Silica hub · tantiyang balangkas',
    ncc: 'New Clark City',
    inside: 'nasa loob ng minapang hub',
    outside: (km) => `${km} km sa labas ng gilid`,
    refCount: (n, name, kind) => (kind === 'mall' ? `${n} buong ${name}, ayon sa tunay na sukat` : `${n} buong ${name}, ayon sa tunay na sukat`),
    levelled: 'Pinatag para maikumpara (paglalarawan)',
    pop: {
      sat: (km) => `Kuha mula sa satellite, mga ${km} km ang lapad. Ang bilog ang tanda ng sitio.`,
      satCredit: 'Larawan: may binagong datos ng Copernicus Sentinel-2 (2026), kapareho ng larawan sa 3D na mapa.',
      photo: (place, year, km) => `${place}, Capas (${year}), kinunan mga ${km} km mula sa tanda ng sitio.`,
      photoBy: 'Larawan:',
      maps: 'Tingnan sa Google Maps',
      close: 'Isara',
      people: { 'Aeta Hungey': 'Mga pamilyang Aeta Hungey', farmers: 'Mga pamilyang magsasaka', 'Ayta Mag-antsi': 'Mga pamilyang Ayta Mag-antsi' },
      barangay: (b) => `Barangay ${b}`,
      industry: {
        caption: [
          'Halimbawa: nagsisimula ang chips bilang silicon wafer na tulad nito. Bawat maliit na parisukat ay magiging isang chip.',
          'Halimbawa: linya sa isang high-tech na pabrika, kung saan naglalagay ang mga makina ng maliliit na piyesa sa circuit board (Megger, United Kingdom).',
          'Halimbawa: nickel ore na papunta sa planta ng pagpoproseso sa Taganito, Surigao del Norte (2016).',
        ],
        alt: ['Isang 12-pulgadang silicon wafer na puno ng hanay ng chips', 'Mga makinang pang-assemble ng circuit board na nakahanay sa pabrika', 'Mahahabang conveyor na nagdadala ng nickel ore sa minahan'],
      },
    },
    fx: {
      manila: 'Maynila · mga 75 km',
      icons: ['Chips at piyesa ng AI', 'High-tech na pabrika', 'Pagpoproseso ng mineral'],
      noDataCentres: 'Walang data center, ayon sa DTI',
      lease: 'Pag-aari ng BCDA · uupahan nang hanggang 99 taon',
      unknowns: ['Wala pang pirmadong kasunduan', 'Wala pang pag-aaral pangkalikasan', 'Wala pang opisyal na mapa'],
      side: '100 metro',
      court: '1 basketball court',
      oneHectare: '1 ektarya',
      power: '≈ 3 gigawatt kapag buo na (tantiya ng BCDA)',
      bill: {
        title: 'Singil sa kuryente · presyong pambahay',
        names: {
          regular: 'Karaniwang bahay',
          medium: 'Katamtamang bahay',
          large: 'Malaking bahay',
          mansion: 'Mansyon',
          office: 'Office tower',
          mall: 'Malaking mall',
          fab: 'Pabrika ng chips',
          hub: 'Ang zone (3 GW)',
        },
        kwh: (n) => `${bigNum(n, 'milyon', 'bilyon')} kWh`,
        peso: (n) => `₱${bigNum(n, 'milyon', 'bilyon')}`,
        homes: (n) => (n < 1.5 ? 'Isang karaniwang bahay' : `= ${homesNum(n, 'milyong')} karaniwang bahay`),
        zoneNote: '*Paglalarawan lang, hindi tunay na singil ng zone',
        add: (name) => `＋ Pindutin: ${name}`,
      },
      gauge: {
        need: '3 GW ang kailangan kapag buo na (tantiya ng BCDA)',
        peak: `${ACWA_MW} MW: panel ng ACWA, sa tirik na araw lang`,
        lined: `≈ ${Math.round(LINED_UP_MW[1] / 10) * 10} MW ang nakalinya, sa karaniwan (solar ng ACWA + pinag-aaralang ${BCDA_LNG_STUDY_MW} MW na gas)`,
        gap: `≈ ${pctNum(GAP_SHARE[0])}: wala pang inilalabas na plano`,
      },
      reservoir: 'Konseptong laki: 390–780 ektaryang imbakan (isang pagsusuri), hindi lugar ng proyekto',
      odonnell: 'Ilog O’Donnell',
      waterDay: (day, m, mld) => `Araw ${day} · ${m} metro · ${mld} milyong litro bawat araw`,
      waterTick: (days, m) => `${days === 1 ? '1 araw' : days === 7 ? '1 linggo' : '1 buwan'} · ${m} m`,
      makati: 'Lungsod ng Makati · 1,815 ektarya',
      families: '≈ 200 pamilyang Aeta Hungey',
      river: 'Ilog Bangut (OpenStreetMap: Bangot)',
      phone: {
        gauge: {
          need: '3 GW ang kailangan (BCDA)',
          peak: `${ACWA_MW} MW: rurok ng ACWA, tirik na araw`,
          lined: `≈ ${Math.round(LINED_UP_MW[1] / 10) * 10} MW ang nakalinya (karaniwan)`,
          gap: `≈ ${pctNum(GAP_SHARE[0])}: wala pang plano`,
        },
        reservoir: 'Konseptong imbakan, 390–780 ektarya',
        river: 'Ilog Bangut',
        waterDay: (day, m) => `Araw ${day} · ${m} metro ang lalim`,
      },
      creek: 'Sapa ng Sapang Kawayan',
      farms: 'Sakahan (OpenStreetMap)',
    },
  },
  cities: {
    makati: 'Makati (Ayala)',
    qc: 'Quezon City',
    manila: 'Maynila (Quiapo)',
    bgc: 'BGC, Taguig',
    ortigas: 'Ortigas',
    cebu: 'Lungsod ng Cebu',
    davao: 'Lungsod ng Davao',
    baguio: 'Baguio',
    iloilo: 'Lungsod ng Iloilo',
    cdo: 'Cagayan de Oro',
    bacolod: 'Bacolod',
    zamboanga: 'Lungsod ng Zamboanga',
    tarlac: 'Lungsod ng Tarlac',
    capas: '↩ Totoong lugar (Capas)',
  },
  chapters: chaptersTl,
  story: storyTl,
  slides: {
    ...powerSlidesTl,
    intro: {
      title: 'What the Pax Silica?',
      body: (
        <>
          <Lead>
            Isang kasunduang pinamumunuan ng US para kontrolin ang supply chain ng chips at AI — at isang {fmt(FACTS.hubHa)}-ektaryang industrial hub
            na planong itayo sa lupang tinitirhan ng mga Aeta at magsasaka sa Capas, Tarlac.
          </Lead>
          <p className="muted">
            Paliwanag na nakabatay sa ebidensya. Magkatabi ang opisyal na pahayag at ang mga kritiko, at may link sa sanggunian ang bawat numero.
            Gamitin ang ← → o mag-swipe.
          </p>
        </>
      ),
    },
    name: {
      kicker: 'Ang pangalan',
      title: 'Pax + Silica',
      body: (
        <>
          <p>
            Ang <b>Pax</b> ay Latin para sa “kapayapaan” — gaya ng <i>Pax Romana</i> o <i>Pax Americana</i>, kapayapaang pinananatili ng isang
            makapangyarihang bansa. Ang <b>Silica</b> ay tumutukoy sa silicon, ang materyales na gawa ang mga computer chip.
          </p>
          <p>
            Pinagsama: isang “kapayapaang silicon” — kaayusang nakasentro kung <b>sino ang gumagawa, kumokontrol at nagsu-supply</b> ng chips ng mundo,
            ng mga mineral sa loob nito, at ng AI na tumatakbo rito.
            <Cite s={['state-paxsilica', 'wikipedia']} />
          </p>
        </>
      ),
    },
    launch: {
      kicker: 'Inilunsad noong Disyembre 12, 2025 · Washington, D.C.',
      title: 'Programa ng US State Department',
      body: (
        <>
          <p>
            Ang Pax Silica ang pangunahing programa ng US State Department sa AI at seguridad ng supply chain. Nagsimula ito sa isang{' '}
            <b>deklarasyong hindi legal na nagbubuklod</b> na pinirmahan ng mga katuwang na gobyerno, sa pamumuno ni Under Secretary{' '}
            <b>Jacob Helberg</b>.
            <Cite s={['state-paxsilica', 'techpolicy']} />
          </p>
          <Quote
            text="Kung langis at bakal ang nagpatakbo sa ika-20 siglo, compute at ang mga mineral na nagpapakain dito ang nagpapatakbo sa ika-21 siglo."
            who="Jacob Helberg, US Under Secretary of State (salin)"
            cite="techpolicy"
          />
          <p className="muted">Ang “hindi nagbubuklod” ay nangangahulugang pahayag ito ng iisang layunin, hindi tratado. Isa-isang bansa ang pakikipagkasundo sa mga konkretong proyekto.</p>
        </>
      ),
    },
    goals: {
      kicker: 'Ang mga layuning sinabi nila',
      title: 'Seguruhin ang buong “tech stack” sa piling mga katuwang',
      body: (
        <>
          <p>
            Inilista ng State Department ang mga larangan ng pagtutulungan na sumasaklaw sa buong kadena — mula paghuhukay ng mineral hanggang
            pagpapatakbo ng AI.
            <Cite s={['state-paxsilica', 'wikipedia']} />
          </p>
          <Goals
            items={[
              { icon: 'mineral', title: 'Kritikal na mineral', text: 'Pagmimina, pagdadalisay at pagpoproseso — hal. nickel, tanso, rare earths.' },
              { icon: 'energy', title: 'Enerhiya', text: 'Kuryente para sa mga planta ng chip at data center.' },
              { icon: 'chip', title: 'Compute at semiconductor', text: 'Paggawa ng chips at ng computing power na kailangan ng AI.' },
              { icon: 'factory', title: 'Makabagong manufacturing', text: 'High-end na pabrika at piyesa.' },
              { icon: 'logistics', title: 'Logistics', text: 'Ruta ng pagpapadala at pinagkakatiwalaang trade corridor.' },
              { icon: 'network', title: 'Konektibidad at datos', text: 'Mga network at imprastraktura ng datos.' },
            ]}
          />
          <Note>
            Sinasabi ng mga opisyal na layunin nitong bawasan ang “mapamilit na pagdepende.” Walang binanggit na bansa ang deklarasyon, pero ayon sa mga
            opisyal ng US at karamihan ng analyst, layunin nitong makipagkumpitensya sa China sa mga supply chain na ito.
            <Cite s={['wikipedia', 'techpolicy']} />
          </Note>
        </>
      ),
    },
    members: {
      kicker: 'Sa imbitasyon ng US ang pagsali',
      title: 'Mula 7 hanggang mga 25 lumagda',
      body: (
        <>
          <p>
            Pito ang lumagda sa unang araw: US, Australia, Israel, Japan, South Korea, Singapore at UK. Pagsapit ng Nobyembre 2026, umabot na sa mga{' '}
            <b>25</b> ang lumagda, mula Asya, Europa, Gitnang Silangan at Latin America.
            <Cite s={['wikipedia', 'techpolicy']} />
          </p>
          <p className="memberlist">
            {MEMBERS.map((m) => (
              <span key={m.iso3} className={m.iso3 === 'PHL' ? 'ph' : m.founding ? 'founding' : ''}>
                {m.name}
              </span>
            ))}
          </p>
          <Note>Iba-iba ang bilang sa mga sanggunian (23–26), depende kung paano nila binibilang ang Netherlands, European Union at mga observer. Kasali ang Taiwan nang hindi lumalagda.</Note>
        </>
      ),
    },
    'ph-joins': {
      kicker: 'Abril 16–17, 2026',
      title: 'Sumali ang Pilipinas',
      body: (
        <>
          <p>
            Noong <b>Abril 16</b>, inanunsyo ng Washington at Maynila ang planong <b>4,000-acre na “Economic Security Zone”</b> — tinawag na “unang
            AI-native industrial acceleration hub sa ilalim ng Pax Silica.”
            <Cite s="state-apr16" />
          </p>
          <p>
            Noong <b>Abril 17</b>, pinirmahan ni Trade Undersecretary <b>Ceferino Rodolfo</b> ang deklarasyon. Ayon sa ahensya ng balita ng gobyerno,
            ika-13 lumagda ang Pilipinas.
            <Cite s="pna-joins" />
          </p>
          <StatGrid>
            <Stat value="~US$50B" label="export ng semiconductor at electronics noong 2025 — pinakamalaking export ng bansa" cite="cna" tone="teal" />
            <Stat value="#2" label="pinakamalaking prodyuser ng nickel sa mundo, kasunod ng Indonesia" cite="cna" tone="teal" />
          </StatGrid>
          <Note>Karamihan sa trabaho sa chips dito ay assembly, testing at packaging — ang mababang-halagang bahagi. Sabi ng mga opisyal, layunin ng hub na iakyat ang bansa.</Note>
        </>
      ),
    },
    'paper-trail': {
      kicker: 'Ano na ba talaga ang napirmahan',
      title: 'Ang mga dokumento',
      body: (
        <>
          <p>
            Inilathala ng Board of Investments ang mga pangunahing dokumento.
            <Cite s="boi-docs" /> Ito ang pinatutunayan nila — at ang kulang pa.
            <Cite s="mayonai" />
          </p>
          <DocList
            items={[
              {
                date: 'Abr 9',
                title: 'Panukala ng BCDA sa US',
                text: 'Iniaalok ang humigit-kumulang 4,000 acre para sa isang “coordination office,” na walang upa sa unang dalawang taon. May binabanggit itong mapa (“Annex A”) na wala sa inilathalang kopya.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Abr 16',
                title: 'Sagot ng US',
                text: 'Tinanggap — pero “subject to” pagkumpirma ng eksaktong lokasyon at hangganan, at pagpirma ng kontrata sa upa.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Hun 25',
                title: 'AI Opportunity Partnership',
                text: 'Mas malawak na kasunduan sa pagtutulungan na humihikayat din ng pamumuhunan sa mga data center.',
                cite: ['boi-docs', 'mayonai'],
                status: 'signed',
              },
              {
                date: 'Nakabinbin',
                title: 'Framework / master lease agreement',
                text: 'Hindi pa napipirmahan. Target ng Palasyo na mapirmahan “bago matapos ang 2026.”',
                cite: ['pna-signing', 'hrw'],
                status: 'pending',
              },
              {
                date: 'Wala pa',
                title: 'Environmental impact assessment',
                text: 'Sabi ng DENR noong Agosto, walang nag-apply nito, at “walang malinaw na paglalarawan ng proyekto.”',
                cite: 'gma-denr',
                status: 'missing',
              },
            ]}
          />
        </>
      ),
    },
    'the-hub': {
      kicker: 'Capas, Tarlac · ~75 km hilaga ng Maynila',
      title: 'Ang hub: “Clark Advanced Manufacturing Park”',
      body: (
        <>
          <p>
            Itatayo ang hub sa loob ng <b>New Clark City</b> — isang {fmt(FACTS.nccHa)}-ektaryang estate ng gobyerno sa lupang dating bahagi ng base
            militar ng US sa Clark, na naibalik sa Pilipinas noong 1991.
            <Cite s={['rfa', 'gma-relocation']} />
          </p>
          <p>
            Sasaklaw ito ng mga <b>{fmt(FACTS.hubHa)} ektarya (4,000 acre)</b>. Mananatiling pag-aari ng Bases Conversion and Development Authority (
            <b>BCDA</b>) ang lupa; uupahan ito ng mga mamumuhunan. Pinapayagan ng Investors’ Lease Act, na pinirmahan noong Setyembre, ang upa nang
            hanggang <b>99 na taon</b>.
            <Cite s={['gma-sovereignty', 'mongabay', 'pna-signing']} />
          </p>
          <Note>Tantiya lang ang mga balangkas ng New Clark City at ng hub na ginamit sa kuwento — tingnan ang “Saan eksakto?” kung paano ito ginawa.</Note>
        </>
      ),
    },
    specs: {
      kicker: 'Mga projection, hindi pangako',
      title: 'Ang hub sa mga numero',
      body: (
        <>
          <StatGrid>
            <Stat value={`${fmt(FACTS.hubHa)} ektarya`} label={`≈ ${FACTS.hubKm2} kilometro kuwadrado · 4,000 acre`} cite={['rfa', 'pna-signing']} tone="red" />
            <Stat value="US$40–70B" label="pamumuhunan kapag buo na (BCDA); US$10B na paunang target" cite={['pna-signing', 'gma-sovereignty']} />
            <Stat value="130k–190k" label="trabaho kapag buo na (BCDA). Isa pang opisyal na tantiya: hanggang 150k direkta, 50k sa konstruksyon, 800k hindi direkta" cite={['pna-signing', 'gma-sovereignty']} />
            <Stat value="~3 GW" label="kuryenteng kailangan kapag buo na (BCDA)" cite={['mongabay', 'cna']} tone="amber" />
            <Stat value="60–90M L" label="tubig bawat araw (BCDA)" cite={['cna', 'techpolicy']} tone="amber" />
            <Stat value="2028" label="target na simula ng konstruksyon" cite={['cna', 'techpolicy']} />
          </StatGrid>
          <p>
            <b>Ano ang itatayo:</b> high-tech na piyesa para sa AI at semiconductor, at pagpoproseso ng mineral. Noong Setyembre, sinabi ng DTI na{' '}
            <b>walang data center</b> — bagaman nabanggit ito sa mga naunang briefing ng BCDA.
            <Cite s={['gma-sovereignty', 'mayonai']} />
          </p>
          <p>
            <b>Sino ang maaaring pumasok:</b> Pinangalanan ng PEZA ang <b>Foxconn</b> ng Taiwan at ang <b>Moog</b> ng US bilang posibleng anchor investor.
            Wala pang kumpirmadong tenant.
            <Cite s={['context-anchors', 'tribune-afp']} />
          </p>
        </>
      ),
    },
    outline: {
      kicker: 'Hindi pa inilalabas ng gobyerno ang hangganan',
      title: 'Saan eksakto?',
      body: (
        <>
          <p>
            Tinanggihan ng BCDA ang FOI request para sa opisyal na mapa ng hangganan ng lugar; “pansamantalang ipinagkakait hanggang maisapinal o
            mailathala ang opisyal na aksyon.”
            <Cite s={['afp', 'tribune-afp']} />
          </p>
          <p>
            Minapa ng mga malayang heograpo na tumutulong sa mga Aeta — <b>A. Ortega / Countermapping PH</b> — ang hub batay sa makukuhang impormasyon.
            Inilathala ng Human Rights Watch ang kanilang mapa noong Nobyembre 16.
            <Cite s={['countermapping', 'hrw']} />
          </p>
          <p>
            Itinugma namin ang mapang iyon sa satellite imagery para mailagay sa totoong koordinado. Sumasaklaw ang aming balangkas ng mga{' '}
            <b>{fmt(FACTS.outlineHa)} ektarya</b>, malapit sa opisyal na {fmt(FACTS.hubHa)} ektarya (+7%). Tugma ang lokasyon ng mga sitio sa OpenStreetMap nang
            ilang daang metro lang ang layo.
            <Cite s={['copernicus', 'osm']} />
          </p>
          <Note>Ituring na tantiya ang balangkas (±~0.5 km). Kapag inilabas ng BCDA ang totoong hangganan, papalitan namin ito.</Note>
        </>
      ),
    },
    malls: {
      kicker: 'Para maramdaman ang laki',
      title: `${timesFit(FACTS.malls.moa)} na Mall of Asia`,
      body: (
        <>
          <p>
            Gamit ang opisyal na {fmt(FACTS.hubHa)} ektarya at ang lote ng bawat mall ayon sa OpenStreetMap, ilang beses kasya ang buong mall sa hub.
            <Cite s="osm" />
          </p>
          <MallPicker
            label={(n, name, ha, packed) => (
              <>
                <b className="big">{n}×</b> {name} <span className="muted">({ha} ektarya bawat isa)</span>
                <span className="packed">
                  Batay iyan sa sukat. Kung buong gusali ang isisiksik, kasama ang mga puwang, <b>{packed}</b> kopya ang kasya sa minapang balangkas (makikita sa 3D ng kuwento).
                </span>
              </>
            )}
          />
          <StatGrid>
            <Stat value={`≈ ${fmt(Math.round((FACTS.hubHa * 10000) / 420 / 100) * 100)}`} label="basketball court (28 × 15 metro bawat isa)" cite="court" />
            <Stat value={`${fmt(FACTS.hubHa * 10000)}`} label="metro kuwadrado (1 ektarya = 10,000 metro kuwadrado)" />
          </StatGrid>
          
        </>
      ),
    },
    cities: {
      kicker: 'Kumpara sa Metro Manila',
      title: 'Mas malaki pa sa ilang buong lungsod',
      body: (
        <>
          <p>
            Ang opisyal na sukat ng hub, katabi ng hangganan ng mga lungsod at kampus sa Metro Manila ayon sa OpenStreetMap.
            <Cite s="osm" />
          </p>
          <CityBars
            unit="ektarya"
            hubLabel={<b>Pax Silica hub</b>}
            rows={[
              { name: 'Lungsod ng Makati', ha: FACTS.cities.makati },
              { name: 'Lungsod ng Mandaluyong', ha: FACTS.cities.mandaluyong },
              { name: 'Lungsod ng San Juan', ha: FACTS.cities.sanjuan },
              { name: 'Kampus ng UP Diliman', ha: FACTS.cities.updiliman },
              { name: 'Rizal Park (Luneta)', ha: FACTS.cities.rizalpark },
            ]}
          />
          <StatGrid>
            <Stat value="≈ 2.8×" label="Lungsod ng San Juan" tone="red" />
            <Stat value="≈ 1.4×" label="Lungsod ng Mandaluyong" tone="red" />
            <Stat value="≈ 89%" label="ng Lungsod ng Makati" tone="red" />
            <Stat value="≈ 3.2×" label="Kampus ng UP Diliman" tone="red" />
          </StatGrid>
          <Note>Kinuwenta ang mga sukat mula sa OpenStreetMap at maaaring bahagyang iba sa opisyal na land area.</Note>
        </>
      ),
    },
    communities: {
      kicker: 'Barangay Aranguren at O’Donnell, Capas',
      title: 'Sino ang nakatira roon',
      body: (
        <>
          <p>
            <b className="red">Sapang Kawayan</b> (Brgy. Aranguren) — tahanan ng <b>Aeta Hungey</b>, mga 200 kabahayan. Sa malayang mapa, nasa{' '}
            <b>loob</b> ito ng hub. Isinampa ang kanilang claim sa lupaing ninuno noong 1994 at muling isinampa noong 1999; hindi pa ito nabibigyan ng
            titulo.
            <Cite s={['rfa', 'hrw', 'countermapping']} />
          </p>
          <p>
            <b className="amber">Sitio Binyayan</b> (Brgy. O’Donnell) — mga pamilyang magsasaka na walang titulo ng lupa. Sinabi ng BCDA na sakahan nila,
            hindi bahay, ang maaapektuhan.
            <Cite s="hrw" />
          </p>
          <p>
            <b className="amber">Sitio Manabayucan</b> — ang <b>Ayta Mag-antsi</b>, nasa labas lang ng minapang gilid.
            <Cite s={['hrw', 'countermapping']} />
          </p>
          <Note>
            Sa antas ng sitio lang ipinapakita ang mga komunidad. Umaasa ang mga residente sa Ilog Bangot para sa tubig at isda.
            <Cite s="rfa" />
          </Note>
        </>
      ),
    },
    voices: {
      kicker: 'Sa sarili nilang salita',
      title: 'Mga tinig mula sa dalawang panig',
      body: (
        <div className="quotes">
          <Quote
            side="community"
            text="Ayaw naming isuko ang aming komunidad. Paano namin isusuko ang aming libingan, ang aming simbahan, ang aming kabuhayan? Dito kami kumukuha ng tubig, dito kami nagtatanim."
            who="Petronila Capiz-Muñoz, pinuno ng Aeta Hungey (salin)"
            cite="hrw"
          />
          <Quote side="community" text="Pansamantala ang pera; panghabambuhay ang lupa." who="Isang magsasaka sa Sitio Binyayan (salin)" cite="hrw" />
          <Quote
            side="gov"
            text="Hindi sila mapapaalis. Bahagya lang silang iuusog, pero nasa parehong barangay pa rin sila, parehong komunidad, parehong lupa ng BCDA."
            who="Joshua Bingcang, noo’y pangulo ng BCDA (salin)"
            cite="rfa"
          />
          <Quote side="gov" text="Hindi ko makita kung paano malalagay sa panganib ng ganitong proyekto ang lokal na kabuhayan." who="Pangulong Ferdinand Marcos Jr., Okt 13, 2026 (salin)" cite="cna" />
          <Quote
            side="community"
            text="Hindi namin sinasabing tutol kami sa Pax Silica… bigyan lang kami ng public consultation para malaman namin ang detalye ng proyekto…"
            who="Roseller Rodriguez, alkalde ng Capas (salin)"
            cite="cna"
          />
        </div>
      ),
    },
    numbers: {
      kicker: 'Wala pang opisyal na bilang',
      title: 'Ilang tao ang maaapektuhan?',
      body: (
        <>
          <p>
            Mula dose-dosena hanggang sampu-sampung libo ang mga numero, at iba-iba ang sinusukat nila. Wala pang inilalabas na opisyal na kabuuang bilang
            ng kabahayan; sinimulan ng BCDA at NCIP ang pag-update ng census noong Setyembre.
            <Cite s="bcda-census" />
          </p>
          <div className="ncharts">
            <NumberChart
              title="Tao"
              max={20000}
              rows={[
                { value: 92, display: '92', who: 'Liham ng BCDA, Hul 16', what: '“apektadong tao” sa Brgy. O’Donnell, kasama ang mga magsasaka ng Binyayan', cite: 'hrw', side: 'gov' },
                { value: 200, display: '~200', who: 'BCDA (Bingcang), Set', what: 'tao; ~10 ektarya ng lugar', cite: 'rfa', side: 'gov' },
                { value: 1000, display: '~1,000', who: 'Ulat ng AFP', what: 'mga Aetang nangangamba sa paglikas', cite: 'tribune-afp', side: 'media' },
                { value: 20000, display: '~20,000', who: 'Kalikasan PNE', what: 'mga Aeta at magsasaka (kinontra ng Palasyo)', cite: 'summit', side: 'critic' },
              ]}
            />
            <NumberChart
              title="Kabahayan / pamilya"
              max={20000}
              rows={[
                { value: 40, display: '40', who: 'BCDA (Bingcang), Set', what: 'kabahayang Aeta na “iuusog nang bahagya”', cite: ['rfa', 'hrw'], side: 'gov' },
                { value: 200, display: '~200', who: 'RFA', what: 'kabahayan sa Sapang Kawayan', cite: 'rfa', side: 'media' },
                { value: 1000, display: '~1,000', who: 'Pinunong Capiz-Muñoz', what: 'pamilya sa kanilang lupaing ninuno', cite: 'pressenza', side: 'critic' },
              ]}
            />
          </div>
          <Note>Logarithmic ang sukat ng mga bar para magkasya nang magkatabi ang magkakalayong numero. Ayon sa Human Rights Watch, “daan-daan” ang mapapaalis.</Note>
        </>
      ),
    },
    offer: {
      kicker: 'Relokasyon at kompensasyon',
      title: 'Ano ang iniaalok',
      body: (
        <>
          <p>
            <b>Plano ng BCDA (Okt 19):</b> mga <b>50 bahay</b> sa isang 10-ektaryang lugar sa ibang bahagi ng New Clark City (₱25–30 milyon lahat),{' '}
            <b>100 ektarya</b> ng alternatibong sakahan sa loob ng 3,000-ektaryang no-build zone, at posibleng trabaho sa farming project ng BCDA.
            <Cite s="gma-relocation" />
          </p>
          <p>
            <b>Saan:</b> sinabi ng mga opisyal sa Kamara noong Nob 11 na nasa Sitio Binyayan ang relocation site, mga 3 km mula Sapang Kawayan — malayo sa
            mga sapang pinagkukunan ng tubig ng mga residente.
            <Cite s="hrw" />
          </p>
          <p>
            <b>Ayon sa mga residente:</b> 30 m² ang bagong bahay bawat pamilya, pinaaalis sila bago mag-Disyembre, at inalok ng ₱300,000 bawat ektarya
            (₱30 bawat m²) ang kanilang lupa, na tinanggihan nila.
            <Cite s={['hrw', 'afp', 'summit']} />
          </p>
          <Note>Sabi ng BCDA, may “general understanding” na sila sa mga komunidad. Sinabi naman ng pinuno ng Aeta Hungey sa mga mamamahayag na walang konsultasyong naganap sa kanilang tribo.</Note>
        </>
      ),
    },
    'two-sides': {
      kicker: 'Ang ubod ng usapin',
      title: 'Ang panig ng gobyerno — at ng mga kritiko',
      body: (
        <TwoCol
          leftTitle="Sabi ng gobyerno"
          rightTitle="Sabi ng mga kritiko"
          left={
            <ul>
              <li>
                Walang katutubong komunidad o libingan ng Aeta na mapapaalis.
                <Cite s="philstar-marcos" />
              </li>
              <li>
                Pampublikong lupa ito na nakalaan sa industriya sa ilalim ng Bases Conversion law ng 1992 (RA 7227); “walang titulo ng lupaing ninuno sa
                lugar na iyon.”
                <Cite s={['techpolicy', 'mongabay']} />
              </li>
              <li>
                Nasa loob ito ng 3,500-ektaryang “buildable zone” na itinakda noong 2019.
                <Cite s="summit" />
              </li>
              <li>
                Mananatili itong teritoryo ng Pilipinas — “walang diplomatic immunity o anumang eksepsyon.”
                <Cite s="gma-sovereignty" />
              </li>
              <li>
                Gagabayan ng census kasama ang NCIP ang tulong; “walang komunidad na maiiwan.”
                <Cite s="bcda-census" />
              </li>
            </ul>
          }
          right={
            <ul>
              <li>
                Hindi kailanman nakuha ng BCDA ang malaya, nauna at may-kabatirang pahintulot (FPIC) ng mga Aeta.
                <Cite s="hrw" />
              </li>
              <li>
                Sumasaklaw ang lugar sa claim ng Aeta Hungey sa lupaing ninuno, nakabinbin mula 1999. Hindi nabubura ng kawalan ng titulo ang claim.
                <Cite s={['hrw', 'mongabay']} />
              </li>
              <li>
                Walang environmental impact assessment; “walang malinaw na paglalarawan ng proyekto” (DENR, Agosto).
                <Cite s="gma-denr" />
              </li>
              <li>
                Naghihintay pa rin ng public consultation ang mga lokal na opisyal.
                <Cite s={['hrw', 'cna']} />
              </li>
              <li>
                Makikipag-agawan sa tubig at kuryente ng mga sakahan at kabahayan.
                <Cite s={['cna', 'mongabay']} />
              </li>
            </ul>
          }
        />
      ),
    },
    actors: {
      kicker: 'Sino ang nasa likod nito, at sino ang tumututol',
      title: 'Sino ang sangkot',
      body: (
        <Actors
          groups={[
            {
              title: 'Estados Unidos',
              tone: 'us',
              items: [
                { name: 'State Department', role: 'Nagpapatakbo ng Pax Silica; pinamumunuan ni Under Secretary Jacob Helberg', cite: 'state-paxsilica' },
                { name: 'Sec. Marco Rubio', role: 'Bumisita sa Maynila noong Hulyo para pagtibayin ang proyekto', cite: 'mongabay' },
              ],
            },
            {
              title: 'Gobyerno ng Pilipinas',
              tone: 'gov',
              items: [
                { name: 'Pangulong Marcos Jr.', role: 'Tagapagtaguyod ng hub; sabi niya walang mapapaalis', cite: 'philstar-marcos' },
                { name: 'BCDA', role: 'May-ari at developer ng lupa. Joshua Bingcang (paalis), Ariel Nepomuceno (papalit)', cite: ['bcda-census', 'techpolicy'] },
                { name: 'DTI / Board of Investments', role: 'Pinirmahan ni Usec. Ceferino Rodolfo ang deklarasyon', cite: 'pna-joins' },
                { name: 'NCIP · DENR · PEZA', role: 'Census ng katutubo · pagsusuring pangkalikasan · pag-akit ng mamumuhunan', cite: ['bcda-census', 'gma-denr', 'context-anchors'] },
              ],
            },
            {
              title: 'Mga kumpanya (wala pang kumpirmado)',
              tone: 'biz',
              items: [
                { name: 'Foxconn, Moog', role: 'Pinangalanan ng PEZA bilang posibleng anchor investor', cite: 'context-anchors' },
                { name: 'Kuryente at tubig', role: 'Kontratang 500 MW solar sa isang kumpanyang Saudi; bidding sa concession ng tubig ng New Clark City', cite: ['techpolicy', 'mayonai'] },
              ],
            },
            {
              title: 'Kongreso',
              tone: 'congress',
              items: [{ name: 'House Bill 11758', role: 'Panukalang Advanced Industries Zone na may tax holiday para sa mga locator', cite: 'gma-hb11758' }],
            },
            {
              title: 'Mga apektadong komunidad',
              tone: 'people',
              items: [
                { name: 'Aeta Hungey', role: 'Sapang Kawayan, Brgy. Aranguren', cite: 'hrw' },
                { name: 'Ayta Mag-antsi', role: 'Sitio Manabayucan', cite: 'hrw' },
                { name: 'Mga magsasaka ng Sitio Binyayan', role: 'Brgy. O’Donnell', cite: 'hrw' },
              ],
            },
            {
              title: 'Mga bantay at oposisyon',
              tone: 'watch',
              items: [
                { name: 'NO to Pax Silica network', role: '70+ grupong inilunsad noong Ago 31 — magsasaka, Aeta, siyentipiko, simbahan, kabataan', cite: 'pressenza' },
                { name: 'Human Rights Watch', role: 'Nagdokumento ng panganib ng paglikas', cite: 'hrw' },
                { name: 'Countermapping PH', role: 'Nagmapa ng hub at ng mga lupaing ninuno', cite: 'countermapping' },
              ],
            },
          ]}
        />
      ),
    },
    gains: {
      kicker: 'Ayon sa bawat panig',
      title: 'Sino ang makikinabang — at sino ang magbabayad',
      body: (
        <GainsTable
          head={['', 'Inaasahang pakinabang (ayon sa nagsasabi)', 'Gastos at panganib (ayon sa nagtataas)']}
          rows={[
            {
              who: 'Estados Unidos',
              gains: (
                <>
                  Mapagkakatiwalaang supply chain ng chips, piyesa ng AI at prosesong mineral na labas sa China.
                  <Cite s={['techpolicy', 'state-apr16']} />
                </>
              ),
              costs: (
                <>
                  Sabi ng mga kritiko, pangunahing pinagsisilbihan nito ang estratehiko at depensang interes ng US.
                  <Cite s="techpolicy" />
                </>
              ),
            },
            {
              who: 'Mga mamumuhunan',
              gains: (
                <>
                  Mahabang upa (hanggang 99 taon) at mga panukalang insentibo gaya ng 7-taong income tax holiday.
                  <Cite s={['mongabay', 'gma-hb11758']} />
                </>
              ),
              costs: (
                <>
                  Kailangang magtayo ng sariling sistema ng kuryente at tubig.
                  <Cite s="afp" />
                </>
              ),
            },
            {
              who: 'Gobyerno at BCDA',
              gains: (
                <>
                  Pamumuhunan, kita mula sa upa, at pag-angat sa semiconductor value chain.
                  <Cite s={['pna-signing', 'techpolicy']} />
                </>
              ),
              costs: (
                <>
                  Presyon sa grid at tubig; mga tanong sa soberanya at transparency.
                  <Cite s={['cna', 'techpolicy']} />
                </>
              ),
            },
            {
              who: 'Mga manggagawa',
              gains: (
                <>
                  Ipinangakong hanggang 150,000 direktang trabaho.
                  <Cite s="gma-sovereignty" />
                </>
              ),
              costs: (
                <>
                  Babala ng mga unyon at ekonomista: minimum-wage na trabaho at kaunting paglilipat ng teknolohiya.
                  <Cite s={['techpolicy', 'cna']} />
                </>
              ),
            },
            {
              who: 'Mga Aeta at magsasaka',
              gains: (
                <>
                  Pabahay sa relokasyon, alternatibong sakahan, posibleng trabaho sa bukid.
                  <Cite s="gma-relocation" />
                </>
              ),
              costs: (
                <>
                  Pagkawala ng lupaing ninuno, sakahan, libingan at daan sa ilog.
                  <Cite s={['hrw', 'rfa']} />
                </>
              ),
            },
          ]}
        />
      ),
    },
    timeline: {
      kicker: 'Disyembre 2025 → ngayon',
      title: 'Timeline',
      body: (
        <Timeline
          items={[
            { date: 'Dis 12, 2025', text: 'Pinirmahan ng 7 gobyerno sa Washington ang Pax Silica Declaration.', cite: 'wikipedia', tag: 'us' },
            { date: 'Abr 9, 2026', text: 'Iminungkahi ng BCDA sa US ang ~4,000 acre.', cite: 'boi-docs', tag: 'gov' },
            { date: 'Abr 16–17', text: 'Inanunsyo ang hub ng US at PH; lumagda ang Pilipinas.', cite: ['state-apr16', 'pna-joins'], tag: 'gov' },
            { date: 'Hul 16', text: 'Liham ng BCDA: 92 “apektadong tao” sa Brgy. O’Donnell.', cite: 'hrw', tag: 'people' },
            { date: 'Hul 23', text: 'Kinumpirma ng BCDA na nasa loob ng New Clark City ang hub.', cite: 'hrw', tag: 'gov' },
            { date: 'Ago 13', text: 'Martsa-protesta sa Maynila.', cite: 'rfa', tag: 'people' },
            { date: 'Ago 26', text: 'DENR: walang nag-apply ng environmental impact assessment.', cite: 'gma-denr', tag: 'gov' },
            { date: 'Ago 31', text: 'Inilunsad ang NO to Pax Silica network (70+ grupo).', cite: 'pressenza', tag: 'people' },
            { date: 'Set 4', text: 'Sinimulan ng BCDA at NCIP ang census sa Sapang Kawayan.', cite: 'bcda-census', tag: 'gov' },
            { date: 'Set 10', text: 'Protesta sa investors’ forum ng Luzon Economic Corridor; may inaresto.', cite: 'mongabay', tag: 'people' },
            { date: 'Set 21', text: 'DTI: may sugnay sa soberanya, walang diplomatic immunity, walang data center.', cite: 'gma-sovereignty', tag: 'gov' },
            { date: 'Okt 13', text: 'Marcos: walang mapapaalis. Palasyo: pirmahan “bago matapos ang 2026.”', cite: ['philstar-marcos', 'pna-signing'], tag: 'gov' },
            { date: 'Okt 19', text: 'Plano ng BCDA sa relokasyon: ~50 bahay, 100 ektaryang sakahan.', cite: 'gma-relocation', tag: 'gov' },
            { date: 'Okt 26', text: 'Isinampa ang House Bill 11758 para sa Advanced Industries Zone.', cite: 'gma-hb11758', tag: 'gov' },
            { date: 'Nob 11', text: 'Sinabi sa Kamara na nasa Sitio Binyayan ang relocation site.', cite: 'hrw', tag: 'gov' },
            { date: 'Nob 16', text: 'Ulat ng HRW; mga protesta sa pagdating ni Trump para sa ASEAN Summit.', cite: ['hrw', 'techpolicy'], tag: 'people' },
            { date: 'Bago matapos ang 2026', text: 'Target: pirmahan ng framework agreement.', cite: 'pna-signing', tag: 'next' },
            { date: '2028', text: 'Target: simula ng konstruksyon.', cite: 'cna', tag: 'next' },
          ]}
        />
      ),
    },
    unknowns: {
      kicker: 'Mga bukas na tanong',
      title: 'Ang hindi pa natin alam',
      body: (
        <ul className="checklist">
          <li>
            <b>Ang opisyal na hangganan.</b> Hindi pa inilalabas ang mapang hiniling sa FOI.
            <Cite s="afp" />
          </li>
          <li>
            <b>Ang pinal na kasunduan.</b> Pinag-uusapan pa ang upa, kondisyon at pamamahala.
            <Cite s={['pna-signing', 'boi-docs']} />
          </li>
          <li>
            <b>Environmental impact assessment.</b> Wala pang isinasampa para sa mismong hub.
            <Cite s="gma-denr" />
          </li>
          <li>
            <b>Saan manggagaling ang kuryente at tubig</b>, lalo na sa tag-araw.
            <Cite s="mongabay" />
          </li>
          <li>
            <b>Ilang kabahayan ang ililipat</b>, at kung hihingin ba ang kanilang pahintulot.
            <Cite s={['bcda-census', 'hrw']} />
          </li>
          <li>
            <b>Aling mga kumpanya ang talagang darating</b>, at anong trabaho ang iaalok nila.
            <Cite s="context-anchors" />
          </li>
        </ul>
      ),
    },
    sources: {
      kicker: 'Paano ito ginawa',
      title: 'Mga sanggunian at pamamaraan',
      body: (
        <>
          <p>
            Bawat numero ay mula sa isang pinangalanang sanggunian sa ibaba. Kapag hindi magkatugma ang opisyal at kritikal na numero, ipinapakita ang
            dalawa. Malinaw na minarkahan ang mga projection.
          </p>
          <details className="method">
            <summary>Paano minapa ang balangkas ng hub</summary>
            <p>
              Hindi pa inilalabas ng BCDA ang hangganan. Kinuha namin ang mapa ni A. Ortega / Countermapping PH (ayon sa inilathala ng Human Rights Watch),
              itinugma ito sa satellite imagery sa pamamagitan ng automated feature matching (26 na tugmang punto, ~1.5 px na error), at ginawang
              koordinado ang mga balangkas nito. Mga pagsusuri: ~{fmt(FACTS.outlineHa)} ektarya ang balangkas kumpara sa opisyal na {fmt(FACTS.hubHa)} ektarya; ~9,634
              ektarya ang New Clark City kumpara sa opisyal na {fmt(FACTS.nccHa)} ektarya; nasa ~120–420 m ang layo ng mga sitio sa parehong baryo sa OpenStreetMap.
              Nasa folder na <code>data-prep/</code> ng proyekto ang mga script.
            </p>
            <p>3D na lupain: Copernicus GLO-30 elevation (pinalaki nang ×2.4 ang taas). Imahe: walang-ulap na Sentinel-2 composite, Set–Okt 2026 (10 m).</p>
          </details>
          <SourceList />
          <p className="muted">
            May nakitang mali o may mas magandang sanggunian? Magbukas ng issue sa{' '}
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
