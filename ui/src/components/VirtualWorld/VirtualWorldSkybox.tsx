/**
 * Virtual World Skybox Component
 * Creates a 360° environment with texture or procedural sky support
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

export interface SkyboxConfig {
  type?: 'texture' | 'procedural'; // Sky type (default: 'procedural')
  textureUrl?: string; // 360° panorama texture URL
  skyColor?: string; // Sky color for procedural (default: '#87CEEB')
  sunPosition?: [number, number, number]; // Sun position (default: [0, 1, 0])
  cloudDensity?: number; // Cloud density 0-1 (default: 0.5)
  stars?: boolean; // Show stars (default: true)
  dayNightCycle?: boolean; // Enable day/night cycle (default: false)
  timeOfDay?: number; // Time of day 0-1 (0=midnight, 0.5=noon) (default: 0.5)
}

interface VirtualWorldSkyboxProps {
  config?: SkyboxConfig;
}

export const VirtualWorldSkybox: React.FC<VirtualWorldSkyboxProps> = ({
  config = {}
}) => {
  const skyRef = useRef<THREE.Mesh>(null);
  
  const {
    type = 'procedural',
    textureUrl,
    skyColor = '#87CEEB',
    sunPosition = [0, 1, 0],
    cloudDensity = 0.5,
    stars = true,
    dayNightCycle = false,
    timeOfDay = 0.5
  } = config;

  // Day/night cycle animation
  useFrame((state) => {
    if (dayNightCycle && skyRef.current) {
      // Rotate sun position based on time
      const time = (state.clock.elapsedTime / 60) % 1; // 60 second cycle
      const angle = time * Math.PI * 2;
      const sunY = Math.sin(angle);
      const sunX = Math.cos(angle);
      
      if (skyRef.current instanceof THREE.Mesh && skyRef.current.material) {
        const material = skyRef.current.material as any;
        if (material.sunPosition) {
          material.sunPosition.set(sunX, sunY, 0);
        }
      }
    }
  });

  // Procedural sky with sun
  if (type === 'procedural') {
    return (
      <group>
        <Sky
          ref={skyRef}
          distance={450000}
          sunPosition={sunPosition}
          turbidity={cloudDensity * 10}
          rayleigh={0.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
          inclination={0.49}
          azimuth={0.25}
        />
        {stars && <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />}
      </group>
    );
  }

  // Texture-based skybox
  if (type === 'texture' && textureUrl) {
    return <TextureSkybox textureUrl={textureUrl} />;
  }

  // Fallback: simple sky color
  return (
    <group>
      <mesh>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>
      {stars && <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />}
    </group>
  );
};

// Texture-based skybox component
const TextureSkybox: React.FC<{ textureUrl: string }> = ({ textureUrl }) => {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(textureUrl, undefined, undefined, (error) => {
      console.error('Failed to load skybox texture:', error);
    });
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }, [textureUrl]);

  return (
    <mesh>
      <sphereGeometry args={[500, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Atmospheric fog component
export const AtmosphericFog: React.FC<{
  color?: string;
  near?: number;
  far?: number;
}> = ({ color = '#87CEEB', near = 1, far = 100 }) => {
  return <fog attach="fog" args={[color, near, far]} />;
};
