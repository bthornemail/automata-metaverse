#!/usr/bin/env tsx
/**
 * Tests for Conversation Context Manager
 */

import { ConversationContextManager, ConversationContext, ConversationTurn, Entity } from '../conversation-context-manager';

describe('ConversationContextManager', () => {
  let manager: ConversationContextManager;

  beforeEach(() => {
    manager = new ConversationContextManager();
  });

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const context = manager.createConversation('user1');
      
      expect(context).toBeDefined();
      expect(context.conversationId).toMatch(/^conv-/);
      expect(context.userId).toBe('user1');
      expect(context.turns).toEqual([]);
      expect(context.entities.size).toBe(0);
    });

    it('should create conversation with default user if not provided', () => {
      const context = manager.createConversation();
      
      expect(context.userId).toBe('default');
    });
  });

  describe('addTurn', () => {
    it('should add a turn to conversation', () => {
      const context = manager.createConversation();
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'What agents are available?',
        intent: { type: 'agent', question: 'What agents are available?' },
        mergedResponse: 'Found 15 agents'
      };

      manager.addTurn(context.conversationId, turn);

      const updatedContext = manager.getContext(context.conversationId);
      expect(updatedContext?.turns.length).toBe(1);
      expect(updatedContext?.turns[0].userInput).toBe('What agents are available?');
      expect(updatedContext?.currentIntent?.type).toBe('agent');
    });

    it('should update entities from turn', () => {
      const context = manager.createConversation();
      const entity: Entity = {
        id: 'entity-1',
        type: 'agent',
        name: '4D-Network-Agent',
        metadata: { timestamp: Date.now() }
      };
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent', entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' },
        entities: [entity]
      };

      manager.addTurn(context.conversationId, turn);

      const updatedContext = manager.getContext(context.conversationId);
      expect(updatedContext?.entities.has('entity-1')).toBe(true);
      expect(updatedContext?.entities.get('entity-1')?.name).toBe('4D-Network-Agent');
    });

    it('should trim history when exceeding max size', () => {
      const context = manager.createConversation();
      const maxSize = 100;

      // Add more than max size turns
      for (let i = 0; i < maxSize + 10; i++) {
        const turn: ConversationTurn = {
          turnId: `turn-${i}`,
          timestamp: Date.now(),
          userInput: `Question ${i}`,
          intent: { type: 'unknown', question: `Question ${i}` }
        };
        manager.addTurn(context.conversationId, turn);
      }

      const updatedContext = manager.getContext(context.conversationId);
      expect(updatedContext?.turns.length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('resolveEntityReference', () => {
    it('should resolve "it" to recent entity', () => {
      const context = manager.createConversation();
      const entity: Entity = {
        id: 'entity-1',
        type: 'agent',
        name: '4D-Network-Agent',
        metadata: { timestamp: Date.now() }
      };
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Tell me about 4D-Network-Agent',
        intent: { type: 'agent', entity: '4D-Network-Agent', question: 'Tell me about 4D-Network-Agent' },
        entities: [entity]
      };

      manager.addTurn(context.conversationId, turn);

      const resolved = manager.resolveEntityReference('it', context);
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe('4D-Network-Agent');
    });

    it('should resolve "that agent" to recent agent entity', () => {
      const context = manager.createConversation();
      const entity: Entity = {
        id: 'entity-1',
        type: 'agent',
        name: '5D-Consensus-Agent',
        metadata: { timestamp: Date.now() }
      };
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'What is 5D-Consensus-Agent?',
        intent: { type: 'agent', entity: '5D-Consensus-Agent', question: 'What is 5D-Consensus-Agent?' },
        entities: [entity]
      };

      manager.addTurn(context.conversationId, turn);

      const resolved = manager.resolveEntityReference('that agent', context);
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe('5D-Consensus-Agent');
    });
  });

  describe('getHistory', () => {
    it('should return conversation history', () => {
      const context = manager.createConversation();
      const turn1: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Question 1',
        intent: { type: 'unknown', question: 'Question 1' }
      };
      const turn2: ConversationTurn = {
        turnId: 'turn-2',
        timestamp: Date.now(),
        userInput: 'Question 2',
        intent: { type: 'unknown', question: 'Question 2' }
      };

      manager.addTurn(context.conversationId, turn1);
      manager.addTurn(context.conversationId, turn2);

      const history = manager.getHistory(context.conversationId);
      expect(history.length).toBe(2);
      expect(history[0].userInput).toBe('Question 1');
      expect(history[1].userInput).toBe('Question 2');
    });

    it('should limit history when limit is provided', () => {
      const context = manager.createConversation();
      
      for (let i = 0; i < 5; i++) {
        const turn: ConversationTurn = {
          turnId: `turn-${i}`,
          timestamp: Date.now(),
          userInput: `Question ${i}`,
          intent: { type: 'unknown', question: `Question ${i}` }
        };
        manager.addTurn(context.conversationId, turn);
      }

      const history = manager.getHistory(context.conversationId, 3);
      expect(history.length).toBe(3);
      expect(history[0].userInput).toBe('Question 2'); // Last 3 turns
    });
  });

  describe('clearHistory', () => {
    it('should clear conversation history', () => {
      const context = manager.createConversation();
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Question',
        intent: { type: 'unknown', question: 'Question' }
      };

      manager.addTurn(context.conversationId, turn);
      manager.clearHistory(context.conversationId);

      const updatedContext = manager.getContext(context.conversationId);
      expect(updatedContext?.turns.length).toBe(0);
      expect(updatedContext?.entities.size).toBe(0);
      expect(updatedContext?.currentIntent).toBeNull();
    });
  });

  describe('exportContext and importContext', () => {
    it('should export and import conversation context', () => {
      const context = manager.createConversation('user1');
      const entity: Entity = {
        id: 'entity-1',
        type: 'agent',
        name: '4D-Network-Agent',
        metadata: { timestamp: Date.now() }
      };
      const turn: ConversationTurn = {
        turnId: 'turn-1',
        timestamp: Date.now(),
        userInput: 'Question',
        intent: { type: 'agent', entity: '4D-Network-Agent', question: 'Question' },
        entities: [entity]
      };

      manager.addTurn(context.conversationId, turn);

      const exported = manager.exportContext(context.conversationId);
      expect(exported).toBeDefined();
      expect(exported?.conversationId).toBe(context.conversationId);
      expect(exported?.turns.length).toBe(1);

      // Import into new manager
      const newManager = new ConversationContextManager();
      const imported = newManager.importContext(exported!);
      
      expect(imported.conversationId).toBe(context.conversationId);
      expect(imported.turns.length).toBe(1);
      expect(imported.entities.size).toBe(1);
    });
  });
});
