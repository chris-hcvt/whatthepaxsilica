"""Merge comparison references (malls and business districts) into public/data/geo/site.json as `refs`.

Inputs (data-prep/refs/):
  newmalls.json  Nominatim lookup for Glorietta (W40190900) and SM City Pampanga (R18355738)
  makati.json    Makati CBD traced by trace_districts.py (EDSA, Gil Puyat, Arnaiz, Chino Roces)
  ortigas.json   Ortigas Center traced by trace_districts.py (Ortigas Ave, Meralco Ave, Shaw Blvd, EDSA)
BGC has no published boundary, so it is a square of BCDA's 240 ha.
Run pack_malls.py afterwards to compute placements.
"""
import json, math
P = 'public/data/geo/site.json'
d = json.load(open(P))
old = d.pop('malls', None) or {k: v for k, v in d.get('refs', {}).items()}
nm = {f['properties']['osm_id']: f['geometry'] for f in json.load(open('data-prep/refs/newmalls.json'))['features']}
mk = json.load(open('data-prep/refs/makati.json'))
oc = json.load(open('data-prep/refs/ortigas.json'))

def rnd(g):
    r = lambda c: [round(c[0], 6), round(c[1], 6)] if isinstance(c[0], (int, float)) else [r(x) for x in c]
    return {'type': g['type'], 'coordinates': r(g['coordinates'])}

def square(lon, lat, ha):
    s = math.sqrt(ha * 1e4) / 2
    dx, dy = s / (111320 * math.cos(math.radians(lat))), s / 110574
    return {'type': 'Polygon', 'coordinates': [[[lon - dx, lat - dy], [lon + dx, lat - dy], [lon + dx, lat + dy], [lon - dx, lat + dy], [lon - dx, lat - dy]]]}

refs = {
  'moa':       {'kind': 'mall', 'name': 'SM Mall of Asia', 'place': 'Pasay', 'geom': old['moa']['geom'], 'area_ha': old['moa']['area_ha'], 'basis': 'osm'},
  'glorietta': {'kind': 'mall', 'name': 'Glorietta', 'place': 'Makati', 'geom': rnd(nm[40190900]), 'area_ha': 5.0, 'basis': 'osm'},
  'northedsa': {'kind': 'mall', 'name': 'SM North EDSA', 'place': 'Quezon City', 'geom': old['northedsa']['geom'], 'area_ha': old['northedsa']['area_ha'], 'basis': 'osm'},
  'megamall':  {'kind': 'mall', 'name': 'SM Megamall', 'place': 'Mandaluyong', 'geom': old['megamall']['geom'], 'area_ha': old['megamall']['area_ha'], 'basis': 'osm'},
  'smpampanga':{'kind': 'mall', 'name': 'SM City Pampanga', 'place': 'Mexico, Pampanga', 'geom': rnd(nm[18355738]), 'area_ha': 24.7, 'basis': 'osm'},
  'smclark':   {'kind': 'mall', 'name': 'SM City Clark', 'place': 'Angeles', 'geom': old['smclark']['geom'], 'area_ha': old['smclark']['area_ha'], 'basis': 'osm'},
  'bgc':       {'kind': 'district', 'name': 'BGC', 'place': 'Taguig', 'geom': rnd(square(121.049, 14.5507, 240)), 'area_ha': 240, 'basis': 'square'},
  'makaticbd': {'kind': 'district', 'name': 'Makati CBD', 'place': 'Makati', 'geom': mk['geom'], 'area_ha': mk['area_ha'], 'basis': 'roads'},
  'ortigas':   {'kind': 'district', 'name': 'Ortigas Center', 'place': 'Pasig', 'geom': oc['geom'], 'area_ha': oc['area_ha'], 'basis': 'roads'},
}
d['refs'] = refs
json.dump(d, open(P, 'w'), separators=(',', ':'))
print({k: v['area_ha'] for k, v in refs.items()})
