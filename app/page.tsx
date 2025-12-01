'use client';

import { useEffect, useMemo, useState } from 'react';
import MapView from '@/components/MapView';
import ControlPanel from '@/components/ControlPanel';
import StatsPanel from '@/components/StatsPanel';
import graphData from '@/data/graph.json';
import { AlgorithmStep, Coordinate, GraphData, RouteResponse } from '@/lib/graph/types';

type AlgorithmName = 'bfs' | 'dijkstra' | 'astar';

const typedGraph = graphData as GraphData;

const defaultCenter: Coordinate = typedGraph.bbox
  ? {
      lat: (typedGraph.bbox.minLat + typedGraph.bbox.maxLat) / 2,
      lon: (typedGraph.bbox.minLon + typedGraph.bbox.maxLon) / 2
    }
  : { lat: 40.374, lon: 49.849 };

export default function HomePage() {
  const [algorithm, setAlgorithm] = useState<AlgorithmName>('astar');
  const [mode, setMode] = useState<'start' | 'goal'>('start');
  const [start, setStart] = useState<Coordinate | null>(null);
  const [goal, setGoal] = useState<Coordinate | null>(null);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ distance: 0, visited: 0, elapsed: 0 });

  const canRun = Boolean(start && goal);
  const disableStep = !steps.length || stepIndex >= steps.length - 1;

  useEffect(() => {
    if (!playing || !steps.length) {
      return;
    }
    const id = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(id);
  }, [playing, steps.length]);

  const bboxCenter = useMemo(() => defaultCenter, []);

  const handleMapClick = (coord: Coordinate) => {
    if (mode === 'start') {
      setStart(coord);
    } else {
      setGoal(coord);
    }
  };

  const handleRun = async () => {
    if (!start || !goal) {
      return;
    }
    setLoading(true);
    setError(null);
    setPlaying(false);
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, goal, algorithm })
      });
      const payload = (await res.json()) as RouteResponse | { error: string };
      if (!res.ok) {
        throw new Error('error' in payload ? payload.error : 'Failed to compute route.');
      }
      const data = payload as RouteResponse;
      setPath(data.path);
      setSteps(data.steps);
      setStepIndex(0);
      setStats({
        distance: data.distance,
        visited: data.visited,
        elapsed: data.elapsedMs
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compute route.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStart(null);
    setGoal(null);
    setPath([]);
    setSteps([]);
    setStepIndex(0);
    setPlaying(false);
    setError(null);
    setStats({ distance: 0, visited: 0, elapsed: 0 });
  };

  const handleStep = () => {
    setStepIndex((prev) => Math.min(prev + 1, Math.max(steps.length - 1, 0)));
  };

  const handlePlayToggle = () => {
    if (!steps.length) {
      return;
    }
    setPlaying((prev) => !prev);
  };

  return (
    <div className="app-shell">
      <MapView
        graph={typedGraph}
        start={start}
        goal={goal}
        mode={mode}
        path={path}
        steps={steps}
        stepIndex={stepIndex}
        bboxCenter={bboxCenter}
        onMapClick={handleMapClick}
      />

      <div className="hud">
        <ControlPanel
          algorithm={algorithm}
          mode={mode}
          onAlgorithmChange={setAlgorithm}
          onModeChange={setMode}
          onRun={handleRun}
          onStep={handleStep}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          isPlaying={playing}
          canRun={canRun}
          disableStep={disableStep}
          loading={loading}
          start={start}
          goal={goal}
        />
        <StatsPanel
          distance={stats.distance}
          visited={stats.visited}
          elapsedMs={stats.elapsed}
          stepsCount={steps.length}
          currentStep={stepIndex}
        />
        {error && (
          <div className="panel error-chip" style={{ color: '#ffdce7', borderColor: '#ff829d' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
