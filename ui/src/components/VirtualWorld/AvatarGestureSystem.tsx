/**
 * Avatar Gesture System
 * Predefined gestures and gesture management for avatars
 */

import React, { useState, useCallback } from 'react';
import * as THREE from 'three';

export type GestureType = 
  | 'wave' 
  | 'point' 
  | 'thumbs_up' 
  | 'thumbs_down'
  | 'clap'
  | 'dance'
  | 'jump'
  | 'sit'
  | 'wave_hello'
  | 'wave_goodbye'
  | 'nod'
  | 'shake_head'
  | 'salute'
  | 'peace'
  | 'rock_on';

export interface Gesture {
  id: string;
  name: string;
  type: GestureType;
  animationName: string; // GLTF animation name
  duration?: number; // Duration in seconds (0 = loop)
  loop?: boolean; // Whether to loop the gesture
  priority?: number; // Gesture priority (higher = more important)
}

export interface GestureState {
  currentGesture: GestureType | null;
  isPlaying: boolean;
  startTime: number;
  duration: number;
}

// Predefined gestures
export const PREDEFINED_GESTURES: Gesture[] = [
  {
    id: 'wave',
    name: 'Wave',
    type: 'wave',
    animationName: 'wave',
    duration: 2,
    loop: false,
    priority: 1
  },
  {
    id: 'point',
    name: 'Point',
    type: 'point',
    animationName: 'point',
    duration: 1.5,
    loop: false,
    priority: 1
  },
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    type: 'thumbs_up',
    animationName: 'thumbs_up',
    duration: 1,
    loop: false,
    priority: 1
  },
  {
    id: 'thumbs_down',
    name: 'Thumbs Down',
    type: 'thumbs_down',
    animationName: 'thumbs_down',
    duration: 1,
    loop: false,
    priority: 1
  },
  {
    id: 'clap',
    name: 'Clap',
    type: 'clap',
    animationName: 'clap',
    duration: 2,
    loop: true,
    priority: 2
  },
  {
    id: 'dance',
    name: 'Dance',
    type: 'dance',
    animationName: 'dance',
    duration: 0,
    loop: true,
    priority: 3
  },
  {
    id: 'jump',
    name: 'Jump',
    type: 'jump',
    animationName: 'jump',
    duration: 1,
    loop: false,
    priority: 2
  },
  {
    id: 'sit',
    name: 'Sit',
    type: 'sit',
    animationName: 'sit',
    duration: 0,
    loop: false,
    priority: 2
  },
  {
    id: 'wave_hello',
    name: 'Wave Hello',
    type: 'wave_hello',
    animationName: 'wave_hello',
    duration: 2,
    loop: false,
    priority: 1
  },
  {
    id: 'wave_goodbye',
    name: 'Wave Goodbye',
    type: 'wave_goodbye',
    animationName: 'wave_goodbye',
    duration: 2,
    loop: false,
    priority: 1
  },
  {
    id: 'nod',
    name: 'Nod',
    type: 'nod',
    animationName: 'nod',
    duration: 1,
    loop: false,
    priority: 1
  },
  {
    id: 'shake_head',
    name: 'Shake Head',
    type: 'shake_head',
    animationName: 'shake_head',
    duration: 1,
    loop: false,
    priority: 1
  },
  {
    id: 'salute',
    name: 'Salute',
    type: 'salute',
    animationName: 'salute',
    duration: 1.5,
    loop: false,
    priority: 2
  },
  {
    id: 'peace',
    name: 'Peace Sign',
    type: 'peace',
    animationName: 'peace',
    duration: 1,
    loop: false,
    priority: 1
  },
  {
    id: 'rock_on',
    name: 'Rock On',
    type: 'rock_on',
    animationName: 'rock_on',
    duration: 1,
    loop: false,
    priority: 1
  }
];

// Gesture manager hook
export const useAvatarGestures = () => {
  const [gestureState, setGestureState] = useState<GestureState | null>(null);
  const [availableGestures] = useState<Gesture[]>(PREDEFINED_GESTURES);

  const triggerGesture = useCallback((gestureType: GestureType) => {
    const gesture = availableGestures.find(g => g.type === gestureType);
    if (!gesture) {
      console.warn(`Gesture ${gestureType} not found`);
      return;
    }

    setGestureState({
      currentGesture: gestureType,
      isPlaying: true,
      startTime: Date.now(),
      duration: gesture.duration || 0
    });
  }, [availableGestures]);

  const stopGesture = useCallback(() => {
    setGestureState(null);
  }, []);

  const getGesture = useCallback((gestureType: GestureType): Gesture | undefined => {
    return availableGestures.find(g => g.type === gestureType);
  }, [availableGestures]);

  return {
    gestureState,
    availableGestures,
    triggerGesture,
    stopGesture,
    getGesture
  };
};

// Gesture animation controller component
export const GestureAnimationController: React.FC<{
  gestureState: GestureState | null;
  gltf?: any;
  scene: THREE.Object3D;
  onGestureComplete?: (gestureType: GestureType) => void;
}> = ({ gestureState, gltf, scene, onGestureComplete }) => {
  const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = React.useRef<THREE.AnimationAction | null>(null);
  const { useFrame } = require('@react-three/fiber');

  // Initialize mixer
  React.useEffect(() => {
    if (!gltf || !gltf.animations || gltf.animations.length === 0) {
      return;
    }

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [gltf, scene]);

  // Handle gesture changes
  React.useEffect(() => {
    if (!gestureState || !mixerRef.current || !gltf) return;

    const gesture = PREDEFINED_GESTURES.find(g => g.type === gestureState.currentGesture);
    if (!gesture) return;

    const mixer = mixerRef.current;
    const clip = gltf.animations.find((a: THREE.AnimationClip) => 
      a.name.toLowerCase().includes(gesture.animationName.toLowerCase())
    );

    if (!clip) {
      console.warn(`Animation ${gesture.animationName} not found in GLTF`);
      return;
    }

    // Fade out current action
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.2);
      currentActionRef.current.stop();
    }

    // Create and play new action
    const action = mixer.clipAction(clip);
    action.setLoop(gesture.loop ? THREE.LoopRepeat : THREE.LoopOnce);
    action.reset();
    action.fadeIn(0.2);
    action.play();
    currentActionRef.current = action;

    // Handle completion
    if (!gesture.loop && gesture.duration) {
      const timeout = setTimeout(() => {
        action.fadeOut(0.2);
        onGestureComplete?.(gesture.type);
      }, gesture.duration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [gestureState, gltf, scene, onGestureComplete]);

  // Update mixer
  useFrame((state: any, delta: number) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return null;
};
