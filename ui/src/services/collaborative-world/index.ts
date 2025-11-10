/**
 * Collaborative World Service
 * Main entry point for AI Portal Collaborative World Creation Environment
 */

export * from './types';
export * from './agent-movement-service';
export * from './interaction-propagation-service';
export * from './learning-service';
export * from './canvasl-parser';

import {
  initializeAgentMovementService,
  agentMovementService,
  getAgentMovementService
} from './agent-movement-service';

import {
  initializeInteractionPropagationService,
  interactionPropagationService,
  getInteractionPropagationService
} from './interaction-propagation-service';

import {
  initializeLearningService,
  learningService,
  getLearningService
} from './learning-service';

import {
  canvaslParser
} from './canvasl-parser';

import {
  CanvasLWorldScript,
  Agent,
  CollaborativeWorldConfig,
  CollaborativeWorldState
} from './types';

export interface CollaborativeWorldService {
  initialize(script: CanvasLWorldScript): Promise<void>;
  getState(): CollaborativeWorldState;
  createInteraction(
    type: 'touch' | 'communicate' | 'collaborate' | 'learn',
    source: string,
    target?: string,
    data?: Record<string, any>
  ): Promise<void>;
  destroy(): void;
}

class CollaborativeWorldServiceImpl implements CollaborativeWorldService {
  private script: CanvasLWorldScript | null = null;
  private state: CollaborativeWorldState | null = null;

  async initialize(script: CanvasLWorldScript): Promise<void> {
    this.script = script;

    // Initialize services
    initializeAgentMovementService(script.config, script.agents);
    initializeInteractionPropagationService(script.config, script.agents);
    initializeLearningService(script.config);

    // Initialize state
    this.state = {
      agents: new Map(script.agents.map(agent => [agent.id, agent])),
      interactions: [],
      knowledgeGraph: [],
      metrics: {
        totalInteractions: 0,
        totalLearningEvents: 0,
        averageLearningWeight: 0,
        knowledgeGraphSize: 0,
        activeAgents: script.agents.length,
        timestamp: Date.now()
      }
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  getState(): CollaborativeWorldState {
    if (!this.state) {
      throw new Error('CollaborativeWorldService not initialized');
    }
    return this.state;
  }

  async createInteraction(
    type: 'touch' | 'communicate' | 'collaborate' | 'learn',
    source: string,
    target?: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    if (!this.script || !this.state) {
      throw new Error('CollaborativeWorldService not initialized');
    }

    // Find interaction type definition
    const interactionType = this.script.interactionTypes.find(
      it => it.name.toLowerCase().includes(type)
    );

    const interaction = {
      id: `interaction-${Date.now()}-${Math.random()}`,
      type,
      source,
      target,
      timestamp: Date.now(),
      data,
      propagationLevels: interactionType?.propagationLevels || ['personal'],
      learningWeight: interactionType?.learningWeight || 0.1
    };

    // Queue interaction
    await interactionPropagationService.queueInteraction(interaction);

    // Learn from interaction if learning enabled
    const sourceAgent = this.state.agents.get(source);
    if (sourceAgent?.learningEnabled) {
      await learningService.learnFromInteraction(interaction);
    }

    // Update state
    this.state.interactions.push(interaction);
    this.state.metrics.totalInteractions++;
    this.state.metrics.timestamp = Date.now();
  }

  private setupEventListeners(): void {
    // Listen to learning events
    const learningServiceInstance = getLearningService();
    if (learningServiceInstance) {
      learningServiceInstance.on('learning:pattern-stored', (data: any) => {
        if (this.state) {
          this.state.knowledgeGraph.push(data);
          this.state.metrics.knowledgeGraphSize = this.state.knowledgeGraph.length;
        }
      });

      learningServiceInstance.on('learning:interaction', (data: any) => {
        if (this.state) {
          this.state.metrics.totalLearningEvents++;
          const totalWeight = this.state.metrics.averageLearningWeight * 
            (this.state.metrics.totalLearningEvents - 1);
          this.state.metrics.averageLearningWeight = 
            (totalWeight + data.interaction.learningWeight) / 
            this.state.metrics.totalLearningEvents;
        }
      });
    }
  }

  destroy(): void {
    // Cleanup services
    const movementService = getAgentMovementService();
    if (movementService) {
      movementService.destroy();
    }

    const propagationService = getInteractionPropagationService();
    if (propagationService) {
      propagationService.destroy();
    }

    this.state = null;
    this.script = null;
  }
}

// Singleton instance
let instance: CollaborativeWorldServiceImpl | null = null;

export const collaborativeWorldService: CollaborativeWorldService = {
  async initialize(script: CanvasLWorldScript) {
    if (!instance) {
      instance = new CollaborativeWorldServiceImpl();
    }
    return instance.initialize(script);
  },
  getState() {
    if (!instance) {
      throw new Error('CollaborativeWorldService not initialized');
    }
    return instance.getState();
  },
  async createInteraction(type, source, target, data) {
    if (!instance) {
      throw new Error('CollaborativeWorldService not initialized');
    }
    return instance.createInteraction(type, source, target, data);
  },
  destroy() {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  }
};

// Convenience function to load from CanvasL file
export async function loadCollaborativeWorldFromCanvasL(
  filePath: string
): Promise<void> {
  const script = await canvaslParser.loadFromFile(filePath);
  await collaborativeWorldService.initialize(script);
}
