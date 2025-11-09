#!/usr/bin/env tsx
/**
 * Integration tests for Enhanced Conversation Interface
 */

import { KnowledgeBaseManager } from '../../document-knowledge-extractor/knowledge-base';
import { EnhancedConversationInterface } from '../enhanced-conversation-interface';

describe('EnhancedConversationInterface', () => {
  let knowledgeBase: KnowledgeBaseManager;
  let interface_: EnhancedConversationInterface;

  beforeEach(() => {
    knowledgeBase = new KnowledgeBaseManager();
    
    // Add test data
    knowledgeBase['knowledgeBase'].agents.push({
      id: 'agent-1',
      name: '4D-Network-Agent',
      dimension: '4D',
      purpose: 'Manage network operations',
      capabilities: ['IPv4/IPv6', 'CI/CD', 'Deployment'],
      dependencies: ['3D-Algebraic-Agent'],
      source: 'AGENTS.md',
      metadata: {}
    });

    knowledgeBase['knowledgeBase'].facts.push({
      id: 'fact-1',
      source: 'AGENTS.md',
      content: '4D-Network-Agent handles network operations',
      type: 'definition',
      metadata: { title: 'Network Agent' }
    });

    interface_ = new EnhancedConversationInterface(knowledgeBase);
  });

  describe('ask', () => {
    it('should answer agent questions', async () => {
      const response = await interface_.ask('What agents are available?');

      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should handle follow-up questions', async () => {
      // First question
      await interface_.ask('Tell me about 4D-Network-Agent');

      // Follow-up
      const response = await interface_.ask('What are its dependencies?');

      expect(response.answer).toBeDefined();
      expect(response.answer.toLowerCase()).toMatch(/dependenc|3d-algebraic/i);
    });

    it('should include citations', async () => {
      const response = await interface_.ask('Tell me about 4D-Network-Agent');

      expect(response.citations).toBeDefined();
      expect(Array.isArray(response.citations)).toBe(true);
    });

    it('should generate follow-up suggestions', async () => {
      const response = await interface_.ask('Tell me about 4D-Network-Agent');

      expect(response.followUpSuggestions).toBeDefined();
      expect(response.followUpSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('conversation management', () => {
    it('should maintain conversation history', async () => {
      await interface_.ask('Question 1');
      await interface_.ask('Question 2');

      const history = interface_.getHistory();
      expect(history.length).toBe(2);
    });

    it('should clear conversation history', async () => {
      await interface_.ask('Question 1');
      interface_.clearHistory();

      const history = interface_.getHistory();
      expect(history.length).toBe(0);
    });

    it('should create new conversations', () => {
      const newId = interface_.createNewConversation('user2');
      expect(newId).toBeDefined();
      expect(newId).not.toBe(interface_.getConversationId());
    });

    it('should switch conversations', () => {
      const newId = interface_.createNewConversation('user2');
      const switched = interface_.switchConversation(newId);
      
      expect(switched).toBe(true);
      expect(interface_.getConversationId()).toBe(newId);
    });
  });

  describe('context awareness', () => {
    it('should resolve entity references', async () => {
      await interface_.ask('Tell me about 4D-Network-Agent');
      const response = await interface_.ask('What are its capabilities?');

      expect(response.answer).toBeDefined();
      expect(response.answer.toLowerCase()).toMatch(/capabilit|ipv4|ipv6|ci\/cd/i);
    });

    it('should maintain context across turns', async () => {
      await interface_.ask('What is 4D-Network-Agent?');
      const response = await interface_.ask('Tell me more');

      expect(response.answer).toBeDefined();
      // Should still be about 4D-Network-Agent
    });
  });
});
