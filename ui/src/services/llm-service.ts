/**
 * Unified LLM Service
 * 
 * Supports multiple LLM providers:
 * - WebLLM (browser-based)
 * - Ollama (local server)
 * - OpenAI (API)
 * - OpenCode SDK
 */

export type LLMProvider = 'webllm' | 'ollama' | 'openai' | 'opencode';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  // Provider-specific config
  ollamaUrl?: string;
  openaiApiKey?: string;
  opencodeEndpoint?: string;
}

// Export as LLMProviderConfig for use in components
export type LLMProviderConfig = LLMConfig;

export interface LLMResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMService {
  initialize(config: LLMConfig): Promise<void>;
  generateResponse(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, config: LLMConfig): Promise<LLMResponse>;
  isAvailable(): boolean;
  getProvider(): LLMProvider | null;
}

class LLMServiceImpl implements LLMService {
  private currentProvider: LLMProvider | null = null;
  private currentConfig: LLMConfig | null = null;
  private webLLMEngine: any = null;
  private isInitialized = false;

  async initialize(config: LLMConfig): Promise<void> {
    this.currentConfig = config;
    this.currentProvider = config.provider;

    if (config.provider === 'webllm') {
      await this.initializeWebLLM(config);
    } else {
      // Other providers don't need pre-initialization - they're initialized on first use
      // Mark as initialized so they can be used immediately
      this.isInitialized = true;
      console.log(`${config.provider.toUpperCase()} provider ready (no pre-initialization needed)`);
    }
  }

  private async initializeWebLLM(config: LLMConfig): Promise<void> {
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      // Try to initialize with progress tracking
      let initProgress = 0;
      const engine = await CreateMLCEngine(config.model, {
        initProgressCallback: (progress: any) => {
          initProgress = Math.round(progress.progress * 100);
          console.log(`WebLLM loading: ${initProgress}%`);
        }
      });
      
      this.webLLMEngine = engine;
      this.isInitialized = true;
      console.log('WebLLM engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      
      // Try fallback models if primary model fails
      const fallbackModels = [
        'TinyLlama-1.1B-Chat-v0.4',
        'Phi-3-mini-4k-instruct-q4f32_1-MLC',
        'Llama-2-7b-chat-hf-q4f32_1'
      ];
      
      if (fallbackModels.includes(config.model)) {
        // Already tried a fallback, throw the error
        throw error;
      }
      
      // Try first fallback model
      console.log('Trying fallback model: TinyLlama-1.1B-Chat-v0.4');
      try {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const fallbackEngine = await CreateMLCEngine('TinyLlama-1.1B-Chat-v0.4', {
          initProgressCallback: (progress: any) => {
            console.log(`WebLLM fallback loading: ${Math.round(progress.progress * 100)}%`);
          }
        });
        this.webLLMEngine = fallbackEngine;
        this.isInitialized = true;
        console.log('WebLLM fallback model initialized successfully');
        // Update config to reflect the fallback model
        if (this.currentConfig) {
          this.currentConfig.model = 'TinyLlama-1.1B-Chat-v0.4';
        }
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw new Error(`WebLLM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
      }
    }
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: LLMConfig
  ): Promise<LLMResponse> {
    switch (config.provider) {
      case 'webllm':
        return this.generateWebLLMResponse(messages, config);
      case 'ollama':
        return this.generateOllamaResponse(messages, config);
      case 'openai':
        return this.generateOpenAIResponse(messages, config);
      case 'opencode':
        return this.generateOpenCodeResponse(messages, config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  private async generateWebLLMResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: LLMConfig
  ): Promise<LLMResponse> {
    // Ensure engine is initialized
    if (!this.webLLMEngine || !this.isInitialized) {
      await this.initializeWebLLM(config);
    }

    if (!this.webLLMEngine) {
      throw new Error('WebLLM engine is not available after initialization');
    }

    try {
      const response = await this.webLLMEngine.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP || 0.9
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        throw new Error('WebLLM returned empty response');
      }

      return {
        content: content,
        model: this.currentConfig?.model || config.model
      };
    } catch (error) {
      console.error('WebLLM generation error:', error);
      // Try to reinitialize if engine seems broken
      if (error instanceof Error && (error.message.includes('not available') || error.message.includes('not initialized'))) {
        console.log('Attempting to reinitialize WebLLM...');
        this.webLLMEngine = null;
        this.isInitialized = false;
        await this.initializeWebLLM(config);
        
        // Retry once
        const retryResponse = await this.webLLMEngine.chat.completions.create({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: config.topP || 0.9
        });
        
        return {
          content: retryResponse.choices[0]?.message?.content || '',
          model: this.currentConfig?.model || config.model
        };
      }
      throw error;
    }
  }

  private async generateOllamaResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
    
    // Check if Ollama is available first
    try {
      const healthCheck = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' });
      if (!healthCheck.ok && healthCheck.status !== 404) {
        throw new Error(`Ollama server not reachable at ${ollamaUrl}. Make sure Ollama is running.`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to Ollama at ${ollamaUrl}. Is Ollama running? Start it with: ollama serve`);
      }
      throw error;
    }
    
    // Ollama supports chat API format (preferred)
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
          content: msg.content
        })),
        stream: false,
        options: {
          temperature: config.temperature,
          top_p: config.topP || 0.9,
          num_predict: config.maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      // If model not found, provide helpful error
      if (response.status === 404 || (errorData.error && errorData.error.includes('model'))) {
        throw new Error(`Ollama model "${config.model}" not found. Pull it with: ollama pull ${config.model}`);
      }
      
      // Fallback to generate API if chat API not available
      const prompt = messages
        .map(msg => {
          if (msg.role === 'system') {
            return `System: ${msg.content}`;
          } else if (msg.role === 'user') {
            return `User: ${msg.content}`;
          } else {
            return `Assistant: ${msg.content}`;
          }
        })
        .join('\n\n') + '\n\nAssistant:';

      const generateResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: config.temperature,
            top_p: config.topP || 0.9,
            num_predict: config.maxTokens
          }
        })
      });

      if (!generateResponse.ok) {
        const genErrorText = await generateResponse.text();
        throw new Error(`Ollama API error: ${generateResponse.statusText} - ${genErrorText}`);
      }

      const generateData = await generateResponse.json();
      return {
        content: generateData.response || '',
        model: config.model
      };
    }

    const data = await response.json();
    return {
      content: data.message?.content || data.response || '',
      model: data.model || config.model
    };
  }

  private async generateOpenAIResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: LLMConfig
  ): Promise<LLMResponse> {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP || 0.9
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model || config.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    };
  }

  private async generateOpenCodeResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const endpoint = config.opencodeEndpoint || 'http://localhost:3000/api/opencode';
    
    // Get the last user message
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';

    const response = await fetch(`${endpoint}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: userMessage }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenCode API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response || data.content || '',
      model: config.model
    };
  }

  isAvailable(): boolean {
    return this.isInitialized && this.currentProvider !== null;
  }

  getProvider(): LLMProvider | null {
    return this.currentProvider;
  }
}

export const llmService = new LLMServiceImpl();
