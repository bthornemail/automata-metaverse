#!/usr/bin/env tsx
/**
 * Integration Script: Learning Patterns, Document Knowledge, and NL Queries
 * 
 * Integrates all systems:
 * 1. Extract knowledge from documentation
 * 2. Generate variant-specific automaton files
 * 3. Enable learning automaton for pattern tracking
 * 4. Provide natural language query interface
 */

import { DocumentKnowledgeExtractor } from './evolutions/document-knowledge-extractor/document-knowledge-extractor';
import { KnowledgeBaseManager } from './evolutions/document-knowledge-extractor/knowledge-base';
import { NLQueryEngine } from './evolutions/natural-language-query/nl-query-engine';
import { ConversationInterface } from './evolutions/natural-language-query/conversation-interface';
// Note: generate-variant-automaton-files.ts doesn't export generateVariant or VARIANT_CONFIGS
// This import is commented out - the file can be run directly instead
// import * as variantGenerator from './generate-variant-automaton-files';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration workflow
 */
async function integrateSystems(): Promise<void> {
  console.log('🚀 Learning System Integration\n');
  
  const docsPath = path.join(process.cwd(), 'docs');
  const knowledgeBasePath = path.join(process.cwd(), 'knowledge-base.jsonl');
  
  // Step 1: Extract knowledge from documentation
  console.log('📚 Step 1: Extracting knowledge from documentation...\n');
  
  if (!fs.existsSync(knowledgeBasePath)) {
    console.log('   Knowledge base not found, extracting from docs...');
    const extractor = new DocumentKnowledgeExtractor(docsPath);
    await extractor.extractAll();
    const knowledgeBase = extractor.getKnowledgeBase();
    
    // Save to JSONL file
    const jsonl = knowledgeBase.exportToJSONL();
    fs.writeFileSync(knowledgeBasePath, jsonl);
    console.log(`   ✅ Knowledge base created: ${knowledgeBasePath}`);
  } else {
    console.log(`   ✅ Knowledge base already exists: ${knowledgeBasePath}`);
  }
  
  // Step 2: Generate variant-specific automaton files
  console.log('\n🔨 Step 2: Generating variant-specific automaton files...\n');
  console.log('   Note: Run generate-variant-automaton-files.ts separately to generate variants');
  console.log('   Command: tsx generate-variant-automaton-files.ts');
  console.log('\n   ✅ Variant generation skipped (run separately)');
  
  // Step 3: Show knowledge base statistics
  console.log('\n📊 Step 3: Knowledge Base Statistics\n');
  
    const jsonl = fs.readFileSync(knowledgeBasePath, 'utf-8');
    const knowledgeBase = new KnowledgeBaseManager();
    knowledgeBase.loadFromJSONL(jsonl);
    const kb = knowledgeBase.getKnowledgeBase();
  
    console.log(`   Total Facts: ${kb.facts.length}`);
    console.log(`   Total Rules: ${kb.rules.length}`);
    console.log(`   Total Agents: ${kb.agents.length}`);
    console.log(`   Total Functions: ${kb.functions.length}`);
    const examples = kb.facts.filter(f => f.type === 'example');
    console.log(`   Total Examples: ${examples.length}`);
    
    // Calculate rules by keyword
    const rulesByKeyword: Record<string, number> = {};
    kb.rules.forEach(r => {
      rulesByKeyword[r.rfc2119Keyword] = (rulesByKeyword[r.rfc2119Keyword] || 0) + 1;
    });
    console.log(`   Rules by Keyword:`, rulesByKeyword);
    
    // Calculate agents by dimension
    const agentsByDimension: Record<string, number> = {};
    kb.agents.forEach(a => {
      const dim = a.dimension || 'no-dimension';
      agentsByDimension[dim] = (agentsByDimension[dim] || 0) + 1;
    });
    console.log(`   Agents by Dimension:`, agentsByDimension);
  
  // Step 4: Demonstrate NL query
  console.log('\n💬 Step 4: Natural Language Query Demo\n');
  
  const queryEngine = new NLQueryEngine(knowledgeBase);
  
  const demoQueries = [
    'What agents are available?',
    'What is the 5D-Consensus-Agent?',
    'How do I use r5rs:church-add?',
    'What are the requirements for SHACL validation?'
  ];
  
  for (const query of demoQueries) {
    console.log(`Q: ${query}`);
    const response = await queryEngine.query(query);
    console.log(`A: ${response.answer.substring(0, 200)}${response.answer.length > 200 ? '...' : ''}`);
    console.log('');
  }
  
  console.log('✅ Integration complete!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Run variants with learning automaton to track patterns');
  console.log('   2. Use NL query interface: tsx evolutions/natural-language-query/conversation-interface.ts');
  console.log('   3. Generate variant files: tsx generate-variant-automaton-files.ts');
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'query' || command === 'chat') {
    // Start interactive NL query interface
    const knowledgeBasePath = process.argv[3] || 'knowledge-base.jsonl';
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error(`❌ Knowledge base not found: ${knowledgeBasePath}`);
      console.error('Please run integration first: tsx integrate-learning-system.ts');
      process.exit(1);
    }
    
    const jsonl = fs.readFileSync(knowledgeBasePath, 'utf-8');
    const knowledgeBase = new KnowledgeBaseManager();
    knowledgeBase.loadFromJSONL(jsonl);
    const queryEngine = new NLQueryEngine(knowledgeBase);
    const conversation = new ConversationInterface(knowledgeBase);
    
    // Start interactive conversation
    console.log('💬 Interactive Conversation Interface');
    console.log('Type your questions (or "exit" to quit)\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askQuestion = () => {
      rl.question('Q: ', (question: string) => {
        if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
          rl.close();
          return;
        }
        
        const answer = conversation.ask(question);
        console.log(`A: ${answer}\n`);
        askQuestion();
      });
    };
    
    askQuestion();
  } else {
    // Run full integration
    integrateSystems().catch((error: any) => {
      console.error('❌ Integration error:', error);
      process.exit(1);
    });
  }
}

export { integrateSystems };
