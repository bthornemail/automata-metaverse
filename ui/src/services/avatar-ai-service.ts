/**
 * Avatar AI Service
 * Provides autonomous AI behavior for avatars using:
 * - TinyML for pattern recognition and decision making
 * - CanvasL for identity and behavior scripts
 * - GPU.js (optional) for parallel computation
 * - Learning from environment and interactions
 * - Conversation capabilities
 */

import { tinyMLService, PatternPrediction } from './tinyml-service';
import { canvaslParser } from './collaborative-world/canvasl-parser';
import { Agent } from './collaborative-world/types';

export interface AvatarIdentity {
  id: string;
  name: string;
  dimension: string;
  personality: {
    curiosity: number; // 0-1
    sociability: number; // 0-1
    exploration: number; // 0-1
    learningRate: number; // 0-1
  };
  memory: {
    interactions: Array<{
      agentId: string;
      type: string;
      timestamp: number;
      outcome: string;
    }>;
    locations: Array<{
      position: [number, number, number];
      timestamp: number;
      interest: number; // 0-1
    }>;
    conversations: Array<{
      agentId: string;
      message: string;
      timestamp: number;
    }>;
  };
  canvaslScript?: string; // CanvasL behavior script
}

export interface AvatarDecision {
  action: 'move' | 'explore' | 'interact' | 'learn' | 'converse' | 'idle';
  target?: {
    position?: [number, number, number];
    agentId?: string;
    direction?: 'forward' | 'backward' | 'left' | 'right';
  };
  confidence: number;
  reasoning: string;
}

export interface ConversationMessage {
  from: string;
  to: string;
  message: string;
  timestamp: number;
  type: 'greeting' | 'question' | 'statement' | 'response';
}

class AvatarAIService {
  private identities: Map<string, AvatarIdentity> = new Map();
  private conversations: Map<string, ConversationMessage[]> = new Map();
  private decisionHistory: Map<string, Array<{ decision: AvatarDecision; timestamp: number }>> = new Map();
  private gpuAvailable: boolean = false;

  /**
   * Initialize AI service
   */
  async initialize(): Promise<void> {
    // Initialize TinyML
    await tinyMLService.initialize();

    // Check for GPU.js availability
    try {
      // Dynamic import to avoid errors if GPU.js not installed
      const GPU = await import('gpu.js').catch(() => null);
      if (GPU && GPU.default) {
        this.gpuAvailable = true;
        console.log('[AvatarAI] GPU.js available for parallel computation');
      }
    } catch (error) {
      console.log('[AvatarAI] GPU.js not available, using CPU computation');
    }
  }

  /**
   * Register avatar identity
   */
  async registerAvatar(agent: Agent, canvaslScript?: string): Promise<void> {
    const identity: AvatarIdentity = {
      id: agent.id,
      name: agent.name,
      dimension: agent.dimension,
      personality: {
        curiosity: 0.5 + Math.random() * 0.3,
        sociability: 0.4 + Math.random() * 0.4,
        exploration: 0.5 + Math.random() * 0.3,
        learningRate: 0.3 + Math.random() * 0.4
      },
      memory: {
        interactions: [],
        locations: [],
        conversations: []
      },
      canvaslScript
    };

    // Parse CanvasL script if provided
    if (canvaslScript) {
      try {
        const script = await canvaslParser.parseScript(canvaslScript);
        // Extract personality traits from CanvasL script
        if (script.agents) {
          const agentDef = script.agents.find(a => a.id === agent.id);
          if (agentDef) {
            // Update identity based on CanvasL definition
            identity.personality.exploration = agentDef.learningEnabled ? 0.7 : 0.4;
          }
        }
      } catch (error) {
        console.warn(`[AvatarAI] Failed to parse CanvasL script for ${agent.id}:`, error);
      }
    }

    this.identities.set(agent.id, identity);
    this.conversations.set(agent.id, []);
    this.decisionHistory.set(agent.id, []);
  }

  /**
   * Make autonomous decision for avatar
   */
  async makeDecision(
    avatarId: string,
    context: {
      position: [number, number, number];
      nearbyAgents: Array<{ id: string; position: [number, number, number]; distance: number }>;
      nearbyObjects: Array<{ id: string; position: [number, number, number]; type: string }>;
      timeSinceLastAction: number;
    }
  ): Promise<AvatarDecision> {
    const identity = this.identities.get(avatarId);
    if (!identity) {
      return {
        action: 'idle',
        confidence: 0.5,
        reasoning: 'Identity not found'
      };
    }

    // Use TinyML to predict next action based on history
    const history = this.decisionHistory.get(avatarId) || [];
    const dimensionalHistory = history.map(h => ({
      dimension: parseInt(identity.dimension.replace('D', '')) || 0,
      timestamp: h.timestamp
    }));

    // Pattern recognition for decision making
    const patterns = tinyMLService.recognizePattern(dimensionalHistory);
    const prediction = tinyMLService.predictNextDimension(
      parseInt(identity.dimension.replace('D', '')) || 0,
      dimensionalHistory
    );

    // Decision logic based on personality and context
    const decisions: AvatarDecision[] = [];

    // 1. Explore new locations (based on exploration trait)
    if (identity.personality.exploration > 0.6 && context.timeSinceLastAction > 5000) {
      const unexploredArea = this.findUnexploredArea(identity, context.position);
      if (unexploredArea) {
        decisions.push({
          action: 'explore',
          target: { position: unexploredArea },
          confidence: identity.personality.exploration,
          reasoning: `Exploring new area based on exploration trait (${identity.personality.exploration.toFixed(2)})`
        });
      }
    }

    // 2. Interact with nearby agents (based on sociability)
    if (identity.personality.sociability > 0.5 && context.nearbyAgents.length > 0) {
      const nearestAgent = context.nearbyAgents[0];
      if (nearestAgent.distance < 5) {
        decisions.push({
          action: 'interact',
          target: { agentId: nearestAgent.id },
          confidence: identity.personality.sociability,
          reasoning: `Interacting with nearby agent ${nearestAgent.id} (distance: ${nearestAgent.distance.toFixed(1)})`
        });
      }
    }

    // 3. Converse with nearby agents
    if (identity.personality.sociability > 0.6 && context.nearbyAgents.length > 0) {
      const nearestAgent = context.nearbyAgents[0];
      if (nearestAgent.distance < 3 && this.shouldConverse(identity, nearestAgent.id)) {
        decisions.push({
          action: 'converse',
          target: { agentId: nearestAgent.id },
          confidence: identity.personality.sociability * 0.8,
          reasoning: `Initiating conversation with ${nearestAgent.id}`
        });
      }
    }

    // 4. Learn from environment (based on curiosity)
    if (identity.personality.curiosity > 0.7 && context.nearbyObjects.length > 0) {
      const interestingObject = context.nearbyObjects.find(obj => 
        !identity.memory.locations.some(loc => 
          Math.abs(loc.position[0] - obj.position[0]) < 1 &&
          Math.abs(loc.position[2] - obj.position[2]) < 1
        )
      );
      if (interestingObject) {
        decisions.push({
          action: 'learn',
          target: { position: interestingObject.position },
          confidence: identity.personality.curiosity,
          reasoning: `Learning about new object ${interestingObject.id}`
        });
      }
    }

    // 5. Move randomly (fallback)
    if (decisions.length === 0 || Math.random() < 0.3) {
      const directions: Array<'forward' | 'backward' | 'left' | 'right'> = ['forward', 'backward', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      decisions.push({
        action: 'move',
        target: { direction },
        confidence: 0.4,
        reasoning: 'Random movement'
      });
    }

    // Select best decision based on confidence and personality
    const bestDecision = decisions.reduce((best, current) => {
      const currentScore = current.confidence * (1 + Math.random() * 0.2);
      const bestScore = best.confidence * (1 + Math.random() * 0.2);
      return currentScore > bestScore ? current : best;
    }, decisions[0]);

    // Record decision
    this.decisionHistory.get(avatarId)?.push({
      decision: bestDecision,
      timestamp: Date.now()
    });

    return bestDecision;
  }

  /**
   * Generate conversation message
   */
  async generateConversation(
    fromId: string,
    toId: string,
    context?: string
  ): Promise<ConversationMessage> {
    const fromIdentity = this.identities.get(fromId);
    const toIdentity = this.identities.get(toId);

    if (!fromIdentity || !toIdentity) {
      return {
        from: fromId,
        to: toId,
        message: 'Hello!',
        timestamp: Date.now(),
        type: 'greeting'
      };
    }

    // Check conversation history
    const conversationHistory = this.conversations.get(fromId) || [];
    const recentMessages = conversationHistory
      .filter(m => m.to === toId || m.from === toId)
      .slice(-3);

    // Generate message based on personality and context
    let message: string;
    let type: ConversationMessage['type'] = 'statement';

    if (recentMessages.length === 0) {
      // First interaction
      const greetings = [
        `Hello ${toIdentity.name}!`,
        `Greetings from ${fromIdentity.dimension}!`,
        `Hi there, ${toIdentity.name}!`,
        `Exploring ${fromIdentity.dimension} dimensions?`
      ];
      message = greetings[Math.floor(Math.random() * greetings.length)];
      type = 'greeting';
    } else if (fromIdentity.personality.curiosity > 0.7) {
      // Curious avatar asks questions
      const questions = [
        `What have you learned about ${toIdentity.dimension}?`,
        `Have you explored this area before?`,
        `What patterns have you noticed?`
      ];
      message = questions[Math.floor(Math.random() * questions.length)];
      type = 'question';
    } else if (fromIdentity.personality.sociability > 0.7) {
      // Sociable avatar makes statements
      const statements = [
        `I've been exploring ${fromIdentity.dimension} dimensions.`,
        `The patterns here are fascinating!`,
        `I'm learning so much about this space.`
      ];
      message = statements[Math.floor(Math.random() * statements.length)];
      type = 'statement';
    } else {
      // Default response
      message = `Interesting, ${toIdentity.name}.`;
      type = 'response';
    }

    const conversationMessage: ConversationMessage = {
      from: fromId,
      to: toId,
      message,
      timestamp: Date.now(),
      type
    };

    // Store conversation
    this.conversations.get(fromId)?.push(conversationMessage);

    return conversationMessage;
  }

  /**
   * Learn from interaction
   */
  async learnFromInteraction(
    avatarId: string,
    interaction: {
      type: string;
      targetId?: string;
      position: [number, number, number];
      outcome: 'success' | 'failure' | 'neutral';
    }
  ): Promise<void> {
    const identity = this.identities.get(avatarId);
    if (!identity) return;

    // Record interaction in memory
    identity.memory.interactions.push({
      agentId: interaction.targetId || 'unknown',
      type: interaction.type,
      timestamp: Date.now(),
      outcome: interaction.outcome
    });

    // Record location if interesting
    if (interaction.outcome === 'success') {
      identity.memory.locations.push({
        position: interaction.position,
        timestamp: Date.now(),
        interest: identity.personality.curiosity
      });
    }

    // Update personality based on learning
    if (interaction.outcome === 'success') {
      identity.personality.learningRate = Math.min(1.0, identity.personality.learningRate + 0.01);
    }
  }

  /**
   * Get avatar identity
   */
  getIdentity(avatarId: string): AvatarIdentity | undefined {
    return this.identities.get(avatarId);
  }

  /**
   * Get conversation history
   */
  getConversations(avatarId: string): ConversationMessage[] {
    return this.conversations.get(avatarId) || [];
  }

  /**
   * Get recent conversations between two avatars
   */
  getConversationBetween(avatarId1: string, avatarId2: string): ConversationMessage[] {
    const allConversations = [
      ...(this.conversations.get(avatarId1) || []),
      ...(this.conversations.get(avatarId2) || [])
    ];
    return allConversations
      .filter(m => (m.from === avatarId1 && m.to === avatarId2) || (m.from === avatarId2 && m.to === avatarId1))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Helper methods
  private findUnexploredArea(
    identity: AvatarIdentity,
    currentPosition: [number, number, number]
  ): [number, number, number] | null {
    // Find area not in memory
    const exploredPositions = identity.memory.locations.map(loc => loc.position);
    
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const distance = 5 + Math.random() * 10;
      const candidate: [number, number, number] = [
        currentPosition[0] + Math.cos(angle) * distance,
        currentPosition[1],
        currentPosition[2] + Math.sin(angle) * distance
      ];

      const isExplored = exploredPositions.some(explored => {
        const dist = Math.sqrt(
          Math.pow(explored[0] - candidate[0], 2) +
          Math.pow(explored[2] - candidate[2], 2)
        );
        return dist < 3;
      });

      if (!isExplored) {
        return candidate;
      }
    }

    return null;
  }

  private shouldConverse(identity: AvatarIdentity, otherAgentId: string): boolean {
    const recentConversations = identity.memory.conversations.filter(
      c => c.agentId === otherAgentId && Date.now() - c.timestamp < 30000
    );
    return recentConversations.length < 2; // Max 2 conversations per 30 seconds
  }
}

export const avatarAIService = new AvatarAIService();
