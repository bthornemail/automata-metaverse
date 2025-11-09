#!/usr/bin/env tsx
/**
 * Conversation Context Manager
 * 
 * Tracks conversation state, maintains context across turns,
 * resolves entity references, and manages conversation history
 */

import { QueryIntent } from './nl-query-engine';

export interface Entity {
  id: string;
  type: 'agent' | 'function' | 'rule' | 'fact' | 'document' | 'concept';
  name: string;
  value?: any;
  metadata?: Record<string, any>;
}

export interface ConversationTurn {
  turnId: string;
  timestamp: number;
  userInput: string;
  intent: QueryIntent;
  agentResponses?: AgentResponse[];
  mergedResponse?: string;
  contextUpdates?: ContextUpdate[];
  entities?: Entity[];
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  data?: any;
}

export interface ContextUpdate {
  type: 'entity' | 'intent' | 'topic' | 'agent';
  key: string;
  value: any;
  timestamp: number;
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  turns: ConversationTurn[];
  entities: Map<string, Entity>;
  currentIntent: QueryIntent | null;
  previousIntents: QueryIntent[];
  agentAssignments: Map<string, string>; // agentId -> agentName
  currentTopic?: string;
  createdAt: number;
  lastUpdated: number;
}

/**
 * Conversation Context Manager
 */
export class ConversationContextManager {
  private conversations: Map<string, ConversationContext> = new Map();
  private maxHistorySize: number = 100; // Maximum turns per conversation
  private entityExpiryTime: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Create a new conversation
   */
  createConversation(userId: string = 'default'): ConversationContext {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ConversationContext = {
      conversationId,
      userId,
      turns: [],
      entities: new Map(),
      currentIntent: null,
      previousIntents: [],
      agentAssignments: new Map(),
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    this.conversations.set(conversationId, context);
    return context;
  }

  /**
   * Get conversation context
   */
  getContext(conversationId: string): ConversationContext | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add a turn to conversation
   */
  addTurn(conversationId: string, turn: ConversationTurn): void {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add turn
    context.turns.push(turn);
    
    // Update current intent
    context.previousIntents.push(context.currentIntent!);
    context.currentIntent = turn.intent;
    
    // Update entities from turn
    if (turn.entities) {
      turn.entities.forEach(entity => {
        context.entities.set(entity.id, entity);
      });
    }

    // Update agent assignments
    if (turn.agentResponses) {
      turn.agentResponses.forEach(response => {
        context.agentAssignments.set(response.agentId, response.agentName);
      });
    }

    // Update topic if detected
    if (turn.intent.entity) {
      context.currentTopic = turn.intent.entity;
    }

    // Apply context updates
    if (turn.contextUpdates) {
      turn.contextUpdates.forEach(update => {
        this.applyContextUpdate(context, update);
      });
    }

    // Trim history if too long
    if (context.turns.length > this.maxHistorySize) {
      context.turns.shift();
    }

    // Clean expired entities
    this.cleanExpiredEntities(context);

    context.lastUpdated = Date.now();
  }

  /**
   * Update context with new information
   */
  updateContext(conversationId: string, updates: ContextUpdate | ContextUpdate[]): void {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updateList = Array.isArray(updates) ? updates : [updates];
    updateList.forEach(update => {
      this.applyContextUpdate(context, update);
    });

    context.lastUpdated = Date.now();
  }

  /**
   * Resolve entity reference (e.g., "it", "that agent", "the function")
   */
  resolveEntityReference(reference: string, context: ConversationContext): Entity | null {
    const lowerRef = reference.toLowerCase().trim();
    
    // Check recent turns for entity mentions
    const recentTurns = context.turns.slice(-5).reverse();
    
    for (const turn of recentTurns) {
      // Check entities in turn
      if (turn.entities) {
        for (const entity of turn.entities) {
          // Match by name or type
          if (lowerRef.includes(entity.name.toLowerCase()) ||
              lowerRef.includes(entity.type)) {
            return entity;
          }
        }
      }

      // Check intent entity
      if (turn.intent.entity) {
        const entityName = turn.intent.entity.toLowerCase();
        if (lowerRef.includes(entityName) || 
            lowerRef.includes('that') || 
            lowerRef.includes('it') ||
            lowerRef.includes('the')) {
          // Try to find entity in context
          for (const [id, entity] of context.entities) {
            if (entity.name.toLowerCase() === entityName) {
              return entity;
            }
          }
        }
      }
    }

    // Check current topic
    if (context.currentTopic && lowerRef.includes('topic')) {
      for (const [id, entity] of context.entities) {
        if (entity.name.toLowerCase() === context.currentTopic.toLowerCase()) {
          return entity;
        }
      }
    }

    return null;
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string, limit?: number): ConversationTurn[] {
    const context = this.conversations.get(conversationId);
    if (!context) {
      return [];
    }

    const turns = context.turns;
    return limit ? turns.slice(-limit) : turns;
  }

  /**
   * Get recent entities
   */
  getRecentEntities(conversationId: string, limit: number = 10): Entity[] {
    const context = this.conversations.get(conversationId);
    if (!context) {
      return [];
    }

    return Array.from(context.entities.values())
      .sort((a, b) => {
        // Sort by most recent mention (simplified)
        return 0;
      })
      .slice(0, limit);
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string): void {
    const context = this.conversations.get(conversationId);
    if (!context) {
      return;
    }

    context.turns = [];
    context.entities.clear();
    context.currentIntent = null;
    context.previousIntents = [];
    context.agentAssignments.clear();
    context.currentTopic = undefined;
    context.lastUpdated = Date.now();
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: string): ConversationContext[] {
    return Array.from(this.conversations.values())
      .filter(context => context.userId === userId)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  /**
   * Apply context update
   */
  private applyContextUpdate(context: ConversationContext, update: ContextUpdate): void {
    switch (update.type) {
      case 'entity':
        if (update.value) {
          const entity = update.value as Entity;
          context.entities.set(update.key, entity);
        }
        break;

      case 'intent':
        context.previousIntents.push(context.currentIntent!);
        context.currentIntent = update.value as QueryIntent;
        break;

      case 'topic':
        context.currentTopic = update.value as string;
        break;

      case 'agent':
        context.agentAssignments.set(update.key, update.value as string);
        break;
    }
  }

  /**
   * Clean expired entities
   */
  private cleanExpiredEntities(context: ConversationContext): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, entity] of context.entities) {
      const entityTimestamp = entity.metadata?.timestamp || 0;
      if (now - entityTimestamp > this.entityExpiryTime) {
        expired.push(id);
      }
    }

    expired.forEach(id => context.entities.delete(id));
  }

  /**
   * Export conversation context (for persistence)
   */
  exportContext(conversationId: string): any {
    const context = this.conversations.get(conversationId);
    if (!context) {
      return null;
    }

    return {
      conversationId: context.conversationId,
      userId: context.userId,
      turns: context.turns,
      entities: Array.from(context.entities.entries()),
      currentIntent: context.currentIntent,
      previousIntents: context.previousIntents,
      agentAssignments: Array.from(context.agentAssignments.entries()),
      currentTopic: context.currentTopic,
      createdAt: context.createdAt,
      lastUpdated: context.lastUpdated
    };
  }

  /**
   * Import conversation context (for persistence)
   */
  importContext(data: any): ConversationContext {
    const context: ConversationContext = {
      conversationId: data.conversationId,
      userId: data.userId,
      turns: data.turns || [],
      entities: new Map(data.entities || []),
      currentIntent: data.currentIntent || null,
      previousIntents: data.previousIntents || [],
      agentAssignments: new Map(data.agentAssignments || []),
      currentTopic: data.currentTopic,
      createdAt: data.createdAt || Date.now(),
      lastUpdated: data.lastUpdated || Date.now()
    };

    this.conversations.set(context.conversationId, context);
    return context;
  }
}
