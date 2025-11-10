/**
 * Metaverse Portal Interface Service
 * Manages avatar customization, gestures, animations, and interactions
 */

import { databaseService } from './database-service';
import { wsService } from './websocket';

// Avatar customization types
export interface AvatarCustomization {
  id: string;
  userId: string;
  name: string;
  bodyType: 'humanoid' | 'abstract' | 'geometric' | 'custom';
  appearance: {
    skinColor?: string;
    hairColor?: string;
    eyeColor?: string;
    clothing: {
      type: 'casual' | 'formal' | 'futuristic' | 'fantasy' | 'custom';
      primaryColor: string;
      secondaryColor: string;
      pattern?: string;
    };
    accessories: Array<{
      type: 'hat' | 'glasses' | 'jewelry' | 'tool' | 'badge';
      model?: string;
      color: string;
      position: [number, number, number];
    }>;
  };
  animations: {
    idle: string;
    walk: string;
    run: string;
    jump: string;
    gesture: string[];
  };
  proportions: {
    height: number; // 0.5 to 2.0
    width: number;  // 0.5 to 2.0
    headSize: number; // 0.8 to 1.5
  };
  metadata: {
    dimension?: number;
    agentType?: string;
    churchEncoding?: string;
    capabilities?: string[];
  };
}

// Gesture system types
export interface Gesture {
  id: string;
  name: string;
  type: 'hand' | 'body' | 'facial' | 'full';
  animation: string;
  duration: number;
  trigger: 'manual' | 'auto' | 'voice' | 'event';
  parameters: Record<string, any>;
}

export interface AnimationState {
  currentAnimation: string;
  isPlaying: boolean;
  loop: boolean;
  speed: number;
  weight: number;
  startTime: number;
}

// Visual enhancement types
export interface ParticleEffect {
  id: string;
  type: 'trail' | 'aura' | 'explosion' | 'sparkle' | 'energy';
  position: [number, number, number];
  color: string;
  intensity: number;
  duration: number;
  startTime?: number;
  parameters: Record<string, any>;
}

export interface PostProcessingEffect {
  type: 'bloom' | 'depth-of-field' | 'motion-blur' | 'glow' | 'vignette' | 'chromatic-aberration' | 'noise';
  intensity: number;
  parameters: Record<string, any>;
}

export interface DynamicLighting {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  position?: [number, number, number];
  color: string;
  intensity: number;
  castShadow: boolean;
  animated: boolean;
}

// Object manipulation types
export interface InteractiveObject {
  id: string;
  type: 'static' | 'movable' | 'scalable' | 'rotatable' | 'editable';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  geometry: string;
  material: {
    color: string;
    metalness: number;
    roughness: number;
    transparent: boolean;
    opacity: number;
  };
  constraints?: {
    minPosition?: [number, number, number];
    maxPosition?: [number, number, number];
    minScale?: number;
    maxScale?: number;
  };
  metadata: Record<string, any>;
}

// Collaborative editing types
export interface CollaborativeSession {
  id: string;
  name: string;
  participants: Array<{
    userId: string;
    avatarId: string;
    role: 'owner' | 'editor' | 'viewer';
    cursor?: {
      position: [number, number, number];
      object?: string;
    };
  }>;
  objects: InteractiveObject[];
  history: Array<{
    userId: string;
    action: string;
    objectId: string;
    timestamp: number;
    data: any;
  }>;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
  };
}

// Spatial audio types
export interface SpatialAudioSource {
  id: string;
  type: 'voice' | 'ambient' | 'effect' | 'music';
  position: [number, number, number];
  volume: number;
  maxDistance: number;
  rolloffFactor: number;
  cone?: {
    innerAngle: number;
    outerAngle: number;
    outerGain: number;
  };
  loop: boolean;
  url?: string;
  stream?: MediaStream;
}

export interface AudioZone {
  id: string;
  position: [number, number, number];
  radius: number;
  audioSources: string[];
  effects: Array<{
    type: 'reverb' | 'echo' | 'filter';
    parameters: Record<string, any>;
  }>;
}

// Main service interface
export interface MetaversePortalService {
  // Avatar customization
  createAvatarCustomization(userId: string, customization: Partial<AvatarCustomization>): Promise<AvatarCustomization>;
  updateAvatarCustomization(avatarId: string, updates: Partial<AvatarCustomization>): Promise<AvatarCustomization>;
  getAvatarCustomization(userId: string): Promise<AvatarCustomization | null>;
  deleteAvatarCustomization(avatarId: string): Promise<void>;
  
  // Gesture and animation system
  registerGesture(gesture: Gesture): Promise<void>;
  triggerGesture(avatarId: string, gestureId: string): Promise<void>;
  getAvailableGestures(): Promise<Gesture[]>;
  setAnimationState(avatarId: string, state: Partial<AnimationState>): Promise<void>;
  
  // Visual enhancements
  addParticleEffect(effect: ParticleEffect): Promise<void>;
  removeParticleEffect(effectId: string): Promise<void>;
  setPostProcessingEffects(effects: PostProcessingEffect[]): Promise<void>;
  updateDynamicLighting(lighting: DynamicLighting[]): Promise<void>;
  
  // Object manipulation
  createObject(object: Omit<InteractiveObject, 'id'>): Promise<InteractiveObject>;
  updateObject(objectId: string, updates: Partial<InteractiveObject>): Promise<InteractiveObject>;
  deleteObject(objectId: string): Promise<void>;
  selectObject(objectId: string, userId: string): Promise<void>;
  
  // Collaborative editing
  createSession(name: string, userId: string): Promise<CollaborativeSession>;
  joinSession(sessionId: string, userId: string): Promise<void>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  syncObjectUpdate(sessionId: string, update: any): Promise<void>;
  
  // Spatial audio
  createAudioSource(source: Omit<SpatialAudioSource, 'id'>): Promise<SpatialAudioSource>;
  updateAudioSource(sourceId: string, updates: Partial<SpatialAudioSource>): Promise<void>;
  createAudioZone(zone: Omit<AudioZone, 'id'>): Promise<AudioZone>;
  updateAudioZone(zoneId: string, updates: Partial<AudioZone>): Promise<void>;
}

class MetaversePortalServiceImpl implements MetaversePortalService {
  private avatarCustomizations = new Map<string, AvatarCustomization>();
  private gestures = new Map<string, Gesture>();
  private particleEffects = new Map<string, ParticleEffect>();
  private interactiveObjects = new Map<string, InteractiveObject>();
  private collaborativeSessions = new Map<string, CollaborativeSession>();
  private audioSources = new Map<string, SpatialAudioSource>();
  private audioZones = new Map<string, AudioZone>();
  private animationStates = new Map<string, AnimationState>();

  constructor() {
    this.initializeDefaultGestures();
    this.setupWebSocketHandlers();
  }

  // Avatar Customization Methods
  async createAvatarCustomization(userId: string, customization: Partial<AvatarCustomization>): Promise<AvatarCustomization> {
    const id = `avatar-${userId}-${Date.now()}`;
    const fullCustomization: AvatarCustomization = {
      id,
      userId,
      name: customization.name || 'Default Avatar',
      bodyType: customization.bodyType || 'humanoid',
      appearance: {
        skinColor: '#fdbcb4',
        hairColor: '#4a4a4a',
        eyeColor: '#4a90e2',
        clothing: {
          type: 'casual',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          pattern: 'solid'
        },
        accessories: [],
        ...customization.appearance
      },
      animations: {
        idle: 'idle',
        walk: 'walk',
        run: 'run',
        jump: 'jump',
        gesture: ['wave', 'point', 'thumbs_up'],
        ...customization.animations
      },
      proportions: {
        height: 1.0,
        width: 1.0,
        headSize: 1.0,
        ...customization.proportions
      },
      metadata: customization.metadata || {}
    };

    this.avatarCustomizations.set(id, fullCustomization);
    await this.saveAvatarCustomization(fullCustomization);
    
    // Broadcast avatar creation
    this.broadcastEvent('avatar:created', { avatar: fullCustomization });
    
    return fullCustomization;
  }

  async updateAvatarCustomization(avatarId: string, updates: Partial<AvatarCustomization>): Promise<AvatarCustomization> {
    const existing = this.avatarCustomizations.get(avatarId);
    if (!existing) {
      throw new Error(`Avatar customization not found: ${avatarId}`);
    }

    const updated: AvatarCustomization = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      userId: existing.userId // Preserve user ID
    };

    this.avatarCustomizations.set(avatarId, updated);
    await this.saveAvatarCustomization(updated);
    
    // Broadcast avatar update
    this.broadcastEvent('avatar:updated', { avatarId, updates });
    
    return updated;
  }

  async getAvatarCustomization(userId: string): Promise<AvatarCustomization | null> {
    // Find avatar by userId
    for (const avatar of this.avatarCustomizations.values()) {
      if (avatar.userId === userId) {
        return avatar;
      }
    }
    
    // Try to load from storage
    try {
      const stored = await databaseService.readJSONL('avatar-customizations.jsonl');
      const userAvatar = stored.find((entry: any) => entry.userId === userId);
      if (userAvatar) {
        this.avatarCustomizations.set(userAvatar.id, userAvatar);
        return userAvatar;
      }
    } catch (error) {
      console.warn('Failed to load avatar customization:', error);
    }
    
    return null;
  }

  async deleteAvatarCustomization(avatarId: string): Promise<void> {
    this.avatarCustomizations.delete(avatarId);
    
    // Remove from storage
    try {
      const stored = await databaseService.readJSONL('avatar-customizations.jsonl');
      const filtered = stored.filter((entry: any) => entry.id !== avatarId);
      await databaseService.writeJSONL('avatar-customizations.jsonl', filtered);
    } catch (error) {
      console.warn('Failed to delete avatar customization:', error);
    }
    
    // Broadcast avatar deletion
    this.broadcastEvent('avatar:deleted', { avatarId });
  }

  // Gesture and Animation Methods
  async registerGesture(gesture: Gesture): Promise<void> {
    this.gestures.set(gesture.id, gesture);
    await this.saveGestures();
    this.broadcastEvent('gesture:registered', { gesture });
  }

  async triggerGesture(avatarId: string, gestureId: string): Promise<void> {
    const gesture = this.gestures.get(gestureId);
    if (!gesture) {
      throw new Error(`Gesture not found: ${gestureId}`);
    }

    // Update animation state
    this.animationStates.set(avatarId, {
      currentAnimation: gesture.animation,
      isPlaying: true,
      loop: false,
      speed: 1.0,
      weight: 1.0,
      startTime: Date.now()
    });

    // Broadcast gesture trigger
    this.broadcastEvent('gesture:triggered', { avatarId, gestureId, gesture });
  }

  async getAvailableGestures(): Promise<Gesture[]> {
    return Array.from(this.gestures.values());
  }

  async setAnimationState(avatarId: string, state: Partial<AnimationState>): Promise<void> {
    const existing = this.animationStates.get(avatarId) || {
      currentAnimation: 'idle',
      isPlaying: true,
      loop: true,
      speed: 1.0,
      weight: 1.0,
      startTime: Date.now()
    };

    const updated = { ...existing, ...state };
    this.animationStates.set(avatarId, updated);
    
    this.broadcastEvent('animation:state-changed', { avatarId, state: updated });
  }

  // Visual Enhancement Methods
  async addParticleEffect(effect: ParticleEffect): Promise<void> {
    this.particleEffects.set(effect.id, effect);
    this.broadcastEvent('particle:added', { effect });
  }

  async removeParticleEffect(effectId: string): Promise<void> {
    this.particleEffects.delete(effectId);
    this.broadcastEvent('particle:removed', { effectId });
  }

  async setPostProcessingEffects(effects: PostProcessingEffect[]): Promise<void> {
    this.broadcastEvent('post-processing:updated', { effects });
  }

  async updateDynamicLighting(lighting: DynamicLighting[]): Promise<void> {
    this.broadcastEvent('lighting:updated', { lighting });
  }

  // Object Manipulation Methods
  async createObject(object: Omit<InteractiveObject, 'id'>): Promise<InteractiveObject> {
    const id = `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullObject: InteractiveObject = { id, ...object };
    
    this.interactiveObjects.set(id, fullObject);
    await this.saveObjects();
    
    this.broadcastEvent('object:created', { object: fullObject });
    return fullObject;
  }

  async updateObject(objectId: string, updates: Partial<InteractiveObject>): Promise<InteractiveObject> {
    const existing = this.interactiveObjects.get(objectId);
    if (!existing) {
      throw new Error(`Object not found: ${objectId}`);
    }

    const updated = { ...existing, ...updates };
    this.interactiveObjects.set(objectId, updated);
    await this.saveObjects();
    
    this.broadcastEvent('object:updated', { objectId, updates });
    return updated;
  }

  async deleteObject(objectId: string): Promise<void> {
    this.interactiveObjects.delete(objectId);
    await this.saveObjects();
    
    this.broadcastEvent('object:deleted', { objectId });
  }

  async selectObject(objectId: string, userId: string): Promise<void> {
    this.broadcastEvent('object:selected', { objectId, userId });
  }

  // Collaborative Editing Methods
  async createSession(name: string, userId: string): Promise<CollaborativeSession> {
    const id = `session-${Date.now()}`;
    const session: CollaborativeSession = {
      id,
      name,
      participants: [{
        userId,
        avatarId: `avatar-${userId}`,
        role: 'owner'
      }],
      objects: [],
      history: [],
      permissions: {
        canEdit: true,
        canDelete: true,
        canInvite: true
      }
    };

    this.collaborativeSessions.set(id, session);
    await this.saveSessions();
    
    this.broadcastEvent('session:created', { session });
    return session;
  }

  async joinSession(sessionId: string, userId: string): Promise<void> {
    const session = this.collaborativeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (!existingParticipant) {
      session.participants.push({
        userId,
        avatarId: `avatar-${userId}`,
        role: 'editor'
      });
    }

    await this.saveSessions();
    this.broadcastEvent('session:joined', { sessionId, userId });
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.collaborativeSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.participants = session.participants.filter(p => p.userId !== userId);
    
    if (session.participants.length === 0) {
      this.collaborativeSessions.delete(sessionId);
    } else {
      // Transfer ownership if owner leaves
      const owner = session.participants.find(p => p.role === 'owner');
      if (!owner && session.participants.length > 0) {
        session.participants[0].role = 'owner';
      }
    }

    await this.saveSessions();
    this.broadcastEvent('session:left', { sessionId, userId });
  }

  async syncObjectUpdate(sessionId: string, update: any): Promise<void> {
    const session = this.collaborativeSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.history.push({
      userId: update.userId,
      action: update.action,
      objectId: update.objectId,
      timestamp: Date.now(),
      data: update.data
    });

    // Keep history size manageable
    if (session.history.length > 1000) {
      session.history = session.history.slice(-500);
    }

    await this.saveSessions();
    this.broadcastEvent('session:sync', { sessionId, update });
  }

  // Spatial Audio Methods
  async createAudioSource(source: Omit<SpatialAudioSource, 'id'>): Promise<SpatialAudioSource> {
    const id = `audio-${Date.now()}`;
    const fullSource: SpatialAudioSource = { id, ...source };
    
    this.audioSources.set(id, fullSource);
    await this.saveAudioSources();
    
    this.broadcastEvent('audio:source-created', { source: fullSource });
    return fullSource;
  }

  async updateAudioSource(sourceId: string, updates: Partial<SpatialAudioSource>): Promise<void> {
    const existing = this.audioSources.get(sourceId);
    if (!existing) {
      throw new Error(`Audio source not found: ${sourceId}`);
    }

    const updated = { ...existing, ...updates };
    this.audioSources.set(sourceId, updated);
    await this.saveAudioSources();
    
    this.broadcastEvent('audio:source-updated', { sourceId, updates });
  }

  async createAudioZone(zone: Omit<AudioZone, 'id'>): Promise<AudioZone> {
    const id = `zone-${Date.now()}`;
    const fullZone: AudioZone = { id, ...zone };
    
    this.audioZones.set(id, fullZone);
    await this.saveAudioZones();
    
    this.broadcastEvent('audio:zone-created', { zone: fullZone });
    return fullZone;
  }

  async updateAudioZone(zoneId: string, updates: Partial<AudioZone>): Promise<void> {
    const existing = this.audioZones.get(zoneId);
    if (!existing) {
      throw new Error(`Audio zone not found: ${zoneId}`);
    }

    const updated = { ...existing, ...updates };
    this.audioZones.set(zoneId, updated);
    await this.saveAudioZones();
    
    this.broadcastEvent('audio:zone-updated', { zoneId, updates });
  }

  // Private helper methods
  private async saveAvatarCustomization(avatar: AvatarCustomization): Promise<void> {
    try {
      const existing = await databaseService.readJSONL('avatar-customizations.jsonl');
      const filtered = existing.filter((entry: any) => entry.id !== avatar.id);
      filtered.push(avatar);
      await databaseService.writeJSONL('avatar-customizations.jsonl', filtered);
    } catch (error) {
      console.warn('Failed to save avatar customization:', error);
    }
  }

  private async saveGestures(): Promise<void> {
    try {
      const gestures = Array.from(this.gestures.values());
      await databaseService.writeJSONL('gestures.jsonl', gestures);
    } catch (error) {
      console.warn('Failed to save gestures:', error);
    }
  }

  private async saveObjects(): Promise<void> {
    try {
      const objects = Array.from(this.interactiveObjects.values());
      await databaseService.writeJSONL('interactive-objects.jsonl', objects);
    } catch (error) {
      console.warn('Failed to save objects:', error);
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.collaborativeSessions.values());
      await databaseService.writeJSONL('collaborative-sessions.jsonl', sessions);
    } catch (error) {
      console.warn('Failed to save sessions:', error);
    }
  }

  private async saveAudioSources(): Promise<void> {
    try {
      const sources = Array.from(this.audioSources.values());
      await databaseService.writeJSONL('audio-sources.jsonl', sources);
    } catch (error) {
      console.warn('Failed to save audio sources:', error);
    }
  }

  private async saveAudioZones(): Promise<void> {
    try {
      const zones = Array.from(this.audioZones.values());
      await databaseService.writeJSONL('audio-zones.jsonl', zones);
    } catch (error) {
      console.warn('Failed to save audio zones:', error);
    }
  }

  private initializeDefaultGestures(): void {
    const defaultGestures: Gesture[] = [
      {
        id: 'wave',
        name: 'Wave',
        type: 'hand',
        animation: 'wave',
        duration: 2000,
        trigger: 'manual',
        parameters: { intensity: 1.0 }
      },
      {
        id: 'point',
        name: 'Point',
        type: 'hand',
        animation: 'point',
        duration: 1000,
        trigger: 'manual',
        parameters: { direction: 'forward' }
      },
      {
        id: 'thumbs_up',
        name: 'Thumbs Up',
        type: 'hand',
        animation: 'thumbs_up',
        duration: 1500,
        trigger: 'manual',
        parameters: { enthusiasm: 1.0 }
      },
      {
        id: 'nod',
        name: 'Nod',
        type: 'facial',
        animation: 'nod',
        duration: 1000,
        trigger: 'auto',
        parameters: { count: 1 }
      },
      {
        id: 'dance',
        name: 'Dance',
        type: 'full',
        animation: 'dance',
        duration: 5000,
        trigger: 'manual',
        parameters: { style: 'casual' }
      }
    ];

    defaultGestures.forEach(gesture => {
      this.gestures.set(gesture.id, gesture);
    });
  }

  private setupWebSocketHandlers(): void {
    // Handle real-time collaboration events
    wsService.onUpdateHandlers({
      onStatusUpdate: (data) => {
        // Handle avatar updates from other users
      },
      onActionExecuted: (action, data) => {
        // Handle object updates from collaborative sessions
      },
      onSelfModification: (data) => {
        // Handle gesture triggers from other users
      }
    });
  }

  private broadcastEvent(event: string, data: any): void {
    if (wsService.isConnected()) {
      wsService.sendCommand('metaverse-event', { event, data });
    }
  }
}

export const metaversePortalService: MetaversePortalService = new MetaversePortalServiceImpl();