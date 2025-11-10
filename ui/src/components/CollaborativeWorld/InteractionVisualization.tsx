/**
 * Interaction Visualization Component
 * Visualizes interactions between agents
 */

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Agent } from '@/services/collaborative-world/types';
import { collaborativeWorldService } from '@/services/collaborative-world';
import { useState, useEffect } from 'react';

interface InteractionVisualizationProps {
  agents: Agent[];
}

export const InteractionVisualization: React.FC<InteractionVisualizationProps> = ({
  agents
}) => {
  const [interactions, setInteractions] = useState<any[]>([]);

  useEffect(() => {
    const updateInteractions = () => {
      try {
        const state = collaborativeWorldService.getState();
        // Get recent interactions (last 5 seconds)
        const recentInteractions = state.interactions.filter(
          interaction => Date.now() - interaction.timestamp < 5000
        );
        setInteractions(recentInteractions);
      } catch (error) {
        // Service not initialized
      }
    };

    const interval = setInterval(updateInteractions, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {interactions.map(interaction => {
        const sourceAgent = agents.find(a => a.id === interaction.source);
        const targetAgent = interaction.target
          ? agents.find(a => a.id === interaction.target)
          : null;

        if (!sourceAgent) return null;

        const color = getInteractionColor(interaction.type);

        if (targetAgent) {
          // Draw line between source and target
          return (
            <line key={interaction.id}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    sourceAgent.position[0],
                    sourceAgent.position[1],
                    sourceAgent.position[2],
                    targetAgent.position[0],
                    targetAgent.position[1],
                    targetAgent.position[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={color} opacity={0.5} transparent />
            </line>
          );
        } else {
          // Draw sphere for global interactions
          return (
            <mesh
              key={interaction.id}
              position={[
                sourceAgent.position[0],
                sourceAgent.position[1] + 2,
                sourceAgent.position[2]
              ]}
            >
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          );
        }
      })}
    </>
  );
};

function getInteractionColor(type: string): string {
  switch (type) {
    case 'touch':
      return '#ff0000';
    case 'communicate':
      return '#00ff00';
    case 'collaborate':
      return '#0000ff';
    case 'learn':
      return '#ffff00';
    default:
      return '#ffffff';
  }
}
