/**
 * Avatar Animation Controller
 * Manages animations for GLTF avatars (idle, walking, gestures)
 */

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AnimationState = 'idle' | 'walking' | 'running' | 'jumping' | 'sitting' | 'dancing' | 'gesturing';

export interface AvatarAnimationControllerProps {
  scene: THREE.Object3D;
  animationState: AnimationState;
  gltf?: any; // GLTF loader result with animations
  speed?: number; // Animation speed multiplier
}

export const AvatarAnimationController: React.FC<AvatarAnimationControllerProps> = ({
  scene,
  animationState,
  gltf,
  speed = 1
}) => {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentActionRef = useRef<string | null>(null);

  // Initialize animation mixer
  useEffect(() => {
    if (!gltf || !gltf.animations || gltf.animations.length === 0) {
      return;
    }

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    // Create actions for each animation
    gltf.animations.forEach((clip: THREE.AnimationClip) => {
      const action = mixer.clipAction(clip, scene);
      action.setLoop(THREE.LoopRepeat);
      actionsRef.current.set(clip.name, action);
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [gltf, scene]);

  // Handle animation state changes
  useEffect(() => {
    if (!mixerRef.current) return;

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    // Find appropriate animation for state
    let targetAction: THREE.AnimationAction | null = null;
    let targetActionName: string | null = null;

    // Try to find state-specific animation
    const stateAnimations: Record<string, string[]> = {
      idle: ['idle', 'Idle', 'IDLE', 'breathing', 'Breathing', 'stand', 'Stand'],
      walking: ['walk', 'Walk', 'WALK', 'walking', 'Walking', 'locomotion'],
      running: ['run', 'Run', 'RUN', 'running', 'Running', 'sprint', 'Sprint'],
      jumping: ['jump', 'Jump', 'JUMP', 'jumping', 'Jumping'],
      sitting: ['sit', 'Sit', 'SIT', 'sitting', 'Sitting'],
      dancing: ['dance', 'Dance', 'DANCE', 'dancing', 'Dancing'],
      gesturing: ['gesture', 'Gesture', 'wave', 'Wave', 'point', 'Point']
    };

    const candidates = stateAnimations[animationState] || [];
    for (const candidate of candidates) {
      if (actions.has(candidate)) {
        targetAction = actions.get(candidate)!;
        targetActionName = candidate;
        break;
      }
    }

    // Fallback: use first available animation
    if (!targetAction && actions.size > 0) {
      const firstAction = Array.from(actions.values())[0];
      targetAction = firstAction;
      targetActionName = Array.from(actions.keys())[0];
    }

    // Fade out current action
    if (currentActionRef.current && actions.has(currentActionRef.current)) {
      const currentAction = actions.get(currentActionRef.current)!;
      currentAction.fadeOut(0.3);
      currentAction.stop();
    }

    // Fade in new action
    if (targetAction) {
      targetAction.reset();
      targetAction.setEffectiveTimeScale(speed);
      targetAction.fadeIn(0.3);
      targetAction.play();
      currentActionRef.current = targetActionName;
    }
  }, [animationState, speed]);

  // Update mixer
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return null;
};

// Simple procedural animations for avatars without GLTF animations
export const ProceduralIdleAnimation: React.FC<{
  object: THREE.Object3D;
  intensity?: number;
}> = ({ object, intensity = 0.1 }) => {
  const originalY = useRef<number>(object.position.y);

  useEffect(() => {
    originalY.current = object.position.y;
  }, []);

  useFrame((state) => {
    // Gentle breathing animation
    object.position.y = originalY.current + Math.sin(state.clock.elapsedTime * 0.5) * intensity;
    
    // Subtle rotation
    object.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return null;
};

export const ProceduralWalkingAnimation: React.FC<{
  object: THREE.Object3D;
  speed?: number;
}> = ({ object, speed = 1 }) => {
  useFrame((state) => {
    // Leg swing simulation
    const legSwing = Math.sin(state.clock.elapsedTime * speed * 4) * 0.2;
    object.rotation.z = legSwing;
    
    // Body bounce
    object.position.y = Math.abs(Math.sin(state.clock.elapsedTime * speed * 4)) * 0.1;
  });

  return null;
};
