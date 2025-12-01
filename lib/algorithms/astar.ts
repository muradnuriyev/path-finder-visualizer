import { AlgorithmStep, Graph, PathResult } from '../graph/types';
import { haversineDistance, pathDistance, reconstructPath } from './heuristics';

type FrontierEntry = {
  id: string;
  priority: number;
};

export function astar(
  graph: Graph,
  start: string,
  goal: string
): PathResult {
  const gScore = new Map<string, number>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const cameFrom = new Map<string, string>();
  const steps: AlgorithmStep[] = [];
  const frontier: FrontierEntry[] = [{ id: start, priority: 0 }];

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
