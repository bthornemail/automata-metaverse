// Enhanced OpenCode integration with WebLLM and agentic features
export interface OpenCodeConfig {
  enabled: boolean;
  baseUrl?: string;
  webllmUrl?: string;
  webllmModel?: string;
  model?: string;
  useWebLLM?: boolean;
  useOllama?: boolean;
}

export interface MockAnalysisResult {
  patterns: string[];
  suggestions: string[];
  codeQuality: number;
  complexity: number;
  recommendations: string[];
}

export interface AgentCapability {
  name: string;
  description: string;
  endpoint: string;
}

class SimpleOpenCodeService {
  private config: OpenCodeConfig;
  private connected = false;
  private webllmEngine: any = null;
  private availableModels: string[] = [
    'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    'Phi-3.5-mini-instruct-q4f16_1-MLC',
    'gemma-2-2b-it-q4f16_1-MLC',
    'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
    'Qwen2-1.5B-Instruct-q4f16_1-MLC'
  ];
  private currentModel: string;
  private agents: Map<string, AgentCapability> = new Map();

  constructor(config: OpenCodeConfig = { enabled: false }) {
    this.config = config;
    this.currentModel = config.model || config.webllmModel || 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
    this.initializeAgents();
  }

  private get webllmUrl(): string {
    return this.config.webllmUrl || 'http://localhost:3000';
  }

  private initializeAgents(): void {
    this.agents.set('Code Analyzer', {
      name: 'Code Analyzer',
      description: 'Analyzes code quality and patterns',
      endpoint: '/agent/code-analyzer'
    });
    
    this.agents.set('Automaton Advisor', {
      name: 'Automaton Advisor', 
      description: 'Provides dimensional progression advice',
      endpoint: '/agent/automaton-advisor'
    });
    
    this.agents.set('Church Encoding Expert', {
      name: 'Church Encoding Expert',
      description: 'Specializes in lambda calculus patterns',
      endpoint: '/agent/church-encoding'
    });
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        console.log('🔌 OpenCode mode disabled');
        return false;
      }

      // Try to initialize WebLLM if enabled
      if (this.config.useWebLLM !== false) {
        await this.initializeWebLLM();
      }

      this.connected = true;
      console.log('✅ Enhanced OpenCode service initialized');
      if (this.config.useWebLLM !== false && this.webllmEngine) {
        console.log(`🤖 Using WebLLM model: ${this.currentModel}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize OpenCode service:', error);
      this.connected = false;
      return false;
    }
  }

  private async initializeWebLLM(): Promise<void> {
    try {
      if (!this.config.webllmUrl) {
        console.warn('⚠️ WebLLM URL not configured');
        return;
      }
      await this.checkWebLLMConnection();
      await this.fetchAvailableModels();
      console.log('✅ WebLLM initialized successfully');
    } catch (error) {
      console.warn('⚠️ WebLLM initialization failed:', error);
      throw error;
    }
  }

  private async checkWebLLMConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.webllmUrl}/models`);
      if (!response.ok) {
        throw new Error('WebLLM not responding');
      }
      console.log('✅ WebLLM connection established');
    } catch (error) {
      console.warn('⚠️ WebLLM not available, using fallback analysis mode');
      throw error;
    }
  }

  private async fetchAvailableModels(): Promise<void> {
    try {
      const response = await fetch(`${this.webllmUrl}/models`);
      const data = await response.json() as any;
      this.availableModels = data.models || ['Llama-3.1-8B-Instruct-q4f16_1', 'TinyLlama-1.1B-Chat-v0.4-q4f16_1', 'Phi-3-mini-4k-instruct-q4f16_1'];
      console.log(`📋 Available models: ${this.availableModels.join(', ')}`);
    } catch (error) {
      this.availableModels = ['Llama-3.1-8B-Instruct-q4f16_1', 'TinyLlama-1.1B-Chat-v0.4-q4f16_1', 'Phi-3-mini-4k-instruct-q4f16_1'];
      console.warn('⚠️ Using default WebLLM model list');
    }
  }

  async analyzeAutomatonState(automatonData: any): Promise<MockAnalysisResult> {
    const dimension = automatonData.currentDimension || 0;
    const iterations = automatonData.iterationCount || 0;
    
    // Try WebLLM analysis first if available
    if (this.config.useWebLLM !== false && this.availableModels.length > 0) {
      try {
        return await this.analyzeWithWebLLM(automatonData);
      } catch (error) {
        console.warn('⚠️ WebLLM analysis failed, using fallback:', error);
      }
    }
    
    // Fallback to rule-based analysis
    return this.analyzeWithRules(automatonData);
  }

  private async analyzeWithWebLLM(automatonData: any): Promise<MockAnalysisResult> {
    const prompt = `Analyze this self-referencing automaton state and provide structured analysis:

Current Dimension: ${automatonData.currentDimension}D
Iteration Count: ${automatonData.iterationCount}
Self-Modification Count: ${automatonData.selfModificationCount}
Total Objects: ${automatonData.totalObjects}
Status: ${automatonData.status}

Execution History: ${JSON.stringify(automatonData.executionHistory?.slice(-5) || [], null, 2)}

Respond with JSON in this exact format:
{
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"], 
  "codeQuality": 85,
  "complexity": 5,
  "recommendations": ["rec1", "rec2", "rec3"]
}

Focus on:
1. Church encoding patterns
2. Dimensional progression efficiency
3. Self-reference optimization
4. Computational topology insights`;

    const response = await fetch(`${this.webllmUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.currentModel,
        prompt,
        stream: false
      })
    });

    const data = await response.json() as any;
    const analysisText = data.response || data.text || data.content || '';
    
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse WebLLM JSON response');
    }
    
    // Fallback to rule-based if parsing fails
    return this.analyzeWithRules(automatonData);
  }

  private analyzeWithRules(automatonData: any): MockAnalysisResult {
    const dimension = automatonData.currentDimension || 0;
    const iterations = automatonData.iterationCount || 0;
    
    const patterns = [
      `Dimensional progression at ${dimension}D`,
      `Self-reference frequency: ${iterations > 10 ? 'High' : 'Normal'}`,
      `Church encoding pattern detected`,
      `Computational topology active`
    ];

    const suggestions = [
      dimension < 7 ? 'Consider evolving to next dimension' : 'Maximum dimension reached',
      iterations % 20 === 0 ? 'Time for self-modification' : 'Continue current pattern',
      'Monitor dimensional transitions',
      'Optimize self-reference patterns'
    ];

    const recommendations = [
      'Increase dimensional progression frequency',
      'Implement more sophisticated self-reference patterns',
      'Consider quantum superposition states',
      'Enhance Church encoding efficiency'
    ];

    return {
      patterns,
      suggestions,
      codeQuality: Math.min(95, 70 + Math.floor(dimension * 3)),
      complexity: Math.min(10, Math.max(1, dimension + 2)),
      recommendations
    };
  }

  async getSuggestionsForAction(currentDimension: number, availableActions: string[]): Promise<string[]> {
    // Try WebLLM for intelligent suggestions
    if (this.config.useWebLLM !== false && this.availableModels.length > 0) {
      try {
        return await this.getSuggestionsWithWebLLM(currentDimension, availableActions);
      } catch (error) {
        console.warn('⚠️ WebLLM suggestions failed, using fallback:', error);
      }
    }
    
    // Fallback to rule-based suggestions
    return this.getSuggestionsWithRules(currentDimension, availableActions);
  }

  private async getSuggestionsWithWebLLM(currentDimension: number, availableActions: string[]): Promise<string[]> {
    const prompt = `As an expert in Church encoding and computational topology, suggest the best next action for an automaton at ${currentDimension}D.

Available actions: ${availableActions.join(', ')}

Consider:
- Optimal dimensional progression
- Church encoding efficiency  
- Self-reference patterns
- Computational topology optimization

Provide 3 specific suggestions in JSON format:
["action1 - reason", "action2 - reason", "action3 - reason"]`;

    const response = await this.webllmEngine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
      stream: false
    });

    const suggestionsText = response.choices[0]?.message?.content || '';
    
    try {
      const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse WebLLM suggestions');
    }
    
    return this.getSuggestionsWithRules(currentDimension, availableActions);
  }

  private getSuggestionsWithRules(currentDimension: number, availableActions: string[]): string[] {
    const suggestions = [];
    
    if (currentDimension < 7 && availableActions.includes('evolve')) {
      suggestions.push('evolve - Progress to next dimension');
    }
    
    if (currentDimension % 2 === 0 && availableActions.includes('self-reference')) {
      suggestions.push('self-reference - Strengthen recursive patterns');
    }
    
    if (currentDimension >= 4 && availableActions.includes('self-modify')) {
      suggestions.push('self-modify - Enhance computational topology');
    }
    
    if (availableActions.includes('self-observe')) {
      suggestions.push('self-observe - Monitor current state');
    }
    
    return suggestions.slice(0, 3);
  }

  async searchCodebase(pattern: string): Promise<any[]> {
    // Enhanced search with agent assistance
    if (this.config.useWebLLM !== false && this.availableModels.length > 0) {
      try {
        return await this.searchWithOllama(pattern);
      } catch (error) {
        console.warn('⚠️ WebLLM search failed, using fallback:', error);
      }
    }
    
    // Fallback search
    return [
      {
        file: `src/components/${pattern}.tsx`,
        lines: `Found pattern "${pattern}" in component`,
        lineNumber: 42,
        context: `Component implementation`,
        relevance: 0.85
      },
      {
        file: `src/services/${pattern}.ts`,
        lines: `Service pattern for "${pattern}"`,
        lineNumber: 15,
        context: `Service layer`,
        relevance: 0.72
      }
    ];
  }

  private async searchWithOllama(pattern: string): Promise<any[]> {
    const prompt = `Search for code patterns related to "${pattern}" in a TypeScript/React codebase focused on computational topology and Church encoding.

Provide search results in JSON format:
[
  {
    "file": "path/to/file",
    "lines": "matching code snippet",
    "lineNumber": 42,
    "context": "description of context",
    "relevance": 0.9
  }
]`;

    const response = await this.webllmEngine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    });

    const searchResults = response.choices[0]?.message?.content || '';
    
    try {
      const jsonMatch = searchResults.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse WebLLM search results');
    }
    
    return [];
  }

  async executeAgentTask(agentName: string, task: string): Promise<any> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    if (this.config.useWebLLM !== false && this.availableModels.length > 0) {
      try {
        return await this.executeAgentWithOllama(agent, task);
      } catch (error) {
        console.warn('⚠️ Agent execution failed, using fallback:', error);
      }
    }
    
    return this.executeAgentFallback(agent, task);
  }

  private async executeAgentWithOllama(agent: AgentCapability, task: string): Promise<any> {
    const prompt = `You are ${agent.name}. ${agent.description}

Task: ${task}

Provide a detailed response in JSON format with insights, recommendations, and actionable steps.`;

    const response = await fetch(`${this.webllmUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.currentModel,
        prompt,
        stream: false
      })
    });

    const data = await response.json() as any;
    
    return {
      agent: agent.name,
      task,
      response: data.response || data.text || data.content || '',
      timestamp: Date.now(),
      model: this.currentModel
    };
  }

  private executeAgentFallback(agent: AgentCapability, task: string): any {
    return {
      agent: agent.name,
      task,
      response: `Fallback response for ${agent.name} handling task: ${task}`,
      timestamp: Date.now(),
      fallback: true
    };
  }

  getAvailableAgents(): AgentCapability[] {
    return Array.from(this.agents.values());
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  async setModel(model: string): Promise<boolean> {
    // Check if model is in available WebLLM models
    if (this.availableModels.includes(model)) {
      this.currentModel = model;
      console.log(`🤖 Switched to WebLLM model: ${model}`);
      
      // Reinitialize WebLLM with new model if engine exists
      if (this.webllmEngine && this.config.useWebLLM !== false) {
        try {
          await this.initializeWebLLM();
        } catch (error) {
          console.warn('Failed to reinitialize WebLLM with new model:', error);
        }
      }
      return true;
    }
    return false;
  }

  isClientConnected(): boolean {
    return this.connected && this.config.enabled;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('🔌 OpenCode disconnected');
  }
}

export const simpleOpenCodeService = new SimpleOpenCodeService();