# Real-world Pathfinding Visualizer

Next.js + React-Leaflet playground for experimenting with BFS, Dijkstra, and A* on a street graph sourced from OpenStreetMap.

## Quick start
- Install deps: `npm install`
- Run dev server: `npm run dev` then open `http://localhost:3000`
- Pick click mode (Start / Goal), click two points on the map, choose an algorithm, and hit **Run**. Use **Step** / **Play** to animate the algorithm’s exploration.

## Repository layout
- `app/page.tsx` — client UI: map, controls, stats.
- `app/api/route/route.ts` — API route that loads the prebuilt graph, snaps start/goal to nearest nodes, runs the chosen algorithm, and returns the path + steps.
- `components/` — UI pieces (`MapView`, `ControlPanel`, `StatsPanel`).
- `lib/graph/` — graph types, loading, nearest-node search.
- `lib/algorithms/` — BFS, Dijkstra, A*, plus distance helpers.
- `data/graph.json` — generated graph for a small Baku slice (sample).
- `scripts/fetch-osm.ts` — dev helper to fetch OSM data via Overpass and build `data/graph.json`.

## Regenerating `graph.json`
The repo ships with a tiny sample graph so the UI works offline. To build your own:

```bash
npm install
npm run fetch:osm -- --bbox=40.368,49.836,40.375,49.847
```

- `--bbox` is `south,west,north,east` (WGS84). The default above is a central Baku patch.
- The script requests `highway=*` ways, builds a bidirectional weighted graph (weights = haversine meters), and writes `data/graph.json`.
- Requires Node 18+ (for built-in `fetch`) and runs through `ts-node` with a CommonJS override for convenience.

## Notes
- The backend keeps the graph in memory for speed; restart the dev server after regenerating the graph.
- The UI uses OpenStreetMap raster tiles via the default public endpoint; swap the tile URL if you need your own server.
