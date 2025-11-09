#!/usr/bin/env tsx
/**
 * CLI Script for Document Knowledge Extraction
 * 
 * Usage:
 *   tsx extract-docs.ts [docs-path] [output-path]
 * 
 * Examples:
 *   tsx extract-docs.ts ./docs ./knowledge-base.jsonl
 *   tsx extract-docs.ts ./docs
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentKnowledgeExtractor } from './document-knowledge-extractor';

async function main() {
  const args = process.argv.slice(2);
  const docsPath = args[0] || './docs';
  const outputPath = args[1] || './knowledge-base.jsonl';
  
  console.log('📚 Document Knowledge Extractor');
  console.log(`   Docs path: ${docsPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log('');
  
  // Check if docs path exists
  if (!fs.existsSync(docsPath)) {
    console.error(`❌ Error: Docs path does not exist: ${docsPath}`);
    process.exit(1);
  }
  
  // Create extractor
  const extractor = new DocumentKnowledgeExtractor(docsPath);
  
  // Extract knowledge
  await extractor.extractAll();
  
  // Get knowledge base
  const knowledgeBase = extractor.getKnowledgeBase();
  
  // Export to JSONL
  const jsonl = knowledgeBase.exportToJSONL();
  
  // Write to file
  fs.writeFileSync(outputPath, jsonl, 'utf-8');
  
  console.log('');
  console.log(`✅ Knowledge base exported to: ${outputPath}`);
  console.log('');
  
  // Print summary
  const kb = knowledgeBase.getKnowledgeBase();
  console.log('📊 Summary:');
  console.log(`   Facts: ${kb.facts.length}`);
  console.log(`   Rules: ${kb.rules.length}`);
  console.log(`   Agents: ${kb.agents.length}`);
  console.log(`   Functions: ${kb.functions.length}`);
  console.log(`   Relationships: ${kb.relationships.length}`);
  console.log(`   Sources: ${kb.metadata.sources.length} documents`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
