import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { pathDistance, reconstructPath } from './heuristics';

type FrontierEntry = {
  id: string;
  priority: number;
};

export function dijkstra(
  graph: Graph,
  start: string,
  goal: string
): PathResult {
  const distances = new Map<string, number>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];
  const frontier: FrontierEntry[] = [{ id: start, priority: 0 }];

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
    steps.push({
      current: current.id,
      frontier: frontier.map((node) => node.id),
      visited: Array.from(visited)
    });

    if (current.id === goal) {
      break;
    }

    const neighbors = graph.adjacency[current.id] ?? [];
    neighbors.forEach(({ id: neighborId, weight }) => {
      const alt = (distances.get(current.id) ?? Infinity) + weight;
      if (alt < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, alt);
        cameFrom.set(neighborId, current.id);
        frontier.push({ id: neighborId, priority: alt });
      }
    });
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
