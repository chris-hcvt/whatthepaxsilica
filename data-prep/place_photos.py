"""Pictures for the 3D pop-ups (src/content/photos.ts).

1. Satellite close-ups of every village: a ~1.8 km wide cut of public/data/site/imagery-2048.jpg (Copernicus
   Sentinel-2, the image the 3D map already uses), enlarged 2x with a light sharpen, with a ring at the village
   point. Written to public/img/places/sat-<name>.jpg.
2. Openly licensed photos from Wikimedia Commons, resized to 640 px wide (no other change), written to
   public/img/photos/. Credits live in src/content/photos.ts and the sources list.

Usage: python3 data-prep/place_photos.py            (both)
       python3 data-prep/place_photos.py --sat-only (no downloads)
"""

import io
import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'public/data/geo/site.json'
IMAGERY = ROOT / 'public/data/site/imagery-2048.jpg'
PLACES = ROOT / 'public/img/places'
PHOTOS = ROOT / 'public/img/photos'

SAT_KM = 1.8  # width of a close-up, km (matches SAT_KM in photos.ts)
SAT_OUT = (480, 320)

# Commons file -> output name (see photos.ts for author and licence)
COMMONS = {
    '12-inch silicon wafer.jpg': 'wafer.jpg',
    'Taganito Mining Corp. nickel ore conveyor belts - Flickr.jpg': 'taganito-nickel.jpg',
    'Santa Lucia, Capas, Tarlac, Philippines - panoramio (1).jpg': 'santa-lucia.jpg',
    'Juki KE-2080L by Megger.jpg': 'factory-smt.jpg',
}
UA = 'ExplainerSiteResearch/1.0 (image licensing lookup)'


def slug(name: str) -> str:
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z]+', '-', name.lower()))


def satellite():
    site = json.loads(SITE.read_text())
    w, s, e, n = site['scene']['bbox']
    im = Image.open(IMAGERY).convert('RGB')
    W, H = im.size
    km_per_px = (e - w) * 111.32 * math.cos(math.radians((s + n) / 2)) / W
    half_w = SAT_KM / km_per_px / 2
    half_h = half_w * SAT_OUT[1] / SAT_OUT[0]
    PLACES.mkdir(parents=True, exist_ok=True)
    for sitio in site['sitios']:
        lon, lat = sitio['lonlat']
        x = (lon - w) / (e - w) * W
        y = (n - lat) / (n - s) * H
        crop = im.crop((round(x - half_w), round(y - half_h), round(x + half_w), round(y + half_h)))
        crop = crop.resize(SAT_OUT, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
        d = ImageDraw.Draw(crop)
        cx, cy, r = SAT_OUT[0] / 2, SAT_OUT[1] / 2, 15
        d.ellipse((cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1), outline=(0, 0, 0), width=4)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 214, 102), width=2)
        out = PLACES / f"sat-{slug(sitio['name'])}.jpg"
        crop.save(out, quality=82, optimize=True, progressive=True)
        print('wrote', out.relative_to(ROOT), out.stat().st_size // 1024, 'KB')


def photos():
    PHOTOS.mkdir(parents=True, exist_ok=True)
    for title, name in COMMONS.items():
        if (PHOTOS / name).exists() and '--refresh' not in sys.argv:
            continue
        url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(title.replace(' ', '_')) + '?width=960'
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        data = urllib.request.urlopen(req, timeout=60).read()
        im = Image.open(io.BytesIO(data)).convert('RGB')
        im.thumbnail((640, 640), Image.LANCZOS)
        out = PHOTOS / name
        im.save(out, quality=82, optimize=True, progressive=True)
        print('wrote', out.relative_to(ROOT), im.size, out.stat().st_size // 1024, 'KB')
        time.sleep(5)  # be polite to Commons


if __name__ == '__main__':
    satellite()
    if '--sat-only' not in sys.argv:
        photos()
