import { DashboardState, ApiResponse } from '@/types';

const API_BASE_URL = 'http://localhost:5555/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Dashboard endpoints
  async getStatus(): Promise<ApiResponse<DashboardState>> {
    return this.request<DashboardState>('/status');
  }

  async startAutomaton(params?: { intervalMs?: number; maxIterations?: number }): Promise<ApiResponse> {
    return this.request('/automaton/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async stopAutomaton(): Promise<ApiResponse> {
    return this.request('/automaton/stop', {
      method: 'POST',
    });
  }

  async resetAutomaton(): Promise<ApiResponse> {
    return this.request('/automaton/reset', {
      method: 'POST',
    });
  }

  // Action endpoints
  async executeAction(action: string, params?: any): Promise<ApiResponse> {
    return this.request('/automaton/action', {
      method: 'POST',
      body: JSON.stringify({ action, params }),
    });
  }

  async setDimension(dimension: number): Promise<ApiResponse> {
    return this.request('/automaton/dimension', {
      method: 'POST',
      body: JSON.stringify({ dimension }),
    });
  }

  // Configuration endpoints
  async getConfig(): Promise<ApiResponse> {
    return this.request('/config');
  }

  async updateConfig(config: any): Promise<ApiResponse> {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Analysis endpoints
  async getExecutionHistory(): Promise<ApiResponse> {
    return this.request('/analysis/history');
  }

  async getSelfReferenceAnalysis(): Promise<ApiResponse> {
    return this.request('/analysis/self-reference');
  }

  async getPatternAnalysis(): Promise<ApiResponse> {
    return this.request('/analysis/patterns');
  }

  // File operations
  async loadAutomatonFile(filePath: string): Promise<ApiResponse> {
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
  async getOllamaModels(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/ollama/models');
  }

  async setOllamaModel(model: string): Promise<ApiResponse> {
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

  async getAvailableAgents(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/agent/list');
  }
}

export const apiService = new ApiService();