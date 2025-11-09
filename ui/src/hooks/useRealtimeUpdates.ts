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
      // Validate data before creating entry
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const validatedEntry = {
          iteration: typeof data.iteration === 'number' ? data.iteration : 0,
          action: typeof data.action === 'string' ? data.action : 'unknown',
          from: typeof data.from === 'string' ? data.from : '',
          to: typeof data.to === 'string' ? data.to : '',
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
        };
        
        // Ensure all fields are valid before adding
        if (validatedEntry.action && validatedEntry.timestamp) {
          addExecutionEntry(validatedEntry);
        }
      }
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
    const unsubscribeError = componentBus.on('error', (error: string | Error | any) => {
      // Safely convert error to string
      let errorMessage: string;
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || String(error);
      } else {
        try {
          errorMessage = String(error);
        } catch (e) {
          errorMessage = 'An error occurred';
        }
      }
      
      addNotification({
        type: 'error',
        message: errorMessage,
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
