import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Map as MLMap, GeoJSONSource, LngLatBoundsLike, Marker } from 'maplibre-gl';
import { translateRing, type LL, type SiteData } from '../three/geo';
import { CITY_CENTRES, HUB_HA } from '../content/story';
import { useDeck } from '../deck';

let siteDataPromise: Promise<SiteData> | null = null;
const getSite = () => (siteDataPromise ??= fetch('/data/geo/site.json').then((r) => r.json()));

type Place = [string, string, number, number, number]; // name, province, lon, lat, population

let placesPromise: Promise<Place[]> | null = null;
const getPlaces = () => (placesPromise ??= fetch('/data/geo/places.json').then((r) => r.json()));

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/city of |municipality of | city\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Rank local places: exact name, then prefix, then word prefix, then contains; bigger towns first. */
function suggest(places: Place[], q: string, limit = 6): Place[] {
  const n = norm(q);
  if (n.length < 2) return [];
  const scored: [number, number, Place][] = [];
  for (const p of places) {
    const name = norm(p[0]);
    const full = `${name} ${norm(p[1])}`;
    let score = -1;
    if (name === n) score = 0;
    else if (name.startsWith(n)) score = 1;
    else if (name.split(' ').some((w) => w.startsWith(n))) score = 2;
    else if (full.includes(n)) score = 3;
    if (score >= 0) scored.push([score, -p[4], p]);
  }
  scored.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return scored.slice(0, limit).map((x) => x[2]);
}

/** Fallback for barangays and landmarks: one OpenStreetMap Nominatim request (on submit only). */
async function geocodeRemote(q: string): Promise<LL | null> {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=' + encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) return null;
  const js = (await r.json()) as { lon: string; lat: string }[];
  return js.length ? [parseFloat(js[0].lon), parseFloat(js[0].lat)] : null;
}

/** "Drop it on your city": the hub outline at true size on any place, inside the story flow. */
export function DropMap({ visible }: { visible: boolean }) {
  const { L, dropCenter, setDropCenter, dropLabel } = useDeck();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const hubRef = useRef<LL[] | null>(null);
  const readyRef = useRef(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const sugg = places ? suggest(places, q) : [];
  const loadPlaces = () => {
    if (!places) getPlaces().then(setPlaces).catch(() => undefined);
  };
  const pick = (p: Place) => {
    setDropCenter([p[2], p[3]], 'search');
    setQ(`${p[0]}, ${p[1]}`);
    setOpen(false);
    setErr('');
  };
  const t = L.story['size-map'];
  const centerRef = useRef(dropCenter);
  centerRef.current = dropCenter;

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
        readyRef.current = true;
        update(map, centerRef.current, false);
      });
      map.on('click', (e) => setDropCenter([e.lngLat.lng, e.lngLat.lat], 'custom'));
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current) update(map, dropCenter);
  }, [dropCenter[0], dropCenter[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    if (sugg.length) return pick(sugg[Math.min(hi, sugg.length - 1)]);
    setBusy(true);
    setErr('');
    try {
      const ll = await geocodeRemote(q.trim());
      if (ll) {
        setDropCenter(ll, 'search');
        setOpen(false);
      } else setErr(L.ui.mapNotFound);
    } catch {
      setErr(L.ui.mapSearchBusy);
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
          <div className="drop-input">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setHi(0);
                setErr('');
              }}
              onFocus={() => {
                loadPlaces();
                setOpen(true);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHi((h) => Math.min(h + 1, Math.max(0, sugg.length - 1)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHi((h) => Math.max(h - 1, 0));
                } else if (e.key === 'Escape') setOpen(false);
              }}
              placeholder={L.ui.mapSearch}
              aria-label={L.ui.mapSearch}
              role="combobox"
              aria-expanded={open && sugg.length > 0}
              aria-controls="drop-suggestions"
              aria-autocomplete="list"
              autoComplete="off"
              enterKeyHint="search"
            />
            {open && sugg.length > 0 && (
              <ul className="drop-sugg" id="drop-suggestions" role="listbox">
                {sugg.map((p, i) => (
                  <li key={`${p[0]}-${p[2]}`} role="option" aria-selected={i === hi}>
                    <button
                      type="button"
                      className={i === hi ? 'hi' : ''}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(p)}
                    >
                      <b>{p[0]}</b> <span>{p[1]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
