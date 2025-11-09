/**
 * useAgentAPI Hook
 * 
 * React hook for interacting with the Agent API.
 */

import { useState, useEffect, useCallback } from 'react';
import { createAgentAPIClient, Agent, AgentRequest, AgentResponse, AgentAPIConfig } from '../services/agent-api';

export interface UseAgentAPIReturn {
  // State
  agents: Agent[];
  loading: boolean;
  error: Error | null;
  healthStatus: boolean | null;

  // Actions
  loadAgents: () => Promise<void>;
  getAgent: (agentId: string) => Promise<Agent>;
  executeOperation: (request: AgentRequest) => Promise<AgentResponse>;
  checkHealth: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for Agent API interactions
 */
export const useAgentAPI = (config?: Partial<AgentAPIConfig>): UseAgentAPIReturn => {
  const [client] = useState(() => {
    const defaultConfig: AgentAPIConfig = {
      baseURL: import.meta.env.VITE_AGENT_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      apiKey: import.meta.env.VITE_AGENT_API_KEY || import.meta.env.VITE_API_KEY,
      useMock: import.meta.env.VITE_USE_MOCK_AGENT_API === 'true' || true, // Default to mock
      timeout: 30000,
      ...config
    };
    return createAgentAPIClient(defaultConfig);
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);

  /**
   * Load all agents
   */
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const agentList = await client.listAgents();
      setAgents(agentList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load agents');
      setError(error);
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  /**
   * Get specific agent
   */
  const getAgent = useCallback(async (agentId: string): Promise<Agent> => {
    setLoading(true);
    setError(null);
    try {
      const agent = await client.getAgent(agentId);
      // Update agent in list if found
      setAgents(prev => {
        const index = prev.findIndex(a => a.id === agentId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = agent;
          return updated;
        }
        return [...prev, agent];
      });
      return agent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to get agent: ${agentId}`);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);

  /**
   * Execute operation on agent
   */
  const executeOperation = useCallback(async (request: AgentRequest): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.execute(request);
      if (!response.success && response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Execution failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);

  /**
   * Check API health
   */
  const checkHealth = useCallback(async () => {
    try {
      const healthy = await client.healthCheck();
      setHealthStatus(healthy);
    } catch (err) {
      setHealthStatus(false);
      console.error('Health check failed:', err);
    }
  }, [client]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadAgents(),
      checkHealth()
    ]);
  }, [loadAgents, checkHealth]);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
    checkHealth();
  }, [loadAgents, checkHealth]);

  return {
    agents,
    loading,
    error,
    healthStatus,
    loadAgents,
    getAgent,
    executeOperation,
    checkHealth,
    refresh
  };
};
