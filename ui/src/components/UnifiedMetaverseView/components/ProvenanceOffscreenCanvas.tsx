/**
 * Provenance Canvas Component
 * Renders CanvasL 3D provenance visualization using React Three Fiber
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { agentProvenanceQueryService } from '@/services/agent-provenance-query-service';
import { agentHistoryLoggingService, HistoryLogEntry } from '@/services/agent-history-logging-service';

export interface ProvenanceNode {
  id: string;
  type: 'agent' | 'document' | 'code' | 'interaction' | 'evolution';
  position: [number, number, number];
  metadata: {
    timestamp: number;
    file: string;
    line: number;
    agentId: string;
    dimension?: string;
    churchEncoding?: string;
  };
  data: any;
}

export interface ProvenanceEdge {
  id: string;
  type: 'consumes' | 'produces' | 'references' | 'evolves' | 'interacts';
  from: string;
  to: string;
  metadata: {
    timestamp: number;
    weight: number;
    context: string;
  };
}

interface ProvenanceChain {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

interface ProvenanceOffscreenCanvasProps {
  agentId: string;
  canvasLFile: string;
  query?: {
    type: 'prolog' | 'datalog' | 'sparql';
    query: string;
  };
  filters?: {
    timeRange?: [number, number];
    documentTypes?: string[];
    codeTypes?: string[];
    interactionTypes?: string[];
  };
  onNodeSelect?: (node: ProvenanceNode) => void;
  onEdgeSelect?: (edge: ProvenanceEdge) => void;
}

// Node Component
const ProvenanceNodeMesh: React.FC<{
  node: ProvenanceNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const color = getNodeColor(node.type);

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Sphere args={[0.3, 16, 16]}>
          <meshStandardMaterial
            color={color}
            emissive={isSelected || hovered ? color : '#000000'}
            emissiveIntensity={isSelected ? 0.8 : hovered ? 0.4 : 0}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.type}
      </Text>
    </group>
  );
};

// Edge Component
const ProvenanceEdgeLine: React.FC<{
  edge: ProvenanceEdge;
  fromPos: [number, number, number];
  toPos: [number, number, number];
}> = ({ edge, fromPos, toPos }) => {
  const color = getEdgeColor(edge.type);
  return (
    <Line
      points={[fromPos, toPos]}
      color={color}
      lineWidth={2}
      opacity={0.6}
      transparent
    />
  );
};

function getNodeColor(type: ProvenanceNode['type']): string {
  const colors: Record<ProvenanceNode['type'], string> = {
    agent: '#6366f1',
    document: '#10b981',
    code: '#f59e0b',
    interaction: '#ec4899',
    evolution: '#06b6d4'
  };
  return colors[type] || '#ffffff';
}

function getEdgeColor(type: ProvenanceEdge['type']): string {
  const colors: Record<ProvenanceEdge['type'], string> = {
    consumes: '#10b981',
    produces: '#f59e0b',
    references: '#6366f1',
    evolves: '#06b6d4',
    interacts: '#ec4899'
  };
  return colors[type] || '#ffffff';
}

export const ProvenanceOffscreenCanvas: React.FC<ProvenanceOffscreenCanvasProps> = ({
  agentId,
  canvasLFile,
  query,
  filters,
  onNodeSelect,
  onEdgeSelect
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provenanceChain, setProvenanceChain] = useState<ProvenanceChain | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Build provenance chain from history entries
  const buildProvenanceChain = (
    entries: HistoryLogEntry[]
  ): ProvenanceChain => {
    const nodes: ProvenanceNode[] = [];
    const edges: ProvenanceEdge[] = [];
    const nodePositions = new Map<string, [number, number, number]>();

    // Calculate positions in 3D space (spiral layout)
    entries.forEach((entry, index) => {
      const angle = (index / Math.max(entries.length, 1)) * Math.PI * 2;
      const radius = 5 + (index % 3) * 2;
      const height = (index / Math.max(entries.length, 1)) * 10 - 5;
      
      const position: [number, number, number] = [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ];

      nodePositions.set(entry.id, position);

      // Create node
      const node: ProvenanceNode = {
        id: entry.id,
        type: entry.type === 'document-consumption' ? 'document' :
              entry.type === 'code-production' ? 'code' :
              entry.type === 'evolution' ? 'evolution' :
              entry.type === 'interaction' ? 'interaction' : 'agent',
        position,
        metadata: {
          timestamp: entry.timestamp,
          file: entry.provenance.selfReference.file,
          line: entry.provenance.selfReference.line,
          agentId: entry.agentId,
          dimension: entry.metadata?.dimension,
          churchEncoding: entry.metadata?.churchEncoding
        },
        data: entry
      };

      nodes.push(node);

      // Create edges from provenance
      if (entry.provenance.wasDerivedFrom) {
        entry.provenance.wasDerivedFrom.forEach((source, sourceIndex) => {
          // Find source node
          const sourceNode = nodes.find(n => 
            n.metadata.file === source.file &&
            n.metadata.line === source.line
          );

          if (sourceNode) {
            const edge: ProvenanceEdge = {
              id: `edge-${entry.id}-${sourceNode.id}-${sourceIndex}`,
              type: entry.type === 'document-consumption' ? 'consumes' :
                    entry.type === 'code-production' ? 'produces' :
                    entry.type === 'evolution' ? 'evolves' :
                    entry.type === 'interaction' ? 'interacts' : 'references',
              from: sourceNode.id,
              to: entry.id,
              metadata: {
                timestamp: source.timestamp,
                weight: 1.0,
                context: source.file
              }
            };
            edges.push(edge);
          }
        });
      }
    });

    return { nodes, edges };
  };

  // Load provenance data
  useEffect(() => {
    const loadProvenanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[ProvenanceCanvas] Loading data for agent:', agentId);

        // Load agent history
        await agentProvenanceQueryService.loadAgentHistory(agentId);

        // Get history entries
        const history = await agentHistoryLoggingService.getHistory(agentId, {
          timeRange: filters?.timeRange,
          types: filters?.documentTypes || filters?.codeTypes || filters?.interactionTypes
        });

        console.log('[ProvenanceCanvas] History entries:', history.length);

        // Convert history to provenance chain
        const chain = buildProvenanceChain(history);

        console.log('[ProvenanceCanvas] Built chain:', chain.nodes.length, 'nodes,', chain.edges.length, 'edges');

        // If no history entries, create demo chain for visualization
        if (chain.nodes.length === 0) {
          console.log('[ProvenanceCanvas] No history found, creating demo chain');
          const demoChain: ProvenanceChain = {
            nodes: [
              {
                id: 'demo-node-1',
                type: 'document',
                position: [0, 0, 0],
                metadata: {
                  timestamp: Date.now(),
                  file: 'demo-file.md',
                  line: 1,
                  agentId: agentId
                },
                data: { type: 'document-consumption', message: 'Demo: Document consumption node' }
              },
              {
                id: 'demo-node-2',
                type: 'code',
                position: [3, 0, 0],
                metadata: {
                  timestamp: Date.now() + 1000,
                  file: 'demo-code.ts',
                  line: 10,
                  agentId: agentId
                },
                data: { type: 'code-production', message: 'Demo: Code production node' }
              },
              {
                id: 'demo-node-3',
                type: 'evolution',
                position: [0, 3, 0],
                metadata: {
                  timestamp: Date.now() + 2000,
                  file: 'demo-evolution.canvasl',
                  line: 5,
                  agentId: agentId
                },
                data: { type: 'evolution', message: 'Demo: Evolution node' }
              }
            ],
            edges: [
              {
                id: 'demo-edge-1',
                type: 'consumes',
                from: 'demo-node-1',
                to: 'demo-node-2',
                metadata: {
                  timestamp: Date.now(),
                  weight: 1.0,
                  context: 'document-to-code'
                }
              },
              {
                id: 'demo-edge-2',
                type: 'evolves',
                from: 'demo-node-2',
                to: 'demo-node-3',
                metadata: {
                  timestamp: Date.now() + 1000,
                  weight: 1.0,
                  context: 'code-to-evolution'
                }
              }
            ]
          };
          setProvenanceChain(demoChain);
          console.log('[ProvenanceCanvas] Demo chain set:', demoChain.nodes.length, 'nodes');
        } else {
          setProvenanceChain(chain);
          console.log('[ProvenanceCanvas] Real chain set:', chain.nodes.length, 'nodes');
        }
        
        setIsLoading(false);
        console.log('[ProvenanceCanvas] Loading complete');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provenance data');
        setIsLoading(false);
      }
    };

    loadProvenanceData();
  }, [agentId, query, filters]);

  const handleNodeClick = (node: ProvenanceNode) => {
    setSelectedNodeId(node.id);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900" style={{ minHeight: '500px' }}>
      <Canvas 
        camera={{ position: [10, 10, 10], fov: 60 }}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#6366f1" />
        <directionalLight position={[0, 10, 5]} intensity={0.5} />
        
        {/* Grid helper */}
        <gridHelper args={[20, 20, '#4b5563', '#1f2937']} />

        {/* Render nodes */}
        {provenanceChain?.nodes.map(node => (
          <ProvenanceNodeMesh
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onClick={() => handleNodeClick(node)}
          />
        ))}

        {/* Render edges */}
        {provenanceChain?.edges.map(edge => {
          const fromNode = provenanceChain.nodes.find(n => n.id === edge.from);
          const toNode = provenanceChain.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <ProvenanceEdgeLine
              key={edge.id}
              edge={edge}
              fromPos={fromNode.position}
              toPos={toNode.position}
            />
          );
        })}

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-white text-lg">Loading provenance chain...</div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded z-10">
          Error: {error}
        </div>
      )}

      {provenanceChain && !isLoading && (
        <div className="absolute top-4 right-4 bg-gray-800/90 text-white px-4 py-2 rounded text-sm z-10">
          Nodes: {provenanceChain.nodes.length} | Edges: {provenanceChain.edges.length}
        </div>
      )}

      {(!provenanceChain || provenanceChain.nodes.length === 0) && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center text-white">
            <div className="text-lg mb-2">No provenance data found</div>
            <div className="text-sm text-gray-400">
              Agent history will appear here once actions are logged
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
