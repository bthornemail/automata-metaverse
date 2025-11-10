/**
 * Agent Avatar Component
 * 3D representation of an agent in the collaborative world
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Agent } from '@/services/collaborative-world/types';

interface AgentAvatarProps {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
}

const dimensionColors: Record<string, string> = {
  '0D': '#ff0000',
  '1D': '#ff8800',
  '2D': '#ffff00',
  '3D': '#00ff00',
  '4D': '#0088ff',
  '5D': '#0000ff',
  '6D': '#8800ff',
  '7D': '#ff00ff'
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  selected,
  onClick
}) => {
  const meshRef = useRef<Mesh>(null);
  const color = dimensionColors[agent.dimension] || '#ffffff';

  useFrame((state) => {
    if (meshRef.current) {
      // Update position
      meshRef.current.position.set(
        agent.position[0],
        agent.position[1],
        agent.position[2]
      );

      // Update rotation
      meshRef.current.rotation.set(
        agent.rotation[0],
        agent.rotation[1],
        agent.rotation[2]
      );

      // Animation based on state
      if (agent.animationState === 'walking' || agent.animationState === 'running') {
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else if (agent.animationState === 'dancing') {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.5;
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.15;
      }

      // Selection pulsing
      if (selected) {
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        meshRef.current.scale.setScalar(pulseScale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.5 : 0}
      />
    </mesh>
  );
};
