/**
 * Virtual World Scene Component
 * Main scene component integrating terrain, skybox, and world layout
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VirtualWorldTerrain, TerrainConfig } from './VirtualWorldTerrain';
import { VirtualWorldSkybox, SkyboxConfig, AtmosphericFog } from './VirtualWorldSkybox';
import { WorldLayoutProvider, useWorldLayout } from './WorldLayoutManager';
import * as THREE from 'three';

export interface VirtualWorldSceneConfig {
  terrain?: TerrainConfig;
  skybox?: SkyboxConfig;
  fog?: {
    color?: string;
    near?: number;
    far?: number;
  };
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  enableControls?: boolean;
}

interface VirtualWorldSceneProps {
  config?: VirtualWorldSceneConfig;
  children?: React.ReactNode;
}

// Inner scene component that uses the layout context
const SceneContent: React.FC<{
  config?: VirtualWorldSceneConfig;
  children?: React.ReactNode;
}> = ({ config, children }) => {
  const { layout } = useWorldLayout();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {/* Skybox */}
      <VirtualWorldSkybox config={config?.skybox} />
      
      {/* Atmospheric fog */}
      {config?.fog && (
        <AtmosphericFog
          color={config.fog.color}
          near={config.fog.near}
          far={config.fog.far}
        />
      )}
      
      {/* Terrain */}
      <VirtualWorldTerrain config={config?.terrain} />
      
      {/* Zone visualization (debug) */}
      {import.meta.env.DEV && (
        <ZoneVisualization />
      )}
      
      {/* Children components (avatars, buildings, etc.) */}
      {children}
      
      {/* Camera controls */}
      {config?.enableControls !== false && (
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={200}
          enablePan
          enableZoom
          enableRotate
        />
      )}
    </>
  );
};

// Zone visualization for debugging
const ZoneVisualization: React.FC = () => {
  const { layout } = useWorldLayout();

  return (
    <>
      {layout.zones.map(zone => {
        const { min, max } = zone.bounds;
        const width = max[0] - min[0];
        const height = max[1] - min[1];
        const depth = max[2] - min[2];
        const center: [number, number, number] = [
          (min[0] + max[0]) / 2,
          (min[1] + max[1]) / 2,
          (min[2] + max[2]) / 2
        ];

        return (
          <mesh key={zone.id} position={center}>
            <boxGeometry args={[width, height, depth]} />
            <meshBasicMaterial
              color={zone.color}
              opacity={0.1}
              transparent
              wireframe
            />
          </mesh>
        );
      })}
    </>
  );
};

export const VirtualWorldScene: React.FC<VirtualWorldSceneProps> = ({
  config,
  children
}) => {
  const cameraConfig = config?.camera || {
    position: [0, 15, 25] as [number, number, number],
    fov: 75
  };

  return (
    <WorldLayoutProvider>
      <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '400px' }}>
        <Canvas
          camera={{
            position: cameraConfig.position,
            fov: cameraConfig.fov
          }}
          gl={{
            antialias: true
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <SceneContent config={config}>
            {children}
          </SceneContent>
        </Canvas>
      </div>
    </WorldLayoutProvider>
  );
};

// Export WorldLayoutProvider for components that need context outside Canvas
export { WorldLayoutProvider } from './WorldLayoutManager';
