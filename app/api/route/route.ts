import { NextRequest, NextResponse } from 'next/server';
import { loadGraph } from '@/lib/graph/loadGraph';
import { nearestNode } from '@/lib/graph/nearestNode';
import { astar } from '@/lib/algorithms/astar';
import { bfs } from '@/lib/algorithms/bfs';
import { dijkstra } from '@/lib/algorithms/dijkstra';
import { Coordinate, RouteResponse } from '@/lib/graph/types';

type AlgorithmName = 'bfs' | 'dijkstra' | 'astar';

type RoutePayload = {
  start: Coordinate;
  goal: Coordinate;
  algorithm: AlgorithmName;
};

export async function POST(req: NextRequest): Promise<NextResponse<RouteResponse | { error: string }>> {
  const body = (await req.json()) as RoutePayload;
  if (!body?.start || !body?.goal) {
    return NextResponse.json({ error: 'Start and goal coordinates are required.' }, { status: 400 });
  }

  const algorithm: AlgorithmName = body.algorithm ?? 'astar';
  const graph = await loadGraph();

  const startNearest = nearestNode(graph, body.start);
  const goalNearest = nearestNode(graph, body.goal);

  if (!startNearest || !goalNearest) {
    return NextResponse.json({ error: 'Graph is empty or coordinates are invalid.' }, { status: 500 });
  }

  const t0 = performance.now();
  const result =
    algorithm === 'bfs'
      ? bfs(graph, startNearest.id, goalNearest.id)
      : algorithm === 'dijkstra'
        ? dijkstra(graph, startNearest.id, goalNearest.id)
        : astar(graph, startNearest.id, goalNearest.id);
  const t1 = performance.now();

  if (!result.path.length) {
    return NextResponse.json(
      { error: 'No path found between selected points.' },
      { status: 404 }
    );
  }

  const response: RouteResponse = {
    path: result.path.map((id) => {
      const node = graph.nodes[id];
      return { lat: node.lat, lon: node.lon };
    }),
    nodePath: result.path,
    steps: result.steps,
    distance: result.distance,
    visited: result.visitedOrder.length,
    elapsedMs: Math.round(t1 - t0),
    start: body.start,
    goal: body.goal,
    startNode: startNearest.id,
    goalNode: goalNearest.id
  };

  return NextResponse.json(response);
}
