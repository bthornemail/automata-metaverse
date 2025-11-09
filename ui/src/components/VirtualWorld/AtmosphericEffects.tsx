/**
 * Atmospheric Effects Component
 * Fog, particles, and post-processing effects
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface AtmosphericEffectsConfig {
  fog?: {
    type?: 'linear' | 'exponential';
    color?: string;
    near?: number;
    far?: number;
    density?: number;
  };
  particles?: {
    enabled?: boolean;
    count?: number;
    color?: string;
    size?: number;
  };
}

interface AtmosphericEffectsProps {
  config?: AtmosphericEffectsConfig;
}

export const AtmosphericEffects: React.FC<AtmosphericEffectsProps> = ({
  config = {}
}) => {
  const {
    fog = { type: 'linear', color: '#87CEEB', near: 1, far: 100 },
    particles = { enabled: false, count: 1000, color: '#ffffff', size: 0.02 }
  } = config;

  return (
    <>
      {/* Fog */}
      {fog.type === 'linear' ? (
        <fog attach="fog" args={[fog.color, fog.near, fog.far]} />
      ) : (
        <fogExp2 attach="fog" args={[fog.color, fog.density || 0.01]} />
      )}

      {/* Particles */}
      {particles.enabled && (
        <ParticleSystem
          count={particles.count || 1000}
          color={particles.color || '#ffffff'}
          size={particles.size || 0.02}
        />
      )}
    </>
  );
};

// Particle system component
const ParticleSystem: React.FC<{
  count: number;
  color: string;
  size: number;
}> = ({ count, color, size }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Random positions
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = Math.random() * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        // Update positions
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Reset if out of bounds
        if (Math.abs(positions[i * 3]) > 100) {
          positions[i * 3] = (Math.random() - 0.5) * 200;
        }
        if (positions[i * 3 + 1] > 50 || positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = Math.random() * 50;
        }
        if (Math.abs(positions[i * 3 + 2]) > 100) {
          positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Post-processing effects (requires @react-three/postprocessing)
// Note: This is a placeholder - actual implementation would use postprocessing library
export const PostProcessingEffects: React.FC<{
  bloom?: boolean;
  toneMapping?: boolean;
}> = ({ bloom = false, toneMapping = false }) => {
  // Post-processing would be implemented here using @react-three/postprocessing
  // For now, this is a placeholder
  return null;
};
