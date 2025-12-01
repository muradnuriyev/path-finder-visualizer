import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { haversineDistance, pathDistance, reconstructPath } from './heuristics';

type FrontierEntry = {
  id: string;
  priority: number;
};

export function astar(
  graph: Graph,
  start: string,
  goal: string,
  options?: { recordEvery?: number; frontierSample?: number }
): PathResult {
  const recordEvery = options?.recordEvery ?? 1;
  const frontierSample = options?.frontierSample ?? 50;

  const gScore = new Map<string, number>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];
  const frontier: FrontierEntry[] = [{ id: start, priority: 0 }];
  let processed = 0;

  Object.keys(graph.nodes).forEach((id) => gScore.set(id, Infinity));
  gScore.set(start, 0);

  const goalNode = graph.nodes[goal];

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
      const tentativeG = (gScore.get(current.id) ?? Infinity) + weight;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current.id);
        gScore.set(neighborId, tentativeG);
        const neighborNode = graph.nodes[neighborId];
        const heuristic =
          goalNode && neighborNode
            ? haversineDistance(neighborNode, goalNode)
            : 0;
        const fScore = tentativeG + heuristic;
        frontier.push({ id: neighborId, priority: fScore });
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
