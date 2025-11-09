import { useAutomatonStore } from '@/store/automatonStore';

/**
 * Hook to access unified automaton state
 */
export const useUnifiedState = () => {
  return useAutomatonStore();
};

/**
 * Hook to access WebSocket connection state
 */
export const useWsConnected = () => {
  return useAutomatonStore((state) => state.wsConnected);
};

/**
 * Hook to access status only (optimized selector)
 */
export const useStatus = () => {
  return useAutomatonStore((state) => state.status);
};

/**
 * Hook to access current dimension only
 */
export const useDimension = () => {
  return useAutomatonStore((state) => state.currentDimension);
};

/**
 * Hook to access execution history
 */
export const useExecutionHistory = () => {
  return useAutomatonStore((state) => state.executionHistory);
};

/**
 * Hook to access self-reference data
 */
export const useSelfReference = () => {
  return useAutomatonStore((state) => state.selfReference);
};
