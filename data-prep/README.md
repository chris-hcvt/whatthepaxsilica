# Data preparation

These scripts produced the files in `public/data/`. They were run once; the site does not need them at runtime. Python 3 with `numpy`, `opencv-python-headless`, `rasterio` and `Pillow`.

## 1. Hub and New Clark City outlines (`register.py`, `georef.py`, `svgpath.py`)

1. Download the map SVG published by Human Rights Watch with its Nov 16, 2026 report (original map: A. Ortega / Countermapping PH). It contains the hub and New Clark City outlines as vector paths, drawn over an embedded satellite image.
2. `register.py` matches the embedded image to Esri World Imagery (Web Mercator) with SIFT features + RANSAC. Result: a similarity transform with 26 inliers, ~1.5 px RMS, and 0.47° rotation.
3. `georef.py` maps the vector paths through that transform into lon/lat.

Checks:

| Check | Result |
|---|---|
| Hub outline area | 1,738 ha (official: 1,619 ha, +7%) |
| New Clark City outline area | 9,634 ha (official: 9,450 ha, +2%) |
| Sitio dots vs OpenStreetMap places | Binyayan ~320 m, Manabayukan ~420 m, Burog ~350 m, Kalangitan ~120 m apart |
| HRW's description | Sapang Kawayan inside the hub; Binyayan and Manabayucan just outside ✔ |

## 2. Imagery (`s2composite.py`)

A cloud-masked Sentinel-2 L2A true-colour composite (Sep 13 – Oct 18, 2026; tiles 51PTS/51PTT, from the Element 84 Earth Search catalogue). It is reprojected to a regular lon/lat grid over 120.38–120.62°E, 15.20–15.39°N and saved at 2048 px and 1024 px wide (the smaller one is used on phones).

## 3. Terrain (`dem.py`)

Copernicus DEM GLO-30 over the same box, averaged to a 257 × 204 grid and stored as little-endian `uint16` decimetres (`dem.bin`).

## 4. Comparison places (`trace_districts.py`, `build_refs.py`, `pack_malls.py`, `pack_districts.py`)

- **Malls** (SM Mall of Asia, Glorietta, SM North EDSA, SM Megamall, SM City Pampanga, SM City Clark): lot or building polygons from OpenStreetMap via Nominatim (`refs/newmalls.json` and earlier lookups).
- **Makati CBD** and **Ortigas Center**: no official polygon exists, so `trace_districts.py` follows their commonly cited bounding roads in OpenStreetMap data (Makati CBD: EDSA, Gil Puyat Ave, A. Arnaiz Ave, Chino Roces Ave → ~259 ha; Ortigas Center: Ortigas Ave, Meralco Ave, Shaw Blvd, EDSA → ~137 ha, vs ~108 ha cited by its association).
- **BGC**: no published boundary, so it is a square of BCDA's 240 ha.

`build_refs.py` merges them into `site.json`; `pack_malls.py` then packs whole copies inside the hub outline (10 m raster, 4 rotations, ~10 m gap). The business districts are large next to the hub's long, narrow shape, so `pack_districts.py` repacks them with rotations every 10° and several fill directions (BGC 3, Makati CBD 4, Ortigas Center 8 whole copies; it takes several minutes). Area ratios (e.g. 82 × SM Mall of Asia) use the official 1,619 hectares; the story shows every whole copy and states both numbers.

## 5. Leveling

The 3D "leveled" view sets every terrain vertex inside the hub outline to the average height inside it, blending back to natural ground over 450 m outside the edge. It is an illustration for comparing sizes, not an engineering plan.

`extract.py` is a small HTML-to-text helper used while reading sources.

## 6. Place search (`build_places.py`)

The map's search box suggests Philippine city and town centres from a local list built from the GeoNames PH dump (CC BY 4.0): capital and municipal-seat points (PPLC/PPLA/PPLA2/PPLA3), other places of 15,000+ people, and municipality points where no seat point exists — 1,816 places, ~31 KB gzipped. Only searches that match nothing locally (barangays, landmarks) fall back to one OpenStreetMap Nominatim request.

## 7. Map annotations (`refs/fx-osm.json`, `refs/makati-city.json`, `src/content/ph-outline.ts`)

- Bangot River and Sapang Kawayan creek lines, and 34 farmland polygons near Binyayan, from the OpenStreetMap API (bbox 120.455–120.53°E, 15.29–15.35°N). A mapped cemetery in the same area is deliberately **not** shown.
- `add_rivers.py`: the rivers BCDA names as water sources, straight from OpenStreetMap ways and clipped to the 3D area: the Bangut (OSM “Bangot River”, ways 135629603 and 135629605; GeoNames “Bangut River”) and the O’Donnell (OSM “O' Donnel River”, way 52502498; GeoNames “O’Donnell River”, alternate name Patlin River). The Abacan River is in Angeles City, outside the 3D area, so it is not drawn.
- Power & water figures live in `src/content/power.ts` with their sources and formulas; `npm run check:numbers` re-computes every derived value.
- Makati City's boundary (OSM relation 103716), laid onto the leveled zone for comparison.
- The Philippines inset outline is Natural Earth 1:110m (public domain).
