/**
 * Physics Layer Components
 * Abstract physics components that drive the simulation
 * - Particles: Environmental effects (wind, energy flows)
 * - Qubits: Quantum field simulation
 * - Dimension Nodes: Dimensional physics (gravity, field effects)
 * - Topology Grid: Spatial field calculations
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  metaversePhysicsService,
  ParticleState,
  QubitState,
  DimensionNodeState
} from '@/services/metaverse-physics-service';

// Particle Component - Environmental effects
export const PhysicsParticles: React.FC<{
  count?: number;
  enabled?: boolean;
}> = ({ count = 100, enabled = true }) => {
  const [particles, setParticles] = useState<ParticleState[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Initialize particles
    const newParticles: ParticleState[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle-${i}`,
        position: [
          (Math.random() - 0.5) * 40,
          Math.random() * 20,
          (Math.random() - 0.5) * 40
        ],
        velocity: [
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ],
        color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
        size: 0.1 + Math.random() * 0.2,
        life: 0,
        maxLife: 10 + Math.random() * 20
      });
      metaversePhysicsService.addParticle(newParticles[i]);
    }
    setParticles(newParticles);

    // Subscribe to physics updates
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      const state = metaversePhysicsService.getState();
      setParticles(Array.from(state.particles.values()));
    });

    return () => {
      unsubscribe();
    };
  }, [count, enabled]);

  if (!enabled) return null;

  return (
    <>
      {particles.map(particle => (
        <ParticleRenderer key={particle.id} particle={particle} />
      ))}
    </>
  );
};

const ParticleRenderer: React.FC<{ particle: ParticleState }> = ({ particle }) => {
  const opacity = 1 - (particle.life / particle.maxLife);
  
  return (
    <Sphere args={[particle.size, 8, 8]} position={particle.position}>
      <meshStandardMaterial
        color={particle.color}
        transparent
        opacity={opacity * 0.6}
        emissive={particle.color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

// Qubit Component - Quantum field simulation
export const PhysicsQubits: React.FC<{
  count?: number;
  enabled?: boolean;
}> = ({ count = 5, enabled = true }) => {
  const [qubits, setQubits] = useState<QubitState[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Initialize qubits around 7D quantum dimension node
    const quantumNode = Array.from(metaversePhysicsService.getState().dimensionNodes.values())
      .find(n => n.level === 7);
    
    if (!quantumNode) return;

    const newQubits: QubitState[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2;
      const qubit: QubitState = {
        id: `qubit-${i}`,
        theta: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
        phi: angle,
        amplitude: {
          real: Math.cos(angle),
          imag: Math.sin(angle)
        },
        probability: 0.5,
        label: `|${i}⟩`,
        position: [
          quantumNode.position[0] + Math.cos(angle) * radius,
          quantumNode.position[1] + 1,
          quantumNode.position[2] + Math.sin(angle) * radius
        ]
      };
      newQubits.push(qubit);
      metaversePhysicsService.addQubit(qubit);
    }
    setQubits(newQubits);

    // Subscribe to physics updates
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      const state = metaversePhysicsService.getState();
      setQubits(Array.from(state.qubits.values()));
    });

    return () => {
      unsubscribe();
    };
  }, [count, enabled]);

  if (!enabled) return null;

  return (
    <>
      {qubits.map(qubit => (
        <QubitRenderer key={qubit.id} qubit={qubit} />
      ))}
    </>
  );
};

const QubitRenderer: React.FC<{ qubit: QubitState }> = ({ qubit }) => {
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
    <group ref={meshRef} position={qubit.position}>
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

// Dimension Nodes Component - Dimensional physics
export const PhysicsDimensionNodes: React.FC<{
  enabled?: boolean;
}> = ({ enabled = true }) => {
  const [nodes, setNodes] = useState<DimensionNodeState[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const state = metaversePhysicsService.getState();
    setNodes(Array.from(state.dimensionNodes.values()));

    // Subscribe to physics updates
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      const updatedState = metaversePhysicsService.getState();
      setNodes(Array.from(updatedState.dimensionNodes.values()));
    });

    return () => {
      unsubscribe();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {nodes.map(node => (
        <DimensionNodeRenderer key={node.id} node={node} />
      ))}
    </>
  );
};

const DimensionNodeRenderer: React.FC<{ node: DimensionNodeState }> = ({ node }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Subtle pulsing animation
      const scale = 1 + Math.sin(Date.now() * 0.001 + node.level) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={meshRef} position={node.position}>
      {/* Gravity well visualization */}
      <Sphere args={[node.fieldRadius, 16, 16]}>
        <meshStandardMaterial
          color={node.color}
          transparent
          opacity={0.05}
          wireframe
        />
      </Sphere>
      
      {/* Core node */}
      <Sphere args={[0.5, 16, 16]}>
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Label */}
      <Text position={[0, 1.5, 0]} fontSize={0.2} color="white" anchorX="center">
        {node.name}
      </Text>
    </group>
  );
};

// Topology Grid Component - Spatial field visualization
export const PhysicsTopologyGrid: React.FC<{
  enabled?: boolean;
  showWireframe?: boolean;
}> = ({ enabled = true, showWireframe = false }) => {
  const [grid, setGrid] = useState<{ resolution: number; size: number; fieldStrength: number[][] } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const state = metaversePhysicsService.getState();
    setGrid(state.topologyGrid);

    // Subscribe to physics updates
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      const updatedState = metaversePhysicsService.getState();
      setGrid(updatedState.topologyGrid);
    });

    return () => {
      unsubscribe();
    };
  }, [enabled]);

  if (!enabled || !grid) return null;

  const { resolution, size, fieldStrength } = grid;
  const cellSize = size / resolution;

  return (
    <group>
      {showWireframe && (
        <>
          {Array.from({ length: resolution }).map((_, x) =>
            Array.from({ length: resolution }).map((_, z) => {
              const strength = fieldStrength[x][z];
              if (strength < 0.1) return null;
              
              const worldX = (x / resolution) * size - size / 2;
              const worldZ = (z / resolution) * size - size / 2;
              
              return (
                <mesh
                  key={`grid-${x}-${z}`}
                  position={[worldX, 0.1, worldZ]}
                >
                  <boxGeometry args={[cellSize, 0.1, cellSize]} />
                  <meshStandardMaterial
                    color="#6366f1"
                    transparent
                    opacity={strength * 0.3}
                  />
                </mesh>
              );
            })
          )}
        </>
      )}
    </group>
  );
};
