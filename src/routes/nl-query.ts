#!/usr/bin/env tsx
/**
 * Natural Language Query API Routes
 * 
 * Provides REST API endpoints for natural language queries
 * with conversation context management
 */

import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseManager } from '../../evolutions/document-knowledge-extractor/knowledge-base';
import { EnhancedConversationInterface } from '../../evolutions/natural-language-query/enhanced-conversation-interface';

const router = Router();

// In-memory conversation interfaces (in production, use Redis or database)
const conversationInterfaces = new Map<string, EnhancedConversationInterface>();

// Load knowledge base
let knowledgeBase: KnowledgeBaseManager | null = null;

async function getKnowledgeBase(): Promise<KnowledgeBaseManager> {
  if (knowledgeBase) {
    return knowledgeBase;
  }

  knowledgeBase = new KnowledgeBaseManager();
  
  // Try to load knowledge base from common locations
  const possiblePaths = [
    './knowledge-base.jsonl',
    './evolutions/document-knowledge-extractor/knowledge-base.jsonl',
    path.join(__dirname, '../../knowledge-base.jsonl'),
    path.join(__dirname, '../../evolutions/document-knowledge-extractor/knowledge-base.jsonl')
  ];

  for (const kbPath of possiblePaths) {
    if (fs.existsSync(kbPath)) {
      try {
        const jsonl = fs.readFileSync(kbPath, 'utf-8');
        knowledgeBase.loadFromJSONL(jsonl);
        console.log(`✅ Loaded knowledge base from: ${kbPath}`);
        break;
      } catch (error) {
        console.warn(`⚠️  Failed to load knowledge base from ${kbPath}:`, error);
      }
    }
  }

  return knowledgeBase;
}

/**
 * Get or create conversation interface
 */
async function getConversationInterface(conversationId?: string): Promise<EnhancedConversationInterface> {
  const kb = await getKnowledgeBase();
  
  if (conversationId && conversationInterfaces.has(conversationId)) {
    return conversationInterfaces.get(conversationId)!;
  }

  const conversation = new EnhancedConversationInterface(kb);
  
  if (conversationId) {
    conversationInterfaces.set(conversationId, conversation);
  }

  return conversation;
}

/**
 * POST /api/nl-query/ask
 * Ask a question with natural language
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, conversationId, userId } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string'
      });
    }

    const conversation = await getConversationInterface(conversationId);
    
    // Switch to conversation if provided
    if (conversationId && conversationId !== conversation.getConversationId()) {
      conversation.switchConversation(conversationId);
    }

    // Ask question
    const response = await conversation.ask(question);

    res.json({
      success: true,
      data: {
        answer: response.answer,
        citations: response.citations,
        followUpSuggestions: response.followUpSuggestions,
        relatedEntities: response.relatedEntities,
        confidence: response.confidence,
        conversationId: conversation.getConversationId()
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in /api/nl-query/ask:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/nl-query/history/:conversationId
 * Get conversation history
 */
router.get('/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await getConversationInterface(conversationId);

    if (conversationId !== conversation.getConversationId()) {
      const switched = conversation.switchConversation(conversationId);
      if (!switched) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
    }

    const history = conversation.getHistory();

    res.json({
      success: true,
      data: history,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in /api/nl-query/history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/nl-query/conversation
 * Create a new conversation
 */
router.post('/conversation', async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await getConversationInterface();
    const conversationId = conversation.createNewConversation(userId);

    conversationInterfaces.set(conversationId, conversation);

    res.json({
      success: true,
      data: {
        conversationId,
        userId: userId || 'default'
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in /api/nl-query/conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

/**
 * DELETE /api/nl-query/conversation/:conversationId
 * Delete a conversation
 */
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (conversationInterfaces.has(conversationId)) {
      conversationInterfaces.delete(conversationId);
    }

    res.json({
      success: true,
      message: 'Conversation deleted',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in /api/nl-query/conversation DELETE:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/nl-query/conversation/:conversationId/clear
 * Clear conversation history
 */
router.post('/conversation/:conversationId/clear', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await getConversationInterface(conversationId);

    if (conversationId !== conversation.getConversationId()) {
      const switched = conversation.switchConversation(conversationId);
      if (!switched) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
    }

    conversation.clearHistory();

    res.json({
      success: true,
      message: 'Conversation history cleared',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in /api/nl-query/conversation/clear:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/nl-query/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const kb = await getKnowledgeBase();
    const stats = {
      facts: kb['knowledgeBase'].facts.length,
      rules: kb['knowledgeBase'].rules.length,
      agents: kb['knowledgeBase'].agents.length,
      functions: kb['knowledgeBase'].functions.length,
      activeConversations: conversationInterfaces.size
    };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        knowledgeBase: stats,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

export default router;
