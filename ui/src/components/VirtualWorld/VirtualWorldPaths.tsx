/**
 * Virtual World Paths Component
 * Generates roads, paths, and walkways connecting zones
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Path } from './WorldLayoutManager';

export interface PathConfig extends Path {
  color?: string;
  showMarkers?: boolean;
  animated?: boolean;
}

interface VirtualWorldPathsProps {
  paths: PathConfig[];
  showMarkers?: boolean;
}

export const VirtualWorldPaths: React.FC<VirtualWorldPathsProps> = ({
  paths,
  showMarkers = true
}) => {
  return (
    <>
      {paths.map(path => (
        <PathRenderer key={path.id} path={path} showMarkers={showMarkers} />
      ))}
    </>
  );
};

// Individual path renderer
const PathRenderer: React.FC<{
  path: PathConfig;
  showMarkers: boolean;
}> = ({ path, showMarkers }) => {
  const {
    from,
    to,
    width = 3,
    type = 'path',
    color = type === 'road' ? '#4a5568' : '#6b7280',
    animated = false
  } = path;

  // Generate path geometry
  const pathGeometry = useMemo(() => {
    const points = [from, to];
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...to)
    );
    
    // Create path mesh
    const geometry = new THREE.PlaneGeometry(
      width,
      new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to))
    );
    
    return { curve, geometry, points };
  }, [from, to, width]);

  // Path color based on type
  const pathColor = {
    road: '#4a5568',
    path: '#6b7280',
    bridge: '#3b82f6'
  }[type] || color;

  return (
    <group>
      {/* Path line */}
      <Line
        points={pathGeometry.points}
        color={pathColor}
        lineWidth={width}
        dashed={type === 'bridge'}
      />

      {/* Path surface */}
      <mesh
        position={[
          (from[0] + to[0]) / 2,
          from[1] + 0.01,
          (from[2] + to[2]) / 2
        ]}
        rotation={[
          -Math.PI / 2,
          Math.atan2(to[2] - from[2], to[0] - from[0]),
          0
        ]}
      >
        <planeGeometry args={[width, pathGeometry.curve.getLength()]} />
        <meshStandardMaterial
          color={pathColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Path markers */}
      {showMarkers && (
        <>
          <PathMarker position={from} type={type} />
          <PathMarker position={to} type={type} />
        </>
      )}
    </group>
  );
};

// Path marker component
const PathMarker: React.FC<{
  position: [number, number, number];
  type: string;
}> = ({ position, type }) => {
  const markerColor = {
    road: '#3b82f6',
    path: '#10b981',
    bridge: '#8b5cf6'
  }[type] || '#6366f1';

  return (
    <mesh position={[position[0], position[1] + 0.1, position[2]]}>
      <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
      <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.3} />
    </mesh>
  );
};

// Path group component for rendering all paths from layout
export const PathGroup: React.FC<{
  paths: Path[];
}> = ({ paths }) => {
  return <VirtualWorldPaths paths={paths} />;
};
