import { useState, useEffect, useCallback } from 'react';
import { ExecutionData } from '@/types';
import { apiService } from '@/services/api';
import { wsService } from '@/services/websocket';
import { useAutomatonStore } from '@/store/automatonStore';

export const useExecutionHistory = () => {
  const [data, setData] = useState<ExecutionData>({
    history: [],
    actionFrequency: new Map(),
    dimensionalProgression: [],
    performanceMetrics: { avgExecutionTime: 0, successRate: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyResponse, patternResponse] = await Promise.all([
        apiService.getExecutionHistory(),
        apiService.getPatternAnalysis(),
      ]);

      if (historyResponse.success && historyResponse.data) {
        const history = historyResponse.data.history || [];
        const actionFrequency = new Map(
          Object.entries(historyResponse.data.actionFrequency || {})
            .map(([k, v]) => [k, Number(v)])
        );

        const newData = {
          history,
          actionFrequency,
          dimensionalProgression: historyResponse.data.dimensionalProgression || [],
          performanceMetrics: historyResponse.data.performanceMetrics || { avgExecutionTime: 0, successRate: 0 },
        };

        setData(prev => ({
          ...prev,
          ...newData,
        }));
        
        // Sync with Zustand store
        useAutomatonStore.getState().setExecutionHistory(newData);
      }

      if (patternResponse.success && patternResponse.data) {
        setData(prev => ({
          ...prev,
          dimensionalProgression: patternResponse.data.dimensionalProgression || [],
          performanceMetrics: patternResponse.data.performanceMetrics || prev.performanceMetrics,
        }));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution history');
    } finally {
      setLoading(false);
    }
  }, []);

  const addExecutionEntry = useAutomatonStore((state) => state.addExecutionEntry);

  const addToHistory = useCallback((entry: ExecutionData['history'][0]) => {
    // Validate entry is a proper object before processing
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      console.warn('addToHistory: Invalid entry, skipping:', entry);
      return;
    }
    
    // Ensure entry has required fields with proper types
    const validatedEntry = {
      action: typeof entry.action === 'string' ? entry.action : 'unknown',
      timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
      from: typeof entry.from === 'string' ? entry.from : 'unknown',
      to: typeof entry.to === 'string' ? entry.to : 'unknown',
      iteration: typeof entry.iteration === 'number' ? entry.iteration : data.history.length,
    };
    
    // Update local state
    setData(prev => {
      const newHistory = [...prev.history, validatedEntry];
      
      // Update action frequency
      const newFrequency = new Map(prev.actionFrequency);
      const currentCount = newFrequency.get(validatedEntry.action) || 0;
      newFrequency.set(validatedEntry.action, currentCount + 1);

      return {
        ...prev,
        history: newHistory,
        actionFrequency: newFrequency,
      };
    });
    
    // Also sync with Zustand store for unified state
    addExecutionEntry(validatedEntry);
  }, [addExecutionEntry, data.history.length]);

  const clearHistory = useCallback(() => {
    setData({
      history: [],
      actionFrequency: new Map(),
      dimensionalProgression: [],
      performanceMetrics: { avgExecutionTime: 0, successRate: 0 },
    });
  }, []);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    wsService.connect();

    const handleActionExecuted = (action: string, result: any) => {
      // Validate result before creating entry
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const validatedEntry = {
          action: typeof action === 'string' ? action : 'unknown',
          timestamp: typeof result.timestamp === 'number' ? result.timestamp : Date.now(),
          from: typeof result.from === 'string' ? result.from : 'unknown',
          to: typeof result.to === 'string' ? result.to : 'unknown',
          iteration: typeof result.iteration === 'number' ? result.iteration : data.history.length
        };
        
        addToHistory(validatedEntry);
      } else {
        // Fallback: create minimal valid entry
        const fallbackEntry = {
          action: typeof action === 'string' ? action : 'unknown',
          timestamp: Date.now(),
          from: 'unknown',
          to: 'unknown',
          iteration: data.history.length
        };
        addToHistory(fallbackEntry);
      }
    };

    wsService.onUpdateHandlers({
      onActionExecuted: handleActionExecuted
    });

    return () => {
      wsService.disconnect();
    };
  }, [data.history.length, addToHistory]);

  // Auto-load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    data,
    loading,
    error,
    actions: {
      loadHistory,
      addToHistory,
      clearHistory,
    },
  };
};