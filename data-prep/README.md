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

## 4. Malls (`pack_malls.py`)

Mall lot polygons come from OpenStreetMap (via Nominatim). `pack_malls.py` packs whole copies of each footprint, in 4 rotations, inside the hub outline on a 10 m raster with a ~10 m gap. It writes the placements into `site.json`. Area-based ratios (e.g. 82 × SM Mall of Asia) use the official 1,619 ha.

`extract.py` is a small HTML-to-text helper used while reading sources.
