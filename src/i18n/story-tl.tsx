import type { StoryStep } from './types';
import type { Chapter } from '../content/story';
import { REFS, CITY_STATS, HUB_HA, HUB_COURTS, COURTS_PER_HECTARE } from '../content/story';
import {
  ACWA_AVG_MW,
  ACWA_MW,
  ACWA_SHARE,
  BCDA_LNG_STUDY_MW,
  BENCH_SOLAR_HA,
  DAYS_MONTH,
  DAYS_WEEK,
  ENERGY,
  HUB_SHARE_OF_LUZON_PEAK,
  billOf,
  depthPerDay,
  householdsOf,
  poolsOf,
  shortfall,
  solarLandHa,
  solarPanelsMW,
} from '../content/power';
import { Cite, CityBars, Timeline } from '../components/bits';
import { Assumption, BigNumber, Bullets, DotChart, EnergyPicker, HomePicker, ProsCons, RefPicker, ScoreCard, WaterPicker } from '../components/story-bits';

export const chaptersTl: Record<Chapter, string> = {
  basics: 'Ang basics',
  plan: 'Ang plano',
  size: 'Gaano kalaki',
  people: 'Ang mga tao',
  power: 'Kuryente at tubig',
  proscons: 'Pros at cons',
  benefit: 'Sino ang panalo?',
  next: 'Ano ang susunod',
};

const TAGS = {
  doc: 'Nasa dokumento',
  promised: 'Pangako',
  proposed: 'Panukala pa lang',
  unclear: 'Hindi malinaw',
  planned: 'Plano',
  reported: 'Iniulat',
  goal: 'Pangunahing layunin',
};

/** 3,110 · 10.2 milyon · 2.27 bilyon */
const bigTl = (n: number) => {
  const trim = (s: string) => s.replace(/\.0$/, '');
  if (n >= 1e9) return `${trim((n / 1e9).toFixed(n >= 1e10 ? 1 : 2))} bilyon`;
  if (n >= 1e6) return `${trim((n / 1e6).toFixed(n >= 1e8 ? 0 : 1))} milyon`;
  return (n >= 1e5 ? Math.round(n / 1000) * 1000 : Math.round(n)).toLocaleString('en-US');
};
const rangeEn = ([a, b]: [number, number] | number[], step: number) =>
  `${(Math.round(a / step) * step).toLocaleString('en-US')}–${(Math.round(b / step) * step).toLocaleString('en-US')}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const homesTl = (n: number) => {
  if (n >= 1e6) return `${Math.round(n / 1e6)} milyong`;
  if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString('en-US');
  return String(Math.round(n));
};

export const storyTl: Record<string, StoryStep> = {
  hero: {
    kicker: 'Capas, Tarlac · Pilipinas',
    title: 'What the Pax Silica?',
    body: (
      <p className="lead">
        May planong 1,619-ektaryang tech zone sa lupang ito, kung saan nakatira ang mga pamilyang Aeta at mga magsasaka. Ito ang dapat malaman ng bawat
        Pilipino — sa loob ng mga 4 na minuto.
      </p>
    ),
  },
  'basics-1': {
    kicker: 'Pax Silica sa loob ng 30 segundo',
    title: 'Grupo ng mga 25 bansa na pinamumunuan ng US',
    body: (
      <p>
        Layunin nito: gumawa ng computer chips, AI at ng mga mineral na kailangan nila — <b>nang hindi umaasa sa China</b>.
        <Cite s={['state-paxsilica', 'techpolicy']} />
      </p>
    ),
    more: (
      <p>
        Inilunsad ito ng US State Department noong Disyembre 2025 sa pamamagitan ng isang deklarasyong hindi legal na nagbubuklod. Kasama rito ang Japan,
        South Korea, Australia, UK, Israel, India at ilang bansa sa Europa at Latin America. Ang ibig sabihin ng “Pax Silica” ay “kapayapaang silicon.”
        <Cite s={['wikipedia', 'techpolicy']} />
      </p>
    ),
  },
  'basics-2': {
    title: 'Sumali ang Pilipinas noong Abril 2026',
    body: (
      <p>
        Bilang bahagi nito, nag-alok ang gobyerno ng lupa para sa isang malaking factory zone — <b>dito mismo sa Tarlac</b>.
        <Cite s={['pna-joins', 'state-apr16']} />
      </p>
    ),
    more: (
      <p>
        Pumirma si Trade Undersecretary Ceferino Rodolfo noong Abril 17. Inanunsyo ng US at Pilipinas ang isang 4,000-acre na “Economic Security Zone,”
        ang unang industrial hub sa ilalim ng Pax Silica.
        <Cite s={['pna-joins', 'state-apr16']} />
      </p>
    ),
  },
  'plan-where': {
    title: 'Saan: New Clark City, Capas, Tarlac',
    body: (
      <p>
        Mga 75 km hilaga ng Maynila, sa lupang dating bahagi ng base militar ng US. Hawak ito ng Bases Conversion and Development Authority (<b>BCDA</b>)
        ng gobyerno.
        <Cite s={['rfa', 'gma-relocation']} />
      </p>
    ),
    more: <p>Dilaw na putol-putol na linya: New Clark City (mga 9,450 ektarya). Pula: ang planong tech zone.</p>,
  },
  'plan-what': {
    title: 'Ano: mga pabrika ng chips at piyesa ng AI',
    body: (
      <p>
        Kasama ang pagpoproseso ng mineral gaya ng nickel. Sabi ng mga opisyal, <b>walang data center</b>. Target simulan ang konstruksyon sa <b>2028</b>.
        <Cite s={['gma-sovereignty', 'cna']} />
      </p>
    ),
  },
  'plan-land': {
    title: 'Mananatiling pag-aari ng Pilipinas ang lupa — pero uupahan ito',
    body: (
      <p>
        Puwedeng upahan ito ng mga mamumuhunan nang hanggang <b>99 na taon</b>. Binanggit ang Foxconn at Moog bilang posibleng unang tenant, pero{' '}
        <b>wala pang kumpirmado</b>.
        <Cite s={['mongabay', 'context-anchors', 'tribune-afp']} />
      </p>
    ),
  },
  'plan-status': {
    title: 'Wala pang pinal',
    body: (
      <>
        <Bullets
          items={[
            <>
              Hindi pa napipirmahan ang pangunahing kasunduan. Target: katapusan ng 2026.
              <Cite s="pna-signing" />
            </>,
            <>
              Wala pang isinasampang pag-aaral pangkalikasan.
              <Cite s="gma-denr" />
            </>,
            <>
              Hindi pa inilalabas ang opisyal na mapa ng hangganan.
              <Cite s="afp" />
            </>,
          ]}
        />
        <p className="note">
          Ang pulang balangkas ay tantiya ng mga independiyenteng heograpo ng Countermapping PH, kaya hindi ito eksakto.
          <Cite s="countermapping" />
        </p>
      </>
    ),
    more: (
      <p>
        Itinugma namin sa satellite images ang mapa ng Countermapping PH (na inilathala ng Human Rights Watch). Mga 1,738 ektarya ang aming balangkas,
        malapit sa opisyal na 1,619 ektarya. Nasa buong ulat ang detalye.
      </p>
    ),
  },
  'size-hectare': {
    title: 'Una, gaano kalaki ang 1 ektarya?',
    body: (
      <>
        <p>
          <b>1 ektarya = 10,000 metro kuwadrado.</b> Isang parisukat na 100 metro ang haba sa bawat gilid.
        </p>
        <p>
          Kasinlaki ito ng mga <b>{Math.round(COURTS_PER_HECTARE)} basketball court</b>. Mga 5 minuto ang isang ikot na lakad sa paligid nito.
          <Cite s="court" />
        </p>
      </>
    ),
    more: <p>Ang isang buong basketball court ay 28 × 15 metro, o 420 metro kuwadrado. 10,000 ÷ 420 ≈ 24. May isang court sa loob ng parisukat, ayon sa tunay na sukat.</p>,
  },
  'size-homes': {
    title: 'Ilang bahay ang kasya sa 1 ektarya?',
    body: (
      <>
        <p>Bawat bahay ay nakatayo sa isang lote. Pumili ng laki para punuin ang parisukat:</p>
        <HomePicker
          names={{ regular: 'Karaniwang bahay', medium: 'Katamtamang bahay', large: 'Malaking bahay', mansion: 'Mansyon' }}
          lot={(m2) => `${m2.toLocaleString('en-US')} metro kuwadrado bawat lote`}
          count={(n) => (
            <>
              <b>{n}</b> bahay
            </>
          )}
        />
      </>
    ),
    more: (
      <p>
        Karaniwan: ang pinakamaliit na loteng pinapayagan para sa bahay sa socialized housing (64 metro kuwadrado). Katamtaman: ang pinakamaliit na lote
        para sa bahay sa open-market na subdivision (120 metro kuwadrado). Ang malaki (300 metro kuwadrado) at mansyon (1,000 metro kuwadrado) ay mga
        halimbawang sukat. Ang bilang ay 10,000 ÷ laki ng lote, hindi kasama ang mga kalsada.
        <Cite s={['bp220', 'pd957']} />
      </p>
    ),
  },
  'size-number': {
    title: <BigNumber value="1,619" unit="ektarya" />,
    body: (
      <p>
        Ngayon, lumayo tayo. Bawat maliit na parisukat sa zone ay 1 ektarya, at <b>1,619</b> ang mga ito: <b>16.19 milyong metro kuwadrado</b>, o
        mga <b>{HUB_COURTS.toLocaleString('en-US')} basketball court</b>.
      </p>
    ),
    more: <p>Ang 1,619 ektarya ay ang opisyal na laki (4,000 acre). Iginuhit ang grid sa aming tantiyang balangkas, kaya bahagyang mas marami ang parisukat.</p>,
  },
  'size-flat': {
    title: 'Isipin mong pinatag ito',
    body: <p>Pinatag namin ang lupa sa loob ng zone para maikumpara mo ito sa mga lugar na kilala mo.</p>,
    more: <p>Paglalarawan lang ito para maikumpara ang laki. Hindi ito plano ng konstruksyon.</p>,
  },
  'size-compare': {
    title: 'Ilan ang kasya?',
    body: (
      <RefPicker
        malls="Mga mall"
        districts="Mga business district"
        result={(k, times) => {
          const r = REFS[k];
          return (
            <>
              <div className="ref-big">
                <b>{times}×</b> {r.name}
              </div>
              <p className="muted">
                {r.kind === 'mall'
                  ? `Batay sa sukat (${r.ha} ektarya bawat isa). Sa 3D: ${r.packed} buong kopya, kasama ang mga puwang sa pagitan.`
                  : `Sa sukat, katumbas ng zone ang mga ${times} na ${r.name}. Dahil mahaba at makitid ang zone, ${r.packed} buong kopya ang kasya nang magkakatabi (makikita sa 3D), at may sobra pang lupa. ${
                      r.basis === 'square'
                        ? 'Mga 240 ektarya ang BGC (BCDA); walang inilathalang hangganan, kaya parisukat ang ipinakita.'
                        : `Sinusundan ng balangkas ang mga pangunahing kalsadang nakapaligid: mga ${Math.round(r.ha)} ektarya.`
                    }`}
              </p>
            </>
          );
        }}
      />
    ),
    more: (
      <p>
        Ang sukat ng mga mall ay ang lote nila ayon sa OpenStreetMap. Makati CBD: EDSA, Gil Puyat, Chino Roces at Arnaiz. Ortigas Center: EDSA, Ortigas
        Ave, Meralco Ave at Shaw Blvd (mga 108 ektarya ayon sa asosasyon nito).
        <Cite s="osm" />
      </p>
    ),
  },
  'size-cities': {
    title: 'Mas malaki pa sa ilang buong lungsod',
    body: (
      <CityBars
        unit="ektarya"
        hubLabel={<b>Pax Silica zone</b>}
        rows={[
          { name: 'Lungsod ng Makati', ha: CITY_STATS.makati },
          { name: 'Mandaluyong', ha: CITY_STATS.mandaluyong },
          { name: 'San Juan', ha: CITY_STATS.sanjuan },
          { name: 'UP Diliman', ha: CITY_STATS.updiliman },
          { name: 'Luneta Park', ha: CITY_STATS.rizalpark },
        ]}
      />
    ),
    more: (
      <p>
        Mula sa mga hangganan sa OpenStreetMap; ang zone ay gumagamit ng opisyal na {HUB_HA.toLocaleString('en-US')} ektarya.
        <Cite s="osm" />
      </p>
    ),
  },
  'size-map': {
    title: 'Ilapag sa lungsod mo',
    body: <p>Pumili ng lungsod, o hanapin ang bayan mo. Totoong laki pa rin ang balangkas.</p>,
  },
  'people-1': {
    title: 'Mga 200 pamilyang Aeta Hungey ang nakatira sa Sapang Kawayan',
    body: (
      <p>
        Sa independiyenteng mapa, <b>nasa loob ng zone</b> ang kanilang sitio. Mula pa 1994, inaangkin nila ito bilang lupaing ninuno. Hindi pa naaaprubahan
        ang claim.
        <Cite s={['rfa', 'hrw']} />
      </p>
    ),
  },
  'people-2': {
    title: 'Maaapektuhan din ang mga kapitbahay nila',
    body: (
      <p>
        Mga magsasaka sa <b>Sitio Binyayan</b>, at ang <b>Ayta Mag-antsi</b> ng Manabayucan. Sa Ilog Bangot kumukuha ng tubig at isda ang mga pamilya rito.
        <Cite s={['hrw', 'rfa']} />
      </p>
    ),
  },
  'people-numbers': {
    title: 'Ilang tao ang ililipat? Walang opisyal na bilang.',
    body: (
      <div className="ncharts">
        <div className="snap">
          <DotChart
            legend="= 10 tao"
            rows={[
              { people: 92, display: '92 tao', who: 'Liham ng BCDA', what: 'sa Barangay O’Donnell', cite: 'hrw', side: 'gov' },
              { people: 200, display: '~200 tao', who: 'BCDA', what: 'sa 40 kabahayan, “iuusog nang bahagya”', cite: 'rfa', side: 'gov' },
              { people: 20000, display: '~20,000 tao', who: 'Kalikasan', what: 'mga Aeta at magsasaka (kinontra ng Palasyo)', cite: 'summit', side: 'critic' },
            ]}
          />
          <p className="note">
            Mga 1,000 pamilya ang bilang ng pinuno ng Aeta Hungey sa kanilang lupaing ninuno — bilang ng pamilya, hindi ng tao.
            <Cite s="pressenza" />
          </p>
        </div>
        <div className="offer snap">
          <h3>Ang iniaalok sa ngayon</h3>
          <Bullets
            items={[
              <>
                Mga <b>50 bahay</b> at <b>100 ektarya</b> ng sakahan sa ibang bahagi ng New Clark City.
                <Cite s="gma-relocation" />
              </>,
              <>
                Ayon sa mga residente, <b>30 metro kuwadrado</b> ang bahay at <b>₱30 bawat metro kuwadrado</b> ang alok para sa lupa. Tumanggi sila.
                <Cite s={['hrw', 'afp']} />
              </>,
              <>
                Binibilang ngayon ng BCDA at NCIP ang mga pamilya.
                <Cite s="bcda-census" />
              </>,
            ]}
          />
        </div>
      </div>
    ),
  },
  'power-ladder': {
    title: 'Gaano kalaki ang 3 gigawatt na kuryente?',
    body: (
      <>
        <p>
          Tantiya ng BCDA: mga <b>3 gigawatt</b> kapag buo na. Ikumpara ang gamit at singil sa isang buwan:
          <Cite s="gma-3gw" />
        </p>
        <EnergyPicker
          names={{
            regular: 'Karaniwang bahay',
            medium: 'Katamtamang bahay',
            large: 'Malaking bahay',
            mansion: 'Mansyon',
            office: 'Office tower',
            mall: 'Malaking mall',
            fab: 'Pabrika ng chips',
            hub: 'Ang zone (3 gigawatt)',
          }}
          kwh={(n) => `${bigTl(n)} kWh bawat buwan`}
          peso={(n) => `₱${bigTl(n)}`}
          detail={(k, homes) =>
            k === 'regular' ? (
              <>
                <b>Karaniwang bahay ayon sa Meralco</b>, mga ₱3,110 sa singil ng Nobyembre 2026.
              </>
            ) : k === 'hub' ? (
              <>
                Kasindami ng <b>mga {homesTl(homes)} karaniwang bahay</b>, mga <b>{pct(HUB_SHARE_OF_LUZON_PEAK)} ng pinakamataas na gamit ng Luzon</b>.
                Maingat na unang tantiya raw ito ng BCDA.
              </>
            ) : (
              <>
                {k === 'office' ? 'Ang isang 50,000-metro-kuwadradong office tower' : k === 'mall' ? 'Ang isang malaking mall (SM City Fairview)' : k === 'fab' ? 'Ang isang modernong pabrika ng chips' : 'Ang bahay na ito'}{' '}
                ay gumagamit ng kasindami ng <b>{homesTl(homes)} karaniwang bahay</b>.
              </>
            )
          }
        />
        <Assumption title="Basahin nang maingat:">
          Tantiya ang 3 GW, hindi sukat; tuloy-tuloy na 3 GW (× 730 oras) ang hanay ng zone. *Presyong pambahay ng Meralco (Nob 2026, ₱15.5510 bawat
          kWh) para maikumpara lang: hindi ₱{bigTl(billOf(ENERGY.hub))} ang tunay na singil ng zone.
          <Cite s="meralco-nov" />
        </Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>Zone: 3,000,000 kW × 730 oras = 2.19 bilyong kWh bawat buwan; × ₱15.5510 = ₱34.1 bilyon (paglalarawan lang).</li>
        <li>Office tower: 50,000 metro kuwadradong inuupahang opisina × 157 kWh bawat metro kuwadrado bawat taon (karaniwan sa mga opisina ng Ayala Land, 2024) ÷ 12 = 654,000 kWh.</li>
        <li>Mall: 5,960 MWh bawat taon ang gawa ng solar sa bubong ng SM City Fairview, na 11% daw ng gamit ng mall: 5,960 ÷ 0.11 ÷ 12 ≈ 4.5 milyong kWh.</li>
        <li>Pabrika ng chips: mga 200 megawatt bawat modernong wafer factory (Taipower) × 730 oras = 146 milyong kWh.</li>
        <li>Bahay: 200 kWh ang karaniwang bahay ayon sa Meralco; halimbawa lang ang 400, 800 at 2,000 kWh.</li>
        <li>
          Luzon: 3,000 ÷ 14,600 megawatt (tantiya ng IEMOP para sa 2026) ≈ 21%.
          <Cite s={['ayala-offices', 'sm-fairview', 'fab-power', 'iemop']} />
        </li>
      </ul>
    ),
  },
  'power-supply': {
    title: 'Paano nila ito papailawin?',
    body: (
      <>
        <Bullets
          items={[
            <>
              <b>Napirmahan na:</b> pag-upa ng lupa para sa solar-at-baterya ng ACWA Power, hanggang {ACWA_MW} MW kapag buo na (Hunyo 2026). Wala pang
              naiulat na konstruksyon.
              <Cite s={['acwa-lease', 'gma-dedicated']} />
            </>,
            <>
              <b>Hindi buong araw ang peak:</b> {ACWA_MW} MW ang pinakamataas na kaya ng panel; kung aaraw-gabihin, mga {rangeEn(ACWA_AVG_MW, 5)} MW lang,
              mga {pct(ACWA_SHARE[1])} ng 3 GW. Inililipat lang ng baterya ang kuryente sa gabi.
              <Cite s={['moa-solar', 'sm-fairview']} />
            </>,
            <>
              <b>Pinag-aaralan:</b> isang sariling planta ng kuryente (ng mga proponent ng proyekto) at isang {BCDA_LNG_STUDY_MW} MW na planta ng gas (LNG)
              para sa New Clark City (BCDA).
              <Cite s={['gma-dedicated', 'lng-40mw']} />
            </>,
            <>
              <b>Senaryo ng ibang nagsuri, hindi plano ng BCDA:</b> 2 GW na solar at 1 GW na LNG sa isang pagsusuri; nukleyar (mga US$6–10 bilyon bawat
              GW) sa isa pa.
              <Cite s={['mendoza', 'scienceph']} />
            </>,
          ]}
        />
        <Assumption title="Mapa: paglalarawan ng laki ng lupa, hindi lugar ng proyekto.">
          Buo: mga {rangeEn(BENCH_SOLAR_HA, 100)} ektarya ng panel para sa 2 GW na solar araw at gabi, batay sa mga proyekto sa Pilipinas. Putol-putol:
          20,000 ektarya, bilang ng isang pagsusuri.
        </Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>
          Kailangang panel = karaniwang kuryente ÷ capacity factor. Capacity factor 17.1–18.0%: solar sa bubong ng SM Mall of Asia (3,000 MWh bawat
          taon mula sa 2 MW) at ng SM City Fairview (5,960 MWh mula sa 3,785 kW). 2,000 MW ÷ 0.180–0.171 = {rangeEn(solarPanelsMW(2000), 100)} MW na
          panel.
        </li>
        <li>
          Lupa ≈ 1 ektarya bawat MW (MTerra Solar: 3,500 MW ng panel sa mga 3,500 ektarya; ACWA: hanggang 500 MW sa 500 ektarya) → mga{' '}
          {rangeEn(BENCH_SOLAR_HA, 100)} ektarya. May dagdag pa para sa baterya. Kung solar lahat ng 3 GW: mga {rangeEn(solarLandHa(3000), 100)} ektarya.
        </li>
        <li>
          Mas mataas ang 20,000 ektarya ng pagsusuri; hindi nito inilathala kung paano ito kinuwenta. Wala pang inilalabas na buong plano sa kuryente
          para sa 3 GW.
          <Cite s={['moa-solar', 'sm-fairview', 'mterra', 'acwa-lease', 'mendoza']} />
        </li>
      </ul>
    ),
  },
  'water-volume': {
    title: 'At 65–90 milyong litro ng tubig bawat araw',
    body: (
      <>
        <p>
          Tantiya ito ng BCDA para sa zone. Pumili ng dami bawat araw para makita ito bilang haligi sa 1-ektaryang parisukat:
          <Cite s={['tribune-water', 'scienceph']} />
        </p>
        <WaterPicker
          names={{ low: '65 milyon', high: '90 milyon', max: '130 milyon' }}
          tags={{ low: 'BCDA, pinakamababa', high: 'BCDA, pinakamataas', max: 'Pinakamataas na tantiya (Science.ph)' }}
          result={(k, mld) => (
            <>
              <b>{mld} milyong litro bawat araw</b> = {poolsOf(mld)} Olympic pool. Sa 1 ektarya: <b>{depthPerDay(mld)} metro</b> ang lalim sa isang
              araw, {depthPerDay(mld) * DAYS_WEEK} metro sa isang linggo, <b>{depthPerDay(mld) * DAYS_MONTH} metro</b> sa isang buwan (30 araw)
              {k === 'max' ? <>, halos gamit ng {householdsOf(mld).toLocaleString('en-US')} na sambahayan sa 200 litro bawat isa.</> : '.'}
            </>
          )}
        />
        <Assumption title="Dami lang ng tubig ang ipinapakita ng haligi.">Hindi ito planong imbakan o ang taas nito.</Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>Lalim = milyong litro × 1,000 metro kubiko ÷ 10,000 metro kuwadrado. 90 milyong litro: 90 × 1,000 ÷ 10,000 = 9 metro. 7 araw ang isang linggo, 30 ang isang buwan.</li>
        <li>2.5 milyong litro ang isang Olympic pool (50 × 25 × 2 m); ang BCDA mismo ang nagkumpara ng 90 milyong litro sa 36 na pool.</li>
        <li>
          65 at 90 milyon: unang pagtatasa ng BCDA, sinabi sa Senado noong Agosto 2026. 130 milyon: Science.ph, mas mataas na tantiya ng ibang nagsuri.
          <Cite s={['tribune-water', 'scienceph']} />
        </li>
      </ul>
    ),
  },
  'water-supply': {
    title: 'Saan manggagaling ang tubig?',
    body: (
      <>
        <Bullets
          items={[
            <>
              <b>Plano ng BCDA (paunang tantiya):</b> ilog Bangut, O’Donnell at Abacan, iipunin sa tangke, hindi sa ilalim ng lupa. Kaya raw ng Bangut
              pa lang ang 130–200 milyong litro bawat araw, mula sa unang pagtatasa noong tag-init, hindi sa inilathalang pag-aaral.
              <Cite s={['tribune-water', 'gma-water']} />
            </>,
            <>
              <b>Tinitingnan din ng BCDA:</b> tubig-dagat na ginawang tabang (desalination), na idadaan sa tabi ng SCTEX.
              <Cite s="tribune-water" />
            </>,
            <>
              <b>Kuwenta ng kritiko sa tag-init:</b> kung 130 milyong litro ang gamit at 65–120 milyon ang kaya ng imbakan, kulang ng 10–65 milyon. Sa
              90 milyon ng BCDA, {shortfall(90)[0]}–{shortfall(90)[1]} milyon.
              <Cite s="scienceph" />
            </>,
            <>
              <b>Recycling</b> ng 85–95%: 5–15% na lang ng kailangan ang bagong tubig, ayon sa isang pagsusuri; kung wala ito, maaaring umasa ang zone
              sa mga balon ng pamilya.
              <Cite s="mendoza" />
            </>,
          ]}
        />
        <Assumption title="Mapa: konseptong laki, hindi lugar ng proyekto.">
          Asul: 390–780 ektaryang imbakan ayon sa isang pagsusuri. Iba ang laki ng lupa sa dami ng naiimbak at sa kayang ibigay bawat araw.
        </Assumption>
      </>
    ),
    more: (
      <ul className="calc">
        <li>
          Laki, dami at kayang ibigay: ang laki ay ang lupang sakop ng imbakan; ang dami ay ang naiipon (laki × karaniwang lalim); ang kayang ibigay ay
          bawat araw. Walang inilathalang paraan ang 390–780 ektarya; tugma ito sa pag-iimbak ng kalahating taon ng 39 bilyong litro bawat taon ng
          pagsusuri (19.5 milyong metro kubiko) sa lalim na 5 o 2.5 metro (sariling muling pagkuwenta).
        </li>
        <li>Pagbabawas ang kakulangan: 130 − 120 = 10 at 130 − 65 = 65 milyong litro bawat araw (Science.ph, mula sa ulat ni Magno, 2026).</li>
        <li>
          Mga ilog: “Bangot” ang Bangut sa OpenStreetMap; “Bangut River” sa GeoNames. Mula sa OpenStreetMap ang Ilog O’Donnell. Nasa Lungsod ng Angeles
          ang Ilog Abacan, labas sa mapang ito. Ayon sa pagsusuri, bumababa nang 40–60% ang ulan tuwing El Niño.
        </li>
        <li>
          Hiwalay dito, igagawad na ng BCDA ang ₱14.8-bilyong proyekto sa tubig at wastewater ng New Clark City sa Maynilad at K-Water dahil walang
          ibang nag-bid (target bago mag-Disyembre). Itataas nito ang suplay ng lungsod mula mga 20 tungong 150–200 milyong litro bawat araw, para sa
          buong lungsod; hindi pa sinasabi ng BCDA kung magkano ang mapupunta sa Pax Silica.
          <Cite s={['mendoza', 'scienceph', 'osm', 'geonames', 'ncc-water']} />
        </li>
      </ul>
    ),
  },
  proscons: {
    kicker: 'Pros at cons',
    title: 'Ang mabuti at masama, ayon sa bawat panig',
    body: (
      <ProsCons
        prosTitle="Sabi ng mga sumusuporta"
        consTitle="Sabi ng mga kritiko"
        pros={[
          { title: 'Trabaho', text: '130,000–190,000 trabaho kapag buo na (tantiya ng gobyerno).', cite: 'pna-signing' },
          { title: 'Pamumuhunan', text: 'Puwedeng pumasok ang US$40–70 bilyon.', cite: 'pna-signing' },
          { title: 'Mas mataas na industriya', text: 'Mula simpleng assembly ng chips, papunta sa paggawa ng high-tech na piyesa.', cite: 'techpolicy' },
          { title: 'Gamitin ang sariling mineral', text: 'Iproseso rito ang nickel imbes na i-export nang hilaw.', cite: 'rfa' },
          { title: 'Atin pa rin ang lupa', text: 'Gobyerno pa rin ang may-ari; walang diplomatic immunity para sa mga dayuhan.', cite: 'gma-sovereignty' },
        ]}
        cons={[
          { title: 'Puwedeng mawalan ng lupa ang mga pamilya', text: 'Nanganganib ang lupaing ninuno ng Aeta, mga sakahan at libingan.', cite: 'hrw' },
          { title: 'Napakalaking pangangailangan sa kuryente at tubig', text: 'Mga 3 GW na kuryente at 65–90 milyong litro ng tubig bawat araw, ayon sa tantiya ng BCDA.', cite: ['gma-3gw', 'tribune-water'] },
          { title: 'Walang pag-aaral, kulang ang konsultasyon', text: 'Wala pang environmental impact assessment. Sabi ng mga komunidad, hindi sila kinonsulta.', cite: ['gma-denr', 'hrw'] },
          { title: 'Malaking pabor sa mamumuhunan', text: 'Upa nang hanggang 99 taon; may panukalang 7-taong tax holiday.', cite: ['mongabay', 'gma-hb11758'] },
          { title: 'Baka hindi magandang trabaho', text: 'Babala ng mga unyon: minimum wage at kaunting paglilipat ng teknolohiya.', cite: ['techpolicy', 'cna'] },
          { title: 'Naiipit sa tunggalian ng US at China', text: 'Sabi ng mga kritiko, itinatali nito ang bansa sa estratehikong interes ng US.', cite: 'techpolicy' },
        ]}
      />
    ),
  },
  benefit: {
    kicker: 'Sino ang mas makikinabang?',
    title: 'Mga Pilipino o mga dayuhang bansa?',
    body: (
      <>
        <p className="lead">Ito ang makukuha ng bawat panig, batay sa mga dokumentado. Hindi kami nagbibigay ng hatol, dahil hindi pa pirmado ang kasunduan.</p>
        <ScoreCard
          head={['', 'Ang Pilipinas', 'Mga dayuhang bansa at mamumuhunan']}
          tags={TAGS}
          rows={[
            {
              topic: 'Lupa',
              ph: { text: 'Mananatiling pag-aari ng gobyerno at babalik kapag natapos ang upa.', tag: 'doc', cite: ['boi-docs', 'mayonai'] },
              foreign: { text: 'Upa nang hanggang 99 taon; inalok ang 2 taong walang bayad.', tag: 'doc', cite: ['mongabay', 'boi-docs'] },
            },
            {
              topic: 'Pera',
              ph: { text: 'Target na US$40–70B na pamumuhunan, at upa para sa BCDA.', tag: 'promised', cite: 'pna-signing' },
              foreign: { text: '7-taong income tax holiday, tapos 5% na buwis kapalit ng ibang buwis.', tag: 'proposed', cite: 'gma-hb11758' },
            },
            {
              topic: 'Trabaho',
              ph: { text: '130,000–190,000 trabaho kapag buo na.', tag: 'promised', cite: 'pna-signing' },
              foreign: { text: 'Kumpanya ang magtatakda ng sahod at pagkuha ng tao. Babala ng mga unyon: minimum wage.', tag: 'unclear', cite: 'techpolicy' },
            },
            {
              topic: 'Teknolohiya',
              ph: { text: 'Pag-asang umangat mula sa assembly; may panukalang batas na mag-oobliga ng skills transfer.', tag: 'proposed', cite: ['techpolicy', 'gma-hb11758'] },
              foreign: { text: 'Siguradong mapagkukunan ng chips, piyesa at prosesong mineral na labas sa China.', tag: 'goal', cite: ['techpolicy', 'state-apr16'] },
            },
            {
              topic: 'Kuryente at tubig',
              ph: { text: 'Ang mga mamumuhunan ang magtatayo ng sariling sistema ng kuryente at tubig.', tag: 'promised', cite: 'afp' },
              foreign: { text: 'Gagamit ang mga pabrika ng mga 3 GW at 65–90 milyong litro bawat araw (tantiya ng BCDA).', tag: 'planned', cite: ['gma-3gw', 'tribune-water'] },
            },
            {
              topic: 'Sino ang magbabayad',
              ph: { text: 'Puwedeng mawalan ng lupa, sakahan at daan sa ilog ang mga pamilyang Aeta at magsasaka.', tag: 'reported', cite: 'hrw' },
              foreign: { text: 'Ang mga mamumuhunan ang gagastos sa gusali at utilities.', tag: 'promised', cite: ['hrw', 'afp'] },
            },
          ]}
        />
        <div className="verdict snap">
          <h3>Kaya sino ang mas makikinabang?</h3>
          <p>Hindi pa ito masusukat. Nakasalalay ito sa mga kondisyong wala pang nakakakita. Bantayan ang mga ito kapag napirmahan na ang kasunduan:</p>
          <ol>
            <li>Magkano talaga ang upa at buwis na babayaran ng mga mamumuhunan</li>
            <li>Ilang trabaho ang mapupunta sa mga Pilipino — at magkano ang sahod</li>
            <li>Kung may totoong obligasyon sa paglilipat ng teknolohiya</li>
            <li>Sino ang unang bibigyan ng tubig at kuryente kapag tagtuyot</li>
            <li>Kung magbibigay ng malaya, nauna at may-kabatirang pahintulot ang mga Aeta at magsasaka</li>
          </ol>
        </div>
      </>
    ),
  },
  next: {
    kicker: 'Ano ang susunod',
    title: 'Ano ang mangyayari',
    body: (
      <Timeline
        items={[
          { date: 'Bago matapos ang 2026', text: 'Target na pirmahan ang pangunahing kasunduan.', cite: 'pna-signing', tag: 'next' },
          { date: 'Kailangan pa', text: 'Environmental clearance para sa mismong zone. Wala pang naisampa noong Agosto.', cite: 'gma-denr', tag: 'next' },
          { date: '2028', text: 'Target na simula ng konstruksyon.', cite: 'cna', tag: 'next' },
        ]}
      />
    ),
  },
};
