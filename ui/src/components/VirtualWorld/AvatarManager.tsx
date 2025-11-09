/**
 * Avatar Manager
 * Manages avatar registry, positions, and coordination
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { AvatarConfig } from './EnhancedGLTFAvatar';
import { useWorldLayout } from './WorldLayoutManager';

export interface AvatarState {
  config: AvatarConfig;
  currentZone?: string;
  targetPosition?: [number, number, number];
  isMoving: boolean;
  lastUpdate: number;
}

interface AvatarManagerContextType {
  avatars: Map<string, AvatarState>;
  addAvatar: (config: AvatarConfig) => void;
  removeAvatar: (id: string) => void;
  updateAvatar: (id: string, updates: Partial<AvatarConfig>) => void;
  moveAvatar: (id: string, targetPosition: [number, number, number]) => void;
  getAvatar: (id: string) => AvatarState | undefined;
  getAvatarsInZone: (zoneId: string) => AvatarState[];
  getAvatarsByDimension: (dimension: string) => AvatarState[];
}

const AvatarManagerContext = createContext<AvatarManagerContextType | null>(null);

export const useAvatarManager = () => {
  const context = useContext(AvatarManagerContext);
  if (!context) {
    throw new Error('useAvatarManager must be used within AvatarManagerProvider');
  }
  return context;
};

interface AvatarManagerProviderProps {
  children: React.ReactNode;
  initialAvatars?: AvatarConfig[];
}

export const AvatarManagerProvider: React.FC<AvatarManagerProviderProps> = ({
  children,
  initialAvatars = []
}) => {
  const [avatars, setAvatars] = useState<Map<string, AvatarState>>(new Map());
  const { getZoneForPosition, addAvatarToZone, removeAvatarFromZone } = useWorldLayout();

  // Initialize with initial avatars
  useMemo(() => {
    if (initialAvatars.length > 0) {
      const initialMap = new Map<string, AvatarState>();
      initialAvatars.forEach(config => {
        const zone = getZoneForPosition(config.position);
        initialMap.set(config.id, {
          config,
          currentZone: zone?.id,
          isMoving: false,
          lastUpdate: Date.now()
        });
        if (zone) {
          addAvatarToZone(zone.id, config.id);
        }
      });
      setAvatars(initialMap);
    }
  }, []); // Only run once on mount

  const addAvatar = useCallback((config: AvatarConfig) => {
    setAvatars(prev => {
      const next = new Map(prev);
      const zone = getZoneForPosition(config.position);
      
      next.set(config.id, {
        config,
        currentZone: zone?.id,
        isMoving: false,
        lastUpdate: Date.now()
      });

      if (zone) {
        addAvatarToZone(zone.id, config.id);
      }

      return next;
    });
  }, [getZoneForPosition, addAvatarToZone]);

  const removeAvatar = useCallback((id: string) => {
    setAvatars(prev => {
      const next = new Map(prev);
      const avatar = next.get(id);
      
      if (avatar?.currentZone) {
        removeAvatarFromZone(avatar.currentZone, id);
      }
      
      next.delete(id);
      return next;
    });
  }, [removeAvatarFromZone]);

  const updateAvatar = useCallback((id: string, updates: Partial<AvatarConfig>) => {
    setAvatars(prev => {
      const next = new Map(prev);
      const current = next.get(id);
      
      if (!current) return prev;

      const updatedConfig = { ...current.config, ...updates };
      const updatedPosition = updates.position || current.config.position;
      const zone = getZoneForPosition(updatedPosition);

      // Handle zone changes
      if (zone?.id !== current.currentZone) {
        if (current.currentZone) {
          removeAvatarFromZone(current.currentZone, id);
        }
        if (zone) {
          addAvatarToZone(zone.id, id);
        }
      }

      next.set(id, {
        ...current,
        config: updatedConfig,
        currentZone: zone?.id,
        lastUpdate: Date.now()
      });

      return next;
    });
  }, [getZoneForPosition, addAvatarToZone, removeAvatarFromZone]);

  const moveAvatar = useCallback((id: string, targetPosition: [number, number, number]) => {
    setAvatars(prev => {
      const next = new Map(prev);
      const current = next.get(id);
      
      if (!current) return prev;

      const zone = getZoneForPosition(targetPosition);

      // Handle zone changes
      if (zone?.id !== current.currentZone) {
        if (current.currentZone) {
          removeAvatarFromZone(current.currentZone, id);
        }
        if (zone) {
          addAvatarToZone(zone.id, id);
        }
      }

      next.set(id, {
        ...current,
        config: { ...current.config, position: targetPosition },
        targetPosition,
        isMoving: true,
        currentZone: zone?.id,
        lastUpdate: Date.now()
      });

      return next;
    });
  }, [getZoneForPosition, addAvatarToZone, removeAvatarFromZone]);

  const getAvatar = useCallback((id: string) => {
    return avatars.get(id);
  }, [avatars]);

  const getAvatarsInZone = useCallback((zoneId: string) => {
    return Array.from(avatars.values()).filter(avatar => avatar.currentZone === zoneId);
  }, [avatars]);

  const getAvatarsByDimension = useCallback((dimension: string) => {
    return Array.from(avatars.values()).filter(
      avatar => avatar.config.dimension === dimension
    );
  }, [avatars]);

  const value = useMemo(
    () => ({
      avatars,
      addAvatar,
      removeAvatar,
      updateAvatar,
      moveAvatar,
      getAvatar,
      getAvatarsInZone,
      getAvatarsByDimension
    }),
    [avatars, addAvatar, removeAvatar, updateAvatar, moveAvatar, getAvatar, getAvatarsInZone, getAvatarsByDimension]
  );

  return (
    <AvatarManagerContext.Provider value={value}>
      {children}
    </AvatarManagerContext.Provider>
  );
};
