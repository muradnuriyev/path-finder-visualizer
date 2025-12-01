'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import StatsPanel from '@/components/StatsPanel';
import { AlgorithmStep, Coordinate, RouteResponse } from '@/lib/graph/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type AlgorithmName = 'bfs' | 'dijkstra' | 'astar';

const fallbackCenter: Coordinate = { lat: 40.4093, lon: 49.8671 };

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
  const [stepNodes, setStepNodes] = useState<Array<{ id: string; lat: number; lon: number }>>([]);
  const [bboxCenter, setBboxCenter] = useState<Coordinate>(fallbackCenter);
  const [visitedOrder, setVisitedOrder] = useState<string[]>([]);

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
    }, 1200);

    return () => clearInterval(id);
  }, [playing, steps.length]);

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
      setStepNodes(data.stepNodes ?? []);
      setVisitedOrder(data.visitedOrder ?? []);
      if (data.truncated) {
        setError('Result was truncated for visualization due to size; path/steps partially shown.');
      }
      if (data.bbox) {
        setBboxCenter({
          lat: (data.bbox.minLat + data.bbox.maxLat) / 2,
          lon: (data.bbox.minLon + data.bbox.maxLon) / 2
        });
      }
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
    setStepNodes([]);
    setVisitedOrder([]);
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
        start={start}
        goal={goal}
        mode={mode}
        path={path}
        steps={steps}
        stepIndex={stepIndex}
        bboxCenter={bboxCenter}
        onMapClick={handleMapClick}
        stepNodes={stepNodes}
        visitedOrder={visitedOrder}
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
