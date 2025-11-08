#!/usr/bin/env tsx
/**
 * Conversation Interface
 * 
 * Interactive conversation interface for natural language queries
 * about system knowledge
 */

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseManager } from '../document-knowledge-extractor/knowledge-base';
import { NLQueryEngine, QueryResult } from './nl-query-engine';

export interface ConversationContext {
  history: Array<{ question: string; answer: string; timestamp: string }>;
  currentTopic?: string;
  followUpQuestions?: string[];
}

/**
 * Conversation Interface
 */
export class ConversationInterface {
  private knowledgeBase: KnowledgeBaseManager;
  private queryEngine: NLQueryEngine;
  private context: ConversationContext;

  constructor(knowledgeBase: KnowledgeBaseManager) {
    this.knowledgeBase = knowledgeBase;
    this.queryEngine = new NLQueryEngine(knowledgeBase);
    this.context = {
      history: []
    };
  }

  /**
   * Ask a question
   */
  ask(question: string): string {
    // Query knowledge base
    const result = this.queryEngine.query(question);
    
    // Update context
    this.context.history.push({
      question,
      answer: result.answer,
      timestamp: new Date().toISOString()
    });
    
    // Generate follow-up questions
    const followUps = this.generateFollowUpQuestions(result);
    this.context.followUpQuestions = followUps;
    
    // Format response with follow-ups
    let response = result.answer;
    
    if (followUps.length > 0 && result.confidence > 0.5) {
      response += '\n\n**Related questions you might ask:**\n';
      followUps.forEach((q, i) => {
        response += `${i + 1}. ${q}\n`;
      });
    }
    
    return response;
  }

  /**
   * Generate follow-up questions based on query result
   */
  private generateFollowUpQuestions(result: QueryResult): string[] {
    const followUps: string[] = [];
    
    switch (result.intent.type) {
      case 'agent':
        if (result.results.length === 1) {
          const agent = result.results[0] as any;
          if (agent.dependencies && agent.dependencies.length > 0) {
            followUps.push(`What are the dependencies of ${agent.name}?`);
          }
          if (agent.capabilities && agent.capabilities.length > 0) {
            followUps.push(`What are the capabilities of ${agent.name}?`);
          }
          followUps.push(`What rules apply to ${agent.name}?`);
        }
        break;
      
      case 'function':
        if (result.results.length === 1) {
          const func = result.results[0] as any;
          followUps.push(`Show me examples of using ${func.name}`);
          followUps.push(`What agents use ${func.name}?`);
        }
        break;
      
      case 'rule':
        followUps.push('What are all the MUST requirements?');
        followUps.push('What are all the SHOULD requirements?');
        break;
      
      case 'example':
        followUps.push('Show me more examples');
        break;
    }
    
    return followUps.slice(0, 3); // Limit to 3 follow-ups
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationContext['history'] {
    return this.context.history;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.context.history = [];
    this.context.currentTopic = undefined;
    this.context.followUpQuestions = [];
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
    
    console.log('🤖 Natural Language Query Interface');
    console.log('Ask questions about agents, functions, rules, and examples.');
    console.log('Type "exit" or "quit" to exit, "help" for help, "history" to see history.\n');
    
    rl.prompt();
    
    rl.on('line', (input: string) => {
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
        console.log('  - Ask for examples: "Show me an example"');
        console.log('  - history: Show conversation history');
        console.log('  - clear: Clear conversation history');
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
          history.forEach((entry, i) => {
            console.log(`${i + 1}. Q: ${entry.question}`);
            console.log(`   A: ${entry.answer.substring(0, 200)}${entry.answer.length > 200 ? '...' : ''}\n`);
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
      
      // Process question
      try {
        const answer = this.ask(question);
        console.log(`\n${answer}\n`);
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
    } catch (error) {
      console.error(`❌ Failed to load knowledge base: ${error}`);
      process.exit(1);
    }
  } else {
    console.warn(`⚠️  Knowledge base not found: ${knowledgeBasePath}`);
    console.warn('   Run extract-docs.ts first to generate knowledge base.\n');
  }
  
  // Create conversation interface
  const conversation = new ConversationInterface(knowledgeBase);
  
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
