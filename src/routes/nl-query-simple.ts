#!/usr/bin/env tsx
/**
 * Simple NL Query API Handler
 * 
 * Simplified version that works with the custom HTTP server
 */

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseManager } from '../../evolutions/document-knowledge-extractor/knowledge-base';
import { EnhancedConversationInterface } from '../../evolutions/natural-language-query/enhanced-conversation-interface';

// In-memory conversation interfaces
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

async function parseRequestBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export async function handleNLQueryRequest(apiPath: string, req: any, res: any): Promise<boolean> {
  if (!apiPath.startsWith('nl-query/')) {
    return false;
  }

  const endpoint = apiPath.replace('nl-query/', '');

  try {
    let response: any = { success: true, timestamp: Date.now() };

    if (endpoint === 'ask' && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { question, conversationId } = body;

      if (!question || typeof question !== 'string') {
        response.success = false;
        response.error = 'Question is required and must be a string';
      } else {
        const conversation = await getConversationInterface(conversationId);
        
        if (conversationId && conversationId !== conversation.getConversationId()) {
          conversation.switchConversation(conversationId);
        }

        const queryResponse = await conversation.ask(question);

        response.data = {
          answer: queryResponse.answer,
          citations: queryResponse.citations,
          followUpSuggestions: queryResponse.followUpSuggestions,
          relatedEntities: queryResponse.relatedEntities,
          confidence: queryResponse.confidence,
          conversationId: conversation.getConversationId()
        };
      }
    } else if (endpoint.startsWith('history/') && req.method === 'GET') {
      const conversationId = endpoint.replace('history/', '');
      const conversation = await getConversationInterface(conversationId);

      if (conversationId !== conversation.getConversationId()) {
        const switched = conversation.switchConversation(conversationId);
        if (!switched) {
          response.success = false;
          response.error = 'Conversation not found';
        }
      }

      if (response.success) {
        response.data = conversation.getHistory();
      }
    } else if (endpoint === 'conversation' && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { userId } = body;
      const conversation = await getConversationInterface();
      const conversationId = conversation.createNewConversation(userId);

      conversationInterfaces.set(conversationId, conversation);

      response.data = {
        conversationId,
        userId: userId || 'default'
      };
    } else if (endpoint.startsWith('conversation/') && endpoint.endsWith('/clear') && req.method === 'POST') {
      const conversationId = endpoint.replace('conversation/', '').replace('/clear', '');
      const conversation = await getConversationInterface(conversationId);

      if (conversationId !== conversation.getConversationId()) {
        const switched = conversation.switchConversation(conversationId);
        if (!switched) {
          response.success = false;
          response.error = 'Conversation not found';
        }
      }

      if (response.success) {
        conversation.clearHistory();
        response.message = 'Conversation history cleared';
      }
    } else if (endpoint === 'health' && req.method === 'GET') {
      const kb = await getKnowledgeBase();
      response.data = {
        status: 'healthy',
        knowledgeBase: {
          facts: kb['knowledgeBase'].facts.length,
          rules: kb['knowledgeBase'].rules.length,
          agents: kb['knowledgeBase'].agents.length,
          functions: kb['knowledgeBase'].functions.length,
          activeConversations: conversationInterfaces.size
        }
      };
    } else {
      response.success = false;
      response.error = 'Endpoint not found';
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return true;
  } catch (error) {
    console.error('Error in NL Query handler:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }));
    return true;
  }
}
