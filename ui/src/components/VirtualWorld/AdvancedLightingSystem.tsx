/**
 * Advanced Lighting System V2
 * Enhanced lighting with volumetric lighting, dynamic lights, and service integration
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WorldLightingSystem, LightingConfig } from './WorldLightingSystem';
import { AdvancedShadows, CascadedShadowConfig, SoftShadowConfig } from './AdvancedShadows';
import { VolumetricLighting, VolumetricLightConfig } from './VolumetricLighting';
import { WeatherSystem, WeatherConfig, WeatherType } from './WeatherSystem';
import { PostProcessingSystem, PostProcessingConfig } from './PostProcessingSystem';
import { lightingService, DynamicLight } from '../../services/lighting-service';

export interface AdvancedLightingConfig extends LightingConfig {
  // Volumetric lighting
  volumetric?: VolumetricLightConfig;
  lightProbes?: Array<{ position: [number, number, number]; radius?: number }>;
  // Weather
  weather?: WeatherConfig;
  // Post-processing
  postProcessing?: PostProcessingConfig;
  // Dynamic lights
  dynamicLights?: DynamicLight[];
  // Advanced shadows
  cascadedShadows?: CascadedShadowConfig;
  softShadows?: SoftShadowConfig;
  shadowBias?: number;
  // Service integration
  enableServiceSync?: boolean;
}

interface AdvancedLightingSystemProps {
  config?: AdvancedLightingConfig;
}

export const AdvancedLightingSystem: React.FC<AdvancedLightingSystemProps> = ({
  config = {}
}) => {
  const {
    volumetric,
    lightProbes = [],
    weather,
    postProcessing,
    dynamicLights = [],
    cascadedShadows = false,
    softShadows = true,
    shadowBias = -0.0001,
    enableServiceSync = true,
    ...lightingConfig
  } = config;

  const [serviceLights, setServiceLights] = useState<DynamicLight[]>([]);
  const [serviceWeather, setServiceWeather] = useState<WeatherConfig | null>(null);
  const [servicePostProcessing, setServicePostProcessing] = useState<PostProcessingConfig | null>(null);

  // Service sync
  useEffect(() => {
    if (!enableServiceSync) return;

    // Register dynamic lights
    dynamicLights.forEach(light => {
      lightingService.addLight(light);
    });

    // Listen for updates
    const handleLightAdd = (light: DynamicLight) => {
      setServiceLights(prev => [...prev, light]);
    };

    const handleLightUpdate = (light: DynamicLight) => {
      setServiceLights(prev => prev.map(l => l.id === light.id ? light : l));
    };

    const handleLightRemove = (lightId: string) => {
      setServiceLights(prev => prev.filter(l => l.id !== lightId));
    };

    const handleWeatherChange = (weatherType: WeatherType, intensity: number) => {
      setServiceWeather({ type: weatherType, intensity, enabled: true });
    };

    const handlePostProcessingChange = (config: PostProcessingConfig) => {
      setServicePostProcessing(config);
    };

    lightingService.on('light:add', handleLightAdd);
    lightingService.on('light:update', handleLightUpdate);
    lightingService.on('light:remove', handleLightRemove);
    lightingService.on('weather:change', handleWeatherChange);
    lightingService.on('postprocessing:change', handlePostProcessingChange);

    return () => {
      lightingService.off('light:add', handleLightAdd);
      lightingService.off('light:update', handleLightUpdate);
      lightingService.off('light:remove', handleLightRemove);
      lightingService.off('weather:change', handleWeatherChange);
      lightingService.off('postprocessing:change', handlePostProcessingChange);
    };
  }, [enableServiceSync, dynamicLights]);

  // Use service state if available
  const effectiveWeather = serviceWeather || weather;
  const effectivePostProcessing = servicePostProcessing || postProcessing;
  const effectiveDynamicLights = [...serviceLights, ...dynamicLights];

  return (
    <>
      {/* Base lighting system */}
      <WorldLightingSystemWrapper
        config={lightingConfig}
        cascadedShadows={cascadedShadows}
        softShadows={softShadows}
      />

      {/* Volumetric lighting */}
      {volumetric && (
        <VolumetricLighting
          config={volumetric}
          lightProbes={lightProbes.map(probe => ({
            position: probe.position,
            radius: probe.radius,
            resolution: 9,
            updateInterval: 60
          }))}
        />
      )}

      {/* Dynamic lights */}
      {effectiveDynamicLights.map(light => (
        <DynamicLightComponent
          key={light.id}
          light={light}
          softShadows={softShadows}
          shadowBias={shadowBias}
        />
      ))}

      {/* Weather system */}
      {effectiveWeather && (
        <WeatherSystem config={effectiveWeather} />
      )}

      {/* Post-processing */}
      {effectivePostProcessing && (
        <PostProcessingSystem config={effectivePostProcessing} />
      )}
    </>
  );
};

// Dynamic light component
const DynamicLightComponent: React.FC<{
  light: DynamicLight;
  softShadows: boolean;
  shadowBias: number;
}> = ({ light, softShadows, shadowBias }) => {
  const lightRef = useRef<THREE.Light>(null);

  useFrame(() => {
    // Light animations are handled by lighting service
  });

  const commonProps = {
    color: light.color,
    intensity: light.intensity,
    castShadow: light.castShadow || false
  };

  switch (light.type) {
    case 'point':
      return (
        <pointLight
          ref={lightRef as any}
          position={light.position || [0, 0, 0]}
          distance={light.distance || 10}
          decay={light.decay || 2}
          {...commonProps}
        />
      );

    case 'directional':
      return (
        <directionalLight
          ref={lightRef as any}
          position={light.position || [0, 10, 0]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={shadowBias}
          {...commonProps}
        />
      );

    case 'spot':
      return (
        <spotLight
          ref={lightRef as any}
          position={light.position || [0, 10, 0]}
          angle={light.angle || Math.PI / 6}
          penumbra={light.penumbra || 0.1}
          distance={light.distance || 10}
          decay={light.decay || 2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={shadowBias}
          {...commonProps}
        />
      );

    case 'ambient':
      return (
        <ambientLight
          ref={lightRef as any}
          {...commonProps}
        />
      );

    default:
      return null;
  }
};

// Wrapper for WorldLightingSystem with advanced shadows
const WorldLightingSystemWrapper: React.FC<{
  config: LightingConfig;
  cascadedShadows?: CascadedShadowConfig;
  softShadows?: SoftShadowConfig;
}> = ({ config, cascadedShadows, softShadows }) => {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <WorldLightingSystem config={config} />
      {sunRef.current && (cascadedShadows || softShadows) && (
        <AdvancedShadows
          cascaded={cascadedShadows}
          soft={softShadows}
          light={sunRef.current}
        />
      )}
    </>
  );
};

// Re-export WorldLightingSystem for compatibility
export { WorldLightingSystem } from './WorldLightingSystem';
