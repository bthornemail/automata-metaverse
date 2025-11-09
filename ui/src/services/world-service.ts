/**
 * World Service
 * Centralized world state management and coordination
 */

import { avatarService } from './avatar-service';
import { buildingService } from './building-service';
import { pathService } from './path-service';
import { lightingService } from './lighting-service';
import { cameraService } from './camera-service';

export interface WorldState {
  id: string;
  name: string;
  version: string;
  timestamp: number;
  avatars: any[];
  buildings: any[];
  paths: any[];
  lighting: any;
  camera: any;
  layout: any;
}

export interface WorldSettings {
  // Performance
  maxAvatars?: number;
  maxBuildings?: number;
  enableLOD?: boolean;
  enableFrustumCulling?: boolean;
  enableObjectPooling?: boolean;
  // Rendering
  shadowQuality?: 'low' | 'medium' | 'high';
  particleCount?: number;
  enablePostProcessing?: boolean;
  // World
  worldSize?: number;
  zoneCount?: number;
  enableWeather?: boolean;
  enableDayNightCycle?: boolean;
  // Multiplayer
  enableMultiplayer?: boolean;
  syncInterval?: number;
  // Debug
  enableDebug?: boolean;
  showStats?: boolean;
  showWireframes?: boolean;
}

export interface WorldMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  avatars: number;
  buildings: number;
  memoryUsage: number;
  timestamp: number;
}

export interface WorldServiceEvents {
  'world:state-change': (state: WorldState) => void;
  'world:settings-change': (settings: WorldSettings) => void;
  'world:metrics-update': (metrics: WorldMetrics) => void;
  'world:save': (state: WorldState) => void;
  'world:load': (state: WorldState) => void;
  'world:error': (error: Error) => void;
}

class WorldService {
  private state: WorldState;
  private settings: WorldSettings;
  private metrics: WorldMetrics;
  private listeners: Map<keyof WorldServiceEvents, Set<Function>> = new Map();
  private metricsInterval: number | null = null;

  constructor() {
    this.state = {
      id: `world-${Date.now()}`,
      name: 'Virtual World',
      version: '1.0.0',
      timestamp: Date.now(),
      avatars: [],
      buildings: [],
      paths: [],
      lighting: {},
      camera: {},
      layout: {}
    };

    this.settings = {
      maxAvatars: 50,
      maxBuildings: 100,
      enableLOD: true,
      enableFrustumCulling: true,
      enableObjectPooling: true,
      shadowQuality: 'medium',
      particleCount: 1000,
      enablePostProcessing: false,
      worldSize: 200,
      zoneCount: 5,
      enableWeather: true,
      enableDayNightCycle: true,
      enableMultiplayer: false,
      syncInterval: 100,
      enableDebug: false,
      showStats: false,
      showWireframes: false
    };

    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      avatars: 0,
      buildings: 0,
      memoryUsage: 0,
      timestamp: Date.now()
    };
  }

  // Event system
  on<K extends keyof WorldServiceEvents>(event: K, callback: WorldServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof WorldServiceEvents>(event: K, callback: WorldServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof WorldServiceEvents>(event: K, ...args: Parameters<WorldServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // World state management
  getState(): WorldState {
    return { ...this.state };
  }

  setState(updates: Partial<WorldState>): void {
    this.state = { ...this.state, ...updates, timestamp: Date.now() };
    this.emit('world:state-change', this.state);
  }

  // Settings management
  getSettings(): WorldSettings {
    return { ...this.settings };
  }

  setSettings(updates: Partial<WorldSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.emit('world:settings-change', this.settings);
  }

  // Metrics
  getMetrics(): WorldMetrics {
    return { ...this.metrics };
  }

  updateMetrics(updates: Partial<WorldMetrics>): void {
    this.metrics = { ...this.metrics, ...updates, timestamp: Date.now() };
    this.emit('world:metrics-update', this.metrics);
  }

  startMetricsCollection(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = window.setInterval(() => {
      // Collect metrics from services
      const avatars = avatarService.getAllAvatars().length;
      const buildings = buildingService.getAllBuildings().length;
      
      this.updateMetrics({
        avatars,
        buildings,
        // FPS and frame time would be collected from renderer
        // drawCalls and triangles would be collected from renderer stats
      });
    }, 1000);
  }

  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // World persistence
  save(): string {
    const state = {
      ...this.state,
      avatars: avatarService.getAllAvatars().map(a => a.config),
      buildings: buildingService.getAllBuildings().map(b => b.building),
      paths: pathService.getPaths(),
      lighting: lightingService.getLightingState(),
      camera: cameraService.getCameraState()
    };

    const json = JSON.stringify(state, null, 2);
    this.emit('world:save', state);
    return json;
  }

  load(json: string): void {
    try {
      const state = JSON.parse(json) as WorldState;
      
      // Restore state
      this.setState(state);

      // Restore services
      state.avatars.forEach(avatar => avatarService.addAvatar(avatar));
      state.buildings.forEach(building => buildingService.registerBuilding(building));
      state.paths.forEach(path => pathService.registerPath(path));
      if (state.lighting) lightingService.setLightingConfig(state.lighting);
      if (state.camera) cameraService.setCameraState(state.camera);

      this.emit('world:load', state);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load world state');
      this.emit('world:error', err);
      throw err;
    }
  }

  // World coordination
  syncServices(): void {
    // Sync all services with world state
    const state = this.getState();
    
    // Update service states
    avatarService.getAllAvatars().forEach(avatar => {
      if (!state.avatars.find(a => a.id === avatar.id)) {
        state.avatars.push(avatar);
      }
    });

    buildingService.getAllBuildings().forEach(building => {
      if (!state.buildings.find(b => b.id === building.building.id)) {
        state.buildings.push(building.building);
      }
    });

    this.setState(state);
  }

  // Cleanup
  destroy(): void {
    this.stopMetricsCollection();
    this.listeners.clear();
  }
}

// Singleton instance
export const worldService = new WorldService();

// Export for testing
export { WorldService };
