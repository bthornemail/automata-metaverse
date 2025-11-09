/**
 * Camera Service
 * Centralized camera state management and transitions
 */

import { CameraMode } from '../components/VirtualWorld/VirtualWorldCamera';
import { EnhancedCameraMode } from '../components/VirtualWorld/EnhancedCamera';

export interface CameraState {
  mode: EnhancedCameraMode;
  target: [number, number, number];
  position: [number, number, number];
  distance: number;
  height: number;
  fov: number;
  rotation?: [number, number, number];
}

export interface CameraTransition {
  from: CameraState;
  to: CameraState;
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  onComplete?: () => void;
}

export interface CameraServiceEvents {
  'camera:change': (state: CameraState) => void;
  'camera:transition': (transition: CameraTransition) => void;
  'camera:update': (state: CameraState) => void;
  'camera:preset': (preset: string) => void;
}

class CameraService {
  private state: CameraState;
  private listeners: Map<keyof CameraServiceEvents, Set<Function>> = new Map();
  private transitionRef: { current: CameraTransition | null } = { current: null };
  private transitionStartTime: number = 0;

  constructor() {
    this.state = {
      mode: 'orbital',
      target: [0, 0, 0],
      position: [0, 15, 25],
      distance: 25,
      height: 1.6,
      fov: 75
    };
  }

  // Event system
  on<K extends keyof CameraServiceEvents>(event: K, callback: CameraServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof CameraServiceEvents>(event: K, callback: CameraServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof CameraServiceEvents>(event: K, ...args: Parameters<CameraServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Camera state management
  setCameraState(state: Partial<CameraState>): void {
    this.state = { ...this.state, ...state };
    this.emit('camera:update', this.state);
  }

  getCameraState(): CameraState {
    return { ...this.state };
  }

  // Camera mode changes
  setMode(mode: EnhancedCameraMode): void {
    this.state.mode = mode;
    this.emit('camera:change', this.state);
    this.emit('camera:update', this.state);
  }

  setTarget(target: [number, number, number]): void {
    this.state.target = target;
    this.emit('camera:update', this.state);
  }

  setPosition(position: [number, number, number]): void {
    this.state.position = position;
    this.emit('camera:update', this.state);
  }

  setDistance(distance: number): void {
    this.state.distance = distance;
    this.emit('camera:update', this.state);
  }

  setFOV(fov: number): void {
    this.state.fov = fov;
    this.emit('camera:update', this.state);
  }

  // Camera transitions
  transition(transition: CameraTransition): void {
    this.transitionRef.current = transition;
    this.transitionStartTime = Date.now();
    this.emit('camera:transition', transition);
  }

  // Get interpolated state during transition
  getTransitionState(): CameraState | null {
    if (!this.transitionRef.current) return null;

    const elapsed = (Date.now() - this.transitionStartTime) / 1000;
    const progress = Math.min(elapsed / this.transitionRef.current.duration, 1);

    const easedProgress = this.applyEasing(
      progress,
      this.transitionRef.current.easing
    );

    const from = this.transitionRef.current.from;
    const to = this.transitionRef.current.to;

    const state: CameraState = {
      mode: to.mode,
      target: [
        from.target[0] + (to.target[0] - from.target[0]) * easedProgress,
        from.target[1] + (to.target[1] - from.target[1]) * easedProgress,
        from.target[2] + (to.target[2] - from.target[2]) * easedProgress
      ],
      position: [
        from.position[0] + (to.position[0] - from.position[0]) * easedProgress,
        from.position[1] + (to.position[1] - from.position[1]) * easedProgress,
        from.position[2] + (to.position[2] - from.position[2]) * easedProgress
      ],
      distance: from.distance + (to.distance - from.distance) * easedProgress,
      height: from.height + (to.height - from.height) * easedProgress,
      fov: from.fov + (to.fov - from.fov) * easedProgress
    };

    if (progress >= 1) {
      this.state = to;
      this.transitionRef.current.onComplete?.();
      this.transitionRef.current = null;
    }

    return state;
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }

  // Camera presets
  applyPreset(preset: string): void {
    const presets: Record<string, Partial<CameraState>> = {
      overview: {
        mode: 'orbital',
        target: [0, 0, 0],
        distance: 30,
        fov: 60
      },
      close: {
        mode: 'orbital',
        target: [0, 0, 0],
        distance: 10,
        fov: 75
      },
      firstPerson: {
        mode: 'first-person',
        height: 1.6,
        fov: 90
      },
      thirdPerson: {
        mode: 'third-person',
        distance: 5,
        height: 1.6,
        fov: 75
      },
      topDown: {
        mode: 'top-down',
        target: [0, 0, 0],
        position: [0, 50, 0],
        fov: 60
      }
    };

    const presetConfig = presets[preset];
    if (presetConfig) {
      this.setCameraState(presetConfig);
      this.emit('camera:preset', preset);
    }
  }

  // Smooth camera movement
  smoothMoveTo(position: [number, number, number], duration: number = 1): void {
    const transition: CameraTransition = {
      from: { ...this.state },
      to: { ...this.state, position },
      duration,
      easing: 'easeInOut'
    };
    this.transition(transition);
  }

  // Smooth look at
  smoothLookAt(target: [number, number, number], duration: number = 1): void {
    const transition: CameraTransition = {
      from: { ...this.state },
      to: { ...this.state, target },
      duration,
      easing: 'easeInOut'
    };
    this.transition(transition);
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.transitionRef.current = null;
  }
}

// Singleton instance
export const cameraService = new CameraService();

// Export for testing
export { CameraService };
