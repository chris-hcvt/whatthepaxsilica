import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Map as MLMap, GeoJSONSource, LngLatBoundsLike, Marker } from 'maplibre-gl';
import { translateRing, type LL, type SiteData } from '../three/geo';
import { CITY_CENTRES, HUB_HA } from '../content/story';
import { useDeck } from '../deck';

let siteDataPromise: Promise<SiteData> | null = null;
const getSite = () => (siteDataPromise ??= fetch('/data/geo/site.json').then((r) => r.json()));

/** Search a Philippine place with OpenStreetMap Nominatim (on submit only, as its usage policy asks). */
async function geocode(q: string): Promise<LL | null> {
  const base = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=' + encodeURIComponent(q);
  for (const extra of ['&featureType=settlement', '']) {
    const r = await fetch(base + extra, { headers: { 'Accept-Language': 'en' } });
    if (!r.ok) continue;
    const js = (await r.json()) as { lon: string; lat: string }[];
    if (js.length) return [parseFloat(js[0].lon), parseFloat(js[0].lat)];
  }
  return null;
}

/** "Drop it on your city": the hub outline at true size on any place, inside the story flow. */
export function DropMap({ visible }: { visible: boolean }) {
  const { L, dropCenter, setDropCenter, dropLabel } = useDeck();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const hubRef = useRef<LL[] | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const t = L.story['size-map'];

  const update = (map: MLMap, c: LL, animate = true) => {
    if (!hubRef.current) return;
    const ring = translateRing(hubRef.current, c);
    (map.getSource('hub') as GeoJSONSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });
    markerRef.current?.setLngLat(c);
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    const b: LngLatBoundsLike = [
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ];
    map.fitBounds(b, { padding: 40, duration: animate ? 1200 : 0, maxZoom: 13.5 });
  };

  // create the map the first time the section comes near the viewport
  useEffect(() => {
    if (!visible || mapRef.current || !el.current) return;
    let cancelled = false;
    (async () => {
      const [maplibre] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
      const site = await getSite();
      if (cancelled || !el.current) return;
      hubRef.current = site.hub;
      const map = new maplibre.Map({
        container: el.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: dropCenter,
        zoom: 11.5,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
      map.on('load', () => {
        map.addSource('hub', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'hub-fill', type: 'fill', source: 'hub', paint: { 'fill-color': '#ff3b3b', 'fill-opacity': 0.34 } });
        map.addLayer({ id: 'hub-line', type: 'line', source: 'hub', paint: { 'line-color': '#d61f1f', 'line-width': 3 } });
        const m = document.createElement('div');
        m.className = 'drop-label';
        m.textContent = `≈ ${HUB_HA.toLocaleString('en-US')} ha`;
        markerRef.current = new maplibre.Marker({ element: m, anchor: 'center' }).setLngLat(dropCenter).addTo(map);
        update(map, dropCenter, false);
      });
      map.on('click', (e) => setDropCenter([e.lngLat.lng, e.lngLat.lat], 'custom'));
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) update(map, dropCenter);
  }, [dropCenter[0], dropCenter[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const ll = await geocode(q.trim());
      if (ll) setDropCenter(ll, 'search');
      else setErr(L.ui.mapNotFound);
    } catch {
      setErr(L.ui.mapNotFound);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dropsec">
      <div className="drop-card">
        <h2>{t.title}</h2>
        {t.body}
        <form className="drop-search" onSubmit={onSearch} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.ui.mapSearch} aria-label={L.ui.mapSearch} />
          <button type="submit" disabled={busy}>
            {L.ui.mapSearchGo}
          </button>
        </form>
        {err && <p className="drop-err">{err}</p>}
        <div className="chips">
          {CITY_CENTRES.map((c) => (
            <button key={c.id} type="button" className={`chip ${dropLabel === c.id ? 'on' : ''} ${c.id === 'capas' ? 'origin' : ''}`} onClick={() => setDropCenter(c.ll, c.id)}>
              {L.cities[c.id]}
            </button>
          ))}
        </div>
        <p className="hint">{L.ui.mapHint}</p>
      </div>
      <div className="drop-map">
        <div ref={el} className="dropmap-inner" aria-label={t.title as string} />
      </div>
    </div>
  );
}
