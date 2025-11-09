/**
 * Virtual World Navigation Component
 * Waypoint system, path following, and teleportation
 */

import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldLayout } from './WorldLayoutManager';

export interface Waypoint {
  id: string;
  name: string;
  position: [number, number, number];
  type?: 'spawn' | 'portal' | 'landmark' | 'monument' | 'sign';
  zoneId?: string;
}

export interface NavigationConfig {
  waypoints?: Waypoint[];
  showWaypoints?: boolean;
  enableTeleportation?: boolean;
  pathFollowingSpeed?: number;
}

interface VirtualWorldNavigationProps {
  config?: NavigationConfig;
  onWaypointReached?: (waypoint: Waypoint) => void;
}

export const VirtualWorldNavigation: React.FC<VirtualWorldNavigationProps> = ({
  config = {},
  onWaypointReached
}) => {
  const { layout } = useWorldLayout();
  const {
    waypoints = [],
    showWaypoints = true,
    enableTeleportation = true,
    pathFollowingSpeed = 5
  } = config;

  // Combine layout landmarks with custom waypoints
  const allWaypoints = useMemo(() => {
    const layoutWaypoints: Waypoint[] = layout.landmarks.map(landmark => ({
      id: landmark.id,
      name: landmark.name,
      position: landmark.position,
      // Convert 'monument' and 'sign' to 'landmark' for Waypoint compatibility
      type: (landmark.type === 'monument' || landmark.type === 'sign') ? 'landmark' : landmark.type,
      zoneId: landmark.zoneId
    }));
    return [...layoutWaypoints, ...waypoints];
  }, [layout.landmarks, waypoints]);

  return (
    <>
      {showWaypoints && allWaypoints.map(waypoint => (
        <WaypointMarker
          key={waypoint.id}
          waypoint={waypoint}
          onReached={onWaypointReached}
        />
      ))}
    </>
  );
};

// Waypoint marker component
const WaypointMarker: React.FC<{
  waypoint: Waypoint;
  onReached?: (waypoint: Waypoint) => void;
}> = ({ waypoint, onReached }) => {
  const markerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (markerRef.current) {
      // Floating animation
      markerRef.current.position.y = waypoint.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3 + 1;
      markerRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  const color = {
    spawn: '#10b981',
    portal: '#6366f1',
    landmark: '#f59e0b'
  }[waypoint.type || 'landmark'] || '#6366f1';

  return (
    <group
      ref={markerRef}
      position={waypoint.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Marker sphere */}
      <Sphere args={[0.5, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Pulsing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.7, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {waypoint.name}
      </Text>
    </group>
  );
};

// Path following helper
export const usePathFollowing = (
  start: [number, number, number],
  end: [number, number, number],
  speed: number = 5
) => {
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(start);
  const [isMoving, setIsMoving] = useState(false);
  const [progress, setProgress] = useState(0);

  const startFollowing = () => {
    setIsMoving(true);
    setProgress(0);
  };

  useFrame((state, delta) => {
    if (!isMoving) return;

    const newProgress = Math.min(progress + (speed * delta) / 
      new THREE.Vector3(...start).distanceTo(new THREE.Vector3(...end)), 1);
    
    setProgress(newProgress);

    // Interpolate position
    const newPosition: [number, number, number] = [
      start[0] + (end[0] - start[0]) * newProgress,
      start[1] + (end[1] - start[1]) * newProgress,
      start[2] + (end[2] - start[2]) * newProgress
    ];

    setCurrentPosition(newPosition);

    if (newProgress >= 1) {
      setIsMoving(false);
    }
  });

  return { currentPosition, isMoving, progress, startFollowing };
};

// Teleportation helper
export const useTeleportation = (
  onTeleport?: (position: [number, number, number]) => void
) => {
  const teleport = (position: [number, number, number]) => {
    if (onTeleport) {
      onTeleport(position);
    }
  };

  return { teleport };
};

// Mini-map component (placeholder - would need 2D rendering)
export const MiniMap: React.FC<{
  worldSize: number;
  currentPosition?: [number, number, number];
  waypoints?: Waypoint[];
}> = ({ worldSize, currentPosition, waypoints = [] }) => {
  // Mini-map would be rendered as a 2D overlay
  // This is a placeholder for the concept
  return null;
};
