/**
 * Avatar Raycaster Component
 * Handles raycasting for avatar interactions (hover, click, status display)
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from './EnhancedGLTFAvatar';

export interface AvatarRaycasterProps {
  avatars: AvatarConfig[];
  onAvatarHover?: (avatar: AvatarConfig | null) => void;
  onAvatarClick?: (avatar: AvatarConfig) => void;
  enableStatusDisplay?: boolean;
}

export const AvatarRaycaster: React.FC<AvatarRaycasterProps> = ({
  avatars,
  onAvatarHover,
  onAvatarClick,
  enableStatusDisplay = true
}) => {
  const { camera, gl, raycaster, pointer, scene } = useThree();
  const [hoveredAvatar, setHoveredAvatar] = useState<AvatarConfig | null>(null);
  const [clickedAvatar, setClickedAvatar] = useState<AvatarConfig | null>(null);
  const avatarRefs = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Update avatar refs when avatars change
  useEffect(() => {
    avatarRefs.current.clear();
  }, [avatars]);

  // Handle pointer move for hover detection
  useFrame(() => {
    if (!enableStatusDisplay) return;

    // Update mouse position
    const rect = gl.domElement.getBoundingClientRect();
    mouseRef.current.x = ((pointer.x * rect.width) / rect.width) * 2 - 1;
    mouseRef.current.y = -((pointer.y * rect.height) / rect.height) * 2 + 1;

    // Update raycaster
    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // Find intersected avatars
    let closestIntersection: { avatar: AvatarConfig; distance: number } | null = null;

    avatarRefs.current.forEach((group, avatarId) => {
      if (!group) return;

      // Create bounding box for avatar
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Create a sphere for easier intersection detection
      const sphere = new THREE.Sphere(center, Math.max(size.x, size.y, size.z) * 0.6);
      
      // Check intersection
      const intersection = raycasterRef.current.ray.intersectSphere(sphere, new THREE.Vector3());
      
      if (intersection) {
        const distance = intersection.distanceTo(camera.position);
        const avatar = avatars.find(a => a.id === avatarId);
        
        if (avatar && (!closestIntersection || distance < closestIntersection.distance)) {
          closestIntersection = { avatar, distance };
        }
      }
    });

    // Update hovered avatar
    const newHoveredAvatar = closestIntersection?.avatar || null;
    if (newHoveredAvatar?.id !== hoveredAvatar?.id) {
      setHoveredAvatar(newHoveredAvatar);
      onAvatarHover?.(newHoveredAvatar);
    }
  });

  // Handle click events
  const handleClick = (event: MouseEvent) => {
    if (!onAvatarClick) return;

    const rect = gl.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    let closestIntersection: { avatar: AvatarConfig; distance: number } | null = null;

    avatarRefs.current.forEach((group, avatarId) => {
      if (!group) return;

      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const sphere = new THREE.Sphere(center, Math.max(size.x, size.y, size.z) * 0.6);
      
      const intersection = raycasterRef.current.ray.intersectSphere(sphere, new THREE.Vector3());
      
      if (intersection) {
        const distance = intersection.distanceTo(camera.position);
        const avatar = avatars.find(a => a.id === avatarId);
        
        if (avatar && (!closestIntersection || distance < closestIntersection.distance)) {
          closestIntersection = { avatar, distance };
        }
      }
    });

    if (closestIntersection) {
      setClickedAvatar(closestIntersection.avatar);
      onAvatarClick(closestIntersection.avatar);
    }
  };

  // Register click handler
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl.domElement, avatars, onAvatarClick]);

  // Register avatar refs (called by avatar components)
  const registerAvatarRef = (avatarId: string, ref: THREE.Group | null) => {
    if (ref) {
      avatarRefs.current.set(avatarId, ref);
    } else {
      avatarRefs.current.delete(avatarId);
    }
  };

  // Expose register function via context or return null (avatars will register themselves)
  return null;
};

// Status display component
export const AvatarStatusDisplay: React.FC<{
  avatar: AvatarConfig | null;
  position: [number, number, number];
  visible: boolean;
}> = ({ avatar, position, visible }) => {
  if (!avatar || !visible) return null;

  const statusColors = {
    online: '#10b981',
    offline: '#6b7280',
    away: '#f59e0b'
  };

  return (
    <Html
      position={position}
      center
      distanceFactor={10}
      style={{
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `2px solid ${avatar.color || '#6366f1'}`,
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          transform: 'translateY(-100%)',
          marginTop: '-10px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {avatar.name}
        </div>
        {avatar.dimension && (
          <div style={{ color: avatar.color, fontSize: '10px', marginBottom: '4px' }}>
            {avatar.dimension}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColors[avatar.status || 'online']
            }}
          />
          <span style={{ fontSize: '10px', textTransform: 'capitalize' }}>
            {avatar.status || 'online'}
          </span>
        </div>
      </div>
    </Html>
  );
};

// Hook to register avatar refs
export const useAvatarRaycaster = () => {
  // This will be implemented via context if needed
  return null;
};
