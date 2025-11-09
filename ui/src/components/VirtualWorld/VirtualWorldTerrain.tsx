/**
 * Virtual World Terrain Component
 * Creates a ground plane with texture support and optional heightmap
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export interface TerrainConfig {
  size?: number; // World size (default: 100)
  texture?: string; // Ground texture URL
  normalMap?: string; // Normal map URL
  heightmap?: string; // Heightmap texture (optional)
  subdivisions?: number; // Terrain detail (default: 100)
  color?: string; // Base color (default: '#4a5568')
  roughness?: number; // Material roughness (default: 0.8)
  metalness?: number; // Material metalness (default: 0.1)
  repeat?: number; // Texture repeat (default: 10)
}

interface VirtualWorldTerrainProps {
  config?: TerrainConfig;
  onCollision?: (position: [number, number, number]) => boolean;
}

export const VirtualWorldTerrain: React.FC<VirtualWorldTerrainProps> = ({
  config = {},
  onCollision
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const {
    size = 100,
    texture,
    normalMap,
    heightmap,
    subdivisions = 100,
    color = '#4a5568',
    roughness = 0.8,
    metalness = 0.1,
    repeat = 10
  } = config;

  // Load textures if provided
  // Note: crossOrigin is handled automatically by drei's useTexture
  const textures = useTexture(texture ? [texture] : []) as THREE.Texture[];
  const normalTextures = useTexture(normalMap ? [normalMap] : []) as THREE.Texture[];

  // Create geometry with optional heightmap
  const geometry = useMemo(() => {
    if (heightmap) {
      // Create plane geometry for heightmap-based terrain
      const planeGeometry = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions);
      // Heightmap would be applied via displacement map
      return planeGeometry;
    }
    return new THREE.PlaneGeometry(size, size, subdivisions, subdivisions);
  }, [size, subdivisions, heightmap]);

  // Material setup
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
    });

    if (textures[0]) {
      const tex = textures[0];
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      mat.map = tex;
    }

    if (normalTextures[0]) {
      const normalTex = normalTextures[0];
      normalTex.wrapS = THREE.RepeatWrapping;
      normalTex.wrapT = THREE.RepeatWrapping;
      normalTex.repeat.set(repeat, repeat);
      mat.normalMap = normalTex;
    }

    return mat;
  }, [textures, normalTextures, color, roughness, metalness, repeat]);

  // Collision detection helper
  useFrame(() => {
    if (meshRef.current && onCollision) {
      // This would be called from avatar movement logic
      // For now, it's a placeholder
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <primitive object={geometry} />
      <primitive object={material} />
    </mesh>
  );
};

// Grid-based terrain helper (alternative to heightmap)
export const GridTerrain: React.FC<{
  size?: number;
  gridSize?: number;
  color?: string;
}> = ({ size = 100, gridSize = 10, color = '#2d3748' }) => {
  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(size, gridSize, color, color);
  }, [size, gridSize, color]);

  return <primitive object={gridHelper} position={[0, 0.01, 0]} />;
};
