'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  ScaleControl,
  TileLayer,
  useMapEvents,
  ZoomControl
} from 'react-leaflet';
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet';
import { AlgorithmStep, Coordinate } from '@/lib/graph/types';

type MapViewProps = {
  start: Coordinate | null;
  goal: Coordinate | null;
  mode: 'start' | 'goal';
  path: Coordinate[];
  steps: AlgorithmStep[];
  stepIndex: number;
  bboxCenter: Coordinate;
  onMapClick: (coord: Coordinate) => void;
  stepNodes: Array<{ id: string; lat: number; lon: number }>;
  visitedOrder: string[];
};

export default function MapView({
  start,
  goal,
  mode,
  path,
  steps,
  stepIndex,
  bboxCenter,
  onMapClick,
  stepNodes,
  visitedOrder
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [mapKey] = useState(() => `map-${Date.now()}`);
  const mapId = useMemo(() => `leaflet-map-${mapKey}`, [mapKey]);
  const mapRef = useRef<LeafletMap | null>(null);
  const activeStep = steps[stepIndex];

  const visitedIds = useMemo(() => {
    const count = activeStep?.visitedCount ?? activeStep?.visited?.length ?? 0;
    return new Set(visitedOrder.slice(0, count));
  }, [activeStep, visitedOrder]);
  const frontierIds = useMemo(() => new Set(activeStep?.frontier ?? []), [activeStep]);

  const visitedPoints = useMemo(
    () =>
      stepNodes
        .filter((node) => visitedIds.has(node.id))
        .map((node) => [node.lat, node.lon] as [number, number]),
    [stepNodes, visitedIds]
  );

  const frontierPoints = useMemo(
    () =>
      stepNodes
        .filter((node) => frontierIds.has(node.id))
        .map((node) => [node.lat, node.lon] as [number, number]),
    [stepNodes, frontierIds]
  );

  const routeLine = useMemo(
    () => path.map((point) => [point.lat, point.lon] as [number, number]),
    [path]
  );

  const showFinalPath = routeLine.length > 1 && stepIndex >= steps.length - 1;

  const nodeMap = useMemo(() => {
    const map = new Map<string, { lat: number; lon: number }>();
    stepNodes.forEach((n) => map.set(n.id, { lat: n.lat, lon: n.lon }));
    return map;
  }, [stepNodes]);

  const exploredLines = useMemo(() => {
    const lines: [number, number][][] = [];
    steps.slice(0, stepIndex + 1).forEach((step) => {
      (step.expanded ?? []).forEach((neighborId) => {
        const from = nodeMap.get(step.current);
        const to = nodeMap.get(neighborId);
        if (from && to) {
          lines.push([
            [from.lat, from.lon],
            [to.lat, to.lon]
          ]);
        }
      });
    });
    return lines;
  }, [nodeMap, stepIndex, steps]);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (mapRef.current) {
        mapRef.current.remove();
        const container = mapRef.current.getContainer?.();
        if (container) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (container as any)._leaflet_id;
        }
        mapRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(mapId);
    if (container && (container as unknown as { _leaflet_id?: string })._leaflet_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (container as any)._leaflet_id;
    }
  }, [mapId]);

  if (!mounted) {
    return null;
  }

  const ClickCatcher = () => {
    useMapEvents({
      click: (event: LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        onMapClick({ lat, lon: lng });
      }
    });
    return null;
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        key={mapKey}
        id={mapId}
        center={[bboxCenter.lat, bboxCenter.lon]}
        zoom={15}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas
        ref={mapRef}
      >
        <ClickCatcher />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap © CartoDB"
        />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />

        {exploredLines.map((segment, idx) => (
          <Polyline
            key={`explored-${idx.toString()}`}
            positions={segment}
            pathOptions={{ color: '#2f6bff', weight: 3, opacity: 0.7 }}
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

        {showFinalPath && (
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
