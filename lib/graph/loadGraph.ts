import path from 'path';
import { promises as fs } from 'fs';
import { Graph, GraphData } from './types';
import { haversineDistance } from '../algorithms/heuristics';

let cachedGraph: Graph | null = null;

async function readGraphFile(): Promise<GraphData> {
  const graphPath = path.join(process.cwd(), 'data', 'graph.json');
  const raw = await fs.readFile(graphPath, 'utf8');
  return JSON.parse(raw) as GraphData;
}

export async function loadGraph(): Promise<Graph> {
  if (cachedGraph) {
    return cachedGraph;
  }

  const data = await readGraphFile();
  const nodes = Object.fromEntries(data.nodes.map((node) => [node.id, node]));
  const adjacency: Graph['adjacency'] = {};

  data.edges.forEach((edge) => {
    const fromNode = nodes[edge.from];
    const toNode = nodes[edge.to];
    if (!fromNode || !toNode) {
      return;
    }

    const weight =
      edge.weight ?? haversineDistance(
        { lat: fromNode.lat, lon: fromNode.lon },
        { lat: toNode.lat, lon: toNode.lon }
      );

    if (!adjacency[edge.from]) {
      adjacency[edge.from] = [];
    }
    adjacency[edge.from].push({ id: edge.to, weight });
  });

  cachedGraph = {
    nodes,
    adjacency,
    bbox: data.bbox
  };

  return cachedGraph;
}

export function resetGraphCache(): void {
  cachedGraph = null;
}
