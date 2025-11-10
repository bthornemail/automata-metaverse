import { DashboardState, ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // JSONL endpoints
  async getJsonlFile(file: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/jsonl/${file}`);
  }

  async appendToJsonlFile(file: string, data: any): Promise<ApiResponse> {
    return this.request(`/jsonl/${file}/append`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async getOpenCodeSuggestions(): Promise<ApiResponse> {
    return this.request('/opencode/suggest', {
      method: 'POST',
    });
  }

  async searchWithOpenCode(pattern: string): Promise<ApiResponse> {
    return this.request('/opencode/search', {
      method: 'POST',
      body: JSON.stringify({ pattern }),
    });
  }

  async getOpenCodeStatus(): Promise<ApiResponse> {
    return this.request('/opencode/status');
  }
}

export const apiService = new ApiService();

// OpenCode specific API wrapper
export const opencodeApi = {
  getStatus: () => apiService.getOpenCodeStatus(),
  analyzeCode: (code: string) => apiService['request']('/opencode/analyze', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
  connect: () => apiService.connectOpenCode(),
  createSession: (title?: string) => apiService.createOpenCodeSession(title),
  getSuggestions: () => apiService.getOpenCodeSuggestions(),
  search: (pattern: string) => apiService.searchWithOpenCode(pattern),
  
  // Agentic features
  getAgents: () => apiService['request']('/opencode/agent/list'),
  executeAgent: (agent: string, task: string) => apiService['request']('/opencode/agent/execute', {
    method: 'POST',
    body: JSON.stringify({ agent, task }),
  }),
  getModels: () => apiService['request']('/opencode/models'),
  setModel: (model: string) => apiService['request']('/opencode/model/set', {
    method: 'POST',
    body: JSON.stringify({ model }),
  }),
  
  // Command execution
  executeCommand: (tool: string, args: any[] = []) => apiService['request']('/opencode/execute', {
    method: 'POST',
    body: JSON.stringify({ tool, args }),
  }),
  
  // Metaverse generation
  generateMetaverse: (outputPath?: string) => apiService['request']('/opencode/execute', {
    method: 'POST',
    body: JSON.stringify({ tool: 'generate-metaverse', args: outputPath ? [outputPath] : [] }),
  }),
  
  // AI code generation
  generateCode: (params: { prompt: string; context?: string; model?: string; temperature?: number; maxTokens?: number }) => 
    apiService['request']('/opencode/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  completeCode: (params: { code: string; language?: string; model?: string; temperature?: number; maxTokens?: number }) => 
    apiService['request']('/opencode/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};