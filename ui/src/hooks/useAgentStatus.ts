/**
 * useAgentStatus Hook
 * 
 * React hook for real-time agent status monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { StatusService, StatusUpdate } from '../services/agent-api/status-service';
import { useAgentAPI } from './useAgentAPI';
import { createAgentAPIClient } from '../services/agent-api';

export interface UseAgentStatusReturn {
  statuses: Map<string, StatusUpdate>;
  history: Map<string, StatusUpdate[]>;
  isMonitoring: boolean;
  startMonitoring: (agentIds: string[]) => void;
  stopMonitoring: () => void;
  subscribe: (agentId: string, callback: (update: StatusUpdate) => void) => () => void;
  getCurrentStatus: (agentId: string) => Promise<StatusUpdate | null>;
}

export const useAgentStatus = (updateInterval: number = 5000): UseAgentStatusReturn => {
  const { agents } = useAgentAPI();
  const [statusService] = useState(() => {
    const client = createAgentAPIClient({
      baseURL: import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3000/api',
      apiKey: import.meta.env.VITE_AGENT_API_KEY,
      useMock: import.meta.env.VITE_USE_MOCK_AGENT_API === 'true' || false
    });
    return new StatusService(client, updateInterval);
  });

  const [statuses, setStatuses] = useState<Map<string, StatusUpdate>>(new Map());
  const [history, setHistory] = useState<Map<string, StatusUpdate[]>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback((agentIds: string[]) => {
    statusService.startMonitoring(agentIds);
    setIsMonitoring(true);

    // Subscribe to updates for all agents
    agentIds.forEach(agentId => {
      statusService.subscribe(agentId, (update) => {
        setStatuses(prev => {
          const next = new Map(prev);
          next.set(agentId, update);
          return next;
        });

        setHistory(prev => {
          const next = new Map(prev);
          const agentHistory = statusService.getHistory(agentId);
          next.set(agentId, agentHistory);
          return next;
        });
      });
    });
  }, [statusService]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    statusService.stopMonitoring();
    setIsMonitoring(false);
  }, [statusService]);

  /**
   * Subscribe to status updates
   */
  const subscribe = useCallback((agentId: string, callback: (update: StatusUpdate) => void) => {
    return statusService.subscribe(agentId, callback);
  }, [statusService]);

  /**
   * Get current status
   */
  const getCurrentStatus = useCallback(async (agentId: string): Promise<StatusUpdate | null> => {
    return statusService.getCurrentStatus(agentId);
  }, [statusService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      statusService.stopMonitoring();
    };
  }, [statusService]);

  return {
    statuses,
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    subscribe,
    getCurrentStatus
  };
};
