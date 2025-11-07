import { useEffect } from 'react';
import { componentBus } from '@/services/unifiedWebSocket';
import { useAutomatonStore } from '@/store/automatonStore';

/**
 * Hook to subscribe to real-time updates via WebSocket
 */
export const useRealtimeUpdates = () => {
  const setStatus = useAutomatonStore((state) => state.setStatus);
  const setDimension = useAutomatonStore((state) => state.setDimension);
  const addExecutionEntry = useAutomatonStore((state) => state.addExecutionEntry);
  const addNotification = useAutomatonStore((state) => state.addNotification);

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribeStatus = componentBus.on('status:update', (data: any) => {
      setStatus(data);
    });

    // Subscribe to dimension changes
    const unsubscribeDimension = componentBus.on('dimension:changed', (dimension: number) => {
      setDimension(dimension);
    });

    // Subscribe to action executions
    const unsubscribeAction = componentBus.on('action:executed', (data: {
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
    });

    // Subscribe to self-modifications
    const unsubscribeModification = componentBus.on('self-modification', (data: any) => {
      addNotification({
        type: 'info',
        message: 'Self-modification detected',
        duration: 5000,
      });
    });

    // Subscribe to errors
    const unsubscribeError = componentBus.on('error', (error: string) => {
      addNotification({
        type: 'error',
        message: error,
        duration: 5000,
      });
    });

    // Cleanup
    return () => {
      unsubscribeStatus();
      unsubscribeDimension();
      unsubscribeAction();
      unsubscribeModification();
      unsubscribeError();
    };
  }, [setStatus, setDimension, addExecutionEntry, addNotification]);
};

/**
 * Hook to subscribe to specific events
 */
export const useEvent = <T = any>(eventName: string, callback: (data: T) => void) => {
  useEffect(() => {
    const unsubscribe = componentBus.on(eventName, callback);
    return unsubscribe;
  }, [eventName, callback]);
};
