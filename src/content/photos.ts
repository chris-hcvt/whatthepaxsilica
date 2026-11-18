/**
 * Pictures for the 3D pop-ups, with their credits. Photos are openly licensed (Wikimedia Commons) and only
 * resized; files and attributions are made by data-prep/place_photos.py. Villages without an openly licensed
 * ground photo show a satellite close-up cut from the same Copernicus Sentinel-2 image the 3D map uses.
 */

export interface Photo {
  src: string;
  w: number;
  h: number;
  author: string;
  license: 'CC BY 3.0' | 'CC BY-SA 2.0' | 'CC BY-SA 3.0' | 'CC BY-SA 4.0' | 'Public domain';
  licenseUrl?: string;
  /** the file's page on Wikimedia Commons */
  page: string;
}

const LICENSES: Record<Photo['license'], string | undefined> = {
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'Public domain': undefined,
};

const photo = (p: Omit<Photo, 'licenseUrl'>): Photo => ({ ...p, licenseUrl: LICENSES[p.license] });

export const PHOTOS = {
  wafer: photo({
    src: '/img/photos/wafer.jpg',
    w: 640,
    h: 640,
    author: 'Peellden',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:12-inch_silicon_wafer.jpg',
  }),
  nickel: photo({
    src: '/img/photos/taganito-nickel.jpg',
    w: 640,
    h: 357,
    author: 'Ryan Dael (EITI)',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Taganito_Mining_Corp._nickel_ore_conveyor_belts_-_Flickr.jpg',
  }),
  staLucia: photo({
    src: '/img/photos/santa-lucia.jpg',
    w: 640,
    h: 425,
    author: 'Sindre Helvik',
    license: 'CC BY 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Santa_Lucia,_Capas,_Tarlac,_Philippines_-_panoramio_(1).jpg',
  }),
  factory: photo({
    src: '/img/photos/factory-smt.jpg',
    w: 640,
    h: 429,
    author: 'Megger Ltd.',
    license: 'CC BY 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Juki_KE-2080L_by_Megger.jpg',
  }),
} satisfies Record<string, Photo>;

/** the plan chapter's three industry tags, in order: chips, factories, minerals */
export const INDUSTRY_PHOTOS: [PhotoKey, PhotoKey, PhotoKey] = ['wafer', 'factory', 'nickel'];

export type PhotoKey = keyof typeof PHOTOS;

/** villages with an openly licensed ground photo nearby */
export const PLACE_PHOTOS: Record<string, PhotoKey> = {
  'Sta. Lucia': 'staLucia',
};

/** the satellite close-up of a village: data-prep/place_photos.py, about 1.8 km across */
export const satSrc = (name: string) => `/img/places/sat-${name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}.jpg`;
export const SAT_KM = 1.8;

/** Google Maps' satellite view at a point (a link only: Google's imagery can't be copied onto the site) */
export const mapsUrl = ([lon, lat]: [number, number]) =>
  `https://www.google.com/maps/@?api=1&map_action=map&center=${lat.toFixed(5)},${lon.toFixed(5)}&zoom=16&basemap=satellite`;
