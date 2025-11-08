/**
 * GLTF Avatar Renderer
 * Renders 3D GLTF models as avatars in the metaverse
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Symbol } from '../types';

interface GLTFAvatarRendererProps {
  selectedSymbol: Symbol | null;
  selectedSymbols: Set<string>;
  onSymbolSelect: (symbol: Symbol | null) => void;
  config?: {
    avatars?: Symbol[];
    gltfPath?: string;
  };
}

// GLTF Model Loader Component
const GLTFLoader: React.FC<{
  url: string;
  position: [number, number, number];
  selected: boolean;
  onClick: () => void;
  symbol: Symbol;
}> = ({ url, position, selected, onClick, symbol }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Always call useGLTF hook (hooks must be called unconditionally)
  // If URL is invalid, useGLTF will handle it gracefully
  const gltf = useGLTF(url, true); // true = useDraco for compression

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      
      // Pulsing for selected
      if (selected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  // Clone the scene to avoid conflicts
  const clonedScene = gltf?.scene?.clone();
  
  if (!clonedScene) {
    return null;
  }

  return (
    <group ref={meshRef} position={position} onClick={onClick}>
      <primitive object={clonedScene} />
      
      {/* Avatar label */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {symbol.name}
      </Text>
      
      {/* Selection indicator */}
      {selected && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[1.5, 1.6, 32]} />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Default avatar GLTF (fallback)
const DefaultAvatar: React.FC<{
  position: [number, number, number];
  selected: boolean;
  onClick: () => void;
  symbol: Symbol;
}> = ({ position, selected, onClick, symbol }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      if (selected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group ref={meshRef} position={position} onClick={onClick}>
      {/* Simple avatar representation */}
      <mesh>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial
          color={selected ? '#3b82f6' : '#6366f1'}
          emissive={selected ? '#3b82f6' : '#000000'}
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {symbol.name}
      </Text>
    </group>
  );
};

// 3D Scene
const AvatarScene: React.FC<GLTFAvatarRendererProps> = ({
  selectedSymbol,
  selectedSymbols,
  onSymbolSelect,
  config
}) => {
  const avatars = config?.avatars || [];

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />
      
      {/* Render avatars */}
      {avatars.map((avatar, index) => {
        const position: [number, number, number] = avatar.position || [
          Math.cos((index / avatars.length) * Math.PI * 2) * 5,
          0,
          Math.sin((index / avatars.length) * Math.PI * 2) * 5
        ];
        
        const isSelected = selectedSymbol?.id === avatar.id || selectedSymbols.has(avatar.id);
        const gltfUrl = avatar.metadata?.gltfModel;

        // Try GLTF first, fallback to default
        const gltfComponent = gltfUrl ? (
          <GLTFLoader
            key={`gltf-${avatar.id}`}
            url={gltfUrl}
            position={position}
            selected={isSelected}
            onClick={() => onSymbolSelect(avatar)}
            symbol={avatar}
          />
        ) : null;
        
        return gltfComponent || (
          <DefaultAvatar
            key={`default-${avatar.id}`}
            position={position}
            selected={isSelected}
            onClick={() => onSymbolSelect(avatar)}
            symbol={avatar}
          />
        );
      })}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
};

export const GLTFAvatarRenderer: React.FC<GLTFAvatarRendererProps> = (props) => {
  return (
    <div className="h-full w-full bg-gray-900">
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <AvatarScene {...props} />
      </Canvas>
    </div>
  );
};

// Preload GLTF models
useGLTF.preload('/models/default-avatar.gltf');
