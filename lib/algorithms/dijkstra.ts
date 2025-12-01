import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { pathDistance, reconstructPath } from './heuristics';

type FrontierEntry = {
  id: string;
  priority: number;
};

export function dijkstra(
  graph: Graph,
  start: string,
  goal: string,
  options?: { recordEvery?: number; frontierSample?: number }
): PathResult {
  const recordEvery = options?.recordEvery ?? 1;
  const frontierSample = options?.frontierSample ?? 50;

  const distances = new Map<string, number>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];
  const frontier: FrontierEntry[] = [{ id: start, priority: 0 }];
  let processed = 0;

  Object.keys(graph.nodes).forEach((id) => distances.set(id, Infinity));
  distances.set(start, 0);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.priority - b.priority);
    const current = frontier.shift() as FrontierEntry;

    if (visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);
    visitedOrder.push(current.id);
    processed += 1;
    const expanded: string[] = [];
    const shouldRecord = processed % recordEvery === 0 || current.id === goal;

    const neighbors = graph.adjacency[current.id] ?? [];
    neighbors.forEach(({ id: neighborId, weight }) => {
      const alt = (distances.get(current.id) ?? Infinity) + weight;
      if (alt < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, alt);
        cameFrom.set(neighborId, current.id);
        frontier.push({ id: neighborId, priority: alt });
        expanded.push(neighborId);
      }
    });

    if (shouldRecord) {
      steps.push({
        current: current.id,
        frontier: frontier.slice(0, frontierSample).map((node) => node.id),
        visitedCount: visited.size,
        expanded
      });
    }

    if (current.id === goal) {
      break;
    }
  }

  const path = reconstructPath(cameFrom, start, goal);
  const distance = path.length ? pathDistance(path, graph) : Infinity;

  return {
    path,
    steps,
    visitedOrder,
    distance
  };
}
