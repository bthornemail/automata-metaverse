#!/usr/bin/env tsx
/**
 * Agent Router & Coordinator
 * 
 * Routes queries to appropriate agents, coordinates multi-agent responses,
 * and merges responses from multiple agents
 */

import { QueryIntent, QueryResult } from './nl-query-engine';
import { ConversationContextManager, ConversationContext, AgentResponse } from './conversation-context-manager';
import { KnowledgeBaseManager, AgentDefinition } from '../document-knowledge-extractor/knowledge-base';

export interface AgentRoute {
  agentId: string;
  agentName: string;
  dimension?: string;
  confidence: number;
  reason: string;
}

export interface CoordinatedResponse {
  primaryResponse: AgentResponse;
  additionalResponses: AgentResponse[];
  mergedAnswer: string;
  confidence: number;
  agentsUsed: string[];
}

/**
 * Agent Router & Coordinator
 */
export class AgentRouter {
  private knowledgeBase: KnowledgeBaseManager;
  private contextManager: ConversationContextManager;
  private agentRegistry: Map<string, AgentDefinition> = new Map();

  constructor(
    knowledgeBase: KnowledgeBaseManager,
    contextManager: ConversationContextManager
  ) {
    this.knowledgeBase = knowledgeBase;
    this.contextManager = contextManager;
    this.loadAgentRegistry();
  }

  /**
   * Route query to appropriate agents
   */
  routeQuery(
    intent: QueryIntent,
    conversationId: string
  ): AgentRoute[] {
    const routes: AgentRoute[] = [];
    const context = this.contextManager.getContext(conversationId);

    // Get all agents from knowledge base
    const allAgents = this.knowledgeBase.queryAgents();

    // Route based on intent type
    switch (intent.type) {
      case 'agent':
        routes.push(...this.routeAgentQuery(intent, allAgents, context));
        break;

      case 'function':
        routes.push(...this.routeFunctionQuery(intent, allAgents, context));
        break;

      case 'rule':
        routes.push(...this.routeRuleQuery(intent, allAgents, context));
        break;

      case 'fact':
        routes.push(...this.routeFactQuery(intent, allAgents, context));
        break;

      default:
        // Default: Query-Interface-Agent
        routes.push({
          agentId: 'query-interface-agent',
          agentName: 'Query-Interface-Agent',
          confidence: 0.8,
          reason: 'Default agent for general queries'
        });
    }

    // Sort by confidence
    routes.sort((a, b) => b.confidence - a.confidence);

    return routes;
  }

  /**
   * Coordinate multi-agent response
   */
  async coordinateResponse(
    routes: AgentRoute[],
    intent: QueryIntent,
    conversationId: string
  ): Promise<CoordinatedResponse> {
    if (routes.length === 0) {
      throw new Error('No agents available for routing');
    }

    // Select primary agent (highest confidence)
    const primaryRoute = routes[0];
    if (!primaryRoute) {
      throw new Error('No primary route available');
    }
    const primaryResponse = await this.queryAgent(primaryRoute, intent, conversationId);

    // Select additional agents if needed
    const additionalResponses: AgentResponse[] = [];
    if (routes.length > 1 && primaryResponse.confidence < 0.7) {
      // Query additional agents if primary confidence is low
      for (const route of routes.slice(1, 3)) { // Max 2 additional agents
        const response = await this.queryAgent(route, intent, conversationId);
        if (response.confidence > 0.5) {
          additionalResponses.push(response);
        }
      }
    }

    // Merge responses
    const mergedAnswer = this.mergeResponses(primaryResponse, additionalResponses, intent);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(primaryResponse, additionalResponses);

    return {
      primaryResponse,
      additionalResponses,
      mergedAnswer,
      confidence,
      agentsUsed: [primaryRoute?.agentName || 'unknown', ...additionalResponses.map(r => r.agentName)]
    };
  }

  /**
   * Route agent query
   */
  private routeAgentQuery(
    intent: QueryIntent,
    agents: AgentDefinition[],
    context: ConversationContext | null
  ): AgentRoute[] {
    const routes: AgentRoute[] = [];

    // If specific agent mentioned, route to that agent
    if (intent.entity) {
      const agentName = intent.entity.toLowerCase();
      
      // Try exact match first
      let matchingAgent = agents.find(a => 
        a.name.toLowerCase() === agentName
      );
      
      // Try partial match
      if (!matchingAgent) {
        matchingAgent = agents.find(a => 
          a.name.toLowerCase().includes(agentName) ||
          agentName.includes(a.name.toLowerCase().replace(/\s+/g, '-'))
        );
      }
      
      // Try matching by dimension prefix (e.g., "4D" matches "4D-Network-Agent")
      if (!matchingAgent && agentName.match(/^\d+d/i)) {
        const dimension = agentName.match(/^(\d+d)/i)?.[1]?.toUpperCase();
        if (dimension) {
          matchingAgent = agents.find(a => 
            a.dimension === dimension && 
            a.name.toLowerCase().includes(agentName.replace(/^\d+d[-_]?/i, ''))
          );
        }
      }

      if (matchingAgent) {
        routes.push({
          agentId: matchingAgent.id,
          agentName: matchingAgent.name,
          dimension: matchingAgent.dimension,
          confidence: 0.9,
          reason: `Direct match for agent: ${matchingAgent.name}`
        });
        return routes; // Return early if we found a match
      }
    }

    // Route by dimension
    if (intent.filters?.dimension) {
      const dimension = intent.filters.dimension;
      const dimensionAgents = agents.filter(a => a.dimension === dimension);
      
      dimensionAgents.forEach(agent => {
        routes.push({
          agentId: agent.id,
          agentName: agent.name,
          dimension: agent.dimension,
          confidence: 0.8,
          reason: `Dimension match: ${dimension}`
        });
      });
      
      if (routes.length > 0) {
        return routes; // Return if we found dimension matches
      }
    }

    // If we have agents but no match, use Query-Interface-Agent but with lower confidence
    // This will allow the system to fall back to direct knowledge base query
    routes.push({
      agentId: 'query-interface-agent',
      agentName: 'Query-Interface-Agent',
      confidence: 0.5,
      reason: 'Fallback: using Query-Interface-Agent'
    });

    return routes;
  }

  /**
   * Route function query
   */
  private routeFunctionQuery(
    intent: QueryIntent,
    agents: AgentDefinition[],
    context: ConversationContext | null
  ): AgentRoute[] {
    const routes: AgentRoute[] = [];

    // Route to agents that use R5RS functions (typically 0D-3D agents)
    const r5rsAgents = agents.filter(a => 
      a.dimension && ['0D', '1D', '2D', '3D'].includes(a.dimension)
    );

    r5rsAgents.forEach(agent => {
      routes.push({
        agentId: agent.id,
        agentName: agent.name,
        dimension: agent.dimension,
        confidence: 0.7,
        reason: `R5RS function query - ${agent.dimension} agent`
      });
    });

    // Default: Query-Interface-Agent
    if (routes.length === 0) {
      routes.push({
        agentId: 'query-interface-agent',
        agentName: 'Query-Interface-Agent',
        confidence: 0.6,
        reason: 'Default agent for function queries'
      });
    }

    return routes;
  }

  /**
   * Route rule query
   */
  private routeRuleQuery(
    intent: QueryIntent,
    agents: AgentDefinition[],
    context: ConversationContext | null
  ): AgentRoute[] {
    const routes: AgentRoute[] = [];

    // Route to agents based on rule context
    if (intent.filters?.context) {
      const context = intent.filters.context.toLowerCase();
      
      // Match agents by capability or purpose
      agents.forEach(agent => {
        const agentText = `${agent.purpose} ${agent.capabilities.join(' ')}`.toLowerCase();
        if (agentText.includes(context)) {
          routes.push({
            agentId: agent.id,
            agentName: agent.name,
            dimension: agent.dimension,
            confidence: 0.7,
            reason: `Rule context matches agent: ${agent.name}`
          });
        }
      });
    }

    // Default: Query-Interface-Agent
    if (routes.length === 0) {
      routes.push({
        agentId: 'query-interface-agent',
        agentName: 'Query-Interface-Agent',
        confidence: 0.6,
        reason: 'Default agent for rule queries'
      });
    }

    return routes;
  }

  /**
   * Route fact query
   */
  private routeFactQuery(
    intent: QueryIntent,
    agents: AgentDefinition[],
    context: ConversationContext | null
  ): AgentRoute[] {
    const routes: AgentRoute[] = [];

    // Route based on entity or topic
    if (intent.entity) {
      const entity = intent.entity.toLowerCase();
      
      // Match agents by dimension or name
      agents.forEach(agent => {
        if (entity.includes(agent.dimension?.toLowerCase() || '') ||
            agent.name.toLowerCase().includes(entity)) {
          routes.push({
            agentId: agent.id,
            agentName: agent.name,
            dimension: agent.dimension,
            confidence: 0.7,
            reason: `Fact entity matches agent: ${agent.name}`
          });
        }
      });
    }

    // Default: Query-Interface-Agent
    if (routes.length === 0) {
      routes.push({
        agentId: 'query-interface-agent',
        agentName: 'Query-Interface-Agent',
        confidence: 0.6,
        reason: 'Default agent for fact queries'
      });
    }

    return routes;
  }

  /**
   * Query an agent using knowledge base
   */
  private async queryAgent(
    route: AgentRoute,
    intent: QueryIntent,
    conversationId: string
  ): Promise<AgentResponse> {
    // Query knowledge base for agent information
    let agent: AgentDefinition | undefined;
    
    // Try to find agent by ID first
    agent = this.agentRegistry.get(route.agentId);
    
    // If not found, try querying by name or dimension
    if (!agent) {
      const agents = this.knowledgeBase.queryAgents(route.dimension, route.agentName);
      if (agents.length > 0) {
        // Find exact match by name if possible
        agent = agents.find(a => 
          a.name.toLowerCase() === route.agentName.toLowerCase()
        ) || agents[0];
      }
    }

    if (!agent) {
      return {
        agentId: route.agentId,
        agentName: route.agentName,
        response: `I couldn't find information about "${route.agentName}". Please check if the agent exists in the knowledge base.`,
        confidence: 0.1,
        data: null
      };
    }

    // Generate response based on agent and intent
    let response = `**${agent.name}**\n\n`;
    response += `**Purpose:** ${agent.purpose}\n\n`;

    if (agent.dimension) {
      response += `**Dimension:** ${agent.dimension}\n\n`;
    }

    // Handle specific query types
    if (intent.filters?.queryType === 'dependencies' || 
        intent.question?.toLowerCase().includes('dependenc')) {
      if (agent.dependencies.length > 0) {
        response += `**Dependencies:**\n${agent.dependencies.map(d => `- ${d}`).join('\n')}\n\n`;
      } else {
        response += `**Dependencies:** None\n\n`;
      }
    } else if (intent.filters?.queryType === 'capabilities' ||
               intent.question?.toLowerCase().includes('capabilit')) {
      if (agent.capabilities.length > 0) {
        response += `**Capabilities:**\n${agent.capabilities.map(c => `- ${c}`).join('\n')}\n\n`;
      } else {
        response += `**Capabilities:** None specified\n\n`;
      }
    } else {
      // Default: show all information
      if (agent.capabilities.length > 0) {
        response += `**Capabilities:**\n${agent.capabilities.map(c => `- ${c}`).join('\n')}\n\n`;
      }
      
      if (agent.dependencies.length > 0) {
        response += `**Dependencies:** ${agent.dependencies.join(', ')}\n\n`;
      }
      
      if (agent.requirements && agent.requirements.length > 0) {
        response += `**Requirements:** ${agent.requirements.join(', ')}\n\n`;
      }
      
      if (agent.churchEncoding) {
        const encoding = Array.isArray(agent.churchEncoding) 
          ? agent.churchEncoding.join(', ')
          : agent.churchEncoding;
        response += `**Church Encoding:** ${encoding}\n\n`;
      }
      
      if (agent.ciIntegration) {
        response += `**CI/CD Integration:**\n`;
        response += `- Adapter: ${agent.ciIntegration.adapter}\n`;
        response += `- Operations: ${agent.ciIntegration.operations.join(', ')}\n`;
        response += `- Responsibilities: ${agent.ciIntegration.responsibilities.join(', ')}\n\n`;
      }
    }

    response += `*Source: ${agent.source}*`;

    return {
      agentId: route.agentId,
      agentName: route.agentName,
      response,
      confidence: route.confidence,
      data: agent
    };
  }

  /**
   * Merge responses from multiple agents
   */
  private mergeResponses(
    primary: AgentResponse,
    additional: AgentResponse[],
    intent: QueryIntent
  ): string {
    let merged = primary.response;

    if (additional.length > 0) {
      merged += '\n\n**Additional Information:**\n\n';
      additional.forEach((response, i) => {
        merged += `**From ${response.agentName}:**\n${response.response}\n\n`;
      });
    }

    return merged;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    primary: AgentResponse,
    additional: AgentResponse[]
  ): number {
    let confidence = primary.confidence;

    if (additional.length > 0) {
      const avgAdditional = additional.reduce((sum, r) => sum + r.confidence, 0) / additional.length;
      confidence = (confidence + avgAdditional) / 2;
    }

    return confidence;
  }

  /**
   * Load agent registry from knowledge base
   */
  private loadAgentRegistry(): void {
    const agents = this.knowledgeBase.queryAgents();
    agents.forEach(agent => {
      this.agentRegistry.set(agent.id, agent);
    });
  }
}
