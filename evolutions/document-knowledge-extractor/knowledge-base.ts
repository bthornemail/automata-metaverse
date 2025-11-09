#!/usr/bin/env tsx
/**
 * Knowledge Base Storage System
 * 
 * Stores extracted facts, rules, agents, functions, and relationships
 * in a queryable format for natural language queries and learning systems
 */

export interface Fact {
  id: string;
  source: string; // doc path
  content: string;
  type: 'definition' | 'requirement' | 'example' | 'capability' | 'function' | 'agent';
  metadata: Record<string, any>;
  lineNumber?: number;
}

export interface Rule {
  id: string;
  source: string;
  rfc2119Keyword: 'MUST' | 'SHOULD' | 'MAY' | 'MUST NOT' | 'SHOULD NOT';
  statement: string;
  context: string;
  lineNumber?: number;
  relatedAgents?: string[];
  relatedFunctions?: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  dimension?: string;
  purpose: string;
  capabilities: string[];
  dependencies: string[];
  churchEncoding?: string | string[];
  requirements?: string[];
  ciIntegration?: {
    adapter: string;
    operations: string[];
    responsibilities: string[];
  };
  source: string;
  metadata: Record<string, any>;
}

export interface FunctionDefinition {
  id: string;
  name: string;
  signature?: string;
  description: string;
  module?: string;
  examples: string[];
  source: string;
  metadata: Record<string, any>;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'prerequisite' | 'enables' | 'related' | 'depends' | 'uses' | 'implements';
  source: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeBase {
  facts: Fact[];
  rules: Rule[];
  agents: AgentDefinition[];
  functions: FunctionDefinition[];
  relationships: Relationship[];
  metadata: {
    version: string;
    createdAt: string;
    lastUpdated: string;
    totalDocuments: number;
    sources: string[];
  };
}

/**
 * Knowledge Base Manager
 */
export class KnowledgeBaseManager {
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.knowledgeBase = {
      facts: [],
      rules: [],
      agents: [],
      functions: [],
      relationships: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalDocuments: 0,
        sources: []
      }
    };
  }

  /**
   * Add a fact to the knowledge base
   */
  addFact(fact: Omit<Fact, 'id'>): Fact {
    const id = `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newFact: Fact = { ...fact, id };
    this.knowledgeBase.facts.push(newFact);
    this.updateMetadata();
    return newFact;
  }

  /**
   * Add a rule to the knowledge base
   */
  addRule(rule: Omit<Rule, 'id'>): Rule {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRule: Rule = { ...rule, id };
    this.knowledgeBase.rules.push(newRule);
    this.updateMetadata();
    return newRule;
  }

  /**
   * Add an agent definition
   */
  addAgent(agent: Omit<AgentDefinition, 'id'>): AgentDefinition {
    const id = agent.name.toLowerCase().replace(/\s+/g, '-');
    const existingIndex = this.knowledgeBase.agents.findIndex(a => a.id === id);
    
    if (existingIndex >= 0) {
      // Merge with existing agent
      const existing = this.knowledgeBase.agents[existingIndex];
      if (existing) {
        this.knowledgeBase.agents[existingIndex] = {
          ...existing,
          ...agent,
          id: existing.id, // Preserve existing id
          capabilities: [...new Set([...existing.capabilities, ...agent.capabilities])],
          dependencies: [...new Set([...existing.dependencies, ...agent.dependencies])]
        };
        return this.knowledgeBase.agents[existingIndex];
      }
    }
    const newAgent: AgentDefinition = { ...agent, id };
    this.knowledgeBase.agents.push(newAgent);
    this.updateMetadata();
    return newAgent;
  }

  /**
   * Add a function definition
   */
  addFunction(func: Omit<FunctionDefinition, 'id'>): FunctionDefinition {
    const id = func.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingIndex = this.knowledgeBase.functions.findIndex(f => f.id === id);
    
    if (existingIndex >= 0) {
      // Merge with existing function
      const existing = this.knowledgeBase.functions[existingIndex];
      if (existing) {
        this.knowledgeBase.functions[existingIndex] = {
          ...existing,
          ...func,
          id: existing.id, // Preserve existing id
          examples: [...new Set([...existing.examples, ...func.examples])]
        };
        return this.knowledgeBase.functions[existingIndex];
      }
    }
    const newFunc: FunctionDefinition = { ...func, id };
    this.knowledgeBase.functions.push(newFunc);
    this.updateMetadata();
    return newFunc;
  }

  /**
   * Add a relationship
   */
  addRelationship(relationship: Relationship): void {
    // Check for duplicates
    const exists = this.knowledgeBase.relationships.some(r =>
      r.from === relationship.from &&
      r.to === relationship.to &&
      r.type === relationship.type
    );
    
    if (!exists) {
      this.knowledgeBase.relationships.push(relationship);
      this.updateMetadata();
    }
  }

  /**
   * Get knowledge base
   */
  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  /**
   * Query facts by type
   */
  queryFacts(type?: Fact['type'], source?: string): Fact[] {
    return this.knowledgeBase.facts.filter(f => {
      if (type && f.type !== type) return false;
      if (source && f.source !== source) return false;
      return true;
    });
  }

  /**
   * Query rules by keyword
   */
  queryRules(keyword?: Rule['rfc2119Keyword'], source?: string): Rule[] {
    return this.knowledgeBase.rules.filter(r => {
      if (keyword && r.rfc2119Keyword !== keyword) return false;
      if (source && r.source !== source) return false;
      return true;
    });
  }

  /**
   * Query agents by dimension or name
   */
  queryAgents(dimension?: string, name?: string): AgentDefinition[] {
    return this.knowledgeBase.agents.filter(a => {
      if (dimension && a.dimension !== dimension) return false;
      if (name && !a.name.toLowerCase().includes(name.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Query functions by name or module
   */
  queryFunctions(name?: string, module?: string): FunctionDefinition[] {
    return this.knowledgeBase.functions.filter(f => {
      if (name && !f.name.toLowerCase().includes(name.toLowerCase())) return false;
      if (module && f.module !== module) return false;
      return true;
    });
  }

  /**
   * Update metadata
   */
  private updateMetadata(): void {
    this.knowledgeBase.metadata.lastUpdated = new Date().toISOString();
    const sources = new Set<string>();
    this.knowledgeBase.facts.forEach(f => sources.add(f.source));
    this.knowledgeBase.rules.forEach(r => sources.add(r.source));
    this.knowledgeBase.agents.forEach(a => sources.add(a.source));
    this.knowledgeBase.functions.forEach(f => sources.add(f.source));
    this.knowledgeBase.relationships.forEach(r => sources.add(r.source));
    this.knowledgeBase.metadata.sources = Array.from(sources);
    this.knowledgeBase.metadata.totalDocuments = sources.size;
  }

  /**
   * Export to JSONL format
   */
  exportToJSONL(): string {
    const lines: string[] = [];
    
    // Export facts - preserve fact.type as factType, set entity type as 'fact'
    this.knowledgeBase.facts.forEach(fact => {
      const { type: factType, ...factWithoutType } = fact;
      lines.push(JSON.stringify({ 
        type: 'fact',  // Entity type for loading
        factType,      // Original fact type (definition, requirement, example, etc.)
        ...factWithoutType 
      }));
    });
    
    // Export rules
    this.knowledgeBase.rules.forEach(rule => {
      lines.push(JSON.stringify({ type: 'rule', ...rule }));
    });
    
    // Export agents
    this.knowledgeBase.agents.forEach(agent => {
      lines.push(JSON.stringify({ type: 'agent', ...agent }));
    });
    
    // Export functions
    this.knowledgeBase.functions.forEach(func => {
      const { type, ...funcWithoutType } = func as any;
      lines.push(JSON.stringify({ type: 'function', ...funcWithoutType }));
    });
    
    // Export relationships
    this.knowledgeBase.relationships.forEach(rel => {
      const { type, ...relWithoutType } = rel as any;
      lines.push(JSON.stringify({ type: 'relationship', ...relWithoutType }));
    });
    
    return lines.join('\n');
  }

  /**
   * Load from JSONL format
   */
  loadFromJSONL(jsonl: string): void {
    const lines = jsonl.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const obj = JSON.parse(line);
        
        // Handle old format where facts were exported with type: 'example' instead of type: 'fact'
        // Check if this looks like a fact (has fact-like properties but wrong type)
        const looksLikeFact = obj.id && obj.source && obj.content && 
          ['example', 'definition', 'requirement', 'capability', 'function', 'agent'].includes(obj.type);
        
        if (looksLikeFact && obj.type !== 'fact') {
          // Old format: restore as fact with correct type
          const fact = {
            ...obj,
            type: obj.type  // Keep the original fact type (example, definition, etc.)
          };
          this.knowledgeBase.facts.push(fact);
        } else {
          // New format or other entity types
          switch (obj.type) {
            case 'fact':
              // Restore fact.type from factType if present, otherwise use 'example' as default
              const fact = {
                ...obj,
                type: obj.factType || 'example'
              };
              // Remove factType if it exists (it was just for loading)
              delete fact.factType;
              this.knowledgeBase.facts.push(fact);
              break;
            case 'rule':
              this.knowledgeBase.rules.push(obj);
              break;
            case 'agent':
              this.knowledgeBase.agents.push(obj);
              break;
            case 'function':
              this.knowledgeBase.functions.push(obj);
              break;
            case 'relationship':
              this.knowledgeBase.relationships.push(obj);
              break;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}`);
      }
    });
    
    this.updateMetadata();
  }
}
