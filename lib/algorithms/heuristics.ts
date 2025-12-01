import { Coordinate, Graph } from '../graph/types';

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function reconstructPath(
  cameFrom: Map<string, string>,
  start: string,
  goal: string
): string[] {
  if (start === goal) {
    return [start];
  }

  if (!cameFrom.has(goal)) {
    return [];
  }

  const path: string[] = [goal];
  let current = goal;

  while (current !== start) {
    const prev = cameFrom.get(current);
    if (!prev) {
      return [];
    }
    current = prev;
    path.push(current);
  }

  return path.reverse();
}

export function pathDistance(path: string[], graph: Graph): number {
  if (path.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = graph.nodes[path[i]];
    const to = graph.nodes[path[i + 1]];
    if (!from || !to) {
      continue;
    }
    total += haversineDistance(from, to);
  }

  return total;
}
