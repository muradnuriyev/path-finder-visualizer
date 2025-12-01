import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { pathDistance, reconstructPath } from './heuristics';

export function bfs(graph: Graph, start: string, goal: string): PathResult {
  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const visitedOrder: string[] = [start];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const frontierSnapshot = [...queue];
    steps.push({
      current,
      frontier: frontierSnapshot,
      visited: Array.from(visited)
    });

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
      }
    });
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
