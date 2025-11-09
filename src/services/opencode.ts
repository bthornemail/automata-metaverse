// @ts-ignore
import { createOpencodeClient, type Session, type Message } from '@opencode-ai/sdk';

export interface OpenCodeConfig {
  baseUrl?: string;
  enabled: boolean;
  autoAnalyze: boolean;
  sessionTitle?: string;
}

export interface OpenCodeSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export interface AnalysisResult {
  patterns: string[];
  suggestions: string[];
  codeQuality: number;
  complexity: number;
  recommendations: string[];
}

class OpenCodeService {
  private client: any = null;
  private config: OpenCodeConfig;
  private currentSession: OpenCodeSession | null = null;
  private isConnected = false;

  constructor(config: OpenCodeConfig = { enabled: false, autoAnalyze: false }) {
    this.config = config;
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        console.log('🔌 OpenCode mode disabled');
        return false;
      }

      this.client = createOpencodeClient({
        baseUrl: this.config.baseUrl || 'http://localhost:4096'
      });

      // Test connection
      await this.client.config.get();
      this.isConnected = true;
      console.log('✅ OpenCode connected successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to OpenCode:', error);
      this.isConnected = false;
      return false;
    }
  }

  async createSession(title?: string): Promise<OpenCodeSession | null> {
    if (!this.isConnected) {
      throw new Error('OpenCode not connected');
    }

    try {
      const sessionData = await this.client.session.create({
        body: {
          title: title || this.config.sessionTitle || `Automaton Analysis ${Date.now()}`
        }
      });

      this.currentSession = {
        id: sessionData.id,
        title: sessionData.title,
        messages: [],
        createdAt: new Date(sessionData.created_at),
        lastActivity: new Date()
      };

      console.log(`📝 Created OpenCode session: ${this.currentSession.id}`);
      return this.currentSession;
    } catch (error) {
      console.error('❌ Failed to create OpenCode session:', error);
      return null;
    }
  }

  async analyzeAutomatonState(automatonData: any): Promise<AnalysisResult | null> {
    if (!this.isConnected || !this.currentSession) {
      throw new Error('OpenCode not connected or no active session');
    }

    try {
      const prompt = this.buildAnalysisPrompt(automatonData);
      
      const response = await this.client.session.prompt({
        path: { id: this.currentSession.id },
        body: {
          model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" },
          parts: [{ type: "text", text: prompt }]
        }
      });

      // Parse the response to extract structured analysis
      return this.parseAnalysisResponse(response.parts[0]?.text || '');
    } catch (error) {
      console.error('❌ Failed to analyze automaton state:', error);
      return null;
    }
  }

  async getSuggestionsForAction(currentDimension: number, availableActions: string[]): Promise<string[]> {
    if (!this.isConnected || !this.currentSession) {
      return [];
    }

    try {
      const prompt = `Given the current automaton state at dimension ${currentDimension}D and available actions ${availableActions.join(', ')}, suggest the best next action to optimize dimensional progression and self-reference patterns. Consider Church encoding principles and computational topology.`;

      const response = await this.client.session.prompt({
        path: { id: this.currentSession.id },
        body: {
          model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" },
          parts: [{ type: "text", text: prompt }]
        }
      });

      return this.extractSuggestions(response.parts[0]?.text || '');
    } catch (error) {
      console.error('❌ Failed to get suggestions:', error);
      return [];
    }
  }

  async analyzeCodeQuality(filePath: string): Promise<AnalysisResult | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const fileContent = await this.client.file.read({
        query: { path: filePath }
      });

      const prompt = `Analyze the following TypeScript code for quality, complexity, and potential improvements:\n\n\`\`\`typescript\n${fileContent.content}\n\`\`\`\n\nProvide:\n1. Code quality score (0-100)\n2. Complexity assessment\n3. Specific recommendations for improvement\n4. Pattern analysis`;

      const response = await this.client.session.prompt({
        path: { id: this.currentSession?.id || (await this.createSession())?.id || '' },
        body: {
          model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" },
          parts: [{ type: "text", text: prompt }]
        }
      });

      return this.parseAnalysisResponse(response.parts[0]?.text || '');
    } catch (error) {
      console.error('❌ Failed to analyze code quality:', error);
      return null;
    }
  }

  async searchCodebase(pattern: string): Promise<any[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const results = await this.client.find.text({
        query: { pattern }
      });

      return results.map((match: any) => ({
        file: match.path,
        lines: match.lines,
        lineNumber: match.line_number,
        context: match.submatches
      }));
    } catch (error) {
      console.error('❌ Failed to search codebase:', error);
      return [];
    }
  }

  private buildAnalysisPrompt(automatonData: any): string {
    return `Analyze the following self-referencing automaton state:

Current Dimension: ${automatonData.currentDimension}D
Iteration Count: ${automatonData.iterationCount}
Self-Modification Count: ${automatonData.selfModificationCount}
Total Objects: ${automatonData.totalObjects}
Status: ${automatonData.status}

Execution History: ${JSON.stringify(automatonData.executionHistory?.slice(-10) || [], null, 2)}

Provide analysis on:
1. Dimensional progression patterns
2. Self-reference frequency and effectiveness
3. Optimization opportunities
4. Potential emergent behaviors
5. Church encoding implementation quality

Format response as structured JSON with keys: patterns, suggestions, codeQuality, complexity, recommendations`;
  }

  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using fallback');
    }

    // Fallback parsing
    return {
      patterns: this.extractPatterns(response),
      suggestions: this.extractSuggestions(response),
      codeQuality: 75, // Default
      complexity: 5, // Default
      recommendations: this.extractRecommendations(response)
    };
  }

  private extractPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('pattern') || line.toLowerCase().includes('trend')) {
        patterns.push(line.trim());
      }
    }
    
    return patterns.length > 0 ? patterns : ['No clear patterns identified'];
  }

  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('recommend')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['Continue current execution pattern'];
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.toLowerCase().includes('improve')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.length > 0 ? recommendations : ['Monitor execution for optimization opportunities'];
  }

  getCurrentSession(): OpenCodeSession | null {
    return this.currentSession;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.client = null;
    this.currentSession = null;
    console.log('🔌 OpenCode disconnected');
  }
}

export const openCodeService = new OpenCodeService();