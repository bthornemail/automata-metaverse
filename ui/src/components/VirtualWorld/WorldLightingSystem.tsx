/**
 * World Lighting System
 * Advanced lighting with directional light, shadows, and day/night cycle
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface LightingConfig {
  type?: 'day' | 'night' | 'cycle'; // Lighting mode
  sunPosition?: [number, number, number]; // Sun position
  sunIntensity?: number; // Sun light intensity
  ambientIntensity?: number; // Ambient light intensity
  shadowMapSize?: number; // Shadow map resolution
  enableShadows?: boolean; // Enable shadow casting
  timeOfDay?: number; // Time of day 0-1 (0=midnight, 0.5=noon)
  cycleSpeed?: number; // Day/night cycle speed multiplier
}

interface WorldLightingSystemProps {
  config?: LightingConfig;
}

export const WorldLightingSystem: React.FC<WorldLightingSystemProps> = ({
  config = {}
}) => {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  
  const {
    type = 'day',
    sunPosition = [10, 10, 5],
    sunIntensity = 1,
    ambientIntensity = 0.6,
    shadowMapSize = 2048,
    enableShadows = true,
    timeOfDay = 0.5,
    cycleSpeed = 1
  } = config;

  // Day/night cycle
  const [currentTime, setCurrentTime] = React.useState(timeOfDay);

  useFrame((state) => {
    if (type === 'cycle' && sunRef.current && ambientRef.current) {
      // Update time based on cycle speed
      const newTime = (state.clock.elapsedTime * cycleSpeed * 0.001) % 1;
      setCurrentTime(newTime);

      // Calculate sun position based on time
      const angle = newTime * Math.PI * 2;
      const sunY = Math.sin(angle);
      const sunX = Math.cos(angle);
      const sunZ = Math.sin(angle * 0.5) * 0.5;

      // Update sun position
      sunRef.current.position.set(sunX * 20, sunY * 20, sunZ * 20);
      sunRef.current.lookAt(0, 0, 0);

      // Adjust intensities based on time
      const dayFactor = Math.max(0, Math.sin(angle));
      sunRef.current.intensity = sunIntensity * dayFactor;
      ambientRef.current.intensity = ambientIntensity * (0.3 + dayFactor * 0.7);

      // Update sun color (warmer at sunset/sunrise)
      const sunColor = new THREE.Color();
      if (dayFactor > 0.3) {
        sunColor.setRGB(1, 1, 0.95); // Daylight
      } else if (dayFactor > 0.1) {
        sunColor.setRGB(1, 0.7, 0.5); // Sunset/sunrise
      } else {
        sunColor.setRGB(0.3, 0.3, 0.5); // Night
      }
      sunRef.current.color.copy(sunColor);
    } else if (type === 'night') {
      // Night mode
      if (sunRef.current) {
        sunRef.current.intensity = sunIntensity * 0.1;
        sunRef.current.color.setRGB(0.2, 0.2, 0.3);
      }
      if (ambientRef.current) {
        ambientRef.current.intensity = ambientIntensity * 0.3;
      }
    }
  });

  // Calculate sun position for static modes
  const staticSunPosition = useMemo(() => {
    if (type === 'day') {
      return sunPosition;
    } else if (type === 'night') {
      return [sunPosition[0] * -1, sunPosition[1] * -1, sunPosition[2]] as [number, number, number];
    }
    return sunPosition;
  }, [type, sunPosition]);

  return (
    <>
      {/* Ambient light */}
      <ambientLight
        ref={ambientRef}
        intensity={ambientIntensity}
        color="#ffffff"
      />

      {/* Directional light (sun) */}
      <directionalLight
        ref={sunRef}
        position={staticSunPosition}
        intensity={sunIntensity}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
      />

      {/* Additional point lights for atmosphere */}
      <pointLight
        position={[-10, 5, -10]}
        intensity={0.3}
        color="#6366f1"
        distance={50}
      />
      <pointLight
        position={[10, 5, 10]}
        intensity={0.3}
        color="#8b5cf6"
        distance={50}
      />

      {/* Moon light for night */}
      {type === 'night' || type === 'cycle' ? (
        <directionalLight
          position={[-sunPosition[0], -sunPosition[1], sunPosition[2]]}
          intensity={0.2}
          color="#b0c4de"
        />
      ) : null}
    </>
  );
};

// Hemisphere light for sky lighting
export const SkyLighting: React.FC<{
  skyColor?: string;
  groundColor?: string;
  intensity?: number;
}> = ({ skyColor = '#87ceeb', groundColor = '#4a5568', intensity = 0.5 }) => {
  return (
    <hemisphereLight
      skyColor={skyColor}
      groundColor={groundColor}
      intensity={intensity}
    />
  );
};

// Point light for building interiors
export const InteriorLighting: React.FC<{
  position: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
}> = ({ position, color = '#ffd700', intensity = 1, distance = 10 }) => {
  return (
    <pointLight
      position={position}
      color={color}
      intensity={intensity}
      distance={distance}
      castShadow
    />
  );
};
