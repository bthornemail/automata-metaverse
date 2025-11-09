/**
 * Path Navigation Component
 * Enhanced paths with curves, path following, and navigation
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PathConfig } from './VirtualWorldPaths';

export interface CurvedPathConfig extends PathConfig {
  controlPoints?: [number, number, number][]; // For bezier curves
  curveType?: 'linear' | 'bezier' | 'spline';
  showLabels?: boolean;
  label?: string;
}

export interface PathFollower {
  id: string;
  pathId: string;
  progress: number; // 0 to 1
  speed: number; // Units per second
  direction: 'forward' | 'backward';
}

interface PathNavigationProps {
  paths: CurvedPathConfig[];
  followers?: PathFollower[];
  showLabels?: boolean;
}

export const PathNavigation: React.FC<PathNavigationProps> = ({
  paths,
  followers = [],
  showLabels = true
}) => {
  return (
    <>
      {paths.map(path => (
        <CurvedPathRenderer
          key={path.id}
          path={path}
          showLabels={showLabels}
        />
      ))}
      {followers.map(follower => (
        <PathFollowerComponent
          key={follower.id}
          follower={follower}
          path={paths.find(p => p.id === follower.pathId)}
        />
      ))}
    </>
  );
};

// Curved path renderer
const CurvedPathRenderer: React.FC<{
  path: CurvedPathConfig;
  showLabels: boolean;
}> = ({ path, showLabels }) => {
  const {
    from,
    to,
    controlPoints = [],
    curveType = 'linear',
    width = 3,
    type = 'path',
    color,
    showMarkers = true,
    label
  } = path;

  // Generate curve points
  const curvePoints = useMemo(() => {
    if (curveType === 'bezier' && controlPoints.length >= 2) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...from),
        new THREE.Vector3(...controlPoints[0]),
        new THREE.Vector3(...to)
      );
      return curve.getPoints(50);
    } else if (curveType === 'spline' && controlPoints.length >= 1) {
      const points = [from, ...controlPoints, to].map(p => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(points);
      return curve.getPoints(50);
    } else {
      // Linear path
      return [new THREE.Vector3(...from), new THREE.Vector3(...to)];
    }
  }, [from, to, controlPoints, curveType]);

  const pathColor = {
    road: '#4a5568',
    path: '#6b7280',
    bridge: '#3b82f6'
  }[type] || color || '#6b7280';

  // Calculate path length
  const pathLength = useMemo(() => {
    let length = 0;
    for (let i = 0; i < curvePoints.length - 1; i++) {
      length += curvePoints[i].distanceTo(curvePoints[i + 1]);
    }
    return length;
  }, [curvePoints]);

  return (
    <group>
      {/* Path line */}
      <Line
        points={curvePoints.map(p => [p.x, p.y, p.z] as [number, number, number])}
        color={pathColor}
        lineWidth={width}
        dashed={type === 'bridge'}
      />

      {/* Path surface */}
      {curvePoints.length > 2 ? (
        <CurvedPathSurface
          points={curvePoints}
          width={width}
          color={pathColor}
        />
      ) : (
        // Linear path surface
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
          <planeGeometry args={[width, pathLength]} />
          <meshStandardMaterial color={pathColor} roughness={0.8} metalness={0.1} />
        </mesh>
      )}

      {/* Path markers */}
      {showMarkers && (
        <>
          <PathMarker position={from} type={type} />
          <PathMarker position={to} type={type} />
        </>
      )}

      {/* Path label */}
      {showLabels && label && (
        <Text
          position={[
            (from[0] + to[0]) / 2,
            from[1] + 0.5,
            (from[2] + to[2]) / 2
          ]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// Curved path surface
const CurvedPathSurface: React.FC<{
  points: THREE.Vector3[];
  width: number;
  color: string;
}> = ({ points, width, color }) => {
  // Create surface along curve
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const halfWidth = width / 2;

    // Create path segments
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);

      if (i === 0) {
        const start = new THREE.Vector3().addVectors(p1, perp.multiplyScalar(halfWidth));
        shape.moveTo(start.x, start.z);
      }

      const end = new THREE.Vector3().addVectors(p2, perp.multiplyScalar(halfWidth));
      shape.lineTo(end.x, end.z);
    }

    // Close the shape
    for (let i = points.length - 1; i > 0; i--) {
      const p1 = points[i];
      const p2 = points[i - 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const end = new THREE.Vector3().addVectors(p1, perp.multiplyScalar(-halfWidth));
      shape.lineTo(end.x, end.z);
    }

    return new THREE.ShapeGeometry(shape);
  }, [points, width]);

  return (
    <mesh
      position={[0, 0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
    </mesh>
  );
};

// Path marker (same as before but enhanced)
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

// Path follower component
const PathFollowerComponent: React.FC<{
  follower: PathFollower;
  path?: CurvedPathConfig;
}> = ({ follower, path }) => {
  const followerRef = useRef<THREE.Group>(null);

  if (!path) return null;

  // Calculate position along path
  const position = useMemo(() => {
    const { from, to, controlPoints = [], curveType = 'linear' } = path;
    
    if (curveType === 'bezier' && controlPoints.length >= 1) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...from),
        new THREE.Vector3(...controlPoints[0]),
        new THREE.Vector3(...to)
      );
      return curve.getPointAt(follower.progress);
    } else if (curveType === 'spline' && controlPoints.length >= 1) {
      const points = [from, ...controlPoints, to].map(p => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(points);
      return curve.getPointAt(follower.progress);
    } else {
      // Linear interpolation
      return new THREE.Vector3(
        from[0] + (to[0] - from[0]) * follower.progress,
        from[1] + (to[1] - from[1]) * follower.progress,
        from[2] + (to[2] - from[2]) * follower.progress
      );
    }
  }, [path, follower.progress]);

  // Calculate rotation along path
  const rotation = useMemo(() => {
    const { from, to, controlPoints = [], curveType = 'linear' } = path;
    const t = Math.min(follower.progress + 0.01, 1);
    
    let nextPos: THREE.Vector3;
    if (curveType === 'bezier' && controlPoints.length >= 1) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...from),
        new THREE.Vector3(...controlPoints[0]),
        new THREE.Vector3(...to)
      );
      nextPos = curve.getPointAt(t);
    } else {
      nextPos = new THREE.Vector3(
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t
      );
    }

    const direction = new THREE.Vector3().subVectors(nextPos, position).normalize();
    return Math.atan2(direction.x, direction.z);
  }, [path, follower.progress, position]);

  useFrame(() => {
    if (followerRef.current) {
      followerRef.current.position.copy(position);
      followerRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={followerRef}>
      {/* Follower marker */}
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};
