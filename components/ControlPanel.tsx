import { Coordinate } from '@/lib/graph/types';

type AlgorithmName = 'bfs' | 'dijkstra' | 'astar';

type ControlPanelProps = {
  algorithm: AlgorithmName;
  mode: 'start' | 'goal';
  onAlgorithmChange: (algo: AlgorithmName) => void;
  onModeChange: (mode: 'start' | 'goal') => void;
  onRun: () => void;
  onStep: () => void;
  onPlayToggle: () => void;
  onReset: () => void;
  isPlaying: boolean;
  canRun: boolean;
  disableStep: boolean;
  loading: boolean;
  start: Coordinate | null;
  goal: Coordinate | null;
};

const algorithms: { key: AlgorithmName; label: string; hint: string }[] = [
  { key: 'bfs', label: 'BFS', hint: 'Unweighted / fastest breadth-first' },
  { key: 'dijkstra', label: 'Dijkstra', hint: 'Weighted shortest-path' },
  { key: 'astar', label: 'A*', hint: 'Heuristic + distance' }
];

export default function ControlPanel({
  algorithm,
  mode,
  onAlgorithmChange,
  onModeChange,
  onRun,
  onStep,
  onPlayToggle,
  onReset,
  isPlaying,
  canRun,
  disableStep,
  loading,
  start,
  goal
}: ControlPanelProps) {
  return (
    <div className="panel" style={{ minWidth: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.02em' }}>Algorithm</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Path search</div>
        </div>
        <button className="btn" onClick={onReset}>Reset</button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {algorithms.map((algo) => (
          <button
            key={algo.key}
            onClick={() => onAlgorithmChange(algo.key)}
            className="pill"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              background: algorithm === algo.key ? 'rgba(65, 214, 195, 0.08)' : undefined,
              borderColor: algorithm === algo.key ? 'var(--accent)' : 'var(--stroke)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700 }}>{algo.label}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{algo.hint}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        <button
          className="btn"
          style={{
            background: mode === 'start' ? 'rgba(65,214,195,0.2)' : 'var(--stroke)'
          }}
          onClick={() => onModeChange('start')}
        >
          Start mode
        </button>
        <button
          className="btn"
          style={{
            background: mode === 'goal' ? 'rgba(65,214,195,0.2)' : 'var(--stroke)'
          }}
          onClick={() => onModeChange('goal')}
        >
          Goal mode
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button className="btn" onClick={onRun} disabled={!canRun || loading}>
          {loading ? 'Running...' : 'Run'}
        </button>
        <button className="btn" onClick={onStep} disabled={disableStep}>
          Step
        </button>
        <button className="btn" onClick={onPlayToggle} disabled={disableStep}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="pill" style={{ display: 'grid', gap: 6, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Start</span>
          <span style={{ color: 'var(--muted)' }}>
            {start ? `${start.lat.toFixed(5)}, ${start.lon.toFixed(5)}` : 'Pick on map'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Goal</span>
          <span style={{ color: 'var(--muted)' }}>
            {goal ? `${goal.lat.toFixed(5)}, ${goal.lon.toFixed(5)}` : 'Pick on map'}
          </span>
        </div>
      </div>
    </div>
  );
}
