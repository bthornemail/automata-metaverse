import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Sphere, Line, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAutomatonState } from '@/hooks/useAutomatonState';

interface ChurchEncodingNode {
  id: string;
  position: [number, number, number];
  lambdaExpression: string;
  dimension: number;
  color: string;
  radius: number;
  connections: string[];
  evaluation: string;
  type: 'abstraction' | 'application' | 'variable';
}

interface MetaverseObject {
  id: string;
  type: 'lambda-cube' | 'church-numeral' | 'y-combinator' | 'topology';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  data: any;
}

// Church encoding visualization component
const ChurchEncodingNode3D: React.FC<{ 
  node: ChurchEncodingNode; 
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation for lambda expressions
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + node.dimension;
      
      // Pulsing for selected nodes
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const geometry = node.type === 'abstraction' ? 
    <Sphere args={[node.radius, 16, 16]} /> :
    node.type === 'application' ? 
    <Box args={[node.radius * 1.5, node.radius * 1.5, node.radius * 1.5]} /> :
    <Sphere args={[node.radius * 0.8, 12, 12]} />;

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {geometry}
        <meshStandardMaterial
          color={node.color}
          emissive={isSelected ? node.color : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
          roughness={0.2}
          metalness={0.8}
          wireframe={node.type === 'variable'}
        />
      </mesh>
      
      {/* Lambda expression label */}
      <Text
        position={[0, node.radius + 0.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.lambdaExpression}
      </Text>
      
      {/* Dimension indicator */}
      <Text
        position={[0, -node.radius - 0.3, 0]}
        fontSize={0.15}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        {node.dimension}D
      </Text>
    </group>
  );
};

// Connection lines between lambda expressions
const LambdaConnection: React.FC<{ 
  start: [number, number, number]; 
  end: [number, number, number];
  type: 'beta-reduction' | 'application' | 'composition';
}> = ({ start, end, type }) => {
  const color = type === 'beta-reduction' ? '#ef4444' : 
                 type === 'application' ? '#3b82f6' : '#10b981';
  
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={type === 'beta-reduction' ? 3 : 2}
      dashed={type === 'beta-reduction'}
    />
  );
};

// Interactive lambda cube
const LambdaCube: React.FC<{ position: [number, number, number]; size: number }> = ({ position, size }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Cube edges */}
      <Line
        points={[
          [-size, -size, -size], [size, -size, -size],
          [size, -size, -size], [size, size, -size],
          [size, size, -size], [-size, size, -size],
          [-size, size, -size], [-size, -size, -size],
          [-size, -size, size], [size, -size, size],
          [size, -size, size], [size, size, size],
          [size, size, size], [-size, size, size],
          [-size, size, size], [-size, -size, size],
          [-size, -size, -size], [-size, -size, size],
          [size, -size, -size], [size, -size, size],
          [size, size, -size], [size, size, size],
          [-size, size, -size], [-size, size, size]
        ]}
        color="#8b5cf6"
        lineWidth={2}
      />
      
      {/* Lambda symbols on faces */}
      <Text position={[0, 0, size + 0.1]} fontSize={0.3} color="#8b5cf6">
        λ
      </Text>
    </group>
  );
};

// Church numeral visualization
const ChurchNumeral: React.FC<{ 
  numeral: number; 
  position: [number, number, number];
  isActive: boolean;
}> = ({ numeral, position, isActive }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  // Create spheres representing the numeral
  const spheres = [];
  for (let i = 0; i <= numeral; i++) {
    const angle = (i / Math.max(numeral, 1)) * Math.PI * 2;
    spheres.push({
      position: [
        Math.cos(angle) * 0.5,
        Math.sin(angle) * 0.5,
        0
      ] as [number, number, number],
      radius: 0.1 + (i * 0.02)
    });
  }

  return (
    <group ref={groupRef} position={position}>
      {spheres.map((sphere, index) => (
        <Sphere
          key={index}
          args={[sphere.radius, 8, 8]}
          position={sphere.position}
        >
          <meshStandardMaterial
            color={isActive ? '#22c55e' : '#6b7280'}
            emissive={isActive ? '#22c55e' : '#000000'}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </Sphere>
      ))}
      
      <Text position={[0, -0.8, 0]} fontSize={0.2} color="white">
        {numeral}
      </Text>
    </group>
  );
};

// Main metaverse scene
const MetaverseScene: React.FC<{
  selectedNode: ChurchEncodingNode | null;
  onNodeSelect: (node: ChurchEncodingNode | null) => void;
  currentDimension: number;
}> = ({ selectedNode, onNodeSelect, currentDimension }) => {
  const { camera } = useThree();

  // Church encoding nodes data
  const [churchNodes] = useState<ChurchEncodingNode[]>([
    {
      id: 'identity',
      position: [-4, 0, 0],
      lambdaExpression: 'λx.x',
      dimension: 0,
      color: '#6366f1',
      radius: 0.5,
      connections: ['successor'],
      evaluation: 'identity',
      type: 'abstraction'
    },
    {
      id: 'successor',
      position: [-2, 0, 0],
      lambdaExpression: 'λn.λf.λx.f(nfx)',
      dimension: 1,
      color: '#8b5cf6',
      radius: 0.6,
      connections: ['addition', 'pair'],
      evaluation: 'succ',
      type: 'abstraction'
    },
    {
      id: 'pair',
      position: [0, 0, 0],
      lambdaExpression: 'λx.λy.λf.fxy',
      dimension: 2,
      color: '#ec4899',
      radius: 0.7,
      connections: ['addition'],
      evaluation: 'cons',
      type: 'abstraction'
    },
    {
      id: 'addition',
      position: [2, 0, 0],
      lambdaExpression: 'λm.λn.λf.λx.mf(nfx)',
      dimension: 3,
      color: '#f43f5e',
      radius: 0.8,
      connections: ['multiplication'],
      evaluation: '+',
      type: 'abstraction'
    },
    {
      id: 'multiplication',
      position: [4, 0, 0],
      lambdaExpression: 'λm.λn.λf.m(nf)',
      dimension: 4,
      color: '#f97316',
      radius: 0.9,
      connections: ['exponentiation'],
      evaluation: '*',
      type: 'abstraction'
    },
    {
      id: 'exponentiation',
      position: [6, 0, 0],
      lambdaExpression: 'λm.λn.nm',
      dimension: 5,
      color: '#eab308',
      radius: 1.0,
      connections: ['y-combinator'],
      evaluation: '^',
      type: 'abstraction'
    },
    {
      id: 'y-combinator',
      position: [8, 0, 0],
      lambdaExpression: 'λf.(λx.f(xx))(λx.f(xx))',
      dimension: 6,
      color: '#22c55e',
      radius: 1.1,
      connections: [],
      evaluation: 'Y',
      type: 'abstraction'
    }
  ]);

  // Create connections between nodes
  const connections = churchNodes.flatMap(node => 
    node.connections.map(targetId => {
      const target = churchNodes.find(n => n.id === targetId);
      if (!target) return null;
      return {
        start: node.position,
        end: target.position,
        type: 'beta-reduction' as const
      };
    }).filter(Boolean)
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6366f1" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#8b5cf6"
      />

      {/* Lambda connections */}
      {connections.map((connection, index) => (
        connection && (
          <LambdaConnection
            key={index}
            start={connection.start}
            end={connection.end}
            type={connection.type}
          />
        )
      ))}

      {/* Church encoding nodes */}
      {churchNodes.map(node => (
        <ChurchEncodingNode3D
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onClick={() => onNodeSelect(node)}
        />
      ))}

      {/* Lambda cube at origin */}
      <LambdaCube position={[0, 3, 0]} size={1} />

      {/* Church numerals */}
      <ChurchNumeral numeral={0} position={[-6, -2, -2]} isActive={currentDimension === 0} />
      <ChurchNumeral numeral={1} position={[-3, -2, -2]} isActive={currentDimension === 1} />
      <ChurchNumeral numeral={2} position={[0, -2, -2]} isActive={currentDimension === 2} />
      <ChurchNumeral numeral={3} position={[3, -2, -2]} isActive={currentDimension === 3} />
      <ChurchNumeral numeral={4} position={[6, -2, -2]} isActive={currentDimension >= 4} />

      {/* Dimension indicator */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Dimension {currentDimension}
      </Text>
    </>
  );
};

// Main metaverse interface component
const MetaverseInterface: React.FC = () => {
  const { state } = useAutomatonState();
  const [selectedNode, setSelectedNode] = useState<ChurchEncodingNode | null>(null);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'fly' | 'first-person'>('orbit');
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
            <h3 className="text-xl font-bold text-white">Church Encoding Metaverse</h3>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={cameraMode}
              onChange={(e) => setCameraMode(e.target.value as any)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            >
              <option value="orbit">Orbit Camera</option>
              <option value="fly">Fly Camera</option>
              <option value="first-person">First Person</option>
            </select>
            
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                showInfo ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {showInfo ? 'Hide Info' : 'Show Info'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)]">
        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ 
              position: [0, 5, 10], 
              fov: 60,
              ...(cameraMode === 'first-person' && { position: [0, 2, 0] })
            }}
            gl={{ antialias: true }}
          >
            <MetaverseScene
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
              currentDimension={state.currentDimension}
            />
          </Canvas>

          {/* Selected Node Info Overlay */}
          {selectedNode && showInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 w-80 p-4 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-white">
                  {selectedNode.id} ({selectedNode.dimension}D)
                </h4>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">Lambda Expression</div>
                  <div className="text-white font-mono text-sm bg-gray-900 p-2 rounded">
                    {selectedNode.lambdaExpression}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Evaluation</div>
                  <div className="text-white">{selectedNode.evaluation}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Type</div>
                  <div className="text-white capitalize">{selectedNode.type}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Connections</div>
                  <div className="text-white">{selectedNode.connections.join(', ')}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls Help */}
          {showInfo && (
            <div className="absolute bottom-4 left-4 p-3 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700">
              <h5 className="text-sm font-semibold text-white mb-2">Controls</h5>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• Left Click + Drag: Rotate view</div>
                <div>• Right Click + Drag: Pan view</div>
                <div>• Scroll: Zoom in/out</div>
                <div>• Click nodes: Select and view details</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h4 className="text-lg font-semibold text-white mb-4">Dimensional Progression</h4>
          
          <div className="space-y-2 mb-6">
            {[
              { dim: 0, name: 'Identity', expr: 'λx.x' },
              { dim: 1, name: 'Successor', expr: 'λn.λf.λx.f(nfx)' },
              { dim: 2, name: 'Pair', expr: 'λx.λy.λf.fxy' },
              { dim: 3, name: 'Addition', expr: 'λm.λn.λf.λx.mf(nfx)' },
              { dim: 4, name: 'Multiplication', expr: 'λm.λn.λf.m(nf)' },
              { dim: 5, name: 'Exponentiation', expr: 'λm.λn.nm' },
              { dim: 6, name: 'Y-Combinator', expr: 'λf.(λx.f(xx))(λx.f(xx))' }
            ].map(item => (
              <div
                key={item.dim}
                className={`p-3 rounded-lg border transition-all ${
                  state.currentDimension === item.dim
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{item.dim}D: {item.name}</span>
                  {state.currentDimension === item.dim && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono truncate">
                  {item.expr}
                </div>
              </div>
            ))}
          </div>

          {/* Automaton State */}
          <div className="p-3 bg-gray-700 rounded-lg">
            <h5 className="text-sm font-semibold text-white mb-2">Current State</h5>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Dimension:</span>
                <span className="font-mono">{state.currentDimension}D</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-mono">{state.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Objects:</span>
                <span className="font-mono">{state.totalObjects}</span>
              </div>
              <div className="flex justify-between">
                <span>Iterations:</span>
                <span className="font-mono">{state.iterationCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaverseInterface;