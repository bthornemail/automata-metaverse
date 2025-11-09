/**
 * Virtual World Camera Component
 * Multiple camera modes: first-person, third-person, and orbital
 */

import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export type CameraMode = 'first-person' | 'third-person' | 'orbital';

export interface CameraConfig {
  mode?: CameraMode;
  target?: [number, number, number]; // Target position for third-person/orbital
  distance?: number; // Distance from target (third-person/orbital)
  height?: number; // Camera height (first-person)
  fov?: number; // Field of view
  enableControls?: boolean; // Enable manual controls
  smoothTransition?: boolean; // Smooth camera transitions
}

interface VirtualWorldCameraProps {
  config?: CameraConfig;
  avatarPosition?: [number, number, number]; // For first/third-person following
}

export const VirtualWorldCamera: React.FC<VirtualWorldCameraProps> = ({
  config = {},
  avatarPosition
}) => {
  const { camera, set } = useThree();
  const controlsRef = useRef<any>(null);
  
  const {
    mode = 'orbital',
    target = [0, 0, 0],
    distance = 15,
    height = 1.6,
    fov = 75,
    enableControls = true,
    smoothTransition = true
  } = config;

  // Update camera based on mode
  useFrame(() => {
    if (!smoothTransition) return;

    if (mode === 'first-person' && avatarPosition) {
      // First-person: camera at avatar position + height
      const targetPos = new THREE.Vector3(
        avatarPosition[0],
        avatarPosition[1] + height,
        avatarPosition[2]
      );
      camera.position.lerp(targetPos, 0.1);
    } else if (mode === 'third-person' && avatarPosition) {
      // Third-person: camera behind avatar
      const targetPos = new THREE.Vector3(
        avatarPosition[0],
        avatarPosition[1] + height + distance * 0.3,
        avatarPosition[2] + distance
      );
      camera.position.lerp(targetPos, 0.1);
      camera.lookAt(...avatarPosition);
    } else if (mode === 'orbital') {
      // Orbital: camera orbits around target
      // Controlled by OrbitControls
    }
  });

  // Set camera FOV
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  // First-person camera
  if (mode === 'first-person') {
    return (
      <>
        <PerspectiveCamera
          makeDefault
          fov={fov}
          position={avatarPosition ? [avatarPosition[0], avatarPosition[1] + height, avatarPosition[2]] : [0, height, 0]}
        />
        {enableControls && (
          <FirstPersonControls
            ref={controlsRef}
            height={height}
          />
        )}
      </>
    );
  }

  // Third-person camera
  if (mode === 'third-person') {
    return (
      <>
        <PerspectiveCamera
          makeDefault
          fov={fov}
          position={avatarPosition ? [
            avatarPosition[0],
            avatarPosition[1] + height + distance * 0.3,
            avatarPosition[2] + distance
          ] : [0, height + distance * 0.3, distance]}
        />
        {enableControls && (
          <ThirdPersonControls
            ref={controlsRef}
            target={avatarPosition || target}
            distance={distance}
            height={height}
          />
        )}
      </>
    );
  }

  // Orbital camera (default)
  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={fov}
        position={[target[0], target[1] + distance, target[2] + distance]}
      />
      {enableControls && (
        <OrbitControls
          ref={controlsRef}
          target={target}
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

// First-person controls (WASD + mouse)
const FirstPersonControls = React.forwardRef<any, { height: number }>(
  ({ height }, ref) => {
    const { camera } = useThree();
    const moveState = useRef({ forward: false, backward: false, left: false, right: false });
    const velocity = useRef(new THREE.Vector3());

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
          case 'w': moveState.current.forward = true; break;
          case 's': moveState.current.backward = true; break;
          case 'a': moveState.current.left = true; break;
          case 'd': moveState.current.right = true; break;
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
          case 'w': moveState.current.forward = false; break;
          case 's': moveState.current.backward = false; break;
          case 'a': moveState.current.left = false; break;
          case 'd': moveState.current.right = false; break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    useFrame((state, delta) => {
      const speed = 5;
      const direction = new THREE.Vector3();

      if (moveState.current.forward) direction.z -= 1;
      if (moveState.current.backward) direction.z += 1;
      if (moveState.current.left) direction.x -= 1;
      if (moveState.current.right) direction.x += 1;

      direction.normalize();
      direction.multiplyScalar(speed * delta);

      camera.position.add(direction);
      camera.position.y = height; // Maintain height
    });

    return null;
  }
);

// Third-person controls
const ThirdPersonControls = React.forwardRef<any, {
  target: [number, number, number];
  distance: number;
  height: number;
}>(({ target, distance, height }, ref) => {
  const { camera } = useThree();

  useFrame(() => {
    const targetVec = new THREE.Vector3(...target);
    const cameraPos = new THREE.Vector3(
      targetVec.x,
      targetVec.y + height + distance * 0.3,
      targetVec.z + distance
    );
    camera.position.lerp(cameraPos, 0.1);
    camera.lookAt(targetVec);
  });

  return null;
});

// Camera preset positions
export const CameraPresets = {
  overview: {
    mode: 'orbital' as CameraMode,
    target: [0, 0, 0] as [number, number, number],
    distance: 30,
    fov: 60
  },
  close: {
    mode: 'orbital' as CameraMode,
    target: [0, 0, 0] as [number, number, number],
    distance: 10,
    fov: 75
  },
  firstPerson: {
    mode: 'first-person' as CameraMode,
    height: 1.6,
    fov: 90
  },
  thirdPerson: {
    mode: 'third-person' as CameraMode,
    distance: 5,
    height: 1.6,
    fov: 75
  }
};
