/**
 * Gesture and Animation System
 * Advanced gesture recognition and animation management for avatars
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { metaversePortalService, Gesture, AnimationState } from '../../services/metaverse-portal-service';

interface GestureAnimationSystemProps {
  avatarId: string;
  modelUrl?: string;
  position: [number, number, number];
  onGestureTriggered?: (gestureId: string) => void;
  onAnimationComplete?: (animationName: string) => void;
}

// Gesture recognition component
const GestureRecognizer: React.FC<{
  onGestureDetected: (gestureType: string) => void;
}> = ({ onGestureDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to access camera:', error);
      }
    };

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Simple gesture detection based on motion patterns
  const detectGesture = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = 320;
    canvasRef.current.height = 240;

    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const imageData = ctx.getImageData(0, 0, 320, 240);
    
    // Simple motion detection (placeholder for actual ML model)
    const motion = calculateMotion(imageData);
    
    if (motion > 50) {
      onGestureDetected('wave');
    } else if (motion > 30) {
      onGestureDetected('point');
    }
  }, [onGestureDetected]);

  const calculateMotion = (imageData: ImageData): number => {
    // Simplified motion calculation
    let motion = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      motion += imageData.data[i]; // Red channel
    }
    return motion / (imageData.data.length / 4);
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg">
      <button
        onClick={() => setIsActive(!isActive)}
        className={`px-4 py-2 rounded mb-2 ${
          isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        } text-white transition-colors`}
      >
        {isActive ? 'Stop Gesture Recognition' : 'Start Gesture Recognition'}
      </button>
      
      {isActive && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-40 h-30 rounded bg-black"
          />
          <canvas
            ref={canvasRef}
            className="w-40 h-30 rounded bg-black"
          />
        </div>
      )}
    </div>
  );
};

// Animated avatar component
const AnimatedAvatar: React.FC<{
  avatarId: string;
  modelUrl?: string;
  position: [number, number, number];
  animationState: AnimationState;
  onAnimationComplete?: (animationName: string) => void;
}> = ({ avatarId, modelUrl, position, animationState, onAnimationComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [gltf, setGltf] = useState<any>(null);
  const { scene, animations } = useGLTF(modelUrl || '/models/default-avatar.gltf', true);

  useEffect(() => {
    setGltf({ scene, animations });
  }, [scene, animations]);

  useEffect(() => {
    if (gltf && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(gltf.scene);
      
      // Set up animation actions
      animations.forEach((clip: THREE.AnimationClip) => {
        const action = mixerRef.current!.clipAction(clip);
        if (clip.name === animationState.currentAnimation) {
          action.setLoop(animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce, 1);
          action.setEffectiveTimeScale(animationState.speed);
          action.setEffectiveWeight(animationState.weight);
          action.play();
        }
      });

      mixerRef.current.addEventListener('finished', (event: any) => {
        onAnimationComplete?.(event.action.getClip().name);
      });
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(gltf.scene);
      }
    };
  }, [gltf, animations, animationState, onAnimationComplete]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Gentle idle animation
    if (groupRef.current && animationState.currentAnimation === 'idle') {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.05;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (!gltf) {
    // Fallback to simple geometry
    return (
      <group ref={groupRef} position={position}>
        <mesh>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive object={gltf.scene.clone()} />
      
      {/* Avatar label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {avatarId}
      </Text>
    </group>
  );
};

// Gesture trigger buttons
const GestureTriggers: React.FC<{
  onGestureTrigger: (gestureId: string) => void;
  availableGestures: Gesture[];
}> = ({ onGestureTrigger, availableGestures }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-3">Gestures</h3>
      <div className="grid grid-cols-2 gap-2">
        {availableGestures.map(gesture => (
          <button
            key={gesture.id}
            onClick={() => onGestureTrigger(gesture.id)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {gesture.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Animation state display
const AnimationStateDisplay: React.FC<{
  animationState: AnimationState;
  availableGestures: Gesture[];
}> = ({ animationState, availableGestures }) => {
  const currentGesture = availableGestures.find(g => g.animation === animationState.currentAnimation);
  
  return (
    <div className="absolute top-4 left-4 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Animation State</h3>
      <div className="space-y-1 text-sm">
        <div className="text-gray-300">
          Current: <span className="text-white">{currentGesture?.name || animationState.currentAnimation}</span>
        </div>
        <div className="text-gray-300">
          Playing: <span className={animationState.isPlaying ? 'text-green-400' : 'text-red-400'}>
            {animationState.isPlaying ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="text-gray-300">
          Loop: <span className={animationState.loop ? 'text-green-400' : 'text-red-400'}>
            {animationState.loop ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="text-gray-300">
          Speed: <span className="text-white">{animationState.speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};

// Main component
export const GestureAnimationSystem: React.FC<GestureAnimationSystemProps> = ({
  avatarId,
  modelUrl,
  position,
  onGestureTriggered,
  onAnimationComplete
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentAnimation: 'idle',
    isPlaying: true,
    loop: true,
    speed: 1.0,
    weight: 1.0,
    startTime: Date.now()
  });
  const [availableGestures, setAvailableGestures] = useState<Gesture[]>([]);

  useEffect(() => {
    loadAvailableGestures();
  }, []);

  const loadAvailableGestures = async () => {
    try {
      const gestures = await metaversePortalService.getAvailableGestures();
      setAvailableGestures(gestures);
    } catch (error) {
      console.error('Failed to load gestures:', error);
    }
  };

  const handleGestureTrigger = async (gestureId: string) => {
    try {
      await metaversePortalService.triggerGesture(avatarId, gestureId);
      
      const gesture = availableGestures.find(g => g.id === gestureId);
      if (gesture) {
        setAnimationState(prev => ({
          ...prev,
          currentAnimation: gesture.animation,
          isPlaying: true,
          loop: false,
          startTime: Date.now()
        }));
      }
      
      onGestureTriggered?.(gestureId);
    } catch (error) {
      console.error('Failed to trigger gesture:', error);
    }
  };

  const handleGestureDetected = (gestureType: string) => {
    // Map detected gesture type to gesture ID
    const gestureMap: Record<string, string> = {
      'wave': 'wave',
      'point': 'point',
      'thumbs_up': 'thumbs_up'
    };
    
    const gestureId = gestureMap[gestureType];
    if (gestureId) {
      handleGestureTrigger(gestureId);
    }
  };

  const handleAnimationComplete = (animationName: string) => {
    // Return to idle animation
    setAnimationState(prev => ({
      ...prev,
      currentAnimation: 'idle',
      isPlaying: true,
      loop: true
    }));
    
    onAnimationComplete?.(animationName);
  };

  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight position={[0, 10, 0]} intensity={0.5} />
        
        <AnimatedAvatar
          avatarId={avatarId}
          modelUrl={modelUrl}
          position={position}
          animationState={animationState}
          onAnimationComplete={handleAnimationComplete}
        />
      </Canvas>
      
      <GestureRecognizer onGestureDetected={handleGestureDetected} />
      <GestureTriggers
        onGestureTrigger={handleGestureTrigger}
        availableGestures={availableGestures}
      />
      <AnimationStateDisplay
        animationState={animationState}
        availableGestures={availableGestures}
      />
    </div>
  );
};

export default GestureAnimationSystem;