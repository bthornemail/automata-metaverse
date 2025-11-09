#!/usr/bin/env tsx
/**
 * Natural Language Query Engine
 * 
 * Converts natural language questions to structured queries
 * and queries the knowledge base
 */

import { KnowledgeBaseManager, Fact, Rule, AgentDefinition, FunctionDefinition } from '../document-knowledge-extractor/knowledge-base';

export interface QueryIntent {
  type: 'agent' | 'function' | 'rule' | 'fact' | 'requirement' | 'example' | 'unknown';
  entity?: string;
  question?: string;
  filters?: Record<string, any>;
}

export interface QueryResult {
  intent: QueryIntent;
  results: Array<Fact | Rule | AgentDefinition | FunctionDefinition>;
  answer: string;
  confidence: number;
}

/**
 * Natural Language Query Engine
 */
export class NLQueryEngine {
  private knowledgeBase: KnowledgeBaseManager;

  constructor(knowledgeBase: KnowledgeBaseManager) {
    this.knowledgeBase = knowledgeBase;
  }

  /**
   * Query knowledge base with natural language
   */
  query(question: string): QueryResult {
    const intent = this.parseIntent(question);
    const results = this.executeQuery(intent);
    const answer = this.formatAnswer(intent, results);
    const confidence = this.calculateConfidence(intent, results);

    return {
      intent,
      results,
      answer,
      confidence
    };
  }

  /**
   * Parse natural language question to intent
   */
  private parseIntent(question: string): QueryIntent {
    const lowerQuestion = question.toLowerCase();
    
    // Agent queries - check for agent names first
    const agentName = this.extractAgentName(lowerQuestion);
    if (agentName || lowerQuestion.includes('agent')) {
      const dimension = this.extractDimension(lowerQuestion);
      const extractedAgentName = agentName || this.extractEntity(lowerQuestion);
      
      // If we found an agent name or the question mentions "agent", treat as agent query
      if (extractedAgentName || lowerQuestion.includes('agent')) {
        return {
          type: 'agent',
          entity: extractedAgentName,
          question,
          filters: {
            dimension,
            name: extractedAgentName
          }
        };
      }
    }
    
    // Function queries
    if (this.matchesPattern(lowerQuestion, ['function', 'r5rs', 'how to use', 'how do i use'])) {
      const functionName = this.extractFunctionName(lowerQuestion);
      
      return {
        type: 'function',
        entity: functionName,
        question,
        filters: {
          name: functionName
        }
      };
    }
    
    // Rule/requirement queries
    if (this.matchesPattern(lowerQuestion, ['must', 'should', 'may', 'requirement', 'rule', 'constraint'])) {
      const keyword = this.extractRFC2119Keyword(lowerQuestion);
      const context = this.extractContext(lowerQuestion);
      
      return {
        type: 'rule',
        question,
        filters: {
          keyword,
          context
        }
      };
    }
    
    // Example queries
    if (this.matchesPattern(lowerQuestion, ['example', 'sample', 'code', 'how to', 'show me'])) {
      return {
        type: 'example',
        question,
        filters: {}
      };
    }
    
    // Fact queries - but check if it's actually an agent query first
    if (this.matchesPattern(lowerQuestion, ['what is', 'what are', 'tell me about', 'explain', 'more about'])) {
      const entity = this.extractEntity(lowerQuestion);
      
      // If entity contains "agent", treat as agent query instead
      if (entity && entity.toLowerCase().includes('agent')) {
        const dimension = this.extractDimension(lowerQuestion);
        const agentName = this.extractAgentName(lowerQuestion) || entity;
        
        return {
          type: 'agent',
          entity: agentName,
          question,
          filters: {
            dimension,
            name: agentName
          }
        };
      }
      
      return {
        type: 'fact',
        entity,
        question,
        filters: {
          content: entity
        }
      };
    }
    
    // Default: unknown
    return {
      type: 'unknown',
      question
    };
  }

  /**
   * Execute query based on intent
   */
  private executeQuery(intent: QueryIntent): Array<Fact | Rule | AgentDefinition | FunctionDefinition> {
    switch (intent.type) {
      case 'agent':
        return this.queryAgents(intent.filters);
      
      case 'function':
        return this.queryFunctions(intent.filters);
      
      case 'rule':
        return this.queryRules(intent.filters);
      
      case 'example':
        return this.queryExamples(intent.filters);
      
      case 'fact':
        return this.queryFacts(intent.filters);
      
      default:
        return [];
    }
  }

  /**
   * Query agents
   */
  private queryAgents(filters?: Record<string, any>): AgentDefinition[] {
    const dimension = filters?.dimension;
    const name = filters?.name;
    return this.knowledgeBase.queryAgents(dimension, name);
  }

  /**
   * Query functions
   */
  private queryFunctions(filters?: Record<string, any>): FunctionDefinition[] {
    const name = filters?.name;
    const module = filters?.module;
    return this.knowledgeBase.queryFunctions(name, module);
  }

  /**
   * Query rules
   */
  private queryRules(filters?: Record<string, any>): Rule[] {
    const keyword = filters?.keyword;
    const source = filters?.source;
    return this.knowledgeBase.queryRules(keyword, source);
  }

  /**
   * Query examples
   */
  private queryExamples(filters?: Record<string, any>): Fact[] {
    return this.knowledgeBase.queryFacts('example');
  }

  /**
   * Query facts
   */
  private queryFacts(filters?: Record<string, any>): Fact[] {
    const content = filters?.content;
    const facts = this.knowledgeBase.queryFacts();
    
    if (content) {
      return facts.filter(f => 
        f.content.toLowerCase().includes(content.toLowerCase()) ||
        f.metadata?.title?.toLowerCase().includes(content.toLowerCase())
      );
    }
    
    return facts;
  }

  /**
   * Format answer in natural language
   */
  private formatAnswer(intent: QueryIntent, results: Array<any>): string {
    if (results.length === 0) {
      return `I couldn't find any information about "${intent.question}".`;
    }
    
    switch (intent.type) {
      case 'agent':
        return this.formatAgentAnswer(results as AgentDefinition[]);
      
      case 'function':
        return this.formatFunctionAnswer(results as FunctionDefinition[]);
      
      case 'rule':
        return this.formatRuleAnswer(results as Rule[]);
      
      case 'example':
        return this.formatExampleAnswer(results as Fact[]);
      
      case 'fact':
        return this.formatFactAnswer(results as Fact[]);
      
      default:
        return `Found ${results.length} result(s) for "${intent.question}".`;
    }
  }

  /**
   * Format agent answer
   */
  private formatAgentAnswer(agents: AgentDefinition[]): string {
    if (agents.length === 0) return 'No agents found.';
    
    if (agents.length === 1) {
      const agent = agents[0];
      let answer = `**${agent.name}**\n\n`;
      answer += `**Purpose:** ${agent.purpose}\n\n`;
      
      if (agent.dimension) {
        answer += `**Dimension:** ${agent.dimension}\n\n`;
      }
      
      if (agent.capabilities.length > 0) {
        answer += `**Capabilities:**\n${agent.capabilities.map(c => `- ${c}`).join('\n')}\n\n`;
      }
      
      if (agent.dependencies.length > 0) {
        answer += `**Dependencies:** ${agent.dependencies.join(', ')}\n\n`;
      }
      
      if (agent.requirements && agent.requirements.length > 0) {
        answer += `**Requirements:** ${agent.requirements.join(', ')}\n\n`;
      }
      
      return answer;
    }
    
    let answer = `Found ${agents.length} agents:\n\n`;
    agents.forEach(agent => {
      answer += `- **${agent.name}**`;
      if (agent.dimension) answer += ` (${agent.dimension})`;
      answer += `: ${agent.purpose}\n`;
    });
    
    return answer;
  }

  /**
   * Format function answer
   */
  private formatFunctionAnswer(functions: FunctionDefinition[]): string {
    if (functions.length === 0) return 'No functions found.';
    
    if (functions.length === 1) {
      const func = functions[0];
      let answer = `**${func.name}**\n\n`;
      answer += `**Description:** ${func.description}\n\n`;
      
      if (func.signature) {
        answer += `**Signature:** \`${func.signature}\`\n\n`;
      }
      
      if (func.module) {
        answer += `**Module:** ${func.module}\n\n`;
      }
      
      if (func.examples.length > 0) {
        answer += `**Examples:**\n\`\`\`\n${func.examples[0]}\n\`\`\`\n\n`;
      }
      
      return answer;
    }
    
    let answer = `Found ${functions.length} functions:\n\n`;
    functions.forEach(func => {
      answer += `- **${func.name}**: ${func.description}\n`;
    });
    
    return answer;
  }

  /**
   * Format rule answer
   */
  private formatRuleAnswer(rules: Rule[]): string {
    if (rules.length === 0) return 'No rules found.';
    
    if (rules.length === 1) {
      const rule = rules[0];
      return `**${rule.rfc2119Keyword}** ${rule.statement}\n\n*Source: ${rule.source}*`;
    }
    
    let answer = `Found ${rules.length} rules:\n\n`;
    rules.forEach(rule => {
      answer += `- **${rule.rfc2119Keyword}**: ${rule.statement}\n`;
    });
    
    return answer;
  }

  /**
   * Format example answer
   */
  private formatExampleAnswer(examples: Fact[]): string {
    if (examples.length === 0) return 'No examples found.';
    
    const example = examples[0];
    const language = example.metadata?.language || 'text';
    
    return `**Example:**\n\n\`\`\`${language}\n${example.content}\n\`\`\`\n\n*Source: ${example.source}*`;
  }

  /**
   * Format fact answer
   */
  private formatFactAnswer(facts: Fact[]): string {
    if (facts.length === 0) return 'No information found.';
    
    const fact = facts[0];
    return `${fact.content}\n\n*Source: ${fact.source}*`;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(intent: QueryIntent, results: Array<any>): number {
    if (intent.type === 'unknown') return 0.1;
    if (results.length === 0) return 0.2;
    if (results.length === 1 && intent.entity) return 0.9;
    if (results.length > 0) return 0.7;
    return 0.5;
  }

  /**
   * Check if question matches pattern
   */
  private matchesPattern(question: string, patterns: string[]): boolean {
    return patterns.some(pattern => question.includes(pattern));
  }

  /**
   * Extract dimension from question (0D-7D)
   */
  private extractDimension(question: string): string | undefined {
    const match = question.match(/(\d+d)/i);
    return match ? match[1].toUpperCase() : undefined;
  }

  /**
   * Extract agent name from question
   */
  private extractAgentName(question: string): string | undefined {
    // Look for patterns like "5D-Consensus-Agent" or "Consensus Agent" or "4D-Network-Agent"
    const agentPatterns = [
      /(\d+d-[\w-]+-agent)/i,  // "4D-Network-Agent"
      /([\w-]+-agent)/i,        // "Network-Agent"
      /(the\s+)?(\d+d\s+)?([\w\s]+)\s+agent/i  // "the 4D Network agent"
    ];
    
    for (const pattern of agentPatterns) {
      const match = question.match(pattern);
      if (match) {
        // Return the full match or the agent name part
        return match[1] || match[3] || match[2] + match[3];
      }
    }
    
    return undefined;
  }

  /**
   * Extract function name from question
   */
  private extractFunctionName(question: string): string | undefined {
    // Look for r5rs:function-name or function-name
    const funcPattern = /(r5rs:[\w-]+|[\w-]+\(\))/i;
    const match = question.match(funcPattern);
    return match ? match[1] : undefined;
  }

  /**
   * Extract RFC2119 keyword from question
   */
  private extractRFC2119Keyword(question: string): string | undefined {
    const keywords = ['must', 'should', 'may', 'must not', 'should not'];
    for (const keyword of keywords) {
      if (question.includes(keyword)) {
        return keyword.toUpperCase();
      }
    }
    return undefined;
  }

  /**
   * Extract context from question
   */
  private extractContext(question: string): string | undefined {
    // Simple context extraction - look for keywords after "for" or "about"
    const contextPattern = /(?:for|about)\s+([\w\s]+)/i;
    const match = question.match(contextPattern);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract entity name from question
   */
  private extractEntity(question: string): string | undefined {
    // Look for "what is X" or "tell me about X" or "more about X"
    const entityPatterns = [
      /(?:what is|tell me about|explain|more about)\s+(the\s+)?([\w\s-]+)/i,
      /(?:what is|tell me about|explain|more about)\s+(the\s+)?(\d+d-[\w-]+-agent)/i
    ];
    
    for (const pattern of entityPatterns) {
      const match = question.match(pattern);
      if (match) {
        const entity = (match[2] || match[3] || match[1]).trim();
        // Remove trailing question words
        return entity.replace(/\s+(agent|function|rule|fact)?\s*$/i, '').trim();
      }
    }
    
    return undefined;
  }
}
