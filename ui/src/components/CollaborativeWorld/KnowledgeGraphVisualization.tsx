/**
 * Knowledge Graph Visualization Component
 * Visualizes the knowledge graph as a 3D network
 */

import React, { useEffect, useState } from 'react';
import { collaborativeWorldService, KnowledgeNode } from '@/services/collaborative-world';
import { useFrame } from '@react-three/fiber';

export const KnowledgeGraphVisualization: React.FC = () => {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);

  useEffect(() => {
    const updateNodes = () => {
      try {
        const state = collaborativeWorldService.getState();
        setNodes(state.knowledgeGraph);
      } catch (error) {
        // Service not initialized
      }
    };

    const interval = setInterval(updateNodes, 1000);
    return () => clearInterval(interval);
  }, []);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <>
      {nodes.map((node, index) => {
        // Position nodes in a circle
        const angle = (index / nodes.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (node.weight - 0.5) * 2;

        return (
          <mesh key={node.id} position={[x, y, z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={node.weight}
            />
          </mesh>
        );
      })}

      {/* Draw connections */}
      {nodes.map(node => {
        return node.relationships.map(relId => {
          const relNode = nodes.find(n => n.id === relId);
          if (!relNode) return null;

          const angle1 = (nodes.indexOf(node) / nodes.length) * Math.PI * 2;
          const angle2 = (nodes.indexOf(relNode) / nodes.length) * Math.PI * 2;
          const radius = 5;
          const x1 = Math.cos(angle1) * radius;
          const z1 = Math.sin(angle1) * radius;
          const y1 = (node.weight - 0.5) * 2;
          const x2 = Math.cos(angle2) * radius;
          const z2 = Math.sin(angle2) * radius;
          const y2 = (relNode.weight - 0.5) * 2;

          return (
            <line key={`${node.id}-${relId}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([x1, y1, z1, x2, y2, z2])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00ffff" opacity={0.3} transparent />
            </line>
          );
        });
      })}
    </>
  );
};
