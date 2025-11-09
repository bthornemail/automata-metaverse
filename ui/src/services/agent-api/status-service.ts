/**
 * Agent Status Service
 * 
 * Real-time agent status monitoring
 */

import { Agent, AgentStatus } from './types';
import { AgentAPI } from './types';

export interface StatusUpdate {
  agentId: string;
  status: AgentStatus;
  timestamp: Date;
  message?: string;
}

export interface StatusHistory {
  agentId: string;
  updates: StatusUpdate[];
}

export class StatusService {
  private client: AgentAPI;
  private statusHistory: Map<string, StatusUpdate[]> = new Map();
  private updateInterval: number = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(update: StatusUpdate) => void>> = new Map();

  constructor(client: AgentAPI, updateInterval: number = 5000) {
    this.client = client;
    this.updateInterval = updateInterval;
  }

  /**
   * Start monitoring agent status
   */
  startMonitoring(agentIds: string[]): void {
    if (this.intervalId) {
      this.stopMonitoring();
    }

    this.intervalId = setInterval(async () => {
      await this.updateStatuses(agentIds);
    }, this.updateInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Update statuses for multiple agents
   */
  private async updateStatuses(agentIds: string[]): Promise<void> {
    const promises = agentIds.map(agentId => this.updateStatus(agentId));
    await Promise.all(promises);
  }

  /**
   * Update status for a single agent
   */
  private async updateStatus(agentId: string): Promise<void> {
    try {
      const status = await this.client.getAgentStatus(agentId);
      const update: StatusUpdate = {
        agentId,
        status,
        timestamp: new Date()
      };

      // Store in history
      if (!this.statusHistory.has(agentId)) {
        this.statusHistory.set(agentId, []);
      }
      const history = this.statusHistory.get(agentId)!;
      history.push(update);
      
      // Keep only last 100 updates
      if (history.length > 100) {
        history.shift();
      }

      // Notify listeners
      this.notifyListeners(agentId, update);
    } catch (error) {
      const update: StatusUpdate = {
        agentId,
        status: 'error',
        timestamp: new Date(),
        message: error instanceof Error ? error.message : 'Status check failed'
      };

      if (!this.statusHistory.has(agentId)) {
        this.statusHistory.set(agentId, []);
      }
      this.statusHistory.get(agentId)!.push(update);

      this.notifyListeners(agentId, update);
    }
  }

  /**
   * Subscribe to status updates for an agent
   */
  subscribe(agentId: string, callback: (update: StatusUpdate) => void): () => void {
    if (!this.listeners.has(agentId)) {
      this.listeners.set(agentId, new Set());
    }
    this.listeners.get(agentId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(agentId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(agentId);
        }
      }
    };
  }

  /**
   * Notify listeners of status update
   */
  private notifyListeners(agentId: string, update: StatusUpdate): void {
    const callbacks = this.listeners.get(agentId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in status update listener:', error);
        }
      });
    }
  }

  /**
   * Get status history for an agent
   */
  getHistory(agentId: string): StatusUpdate[] {
    return this.statusHistory.get(agentId) || [];
  }

  /**
   * Get current status for an agent
   */
  async getCurrentStatus(agentId: string): Promise<StatusUpdate | null> {
    const history = this.statusHistory.get(agentId);
    if (history && history.length > 0) {
      return history[history.length - 1];
    }

    // Fetch current status if no history
    try {
      const status = await this.client.getAgentStatus(agentId);
      return {
        agentId,
        status,
        timestamp: new Date()
      };
    } catch {
      return null;
    }
  }
}
