"""Trace approximate business-district outlines from their bounding roads in OpenStreetMap.

Usage: python3 trace_districts.py <osm-file> <name> "<road regex N>" "<road regex E>" "<road regex S>" "<road regex W>"
The roads are given in order around the district. Corners are where consecutive roads meet
(shared node, or the closest pair of nodes when one passes over the other). Each side follows
the road's own geometry between its two corners (shortest path on that road's ways).
Prints the outline as GeoJSON coordinates and its area in hectares.
"""
import sys, re, json, math, heapq
import xml.etree.ElementTree as ET

osm, name, *roads = sys.argv[1:]
root = ET.parse(osm).getroot()
nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
ways = []
for w in root.iter('way'):
    tags = {t.get('k'): t.get('v') for t in w.findall('tag')}
    if 'highway' in tags and tags.get('name'):
        ways.append((tags['name'], [nd.get('ref') for nd in w.findall('nd')]))

def road_ways(rx):
    r = re.compile(rx, re.I)
    return [nds for n, nds in ways if r.search(n)]

def dist(a, b):
    (x1, y1), (x2, y2) = nodes[a], nodes[b]
    k = 111320 * math.cos(math.radians(y1))
    return math.hypot((x1 - x2) * k, (y1 - y2) * 110574)

def graph(ws):
    g = {}
    for nds in ws:
        for a, b in zip(nds, nds[1:]):
            if a in nodes and b in nodes:
                d = dist(a, b)
                g.setdefault(a, []).append((b, d)); g.setdefault(b, []).append((a, d))
    return g

R = [road_ways(rx) for rx in roads]
for rx, ws in zip(roads, R):
    assert ws, f'no ways for {rx}'
G = [graph(ws) for ws in R]

def corner(i, j):
    a, b = set(G[i]), set(G[j])
    shared = a & b
    if shared:
        return list(shared)
    best = min(((dist(x, y), x, y) for x in a for y in b), key=lambda t: t[0])
    assert best[0] < 120, f'roads {roads[i]} / {roads[j]} do not meet ({best[0]:.0f} m)'
    return [best[1], best[2]]

n = len(R)
corners = [corner((i - 1) % n, i) for i in range(n)]  # corners[i] = start of side i

def path(g, src, dst_set):
    pq = [(0, src, None)]; prev = {}; seen = set()
    while pq:
        d, u, p = heapq.heappop(pq)
        if u in seen: continue
        seen.add(u); prev[u] = p
        if u in dst_set:
            out = [u]
            while prev[out[-1]] is not None: out.append(prev[out[-1]])
            return d, out[::-1]
        for v, w in g.get(u, []):
            if v not in seen: heapq.heappush(pq, (d + w, v, u))
    return math.inf, None

ring = []
for i in range(n):
    g = G[i]
    starts = [c for c in corners[i] if c in g]
    ends = set(c for c in corners[(i + 1) % n] if c in g)
    best = min((path(g, s, ends) for s in starts), key=lambda t: t[0])
    assert best[1], f'no path along {roads[i]}'
    ring += [nodes[k] for k in best[1]]
ring.append(ring[0])

lat0 = sum(p[1] for p in ring) / len(ring)
xy = [(math.radians(p[0]) * 6378137 * math.cos(math.radians(lat0)), math.radians(p[1]) * 6378137) for p in ring]
area = abs(sum(xy[i][0] * xy[i + 1][1] - xy[i + 1][0] * xy[i][1] for i in range(len(xy) - 1))) / 2 / 1e4
print(json.dumps({'name': name, 'area_ha': round(area, 1), 'geom': {'type': 'Polygon', 'coordinates': [[[round(x, 6), round(y, 6)] for x, y in ring]]}}))
