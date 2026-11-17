"""Build a small gazetteer of Philippine city and town centres for the map search.

Source: GeoNames PH dump (CC BY 4.0) — https://download.geonames.org/export/dump/
Inputs: PH.txt, admin1CodesASCII.txt, admin2Codes.txt (unzipped) in the folder given as argv[1].
Output: public/data/geo/places.json as [[name, province, lon, lat, population], ...]
Keeps capital/seat points (PPLC, PPLA, PPLA2, PPLA3: the poblacion or city centre) and other
populated places of 15,000+ people, dropping near-duplicates.
"""
import json, math, sys, unicodedata
D = sys.argv[1]
admin1 = {}
for line in open(f'{D}/admin1CodesASCII.txt', encoding='utf-8'):
    k, name, *_ = line.rstrip('\n').split('\t')
    if k.startswith('PH.'): admin1[k] = name
admin2 = {}
for line in open(f'{D}/admin2Codes.txt', encoding='utf-8'):
    k, name, *_ = line.rstrip('\n').split('\t')
    if k.startswith('PH.'): admin2[k] = name

def clean_prov(s):
    for p in ('Province of ', 'City of '):
        if s.startswith(p): s = s[len(p):]
    return s

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    for w in ('city of ', ' city', 'municipality of '):
        s = s.replace(w, ' ')
    return ' '.join(s.split())

RANK = {'PPLC': 0, 'PPLA': 1, 'PPLA2': 2, 'PPLA3': 3, 'PPL': 4}
rows = []
for line in open(f'{D}/PH.txt', encoding='utf-8'):
    f = line.rstrip('\n').split('\t')
    if f[6] != 'P': continue
    code, pop = f[7], int(f[14] or 0)
    if code not in RANK: continue
    if code == 'PPL' and pop < 15000: continue
    a1, a2 = f[10], f[11]
    if a1 == 'NCR':
        prov = 'Metro Manila'
    else:
        prov = clean_prov(admin2.get(f'PH.{a1}.{a2}', '')) or admin1.get(f'PH.{a1}', '')
    rows.append({'name': f[1], 'prov': prov, 'lon': float(f[5]), 'lat': float(f[4]), 'pop': pop, 'rank': RANK[code], 'n': norm(f[1])})

# municipalities whose seat is missing above: add the ADM3 point (municipality) as a fallback
for line in open(f'{D}/PH.txt', encoding='utf-8'):
    f = line.rstrip('\n').split('\t')
    if f[6] != 'A' or f[7] != 'ADM3': continue
    a1, a2 = f[10], f[11]
    prov = 'Metro Manila' if a1 == 'NCR' else (clean_prov(admin2.get(f'PH.{a1}.{a2}', '')) or admin1.get(f'PH.{a1}', ''))
    name = f[1]
    for p in ('Municipality of ', 'City of '):
        if name.startswith(p): name = name[len(p):]
    rows.append({'name': name, 'prov': prov, 'lon': float(f[5]), 'lat': float(f[4]), 'pop': int(f[14] or 0), 'rank': 5, 'n': norm(name)})

rows.sort(key=lambda r: (r['rank'], -r['pop']))
kept = []
for r in rows:
    dup = False
    for k in kept:
        if k['n'] == r['n'] and math.hypot((k['lon'] - r['lon']) * 107, (k['lat'] - r['lat']) * 111) < (25 if r['rank'] == 5 else 8):
            dup = True
            break
    if not dup: kept.append(r)
kept.sort(key=lambda r: -r['pop'])
out = [[r['name'], r['prov'], round(r['lon'], 4), round(r['lat'], 4), r['pop']] for r in kept]
json.dump(out, open('public/data/geo/places.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'places')
for q in ('Lucena', 'Capas', 'Angeles City', 'Makati City', 'Quezon City', 'Davao City', 'Bontoc', 'Tarlac City', 'Iloilo City'):
    print(q, [o for o in out if o[0] == q][:2])
