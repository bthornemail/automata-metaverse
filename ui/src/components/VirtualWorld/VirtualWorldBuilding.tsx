/**
 * Virtual World Building Component
 * Modular building system with GLTF models or procedural generation
 */

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from './WorldLayoutManager';

export interface BuildingConfig extends Building {
  gltfModel?: string;
  color?: string;
  emissive?: string;
  showLabel?: boolean;
  interactive?: boolean;
}

interface VirtualWorldBuildingProps {
  building: BuildingConfig;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

export const VirtualWorldBuilding: React.FC<VirtualWorldBuildingProps> = ({
  building,
  selected = false,
  onClick,
  onHover
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

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
    interactive = true
  } = building;

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
      // Scale to match building size
      const scale = Math.min(size[0], size[2]) / 10; // Adjust based on model scale
      clonedScene.scale.set(scale, size[1] / 10, scale);
      return <primitive object={clonedScene} />;
    }

    // Procedural building
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

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={interactive ? onClick : undefined}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Building mesh */}
      <group>
        {renderBuilding()}
      </group>

      {/* Building label */}
      {showLabel && (
        <Text
          position={[0, size[1] + 1, 0]}
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
    </group>
  );
};

// Procedural building generator
const ProceduralBuilding: React.FC<{
  size: [number, number, number];
  color: string;
  emissive: string;
}> = ({ size, color, emissive }) => {
  const [width, height, depth] = size;

  return (
    <group>
      {/* Main structure */}
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
          {/* Front windows */}
          {Array.from({ length: Math.floor(width / 2) }).map((_, j) => (
            <mesh
              key={`front-${j}`}
              position={[-width / 2 + (j + 0.5) * 2, -height / 2 + (i + 1) * 3, depth / 2 + 0.01]}
            >
              <planeGeometry args={[1.5, 1.5]} />
              <meshStandardMaterial color="#87ceeb" emissive="#1e3a8a" emissiveIntensity={0.5} />
            </mesh>
          ))}
          
          {/* Back windows */}
          {Array.from({ length: Math.floor(width / 2) }).map((_, j) => (
            <mesh
              key={`back-${j}`}
              position={[-width / 2 + (j + 0.5) * 2, -height / 2 + (i + 1) * 3, -depth / 2 - 0.01]}
            >
              <planeGeometry args={[1.5, 1.5]} />
              <meshStandardMaterial color="#87ceeb" emissive="#1e3a8a" emissiveIntensity={0.5} />
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

// Building group component for rendering multiple buildings
export const BuildingGroup: React.FC<{
  buildings: BuildingConfig[];
  onBuildingClick?: (building: BuildingConfig) => void;
  selectedBuildingId?: string;
}> = ({ buildings, onBuildingClick, selectedBuildingId }) => {
  return (
    <>
      {buildings.map(building => (
        <VirtualWorldBuilding
          key={building.id}
          building={building}
          selected={selectedBuildingId === building.id}
          onClick={() => onBuildingClick?.(building)}
        />
      ))}
    </>
  );
};
