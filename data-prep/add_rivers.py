"""Add the rivers BCDA names as water sources to the 3D map, straight from OpenStreetMap ways.

- Bangut River: OSM calls it "Bangot River" (ways 135629603 Capas, 135629605 Bamban). GeoNames lists
  "Bangut River" (alternate names Bangat River, Bangut), the spelling BCDA uses.
- O'Donnell River: OSM "O' Donnel River" (way 52502498). GeoNames: "O'Donnell River" (alternate: Patlin River).
- Abacan River: in Angeles City, south-east of the 3D area, so it is not drawn.

Lines are clipped to the scene bounding box; each stretch inside becomes one entry in fx.rivers,
keeping the OSM way id. Usage: python3 data-prep/add_rivers.py [public/data/geo/site.json]
"""
import json, sys, urllib.request
import xml.etree.ElementTree as ET

P = sys.argv[1] if len(sys.argv) > 1 else 'public/data/geo/site.json'
WAYS = [
    # (display name in our data, OSM way id) — Capas stretch of the Bangut first, so its label stays near the zone
    ('Bangot River', 135629603),
    ('Bangot River', 135629605),
    ("O'Donnell River", 52502498),
]

def fetch_way(way_id):
    req = urllib.request.Request(f'https://api.openstreetmap.org/api/0.6/way/{way_id}/full', headers={'User-Agent': 'osm-data-check/1.0'})
    root = ET.fromstring(urllib.request.urlopen(req, timeout=60).read())
    nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.findall('node')}
    way = root.find('way')
    tags = {t.get('k'): t.get('v') for t in way.findall('tag')}
    return tags, [nodes[nd.get('ref')] for nd in way.findall('nd')]

d = json.load(open(P))
w, s, e, n = d['scene']['bbox']
inside = lambda p: w <= p[0] <= e and s <= p[1] <= n
rivers = [r for r in d['fx']['rivers'] if r['name'] not in {name for name, _ in WAYS}]
added = []
for name, way_id in WAYS:
    tags, pts = fetch_way(way_id)
    run = []
    for p in pts + [None]:
        if p is not None and inside(p):
            run.append([round(p[0], 6), round(p[1], 6)])
        elif len(run) > 1:
            added.append({'name': name, 'kind': 'river', 'coords': run, 'osm': f'way/{way_id}', 'osmName': tags.get('name', '')})
            run = []
        else:
            run = []
    print(name, way_id, tags.get('name'), len(pts), 'points')
d['fx']['rivers'] = added + rivers
json.dump(d, open(P, 'w'), separators=(',', ':'))
print('rivers now:', [(r['name'], len(r['coords'])) for r in d['fx']['rivers']])
