# QLD environmental screening (prototype)

Next.js app in `env-screening/` - draw an area of interest on a map, query live Queensland spatial layers (expanded **MSES**, fire scar, World Heritage boundaries, optional Brisbane historical flood overlays from `lga-overlays.json`) via `POST /api/screen`, and open a printable HTML report. The API also returns **register hint links** (PMST / MNES / Qld wildlife pages) and an **AOI centroid** map link (not cadastral title).

## Run locally

```bash
cd env-screening
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How data access works

- No API key is required for the public MapServer `query` endpoints used here.
- Requests go **through this app** (not straight from the browser) so a realistic `User-Agent` is sent and CORS is avoided.
- Base layers: `src/data/layers.json`. Optional LGA packs (e.g. Brisbane): `src/data/lga-overlays.json`. Glossary and reference links: `src/data/glossary.json`. Request body may include `lga`: `"qld"` (default) or `"brisbane"`.

## Limits

- User-drawn polygons are **not** a substitute for surveyed lot boundaries.
- Some layers are scale-dependent in the source service (see Queensland metadata).
- PMST / MNES / registers: **links only** (see API `registerHints`) - not automated spatial queries. Add more catalog layers over time as needed.

## Stack

- Next.js (App Router), TypeScript, Tailwind
- MapLibre GL + Mapbox Draw (polygon AOI)


## Map draw stack

Uses **maplibre-gl v4** with **maplibre-gl-draw** so polygon edit styles stay compatible (MapLibre v5 + @mapbox/mapbox-gl-draw throws line-dasharray validation errors in the browser).

