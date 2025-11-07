import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAutomatonStore } from '@/store/automatonStore';
import { unifiedWebSocket, componentBus } from '@/services/unifiedWebSocket';
import { unifiedApi } from '@/services/unifiedApi';
import type { DashboardState } from '@/types';

interface AutomatonContextValue {
  // Store access is through hooks, but we can provide some utilities here
}

const AutomatonContext = createContext<AutomatonContextValue | null>(null);

interface AutomatonProviderProps {
  children: ReactNode;
}

export const AutomatonProvider: React.FC<AutomatonProviderProps> = ({ children }) => {
  const setStatus = useAutomatonStore((state) => state.setStatus);
  const setDimension = useAutomatonStore((state) => state.setDimension);
  const setWsConnected = useAutomatonStore((state) => state.setWsConnected);
  const addNotification = useAutomatonStore((state) => state.addNotification);
  const addExecutionEntry = useAutomatonStore((state) => state.addExecutionEntry);
  const setError = useAutomatonStore((state) => state.setError);

  // Initialize WebSocket connection
  useEffect(() => {
    unifiedWebSocket.connect();

    // Listen to connection changes
    const unsubscribeConnection = unifiedWebSocket.onConnectionChange((connected) => {
      setWsConnected(connected);
      if (connected) {
        addNotification({
          type: 'success',
          message: 'Connected to automaton server',
          duration: 3000,
        });
      } else {
        addNotification({
          type: 'warning',
          message: 'Disconnected from automaton server',
          duration: 5000,
        });
      }
    });

    // Listen to status updates - use a stable handler
    const handleStatusUpdate = (data: DashboardState) => {
      // Only update if data actually changed to prevent loops
      setStatus(data);
    };
    const unsubscribeStatus = componentBus.on('status:update', handleStatusUpdate);

    // Listen to dimension changes - use a stable handler
    const handleDimensionChange = (dimension: number) => {
      setDimension(dimension);
    };
    const unsubscribeDimension = componentBus.on('dimension:changed', handleDimensionChange);

    // Listen to action executions - use a stable handler
    const handleActionExecuted = (data: {
      action: string;
      result: string;
      timestamp: number;
      from?: string;
      to?: string;
      iteration?: number;
    }) => {
      addExecutionEntry({
        iteration: data.iteration || 0,
        action: data.action,
        from: data.from || '',
        to: data.to || '',
        timestamp: data.timestamp,
      });
    };
    const unsubscribeAction = componentBus.on('action:executed', handleActionExecuted);

    // Listen to errors - use a stable handler
    const handleError = (error: string) => {
      setError('websocket', error);
      addNotification({
        type: 'error',
        message: error,
        duration: 5000,
      });
    };
    const unsubscribeError = componentBus.on('error', handleError);

    // Load initial state
    const loadInitialState = async () => {
      try {
        const response = await unifiedApi.getStatus(false); // Don't use cache for initial load
        if (response.success && response.data) {
          setStatus(response.data);
        }
      } catch (error) {
        console.error('Failed to load initial state:', error);
      }
    };

    loadInitialState();

    // Cleanup
    return () => {
      unsubscribeConnection();
      unsubscribeStatus();
      unsubscribeDimension();
      unsubscribeAction();
      unsubscribeError();
      unifiedWebSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - Zustand selectors are stable

  return (
    <AutomatonContext.Provider value={{}}>
      {children}
    </AutomatonContext.Provider>
  );
};

export const useAutomatonContext = () => {
  const context = useContext(AutomatonContext);
  if (!context) {
    throw new Error('useAutomatonContext must be used within AutomatonProvider');
  }
  return context;
};
