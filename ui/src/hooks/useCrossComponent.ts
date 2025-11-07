import { useEffect, useCallback } from 'react';
import { componentBus } from '@/services/unifiedWebSocket';

/**
 * Hook for cross-component communication
 */
export const useCrossComponent = () => {
  /**
   * Subscribe to an event
   */
  const subscribe = useCallback(<T = any>(
    event: string,
    callback: (data: T) => void
  ) => {
    const unsubscribe = componentBus.on(event, callback);
    return unsubscribe;
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback((event: string, ...args: any[]) => {
    componentBus.emit(event, ...args);
  }, []);

  /**
   * Subscribe to an event once
   */
  const subscribeOnce = useCallback(<T = any>(
    event: string,
    callback: (data: T) => void
  ) => {
    componentBus.once(event, callback);
  }, []);

  return {
    subscribe,
    emit,
    subscribeOnce,
  };
};

/**
 * Hook to subscribe to dimension changes
 */
export const useDimensionChange = (callback: (dimension: number) => void) => {
  useEffect(() => {
    const unsubscribe = componentBus.on('dimension:changed', callback);
    return unsubscribe;
  }, [callback]);
};

/**
 * Hook to subscribe to action executions
 */
export const useActionExecution = (callback: (data: {
  action: string;
  result: string;
  timestamp: number;
  from?: string;
  to?: string;
  iteration?: number;
}) => void) => {
  useEffect(() => {
    const unsubscribe = componentBus.on('action:executed', callback);
    return unsubscribe;
  }, [callback]);
};
