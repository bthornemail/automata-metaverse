#!/usr/bin/env tsx
/**
 * Enhanced Conversation Interface
 * 
 * Integrated natural language interface that combines:
 * - Conversation Context Manager
 * - Enhanced Intent Parser
 * - Multi-turn Dialogue Handler
 * - Agent Router & Coordinator
 * - Enhanced Response Generator
 */

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseManager } from '../document-knowledge-extractor/knowledge-base';
import { NLQueryEngine } from './nl-query-engine';
import { ConversationContextManager } from './conversation-context-manager';
import { EnhancedIntentParser } from './enhanced-intent-parser';
import { DialogueHandler, Response } from './dialogue-handler';
import { AgentRouter } from './agent-router';
import { EnhancedResponseGenerator, FormattedResponse } from './enhanced-response-generator';

/**
 * Enhanced Conversation Interface
 */
export class EnhancedConversationInterface {
  private knowledgeBase: KnowledgeBaseManager;
  private queryEngine: NLQueryEngine;
  private contextManager: ConversationContextManager;
  private intentParser: EnhancedIntentParser;
  private dialogueHandler: DialogueHandler;
  private agentRouter: AgentRouter;
  private responseGenerator: EnhancedResponseGenerator;
  private conversationId: string;

  constructor(knowledgeBase: KnowledgeBaseManager) {
    this.knowledgeBase = knowledgeBase;
    this.queryEngine = new NLQueryEngine(knowledgeBase);
    this.contextManager = new ConversationContextManager();
    this.intentParser = new EnhancedIntentParser(this.queryEngine, this.contextManager);
    this.dialogueHandler = new DialogueHandler(
      this.contextManager,
      this.intentParser,
      this.queryEngine
    );
    this.agentRouter = new AgentRouter(knowledgeBase, this.contextManager);
    this.responseGenerator = new EnhancedResponseGenerator();
    
    // Create default conversation
    const context = this.contextManager.createConversation();
    this.conversationId = context.conversationId;
  }

  /**
   * Ask a question with full context awareness
   */
  async ask(question: string): Promise<FormattedResponse> {
    // Handle turn through dialogue handler
    const dialogueResponse = await this.dialogueHandler.handleTurn(
      this.conversationId,
      question
    );

    // If clarification needed, return early
    if (dialogueResponse.requiresClarification) {
      return {
        answer: dialogueResponse.answer,
        citations: [],
        followUpSuggestions: dialogueResponse.clarificationQuestions || [],
        relatedEntities: dialogueResponse.entities || [],
        confidence: dialogueResponse.confidence
      };
    }

    // Get context for routing
    const context = this.contextManager.getContext(this.conversationId);
    if (!context) {
      throw new Error('Conversation context not found');
    }

    // Get last turn's intent
    const lastTurn = context.turns[context.turns.length - 1];
    const intent = lastTurn?.intent || { type: 'unknown', question };

    // Get query result first (for fallback and citations)
    const queryResult = this.queryEngine.query(question);
    
    // Route to agents
    const routes = this.agentRouter.routeQuery(intent, this.conversationId);

    // Coordinate agent responses only if we have good routes
    let coordinatedResponse;
    if (routes.length > 0 && routes[0].confidence > 0.5) {
      try {
        coordinatedResponse = await this.agentRouter.coordinateResponse(
          routes,
          intent,
          this.conversationId
        );
      } catch (error) {
        // Fallback to direct query if agent routing fails
        console.warn('Agent routing failed, using direct query:', error);
      }
    }

    // If agent routing didn't work or confidence is low, use direct query result
    if (!coordinatedResponse || coordinatedResponse.confidence < 0.5) {
      // Use direct query result instead
      return this.responseGenerator.generateResponse(
        queryResult,
        lastTurn?.intent || { type: 'unknown', question },
        undefined,
        context
      );
    }

    // Generate formatted response with coordinated response
    const formattedResponse = this.responseGenerator.generateResponse(
      queryResult,
      lastTurn?.intent || { type: 'unknown', question },
      coordinatedResponse,
      context
    );

    return formattedResponse;
  }

  /**
   * Get conversation history
   */
  getHistory(): any[] {
    return this.contextManager.getHistory(this.conversationId);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.contextManager.clearHistory(this.conversationId);
  }

  /**
   * Create new conversation
   */
  createNewConversation(userId?: string): string {
    const context = this.contextManager.createConversation(userId);
    this.conversationId = context.conversationId;
    return this.conversationId;
  }

  /**
   * Switch to existing conversation
   */
  switchConversation(conversationId: string): boolean {
    const context = this.contextManager.getContext(conversationId);
    if (!context) {
      return false;
    }
    this.conversationId = conversationId;
    return true;
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string {
    return this.conversationId;
  }

  /**
   * Interactive CLI mode
   */
  async interactiveMode(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 > '
    });
    
    console.log('🤖 Enhanced Natural Language Query Interface');
    console.log('Ask questions about agents, functions, rules, and examples.');
    console.log('The system maintains conversation context and can handle follow-up questions.');
    console.log('Type "exit" or "quit" to exit, "help" for help, "history" to see history.\n');
    
    rl.prompt();
    
    rl.on('line', async (input: string) => {
      const question = input.trim();
      
      if (!question) {
        rl.prompt();
        return;
      }
      
      if (question === 'exit' || question === 'quit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }
      
      if (question === 'help') {
        console.log('\n**Available commands:**');
        console.log('  - Ask questions about agents: "What agents are available?"');
        console.log('  - Ask about functions: "How do I use r5rs:church-add?"');
        console.log('  - Ask about rules: "What are the MUST requirements?"');
        console.log('  - Ask follow-up questions: "Tell me more about that"');
        console.log('  - history: Show conversation history');
        console.log('  - clear: Clear conversation history');
        console.log('  - new: Start new conversation');
        console.log('  - exit/quit: Exit the interface\n');
        rl.prompt();
        return;
      }
      
      if (question === 'history') {
        const history = this.getHistory();
        if (history.length === 0) {
          console.log('No history yet.\n');
        } else {
          console.log('\n**Conversation History:**\n');
          history.forEach((turn, i) => {
            console.log(`${i + 1}. Q: ${turn.userInput}`);
            const answer = turn.mergedResponse || 'No response';
            console.log(`   A: ${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}\n`);
          });
        }
        rl.prompt();
        return;
      }
      
      if (question === 'clear') {
        this.clearHistory();
        console.log('History cleared.\n');
        rl.prompt();
        return;
      }

      if (question === 'new') {
        const newId = this.createNewConversation();
        console.log(`New conversation started: ${newId}\n`);
        rl.prompt();
        return;
      }
      
      // Process question
      try {
        const response = await this.ask(question);
        console.log(`\n${response.answer}\n`);
        
        if (response.followUpSuggestions.length > 0) {
          console.log('**Related questions you might ask:**\n');
          response.followUpSuggestions.forEach((suggestion, i) => {
            console.log(`${i + 1}. ${suggestion}`);
          });
          console.log('');
        }
      } catch (error) {
        console.error(`\n❌ Error: ${error}\n`);
      }
      
      rl.prompt();
    });
    
    rl.on('close', () => {
      process.exit(0);
    });
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const knowledgeBasePath = args[0] || './knowledge-base.jsonl';
  
  // Load knowledge base
  const knowledgeBase = new KnowledgeBaseManager();
  
  if (fs.existsSync(knowledgeBasePath)) {
    try {
      const jsonl = fs.readFileSync(knowledgeBasePath, 'utf-8');
      knowledgeBase.loadFromJSONL(jsonl);
      console.log(`✅ Loaded knowledge base from: ${knowledgeBasePath}`);
      console.log(`   Facts: ${knowledgeBase['knowledgeBase'].facts.length}`);
      console.log(`   Rules: ${knowledgeBase['knowledgeBase'].rules.length}`);
      console.log(`   Agents: ${knowledgeBase['knowledgeBase'].agents.length}`);
      console.log(`   Functions: ${knowledgeBase['knowledgeBase'].functions.length}\n`);
    } catch (error) {
      console.error(`❌ Failed to load knowledge base: ${error}`);
      process.exit(1);
    }
  } else {
    console.warn(`⚠️  Knowledge base not found: ${knowledgeBasePath}`);
    console.warn('   Run extract-docs.ts first to generate knowledge base.\n');
  }
  
  // Create enhanced conversation interface
  const conversation = new EnhancedConversationInterface(knowledgeBase);
  
  // Start interactive mode
  await conversation.interactiveMode();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
