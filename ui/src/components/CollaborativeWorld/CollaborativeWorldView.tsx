/**
 * Collaborative World View Component
 * Main visualization component for AI Portal Collaborative World
 */

import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Agent } from '@/services/collaborative-world/types';
import { collaborativeWorldService } from '@/services/collaborative-world';
import { AgentAvatar } from './AgentAvatar';
import { InteractionVisualization } from './InteractionVisualization';
import { KnowledgeGraphVisualization } from './KnowledgeGraphVisualization';

interface CollaborativeWorldViewProps {
  className?: string;
}

export const CollaborativeWorldView: React.FC<CollaborativeWorldViewProps> = ({
  className = ''
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const frameRef = useRef<number>();

  useEffect(() => {
    // Initialize collaborative world
    const initialize = async () => {
      try {
        // Load from CanvasL file
        const { loadCollaborativeWorldFromCanvasL } = await import('@/services/collaborative-world');
        try {
          await loadCollaborativeWorldFromCanvasL('/ai-portal-agent-movement.canvasl');
        } catch (error) {
          console.warn('Failed to load CanvasL file, using default configuration:', error);
          // Use default configuration
          const { collaborativeWorldService, canvaslParser } = await import('@/services/collaborative-world');
          const defaultScript = await canvaslParser.parseScript(`@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"
@dimension: "4D-6D"
@phase: "ai-portal-collaborative-world"

{"id":"agent-0D","type":"agent","dimension":"0D","name":"0D-Topology-Agent","position":[0,0,0],"velocity":[0,0,0],"interactionRange":"personal","learningEnabled":true}
{"id":"agent-1D","type":"agent","dimension":"1D","name":"1D-Temporal-Agent","position":[1,0,0],"velocity":[0,0,0],"interactionRange":"peer","learningEnabled":true}
{"id":"agent-2D","type":"agent","dimension":"2D","name":"2D-Structural-Agent","position":[2,0,0],"velocity":[0,0,0],"interactionRange":"local","learningEnabled":true}
{"id":"agent-3D","type":"agent","dimension":"3D","name":"3D-Algebraic-Agent","position":[3,0,0],"velocity":[0,0,0],"interactionRange":"local","learningEnabled":true}
{"id":"agent-4D","type":"agent","dimension":"4D","name":"4D-Network-Agent","position":[4,0,0],"velocity":[0,0,0],"interactionRange":"global","learningEnabled":true}
{"id":"agent-5D","type":"agent","dimension":"5D","name":"5D-Consensus-Agent","position":[5,0,0],"velocity":[0,0,0],"interactionRange":"global","learningEnabled":true}
{"id":"agent-6D","type":"agent","dimension":"6D","name":"6D-Intelligence-Agent","position":[6,0,0],"velocity":[0,0,0],"interactionRange":"agentic","learningEnabled":true}
{"id":"agent-7D","type":"agent","dimension":"7D","name":"7D-Quantum-Agent","position":[7,0,0],"velocity":[0,0,0],"interactionRange":"agentic","learningEnabled":true}`);
          await collaborativeWorldService.initialize(defaultScript);
        }
        
        // Get initial state
        const state = collaborativeWorldService.getState();
        setAgents(Array.from(state.agents.values()));
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize collaborative world:', error);
        // Fallback: create default agents
        setIsInitialized(true);
      }
    };

    initialize();

    // Update loop
    const update = () => {
      try {
        const state = collaborativeWorldService.getState();
        setAgents(Array.from(state.agents.values()));
      } catch (error) {
        // Service not initialized yet
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
  };

  const handleCreateInteraction = async (
    type: 'touch' | 'communicate' | 'collaborate' | 'learn',
    source: string,
    target?: string
  ) => {
    await collaborativeWorldService.createInteraction(type, source, target);
  };

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-white">Initializing Collaborative World...</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[0, 10, 0]} intensity={0.8} />

        {/* Render agents */}
        {agents.map(agent => (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            selected={selectedAgent === agent.id}
            onClick={() => handleAgentClick(agent.id)}
          />
        ))}

        {/* Render interactions */}
        <InteractionVisualization agents={agents} />

        {/* Render knowledge graph */}
        <KnowledgeGraphVisualization />

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 p-4 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-2">Collaborative World</h3>
        <div className="text-sm">
          <div>Agents: {agents.length}</div>
          <div>Selected: {selectedAgent || 'None'}</div>
        </div>
        {selectedAgent && (
          <div className="mt-4">
            <button
              onClick={() => handleCreateInteraction('touch', selectedAgent)}
              className="px-3 py-1 bg-blue-600 rounded mr-2 mb-2"
            >
              Touch
            </button>
            <button
              onClick={() => handleCreateInteraction('communicate', selectedAgent)}
              className="px-3 py-1 bg-green-600 rounded mr-2 mb-2"
            >
              Communicate
            </button>
            <button
              onClick={() => handleCreateInteraction('collaborate', selectedAgent)}
              className="px-3 py-1 bg-purple-600 rounded mr-2 mb-2"
            >
              Collaborate
            </button>
            <button
              onClick={() => handleCreateInteraction('learn', selectedAgent)}
              className="px-3 py-1 bg-yellow-600 rounded mb-2"
            >
              Learn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
