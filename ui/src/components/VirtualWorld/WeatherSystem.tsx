/**
 * Weather System Component
 * Rain, snow, fog, clouds, and other weather effects
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'cloudy';

export interface WeatherConfig {
  type: WeatherType;
  intensity?: number; // 0-1
  windSpeed?: number;
  windDirection?: [number, number, number];
  particleCount?: number;
  enabled?: boolean;
}

interface WeatherSystemProps {
  config?: WeatherConfig;
  onWeatherChange?: (weather: WeatherType) => void;
}

export const WeatherSystem: React.FC<WeatherSystemProps> = ({
  config = { type: 'clear', enabled: false },
  onWeatherChange
}) => {
  const { type, intensity = 0.5, windSpeed = 1, windDirection = [0, 0, -1], particleCount = 1000, enabled = false } = config;

  if (!enabled || type === 'clear') {
    return null;
  }

  return (
    <>
      {type === 'rain' && (
        <RainEffect
          intensity={intensity}
          windSpeed={windSpeed}
          windDirection={windDirection}
          particleCount={particleCount}
        />
      )}
      {type === 'snow' && (
        <SnowEffect
          intensity={intensity}
          windSpeed={windSpeed}
          windDirection={windDirection}
          particleCount={particleCount}
        />
      )}
      {type === 'fog' && (
        <FogEffect intensity={intensity} />
      )}
      {type === 'storm' && (
        <>
          <RainEffect
            intensity={intensity * 1.5}
            windSpeed={windSpeed * 2}
            windDirection={windDirection}
            particleCount={particleCount * 2}
          />
          <LightningEffect intensity={intensity} />
        </>
      )}
      {type === 'cloudy' && (
        <CloudEffect intensity={intensity} />
      )}
    </>
  );
};

// Rain effect
const RainEffect: React.FC<{
  intensity: number;
  windSpeed: number;
  windDirection: [number, number, number];
  particleCount: number;
}> = ({ intensity, windSpeed, windDirection, particleCount }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions above world
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      // Rain velocity (downward + wind)
      velocities[i * 3] = windDirection[0] * windSpeed * 0.1;
      velocities[i * 3 + 1] = -5 * intensity; // Fall speed
      velocities[i * 3 + 2] = windDirection[2] * windSpeed * 0.1;
    }
    
    return { positions, velocities };
  }, [particleCount, windSpeed, windDirection, intensity]);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Update positions
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Reset if below ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = (Math.random() - 0.5) * 200;
          positions[i * 3 + 1] = 50 + Math.random() * 20;
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
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#87ceeb"
        size={0.1 * intensity}
        transparent
        opacity={0.6 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Snow effect
const SnowEffect: React.FC<{
  intensity: number;
  windSpeed: number;
  windDirection: [number, number, number];
  particleCount: number;
}> = ({ intensity, windSpeed, windDirection, particleCount }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      // Snow velocity (slower, more floaty)
      velocities[i * 3] = windDirection[0] * windSpeed * 0.05;
      velocities[i * 3 + 1] = -1 * intensity; // Slow fall
      velocities[i * 3 + 2] = windDirection[2] * windSpeed * 0.05;
    }
    
    return { positions, velocities };
  }, [particleCount, windSpeed, windDirection, intensity]);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Update positions with slight sway
        positions[i * 3] += particles.velocities[i * 3] + Math.sin(state.clock.elapsedTime + i) * 0.01;
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2] + Math.cos(state.clock.elapsedTime + i) * 0.01;
        
        // Reset if below ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = (Math.random() - 0.5) * 200;
          positions[i * 3 + 1] = 50 + Math.random() * 20;
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
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.2 * intensity}
        transparent
        opacity={0.8 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Fog effect (enhanced)
const FogEffect: React.FC<{
  intensity: number;
}> = ({ intensity }) => {
  return (
    <fogExp2
      attach="fog"
      args={['#b0b0b0', intensity * 0.05]}
    />
  );
};

// Lightning effect
const LightningEffect: React.FC<{
  intensity: number;
}> = ({ intensity }) => {
  const flashRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flashRef.current && flashRef.current.material) {
      const material = Array.isArray(flashRef.current.material) 
        ? flashRef.current.material[0] 
        : flashRef.current.material;
      if (material && 'opacity' in material) {
        // Random lightning flashes
        if (Math.random() < 0.01 * intensity) {
          material.opacity = 0.3;
        } else {
          material.opacity = Math.max(0, (material.opacity as number) - 0.1);
        }
      }
    }
  });

  return (
    <mesh ref={flashRef}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Cloud effect
const CloudEffect: React.FC<{
  intensity: number;
}> = ({ intensity }) => {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cloudsRef.current) {
      // Slow cloud movement
      cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 10;
      cloudsRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 10;
    }
  });

  return (
    <group ref={cloudsRef} position={[0, 30, 0]}>
      {Array.from({ length: Math.floor(intensity * 10) }).map((_, i) => (
        <Cloud
          key={i}
          position={[
            (Math.random() - 0.5) * 100,
            Math.random() * 10,
            (Math.random() - 0.5) * 100
          ]}
          scale={5 + Math.random() * 5}
        />
      ))}
    </group>
  );
};

// Individual cloud
const Cloud: React.FC<{
  position: [number, number, number];
  scale: number;
}> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 2
          ]}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};
