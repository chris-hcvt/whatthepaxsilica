import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Map as MLMap, GeoJSONSource, Marker } from 'maplibre-gl';
import { ringCentroid, translateRing, type LL, type SiteData } from '../three/geo';
import type { Insets } from '../three/engine';
import { dataUrl } from '../content/data-url';
import { CITY_CENTRES, HUB_HA } from '../content/story';
import { useDeck } from '../deck';

let siteDataPromise: Promise<SiteData> | null = null;
const getSite = () => (siteDataPromise ??= fetch(dataUrl('/data/geo/site.json')).then((r) => r.json()));

type Place = [string, string, number, number, number]; // name, province, lon, lat, population

let placesPromise: Promise<Place[]> | null = null;
const getPlaces = () => (placesPromise ??= fetch(dataUrl('/data/geo/places.json')).then((r) => r.json()));

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

const mx = (lon: number) => (lon + 180) / 360;
const my = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

/**
 * Full-screen map that takes over from the 3D view. It starts on the real site in Capas, framed like the
 * 3D top-down view underneath, fades in, and then carries the outline to the chosen city.
 */
export function MapLayer({ prepare, active, insets }: { prepare: boolean; active: boolean; insets: Insets }) {
  const { L, dropCenter, setDropCenter } = useDeck();
  const el = useRef<HTMLDivElement>(null);
  const hubText = `≈ ${HUB_HA.toLocaleString('en-US')} ${L.ui.hectares}`;
  const hubTextRef = useRef(hubText);
  hubTextRef.current = hubText;
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  useEffect(() => {
    const m = markerRef.current?.getElement();
    if (m) m.textContent = hubText;
  }, [hubText]);
  const hubRef = useRef<LL[] | null>(null);
  const homeRef = useRef<LL>([120.4875, 15.3075]);
  const readyRef = useRef(false);
  const flyingRef = useRef(false);
  const atRef = useRef<LL | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const centerRef = useRef(dropCenter);
  centerRef.current = dropCenter;
  const insetsRef = useRef(insets);
  insetsRef.current = insets;
  const timer = useRef<number>(0);

  const padding = () => {
    const i = insetsRef.current;
    const m = 36;
    return { left: i.left + m, right: m, top: (i.top ?? 0) + m, bottom: i.bottom + m };
  };

  const setOutline = (c: LL) => {
    const map = mapRef.current;
    if (!map || !hubRef.current) return;
    const ring = translateRing(hubRef.current, c);
    (map.getSource('hub') as GeoJSONSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });
    markerRef.current?.setLngLat(c);
  };

  /** zoom that fits the outline (placed at c) inside the padded part of the screen */
  const fitZoom = (map: MLMap, c: LL) => {
    const ring = translateRing(hubRef.current!, c);
    const xs = ring.map((p) => mx(p[0]));
    const ys = ring.map((p) => my(p[1]));
    const w = (Math.max(...xs) - Math.min(...xs)) * 512;
    const h = (Math.max(...ys) - Math.min(...ys)) * 512;
    const p = padding();
    const cw = map.getContainer().clientWidth - p.left - p.right;
    const ch = map.getContainer().clientHeight - p.top - p.bottom;
    return Math.min(14, Math.log2(Math.min(cw / w, ch / h)));
  };

  const goHome = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.stop();
    flyingRef.current = false;
    map.setPadding(padding());
    map.jumpTo({ center: homeRef.current, zoom: fitZoom(map, homeRef.current) });
    setOutline(homeRef.current);
    atRef.current = homeRef.current;
  };

  const travel = (to: LL) => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setPadding(padding());
    atRef.current = to; // set first: a very short move can end synchronously
    const from = map.getCenter();
    const km = Math.hypot((to[0] - from.lng) * 107, (to[1] - from.lat) * 111);
    // longer trips fly longer, but always as a visible flight (never an instant jump)
    const duration = Math.round(Math.min(5200, 1400 + Math.sqrt(km) * 120));
    flyingRef.current = true;
    map.flyTo({ center: to, zoom: fitZoom(map, to), curve: 1.5, duration, essential: true });
  };

  // build the map ahead of time, parked on the real site
  useEffect(() => {
    if (!prepare || mapRef.current || !el.current) return;
    let cancelled = false;
    (async () => {
      const [maplibre] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
      const site = await getSite();
      if (cancelled || !el.current) return;
      hubRef.current = site.hub;
      const c = ringCentroid(site.hub as [number, number][]);
      homeRef.current = [c[0], c[1]];
      const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const map = new maplibre.Map({
        container: el.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: homeRef.current,
        zoom: 11,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        dragPan: !touch, // on phones one finger keeps scrolling the page; pinch still zooms
        scrollZoom: false, // the mouse wheel keeps scrolling the page
        fadeDuration: 0,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
      if (window.location.search.includes('debugmap')) (window as unknown as { __map: MLMap }).__map = map;
      map.on('load', () => {
        map.addSource('hub', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'hub-fill', type: 'fill', source: 'hub', paint: { 'fill-color': '#ff3b3b', 'fill-opacity': 0.34 } });
        map.addLayer({ id: 'hub-line', type: 'line', source: 'hub', paint: { 'line-color': '#e3262b', 'line-width': 3 } });
        const m = document.createElement('div');
        m.className = 'drop-label';
        m.textContent = hubTextRef.current;
        markerRef.current = new maplibre.Marker({ element: m, anchor: 'center' }).setLngLat(homeRef.current).addTo(map);
        readyRef.current = true;
        goHome();
        if (activeRef.current) timer.current = window.setTimeout(() => travel(centerRef.current), 500);
      });
      // the outline rides along with the camera while it flies
      map.on('move', () => {
        if (flyingRef.current) setOutline([map.getCenter().lng, map.getCenter().lat]);
      });
      map.on('moveend', () => {
        if (flyingRef.current) {
          flyingRef.current = false;
          if (atRef.current) setOutline(atRef.current);
        }
      });
      map.on('click', (e) => {
        if (activeRef.current) setDropCenter([e.lngLat.lng, e.lngLat.lat], 'custom');
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [prepare]); // eslint-disable-line react-hooks/exhaustive-deps

  // fade in over the 3D, then lift off; fade out and park back home
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!readyRef.current) return;
    if (active) {
      if (!atRef.current || atRef.current === homeRef.current) timer.current = window.setTimeout(() => travel(centerRef.current), 850);
    } else {
      timer.current = window.setTimeout(goHome, 700);
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active && readyRef.current) travel(dropCenter);
  }, [dropCenter[0], dropCenter[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mapRef.current?.resize();
    if (readyRef.current && !active) goHome();
  }, [insets.left, insets.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`maplayer ${active ? 'on' : ''}`} aria-hidden={!active}>
      <div ref={el} className="maplayer-inner" />
    </div>
  );
}

/** Search box and city buttons, shown in the story card for the map step. */
export function DropControls() {
  const { L, setDropCenter, dropLabel } = useDeck();
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
    <div className="dropcontrols">
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
                  <button type="button" className={i === hi ? 'hi' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)}>
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
  );
}
