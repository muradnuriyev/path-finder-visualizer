import { NextRequest, NextResponse } from 'next/server';
import { loadGraph } from '@/lib/graph/loadGraph';
import { nearestNode } from '@/lib/graph/nearestNode';
import { astar } from '@/lib/algorithms/astar';
import { bfs } from '@/lib/algorithms/bfs';
import { dijkstra } from '@/lib/algorithms/dijkstra';
import { Coordinate, Graph, RouteResponse } from '@/lib/graph/types';

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
  const nodeCount = Object.keys(graph.nodes).length;
  const recordEvery = Math.max(1, Math.ceil(nodeCount / 2000));
  const frontierSample = 50;
  const MAX_PATH_POINTS = 20000;
  const MAX_STEPS = 1500;
  const MAX_STEP_NODES = 40000;
  const VISUAL_VISITED_LIMIT = 20000;

  const startNearest = nearestNode(graph, body.start);
  const goalNearest = nearestNode(graph, body.goal);

  if (!startNearest || !goalNearest) {
    return NextResponse.json({ error: 'Graph is empty or coordinates are invalid.' }, { status: 500 });
  }

  const t0 = performance.now();
  const runAlgorithm = (g: Graph) =>
    algorithm === 'bfs'
      ? bfs(g, startNearest.id, goalNearest.id, { recordEvery, frontierSample })
      : algorithm === 'dijkstra'
        ? dijkstra(g, startNearest.id, goalNearest.id, { recordEvery, frontierSample })
        : astar(g, startNearest.id, goalNearest.id, { recordEvery, frontierSample });

  let result = runAlgorithm(graph);
  let fallbackUsed = false;

  if (!result.path.length) {
    const undirectedAdj: Graph['adjacency'] = {};
    const addEdge = (from: string, to: string, weight: number) => {
      if (!undirectedAdj[from]) undirectedAdj[from] = [];
      if (!undirectedAdj[from].some((n) => n.id === to)) {
        undirectedAdj[from].push({ id: to, weight });
      }
    };
    Object.entries(graph.adjacency).forEach(([from, neighbors]) => {
      neighbors.forEach(({ id: to, weight }) => {
        addEdge(from, to, weight);
        addEdge(to, from, weight);
      });
    });
    const undirectedGraph: Graph = { ...graph, adjacency: undirectedAdj };
    const fallbackResult = runAlgorithm(undirectedGraph);
    if (fallbackResult.path.length) {
      result = fallbackResult;
      fallbackUsed = true;
    }
  }
  const t1 = performance.now();

  if (!result.path.length) {
    return NextResponse.json(
      { error: 'No path found between selected points.' },
      { status: 404 }
    );
  }

  const truncatedVisitedOrder = result.visitedOrder.slice(0, VISUAL_VISITED_LIMIT);
  const truncatedPathIds = result.path.slice(0, MAX_PATH_POINTS);
  const truncatedSteps = result.steps.slice(0, MAX_STEPS).map((step) => ({
    ...step,
    frontier: step.frontier.slice(0, frontierSample)
  }));

  const prioritizedIds: string[] = [
    ...truncatedPathIds,
    ...truncatedVisitedOrder,
    ...truncatedSteps.flatMap((step) => [step.current, ...step.frontier, ...(step.expanded ?? [])]),
    startNearest.id,
    goalNearest.id
  ];

  const uniqueIds: string[] = [];
  const seenIds = new Set<string>();
  for (const id of prioritizedIds) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueIds.push(id);
    if (uniqueIds.length >= MAX_STEP_NODES) break;
  }

  const stepNodes = uniqueIds
    .map((id) => graph.nodes[id])
    .filter(Boolean)
    .map((node) => ({ id: node.id, lat: node.lat, lon: node.lon }));

  const response: RouteResponse = {
    path: truncatedPathIds.map((id) => {
      const node = graph.nodes[id];
      return { lat: node.lat, lon: node.lon };
    }),
    nodePath: truncatedPathIds,
    steps: truncatedSteps,
    distance: result.distance,
    visited: result.visitedOrder.length,
    elapsedMs: Math.round(t1 - t0),
    start: body.start,
    goal: body.goal,
    startNode: startNearest.id,
    goalNode: goalNearest.id,
    stepNodes,
    bbox: graph.bbox,
    visitedOrder: truncatedVisitedOrder,
    fallbackUsed
  };

  return NextResponse.json(response);
}
