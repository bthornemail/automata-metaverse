/**
 * Enhanced GLTF Avatar V2
 * Enhanced version with gesture support, expanded animations, and better integration
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from './EnhancedGLTFAvatar';
import { AvatarAnimationController } from './AvatarAnimationController';
import { GestureAnimationController, useAvatarGestures, GestureType } from './AvatarGestureSystem';
import { avatarService, AvatarState } from '../../services/avatar-service';

export interface EnhancedAvatarConfigV2 extends AvatarConfig {
  // Expanded animation states
  animationState?: 'idle' | 'walking' | 'running' | 'jumping' | 'sitting' | 'dancing' | 'gesturing';
  // Gesture support
  currentGesture?: GestureType;
  // Customization
  customization?: {
    color?: string;
    accessories?: string[];
    clothing?: string;
  };
  // Metadata
  metadata?: {
    health?: number;
    energy?: number;
    level?: number;
  };
}

interface EnhancedGLTFAvatarV2Props {
  config: EnhancedAvatarConfigV2;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  enableGestures?: boolean;
  enableServiceSync?: boolean; // Sync with avatar service
}

export const EnhancedGLTFAvatarV2: React.FC<EnhancedGLTFAvatarV2Props> = ({
  config,
  selected = false,
  onClick,
  onHover,
  enableGestures = true,
  enableServiceSync = true
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [gltfLoaded, setGltfLoaded] = useState(false);
  const [gltfError, setGltfError] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);

  const {
    gltfUrl,
    position,
    name,
    status = 'online',
    animationState = 'idle',
    currentGesture,
    showNameTag = true,
    showStatusIndicator = true,
    dimension,
    color = '#6366f1',
    scale = 1,
    customization,
    metadata
  } = config;

  // Gesture system
  const { gestureState, triggerGesture, stopGesture } = useAvatarGestures();

  // Avatar service sync
  useEffect(() => {
    if (!enableServiceSync) return;

    // Register with service
    avatarService.addAvatar(config);

    // Listen for updates
    const handleUpdate = (updatedAvatar: AvatarState) => {
      if (updatedAvatar.config.id === config.id) {
        setAvatarState(updatedAvatar);
      }
    };

    avatarService.on('avatar:update', handleUpdate);

    return () => {
      avatarService.off('avatar:update', handleUpdate);
    };
  }, [config.id, enableServiceSync]);

  // Sync gesture state
  useEffect(() => {
    if (currentGesture && enableGestures) {
      triggerGesture(currentGesture);
    }
  }, [currentGesture, enableGestures, triggerGesture]);

  // Load GLTF model
  let gltf: any = null;
  if (gltfUrl) {
    try {
      gltf = useGLTF(gltfUrl, true);
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

  // Use service state if available
  const effectiveAnimationState = avatarState?.animationState || animationState;
  const effectiveGesture = avatarState?.currentGesture || currentGesture;
  const effectivePosition = avatarState?.config.position || position;

  // Animation and interaction
  useFrame((state) => {
    if (groupRef.current) {
      // Animation-based movement
      switch (effectiveAnimationState) {
        case 'idle':
          groupRef.current.position.y = effectivePosition[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
          break;
        case 'walking':
          groupRef.current.position.y = effectivePosition[1] + Math.abs(Math.sin(state.clock.elapsedTime * 2)) * 0.05;
          break;
        case 'running':
          groupRef.current.position.y = effectivePosition[1] + Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 0.1;
          break;
        case 'jumping':
          // Jump animation handled by GLTF
          break;
        case 'sitting':
          groupRef.current.position.y = effectivePosition[1] - 0.5;
          break;
        case 'dancing':
          groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
          groupRef.current.position.y = effectivePosition[1] + Math.sin(state.clock.elapsedTime * 3) * 0.15;
          break;
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
      
      // Apply customization
      if (customization?.color) {
        clonedScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            if (material) {
              material.color.set(customization.color);
            }
          }
        });
      }
      
      return (
        <group>
          <primitive object={clonedScene} />
          <AvatarAnimationController
            scene={clonedScene}
            animationState={effectiveAnimationState === 'gesturing' ? 'gesturing' : effectiveAnimationState}
            gltf={gltf}
          />
          {enableGestures && effectiveGesture && (
            <GestureAnimationController
              gestureState={gestureState}
              gltf={gltf}
              scene={clonedScene}
              onGestureComplete={() => {
                stopGesture();
                if (enableServiceSync) {
                  avatarService.setAnimationState(config.id, 'idle');
                }
              }}
            />
          )}
        </group>
      );
    }

    // Fallback avatar with customization
    return <DefaultAvatar color={customization?.color || color} dimension={dimension} />;
  };

  const statusColor = {
    online: '#10b981',
    offline: '#6b7280',
    away: '#f59e0b'
  }[status];

  // Health/energy indicators
  const showHealthBar = metadata?.health !== undefined && metadata.health < 100;
  const showEnergyBar = metadata?.energy !== undefined && metadata.energy < 100;

  return (
    <group
      ref={groupRef}
      position={effectivePosition}
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

          {/* Level indicator */}
          {metadata?.level && (
            <Text
              position={[0, -0.7, 0]}
              fontSize={0.15}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              Lv.{metadata.level}
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

      {/* Health bar */}
      {showHealthBar && (
        <group position={[0, 2.2, 0]}>
          <mesh position={[-0.5, 0, 0]}>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-0.5 + (metadata!.health! / 100) * 0.5, 0, 0.01]}>
            <planeGeometry args={[(metadata!.health! / 100), 0.1]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
        </group>
      )}

      {/* Energy bar */}
      {showEnergyBar && (
        <group position={[0, 2.1, 0]}>
          <mesh position={[-0.5, 0, 0]}>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#1f2937" />
          </mesh>
          <mesh position={[-0.5 + (metadata!.energy! / 100) * 0.5, 0, 0.01]}>
            <planeGeometry args={[(metadata!.energy! / 100), 0.1]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
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

      {/* Gesture indicator */}
      {effectiveGesture && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.2}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          {effectiveGesture}
        </Text>
      )}
    </group>
  );
};

// Default avatar fallback (same as before)
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
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      {dimension && (
        <mesh position={[0, 0.3, 0.25]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
};
