/**
 * Interaction Propagation Service
 * Handles multi-level interaction propagation (global, local, personal, peer, agentic)
 */

import { InteractionEvent, PropagationLevel, Agent, CollaborativeWorldConfig } from './types';
import { databaseService } from '../database-service';

export interface InteractionPropagationService {
  propagate(interaction: InteractionEvent): Promise<void>;
  routeInteraction(interaction: InteractionEvent): PropagationLevel[];
  queueInteraction(interaction: InteractionEvent): Promise<void>;
  processQueue(): Promise<void>;
}

class InteractionPropagationServiceImpl implements InteractionPropagationService {
  private agents: Map<string, Agent> = new Map();
  private config: CollaborativeWorldConfig;
  private interactionQueue: InteractionEvent[] = [];
  private propagationMultipliers: Record<PropagationLevel, number> = {
    global: 1.0,
    local: 0.7,
    personal: 0.5,
    peer: 0.6,
    agentic: 1.0
  };
  private queueProcessingInterval: number | null = null;
  private listeners: Map<string, Set<(interaction: InteractionEvent) => void>> = new Map();

  constructor(config: CollaborativeWorldConfig) {
    this.config = config;
    this.setupQueueProcessing();
  }

  // Initialize agents
  initializeAgents(agents: Agent[]): void {
    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  // Route interaction to appropriate levels
  routeInteraction(interaction: InteractionEvent): PropagationLevel[] {
    const levels: PropagationLevel[] = [];

    // Determine levels based on interaction type
    switch (interaction.type) {
      case 'touch':
        levels.push('personal', 'peer');
        break;
      case 'communicate':
        levels.push('peer', 'local');
        break;
      case 'collaborate':
        levels.push('local', 'global');
        break;
      case 'learn':
        levels.push('agentic');
        break;
    }

    // Add explicit propagation levels from interaction
    interaction.propagationLevels.forEach(level => {
      if (!levels.includes(level)) {
        levels.push(level);
      }
    });

    return levels;
  }

  // Propagate interaction
  async propagate(interaction: InteractionEvent): Promise<void> {
    const levels = this.routeInteraction(interaction);

    // Process each propagation level
    for (const level of levels) {
      await this.processLevel(interaction, level);
    }

    // Emit event
    this.emit('interaction:propagated', interaction);
  }

  // Process specific propagation level
  private async processLevel(interaction: InteractionEvent, level: PropagationLevel): Promise<void> {
    const multiplier = this.propagationMultipliers[level];
    let result: InteractionEvent;

    switch (level) {
      case 'global':
        result = await this.propagateGlobal(interaction, multiplier);
        await this.applyToAllAgents(result);
        break;

      case 'local':
        result = await this.propagateLocal(interaction, multiplier);
        await this.applyToLocalAgents(interaction.source, result);
        break;

      case 'personal':
        result = await this.propagatePersonal(interaction);
        if (interaction.target) {
          await this.applyToAgent(interaction.target, result);
        }
        break;

      case 'peer':
        result = await this.propagatePeer(interaction);
        if (interaction.target) {
          await this.applyToAgents([interaction.source, interaction.target], result);
        }
        break;

      case 'agentic':
        result = await this.propagateAgentic(interaction);
        await this.applyToAgenticAgents(result);
        break;
    }
  }

  // Global propagation
  private async propagateGlobal(
    interaction: InteractionEvent,
    multiplier: number
  ): Promise<InteractionEvent> {
    // Use R5RS church-mult for global propagation
    const propagated = await this.r5rsMult(interaction, multiplier);
    return {
      ...interaction,
      data: {
        ...interaction.data,
        ...propagated.data,
        propagationLevel: 'global',
        multiplier
      }
    };
  }

  // Local propagation
  private async propagateLocal(
    interaction: InteractionEvent,
    multiplier: number
  ): Promise<InteractionEvent> {
    // Use R5RS church-mult for local propagation
    const propagated = await this.r5rsMult(interaction, multiplier);
    return {
      ...interaction,
      data: {
        ...interaction.data,
        ...propagated.data,
        propagationLevel: 'local',
        multiplier
      }
    };
  }

  // Personal propagation
  private async propagatePersonal(interaction: InteractionEvent): Promise<InteractionEvent> {
    // Use R5RS church-add for personal propagation
    const context = this.getPersonalContext(interaction.target || interaction.source);
    const propagated = await this.r5rsAdd(interaction, context);
    return {
      ...interaction,
      data: {
        ...interaction.data,
        ...propagated.data,
        propagationLevel: 'personal',
        context
      }
    };
  }

  // Peer propagation
  private async propagatePeer(interaction: InteractionEvent): Promise<InteractionEvent> {
    // Use R5RS church-add for peer propagation
    const context = this.getPeerContext(interaction.source, interaction.target || '');
    const propagated = await this.r5rsAdd(interaction, context);
    return {
      ...interaction,
      data: {
        ...interaction.data,
        ...propagated.data,
        propagationLevel: 'peer',
        context
      }
    };
  }

  // Agentic propagation
  private async propagateAgentic(interaction: InteractionEvent): Promise<InteractionEvent> {
    // Use R5RS church-exp for agentic propagation
    const power = this.getAgenticPower(interaction.source);
    const propagated = await this.r5rsExp(interaction, power);
    return {
      ...interaction,
      data: {
        ...interaction.data,
        ...propagated.data,
        propagationLevel: 'agentic',
        power
      },
      learningWeight: 1.0
    };
  }

  // Apply to all agents
  private async applyToAllAgents(interaction: InteractionEvent): Promise<void> {
    this.agents.forEach((agent) => {
      this.applyInteractionToAgent(agent.id, interaction);
    });
  }

  // Apply to local agents
  private async applyToLocalAgents(sourceId: string, interaction: InteractionEvent): Promise<void> {
    const sourceAgent = this.agents.get(sourceId);
    if (!sourceAgent) return;

    const radius = this.config.interactionRadius;
    this.agents.forEach((agent) => {
      if (agent.id === sourceId) return;
      const distance = this.calculateDistance(sourceAgent.position, agent.position);
      if (distance <= radius) {
        this.applyInteractionToAgent(agent.id, interaction);
      }
    });
  }

  // Apply to specific agent
  private async applyToAgent(agentId: string, interaction: InteractionEvent): Promise<void> {
    this.applyInteractionToAgent(agentId, interaction);
  }

  // Apply to multiple agents
  private async applyToAgents(agentIds: string[], interaction: InteractionEvent): Promise<void> {
    agentIds.forEach(agentId => {
      this.applyInteractionToAgent(agentId, interaction);
    });
  }

  // Apply to agentic agents
  private async applyToAgenticAgents(interaction: InteractionEvent): Promise<void> {
    this.agents.forEach((agent) => {
      if (agent.learningEnabled) {
        this.applyInteractionToAgent(agent.id, interaction);
      }
    });
  }

  // Apply interaction to agent
  private applyInteractionToAgent(agentId: string, interaction: InteractionEvent): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Emit event for agent
    this.emit(`agent:${agentId}:interaction`, interaction);

    // Update agent state based on interaction
    if (interaction.type === 'touch') {
      agent.animationState = 'gesturing';
    } else if (interaction.type === 'communicate') {
      agent.animationState = 'idle';
    } else if (interaction.type === 'collaborate') {
      agent.animationState = 'dancing';
    }
  }

  // Queue interaction
  async queueInteraction(interaction: InteractionEvent): Promise<void> {
    this.interactionQueue.push(interaction);
    this.emit('interaction:queued', interaction);
  }

  // Process queue
  async processQueue(): Promise<void> {
    if (this.interactionQueue.length === 0) return;

    const interaction = this.interactionQueue.shift();
    if (!interaction) return;

    await this.propagate(interaction);
  }

  // Setup queue processing
  private setupQueueProcessing(): void {
    this.queueProcessingInterval = window.setInterval(() => {
      this.processQueue().catch(console.error);
    }, this.config.propagationDelay);
  }

  // Helper methods
  private getPersonalContext(agentId: string): any {
    const agent = this.agents.get(agentId);
    return {
      agentId,
      dimension: agent?.dimension,
      position: agent?.position,
      personalContext: true
    };
  }

  private getPeerContext(sourceId: string, targetId: string): any {
    const sourceAgent = this.agents.get(sourceId);
    const targetAgent = this.agents.get(targetId);
    return {
      sourceId,
      targetId,
      sourceDimension: sourceAgent?.dimension,
      targetDimension: targetAgent?.dimension,
      peerContext: true
    };
  }

  private getAgenticPower(agentId: string): number {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.learningEnabled) return 1.0;
    
    // Higher power for higher dimensions
    const dimensionPower: Record<string, number> = {
      '0D': 1.0,
      '1D': 1.1,
      '2D': 1.2,
      '3D': 1.3,
      '4D': 1.4,
      '5D': 1.5,
      '6D': 2.0,
      '7D': 2.5
    };

    return dimensionPower[agent.dimension] || 1.0;
  }

  private calculateDistance(
    a: [number, number, number],
    b: [number, number, number]
  ): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // R5RS function wrappers
  private async r5rsMult(interaction: InteractionEvent, multiplier: number): Promise<any> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-mult', [
        interaction.data,
        multiplier
      ]);
      return { data: result };
    } catch (error) {
      // Fallback
      return {
        data: {
          ...interaction.data,
          multiplier
        }
      };
    }
  }

  private async r5rsAdd(interaction: InteractionEvent, context: any): Promise<any> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-add', [
        interaction.data,
        context
      ]);
      return { data: result };
    } catch (error) {
      // Fallback
      return {
        data: {
          ...interaction.data,
          ...context
        }
      };
    }
  }

  private async r5rsExp(interaction: InteractionEvent, power: number): Promise<any> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-exp', [
        interaction.data,
        power
      ]);
      return { data: result };
    } catch (error) {
      // Fallback - approximate with multiplication
      return {
        data: {
          ...interaction.data,
          power,
          amplified: true
        }
      };
    }
  }

  // Event system
  on(event: string, callback: (interaction: InteractionEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (interaction: InteractionEvent) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, interaction: InteractionEvent): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(interaction);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  destroy(): void {
    if (this.queueProcessingInterval !== null) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
    }
  }
}

// Singleton instance
let instance: InteractionPropagationServiceImpl | null = null;

export const interactionPropagationService: InteractionPropagationService = {
  async propagate(interaction: InteractionEvent) {
    if (!instance) throw new Error('InteractionPropagationService not initialized');
    return instance.propagate(interaction);
  },
  routeInteraction(interaction: InteractionEvent) {
    if (!instance) throw new Error('InteractionPropagationService not initialized');
    return instance.routeInteraction(interaction);
  },
  async queueInteraction(interaction: InteractionEvent) {
    if (!instance) throw new Error('InteractionPropagationService not initialized');
    return instance.queueInteraction(interaction);
  },
  async processQueue() {
    if (!instance) throw new Error('InteractionPropagationService not initialized');
    return instance.processQueue();
  }
};

export function initializeInteractionPropagationService(
  config: CollaborativeWorldConfig,
  agents: Agent[]
): void {
  instance = new InteractionPropagationServiceImpl(config);
  instance.initializeAgents(agents);
}

export function getInteractionPropagationService(): InteractionPropagationServiceImpl | null {
  return instance;
}
