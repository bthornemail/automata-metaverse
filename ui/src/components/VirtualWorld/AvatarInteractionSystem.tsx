/**
 * Avatar Interaction System
 * Handles raycasting for avatar hover and click detection with status display
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from './EnhancedGLTFAvatar';

export interface AvatarInteractionSystemProps {
  avatars: AvatarConfig[];
  onAvatarHover?: (avatar: AvatarConfig | null) => void;
  onAvatarClick?: (avatar: AvatarConfig) => void;
  enableStatusDisplay?: boolean;
}

interface AvatarRef {
  avatar: AvatarConfig;
  group: THREE.Group;
  boundingSphere: THREE.Sphere;
}

export const AvatarInteractionSystem: React.FC<AvatarInteractionSystemProps> = ({
  avatars,
  onAvatarHover,
  onAvatarClick,
  enableStatusDisplay = true
}) => {
  const { camera, gl, pointer } = useThree();
  const [hoveredAvatar, setHoveredAvatar] = useState<AvatarConfig | null>(null);
  const avatarRefs = useRef<Map<string, AvatarRef>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Register avatar ref
  const registerAvatar = useCallback((avatarId: string, group: THREE.Group | null) => {
    if (group) {
      const avatar = avatars.find(a => a.id === avatarId);
      if (avatar) {
        // Calculate bounding sphere
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.6;
        
        avatarRefs.current.set(avatarId, {
          avatar,
          group,
          boundingSphere: new THREE.Sphere(center, radius)
        });
      }
    } else {
      avatarRefs.current.delete(avatarId);
    }
  }, [avatars]);

  // Update bounding spheres when avatars change
  useEffect(() => {
    avatarRefs.current.forEach((ref) => {
      if (ref.group) {
        const box = new THREE.Box3().setFromObject(ref.group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.6;
        ref.boundingSphere.center.copy(center);
        ref.boundingSphere.radius = radius;
      }
    });
  }, [avatars]);

  // Raycast for hover detection
  useFrame(() => {
    if (!enableStatusDisplay && !onAvatarHover) return;

    // Update mouse position from pointer (already normalized -1 to 1)
    mouse.current.x = pointer.x;
    mouse.current.y = pointer.y;

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Find closest intersected avatar
    let closestIntersection: { avatar: AvatarConfig; distance: number } | null = null;

    avatarRefs.current.forEach((ref) => {
      const intersection = raycaster.current.ray.intersectSphere(
        ref.boundingSphere,
        new THREE.Vector3()
      );

      if (intersection) {
        const distance = intersection.distanceTo(camera.position);
        if (!closestIntersection || distance < closestIntersection.distance) {
          closestIntersection = { avatar: ref.avatar, distance };
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

  // Handle click
  const handleClick = useCallback((event: MouseEvent) => {
    if (!onAvatarClick) return;

    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);

    let closestIntersection: { avatar: AvatarConfig; distance: number } | null = null;

    avatarRefs.current.forEach((ref) => {
      const intersection = raycaster.current.ray.intersectSphere(
        ref.boundingSphere,
        new THREE.Vector3()
      );

      if (intersection) {
        const distance = intersection.distanceTo(camera.position);
        if (!closestIntersection || distance < closestIntersection.distance) {
          closestIntersection = { avatar: ref.avatar, distance };
        }
      }
    });

    if (closestIntersection) {
      onAvatarClick(closestIntersection.avatar);
    }
  }, [camera, gl, onAvatarClick]);

  // Register click handler
  React.useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl.domElement, handleClick]);

  // Expose register function via context
  React.useEffect(() => {
    // Store register function globally for avatar components to use
    (window as any).__registerAvatarRef = registerAvatar;
    return () => {
      delete (window as any).__registerAvatarRef;
    };
  }, [registerAvatar]);

  // Render status display
  if (!enableStatusDisplay || !hoveredAvatar) return null;

  const avatarRef = avatarRefs.current.get(hoveredAvatar.id);
  if (!avatarRef) return null;

  const position: [number, number, number] = [
    avatarRef.boundingSphere.center.x,
    avatarRef.boundingSphere.center.y + avatarRef.boundingSphere.radius + 1,
    avatarRef.boundingSphere.center.z
  ];

  return <AvatarStatusTooltip avatar={hoveredAvatar} position={position} />;
};

// Status tooltip component
const AvatarStatusTooltip: React.FC<{
  avatar: AvatarConfig;
  position: [number, number, number];
}> = ({ avatar, position }) => {
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
        userSelect: 'none',
        transform: 'translateY(-100%)'
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          border: `2px solid ${avatar.color || '#6366f1'}`,
          fontSize: '13px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          minWidth: '150px'
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
          {avatar.name}
        </div>
        {avatar.dimension && (
          <div
            style={{
              color: avatar.color,
              fontSize: '11px',
              marginBottom: '6px',
              fontWeight: '500'
            }}
          >
            Dimension: {avatar.dimension}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: statusColors[avatar.status || 'online'],
              boxShadow: `0 0 8px ${statusColors[avatar.status || 'online']}`
            }}
          />
          <span style={{ fontSize: '11px', textTransform: 'capitalize', opacity: 0.9 }}>
            {avatar.status || 'online'}
          </span>
        </div>
      </div>
    </Html>
  );
};
