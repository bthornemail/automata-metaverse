import { useCallback } from 'react';
import { useAutomatonStore } from '@/store/automatonStore';
import { unifiedApi } from '@/services/unifiedApi';
import { unifiedWebSocket } from '@/services/unifiedWebSocket';
import { useAutomatonStore as useStore } from '@/store/automatonStore';

/**
 * Hook to access automaton actions
 */
export const useAutomatonActions = () => {
  const setStatus = useStore((state) => state.setStatus);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);
  const addNotification = useStore((state) => state.addNotification);

  const startAutomaton = useCallback(async (params?: { intervalMs?: number; maxIterations?: number }) => {
    setLoading('start', true);
    setError('start', null);
    
    try {
      const response = await unifiedApi.startAutomaton(params);
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Automaton started',
          duration: 3000,
        });
      } else {
        setError('start', response.error || 'Failed to start automaton');
        addNotification({
          type: 'error',
          message: response.error || 'Failed to start automaton',
          duration: 5000,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start automaton';
      setError('start', message);
      addNotification({
        type: 'error',
        message,
        duration: 5000,
      });
    } finally {
      setLoading('start', false);
    }
  }, [setLoading, setError, addNotification]);

  const stopAutomaton = useCallback(async () => {
    setLoading('stop', true);
    setError('stop', null);
    
    try {
      const response = await unifiedApi.stopAutomaton();
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Automaton stopped',
          duration: 3000,
        });
      } else {
        setError('stop', response.error || 'Failed to stop automaton');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop automaton';
      setError('stop', message);
    } finally {
      setLoading('stop', false);
    }
  }, [setLoading, setError, addNotification]);

  const resetAutomaton = useCallback(async () => {
    setLoading('reset', true);
    setError('reset', null);
    
    try {
      const response = await unifiedApi.resetAutomaton();
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Automaton reset',
          duration: 3000,
        });
        // Reload status
        const statusResponse = await unifiedApi.getStatus(false);
        if (statusResponse.success && statusResponse.data) {
          setStatus(statusResponse.data);
        }
      } else {
        setError('reset', response.error || 'Failed to reset automaton');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset automaton';
      setError('reset', message);
    } finally {
      setLoading('reset', false);
    }
  }, [setLoading, setError, addNotification, setStatus]);

  const executeAction = useCallback(async (action: string, params?: any) => {
    setLoading(`action-${action}`, true);
    setError(`action-${action}`, null);
    
    try {
      const response = await unifiedApi.executeAction(action, params);
      if (response.success) {
        addNotification({
          type: 'success',
          message: `Action "${action}" executed`,
          duration: 3000,
        });
      } else {
        setError(`action-${action}`, response.error || `Failed to execute action: ${action}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to execute action: ${action}`;
      setError(`action-${action}`, message);
    } finally {
      setLoading(`action-${action}`, false);
    }
  }, [setLoading, setError, addNotification]);

  const setDimension = useCallback(async (dimension: number) => {
    setLoading('dimension', true);
    setError('dimension', null);
    
    try {
      const response = await unifiedApi.setDimension(dimension);
      if (response.success) {
        addNotification({
          type: 'success',
          message: `Dimension set to ${dimension}D`,
          duration: 3000,
        });
      } else {
        setError('dimension', response.error || 'Failed to set dimension');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set dimension';
      setError('dimension', message);
    } finally {
      setLoading('dimension', false);
    }
  }, [setLoading, setError, addNotification]);

  return {
    startAutomaton,
    stopAutomaton,
    resetAutomaton,
    executeAction,
    setDimension,
  };
};
