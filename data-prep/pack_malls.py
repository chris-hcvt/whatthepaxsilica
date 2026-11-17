"""Greedy raster packing of real mall footprints inside the (approximate) hub outline.

Writes `placements` ([x_km, z_km, rotY_rad] in the 3D scene's local projection) into
public/data/geo/site.json for each mall, so the browser does no heavy work.
"""
import json, math, sys
import numpy as np
import cv2

P = sys.argv[1] if len(sys.argv) > 1 else 'public/data/geo/site.json'
d = json.load(open(P))
w, s, e, n = d['scene']['bbox']
lon0, lat0 = (w + e) / 2, (s + n) / 2
kx, ky = 111.32 * math.cos(math.radians(lat0)), 110.574
xz = lambda lon, lat: (( lon - lon0) * kx, -(lat - lat0) * ky)

RES = 0.01  # km per cell (10 m)
hub = np.array([xz(*p) for p in d['hub']])
x0, z0 = hub.min(0) - 0.05
x1, z1 = hub.max(0) + 0.05
W, H = int((x1 - x0) / RES) + 1, int((z1 - z0) / RES) + 1
to_px = lambda pts: np.round((pts - [x0, z0]) / RES).astype(np.int32)
inside = np.zeros((H, W), np.uint8)
cv2.fillPoly(inside, [to_px(hub)], 1)

def outer(geom):
    if geom['type'] == 'Polygon':
        return geom['coordinates'][0]
    return max(geom['coordinates'], key=lambda p: len(p[0]))[0]

for key, m in d['refs'].items():
    ring = np.array(outer(m['geom']))
    clon, clat = ring[:, 0].mean(), ring[:, 1].mean()
    kxm = 111.32 * math.cos(math.radians(clat))
    foot = np.stack([(ring[:, 0] - clon) * kxm, -(ring[:, 1] - clat) * ky], 1)  # scene x,z before rotation
    best = None
    for rots in ([0.0], [0.0, math.pi / 2], [0.0, math.pi / 2, math.pi, 3 * math.pi / 2]):
        masks = []
        for a in rots:
            c, s_ = math.cos(a), math.sin(a)
            # three.js rotation about Y: x' = x cos a + z sin a ; z' = -x sin a + z cos a
            r = np.stack([foot[:, 0] * c + foot[:, 1] * s_, -foot[:, 0] * s_ + foot[:, 1] * c], 1)
            span = np.abs(r).max(0) + 0.03
            mw, mh = int(2 * span[0] / RES) + 1, int(2 * span[1] / RES) + 1
            mk = np.zeros((mh, mw), np.uint8)
            cv2.fillPoly(mk, [np.round((r + span) / RES).astype(np.int32)], 1)
            mk = cv2.dilate(mk, np.ones((3, 3), np.uint8))  # ~10 m gap between copies
            ys, xs = np.nonzero(mk)
            masks.append((a, ys - mh // 2, xs - mw // 2))
        occ = np.zeros_like(inside)
        placed = []
        step = 2
        for j in range(0, H, step):
            for i in range(0, W, step):
                if not inside[j, i] or occ[j, i]:
                    continue
                for a, dy, dx in masks:
                    yy, xx = dy + j, dx + i
                    if yy.min() < 0 or xx.min() < 0 or yy.max() >= H or xx.max() >= W:
                        continue
                    if inside[yy, xx].all() and not occ[yy, xx].any():
                        occ[yy, xx] = 1
                        placed.append([round(x0 + i * RES, 4), round(z0 + j * RES, 4), round(a, 4)])
                        break
        if best is None or len(placed) > len(best):
            best = placed
    m['placements'] = best
    m['packed'] = len(best)
    print(key, 'packed', len(best), 'area-fit', round(1619 / m['area_ha'], 1))

json.dump(d, open(P, 'w'), separators=(',', ':'))
