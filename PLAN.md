# What the Pax Silica? — Project Plan

An interactive, slide-style presentation (navigate with arrow keys, swipe or click) that explains
Pax Silica and shows, on a real 3D map, how much land the Philippine hub takes up and who lives there.
Deployed on Vercel.

## Story (slides)

### Act 1: What is Pax Silica?
1. **Title**: "What the Pax Silica?" over a slowly rotating globe.
2. **The name**: *Pax* (peace) + *Silica* (silicon, what chips are made from), so "peace through chips".
3. **Who's in it**: the globe lights up the signatories in the order they joined. The declaration was signed Dec 12, 2025; the Philippines became the 13th signatory on Apr 17, 2026.
4. **Their goals**: secure the AI supply chain (chips, compute, critical minerals, energy, logistics) among "trusted partners", reduce dependence on China, coordinate on export controls. Membership is by US invitation, and the declaration is non-binding.

### Act 2: The Philippines joins
5. **The signing**: DTI Undersecretary Ceferino Rodolfo signs on Apr 17, 2026.
6. **The project**: the "first AI-native industrial acceleration hub" under Pax Silica, in New Clark City, Capas, Tarlac (Luzon Economic Corridor).
7. **Spec sheet**, with each figure linked to its source:
   - about 1,620 ha (4,000 acres), in the northern part of New Clark City (9,450 ha in total)
   - phase 1 is about 500 ha; site development expected in 3 to 5 years
   - BCDA keeps the land; investors get leases of up to 99 years
   - Foxconn is reported as the anchor tenant; Apple, Nvidia, TSMC and others have been courted
   - investment target of about US$70B; job claims range from 130,000 to 200,000
   - power and water: firms must bring their own (DTI); a 3 GW estimate is still unverified

### Act 3: How big is it? (3D map)
8. **Fly-in**: the camera flies from Manila to Tarlac, and the site boundary rises out of the 3D terrain on satellite imagery.
9. **Mall comparison**: real building footprints of SM Mall of Asia, SM Megamall, SM North EDSA and SM City Clark are placed inside the site ("N Malls of Asia fit here").
10. **Drop it on your city**: the footprint moves onto Metro Manila (BGC, Makati, Intramuros), then the viewer can drag it anywhere or search their own town.

### Act 4: Who lives there?
11. **Communities**: Aeta communities and farmers, in Barangay O'Donnell and around Sapang Kawayan (about 200 Aeta households, per RFA), plus the Aeta burial ground. Markers are placed at village (sitio) level only, never at individual homes.
12. **Contested numbers**: a side-by-side chart of each source's figure: BCDA (92 people, about 10 ha), HRW ("hundreds"), Business & Human Rights Centre (200), Kalikasan (about 20,000), SCMP (about 35,000).
13. **The government's answer**: Marcos (no displacement of IP communities), and BCDA (public land zoned industrial, with areas set aside for IPs).

### Act 5: Who's involved, and who gains?
14. **Actor map**: US government (State Dept, Helberg), PH government (DTI, BCDA, Office of the President), companies (Foxconn, courted firms), funds (Maharlika), and the opposition (Network Opposed to Pax Silica with 70+ organizations, Kalikasan, Agham, HRW).
15. **Promises vs. concerns**: jobs and investment on one side; land, power grid, water, sovereignty and ancestral domain claims (CADT delays) on the other.

### Act 6: Close
16. **Timeline**: Dec 2025 to now.
17. **Sources, method, and what's still unknown**.

## Location precision

| Layer | Source | Precision |
|---|---|---|
| Barangay boundaries (Capas, Bamban) | OpenStreetMap / HDX COD-AB (PSA) | exact admin polygons |
| New Clark City boundary | OSM, BCDA master plan | official if available |
| **1,620-ha Pax Silica site** | **BCDA map (not yet found publicly)** | **exact if we get it; otherwise drawn from published aerial photos and descriptions, labeled "approximate"** |
| Communities | OSM villages and sitios, news reports | sitio-level only |
| Malls and landmarks | OSM building footprints | exact footprints |
| Terrain and imagery | satellite and elevation tiles | about 30 m terrain |

## Tech
- **Next.js** (static export) on **Vercel**, which gives good link previews when shared on Facebook and Messenger.
- **MapLibre GL + deck.gl**: 3D terrain, extruded footprints, globe, and a camera fly-to for each slide.
- Map tiles: MapTiler (free key) for satellite and terrain, or Google Photorealistic 3D Tiles for real 3D malls (needs a billing account).
- Built mobile-first; a light 2D mode for slow connections.
- Every figure lives in `data/facts.json` with its source URL and date, and the slides read from it.
- English + Filipino toggle.

## Phases
1. **Data**: a sourced fact sheet, boundary GeoJSON and mall footprints.
2. **Deck shell**: slide engine, navigation, deep links (`/#/slide-9`), language toggle.
3. **3D map slides**: fly-in, site extrusion, mall comparison, drop-it-on-your-city.
4. **Content slides**: goals, globe, actors, contested numbers, timeline.
5. **Polish and deploy**: link-preview images, mobile performance, Vercel.
