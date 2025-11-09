/**
 * Chat Service - Pub/Sub and Direct Messaging
 * 
 * Provides broadcast (pub/sub) and direct messaging capabilities
 * for P2P, agents, and humans in the multiverse
 */

import { unifiedWebSocket } from './unifiedWebSocket';

export interface ChatMessage {
  id: string;
  type: 'broadcast' | 'direct' | 'agent';
  from: string;
  to?: string; // For direct messages
  content: string;
  timestamp: number;
  metadata?: {
    agentId?: string;
    userId?: string;
    citations?: any[];
    confidence?: number;
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  type: 'human' | 'agent';
  online: boolean;
  avatar?: string;
  dimension?: string;
}

class ChatService {
  private broadcastMessages: ChatMessage[] = [];
  private directMessages: Map<string, ChatMessage[]> = new Map(); // conversationId -> messages
  private participants: Map<string, ChatParticipant> = new Map();
  private currentUserId: string;
  private listeners: Map<string, Set<(message: ChatMessage) => void>> = new Map();
  private participantListeners: Set<(participants: ChatParticipant[]) => void> = new Set();

  constructor() {
    // Generate unique user ID
    this.currentUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize WebSocket listeners
    this.initializeWebSocket();
    
    // Initialize default agents
    this.initializeAgents();
  }

  private initializeWebSocket() {
    const eventBus = unifiedWebSocket.getEventBus();
    
    // Listen for chat messages
    eventBus.on('chat:broadcast', (message: ChatMessage) => {
      this.handleBroadcastMessage(message);
    });
    
    eventBus.on('chat:direct', (message: ChatMessage) => {
      this.handleDirectMessage(message);
    });
    
    eventBus.on('chat:participant-joined', (participant: ChatParticipant) => {
      this.addParticipant(participant);
    });
    
    eventBus.on('chat:participant-left', (participantId: string) => {
      this.removeParticipant(participantId);
    });
    
    // Emit join event when connected
    unifiedWebSocket.onConnectionChange((connected) => {
      if (connected) {
        this.joinChat();
      }
    });
  }

  private initializeAgents() {
    const agents: ChatParticipant[] = [
      { id: 'agent-0d-topology', name: '0D-Topology-Agent', type: 'agent', online: true, dimension: '0D' },
      { id: 'agent-1d-temporal', name: '1D-Temporal-Agent', type: 'agent', online: true, dimension: '1D' },
      { id: 'agent-2d-structural', name: '2D-Structural-Agent', type: 'agent', online: true, dimension: '2D' },
      { id: 'agent-3d-algebraic', name: '3D-Algebraic-Agent', type: 'agent', online: true, dimension: '3D' },
      { id: 'agent-4d-network', name: '4D-Network-Agent', type: 'agent', online: true, dimension: '4D' },
      { id: 'agent-5d-consensus', name: '5D-Consensus-Agent', type: 'agent', online: true, dimension: '5D' },
      { id: 'agent-6d-intelligence', name: '6D-Intelligence-Agent', type: 'agent', online: true, dimension: '6D' },
      { id: 'agent-7d-quantum', name: '7D-Quantum-Agent', type: 'agent', online: true, dimension: '7D' },
      { id: 'agent-query-interface', name: 'Query-Interface-Agent', type: 'agent', online: true },
      { id: 'agent-visualization', name: 'Visualization-Agent', type: 'agent', online: true },
      { id: 'agent-ai-assist', name: 'AI-Assist-Agent', type: 'agent', online: true },
    ];
    
    agents.forEach(agent => {
      this.participants.set(agent.id, agent);
    });
  }

  private joinChat() {
    if (unifiedWebSocket.isConnected()) {
      unifiedWebSocket.sendCommand('chat:join', {
        userId: this.currentUserId,
        userName: 'User',
        type: 'human'
      });
      
      // Also listen for participant events
      const eventBus = unifiedWebSocket.getEventBus();
      eventBus.on('chat:participant-joined', (participant: ChatParticipant) => {
        this.addParticipant(participant);
      });
      
      eventBus.on('chat:participant-left', (participantId: string) => {
        this.removeParticipant(participantId);
      });
    }
  }

  // Broadcast (Pub/Sub)
  sendBroadcast(content: string, metadata?: any): void {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'broadcast',
      from: this.currentUserId,
      content,
      timestamp: Date.now(),
      metadata
    };
    
    // Add immediately (optimistic update)
    this.broadcastMessages.push(message);
    
    // Notify listeners immediately
    this.notifyListeners('broadcast', message);
    
    // Emit via WebSocket
    if (unifiedWebSocket.isConnected()) {
      unifiedWebSocket.sendCommand('chat:broadcast', message);
    }
  }

  // Direct Message
  sendDirectMessage(to: string, content: string, metadata?: any): void {
    const conversationId = this.getConversationId(this.currentUserId, to);
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'direct',
      from: this.currentUserId,
      to,
      content,
      timestamp: Date.now(),
      metadata
    };
    
    // Store in conversation (add user's own message immediately)
    if (!this.directMessages.has(conversationId)) {
      this.directMessages.set(conversationId, []);
    }
    this.directMessages.get(conversationId)!.push(message);
    
    // Notify listeners immediately (optimistic update)
    this.notifyListeners(`direct:${conversationId}`, message);
    
    // Emit via WebSocket
    if (unifiedWebSocket.isConnected()) {
      unifiedWebSocket.sendCommand('chat:direct', message);
    }
  }

  // Agent Message
  sendAgentMessage(agentId: string, content: string, metadata?: any): void {
    const conversationId = this.getConversationId(this.currentUserId, agentId);
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'agent',
      from: agentId,
      to: this.currentUserId,
      content,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        agentId
      }
    };
    
    // Store in conversation
    if (!this.directMessages.has(conversationId)) {
      this.directMessages.set(conversationId, []);
    }
    this.directMessages.get(conversationId)!.push(message);
    
    // Emit via WebSocket (for other users to see agent responses)
    if (unifiedWebSocket.isConnected()) {
      unifiedWebSocket.sendCommand('chat:agent', message);
    }
    
    // Notify listeners
    this.notifyListeners(`agent:${conversationId}`, message);
  }

  // Get messages
  getBroadcastMessages(): ChatMessage[] {
    return [...this.broadcastMessages];
  }

  getDirectMessages(participantId: string): ChatMessage[] {
    const conversationId = this.getConversationId(this.currentUserId, participantId);
    return [...(this.directMessages.get(conversationId) || [])];
  }

  // Get participants
  getParticipants(): ChatParticipant[] {
    return Array.from(this.participants.values());
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // Listeners
  onMessage(type: 'broadcast' | 'direct' | 'agent', conversationId: string | null, callback: (message: ChatMessage) => void): () => void {
    const key = conversationId ? `${type}:${conversationId}` : type;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  onParticipantsChange(callback: (participants: ChatParticipant[]) => void): () => void {
    this.participantListeners.add(callback);
    return () => {
      this.participantListeners.delete(callback);
    };
  }

  // Private helpers
  private handleBroadcastMessage(message: ChatMessage) {
    this.broadcastMessages.push(message);
    this.notifyListeners('broadcast', message);
  }

  private handleDirectMessage(message: ChatMessage) {
    const conversationId = message.to === this.currentUserId 
      ? this.getConversationId(message.from, this.currentUserId)
      : this.getConversationId(this.currentUserId, message.to!);
    
    if (!this.directMessages.has(conversationId)) {
      this.directMessages.set(conversationId, []);
    }
    this.directMessages.get(conversationId)!.push(message);
    
    this.notifyListeners(`direct:${conversationId}`, message);
  }

  private addParticipant(participant: ChatParticipant) {
    this.participants.set(participant.id, participant);
    this.notifyParticipantListeners();
  }

  private removeParticipant(participantId: string) {
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.online = false;
      this.participants.set(participantId, participant);
      this.notifyParticipantListeners();
    }
  }

  private notifyListeners(key: string, message: ChatMessage) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in chat message listener:', error);
        }
      });
    }
  }

  private notifyParticipantListeners() {
    const participants = this.getParticipants();
    this.participantListeners.forEach(callback => {
      try {
        callback(participants);
      } catch (error) {
        console.error('Error in participant listener:', error);
      }
    });
  }

  private getConversationId(user1: string, user2: string): string {
    return [user1, user2].sort().join('-');
  }
}

export const chatService = new ChatService();
