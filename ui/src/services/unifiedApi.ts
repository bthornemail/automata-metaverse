import type { ApiResponse } from '@/types';

const API_BASE_URL = 'http://localhost:5555/api';

// Request cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class UnifiedApiService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultCacheTTL = 5000; // 5 seconds default cache

  // Request deduplication and caching
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const key = cacheKey || `${options.method || 'GET'}:${endpoint}`;

    // Check cache for GET requests
    if ((!options.method || options.method === 'GET') && cacheKey) {
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        return {
          success: true,
          data: cached.data,
          timestamp: Date.now(),
        };
      }
    }

    // Check for pending request (deduplication)
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // Cache successful GET responses
        if ((!options.method || options.method === 'GET') && cacheKey && data.success && data.data) {
          this.cache.set(key, {
            data: data.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (cacheTTL || this.defaultCacheTTL),
          });
        }

        return data;
      } catch (error) {
        console.error('API request failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(key);
      }
    })();

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  // Cache management
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  invalidateCache(endpoint: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint)) {
        this.cache.delete(key);
      }
    }
  }

  // Dashboard endpoints
  async getStatus(useCache = true): Promise<ApiResponse<any>> {
    return this.request('/status', {}, useCache ? 'status' : undefined, 2000);
  }

  async startAutomaton(params?: { intervalMs?: number; maxIterations?: number }): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/automaton/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async stopAutomaton(): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/automaton/stop', {
      method: 'POST',
    });
  }

  async resetAutomaton(): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/automaton/reset', {
      method: 'POST',
    });
  }

  // Action endpoints
  async executeAction(action: string, params?: any): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/automaton/action', {
      method: 'POST',
      body: JSON.stringify({ action, params }),
    });
  }

  async setDimension(dimension: number): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/automaton/dimension', {
      method: 'POST',
      body: JSON.stringify({ dimension }),
    });
  }

  // Configuration endpoints
  async getConfig(useCache = true): Promise<ApiResponse> {
    return this.request('/config', {}, useCache ? 'config' : undefined, 10000);
  }

  async updateConfig(config: any): Promise<ApiResponse> {
    this.invalidateCache('config');
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Analysis endpoints
  async getExecutionHistory(useCache = true): Promise<ApiResponse> {
    return this.request('/analysis/history', {}, useCache ? 'execution-history' : undefined, 5000);
  }

  async getSelfReferenceAnalysis(useCache = true): Promise<ApiResponse> {
    return this.request('/analysis/self-reference', {}, useCache ? 'self-reference' : undefined, 10000);
  }

  async getPatternAnalysis(useCache = true): Promise<ApiResponse> {
    return this.request('/analysis/patterns', {}, useCache ? 'pattern-analysis' : undefined, 10000);
  }

  // File operations
  async loadAutomatonFile(filePath: string): Promise<ApiResponse> {
    this.clearCache();
    return this.request('/file/load', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
  }

  async saveAutomatonFile(): Promise<ApiResponse> {
    return this.request('/file/save', {
      method: 'POST',
    });
  }

  // Ollama endpoints
  async getOllamaModels(useCache = true): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/ollama/models', {}, useCache ? 'ollama-models' : undefined, 30000);
  }

  async setOllamaModel(model: string): Promise<ApiResponse> {
    this.invalidateCache('status');
    return this.request('/ollama/model', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
  }

  // Agent endpoints
  async sendAgentMessage(agent: string, message: string): Promise<ApiResponse<string>> {
    return this.request<string>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ agent, message }),
    });
  }

  async getAvailableAgents(useCache = true): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/agent/list', {}, useCache ? 'available-agents' : undefined, 30000);
  }

  // OpenCode endpoints
  async connectOpenCode(): Promise<ApiResponse> {
    return this.request('/opencode/connect', {
      method: 'POST',
    });
  }

  async createOpenCodeSession(title?: string): Promise<ApiResponse> {
    return this.request('/opencode/session/create', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async analyzeWithOpenCode(): Promise<ApiResponse> {
    return this.request('/opencode/analyze', {
      method: 'POST',
    });
  }

  async getOpenCodeSuggestions(useCache = true): Promise<ApiResponse> {
    return this.request('/opencode/suggest', {
      method: 'POST',
    }, useCache ? 'opencode-suggestions' : undefined, 5000);
  }

  async searchWithOpenCode(pattern: string): Promise<ApiResponse> {
    return this.request('/opencode/search', {
      method: 'POST',
      body: JSON.stringify({ pattern }),
    });
  }

  async getOpenCodeStatus(useCache = true): Promise<ApiResponse> {
    return this.request('/opencode/status', {}, useCache ? 'opencode-status' : undefined, 2000);
  }
}

export const unifiedApi = new UnifiedApiService();
