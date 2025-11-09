/**
 * Enhanced GLTF Avatar Component
 * Renders GLTF models with animations, name tags, and status indicators
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarAnimationController } from './AvatarAnimationController';

export interface AvatarConfig {
  id: string;
  gltfUrl?: string;
  position: [number, number, number];
  name: string;
  status?: 'online' | 'offline' | 'away';
  animationState?: 'idle' | 'walking' | 'gesturing';
  showNameTag?: boolean;
  showStatusIndicator?: boolean;
  dimension?: string; // e.g., "0D", "1D", etc.
  color?: string; // Avatar color theme
  scale?: number; // Avatar scale (default: 1)
}

interface EnhancedGLTFAvatarProps {
  config: AvatarConfig;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

export const EnhancedGLTFAvatar: React.FC<EnhancedGLTFAvatarProps> = ({
  config,
  selected = false,
  onClick,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [gltfLoaded, setGltfLoaded] = useState(false);
  const [gltfError, setGltfError] = useState<string | null>(null);

  // Register avatar with raycasting system
  useEffect(() => {
    if (groupRef.current && (window as any).__registerAvatarRef) {
      (window as any).__registerAvatarRef(config.id, groupRef.current);
    }
    return () => {
      if ((window as any).__registerAvatarRef) {
        (window as any).__registerAvatarRef(config.id, null);
      }
    };
  }, [config.id, gltfLoaded]);

  const {
    gltfUrl,
    position,
    name,
    status = 'online',
    animationState = 'idle',
    showNameTag = true,
    showStatusIndicator = true,
    dimension,
    color = '#6366f1',
    scale = 1
  } = config;

  // Load GLTF model
  let gltf: any = null;
  if (gltfUrl) {
    try {
      gltf = useGLTF(gltfUrl, true); // true = useDraco
      if (gltf && !gltfLoaded) {
        setGltfLoaded(true);
      }
    } catch (error) {
      if (!gltfError) {
        setGltfError(error instanceof Error ? error.message : 'Failed to load GLTF');
        console.error('GLTF load error:', error);
      }
    }
  }

  // Animation and interaction
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation for idle
      if (animationState === 'idle') {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }

      // Selection pulsing
      if (selected) {
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        groupRef.current.scale.setScalar(scale * pulseScale);
      } else {
        groupRef.current.scale.setScalar(scale);
      }
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    if (onHover) onHover(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (onHover) onHover(false);
  };

  // Render GLTF model or fallback
  const renderAvatar = () => {
    if (gltf && gltf.scene && gltfLoaded) {
      const clonedScene = gltf.scene.clone();
      
      return (
        <group>
          <primitive object={clonedScene} />
          <AvatarAnimationController
            scene={clonedScene}
            animationState={animationState}
            gltf={gltf}
          />
        </group>
      );
    }

    // Fallback avatar
    return <DefaultAvatar color={color} dimension={dimension} />;
  };

  const statusColor = {
    online: '#10b981',
    offline: '#6b7280',
    away: '#f59e0b'
  }[status];

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Avatar model */}
      {renderAvatar()}

      {/* Name tag */}
      {showNameTag && (
        <group position={[0, 2.5, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={5}
          >
            {name}
          </Text>
          
          {/* Dimension label */}
          {dimension && (
            <Text
              position={[0, -0.4, 0]}
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {dimension}
            </Text>
          )}
        </group>
      )}

      {/* Status indicator */}
      {showStatusIndicator && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      )}

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.2, 1.3, 32]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && !selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

// Default avatar fallback
const DefaultAvatar: React.FC<{
  color?: string;
  dimension?: string;
}> = ({ color = '#6366f1', dimension }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.8, 1.6, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          roughness={0.5}
        />
      </mesh>
      
      {/* Dimension indicator on chest */}
      {dimension && (
        <mesh position={[0, 0.3, 0.25]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
};
