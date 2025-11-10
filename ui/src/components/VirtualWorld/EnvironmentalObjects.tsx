/**
 * Environmental Objects Component
 * Trees, plants, rocks, and decorative elements for the virtual world
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWindAt } from '@/hooks/useMetaversePhysics';

export interface EnvironmentalObject {
  id: string;
  type: 'tree' | 'rock' | 'plant' | 'decoration';
  position: [number, number, number];
  scale?: number;
  rotation?: number;
  gltfModel?: string;
  color?: string;
}

interface EnvironmentalObjectsProps {
  objects: EnvironmentalObject[];
  density?: number; // Objects per 100 units (default: 5)
}

export const EnvironmentalObjects: React.FC<EnvironmentalObjectsProps> = ({
  objects,
  density = 5
}) => {
  return (
    <>
      {objects.map(obj => (
        <EnvironmentalObjectRenderer key={obj.id} object={obj} />
      ))}
    </>
  );
};

// Individual object renderer
const EnvironmentalObjectRenderer: React.FC<{
  object: EnvironmentalObject;
}> = ({ object }) => {
  const meshRef = useRef<THREE.Group>(null);
  const {
    type,
    position,
    scale = 1,
    rotation = 0,
    gltfModel,
    color
  } = object;

  // Load GLTF if provided
  let gltf: any = null;
  if (gltfModel) {
    try {
      gltf = useGLTF(gltfModel, true);
    } catch (error) {
      console.error('Failed to load environmental object GLTF:', error);
    }
  }

  // Use wind physics for tree animation
  const wind = useWindAt(position);

  // Animate based on type and physics
  useFrame((state) => {
    if (meshRef.current && type === 'tree') {
      // Tree swaying driven by wind physics
      const windStrength = wind.strength;
      const windDirection = Math.atan2(wind.direction[0], wind.direction[2]);
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + windDirection) * windStrength * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + windDirection) * windStrength * 0.05;
    }
  });

  // Render GLTF or procedural object
  if (gltf && gltf.scene) {
    const clonedScene = gltf.scene.clone();
    clonedScene.scale.setScalar(scale);
    return (
      <group ref={meshRef} position={position} rotation={[0, rotation, 0]}>
        <primitive object={clonedScene} />
      </group>
    );
  }

  // Procedural objects
  return (
    <group ref={meshRef} position={position} rotation={[0, rotation, 0]}>
      {type === 'tree' && <ProceduralTree scale={scale} color={color} />}
      {type === 'rock' && <ProceduralRock scale={scale} color={color} />}
      {type === 'plant' && <ProceduralPlant scale={scale} color={color} />}
      {type === 'decoration' && <ProceduralDecoration scale={scale} color={color} />}
    </group>
  );
};

// Procedural tree
const ProceduralTree: React.FC<{ scale: number; color?: string }> = ({ scale, color = '#2d5016' }) => {
  return (
    <group scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      
      {/* Foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.5, 2, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Procedural rock
const ProceduralRock: React.FC<{ scale: number; color?: string }> = ({ scale, color = '#4a5568' }) => {
  return (
    <mesh scale={scale} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

// Procedural plant
const ProceduralPlant: React.FC<{ scale: number; color?: string }> = ({ scale, color = '#10b981' }) => {
  return (
    <group scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>
      
      {/* Leaves */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * 0.2,
            0.4,
            Math.sin((i / 4) * Math.PI * 2) * 0.2
          ]}
          rotation={[0, (i / 4) * Math.PI * 2, 0]}
        >
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// Procedural decoration
const ProceduralDecoration: React.FC<{ scale: number; color?: string }> = ({ scale, color = '#6366f1' }) => {
  return (
    <mesh scale={scale} castShadow>
      <torusGeometry args={[0.3, 0.1, 16, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
};

// Procedural placement system
export const generateEnvironmentalObjects = (
  worldSize: number,
  density: number = 5,
  zones: Array<{ bounds: { min: [number, number, number]; max: [number, number, number] } }>
): EnvironmentalObject[] => {
  const objects: EnvironmentalObject[] = [];
  const totalObjects = Math.floor((worldSize * worldSize / 100) * density);

  const types: Array<'tree' | 'rock' | 'plant' | 'decoration'> = ['tree', 'rock', 'plant', 'decoration'];
  
  for (let i = 0; i < totalObjects; i++) {
    // Random position (avoid zones)
    const x = (Math.random() - 0.5) * worldSize;
    const z = (Math.random() - 0.5) * worldSize;
    
    // Check if position is in a zone
    const inZone = zones.some(zone => {
      const { min, max } = zone.bounds;
      return x >= min[0] && x <= max[0] && z >= min[2] && z <= max[2];
    });

    if (!inZone) {
      const type = types[Math.floor(Math.random() * types.length)];
      objects.push({
        id: `env-${i}`,
        type,
        position: [x, 0, z],
        scale: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  return objects;
};
