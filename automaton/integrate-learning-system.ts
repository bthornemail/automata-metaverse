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
import { KnowledgeBaseStorage } from './evolutions/document-knowledge-extractor/knowledge-base';
import { NLQueryEngine } from './evolutions/natural-language-query/nl-query-engine';
import { ConversationInterface } from './evolutions/natural-language-query/conversation-interface';
import { generateVariant, VARIANT_CONFIGS } from './generate-variant-automaton-files';
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
    const result = await extractor.extractKnowledge();
    
    const knowledgeBase: KnowledgeBaseStorage['knowledgeBase'] = {
      facts: result.facts,
      rules: result.rules,
      agents: result.agents,
      functions: result.functions,
      codeExamples: result.codeExamples,
      metadata: {
        version: '1.0',
        generated: new Date().toISOString(),
        source: docsPath
      }
    };
    
    const storage = new KnowledgeBaseStorage(knowledgeBase);
    storage.saveToFile(knowledgeBasePath);
    console.log(`   ✅ Knowledge base created: ${knowledgeBasePath}`);
  } else {
    console.log(`   ✅ Knowledge base already exists: ${knowledgeBasePath}`);
  }
  
  // Step 2: Generate variant-specific automaton files
  console.log('\n🔨 Step 2: Generating variant-specific automaton files...\n');
  
  for (const config of VARIANT_CONFIGS) {
    try {
      await generateVariant(config);
    } catch (error) {
      console.warn(`   ⚠️  Failed to generate ${config.name}: ${error}`);
    }
  }
  
  console.log('\n   ✅ Variant files generated');
  
  // Step 3: Show knowledge base statistics
  console.log('\n📊 Step 3: Knowledge Base Statistics\n');
  
  const knowledgeBase = KnowledgeBaseStorage.loadFromFile(knowledgeBasePath);
  const stats = knowledgeBase.getStatistics();
  
  console.log(`   Total Facts: ${stats.totalFacts}`);
  console.log(`   Total Rules: ${stats.totalRules}`);
  console.log(`   Total Agents: ${stats.totalAgents}`);
  console.log(`   Total Functions: ${stats.totalFunctions}`);
  console.log(`   Total Examples: ${stats.totalExamples}`);
  console.log(`   Rules by Keyword:`, stats.rulesByKeyword);
  console.log(`   Agents by Dimension:`, stats.agentsByDimension);
  
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
    
    const knowledgeBase = KnowledgeBaseStorage.loadFromFile(knowledgeBasePath);
    const queryEngine = new NLQueryEngine(knowledgeBase);
    const conversation = new ConversationInterface(queryEngine);
    
    conversation.start().catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
  } else {
    // Run full integration
    integrateSystems().catch(error => {
      console.error('❌ Integration error:', error);
      process.exit(1);
    });
  }
}

export { integrateSystems };
