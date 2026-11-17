# What the Pax Silica?

A scrolling, plain-language explainer on **Pax Silica** — the US-led tech supply-chain pact — and the **~1,619-hectare zone** planned in New Clark City, Capas, Tarlac. As you scroll, a 3D model of the real terrain shows where the zone is, how big it is (leveled and filled with SM Mall of Asia, Glorietta, BGC, Makati CBD and more), and which communities live there. It then lays out the pros and cons and a "who gets what" scorecard (no verdict). A separate **full report** (`/report/`) has every detail.

English is the default; a pop-up on first visit lets readers pick **English or Tagalog** (more languages planned). Every number links to its source.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy (Vercel)

Import this repo in Vercel. It is a plain Vite app: build command `npm run build`, output `dist/` (already set in `vercel.json`). No API keys or paid services are needed:

- 3D terrain and satellite imagery are pre-baked files in `public/data/site/` (served from Vercel's CDN).
- The “Drop it on your city” map uses free [OpenFreeMap](https://openfreemap.org) tiles and only loads on that slide.

After the first deploy, change `og:image` in `index.html` to the full URL (e.g. `https://<your-domain>/og.jpg`) so Facebook/Messenger previews show the image.

## Live "viewing now" counter

The header shows how many people have the site open (tabs active in the last 60 seconds). It uses a tiny Vercel Function (`api/presence.js`) and a free Upstash Redis database:

1. In the Vercel dashboard, open this project → **Storage** (or **Integrations → Marketplace**) → add **Upstash for Redis** (free plan) and connect it to this project.
2. Redeploy. The integration adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`; the counter appears automatically.

Until then the counter stays hidden. Each tab sends an anonymous random id every 25 seconds — no personal data is stored. On the free plan, Upstash allows a limited number of commands per month (each ping uses 3–4); if the site gets very popular, check the Upstash usage page.

## Structure

| Path | What |
|---|---|
| `index.html`, `src/StoryApp.tsx` | The scrolling story |
| `report/index.html`, `src/ReportApp.tsx` | The full report page |
| `src/content/story.ts` | Story steps, the 3D scene for each step, comparison places, city map presets |
| `src/i18n/story-en.tsx`, `story-tl.tsx` | Story text (English, Tagalog) |
| `src/i18n/en.tsx`, `tl.tsx` | Report text and interface strings |
| `src/content/sources.ts` | The source list — citation numbers come from its order |
| `src/three/` | 3D terrain scene (three.js), incl. the leveling animation |
| `src/components/DropMap.tsx` | “Drop it on your city” map (MapLibre + OpenFreeMap) with city presets and search |
| `public/data/` | Pre-processed geodata, terrain and imagery |
| `data-prep/` | Scripts used to build the data (see `data-prep/README.md`) |

### Adding a language (Cebuano, Ilocano, …)

1. Copy `src/i18n/tl.tsx` and `src/i18n/story-tl.tsx` (e.g. to `ceb.tsx` / `story-ceb.tsx`), rename the exports, set `code`/`name`, and translate every string.
2. Register it in `LOCALES` in `src/i18n/index.ts` and remove it from `UPCOMING`.

The language pop-up picks it up automatically, and `?lang=ceb` links work.

## How the hub outline was made

BCDA has not published the official boundary and denied an FOI request for it. The outline here is traced from the independent map by **A. Ortega / Countermapping PH**, as published by Human Rights Watch (Nov 16, 2026). It was georeferenced against satellite imagery and is **approximate (±~0.5 km)**. Its area computes to ~1,738 ha against the official 1,619 ha. Details are in `data-prep/README.md` and on the last slide.

## Credits

- Hub outline: derived from the map by A. Ortega / Countermapping PH (graphic by Human Rights Watch). The original map image is not redistributed here.
- Imagery: contains modified Copernicus Sentinel data 2026. Elevation: Copernicus DEM GLO-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the EU and ESA.
- Mall footprints, city boundaries, village locations and base map: © OpenStreetMap contributors (ODbL); tiles by OpenFreeMap.
- Country outlines: Natural Earth (public domain).

Spotted an error or have a better source? Please open an issue.
