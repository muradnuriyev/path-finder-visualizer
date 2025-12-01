'use client';

import { useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  ScaleControl,
  TileLayer,
  ZoomControl
} from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { AlgorithmStep, Coordinate, GraphData } from '@/lib/graph/types';

type MapViewProps = {
  graph: GraphData;
  start: Coordinate | null;
  goal: Coordinate | null;
  mode: 'start' | 'goal';
  path: Coordinate[];
  steps: AlgorithmStep[];
  stepIndex: number;
  bboxCenter: Coordinate;
  onMapClick: (coord: Coordinate) => void;
};

export default function MapView({
  graph,
  start,
  goal,
  mode,
  path,
  steps,
  stepIndex,
  bboxCenter,
  onMapClick
}: MapViewProps) {
  const activeStep = steps[stepIndex];

  const visitedIds = useMemo(() => new Set(activeStep?.visited ?? []), [activeStep]);
  const frontierIds = useMemo(() => new Set(activeStep?.frontier ?? []), [activeStep]);

  const visitedPoints = useMemo(
    () =>
      graph.nodes
        .filter((node) => visitedIds.has(node.id))
        .map((node) => [node.lat, node.lon] as [number, number]),
    [graph.nodes, visitedIds]
  );

  const frontierPoints = useMemo(
    () =>
      graph.nodes
        .filter((node) => frontierIds.has(node.id))
        .map((node) => [node.lat, node.lon] as [number, number]),
    [graph.nodes, frontierIds]
  );

  const graphSegments = useMemo(() => {
    const nodeIndex = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
    return graph.edges
      .map((edge) => {
        const from = nodeIndex[edge.from];
        const to = nodeIndex[edge.to];
        if (!from || !to) {
          return null;
        }
        return [
          [from.lat, from.lon],
          [to.lat, to.lon]
        ] as [number, number][];
      })
      .filter(Boolean) as [number, number][][];
  }, [graph.edges, graph.nodes]);

  const routeLine = useMemo(
    () => path.map((point) => [point.lat, point.lon] as [number, number]),
    [path]
  );

  const handleClick = (event: LeafletMouseEvent) => {
    const { lat, lng } = event.latlng;
    onMapClick({ lat, lon: lng });
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[bboxCenter.lat, bboxCenter.lon]}
        zoom={15}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas
        onClick={handleClick}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap © CartoDB"
        />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />

        {graphSegments.map((segment, index) => (
          <Polyline
            key={`road-${index.toString()}`}
            positions={segment}
            pathOptions={{ color: '#223a63', weight: 3, opacity: 0.45 }}
          />
        ))}

        {visitedPoints.map((pos, idx) => (
          <CircleMarker
            key={`visited-${idx.toString()}`}
            center={pos}
            radius={5}
            pathOptions={{ color: '#72c9ff', fillColor: '#72c9ff', fillOpacity: 0.6 }}
          />
        ))}

        {frontierPoints.map((pos, idx) => (
          <CircleMarker
            key={`frontier-${idx.toString()}`}
            center={pos}
            radius={5}
            pathOptions={{ color: '#ffb347', fillColor: '#ffb347', fillOpacity: 0.75 }}
          />
        ))}

        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#41d6c3', weight: 6, opacity: 0.95 }}
          />
        )}

        {start && (
          <CircleMarker
            center={[start.lat, start.lon]}
            radius={8}
            pathOptions={{ color: '#41d6c3', fillColor: '#41d6c3', fillOpacity: 0.9, weight: 2 }}
          />
        )}

        {goal && (
          <CircleMarker
            center={[goal.lat, goal.lon]}
            radius={8}
            pathOptions={{ color: '#ff7a8a', fillColor: '#ff7a8a', fillOpacity: 0.9, weight: 2 }}
          />
        )}
      </MapContainer>
      <div className="pill" style={{ position: 'absolute', top: 16, right: 16, zIndex: 600 }}>
        Click mode: <strong>{mode === 'start' ? 'Set start' : 'Set goal'}</strong>
      </div>
    </div>
  );
}
