/**
 * Grok Metaverse Renderer
 * Renders 3D metaverse based on grok_files with custom dimensional avatars
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Torus, Octahedron, Tetrahedron, Icosahedron, Line } from '@react-three/drei';
import * as THREE from 'three';
import { grokMetaverseService, DimensionalAgent, MetaverseStructure } from '../../services/grok-metaverse-service';
import { motion } from 'framer-motion';
import { Loader2, Info, X } from 'lucide-react';

interface GrokMetaverseRendererProps {
  onAgentSelect?: (agent: DimensionalAgent | null) => void;
  selectedAgentId?: string | null;
}

// Custom Avatar Component based on dimension and type
const DimensionalAvatar: React.FC<{
  agent: DimensionalAgent;
  selected: boolean;
  onClick: () => void;
}> = ({ agent, selected, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + agent.dimension;
      
      // Pulsing for selected
      if (selected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const materialProps = {
    color: agent.color,
    emissive: selected ? agent.color : '#000000',
    emissiveIntensity: selected ? 0.6 : hovered ? 0.3 : 0,
    roughness: 0.2,
    metalness: agent.type === 'system' ? 0.9 : 0.7,
    wireframe: agent.type === 'topology' && agent.dimension % 2 === 0
  };

  const commonProps = {
    onClick,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false)
  };

  const renderShape = () => {
    switch (agent.shape) {
      case 'sphere':
        return <Sphere args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Sphere>;
      case 'cube':
        return <Box args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Box>;
      case 'torus':
        return <Torus args={[agent.size, agent.size * 0.3, 16, 32]} {...commonProps}><meshStandardMaterial {...materialProps} /></Torus>;
      case 'octahedron':
        return <Octahedron args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Octahedron>;
      case 'tetrahedron':
        return <Tetrahedron args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Tetrahedron>;
      case 'icosahedron':
        return <Icosahedron args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Icosahedron>;
      default:
        return <Sphere args={[agent.size]} {...commonProps}><meshStandardMaterial {...materialProps} /></Sphere>;
    }
  };

  return (
    <group ref={meshRef} position={agent.position}>
      {renderShape()}
      
      {/* Agent name */}
      <Text
        position={[0, agent.size + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
      >
        {agent.name}
      </Text>
      
      {/* Dimension indicator */}
      <Text
        position={[0, -agent.size - 0.3, 0]}
        fontSize={0.2}
        color={agent.color}
        anchorX="center"
        anchorY="middle"
      >
        {agent.dimension}D
      </Text>
      
      {/* Church encoding */}
      {agent.churchEncoding && (
        <Text
          position={[0, agent.size + 0.9, 0]}
          fontSize={0.15}
          color="#a855f7"
          anchorX="center"
          anchorY="middle"
          maxWidth={4}
        >
          {agent.churchEncoding}
        </Text>
      )}
      
      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[agent.size + 0.3, agent.size + 0.4, 32]} />
          <meshBasicMaterial color={agent.color} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Connection Line Component
const ConnectionLine: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
  type: 'vertical' | 'horizontal';
  color: string;
}> = ({ from, to, type, color }) => {
  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={type === 'vertical' ? 3 : 2}
      dashed={type === 'horizontal'}
    />
  );
};

// Main 3D Scene
const MetaverseScene: React.FC<{
  metaverse: MetaverseStructure;
  selectedAgentId: string | null;
  onAgentSelect: (agent: DimensionalAgent | null) => void;
}> = ({ metaverse, selectedAgentId, onAgentSelect }) => {
  const { camera } = useThree();

  // Center camera on bounds
  useEffect(() => {
    if (metaverse.bounds.center) {
      camera.position.set(
        metaverse.bounds.center[0] + 8,
        metaverse.bounds.center[1] + 5,
        metaverse.bounds.center[2] + 8
      );
      camera.lookAt(...metaverse.bounds.center);
    }
  }, [metaverse.bounds.center, camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[0, 10, 0]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#6366f1" />
      
      {/* Render connections */}
      {metaverse.connections.map((conn, index) => {
        const fromAgent = metaverse.agents.get(conn.from);
        const toAgent = metaverse.agents.get(conn.to);
        
        if (!fromAgent || !toAgent) return null;
        
        return (
          <ConnectionLine
            key={`conn-${index}`}
            from={fromAgent.position}
            to={toAgent.position}
            type={conn.type}
            color={conn.type === 'vertical' ? '#6366f1' : '#8b5cf6'}
          />
        );
      })}
      
      {/* Render agents */}
      {metaverse.agentList.map(agent => (
        <DimensionalAvatar
          key={agent.id}
          agent={agent}
          selected={selectedAgentId === agent.id}
          onClick={() => onAgentSelect(agent)}
        />
      ))}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
};

export const GrokMetaverseRenderer: React.FC<GrokMetaverseRendererProps> = ({
  onAgentSelect,
  selectedAgentId = null
}) => {
  const [metaverse, setMetaverse] = useState<MetaverseStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<DimensionalAgent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetaverse();
  }, []);

  const loadMetaverse = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loaded = await grokMetaverseService.loadGrokMetaverse();
      setMetaverse(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metaverse');
      console.error('Failed to load metaverse:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agent: DimensionalAgent | null) => {
    setSelectedAgent(agent);
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading Grok Metaverse...</p>
        </div>
      </div>
    );
  }

  if (error || !metaverse) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-red-400">
          <p>Error: {error || 'Failed to load metaverse'}</p>
          <button
            onClick={loadMetaverse}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 relative">
      <Canvas camera={{ position: [8, 8, 8], fov: 75 }}>
        <MetaverseScene
          metaverse={metaverse}
          selectedAgentId={selectedAgentId || selectedAgent?.id || null}
          onAgentSelect={handleAgentSelect}
        />
      </Canvas>

      {/* Agent Info Panel */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-gray-800/95 backdrop-blur-lg rounded-lg p-4 max-w-sm border border-gray-700 shadow-xl"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
            </div>
            <button
              onClick={() => handleAgentSelect(null)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Dimension:</span>
              <span className="ml-2 text-white font-medium">{selectedAgent.dimension}D</span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="ml-2 text-white font-medium capitalize">{selectedAgent.type}</span>
            </div>
            {selectedAgent.churchEncoding && (
              <div>
                <span className="text-gray-400">Church Encoding:</span>
                <div className="mt-1 p-2 bg-gray-900 rounded font-mono text-purple-400 text-xs">
                  {selectedAgent.churchEncoding}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-400">Purpose:</span>
              <p className="mt-1 text-gray-300">{selectedAgent.purpose}</p>
            </div>
            {selectedAgent.dependencies.length > 0 && (
              <div>
                <span className="text-gray-400">Dependencies:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAgent.dependencies.map(dep => (
                    <span key={dep} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedAgent.metadata.capabilities && selectedAgent.metadata.capabilities.length > 0 && (
              <div>
                <span className="text-gray-400">Capabilities:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAgent.metadata.capabilities.map(cap => (
                    <span key={cap} className="px-2 py-1 bg-blue-900/30 rounded text-xs text-blue-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedAgent.metadata.grokFile && (
              <div>
                <span className="text-gray-400">Source:</span>
                <span className="ml-2 text-gray-300 text-xs">{selectedAgent.metadata.grokFile}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-800/95 backdrop-blur-lg rounded-lg p-4 border border-gray-700 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">Vertical (Spine)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-300">Horizontal (Template)</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Sphere args={[0.2]} />
            <span className="text-gray-300">Topology</span>
          </div>
          <div className="flex items-center gap-2">
            <Box args={[0.3]} />
            <span className="text-gray-300">System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrokMetaverseRenderer;
