#!/usr/bin/env tsx
/**
 * Tests for Agent Router
 */

import { KnowledgeBaseManager, AgentDefinition } from '../../document-knowledge-extractor/knowledge-base';
import { ConversationContextManager } from '../conversation-context-manager';
import { AgentRouter } from '../agent-router';
import { QueryIntent } from '../nl-query-engine';

describe('AgentRouter', () => {
  let knowledgeBase: KnowledgeBaseManager;
  let contextManager: ConversationContextManager;
  let router: AgentRouter;

  beforeEach(() => {
    knowledgeBase = new KnowledgeBaseManager();
    contextManager = new ConversationContextManager();
    router = new AgentRouter(knowledgeBase, contextManager);

    // Add test agents to knowledge base
    const testAgents: AgentDefinition[] = [
      {
        id: 'agent-1',
        name: '4D-Network-Agent',
        dimension: '4D',
        purpose: 'Manage network operations',
        capabilities: ['IPv4/IPv6', 'CI/CD'],
        dependencies: ['3D-Algebraic-Agent'],
        source: 'AGENTS.md',
        metadata: {}
      },
      {
        id: 'agent-2',
        name: '5D-Consensus-Agent',
        dimension: '5D',
        purpose: 'Implement distributed consensus',
        capabilities: ['Blockchain', 'Consensus'],
        dependencies: ['4D-Network-Agent'],
        source: 'AGENTS.md',
        metadata: {}
      },
      {
        id: 'agent-3',
        name: 'Query-Interface-Agent',
        purpose: 'Provide SPARQL/REPL access',
        capabilities: ['SPARQL', 'REPL'],
        dependencies: [],
        source: 'AGENTS.md',
        metadata: {}
      }
    ];

    testAgents.forEach(agent => {
      knowledgeBase['knowledgeBase'].agents.push(agent);
    });
  });

  describe('routeQuery', () => {
    it('should route agent query to specific agent', () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'agent',
        entity: '4D-Network-Agent',
        question: 'Tell me about 4D-Network-Agent'
      };

      const routes = router.routeQuery(intent, context.conversationId);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0]?.agentName).toBe('4D-Network-Agent');
      expect(routes[0]?.confidence).toBeGreaterThan(0.5);
    });

    it('should route by dimension', () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'agent',
        question: 'What agents are in 4D?',
        filters: { dimension: '4D' }
      };

      const routes = router.routeQuery(intent, context.conversationId);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes.some(r => r.dimension === '4D')).toBe(true);
    });

    it('should route function query to R5RS-capable agents', () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'function',
        entity: 'r5rs:church-add',
        question: 'How do I use r5rs:church-add?'
      };

      const routes = router.routeQuery(intent, context.conversationId);

      expect(routes.length).toBeGreaterThan(0);
      // Should route to Query-Interface-Agent or dimension agents
    });

    it('should fallback to Query-Interface-Agent when no match', () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'unknown',
        question: 'Random question'
      };

      const routes = router.routeQuery(intent, context.conversationId);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0]?.agentName).toBe('Query-Interface-Agent');
    });
  });

  describe('coordinateResponse', () => {
    it('should coordinate agent response', async () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'agent',
        entity: '4D-Network-Agent',
        question: 'Tell me about 4D-Network-Agent'
      };

      const routes = router.routeQuery(intent, context.conversationId);
      const response = await router.coordinateResponse(routes, intent, context.conversationId);

      expect(response).toBeDefined();
      expect(response.primaryResponse).toBeDefined();
      expect(response.primaryResponse.response).toContain('4D-Network-Agent');
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should merge multiple agent responses', async () => {
      const context = contextManager.createConversation();
      const intent: QueryIntent = {
        type: 'agent',
        question: 'What agents are available?'
      };

      const routes = router.routeQuery(intent, context.conversationId);
      const response = await router.coordinateResponse(routes, intent, context.conversationId);

      expect(response.mergedAnswer).toBeDefined();
      expect(response.agentsUsed.length).toBeGreaterThan(0);
    });
  });
});
