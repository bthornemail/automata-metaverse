/**
 * Enhanced Camera System V2
 * Expanded camera modes: cinematic, follow, free-look, and more
 */

import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CameraMode } from './VirtualWorldCamera';
import type { CameraConfig } from './VirtualWorldCamera';
import { cameraService, CameraState } from '../../services/camera-service';

export type EnhancedCameraMode = CameraMode | 'cinematic' | 'follow' | 'free-look' | 'top-down';

export interface EnhancedCameraConfig {
  mode?: EnhancedCameraMode;
  // Include all CameraConfig properties except mode
  target?: [number, number, number];
  distance?: number;
  height?: number;
  fov?: number;
  enableControls?: boolean;
  smoothTransition?: boolean;
  // Cinematic mode
  cinematicPath?: {
    points: [number, number, number][];
    duration?: number; // Duration in seconds
    loop?: boolean;
  };
  // Follow mode
  followTarget?: {
    position: [number, number, number];
    offset?: [number, number, number];
    smoothness?: number;
  };
  // Free-look mode
  freeLookSpeed?: number;
  // Top-down mode
  topDownHeight?: number;
  // Camera animations
  transitionDuration?: number;
  transitionEasing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Service integration
  enableServiceSync?: boolean;
}

interface EnhancedCameraProps {
  config?: EnhancedCameraConfig;
  avatarPosition?: [number, number, number];
}

export const EnhancedCamera: React.FC<EnhancedCameraProps> = ({
  config = {},
  avatarPosition
}) => {
  const { camera, set } = useThree();
  const controlsRef = useRef<any>(null);
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  
  const {
    mode = 'orbital',
    target = [0, 0, 0],
    distance = 15,
    height = 1.6,
    fov = 75,
    enableControls = true,
    smoothTransition = true,
    cinematicPath,
    followTarget,
    freeLookSpeed = 1,
    topDownHeight = 50,
    transitionDuration = 1,
    transitionEasing = 'easeInOut',
    enableServiceSync = true
  } = config;

  // Camera service sync
  useEffect(() => {
    if (!enableServiceSync) return;

    // Listen for camera updates
    const handleUpdate = (state: CameraState) => {
      setCameraState(state);
    };

    cameraService.on('camera:update', handleUpdate);

    return () => {
      cameraService.off('camera:update', handleUpdate);
    };
  }, [enableServiceSync]);

  // Use service state if available
  const effectiveMode = cameraState?.mode || mode;
  const effectiveTarget = cameraState?.target || target;
  const effectiveDistance = cameraState?.distance || distance;

  // Camera mode handlers
  useFrame((state, delta) => {
    if (!smoothTransition) return;

    switch (effectiveMode) {
      case 'first-person':
        if (avatarPosition) {
          const targetPos = new THREE.Vector3(
            avatarPosition[0],
            avatarPosition[1] + height,
            avatarPosition[2]
          );
          camera.position.lerp(targetPos, 0.1);
        }
        break;

      case 'third-person':
        if (avatarPosition) {
          const targetPos = new THREE.Vector3(
            avatarPosition[0],
            avatarPosition[1] + height + effectiveDistance * 0.3,
            avatarPosition[2] + effectiveDistance
          );
          camera.position.lerp(targetPos, 0.1);
          camera.lookAt(...avatarPosition);
        }
        break;

      case 'cinematic':
        if (cinematicPath) {
          handleCinematicCamera(state, cinematicPath);
        }
        break;

      case 'follow':
        if (followTarget) {
          handleFollowCamera(followTarget);
        }
        break;

      case 'top-down':
        handleTopDownCamera(effectiveTarget, topDownHeight);
        break;
    }
  });

  const handleCinematicCamera = (
    state: any,
    path: { points: [number, number, number][]; duration?: number; loop?: boolean }
  ) => {
    const duration = path.duration || 10;
    const progress = (state.clock.elapsedTime % duration) / duration;
    const t = path.loop ? progress : Math.min(progress, 1);

    if (path.points.length >= 2) {
      const segmentLength = 1 / (path.points.length - 1);
      const segmentIndex = Math.floor(t / segmentLength);
      const segmentT = (t % segmentLength) / segmentLength;
      const clampedIndex = Math.min(segmentIndex, path.points.length - 2);

      const p1 = new THREE.Vector3(...path.points[clampedIndex]);
      const p2 = new THREE.Vector3(...path.points[clampedIndex + 1]);
      const position = p1.clone().lerp(p2, segmentT);

      camera.position.lerp(position, 0.1);
      if (clampedIndex < path.points.length - 1) {
        camera.lookAt(...path.points[clampedIndex + 1]);
      }
    }
  };

  const handleFollowCamera = (target: {
    position: [number, number, number];
    offset?: [number, number, number];
    smoothness?: number;
  }) => {
    const offset = target.offset || [0, 5, 10];
    const smoothness = target.smoothness || 0.1;
    const targetPos = new THREE.Vector3(
      target.position[0] + offset[0],
      target.position[1] + offset[1],
      target.position[2] + offset[2]
    );
    camera.position.lerp(targetPos, smoothness);
    camera.lookAt(...target.position);
  };

  const handleTopDownCamera = (target: [number, number, number], height: number) => {
    const targetPos = new THREE.Vector3(target[0], height, target[2]);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(...target);
  };

  // Render camera based on mode
  switch (effectiveMode) {
    case 'first-person':
      return (
        <>
          <PerspectiveCamera
            makeDefault
            fov={fov}
            position={avatarPosition ? [avatarPosition[0], avatarPosition[1] + height, avatarPosition[2]] : [0, height, 0]}
          />
          {enableControls && (
            <FirstPersonControls height={height} speed={freeLookSpeed} />
          )}
        </>
      );

    case 'third-person':
      return (
        <>
          <PerspectiveCamera
            makeDefault
            fov={fov}
            position={avatarPosition ? [
              avatarPosition[0],
              avatarPosition[1] + height + effectiveDistance * 0.3,
              avatarPosition[2] + effectiveDistance
            ] : [0, height + effectiveDistance * 0.3, effectiveDistance]}
          />
          {enableControls && (
            <ThirdPersonControls
              target={avatarPosition || effectiveTarget}
              distance={effectiveDistance}
              height={height}
            />
          )}
        </>
      );

    case 'cinematic':
      return (
        <>
          <PerspectiveCamera makeDefault fov={fov} />
          {enableControls && (
            <CinematicControls />
          )}
        </>
      );

    case 'follow':
      return (
        <>
          <PerspectiveCamera makeDefault fov={fov} />
          {enableControls && (
            <FollowControls target={followTarget!} />
          )}
        </>
      );

    case 'free-look':
      return (
        <>
          <PerspectiveCamera makeDefault fov={fov} />
          {enableControls && (
            <FreeLookControls speed={freeLookSpeed} />
          )}
        </>
      );

    case 'top-down':
      return (
        <>
          <PerspectiveCamera
            makeDefault
            fov={fov}
            position={[effectiveTarget[0], topDownHeight, effectiveTarget[2]]}
          />
          {enableControls && (
            <TopDownControls target={effectiveTarget} />
          )}
        </>
      );

    default: // orbital
      return (
        <>
          <PerspectiveCamera
            makeDefault
            fov={fov}
            position={[effectiveTarget[0], effectiveTarget[1] + effectiveDistance, effectiveTarget[2] + effectiveDistance]}
          />
          {enableControls && (
            <OrbitControls
              ref={controlsRef}
              target={effectiveTarget}
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
  }
};

// Enhanced first-person controls
const FirstPersonControls: React.FC<{
  height: number;
  speed: number;
}> = ({ height, speed }) => {
  const { camera } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const mouseState = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

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

    const handleMouseMove = (e: MouseEvent) => {
      mouseState.current.x += e.movementX * 0.002;
      mouseState.current.y += e.movementY * 0.002;
      mouseState.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.current.y));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useFrame((state, delta) => {
    const moveSpeed = 5 * speed;
    const direction = new THREE.Vector3();

    if (moveState.current.forward) direction.z -= 1;
    if (moveState.current.backward) direction.z += 1;
    if (moveState.current.left) direction.x -= 1;
    if (moveState.current.right) direction.x += 1;

    direction.normalize();
    direction.applyEuler(euler.current);
    direction.multiplyScalar(moveSpeed * delta);

    camera.position.add(direction);
    camera.position.y = height;

    euler.current.set(mouseState.current.y, mouseState.current.x, 0);
    camera.rotation.copy(euler.current);
  });

  return null;
};

// Third-person controls (same as before)
const ThirdPersonControls: React.FC<{
  target: [number, number, number];
  distance: number;
  height: number;
}> = ({ target, distance, height }) => {
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
};

// Cinematic controls
const CinematicControls: React.FC = () => {
  // Cinematic camera is controlled by path
  return null;
};

// Follow controls
const FollowControls: React.FC<{
  target: { position: [number, number, number]; offset?: [number, number, number]; smoothness?: number };
}> = ({ target }) => {
  const { camera } = useThree();

  useFrame(() => {
    const offset = target.offset || [0, 5, 10];
    const smoothness = target.smoothness || 0.1;
    const targetPos = new THREE.Vector3(
      target.position[0] + offset[0],
      target.position[1] + offset[1],
      target.position[2] + offset[2]
    );
    camera.position.lerp(targetPos, smoothness);
    camera.lookAt(...target.position);
  });

  return null;
};

// Free-look controls
const FreeLookControls: React.FC<{ speed: number }> = ({ speed }) => {
  const { camera } = useThree();
  const mouseState = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseState.current.x += e.movementX * 0.002 * speed;
      mouseState.current.y += e.movementY * 0.002 * speed;
      mouseState.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.current.y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [speed]);

  useFrame(() => {
    camera.rotation.set(mouseState.current.y, mouseState.current.x, 0);
  });

  return null;
};

// Top-down controls
const TopDownControls: React.FC<{ target: [number, number, number] }> = ({ target }) => {
  const { camera } = useThree();

  useFrame(() => {
    camera.lookAt(...target);
  });

  return null;
};
