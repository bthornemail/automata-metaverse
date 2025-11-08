import React, { useState, useEffect, useRef } from 'react';
import { Box, Sphere, Line, Text, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAutomatonState } from '@/hooks/useAutomatonState';
import { Brain } from 'lucide-react';

interface DimensionNode3D {
  id: string;
  name: string;
  level: number;
  color: string;
  position: [number, number, number];
  churchEncoding: string;
}

interface EvolutionEvent {
  timestamp: number;
  dimension: number;
  type: 'progression' | 'mutation' | 'self-reference';
  description: string;
}

interface QubitState {
  id: string;
  theta: number;
  phi: number;
  amplitude: { real: number; imag: number };
  probability: number;
  label: string;
}

interface Particle3D {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Avatar3D {
  id: string;
  userId: string;
  name: string;
  position: [number, number, number];
  color: string;
  isSpeaking: boolean;
  currentDimension: number;
}

// Enhanced 3D topology layout - arranged in a spiral/helix pattern for better 3D visualization
export const dimensionConfig: DimensionNode3D[] = [
  { id: '0D-topology', name: 'Topology', level: 0, color: '#6366f1', position: [0, 0, 0], churchEncoding: 'λf.λx.x' },
  { id: '1D-temporal', name: 'Temporal', level: 1, color: '#8b5cf6', position: [2, 1, 0], churchEncoding: 'λn.λf.λx.f(nfx)' },
  { id: '2D-structural', name: 'Structural', level: 2, color: '#ec4899', position: [3, 2, -1], churchEncoding: 'λx.λy.λf.fxy' },
  { id: '3D-algebraic', name: 'Algebraic', level: 3, color: '#f43f5e', position: [3, 3, -2], churchEncoding: 'λm.λn.λf.λx.mf(nfx)' },
  { id: '4D-network', name: 'Network', level: 4, color: '#f97316', position: [2, 4, -2], churchEncoding: 'λm.λn.λf.m(nf)' },
  { id: '5D-consensus', name: 'Consensus', level: 5, color: '#eab308', position: [0, 4, -1], churchEncoding: 'λm.λn.nm' },
  { id: '6D-intelligence', name: 'Intelligence', level: 6, color: '#22c55e', position: [-2, 3, 0], churchEncoding: 'λf.(λx.f(xx))(λx.f(xx))' },
  { id: '7D-quantum', name: 'Quantum', level: 7, color: '#06b6d4', position: [-3, 1, 1], churchEncoding: '|ψ⟩ = α|0⟩ + β|1⟩' },
];

// Quantum Bloch Sphere Component
const BlochSphere: React.FC<{ qubit: QubitState; position: [number, number, number] }> = ({ qubit, position }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const x = Math.sin(qubit.theta) * Math.cos(qubit.phi);
  const y = Math.sin(qubit.theta) * Math.sin(qubit.phi);
  const z = Math.cos(qubit.theta);

  return (
    <group ref={meshRef} position={position}>
      {/* Sphere wireframe */}
      <Sphere args={[0.5, 16, 16]}>
        <meshStandardMaterial
          color="#06b6d4"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>
      
      {/* Axes */}
      <Line points={[[-0.6, 0, 0], [0.6, 0, 0]]} color="white" lineWidth={1} />
      <Line points={[[0, -0.6, 0], [0, 0.6, 0]]} color="white" lineWidth={1} />
      <Line points={[[0, 0, -0.6], [0, 0, 0.6]]} color="white" lineWidth={1} />
      
      {/* State vector */}
      <Line
        points={[[0, 0, 0], [x * 0.5, y * 0.5, z * 0.5]]}
        color="#f59e0b"
        lineWidth={2}
      />
      
      {/* State point */}
      <Sphere args={[0.05, 8, 8]} position={[x * 0.5, y * 0.5, z * 0.5]}>
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
      </Sphere>
      
      {/* Label */}
      <Text position={[0, 0.7, 0]} fontSize={0.1} color="white" anchorX="center">
        {qubit.label}
      </Text>
    </group>
  );
};

// 3D Particle Component
const Particle3DComponent: React.FC<{ particle: Particle3D }> = ({ particle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x += particle.velocity[0] * 0.01;
      meshRef.current.position.y += particle.velocity[1] * 0.01;
      meshRef.current.position.z += particle.velocity[2] * 0.01;
      
      // Reset if out of bounds
      if (Math.abs(meshRef.current.position.x) > 10) particle.velocity[0] *= -1;
      if (Math.abs(meshRef.current.position.y) > 10) particle.velocity[1] *= -1;
      if (Math.abs(meshRef.current.position.z) > 10) particle.velocity[2] *= -1;
    }
  });

  const opacity = 1 - (particle.life / particle.maxLife);

  return (
    <Sphere args={[particle.size, 8, 8]} position={particle.position}>
      <meshStandardMaterial
        color={particle.color}
        transparent
        opacity={opacity}
        emissive={particle.color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

// Avatar Component
const Avatar3DComponent: React.FC<{ avatar: Avatar3D }> = ({ avatar }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current && avatar.isSpeaking) {
      meshRef.current.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={avatar.position}>
      {/* Avatar body */}
      <Sphere args={[0.3, 16, 16]}>
        <meshStandardMaterial
          color={avatar.color}
          emissive={avatar.isSpeaking ? avatar.color : '#000000'}
          emissiveIntensity={avatar.isSpeaking ? 0.5 : 0}
        />
      </Sphere>
      
      {/* Name label */}
      <Text position={[0, 0.6, 0]} fontSize={0.15} color="white" anchorX="center">
        {avatar.name}
      </Text>
      
      {/* Speaking indicator */}
      {avatar.isSpeaking && (
        <Sphere args={[0.4, 8, 8]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={avatar.color}
            transparent
            opacity={0.2}
            emissive={avatar.color}
            emissiveIntensity={0.3}
          />
        </Sphere>
      )}
    </group>
  );
};

// Dimension node component
const DimensionNode: React.FC<{
  node: DimensionNode3D;
  isActive: boolean;
  onClick: () => void;
  evolutionCount: number;
}> = ({ node, isActive, onClick, evolutionCount }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      if (isActive) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Sphere args={[0.6, 16, 16]}>
          <meshStandardMaterial
            color={node.color}
            emissive={isActive ? node.color : '#000000'}
            emissiveIntensity={isActive ? 0.5 : hovered ? 0.2 : 0}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </mesh>
      
      <Text
        position={[0, 1, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.id}
      </Text>
      
      {evolutionCount > 0 && (
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          {evolutionCount} evolutions
        </Text>
      )}
    </group>
  );
};

// Connection lines between dimensions
const ConnectionLine: React.FC<{ 
  from: DimensionNode3D; 
  to: DimensionNode3D;
  isActive: boolean;
}> = ({ from, to, isActive }) => {
  return (
    <Line
      points={[from.position, to.position]}
      color={isActive ? "#22c55e" : "#6366f1"}
      lineWidth={isActive ? 3 : 2}
    />
  );
};

// Topology grid/plane for better 3D context
const TopologyGrid: React.FC = () => {
  return (
    <gridHelper args={[20, 20, '#4b5563', '#1f2937']} position={[0, 0, 0]} />
  );
};

// Evolution trail visualization
const EvolutionTrail: React.FC<{ events: EvolutionEvent[] }> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <>
      {events.map((event, index) => {
        const node = dimensionConfig[event.dimension];
        if (!node) return null;
        
        const trailY = 1 + (index % 3) * 0.3;
        return (
          <Sphere
            key={index}
            position={[node.position[0], trailY, node.position[2]]}
            args={[0.15, 8, 8]}
          >
            <meshStandardMaterial
              color={event.type === 'progression' ? '#22c55e' : event.type === 'mutation' ? '#f59e0b' : '#ef4444'}
              emissive={event.type === 'progression' ? '#22c55e' : event.type === 'mutation' ? '#f59e0b' : '#ef4444'}
              emissiveIntensity={0.5}
            />
          </Sphere>
        );
      })}
    </>
  );
};

// Scene component with unified metaverse features
const EvolutionScene: React.FC<{
  currentDimension: number;
  onDimensionSelect: (level: number) => void;
  selectedNode: DimensionNode3D | null;
  evolutionEvents: EvolutionEvent[];
  evolutionCounts: Record<number, number>;
  qubits: QubitState[];
  particles: Particle3D[];
  avatars: Avatar3D[];
}> = ({ 
  currentDimension, 
  onDimensionSelect, 
  selectedNode, 
  evolutionEvents, 
  evolutionCounts,
  qubits,
  particles,
  avatars
}) => {
  // Create connections between adjacent dimensions (progression chain)
  const progressionLinks = dimensionConfig.slice(0, -1).map((node, i) => ({
    from: node,
    to: dimensionConfig[i + 1],
    isActive: node.level === currentDimension || dimensionConfig[i + 1].level === currentDimension
  }));

  // Create cross-dimensional connections for topology visualization
  const topologyLinks = [
    { from: dimensionConfig[0], to: dimensionConfig[4] },
    { from: dimensionConfig[2], to: dimensionConfig[6] },
    { from: dimensionConfig[1], to: dimensionConfig[5] },
    { from: dimensionConfig[3], to: dimensionConfig[7] },
  ].map(link => ({
    ...link,
    isActive: link.from.level === currentDimension || link.to.level === currentDimension
  }));

  const quantumDimension = dimensionConfig[7]; // 7D Quantum

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#6366f1" />
      <directionalLight position={[0, 10, 5]} intensity={0.5} />

      {/* Topology grid */}
      <TopologyGrid />

      {/* Progression chain connections */}
      {progressionLinks.map((link, index) => (
        <ConnectionLine
          key={`progression-${index}`}
          from={link.from}
          to={link.to}
          isActive={link.isActive}
        />
      ))}

      {/* Topology cross-connections */}
      {topologyLinks.map((link, index) => (
        <ConnectionLine
          key={`topology-${index}`}
          from={link.from}
          to={link.to}
          isActive={link.isActive}
        />
      ))}

      {/* Dimension nodes */}
      {dimensionConfig.map((node) => (
        <DimensionNode
          key={node.id}
          node={node}
          isActive={node.level === currentDimension}
          onClick={() => onDimensionSelect(node.level)}
          evolutionCount={evolutionCounts[node.level] || 0}
        />
      ))}

      {/* Quantum Bloch Spheres around 7D Quantum dimension */}
      {qubits.map((qubit, index) => {
        const angle = (index / qubits.length) * Math.PI * 2;
        const radius = 1.5;
        const offsetX = quantumDimension.position[0] + Math.cos(angle) * radius;
        const offsetY = quantumDimension.position[1] + Math.sin(angle) * radius;
        const offsetZ = quantumDimension.position[2] + (index - qubits.length / 2) * 0.3;
        return (
          <BlochSphere
            key={qubit.id}
            qubit={qubit}
            position={[offsetX, offsetY, offsetZ]}
          />
        );
      })}

      {/* 3D Particles floating around dimensions */}
      {particles.map((particle) => (
        <Particle3DComponent key={particle.id} particle={particle} />
      ))}

      {/* Multiplayer Avatars */}
      {avatars.map((avatar) => {
        const dimensionNode = dimensionConfig[avatar.currentDimension];
        if (!dimensionNode) return null;
        
        const offsetX = dimensionNode.position[0] + (Math.random() - 0.5) * 1;
        const offsetY = dimensionNode.position[1] + 0.5;
        const offsetZ = dimensionNode.position[2] + (Math.random() - 0.5) * 1;
        
        return (
          <Avatar3DComponent
            key={avatar.id}
            avatar={{
              ...avatar,
              position: [offsetX, offsetY, offsetZ]
            }}
          />
        );
      })}

      {/* Evolution trail */}
      <EvolutionTrail events={evolutionEvents.slice(-20)} />

      {/* Selected node info panel */}
      {selectedNode && (
        <group position={[8, 4, 3]}>
          <Box args={[5, 3, 0.1]}>
            <meshStandardMaterial color="#1f2937" opacity={0.95} transparent />
          </Box>
          <Text
            position={[0, 1, 0.06]}
            fontSize={0.25}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {selectedNode.id}: {selectedNode.name}
          </Text>
          <Text
            position={[0, 0.4, 0.06]}
            fontSize={0.15}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
            maxWidth={4.5}
          >
            {selectedNode.churchEncoding}
          </Text>
          <Text
            position={[0, -0.2, 0.06]}
            fontSize={0.12}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
          >
            {evolutionCounts[selectedNode.level] || 0} evolutions
          </Text>
          <Text
            position={[0, -0.6, 0.06]}
            fontSize={0.1}
            color="#6366f1"
            anchorX="center"
            anchorY="middle"
          >
            Level {selectedNode.level}D
          </Text>
        </group>
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={40}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// Main component
interface WebGLMetaverseEvolutionProps {
  onOpenAIModal?: () => void;
  onDimensionChange?: (dimension: number) => void;
  onStatsUpdate?: (stats: {
    evolutionEvents: EvolutionEvent[];
    qubits: QubitState[];
    particles: Particle3D[];
    avatars: Avatar3D[];
    currentDimension: number;
    evolutionCounts: Record<number, number>;
  }) => void;
}

const WebGLMetaverseEvolution: React.FC<WebGLMetaverseEvolutionProps> = ({ 
  onOpenAIModal,
  onDimensionChange,
  onStatsUpdate
}) => {
  const { state } = useAutomatonState();
  const [currentDimension, setCurrentDimension] = useState(state.currentDimension || 0);
  const [selectedNode, setSelectedNode] = useState<DimensionNode3D | null>(null);
  const [evolutionEvents, setEvolutionEvents] = useState<EvolutionEvent[]>([]);
  const [evolutionCounts, setEvolutionCounts] = useState<Record<number, number>>({});
  
  // Quantum states
  const [qubits, setQubits] = useState<QubitState[]>([
    { id: 'q0', theta: Math.PI / 4, phi: 0, amplitude: { real: 0.707, imag: 0 }, probability: 0.5, label: '|0⟩' },
    { id: 'q1', theta: Math.PI / 2, phi: Math.PI / 2, amplitude: { real: 0, imag: 0.707 }, probability: 0.5, label: '|1⟩' },
    { id: 'q2', theta: Math.PI / 3, phi: Math.PI, amplitude: { real: 0.5, imag: 0.289 }, probability: 0.33, label: '|+⟩' },
  ]);
  
  // 3D Particles
  const [particles, setParticles] = useState<Particle3D[]>([]);
  
  // Multiplayer Avatars
  const [avatars, setAvatars] = useState<Avatar3D[]>([
    {
      id: 'avatar-1',
      userId: 'user-1',
      name: 'Alice',
      position: [0, 0, 0],
      color: '#ec4899',
      isSpeaking: false,
      currentDimension: 1
    },
    {
      id: 'avatar-2',
      userId: 'user-2',
      name: 'Bob',
      position: [0, 0, 0],
      color: '#10b981',
      isSpeaking: true,
      currentDimension: 2
    }
  ]);

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle3D[] = [];
    for (let i = 0; i < 30; i++) {
      const dimension = Math.floor(Math.random() * 8);
      const node = dimensionConfig[dimension];
      newParticles.push({
        id: `particle-${i}`,
        position: [
          node.position[0] + (Math.random() - 0.5) * 2,
          node.position[1] + (Math.random() - 0.5) * 2,
          node.position[2] + (Math.random() - 0.5) * 2
        ],
        velocity: [
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ],
        color: node.color,
        size: Math.random() * 0.1 + 0.05,
        life: 0,
        maxLife: Math.random() * 200 + 100
      });
    }
    setParticles(newParticles);
  }, []);

  // Update particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        life: p.life + 1,
        position: [
          p.position[0] + p.velocity[0],
          p.position[1] + p.velocity[1],
          p.position[2] + p.velocity[2]
        ] as [number, number, number]
      })).filter(p => p.life < p.maxLife));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Track dimension changes as evolution events
  useEffect(() => {
    if (state.currentDimension !== undefined && state.currentDimension !== currentDimension) {
      const newEvent: EvolutionEvent = {
        timestamp: Date.now(),
        dimension: state.currentDimension,
        type: 'progression',
        description: `Progressed to ${state.currentDimension}D`
      };
      
      setEvolutionEvents(prev => [...prev.slice(-49), newEvent]);
      setEvolutionCounts(prev => ({
        ...prev,
        [state.currentDimension]: (prev[state.currentDimension] || 0) + 1
      }));
      setCurrentDimension(state.currentDimension);
    }
  }, [state.currentDimension, currentDimension]);

  // Track iteration count as evolution
  useEffect(() => {
    if (state.iterationCount && state.iterationCount > 0) {
      const newEvent: EvolutionEvent = {
        timestamp: Date.now(),
        dimension: currentDimension,
        type: 'mutation',
        description: `Iteration ${state.iterationCount}`
      };
      
      setEvolutionEvents(prev => [...prev.slice(-49), newEvent]);
      setEvolutionCounts(prev => ({
        ...prev,
        [currentDimension]: (prev[currentDimension] || 0) + 1
      }));
    }
  }, [state.iterationCount, currentDimension]);

  // Track self-modifications
  useEffect(() => {
    if (state.selfModificationCount && state.selfModificationCount > 0) {
      const newEvent: EvolutionEvent = {
        timestamp: Date.now(),
        dimension: currentDimension,
        type: 'self-reference',
        description: `Self-modification #${state.selfModificationCount}`
      };
      
      setEvolutionEvents(prev => [...prev.slice(-49), newEvent]);
    }
  }, [state.selfModificationCount, currentDimension]);

  const handleDimensionSelect = (level: number) => {
    setCurrentDimension(level);
    setSelectedNode(dimensionConfig.find(node => node.level === level) || null);
    onDimensionChange?.(level);
  };

  // Update stats when they change
  useEffect(() => {
    onStatsUpdate?.({
      evolutionEvents,
      qubits,
      particles,
      avatars,
      currentDimension,
      evolutionCounts
    });
  }, [evolutionEvents, qubits, particles, avatars, currentDimension, evolutionCounts, onStatsUpdate]);

  // Initialize selected node
  useEffect(() => {
    setSelectedNode(dimensionConfig.find(node => node.level === currentDimension) || null);
  }, [currentDimension]);

  return (
    <div className="w-full h-full bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">3D Metaverse Portal</h3>
            <p className="text-xs text-gray-400 mt-1">Bridging Human NLP ↔ Automaton Metaverse ↔ WebLLM ↔ TinyML</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-green-600/20 border border-green-500 rounded text-xs text-green-300">
              {evolutionEvents.length} events
            </div>
            <div className="px-2 py-1 bg-blue-600/20 border border-blue-500 rounded text-xs text-blue-300">
              {qubits.length} qubits
            </div>
            <div className="px-2 py-1 bg-purple-600/20 border border-purple-500 rounded text-xs text-purple-300">
              {particles.length} particles
            </div>
            <div className="px-2 py-1 bg-pink-600/20 border border-pink-500 rounded text-xs text-pink-300">
              {avatars.length} users
            </div>
            {onOpenAIModal && (
              <button
                onClick={onOpenAIModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                title="AI Evolution Engine & Metrics"
              >
                <Brain className="w-4 h-4" />
                <span className="text-xs font-medium">AI Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced 3D Canvas with Unified Metaverse */}
      <div className="relative" style={{ height: '500px' }}>
        <Canvas
          camera={{ position: [10, 6, 12], fov: 60 }}
          gl={{ antialias: true }}
        >
          <EvolutionScene
            currentDimension={currentDimension}
            onDimensionSelect={handleDimensionSelect}
            selectedNode={selectedNode}
            evolutionEvents={evolutionEvents}
            evolutionCounts={evolutionCounts}
            qubits={qubits}
            particles={particles}
            avatars={avatars}
          />
        </Canvas>
      </div>

    </div>
  );
};

export default WebGLMetaverseEvolution;
