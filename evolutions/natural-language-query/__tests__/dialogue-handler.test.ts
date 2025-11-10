#!/usr/bin/env tsx
/**
 * Tests for Dialogue Handler
 */

import { NLQueryEngine } from '../nl-query-engine';
import { ConversationContextManager } from '../conversation-context-manager';
import { EnhancedIntentParser } from '../enhanced-intent-parser';
import { DialogueHandler } from '../dialogue-handler';
import { KnowledgeBaseManager } from '../../document-knowledge-extractor/knowledge-base';

describe('DialogueHandler', () => {
  let knowledgeBase: KnowledgeBaseManager;
  let queryEngine: NLQueryEngine;
  let contextManager: ConversationContextManager;
  let intentParser: EnhancedIntentParser;
  let handler: DialogueHandler;

  beforeEach(() => {
    knowledgeBase = new KnowledgeBaseManager();
    queryEngine = new NLQueryEngine(knowledgeBase);
    contextManager = new ConversationContextManager();
    intentParser = new EnhancedIntentParser(queryEngine, contextManager);
    handler = new DialogueHandler(contextManager, intentParser, queryEngine);
  });

  describe('handleTurn', () => {
    it('should handle a simple question', async () => {
      const context = contextManager.createConversation();
      const response = await handler.handleTurn(context.conversationId, 'What agents are available?');

      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(response.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should detect follow-up questions', async () => {
      const context = contextManager.createConversation();
      
      // First turn
      const turn1 = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent' as const, entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' }
      };
      contextManager.addTurn(context.conversationId, turn1);

      // Follow-up
      const response = await handler.handleTurn(context.conversationId, 'What are its dependencies?');
      
      expect(response.answer).toBeDefined();
      // Should include context about the follow-up
      expect(response.answer.toLowerCase()).toMatch(/following up|4d-network-agent|dependenc/i);
    });

    it('should ask for clarification when needed', async () => {
      const context = contextManager.createConversation();
      const response = await handler.handleTurn(context.conversationId, 'Tell me about something');

      // Should detect that clarification is needed
      expect(response.requiresClarification).toBeDefined();
    });

    it('should generate follow-up suggestions', async () => {
      const context = contextManager.createConversation();
      const response = await handler.handleTurn(context.conversationId, 'What agents are available?');

      expect(response.followUpSuggestions).toBeDefined();
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
    });
  });

  describe('detectFollowUp', () => {
    it('should detect follow-up indicators', () => {
      const context = contextManager.createConversation();
      
      const turn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent' as const, entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' }
      };
      contextManager.addTurn(context.conversationId, turn);

      expect(handler['detectFollowUp']('Tell me more', context)).toBe(true);
      expect(handler['detectFollowUp']('What about its dependencies?', context)).toBe(true);
      expect(handler['detectFollowUp']('What is it?', context)).toBe(true);
      expect(handler['detectFollowUp']('What agents are available?', context)).toBe(false);
    });
  });

  describe('handleFollowUp', () => {
    it('should handle follow-up questions', () => {
      const context = contextManager.createConversation();
      const previousIntent = {
        type: 'agent' as const,
        entity: '4D-Network-Agent',
        question: 'Tell me about 4D-Network-Agent'
      };

      const followUpIntent = handler['handleFollowUp'](
        previousIntent,
        'What are its dependencies?',
        context
      );

      expect(followUpIntent.entity).toBe('4D-Network-Agent');
      expect(followUpIntent.filters?.queryType).toBe('dependencies');
    });
  });

  describe('detectContextSwitch', () => {
    it('should detect context switch', () => {
      const context = contextManager.createConversation();
      context.currentIntent = {
        type: 'agent',
        entity: '4D-Network-Agent',
        question: 'Tell me about 4D-Network-Agent'
      };

      const parsedIntent = {
        type: 'function' as const,
        entity: 'r5rs:church-add',
        question: 'How do I use r5rs:church-add?',
        originalQuestion: 'How do I use r5rs:church-add?',
        resolvedQuestion: 'How do I use r5rs:church-add?',
        entities: [],
        confidence: 0.8,
        requiresClarification: false
      };

      const switched = handler['detectContextSwitch'](parsedIntent, context);
      expect(switched).toBe(true);
    });
  });
});
