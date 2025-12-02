# Real-World Pathfinding Visualizer

Interactive pathfinding visualizer on real OSM street graphs with BFS, Dijkstra, and A*. Click start/goal, pick an algorithm, and watch it animate—frontier, visited nodes, expansion rays, and the final path.

## Features
- Algorithms: BFS (unweighted), Dijkstra (weighted shortest path), A* (heuristic + distance).
- Live animation with Play/Step; shows frontier, visited, expansion rays, and final path.
- Real street graph with road directions; fallback to undirected search when data is fragmented.
- Swap graphs easily via Overpass script (`data/graph.json`).

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000
```
UI flow:
1) Choose click mode (Start/Goal) and place points on the map.
2) Choose an algorithm (BFS/Dijkstra/A*).
3) Hit Run; use Step/Play to animate.

## Architecture
- `app/page.tsx` — client UI + animation logic.
- `components/` — `MapView` (map + step rendering), `ControlPanel`, `StatsPanel`.
- `app/api/route/route.ts` — API: loads graph, snaps clicks to nearest nodes, runs algorithm, returns path/steps/stats. Has a fallback to undirected graph if directed search fails.
- `lib/algorithms/` — BFS, Dijkstra, A*, step collection for visualization.
- `lib/graph/` — types, graph loading, nearest-node lookup, distance helpers.
- `data/graph.json` — sample graph (Baku, reduced). Do not commit huge files—GitHub rejects >100 MB.
- `scripts/fetch-osm.ts` — Overpass-based generator (car roads only, respects oneway).

## Generate Your Own Graph
Overpass can be slow. Example bbox for central Baku (medium size, ~11 MB):
```bash
npm run fetch:osm -- --bbox=40.36,49.82,40.42,49.92
```
`--bbox` is `south,west,north,east` (WGS84). Larger areas → larger files. Restart `npm run dev` after generation to clear cache.

### Generation Tips
- Big bbox ⇒ big file and slower render; shrink area or reduce detail if lagging (`recordEvery` and step/node limits in the API).
- To target other transport modes, tweak the `drivable` list and oneway logic in `scripts/fetch-osm.ts`.
- Don’t store huge `graph.json` in Git; add to `.gitignore` or use Git LFS.

## Scripts
- `npm run dev` — dev server (Next 16.0.6, React 19.2).
- `npm run build` — production build.
- `npm run fetch:osm -- --bbox=...` — build graph from Overpass.
- `npm run lint` — Next lint (reenable eslint config in `next.config.mjs` if you want).

## Step Visualization
Algorithms return steps with frontier, visited count, and `expanded` edges. `MapView` draws:
- Blue dots — visited
- Orange dots — frontier
- Blue rays — expansions
- Teal polyline — final path (only on the last step)

## Limits & Caveats
- Huge bbox → heavy graph/render. Reduce area or tune sampling limits.
- OSM gaps can break directed routes; fallback may return a path that ignores direction.
- Dev-mode double render: `MapView` clears `_leaflet_id` and removes the map on unmount to avoid “Map container is already initialized”.

## Stack & Versions
- Next.js 16.0.6, React 19.2.0, React-Leaflet 5.0.0, Leaflet 1.9.4
- TypeScript 5.9.x, ESLint 9.x

## License
MIT (unless stated otherwise). OSM data is under ODbL—comply with OSM terms for your own graphs.
