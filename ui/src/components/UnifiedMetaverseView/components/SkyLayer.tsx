/**
 * Sky Layer Component
 * Positions abstract physics components (particles, qubits, dimension nodes) high in the sky
 * Renders them as stars/constellations while maintaining physics simulation
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  metaversePhysicsService,
  ParticleState,
  QubitState,
  DimensionNodeState
} from '@/services/metaverse-physics-service';

interface SkyLayerProps {
  enabled?: boolean;
  skyHeight?: number; // Y position for sky layer (default: 50-100)
  particleCount?: number;
  qubitCount?: number;
  showDimensionNodes?: boolean;
}

// Sky-positioned particles (stars)
const SkyParticles: React.FC<{
  particles: ParticleState[];
  skyHeight: number;
}> = ({ particles, skyHeight }) => {
  return (
    <>
      {particles.map(particle => {
        // Position particles in sky
        const skyPosition: [number, number, number] = [
          particle.position[0],
          skyHeight + 20 + (particle.position[1] % 30), // Spread vertically in sky
          particle.position[2]
        ];
        const opacity = 1 - (particle.life / particle.maxLife);
        
        return (
          <Sphere key={particle.id} args={[particle.size * 2, 8, 8]} position={skyPosition}>
            <meshStandardMaterial
              color={particle.color}
              transparent
              opacity={opacity * 0.8}
              emissive={particle.color}
              emissiveIntensity={0.8}
            />
          </Sphere>
        );
      })}
    </>
  );
};

// Sky-positioned qubits (constellation points)
const SkyQubits: React.FC<{
  qubits: QubitState[];
  skyHeight: number;
}> = ({ qubits, skyHeight }) => {
  return (
    <>
      {qubits.map(qubit => {
        // Position qubits in sky, spread out
        const angle = qubit.phi;
        const radius = 15 + (qubit.theta * 5);
        const skyPosition: [number, number, number] = [
          Math.cos(angle) * radius,
          skyHeight + 30 + Math.sin(qubit.theta) * 10,
          Math.sin(angle) * radius
        ];
        
        const x = Math.sin(qubit.theta) * Math.cos(qubit.phi);
        const y = Math.sin(qubit.theta) * Math.sin(qubit.phi);
        const z = Math.cos(qubit.theta);

        return (
          <group key={qubit.id} position={skyPosition}>
            {/* Constellation point - brighter star */}
            <Sphere args={[0.3, 16, 16]}>
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#06b6d4"
                emissiveIntensity={1.0}
              />
            </Sphere>
            
            {/* Quantum state vector (subtle line) */}
            <Line
              points={[[0, 0, 0], [x * 0.5, y * 0.5, z * 0.5]]}
              color="#f59e0b"
              lineWidth={1}
              transparent
              opacity={0.5}
            />
            
            {/* Constellation connection lines (connect nearby qubits) */}
            {qubits.filter(q => {
              const dist = Math.sqrt(
                Math.pow(qubit.position[0] - q.position[0], 2) +
                Math.pow(qubit.position[1] - q.position[1], 2) +
                Math.pow(qubit.position[2] - q.position[2], 2)
              );
              return dist < 5 && q.id !== qubit.id;
            }).map(nearbyQubit => {
              const nearbyAngle = nearbyQubit.phi;
              const nearbyRadius = 15 + (nearbyQubit.theta * 5);
              const nearbyPosition: [number, number, number] = [
                Math.cos(nearbyAngle) * nearbyRadius,
                skyHeight + 30 + Math.sin(nearbyQubit.theta) * 10,
                Math.sin(nearbyAngle) * nearbyRadius
              ];
              
              return (
                <Line
                  key={`connection-${nearbyQubit.id}`}
                  points={[[0, 0, 0], [
                    nearbyPosition[0] - skyPosition[0],
                    nearbyPosition[1] - skyPosition[1],
                    nearbyPosition[2] - skyPosition[2]
                  ]]}
                  color="#6366f1"
                  lineWidth={0.5}
                  transparent
                  opacity={0.3}
                />
              );
            })}
          </group>
        );
      })}
    </>
  );
};

// Sky-positioned dimension nodes (major stars/constellations)
const SkyDimensionNodes: React.FC<{
  nodes: DimensionNodeState[];
  skyHeight: number;
}> = ({ nodes, skyHeight }) => {
  return (
    <>
      {nodes.map(node => {
        // Position dimension nodes in sky, arranged in a spiral
        const angle = (node.level / 8) * Math.PI * 2;
        const radius = 20 + node.level * 3;
        const skyPosition: [number, number, number] = [
          Math.cos(angle) * radius,
          skyHeight + 40 + node.level * 5,
          Math.sin(angle) * radius
        ];
        
        return (
          <group key={node.id} position={skyPosition}>
            {/* Constellation center - bright star */}
            <Sphere args={[0.8, 16, 16]}>
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={1.2}
              />
            </Sphere>
            
            {/* Constellation ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 2, 32]} />
              <meshBasicMaterial
                color={node.color}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* Label */}
            <Text
              position={[0, 2, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              {node.name}
            </Text>
            
            {/* Connection lines to nearby nodes */}
            {nodes.filter(n => {
              const dist = Math.abs(n.level - node.level);
              return dist === 1; // Connect to adjacent dimensions
            }).map(adjacentNode => {
              const adjAngle = (adjacentNode.level / 8) * Math.PI * 2;
              const adjRadius = 20 + adjacentNode.level * 3;
              const adjPosition: [number, number, number] = [
                Math.cos(adjAngle) * adjRadius,
                skyHeight + 40 + adjacentNode.level * 5,
                Math.sin(adjAngle) * adjRadius
              ];
              
              return (
                <Line
                  key={`dimension-connection-${adjacentNode.id}`}
                  points={[[0, 0, 0], [
                    adjPosition[0] - skyPosition[0],
                    adjPosition[1] - skyPosition[1],
                    adjPosition[2] - skyPosition[2]
                  ]]}
                  color={node.color}
                  lineWidth={1}
                  transparent
                  opacity={0.4}
                />
              );
            })}
          </group>
        );
      })}
    </>
  );
};

export const SkyLayer: React.FC<SkyLayerProps> = ({
  enabled = true,
  skyHeight = 75, // Default sky height
  particleCount = 100,
  qubitCount = 5,
  showDimensionNodes = true
}) => {
  const [particles, setParticles] = useState<ParticleState[]>([]);
  const [qubits, setQubits] = useState<QubitState[]>([]);
  const [dimensionNodes, setDimensionNodes] = useState<DimensionNodeState[]>([]);
  const starsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to physics updates
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      const state = metaversePhysicsService.getState();
      setParticles(Array.from(state.particles.values()));
      setQubits(Array.from(state.qubits.values()));
      setDimensionNodes(Array.from(state.dimensionNodes.values()));
    });

    // Initial state
    const state = metaversePhysicsService.getState();
    setParticles(Array.from(state.particles.values()));
    setQubits(Array.from(state.qubits.values()));
    setDimensionNodes(Array.from(state.dimensionNodes.values()));

    return () => {
      unsubscribe();
    };
  }, [enabled]);

  // Animate stars rotation
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  if (!enabled) return null;

  return (
    <group>
      {/* Background stars */}
      <Stars
        ref={starsRef}
        radius={300}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Sky-positioned particles (stars) */}
      <SkyParticles particles={particles} skyHeight={skyHeight} />

      {/* Sky-positioned qubits (constellation points) */}
      <SkyQubits qubits={qubits} skyHeight={skyHeight} />

      {/* Sky-positioned dimension nodes (major constellations) */}
      {showDimensionNodes && (
        <SkyDimensionNodes nodes={dimensionNodes} skyHeight={skyHeight} />
      )}
    </group>
  );
};
