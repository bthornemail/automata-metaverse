/**
 * Performance Optimizer
 * LOD, frustum culling, object pooling, and performance optimizations
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldService, WorldSettings } from '../../services/world-service';

export interface PerformanceOptimizerConfig {
  enableLOD?: boolean;
  enableFrustumCulling?: boolean;
  enableObjectPooling?: boolean;
  lodDistances?: {
    near: number;
    medium: number;
    far: number;
  };
  maxObjects?: number;
  cullDistance?: number;
}

interface PerformanceOptimizerProps {
  config?: PerformanceOptimizerConfig;
  children: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  config = {},
  children
}) => {
  const { camera, gl } = useThree();
  const settings = worldService.getSettings();
  
  const {
    enableLOD = settings.enableLOD ?? true,
    enableFrustumCulling = settings.enableFrustumCulling ?? true,
    enableObjectPooling = settings.enableObjectPooling ?? true,
    lodDistances = {
      near: 20,
      medium: 50,
      far: 100
    },
    maxObjects = settings.maxAvatars ?? 50,
    cullDistance = 200
  } = config;

  // LOD system
  const lodSystem = useRef<Map<string, THREE.LOD>>(new Map());

  // Frustum culling
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  // Object pool
  const objectPool = useRef<Map<string, THREE.Object3D[]>>(new Map());

  // Update frustum
  useFrame(() => {
    if (enableFrustumCulling) {
      matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(matrix);
    }
  });

  // Get object from pool
  const getFromPool = (type: string, createFn: () => THREE.Object3D): THREE.Object3D => {
    if (!enableObjectPooling) {
      return createFn();
    }

    if (!objectPool.current.has(type)) {
      objectPool.current.set(type, []);
    }

    const pool = objectPool.current.get(type)!;
    const obj = pool.pop() || createFn();
    return obj;
  };

  // Return object to pool
  const returnToPool = (type: string, obj: THREE.Object3D): void => {
    if (!enableObjectPooling) return;

    if (!objectPool.current.has(type)) {
      objectPool.current.set(type, []);
    }

    const pool = objectPool.current.get(type)!;
    if (pool.length < maxObjects) {
      obj.visible = false;
      pool.push(obj);
    }
  };

  // LOD helper
  const createLOD = (id: string, objects: { distance: number; object: THREE.Object3D }[]): THREE.LOD => {
    if (!enableLOD) {
      return objects[0]?.object as any;
    }

    if (lodSystem.current.has(id)) {
      return lodSystem.current.get(id)!;
    }

    const lod = new THREE.LOD();
    objects.forEach(({ distance, object }) => {
      lod.addLevel(object, distance);
    });

    lodSystem.current.set(id, lod);
    return lod;
  };

  // Cull objects outside frustum
  const cullObject = (object: THREE.Object3D): boolean => {
    if (!enableFrustumCulling) return true;

    const distance = camera.position.distanceTo(object.position);
    if (distance > cullDistance) {
      object.visible = false;
      return false;
    }

    const box = new THREE.Box3().setFromObject(object);
    const visible = frustum.intersectsBox(box);
    object.visible = visible;
    return visible;
  };

  // Performance monitoring
  useEffect(() => {
    if (settings.showStats) {
      const stats = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangles: 0
      };

      const updateStats = () => {
        // Collect stats from renderer
        const info = gl.info;
        stats.drawCalls = info.render.calls;
        stats.triangles = info.render.triangles;
        
        worldService.updateMetrics({
          drawCalls: stats.drawCalls,
          triangles: stats.triangles
        });
      };

      const interval = setInterval(updateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [settings.showStats, gl]);

  return (
    <PerformanceOptimizerContext.Provider
      value={{
        enableLOD,
        enableFrustumCulling,
        enableObjectPooling,
        lodDistances,
        getFromPool,
        returnToPool,
        createLOD,
        cullObject
      }}
    >
      {children}
    </PerformanceOptimizerContext.Provider>
  );
};

// Context for performance optimizations
interface PerformanceOptimizerContextValue {
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  enableObjectPooling: boolean;
  lodDistances: { near: number; medium: number; far: number };
  getFromPool: (type: string, createFn: () => THREE.Object3D) => THREE.Object3D;
  returnToPool: (type: string, obj: THREE.Object3D) => void;
  createLOD: (id: string, objects: { distance: number; object: THREE.Object3D }[]) => THREE.LOD;
  cullObject: (object: THREE.Object3D) => boolean;
}

const PerformanceOptimizerContext = React.createContext<PerformanceOptimizerContextValue | null>(null);

export const usePerformanceOptimizer = () => {
  const context = React.useContext(PerformanceOptimizerContext);
  if (!context) {
    throw new Error('usePerformanceOptimizer must be used within PerformanceOptimizer');
  }
  return context;
};
