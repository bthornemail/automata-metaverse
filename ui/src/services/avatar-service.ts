/**
 * Avatar Service
 * Centralized avatar management and state synchronization
 */

import { AvatarConfig } from '../components/VirtualWorld/EnhancedGLTFAvatar';
import { GestureType } from '../components/VirtualWorld/AvatarGestureSystem';

export interface AvatarState {
  config: AvatarConfig;
  currentZone?: string;
  targetPosition?: [number, number, number];
  isMoving: boolean;
  currentGesture?: GestureType;
  animationState: 'idle' | 'walking' | 'running' | 'jumping' | 'sitting' | 'dancing' | 'gesturing';
  lastUpdate: number;
  metadata?: {
    health?: number;
    energy?: number;
    level?: number;
    experience?: number;
  };
}

export interface AvatarServiceEvents {
  'avatar:join': (avatar: AvatarState) => void;
  'avatar:leave': (avatarId: string) => void;
  'avatar:update': (avatar: AvatarState) => void;
  'avatar:move': (avatarId: string, position: [number, number, number]) => void;
  'avatar:gesture': (avatarId: string, gesture: GestureType) => void;
  'avatar:animation': (avatarId: string, animation: AvatarState['animationState']) => void;
}

class AvatarService {
  private avatars: Map<string, AvatarState> = new Map();
  private listeners: Map<keyof AvatarServiceEvents, Set<Function>> = new Map();
  private updateInterval: number | null = null;

  constructor() {
    this.setupUpdateLoop();
  }

  // Event system
  on<K extends keyof AvatarServiceEvents>(event: K, callback: AvatarServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof AvatarServiceEvents>(event: K, callback: AvatarServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof AvatarServiceEvents>(event: K, ...args: Parameters<AvatarServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Avatar management
  addAvatar(config: AvatarConfig): string {
    const avatarState: AvatarState = {
      config,
      isMoving: false,
      animationState: 'idle',
      lastUpdate: Date.now()
    };

    this.avatars.set(config.id, avatarState);
    this.emit('avatar:join', avatarState);
    return config.id;
  }

  removeAvatar(avatarId: string): void {
    if (this.avatars.has(avatarId)) {
      this.avatars.delete(avatarId);
      this.emit('avatar:leave', avatarId);
    }
  }

  getAvatar(avatarId: string): AvatarState | undefined {
    return this.avatars.get(avatarId);
  }

  getAllAvatars(): AvatarState[] {
    return Array.from(this.avatars.values());
  }

  // Avatar updates
  updateAvatar(avatarId: string, updates: Partial<AvatarState>): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      console.warn(`Avatar ${avatarId} not found`);
      return;
    }

    const updatedAvatar: AvatarState = {
      ...avatar,
      ...updates,
      lastUpdate: Date.now()
    };

    this.avatars.set(avatarId, updatedAvatar);
    this.emit('avatar:update', updatedAvatar);
  }

  updateAvatarConfig(avatarId: string, configUpdates: Partial<AvatarConfig>): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    this.updateAvatar(avatarId, {
      config: { ...avatar.config, ...configUpdates }
    });
  }

  // Movement
  moveAvatar(avatarId: string, targetPosition: [number, number, number]): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    this.updateAvatar(avatarId, {
      targetPosition,
      isMoving: true,
      animationState: 'walking'
    });

    this.emit('avatar:move', avatarId, targetPosition);
  }

  // Gestures
  triggerGesture(avatarId: string, gesture: GestureType): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    this.updateAvatar(avatarId, {
      currentGesture: gesture,
      animationState: 'gesturing'
    });

    this.emit('avatar:gesture', avatarId, gesture);
  }

  // Animations
  setAnimationState(avatarId: string, animationState: AvatarState['animationState']): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    this.updateAvatar(avatarId, {
      animationState,
      currentGesture: animationState === 'gesturing' ? avatar.currentGesture : undefined
    });

    this.emit('avatar:animation', avatarId, animationState);
  }

  // Zone management
  setAvatarZone(avatarId: string, zoneId: string): void {
    this.updateAvatar(avatarId, {
      currentZone: zoneId
    });
  }

  getAvatarsInZone(zoneId: string): AvatarState[] {
    return Array.from(this.avatars.values()).filter(
      avatar => avatar.currentZone === zoneId
    );
  }

  getAvatarsByDimension(dimension: string): AvatarState[] {
    return Array.from(this.avatars.values()).filter(
      avatar => avatar.config.dimension === dimension
    );
  }

  // Status updates
  setAvatarStatus(avatarId: string, status: 'online' | 'offline' | 'away'): void {
    this.updateAvatarConfig(avatarId, { status });
  }

  // Metadata
  updateAvatarMetadata(avatarId: string, metadata: Partial<AvatarState['metadata']>): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    this.updateAvatar(avatarId, {
      metadata: { ...avatar.metadata, ...metadata }
    });
  }

  // Update loop for movement interpolation
  private setupUpdateLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.avatars.forEach((avatar, id) => {
        if (avatar.isMoving && avatar.targetPosition) {
          // Interpolate position (simplified - actual implementation would use proper interpolation)
          const currentPos = avatar.config.position;
          const targetPos = avatar.targetPosition;
          const distance = Math.sqrt(
            Math.pow(targetPos[0] - currentPos[0], 2) +
            Math.pow(targetPos[1] - currentPos[1], 2) +
            Math.pow(targetPos[2] - currentPos[2], 2)
          );

          if (distance < 0.1) {
            // Reached target
            this.updateAvatar(id, {
              isMoving: false,
              animationState: 'idle',
              targetPosition: undefined,
              config: {
                ...avatar.config,
                position: targetPos
              }
            });
          }
        }
      });
    }, 16); // ~60 FPS
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    this.avatars.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const avatarService = new AvatarService();

// Export for testing
export { AvatarService };
