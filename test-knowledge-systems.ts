#!/usr/bin/env tsx
/**
 * Test Knowledge Systems
 * 
 * Tests document knowledge extraction, NL queries, and compares with known knowledge
 */

import * as fs from 'fs';
import { KnowledgeBaseManager } from './evolutions/document-knowledge-extractor/knowledge-base';
import { NLQueryEngine } from './evolutions/natural-language-query/nl-query-engine';

async function main() {
  console.log('🧪 Testing Knowledge Systems\n');
  
  // Load knowledge base
  const knowledgeBasePath = './knowledge-base-test.jsonl';
  if (!fs.existsSync(knowledgeBasePath)) {
    console.error(`❌ Knowledge base not found: ${knowledgeBasePath}`);
    console.error('   Run: tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base-test.jsonl');
    process.exit(1);
  }
  
  const knowledgeBase = new KnowledgeBaseManager();
  const jsonl = fs.readFileSync(knowledgeBasePath, 'utf-8');
  knowledgeBase.loadFromJSONL(jsonl);
  
  const kb = knowledgeBase.getKnowledgeBase();
  console.log('📊 Knowledge Base Statistics:');
  console.log(`   Facts: ${kb.facts.length}`);
  console.log(`   Rules: ${kb.rules.length}`);
  console.log(`   Agents: ${kb.agents.length}`);
  console.log(`   Functions: ${kb.functions.length}`);
  console.log(`   Relationships: ${kb.relationships.length}\n`);
  
  // Test NL Query Engine
  console.log('🔍 Testing Natural Language Query Engine\n');
  const queryEngine = new NLQueryEngine(knowledgeBase);
  
  // Test queries
  const testQueries = [
    'What agents are available?',
    'What is the 5D-Consensus-Agent?',
    'What are the MUST requirements?',
    'How do I use r5rs:church-add?',
    'What rules apply to SHACL validation?'
  ];
  
  for (const query of testQueries) {
    console.log(`❓ Query: "${query}"`);
    const result = queryEngine.query(query);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Results: ${result.results.length}`);
    if (result.results.length > 0) {
      const preview = result.answer.substring(0, 200);
      console.log(`   Answer: ${preview}${result.answer.length > 200 ? '...' : ''}`);
    }
    console.log('');
  }
  
  // Compare with known knowledge from AGENTS.md
  console.log('📚 Comparing with Known Knowledge from AGENTS.md\n');
  
  // Expected agents from AGENTS.md
  const expectedAgents = [
    '0D-Topology-Agent',
    '1D-Temporal-Agent',
    '2D-Structural-Agent',
    '3D-Algebraic-Agent',
    '4D-Network-Agent',
    '5D-Consensus-Agent',
    '6D-Intelligence-Agent',
    '7D-Quantum-Agent',
    'Query-Interface-Agent',
    'Visualization-Agent',
    'Multiplayer-Agent',
    'AI-Assist-Agent',
    'Self-Modification-Agent',
    'Goal-Oriented-Agent',
    'OpenCode-Integration-Agent'
  ];
  
  console.log('Expected Agents (from AGENTS.md):');
  expectedAgents.forEach(agent => console.log(`   - ${agent}`));
  console.log('');
  
  console.log('Extracted Agents:');
  kb.agents.forEach((agent: any) => {
    console.log(`   - ${agent.name} (${agent.dimension || 'no dimension'})`);
  });
  console.log('');
  
  // Check coverage
  const extractedAgentNames = kb.agents.map((a: any) => a.name);
  const foundAgents = expectedAgents.filter((name: string) => 
    extractedAgentNames.some((extracted: string) => 
      extracted.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(extracted.toLowerCase())
    )
  );
  
  console.log(`✅ Coverage: ${foundAgents.length}/${expectedAgents.length} agents found`);
  console.log(`   Missing: ${expectedAgents.filter((a: string) => !foundAgents.includes(a)).join(', ')}\n`);
  
  // Test RFC2119 rules
  console.log('📋 Testing RFC2119 Rule Extraction\n');
  const mustRules = knowledgeBase.queryRules('MUST');
  const shouldRules = knowledgeBase.queryRules('SHOULD');
  const mayRules = knowledgeBase.queryRules('MAY');
  
  console.log(`   MUST rules: ${mustRules.length}`);
  console.log(`   SHOULD rules: ${shouldRules.length}`);
  console.log(`   MAY rules: ${mayRules.length}\n`);
  
  if (mustRules.length > 0) {
    console.log('Sample MUST rules:');
    mustRules.slice(0, 3).forEach((rule: any) => {
      console.log(`   - ${rule.statement.substring(0, 100)}...`);
      console.log(`     Source: ${rule.source}`);
    });
    console.log('');
  }
  
  // Test function extraction
  console.log('🔧 Testing Function Extraction\n');
  const r5rsFunctions = kb.functions.filter((f: any) => f.name.startsWith('r5rs:'));
  console.log(`   R5RS functions found: ${r5rsFunctions.length}`);
  
  const expectedFunctions = [
    'r5rs:church-add',
    'r5rs:church-mult',
    'r5rs:church-exp',
    'r5rs:parse-jsonl-canvas',
    'r5rs:sparql-query',
    'r5rs:prolog-query'
  ];
  
  console.log('Expected R5RS functions:');
  expectedFunctions.forEach((func: string) => console.log(`   - ${func}`));
  console.log('');
  
  console.log('Extracted R5RS functions (sample):');
  r5rsFunctions.slice(0, 10).forEach((func: any) => {
    console.log(`   - ${func.name}`);
  });
  console.log('');
  
  const foundFunctions = expectedFunctions.filter((name: string) =>
    r5rsFunctions.some((f: any) => f.name === name)
  );
  console.log(`✅ Coverage: ${foundFunctions.length}/${expectedFunctions.length} functions found`);
  
  console.log('\n✅ Testing complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
