/**
 * Mini-Map Component
 * 2D overhead view of the virtual world
 */

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldLayout } from './WorldLayoutManager';

export interface MiniMapConfig {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number; // Size in pixels
  zoom?: number; // Zoom level
  showZones?: boolean;
  showBuildings?: boolean;
  showAvatars?: boolean;
  showWaypoints?: boolean;
  showPaths?: boolean;
  currentPosition?: [number, number, number];
  followCamera?: boolean;
}

interface MiniMapProps {
  config?: MiniMapConfig;
  worldSize: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  config = {},
  worldSize
}) => {
  const {
    enabled = true,
    position = 'top-right',
    size = 200,
    zoom = 1,
    showZones = true,
    showBuildings = true,
    showAvatars = true,
    showWaypoints = true,
    showPaths = true,
    currentPosition,
    followCamera = false
  } = config;

  const { layout } = useWorldLayout();
  const { camera: mainCamera } = useThree();
  const minimapCameraRef = useRef<THREE.OrthographicCamera>(null);

  // Calculate minimap camera position
  const minimapPosition = useMemo(() => {
    if (followCamera && currentPosition) {
      return [currentPosition[0], 50, currentPosition[2]] as [number, number, number];
    }
    return [0, 50, 0] as [number, number, number];
  }, [followCamera, currentPosition]);

  // Update minimap camera
  useFrame(() => {
    if (minimapCameraRef.current && followCamera && currentPosition) {
      minimapCameraRef.current.position.set(
        currentPosition[0],
        50,
        currentPosition[2]
      );
      minimapCameraRef.current.lookAt(currentPosition[0], 0, currentPosition[2]);
    }
  });

  if (!enabled) {
    return null;
  }

  const viewSize = worldSize / zoom;

  return (
    <group>
      {/* Mini-map camera */}
      <OrthographicCamera
        ref={minimapCameraRef}
        makeDefault={false}
        position={minimapPosition}
        left={-viewSize / 2}
        right={viewSize / 2}
        top={viewSize / 2}
        bottom={-viewSize / 2}
        near={0.1}
        far={100}
      />

      {/* Mini-map content */}
      <MiniMapContent
        layout={layout}
        showZones={showZones}
        showBuildings={showBuildings}
        showAvatars={showAvatars}
        showWaypoints={showWaypoints}
        showPaths={showPaths}
        currentPosition={currentPosition}
      />
    </group>
  );
};

// Mini-map content renderer
const MiniMapContent: React.FC<{
  layout: any;
  showZones: boolean;
  showBuildings: boolean;
  showAvatars: boolean;
  showWaypoints: boolean;
  showPaths: boolean;
  currentPosition?: [number, number, number];
}> = ({
  layout,
  showZones,
  showBuildings,
  showAvatars,
  showWaypoints,
  showPaths,
  currentPosition
}) => {
  return (
    <>
      {/* Zones */}
      {showZones && layout.zones.map((zone: any) => (
        <MiniMapZone key={zone.id} zone={zone} />
      ))}

      {/* Buildings */}
      {showBuildings && layout.buildings.map((building: any) => (
        <MiniMapBuilding key={building.id} building={building} />
      ))}

      {/* Paths */}
      {showPaths && layout.paths.map((path: any) => (
        <MiniMapPath key={path.id} path={path} />
      ))}

      {/* Waypoints */}
      {showWaypoints && layout.landmarks.map((landmark: any) => (
        <MiniMapWaypoint key={landmark.id} waypoint={landmark} />
      ))}

      {/* Current position marker */}
      {currentPosition && (
        <MiniMapPositionMarker position={currentPosition} />
      )}
    </>
  );
};

// Mini-map zone
const MiniMapZone: React.FC<{ zone: any }> = ({ zone }) => {
  const { min, max } = zone.bounds;
  const width = max[0] - min[0];
  const depth = max[2] - min[2];
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    0.1,
    (min[2] + max[2]) / 2
  ];

  return (
    <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={zone.color} transparent opacity={0.3} />
    </mesh>
  );
};

// Mini-map building
const MiniMapBuilding: React.FC<{ building: any }> = ({ building }) => {
  const [width, height, depth] = building.size;

  return (
    <mesh position={[building.position[0], 0.2, building.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color="#4a5568" />
    </mesh>
  );
};

// Mini-map path
const MiniMapPath: React.FC<{ path: any }> = ({ path }) => {
  const points = useMemo(() => [
    [path.from[0], 0.1, path.from[2]],
    [path.to[0], 0.1, path.to[2]]
  ] as [number, number, number][], [path.from, path.to]);

  return (
    <Line
      points={points}
      color="#6b7280"
      lineWidth={2}
    />
  );
};

// Mini-map waypoint
const MiniMapWaypoint: React.FC<{ waypoint: any }> = ({ waypoint }) => {
  const color = {
    spawn: '#10b981',
    portal: '#6366f1',
    landmark: '#f59e0b'
  }[waypoint.type || 'landmark'] || '#6366f1';

  return (
    <mesh position={[waypoint.position[0], 0.3, waypoint.position[2]]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

// Mini-map position marker
const MiniMapPositionMarker: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={[position[0], 0.4, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
};
