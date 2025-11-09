/**
 * Lighting Service
 * Dynamic lighting management and state synchronization
 */

import { LightingConfig } from '../components/VirtualWorld/WorldLightingSystem';
import { WeatherType } from '../components/VirtualWorld/WeatherSystem';
import { PostProcessingConfig } from '../components/VirtualWorld/PostProcessingSystem';

export interface DynamicLight {
  id: string;
  type: 'point' | 'directional' | 'spot' | 'ambient';
  position?: [number, number, number];
  color: string;
  intensity: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  castShadow?: boolean;
  animated?: boolean;
  animationConfig?: {
    type: 'pulse' | 'flicker' | 'color' | 'rotate';
    speed?: number;
    intensity?: number;
    colors?: string[];
  };
}

export interface LightingState {
  config: LightingConfig;
  dynamicLights: Map<string, DynamicLight>;
  weather: WeatherType;
  weatherIntensity: number;
  postProcessing: PostProcessingConfig;
}

export interface LightingServiceEvents {
  'light:add': (light: DynamicLight) => void;
  'light:remove': (lightId: string) => void;
  'light:update': (light: DynamicLight) => void;
  'lighting:change': (config: LightingConfig) => void;
  'weather:change': (weather: WeatherType, intensity: number) => void;
  'postprocessing:change': (config: PostProcessingConfig) => void;
}

class LightingService {
  private state: LightingState;
  private listeners: Map<keyof LightingServiceEvents, Set<Function>> = new Map();
  private animationInterval: number | null = null;

  constructor() {
    this.state = {
      config: {
        type: 'day',
        sunIntensity: 1,
        ambientIntensity: 0.6,
        enableShadows: true
      },
      dynamicLights: new Map(),
      weather: 'clear',
      weatherIntensity: 0,
      postProcessing: {}
    };

    this.setupAnimationLoop();
  }

  // Event system
  on<K extends keyof LightingServiceEvents>(event: K, callback: LightingServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof LightingServiceEvents>(event: K, callback: LightingServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof LightingServiceEvents>(event: K, ...args: Parameters<LightingServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Lighting config
  setLightingConfig(config: Partial<LightingConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    this.emit('lighting:change', this.state.config);
  }

  getLightingConfig(): LightingConfig {
    return this.state.config;
  }

  // Dynamic lights
  addLight(light: DynamicLight): string {
    this.state.dynamicLights.set(light.id, light);
    this.emit('light:add', light);
    return light.id;
  }

  removeLight(lightId: string): void {
    if (this.state.dynamicLights.has(lightId)) {
      this.state.dynamicLights.delete(lightId);
      this.emit('light:remove', lightId);
    }
  }

  updateLight(lightId: string, updates: Partial<DynamicLight>): void {
    const light = this.state.dynamicLights.get(lightId);
    if (!light) {
      console.warn(`Light ${lightId} not found`);
      return;
    }

    const updatedLight = { ...light, ...updates };
    this.state.dynamicLights.set(lightId, updatedLight);
    this.emit('light:update', updatedLight);
  }

  getLight(lightId: string): DynamicLight | undefined {
    return this.state.dynamicLights.get(lightId);
  }

  getAllLights(): DynamicLight[] {
    return Array.from(this.state.dynamicLights.values());
  }

  // Weather
  setWeather(weather: WeatherType, intensity: number = 0.5): void {
    this.state.weather = weather;
    this.state.weatherIntensity = intensity;
    this.emit('weather:change', weather, intensity);
  }

  getWeather(): { type: WeatherType; intensity: number } {
    return {
      type: this.state.weather,
      intensity: this.state.weatherIntensity
    };
  }

  // Post-processing
  setPostProcessing(config: Partial<PostProcessingConfig>): void {
    this.state.postProcessing = { ...this.state.postProcessing, ...config };
    this.emit('postprocessing:change', this.state.postProcessing);
  }

  getPostProcessing(): PostProcessingConfig {
    return this.state.postProcessing;
  }

  // Light animations
  private setupAnimationLoop(): void {
    this.animationInterval = window.setInterval(() => {
      this.state.dynamicLights.forEach((light, id) => {
        if (light.animated && light.animationConfig) {
          this.updateAnimatedLight(id, light);
        }
      });
    }, 16); // ~60 FPS
  }

  private updateAnimatedLight(lightId: string, light: DynamicLight): void {
    const { type, speed = 1, intensity: animIntensity = 0.1, colors = [] } = light.animationConfig!;
    const time = Date.now() * 0.001 * speed;

    switch (type) {
      case 'pulse':
        const pulseIntensity = light.intensity + Math.sin(time) * animIntensity;
        this.updateLight(lightId, { intensity: pulseIntensity });
        break;

      case 'flicker':
        const flickerIntensity = light.intensity + (Math.random() - 0.5) * animIntensity;
        this.updateLight(lightId, { intensity: Math.max(0, flickerIntensity) });
        break;

      case 'color':
        if (colors.length > 0) {
          const colorIndex = Math.floor(time) % colors.length;
          this.updateLight(lightId, { color: colors[colorIndex] });
        }
        break;

      case 'rotate':
        // Rotate light position (for spot/directional lights)
        if (light.position) {
          const radius = Math.sqrt(
            light.position[0] ** 2 + light.position[1] ** 2 + light.position[2] ** 2
          );
          const newPosition: [number, number, number] = [
            Math.cos(time) * radius,
            light.position[1],
            Math.sin(time) * radius
          ];
          this.updateLight(lightId, { position: newPosition });
        }
        break;
    }
  }

  // Queries
  getLightsByType(type: DynamicLight['type']): DynamicLight[] {
    return Array.from(this.state.dynamicLights.values()).filter(l => l.type === type);
  }

  getLightsInRange(position: [number, number, number], range: number): DynamicLight[] {
    return Array.from(this.state.dynamicLights.values()).filter(light => {
      if (!light.position) return false;
      const distance = Math.sqrt(
        Math.pow(light.position[0] - position[0], 2) +
        Math.pow(light.position[1] - position[1], 2) +
        Math.pow(light.position[2] - position[2], 2)
      );
      return distance <= range;
    });
  }

  // Cleanup
  destroy(): void {
    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval);
    }
    this.state.dynamicLights.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const lightingService = new LightingService();

// Export for testing
export { LightingService };
