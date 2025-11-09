/**
 * Advanced Shadow System
 * Cascaded shadows, soft shadows, and shadow optimization
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CascadedShadowConfig {
  enabled?: boolean;
  splits?: number; // Number of cascade splits
  near?: number;
  far?: number;
  bias?: number;
  normalBias?: number;
  radius?: number; // Blur radius
}

export interface SoftShadowConfig {
  enabled?: boolean;
  radius?: number; // Soft shadow radius
  samples?: number; // Number of samples for soft shadows
}

interface AdvancedShadowsProps {
  cascaded?: CascadedShadowConfig;
  soft?: SoftShadowConfig;
  light: THREE.DirectionalLight;
}

export const AdvancedShadows: React.FC<AdvancedShadowsProps> = ({
  cascaded,
  soft,
  light
}) => {
  const { gl } = useThree();

  // Configure shadow map type
  useEffect(() => {
    if (soft?.enabled) {
      // Use PCFSoftShadowMap for soft shadows
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      // Use PCFShadowMap for hard shadows
      gl.shadowMap.type = THREE.PCFShadowMap;
    }
  }, [gl, soft?.enabled]);

  // Configure shadow properties
  useEffect(() => {
    if (light.shadow) {
      // Soft shadow configuration
      if (soft?.enabled) {
        light.shadow.radius = soft.radius || 4;
      }

      // Cascaded shadow configuration (simplified)
      if (cascaded?.enabled) {
        light.shadow.bias = cascaded.bias || -0.0001;
        light.shadow.normalBias = cascaded.normalBias || 0;
        
        // Adjust shadow camera for cascaded shadows
        const shadowCamera = light.shadow.camera as THREE.OrthographicCamera;
        if (shadowCamera) {
          shadowCamera.near = cascaded.near || 0.5;
          shadowCamera.far = cascaded.far || 100;
        }
      }
    }
  }, [light, cascaded, soft]);

  return null;
};

// Shadow caster helper
export const ShadowCaster: React.FC<{
  children: React.ReactNode;
  castShadow?: boolean;
  receiveShadow?: boolean;
}> = ({ children, castShadow = true, receiveShadow = true }) => {
  return (
    <group castShadow={castShadow} receiveShadow={receiveShadow}>
      {children}
    </group>
  );
};

// Shadow optimization helper
export const optimizeShadows = (
  objects: THREE.Object3D[],
  camera: THREE.Camera,
  maxDistance: number = 50
): void => {
  objects.forEach(obj => {
    const distance = camera.position.distanceTo(obj.position);
    if (distance > maxDistance) {
      // Disable shadows for distant objects
      obj.traverse((child: any) => {
        if (child.castShadow !== undefined) {
          child.castShadow = false;
        }
      });
    } else {
      // Enable shadows for nearby objects
      obj.traverse((child: any) => {
        if (child.castShadow !== undefined) {
          child.castShadow = true;
        }
      });
    }
  });
};
