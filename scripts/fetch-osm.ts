import path from 'path';
import { promises as fs } from 'fs';

type NodeElement = { type: 'node'; id: number; lat: number; lon: number };
type WayElement = {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
};

type OverpassElement = NodeElement | WayElement;

function isNodeElement(el: OverpassElement): el is NodeElement {
  return el.type === 'node';
}

function isWayElement(el: OverpassElement): el is WayElement {
  return el.type === 'way';
}

type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const DEFAULT_BBOX: BBox = {
  south: 40.368,
  west: 49.836,
  north: 40.375,
  east: 49.847
};

const bboxArg = process.argv.find((arg) => arg.startsWith('--bbox='));

function parseBBox(arg?: string): BBox {
  if (!arg) return DEFAULT_BBOX;
  const raw = arg.replace('--bbox=', '').split(',').map(Number);
  if (raw.length !== 4 || raw.some((v) => Number.isNaN(v))) {
    throw new Error('BBox must be provided as --bbox=south,west,north,east');
  }
  return { south: raw[0], west: raw[1], north: raw[2], east: raw[3] };
}

function haversineDistance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const OVERPASS_ENDPOINTS = [
  process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

async function requestOverpass(query: string) {
  let lastError: Error | null = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain', Accept: 'application/json' }
      });
      if (!res.ok) {
        lastError = new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
        // eslint-disable-next-line no-continue
        continue;
      }
      return res;
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError ?? new Error('Overpass request failed');
}

async function fetchGraph(bbox: BBox) {
  const query = `
[out:json][timeout:180];
(
  way["highway"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
(._;>;);
out body;
`;

  const res = await requestOverpass(query);

  const payload = (await res.json()) as { elements: OverpassElement[] };
  const nodeMap = new Map<number, { id: string; lat: number; lon: number }>();
  const edges: { from: string; to: string; weight: number }[] = [];
  const edgeSet = new Set<string>();

  payload.elements.filter(isNodeElement).forEach((node) => {
    nodeMap.set(node.id, { id: `n${node.id}`, lat: node.lat, lon: node.lon });
  });

  const drivable = new Set([
    'motorway',
    'motorway_link',
    'trunk',
    'trunk_link',
    'primary',
    'primary_link',
    'secondary',
    'secondary_link',
    'tertiary',
    'tertiary_link',
    'unclassified',
    'residential',
    'living_street',
    'service'
  ]);
  const bannedAccess = new Set(['no', 'private']);

  payload.elements.filter(isWayElement).forEach((way) => {
    const highway = way.tags?.highway;
    const access = way.tags?.access;
    if (!highway || !drivable.has(highway)) return;
    if (access && bannedAccess.has(access)) return;

    const ids = way.nodes;
    const oneway = way.tags?.oneway;

    const allowForward = oneway !== '-1';
    const allowBackward = oneway !== 'yes';

    for (let i = 0; i < ids.length - 1; i += 1) {
      const a = nodeMap.get(ids[i]);
      const b = nodeMap.get(ids[i + 1]);
      if (!a || !b) continue;
      const weight = haversineDistance(a, b);
      if (allowForward) {
        const abKey = `${a.id}-${b.id}`;
        if (!edgeSet.has(abKey)) {
          edgeSet.add(abKey);
          edges.push({ from: a.id, to: b.id, weight });
        }
      }
      if (allowBackward) {
        const baKey = `${b.id}-${a.id}`;
        if (!edgeSet.has(baKey)) {
          edgeSet.add(baKey);
          edges.push({ from: b.id, to: a.id, weight });
        }
      }
    }
  });

  const nodes = Array.from(nodeMap.values());
  const bounds = nodes.reduce(
    (acc, node) => ({
      minLat: Math.min(acc.minLat, node.lat),
      maxLat: Math.max(acc.maxLat, node.lat),
      minLon: Math.min(acc.minLon, node.lon),
      maxLon: Math.max(acc.maxLon, node.lon)
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLon: Infinity,
      maxLon: -Infinity
    }
  );

  const graph = {
    bbox: bounds,
    nodes,
    edges
  };

  const outPath = path.join(process.cwd(), 'data', 'graph.json');
  await fs.writeFile(outPath, JSON.stringify(graph, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Saved ${nodes.length} nodes and ${edges.length} edges to ${outPath}`);
}

fetchGraph(parseBBox(bboxArg)).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
