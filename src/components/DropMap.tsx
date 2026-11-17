import { useEffect, useRef } from 'react';
import type { Map as MLMap, GeoJSONSource, LngLatBoundsLike } from 'maplibre-gl';
import { translateRing, type LL, type SiteData } from '../three/geo';
import type { Insets } from '../three/engine';

interface Props {
  active: boolean;
  center: LL;
  insets: Insets;
  onPick: (ll: LL) => void;
  areaLabel: string;
}

let siteDataPromise: Promise<SiteData> | null = null;
const getSite = () => (siteDataPromise ??= fetch('/data/geo/site.json').then((r) => r.json()));

export function DropMap({ active, center, insets, onPick, areaLabel }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const hubRef = useRef<LL[] | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const update = (map: MLMap, c: LL) => {
    if (!hubRef.current) return;
    const ring = translateRing(hubRef.current, c);
    (map.getSource('hub') as GeoJSONSource | undefined)?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    const b: LngLatBoundsLike = [
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ];
    const pad = 36;
    map.fitBounds(b, {
      padding: { left: insets.left + pad, right: pad, top: 70 + pad, bottom: insets.bottom + 70 + pad },
      duration: 1400,
      maxZoom: 13.2,
    });
  };

  useEffect(() => {
    if (!active || mapRef.current || !el.current) return;
    let cancelled = false;
    (async () => {
      const [maplibre] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
      const site = await getSite();
      if (cancelled || !el.current) return;
      hubRef.current = site.hub;
      const map = new maplibre.Map({
        container: el.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: center,
        zoom: 11.5,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;
      map.on('load', () => {
        map.addSource('hub', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'hub-fill', type: 'fill', source: 'hub', paint: { 'fill-color': '#ff3b3b', 'fill-opacity': 0.34 } });
        map.addLayer({ id: 'hub-line', type: 'line', source: 'hub', paint: { 'line-color': '#d61f1f', 'line-width': 3 } });
        const m = document.createElement('div');
        m.className = 'drop-label';
        m.textContent = areaLabel;
        markerRef.current = m;
        const marker = new maplibre.Marker({ element: m, anchor: 'center' });
        marker.setLngLat(center).addTo(map);
        (map as MLMap & { _hubMarker?: typeof marker })._hubMarker = marker;
        update(map, center);
      });
      map.on('click', (e) => pickRef.current([e.lngLat.lng, e.lngLat.lat]));
    })();
    return () => {
      cancelled = true;
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    update(map, center);
    (map as MLMap & { _hubMarker?: { setLngLat: (c: LL) => void } })._hubMarker?.setLngLat(center);
  }, [center[0], center[1], insets.left, insets.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (markerRef.current) markerRef.current.textContent = areaLabel;
  }, [areaLabel]);

  useEffect(() => {
    if (active) mapRef.current?.resize();
  }, [active]);

  return (
    <div className={`dropmap ${active ? 'on' : ''}`}>
      <div ref={el} className="dropmap-inner" aria-label="Map" />
    </div>
  );
}
