/**
 * Enhanced Navigation System V2
 * Enhanced waypoints, path following, teleportation with visual effects
 */

import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { Waypoint, NavigationConfig } from './VirtualWorldNavigation';
import { useWorldLayout } from './WorldLayoutManager';
import { pathService } from '../../services/path-service';

export interface EnhancedNavigationConfig extends NavigationConfig {
  // Enhanced waypoints
  waypointLabels?: boolean;
  waypointIcons?: boolean;
  // Enhanced teleportation
  teleportEffect?: 'fade' | 'portal' | 'particles';
  teleportDuration?: number;
  // Enhanced path following
  pathFollowingVisualization?: boolean;
  pathFollowingSmoothing?: number;
  // Service integration
  enableServiceSync?: boolean;
}

interface EnhancedNavigationProps {
  config?: EnhancedNavigationConfig;
  onWaypointReached?: (waypoint: Waypoint) => void;
  onTeleport?: (position: [number, number, number]) => void;
}

export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  config = {},
  onWaypointReached,
  onTeleport
}) => {
  const { layout } = useWorldLayout();
  const {
    waypoints = [],
    showWaypoints = true,
    enableTeleportation = true,
    waypointLabels = true,
    waypointIcons = true,
    teleportEffect = 'fade',
    teleportDuration = 1,
    pathFollowingVisualization = true,
    pathFollowingSmoothing = 0.1,
    enableServiceSync = true
  } = config;

  const [teleporting, setTeleporting] = useState<{
    position: [number, number, number];
    progress: number;
  } | null>(null);

  // Combine layout landmarks with custom waypoints
  const allWaypoints = useMemo(() => {
    const layoutWaypoints: Waypoint[] = layout.landmarks.map(landmark => ({
      id: landmark.id,
      name: landmark.name,
      position: landmark.position,
      type: landmark.type,
      zoneId: landmark.zoneId
    }));
    return [...layoutWaypoints, ...waypoints];
  }, [layout.landmarks, waypoints]);

  // Teleportation effect
  useFrame((state, delta) => {
    if (teleporting) {
      const newProgress = Math.min(teleporting.progress + delta / teleportDuration, 1);
      setTeleporting({ ...teleporting, progress: newProgress });

      if (newProgress >= 1) {
        onTeleport?.(teleporting.position);
        setTeleporting(null);
      }
    }
  });

  const handleWaypointClick = (waypoint: Waypoint) => {
    if (enableTeleportation) {
      setTeleporting({
        position: waypoint.position,
        progress: 0
      });
    }
    onWaypointReached?.(waypoint);
  };

  return (
    <>
      {/* Waypoints */}
      {showWaypoints && allWaypoints.map(waypoint => (
        <EnhancedWaypointMarker
          key={waypoint.id}
          waypoint={waypoint}
          showLabel={waypointLabels}
          showIcon={waypointIcons}
          onClick={() => handleWaypointClick(waypoint)}
        />
      ))}

      {/* Teleportation effect */}
      {teleporting && (
        <TeleportEffect
          position={teleporting.position}
          progress={teleporting.progress}
          effect={teleportEffect}
        />
      )}

      {/* Path following visualization */}
      {pathFollowingVisualization && enableServiceSync && (
        <PathFollowingVisualization smoothing={pathFollowingSmoothing} />
      )}
    </>
  );
};

// Enhanced waypoint marker
const EnhancedWaypointMarker: React.FC<{
  waypoint: Waypoint;
  showLabel: boolean;
  showIcon: boolean;
  onClick: () => void;
}> = ({ waypoint, showLabel, showIcon, onClick }) => {
  const markerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.y = waypoint.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3 + 1;
      markerRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  const color = {
    spawn: '#10b981',
    portal: '#6366f1',
    landmark: '#f59e0b'
  }[waypoint.type || 'landmark'] || '#6366f1';

  const icon = {
    spawn: '📍',
    portal: '🌀',
    landmark: '🏛️'
  }[waypoint.type || 'landmark'] || '📍';

  return (
    <group
      ref={markerRef}
      position={waypoint.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
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
      <Ring args={[0.6, 0.7, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Icon */}
      {showIcon && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
        >
          {icon}
        </Text>
      )}

      {/* Label */}
      {showLabel && (
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
      )}

      {/* Hover indicator */}
      {hovered && (
        <Ring args={[0.8, 0.9, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </Ring>
      )}
    </group>
  );
};

// Teleportation effect
const TeleportEffect: React.FC<{
  position: [number, number, number];
  progress: number;
  effect: 'fade' | 'portal' | 'particles';
}> = ({ position, progress, effect }) => {
  if (effect === 'portal') {
    return (
      <group position={position}>
        {/* Portal ring */}
        <Ring args={[1, 1.5, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            color="#6366f1"
            transparent
            opacity={progress}
            side={THREE.DoubleSide}
          />
        </Ring>
        {/* Portal particles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 1 + progress * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                progress * 3,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#6366f1" transparent opacity={1 - progress} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (effect === 'particles') {
    return (
      <group position={position}>
        {Array.from({ length: 50 }).map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 2;
          const height = Math.random() * 3;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius * progress,
                height * progress,
                Math.sin(angle) * radius * progress
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#8b5cf6" transparent opacity={1 - progress} />
            </mesh>
          );
        })}
      </group>
    );
  }

  // Fade effect (handled by UI overlay)
  return null;
};

// Path following visualization
const PathFollowingVisualization: React.FC<{
  smoothing: number;
}> = ({ smoothing }) => {
  // This would visualize active path followers
  // Implementation would query pathService for active followers
  return null;
};
