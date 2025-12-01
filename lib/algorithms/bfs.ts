import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { pathDistance, reconstructPath } from './heuristics';

export function bfs(
  graph: Graph,
  start: string,
  goal: string,
  options?: { recordEvery?: number; frontierSample?: number }
): PathResult {
  const recordEvery = options?.recordEvery ?? 1;
  const frontierSample = options?.frontierSample ?? 50;

  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const visitedOrder: string[] = [start];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];
  let processed = 0;

  while (queue.length > 0) {
    const current = queue.shift() as string;
    processed += 1;
    const expanded: string[] = [];
    const shouldRecord = processed % recordEvery === 0 || current === goal;

    if (current === goal) {
      break;
    }

    const neighbors = graph.adjacency[current] ?? [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        visitedOrder.push(neighbor.id);
        cameFrom.set(neighbor.id, current);
        queue.push(neighbor.id);
        expanded.push(neighbor.id);
      }
    });

    if (shouldRecord) {
      const frontierSnapshot = queue.slice(0, frontierSample);
      steps.push({
        current,
        frontier: frontierSnapshot,
        visitedCount: visited.size,
        expanded
      });
    }
  }

  const path = reconstructPath(cameFrom, start, goal);
  const distance = pathDistance(path, graph);

  return {
    path,
    steps,
    visitedOrder,
    distance
  };
}
