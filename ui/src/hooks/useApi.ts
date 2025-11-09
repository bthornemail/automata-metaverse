import { useCallback } from 'react';
import { useAutomatonStore } from '@/store/automatonStore';
import { unifiedApi } from '@/services/unifiedApi';
import type { ApiResponse } from '@/types';

/**
 * Hook for making API calls with loading and error states
 */
export const useApi = <T = any>(endpoint: string) => {
  const setLoading = useAutomatonStore((state) => state.setLoading);
  const setError = useAutomatonStore((state) => state.setError);
  const addNotification = useAutomatonStore((state) => state.addNotification);

  const call = useCallback(async (
    options?: RequestInit,
    showNotification = false
  ): Promise<ApiResponse<T>> => {
    setLoading(endpoint, true);
    setError(endpoint, null);

    try {
      // This is a simplified version - in practice, you'd map endpoints to methods
      // For now, we'll use a generic approach
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (showNotification && data.success) {
        addNotification({
          type: 'success',
          message: 'Operation completed successfully',
          duration: 3000,
        });
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(endpoint, message);
      
      if (showNotification) {
        addNotification({
          type: 'error',
          message,
          duration: 5000,
        });
      }

      return {
        success: false,
        error: message,
        timestamp: Date.now(),
      };
    } finally {
      setLoading(endpoint, false);
    }
  }, [endpoint, setLoading, setError, addNotification]);

  const loading = useAutomatonStore((state) => state.loading[endpoint] || false);
  const error = useAutomatonStore((state) => state.errors[endpoint] || null);

  return {
    call,
    loading,
    error,
  };
};

/**
 * Hook for accessing unified API service directly
 */
export const useUnifiedApi = () => {
  return unifiedApi;
};
