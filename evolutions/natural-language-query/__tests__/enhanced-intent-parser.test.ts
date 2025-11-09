#!/usr/bin/env tsx
/**
 * Tests for Enhanced Intent Parser
 */

import { NLQueryEngine } from '../nl-query-engine';
import { ConversationContextManager } from '../conversation-context-manager';
import { EnhancedIntentParser } from '../enhanced-intent-parser';
import { KnowledgeBaseManager } from '../../document-knowledge-extractor/knowledge-base';

describe('EnhancedIntentParser', () => {
  let knowledgeBase: KnowledgeBaseManager;
  let queryEngine: NLQueryEngine;
  let contextManager: ConversationContextManager;
  let parser: EnhancedIntentParser;

  beforeEach(() => {
    knowledgeBase = new KnowledgeBaseManager();
    queryEngine = new NLQueryEngine(knowledgeBase);
    contextManager = new ConversationContextManager();
    parser = new EnhancedIntentParser(queryEngine, contextManager);
  });

  describe('parseIntent', () => {
    it('should parse agent query', () => {
      const context = contextManager.createConversation();
      const parsed = parser.parseIntent('What agents are available?', context.conversationId);

      expect(parsed.type).toBe('agent');
      expect(parsed.originalQuestion).toBe('What agents are available?');
      expect(parsed.resolvedQuestion).toBe('What agents are available?');
    });

    it('should extract agent name from question', () => {
      const context = contextManager.createConversation();
      const parsed = parser.parseIntent('Tell me about the 4D-Network-Agent', context.conversationId);

      expect(parsed.type).toBe('agent');
      expect(parsed.entity).toBeDefined();
      expect(parsed.entities.length).toBeGreaterThan(0);
    });

    it('should resolve references in follow-up questions', () => {
      const context = contextManager.createConversation();
      
      // First turn
      const turn1 = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent', entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' },
        entities: [{
          id: 'entity-1',
          type: 'agent' as const,
          name: '4D-Network-Agent',
          metadata: { timestamp: Date.now() }
        }]
      };
      contextManager.addTurn(context.conversationId, turn1);

      // Follow-up with reference
      const parsed = parser.parseIntent('What are its dependencies?', context.conversationId);
      
      expect(parsed.resolvedQuestion).toContain('4D-Network-Agent');
      expect(parsed.entities.length).toBeGreaterThan(0);
    });

    it('should detect when clarification is needed', () => {
      const context = contextManager.createConversation();
      const parsed = parser.parseIntent('Tell me about something', context.conversationId);

      // Should detect that clarification is needed if entity is ambiguous
      expect(parsed.requiresClarification).toBeDefined();
    });

    it('should extract dimension from question', () => {
      const context = contextManager.createConversation();
      const parsed = parser.parseIntent('What agents are in 4D?', context.conversationId);

      expect(parsed.type).toBe('agent');
      expect(parsed.filters?.dimension).toBe('4D');
    });
  });

  describe('refineIntent', () => {
    it('should refine intent with context', () => {
      const context = contextManager.createConversation();
      
      // Set current topic
      context.currentTopic = '4D-Network-Agent';
      contextManager['conversations'].set(context.conversationId, context);

      const parsed = parser.parseIntent('Tell me more', context.conversationId);
      
      // Should inherit context from previous conversation
      expect(parsed.filters?.topic).toBe('4D-Network-Agent');
    });
  });

  describe('resolveReferences', () => {
    it('should resolve "it" to recent entity', () => {
      const context = contextManager.createConversation();
      
      const turn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent', entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' },
        entities: [{
          id: 'entity-1',
          type: 'agent' as const,
          name: '4D-Network-Agent',
          metadata: { timestamp: Date.now() }
        }]
      };
      contextManager.addTurn(context.conversationId, turn);

      const resolved = parser['resolveReferences']('What are its capabilities?', context);
      expect(resolved).toContain('4D-Network-Agent');
    });
  });

  describe('expandQuery', () => {
    it('should expand agent query to include dependencies', () => {
      const context = contextManager.createConversation();
      const intent = {
        type: 'agent' as const,
        entity: '4D-Network-Agent',
        question: 'Tell me about 4D-Network-Agent'
      };

      const expanded = parser['expandQuery'](intent, context);
      expect(expanded.length).toBeGreaterThan(1);
      expect(expanded.some(q => q.filters?.queryType === 'dependencies')).toBe(true);
    });
  });
});
