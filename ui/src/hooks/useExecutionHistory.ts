import { useState, useEffect, useCallback } from 'react';
import { ExecutionData } from '@/types';
import { apiService } from '@/services/api';
import { wsService } from '@/services/websocket';

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

        setData(prev => ({
          ...prev,
          history,
          actionFrequency,
        }));
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

  const addToHistory = useCallback((entry: ExecutionData['history'][0]) => {
    setData(prev => {
      const newHistory = [...prev.history, entry];
      
      // Update action frequency
      const newFrequency = new Map(prev.actionFrequency);
      const currentCount = newFrequency.get(entry.action) || 0;
      newFrequency.set(entry.action, currentCount + 1);

      return {
        ...prev,
        history: newHistory,
        actionFrequency: newFrequency,
      };
    });
  }, []);

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
      addToHistory({
        action,
        timestamp: Date.now(),
        from: 'unknown', // These would be determined by the actual action
        to: 'unknown',
        iteration: data.history.length
      });
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