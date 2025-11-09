/**
 * Agent API HTTP Client
 * 
 * Implements the AgentAPI interface using HTTP requests.
 */

import { Agent, AgentRequest, AgentResponse, AgentAPI, AgentStatus, AgentAPIConfig } from './types';

export class AgentAPIClient implements AgentAPI {
  private baseURL: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: AgentAPIConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Make HTTP request to API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<Agent[]> {
    const response = await this.request<{ success: boolean; data: Agent[] }>('/agents');
    return response.data || [];
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string): Promise<Agent> {
    const response = await this.request<{ success: boolean; data: Agent }>(`/agents/${encodeURIComponent(agentId)}`);
    return response.data;
  }

  /**
   * Execute an operation on an agent
   */
  async execute(request: AgentRequest): Promise<AgentResponse> {
    const response = await this.request<AgentResponse>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const response = await this.request<{ success: boolean; data: { status: AgentStatus } }>(`/agents/${encodeURIComponent(agentId)}/status`);
    return response.data.status;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>('/health');
      return response.status === 'ok' || response.status === 'healthy';
    } catch {
      return false;
    }
  }
}
