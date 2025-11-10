/**
 * Agent Communication Service
 * Bridges Agent API operations with CollaborativeWorld interactions
 */

import { AgentRequest, AgentResponse } from './agent-api/types';
import { collaborativeWorldService } from './collaborative-world';
import type { InteractionType } from './collaborative-world/types';

export interface AgentCommunicationMessage {
  from: string;
  to: string;
  type: 'message' | 'operation' | 'query';
  content: any;
  timestamp: number;
}

class AgentCommunicationService {
  private listeners: Map<string, (message: AgentCommunicationMessage) => void> = new Map();

  /**
   * Send a message between agents
   */
  async sendMessage(from: string, to: string, content: any): Promise<void> {
    // Create interaction in CollaborativeWorld
    try {
      await collaborativeWorldService.createInteraction('communicate', from, to, {
        message: content
      });
    } catch (error) {
      console.warn('[AgentCommunication] Failed to create interaction:', error);
    }

    // Emit event
    this.emitMessage({
      from,
      to,
      type: 'message',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Execute an Agent API operation and map it to CollaborativeWorld interaction
   */
  async executeOperation(request: AgentRequest): Promise<AgentResponse> {
    // Map Agent API operation to CollaborativeWorld interaction
    const interactionType = this.mapOperationToInteraction(request.operation);
    
    try {
      await collaborativeWorldService.createInteraction(
        interactionType,
        request.agentId,
        request.parameters?.targetAgentId,
        request.parameters
      );
    } catch (error) {
      console.warn('[AgentCommunication] Failed to create interaction:', error);
    }

    return {
      success: true,
      agentId: request.agentId,
      operation: request.operation,
      result: { interaction: 'created' }
    };
  }

  /**
   * Map Agent API operation names to CollaborativeWorld interaction types
   */
  private mapOperationToInteraction(operation: string): InteractionType {
    const opLower = operation.toLowerCase();
    
    // Map Agent API operations to interaction types
    if (opLower.includes('communicate') || opLower.includes('message') || opLower.includes('chat')) {
      return 'communicate';
    }
    if (opLower.includes('collaborate') || opLower.includes('work') || opLower.includes('cooperate')) {
      return 'collaborate';
    }
    if (opLower.includes('learn') || opLower.includes('train') || opLower.includes('teach')) {
      return 'learn';
    }
    // Default to touch for other operations
    return 'touch';
  }

  /**
   * Subscribe to messages for a specific agent
   */
  onMessage(agentId: string, callback: (message: AgentCommunicationMessage) => void): () => void {
    this.listeners.set(agentId, callback);
    return () => this.listeners.delete(agentId);
  }

  /**
   * Emit a message to listeners
   */
  private emitMessage(message: AgentCommunicationMessage): void {
    // Notify listeners
    this.listeners.forEach((callback, agentId) => {
      if (message.to === agentId || message.to === 'broadcast' || message.to === '*') {
        callback(message);
      }
    });
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(from: string, content: any): Promise<void> {
    await this.sendMessage(from, 'broadcast', content);
  }
}

export const agentCommunicationService = new AgentCommunicationService();
