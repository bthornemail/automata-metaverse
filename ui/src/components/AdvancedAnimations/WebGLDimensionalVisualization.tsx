import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface DimensionNode3D {
  id: string;
  level: number;
  name: string;
  position: [number, number, number];
  color: string;
  churchEncoding: string;
  radius: number;
}

interface DimensionLink3D {
  source: [number, number, number];
  target: [number, number, number];
  type: 'vertical' | 'horizontal';
  color: string;
}

// Dimension configuration with 3D positions
const dimensionConfig: DimensionNode3D[] = [
  { id: '0D', level: 0, name: 'Identity', position: [0, 0, 0], color: '#6366f1', churchEncoding: 'λx.x', radius: 0.3 },
  { id: '1D', level: 1, name: 'Successor', position: [2, 0, 0], color: '#8b5cf6', churchEncoding: 'λn.λf.λx.f(nfx)', radius: 0.35 },
  { id: '2D', level: 2, name: 'Pair', position: [4, 0, 0], color: '#ec4899', churchEncoding: 'λx.λy.λf.fxy', radius: 0.4 },
  { id: '3D', level: 3, name: 'Addition', position: [6, 0, 0], color: '#f43f5e', churchEncoding: 'λm.λn.λf.λx.mf(nfx)', radius: 0.45 },
  { id: '4D', level: 4, name: 'Network', position: [8, 0, 0], color: '#f97316', churchEncoding: 'localhost:8080', radius: 0.5 },
  { id: '5D', level: 5, name: 'Consensus', position: [10, 0, 0], color: '#eab308', churchEncoding: 'blockchain', radius: 0.55 },
  { id: '6D', level: 6, name: 'Intelligence', position: [12, 0, 0], color: '#22c55e', churchEncoding: 'neural_network', radius: 0.6 },
  { id: '7D', level: 7, name: 'Quantum', position: [14, 0, 0], color: '#06b6d4', churchEncoding: '|ψ⟩ = α|0⟩ + β|1⟩', radius: 0.65 },
];

// Create links between dimensions
const createDimensionLinks = (): DimensionLink3D[] => {
  const links: DimensionLink3D[] = [];
  for (let i = 0; i < dimensionConfig.length - 1; i++) {
    links.push({
      source: dimensionConfig[i].position,
      target: dimensionConfig[i + 1].position,
      type: 'vertical',
      color: '#4b5563'
    });
  }
  return links;
};

// Animated dimension node component
const DimensionNode: React.FC<{ node: DimensionNode3D; isActive: boolean; onClick: () => void }> = ({ 
  node, 
  isActive, 
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.level) * 0.1;
      
      // Pulsing effect for active dimension
      if (isActive) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[node.radius, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={isActive ? node.color : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
      
      {/* Dimension label */}
      <Text
        position={[0, node.radius + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.id}
      </Text>
      
      {/* Name label */}
      <Text
        position={[0, node.radius + 0.9, 0]}
        fontSize={0.2}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        {node.name}
      </Text>

      {/* Hover indicator */}
      {hovered && (
        <Sphere args={[node.radius + 0.1, 16, 16]}>
          <meshBasicMaterial color={node.color} wireframe />
        </Sphere>
      )}
    </group>
  );
};

// Connection line component
const ConnectionLine: React.FC<{ link: DimensionLink3D }> = ({ link }) => {
  const points = [
    new THREE.Vector3(...link.source),
    new THREE.Vector3(...link.target)
  ];

  return (
    <Line
      points={points}
      color={link.color}
      lineWidth={2}
      dashed
      dashScale={10}
      dashSize={0.5}
      gapSize={0.2}
    />
  );
};

// Scene component
const DimensionalScene: React.FC<{ 
  currentDimension: number; 
  onDimensionSelect: (level: number) => void;
  selectedNode: DimensionNode3D | null;
}> = ({ currentDimension, onDimensionSelect, selectedNode }) => {
  const links = createDimensionLinks();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6366f1" />

      {/* Dimensional connections */}
      {links.map((link, index) => (
        <ConnectionLine key={index} link={link} />
      ))}

      {/* Dimension nodes */}
      {dimensionConfig.map((node) => (
        <DimensionNode
          key={node.id}
          node={node}
          isActive={node.level === currentDimension}
          onClick={() => onDimensionSelect(node.level)}
        />
      ))}

      {/* Selected node info panel */}
      {selectedNode && (
        <group position={[7, 3, 2]}>
          <Box args={[4, 2, 0.1]}>
            <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
          </Box>
          <Text
            position={[0, 0.7, 0.06]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {selectedNode.id}: {selectedNode.name}
          </Text>
          <Text
            position={[0, 0.3, 0.06]}
            fontSize={0.12}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
            maxWidth={3.5}
          >
            {selectedNode.churchEncoding}
          </Text>
          <Text
            position={[0, -0.1, 0.06]}
            fontSize={0.1}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
          >
            {selectedNode.level === currentDimension ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </group>
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

// Main WebGL Dimensional Visualization Component
const WebGLDimensionalVisualization: React.FC = () => {
  const [currentDimension, setCurrentDimension] = useState(0);
  const [selectedNode, setSelectedNode] = useState<DimensionNode3D | null>(null);

  const handleDimensionSelect = (level: number) => {
    setCurrentDimension(level);
    setSelectedNode(dimensionConfig.find(node => node.level === level) || null);
  };

  return (
    <div className="w-full h-full bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">WebGL 3D Visualization</h3>
        <p className="text-xs text-gray-400 mt-1">
          Interactive 3D Church encoding topology
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="relative" style={{ height: '400px' }}>
        <Canvas
          camera={{ position: [7, 3, 10], fov: 60 }}
          gl={{ antialias: true }}
        >
          <DimensionalScene
            currentDimension={currentDimension}
            onDimensionSelect={handleDimensionSelect}
            selectedNode={selectedNode}
          />
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Current Dimension:</span>
            <span className="text-lg font-bold text-white">
              {currentDimension}D - {dimensionConfig[currentDimension]?.name}
            </span>
          </div>
          
          <div className="flex gap-2">
            {dimensionConfig.map((node) => (
              <button
                key={node.id}
                onClick={() => handleDimensionSelect(node.level)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  node.level === currentDimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                style={{ borderColor: node.color, borderWidth: '1px' }}
              >
                {node.id}
              </button>
            ))}
          </div>
        </div>

        {/* Church Encoding Display */}
        {selectedNode && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Church Encoding:</div>
            <div className="font-mono text-sm text-white">
              {selectedNode.churchEncoding}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebGLDimensionalVisualization;