import { Coordinate, Graph } from './types';
import { haversineDistance } from '../algorithms/heuristics';

export function nearestNode(
  graph: Graph,
  coord: Coordinate
): { id: string; distance: number } | null {
  let nearest: { id: string; distance: number } | null = null;

  Object.values(graph.nodes).forEach((node) => {
    const distance = haversineDistance(coord, node);
    if (!nearest || distance < nearest.distance) {
      nearest = { id: node.id, distance };
    }
  });

  return nearest;
}
