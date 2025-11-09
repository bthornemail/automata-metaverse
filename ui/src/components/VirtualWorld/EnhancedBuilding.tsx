/**
 * Enhanced Building Component V2
 * Enhanced building with interiors, interactions, and service integration
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingConfig } from './VirtualWorldBuilding';
import { BuildingInterior, BuildingInteriorConfig, InteriorRoom, BuildingDoor } from './BuildingInterior';
import { buildingService, BuildingState } from '../../services/building-service';

export interface EnhancedBuildingConfig extends BuildingConfig {
  // Interior configuration
  interior?: BuildingInteriorConfig;
  // Interaction
  enableInteractions?: boolean;
  enableServiceSync?: boolean;
  // Metadata
  metadata?: {
    capacity?: number;
    purpose?: string;
    level?: number;
    description?: string;
  };
}

interface EnhancedBuildingProps {
  building: EnhancedBuildingConfig;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  onEnter?: (buildingId: string) => void;
  onExit?: (buildingId: string) => void;
}

export const EnhancedBuilding: React.FC<EnhancedBuildingProps> = ({
  building,
  selected = false,
  onClick,
  onHover,
  onEnter,
  onExit
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [buildingState, setBuildingState] = useState<BuildingState | null>(null);
  const [showInterior, setShowInterior] = useState(false);

  const {
    id,
    name,
    position,
    size,
    rotation = 0,
    gltfModel,
    color = '#4a5568',
    emissive = '#000000',
    showLabel = true,
    interactive = true,
    enableInteractions = true,
    enableServiceSync = true,
    interior,
    metadata
  } = building;

  // Building service sync
  useEffect(() => {
    if (!enableServiceSync) return;

    // Register building with service
    if (interior) {
      buildingService.registerBuilding(
        building,
        interior.rooms,
        interior.doors
      );
    }

    // Listen for updates
    const handleUpdate = (updatedBuilding: BuildingState) => {
      if (updatedBuilding.building.id === id) {
        setBuildingState(updatedBuilding);
      }
    };

    buildingService.on('building:update', handleUpdate);

    return () => {
      buildingService.off('building:update', handleUpdate);
    };
  }, [id, enableServiceSync, building, interior]);

  // Load GLTF model if provided
  let gltf: any = null;
  if (gltfModel) {
    try {
      gltf = useGLTF(gltfModel, true);
    } catch (error) {
      console.error('Failed to load building GLTF:', error);
    }
  }

  // Render GLTF or procedural building
  const renderBuilding = () => {
    if (gltf && gltf.scene) {
      const clonedScene = gltf.scene.clone();
      const scale = Math.min(size[0], size[2]) / 10;
      clonedScene.scale.set(scale, size[1] / 10, scale);
      return <primitive object={clonedScene} />;
    }

    return <ProceduralBuilding size={size} color={color} emissive={emissive} />;
  };

  const handlePointerOver = () => {
    if (interactive) {
      setHovered(true);
      if (onHover) onHover(true);
    }
  };

  const handlePointerOut = () => {
    if (interactive) {
      setHovered(false);
      if (onHover) onHover(false);
    }
  };

  const handleClick = () => {
    if (enableInteractions && interior) {
      setShowInterior(!showInterior);
    }
    if (onClick) onClick();
  };

  const handleDoorClick = (doorId: string) => {
    if (enableServiceSync) {
      buildingService.toggleDoor(id, doorId);
    }
  };

  const handleRoomEnter = (roomId: string) => {
    if (enableServiceSync && onEnter) {
      onEnter(id);
    }
  };

  // Occupancy indicator
  const occupancy = buildingState?.occupants.length || 0;
  const capacity = metadata?.capacity || buildingState?.metadata?.capacity || 0;
  const occupancyColor = capacity > 0 && occupancy >= capacity ? '#ef4444' : '#10b981';

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Building mesh */}
      <group>
        {renderBuilding()}
      </group>

      {/* Building label */}
      {showLabel && (
        <group position={[0, size[1] + 1, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={size[0]}
          >
            {name}
          </Text>

          {/* Occupancy indicator */}
          {capacity > 0 && (
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.3}
              color={occupancyColor}
              anchorX="center"
              anchorY="middle"
            >
              {occupancy}/{capacity}
            </Text>
          )}

          {/* Purpose label */}
          {metadata?.purpose && (
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              {metadata.purpose}
            </Text>
          )}
        </group>
      )}

      {/* Interior */}
      {interior && (
        <BuildingInterior
          config={{
            ...interior,
            showInterior
          }}
          building={building}
          onDoorClick={handleDoorClick}
          onRoomEnter={handleRoomEnter}
        />
      )}

      {/* Selection highlight */}
      {selected && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.5, size[1] + 0.5, size[2] + 0.5]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && !selected && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.3, size[1] + 0.3, size[2] + 0.3]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}

      {/* Interior toggle indicator */}
      {interior && hovered && (
        <Text
          position={[0, size[1] + 1.5, 0]}
          fontSize={0.3}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          {showInterior ? 'Hide Interior' : 'Show Interior'}
        </Text>
      )}
    </group>
  );
};

// Procedural building (same as before)
const ProceduralBuilding: React.FC<{
  size: [number, number, number];
  color: string;
  emissive: string;
}> = ({ size, color, emissive }) => {
  const [width, height, depth] = size;

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.1}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Windows */}
      {Array.from({ length: Math.floor(height / 3) }).map((_, i) => (
        <group key={i}>
          {Array.from({ length: Math.floor(width / 2) }).map((_, j) => (
            <mesh
              key={`front-${j}`}
              position={[-width / 2 + (j + 0.5) * 2, -height / 2 + (i + 1) * 3, depth / 2 + 0.01]}
            >
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial color="#87ceeb" emissive="#1e3a8a" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Roof */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.5, depth + 0.5]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>
    </group>
  );
};
