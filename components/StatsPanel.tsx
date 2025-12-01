type StatsPanelProps = {
  distance: number;
  visited: number;
  elapsedMs: number;
  stepsCount: number;
  currentStep: number;
};

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return 'N/A';
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

export default function StatsPanel({
  distance,
  visited,
  elapsedMs,
  stepsCount,
  currentStep
}: StatsPanelProps) {
  return (
    <div className="panel" style={{ minWidth: 260 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Stats</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="stat">
          <div className="stat-label">Path length</div>
          <div className="stat-value">{formatDistance(distance)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Visited nodes</div>
          <div className="stat-value">{visited || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Elapsed</div>
          <div className="stat-value">{elapsedMs ? `${elapsedMs} ms` : 'N/A'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Step</div>
          <div className="stat-value">
            {stepsCount ? `${currentStep + 1} / ${stepsCount}` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
