import { useState, useEffect, useCallback } from 'react';
import { DashboardState } from '@/types';
import { wsService } from '@/services/websocket';
import { apiService } from '@/services/api';

export const useAutomatonState = () => {
  const [state, setState] = useState<DashboardState>({
    isRunning: false,
    currentDimension: 0,
    iterationCount: 0,
    selfModificationCount: 0,
    totalObjects: 0,
    executionMode: 'builtin',
    status: 'idle',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect();

    // Register event handlers
    wsService.onUpdateHandlers({
      onStatusUpdate: (newState) => {
        setState(newState);
        setError(null);
      },
      onDimensionChange: (dimension) => {
        setState(prev => ({ ...prev, currentDimension: dimension }));
      },
      onActionExecuted: (action, result) => {
        setState(prev => ({ 
          ...prev, 
          lastAction: action,
          iterationCount: prev.iterationCount + 1 
        }));
      },
      onSelfModification: (modification) => {
        setState(prev => ({ 
          ...prev, 
          selfModificationCount: prev.selfModificationCount + 1 
        }));
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setState(prev => ({ ...prev, status: 'error' }));
      },
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  // Load initial state
  const loadInitialState = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getStatus();
      
      if (response.success && response.data) {
        setState(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // Control functions
  const startAutomaton = useCallback(async (params?: { intervalMs?: number; maxIterations?: number }) => {
    try {
      const response = await apiService.startAutomaton(params);
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start automaton');
    }
  }, []);

  const stopAutomaton = useCallback(async () => {
    try {
      const response = await apiService.stopAutomaton();
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop automaton');
    }
  }, []);

  const resetAutomaton = useCallback(async () => {
    try {
      const response = await apiService.resetAutomaton();
      if (response.error) {
        setError(response.error);
      } else {
        await loadInitialState(); // Reload state after reset
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset automaton');
    }
  }, [loadInitialState]);

  const executeAction = useCallback(async (action: string, params?: any) => {
    try {
      const response = await apiService.executeAction(action, params);
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    }
  }, []);

  const setDimension = useCallback(async (dimension: number) => {
    try {
      const response = await apiService.setDimension(dimension);
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set dimension');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    loading,
    error,
    wsConnected: wsService.isConnected(),
    actions: {
      startAutomaton,
      stopAutomaton,
      resetAutomaton,
      executeAction,
      setDimension,
      clearError,
      loadInitialState,
    },
  };
};