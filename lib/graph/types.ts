export type Coordinate = {
  lat: number;
  lon: number;
};

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type GraphNode = Coordinate & {
  id: string;
};

export type Edge = {
  from: string;
  to: string;
  weight?: number;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: Edge[];
  bbox?: BoundingBox;
};

export type Graph = {
  nodes: Record<string, GraphNode>;
  adjacency: Record<string, Array<{ id: string; weight: number }>>;
  bbox?: BoundingBox;
};

export type AlgorithmStep = {
  current: string;
  visited?: string[];
  frontier: string[];
  visitedCount?: number;
  expanded?: string[];
};

export type PathResult = {
  path: string[];
  steps: AlgorithmStep[];
  visitedOrder: string[];
  distance: number;
};

export type RouteResponse = {
  path: Coordinate[];
  nodePath: string[];
  steps: AlgorithmStep[];
  distance: number;
  visited: number;
  elapsedMs: number;
  start: Coordinate;
  goal: Coordinate;
  startNode: string;
  goalNode: string;
  stepNodes: Array<{ id: string; lat: number; lon: number }>;
  bbox?: BoundingBox;
  visitedOrder: string[];
  truncated?: boolean;
  fallbackUsed?: boolean;
};
