#!/usr/bin/env tsx
/**
 * Generate Variant-Specific Automaton Files
 * 
 * Generates unique automaton.canvasl files for each variant with:
 * - Variant-specific modifications
 * - Learned patterns for that variant
 * - Variant-specific facts/rules from docs
 * 
 * Usage:
 *   tsx generate-variant-automaton-files.ts [base-template] [knowledge-base]
 */

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseManager } from './evolutions/document-knowledge-extractor/knowledge-base';
import { PatternTracker } from './evolutions/learning-automaton/pattern-tracker';

interface VariantConfig {
  name: string;
  directory: string;
  focus: string[];
  patterns: string[];
  customizations: Record<string, any>;
}

const VARIANTS: VariantConfig[] = [
  {
    name: 'advanced-automaton',
    directory: 'evolutions/advanced-automaton',
    focus: ['Church encoding', 'mathematical foundations', 'Y-combinator'],
    patterns: ['church-zero', 'church-succ', 'church-add', 'y-combinator'],
    customizations: {
      dimensionFocus: [0, 1, 2, 3],
      emphasis: 'mathematical-precision'
    }
  },
  {
    name: 'automaton-runner',
    directory: 'evolutions/automaton-runner',
    focus: ['execution', 'basic operations', 'demonstration'],
    patterns: ['basic-execution', 'state-transitions'],
    customizations: {
      dimensionFocus: [0, 1, 2],
      emphasis: 'simplicity'
    }
  },
  {
    name: 'automaton-memory-optimized',
    directory: 'evolutions/automaton-memory-optimized',
    focus: ['memory efficiency', 'GC optimization', 'object trimming'],
    patterns: ['memory-efficient', 'gc-triggers', 'object-trimming'],
    customizations: {
      dimensionFocus: [0, 1, 2],
      emphasis: 'memory-optimization',
      maxObjects: 2000,
      gcInterval: 5000
    }
  },
  {
    name: 'automaton-evolved',
    directory: 'evolutions/automaton-evolved',
    focus: ['evolution', 'self-modification', 'adaptation'],
    patterns: ['evolution-patterns', 'self-modification', 'adaptation'],
    customizations: {
      dimensionFocus: [0, 1, 2, 3, 4, 5, 6, 7],
      emphasis: 'evolution'
    }
  },
  {
    name: 'automaton-scalable',
    directory: 'evolutions/automaton-scalable',
    focus: ['scalability', 'parallel processing', 'worker threads'],
    patterns: ['parallel-execution', 'worker-threads', 'scaling'],
    customizations: {
      dimensionFocus: [0, 1, 2, 3, 4],
      emphasis: 'scalability',
      maxWorkers: 4
    }
  },
  {
    name: 'continuous-automaton',
    directory: 'evolutions/continuous-automaton',
    focus: ['continuous execution', 'built-in intelligence', 'long-running'],
    patterns: ['continuous-execution', 'built-in-intelligence'],
    customizations: {
      dimensionFocus: [0, 1, 2, 3, 4, 5],
      emphasis: 'continuous'
    }
  },
  {
    name: 'ollama-automaton',
    directory: 'evolutions/ollama-automaton',
    focus: ['AI-powered', 'Ollama integration', 'intelligent decisions'],
    patterns: ['ai-powered', 'ollama-integration', 'intelligent-decisions'],
    customizations: {
      dimensionFocus: [0, 1, 2, 3, 4, 5, 6],
      emphasis: 'ai-powered',
      ollamaModel: 'llama3.2:latest'
    }
  }
];

/**
 * Generate variant-specific automaton file
 */
function generateVariantFile(
  variant: VariantConfig,
  baseTemplate: string,
  knowledgeBase?: KnowledgeBaseManager,
  learnedPatterns?: PatternTracker
): string {
  const lines: string[] = [];
  
  // Parse base template
  const templateLines = baseTemplate.split('\n');
  const directives: string[] = [];
  const jsonlEntries: string[] = [];
  
  let inDirectives = true;
  for (const line of templateLines) {
    if (line.trim().startsWith('@')) {
      directives.push(line);
    } else if (line.trim().startsWith('{')) {
      inDirectives = false;
      jsonlEntries.push(line);
    } else if (!inDirectives && line.trim()) {
      jsonlEntries.push(line);
    }
  }
  
  // Update directives with variant info
  const variantDirectives = directives.map(dir => {
    if (dir.includes('@variant:')) {
      return `@variant: ${variant.name}`;
    }
    if (dir.includes('@generated:')) {
      return `@generated: ${new Date().toISOString()}`;
    }
    return dir;
  });
  
  // Add variant-specific directive if not present
  if (!variantDirectives.some(d => d.includes('@variant:'))) {
    variantDirectives.push(`@variant: ${variant.name}`);
  }
  
  // Add variant-specific metadata directive
  variantDirectives.push(`@variant-focus: ${variant.focus.join(', ')}`);
  variantDirectives.push(`@variant-emphasis: ${variant.customizations.emphasis}`);
  
  // Process JSONL entries with variant customizations
  const variantEntries = jsonlEntries.map(entry => {
    try {
      const obj = JSON.parse(entry);
      
      // Add variant-specific metadata
      if (!obj.metadata) {
        obj.metadata = {};
      }
      obj.metadata.variant = variant.name;
      obj.metadata.variantFocus = variant.focus;
      
      // Customize based on variant
      if (variant.customizations.dimensionFocus) {
        // Filter or emphasize dimensions
        if (obj.dimensionalLevel !== undefined) {
          const dim = obj.dimensionalLevel;
          if (!variant.customizations.dimensionFocus.includes(dim)) {
            // Keep but mark as secondary
            obj.metadata.secondary = true;
          }
        }
      }
      
      // Add learned patterns if available
      if (learnedPatterns && obj.type === 'automaton') {
        const dim = obj.dimensionalLevel || 0;
        const bestPatterns = learnedPatterns.getBestPatterns(dim, 1);
        if (bestPatterns.length > 0) {
          obj.metadata.learnedPattern = bestPatterns[0].pattern.id;
          obj.metadata.patternConfidence = bestPatterns[0].confidence;
        }
      }
      
      // Add knowledge base facts if available
      if (knowledgeBase && obj.type === 'text') {
        const facts = knowledgeBase.queryFacts('definition');
        const relevantFacts = facts.filter(f => 
          variant.focus.some(focus => 
            f.content.toLowerCase().includes(focus.toLowerCase())
          )
        );
        if (relevantFacts.length > 0) {
          obj.metadata.relevantFacts = relevantFacts.slice(0, 3).map(f => f.id);
        }
      }
      
      return JSON.stringify(obj);
    } catch {
      return entry; // Keep non-JSON lines as-is
    }
  });
  
  // Add variant-specific entries
  const variantSpecificEntries: string[] = [];
  
  // Add variant info node
  variantSpecificEntries.push(JSON.stringify({
    id: `${variant.name}-info`,
    type: 'text',
    x: 1000,
    y: 0,
    width: 300,
    height: 150,
    color: '4',
    text: `# ${variant.name}\n\n**Variant Focus:**\n${variant.focus.map(f => `- ${f}`).join('\n')}\n\n**Emphasis:** ${variant.customizations.emphasis}`,
    metadata: {
      variant: variant.name,
      generated: true
    }
  }));
  
  // Add learned patterns if available
  if (learnedPatterns) {
    for (let dim = 0; dim <= 7; dim++) {
      const bestPatterns = learnedPatterns.getBestPatterns(dim, 1);
      if (bestPatterns.length > 0 && variant.customizations.dimensionFocus?.includes(dim)) {
        const pattern = bestPatterns[0].pattern;
        variantSpecificEntries.push(JSON.stringify({
          id: `${variant.name}-pattern-${dim}D`,
          type: 'text',
          x: 1000 + dim * 50,
          y: 200,
          width: 250,
          height: 120,
          color: '5',
          text: `# Learned Pattern (${dim}D)\n\n**Type:** ${pattern.patternType}\n**Success Rate:** ${((pattern.successCount / (pattern.successCount + pattern.failureCount)) * 100).toFixed(1)}%\n**Confidence:** ${(bestPatterns[0].confidence * 100).toFixed(1)}%`,
          metadata: {
            patternId: pattern.id,
            dimension: dim,
            variant: variant.name
          }
        }));
      }
    }
  }
  
  // Combine all entries
  lines.push(...variantDirectives);
  lines.push(''); // Empty line between directives and JSONL
  lines.push(...variantEntries);
  lines.push(...variantSpecificEntries);
  
  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const baseTemplatePath = args[0] || 'automaton.fast.canvasl';
  const knowledgeBasePath = args[1] || './knowledge-base.jsonl';
  
  console.log('🔧 Generating Variant-Specific Automaton Files');
  console.log(`   Base template: ${baseTemplatePath}`);
  console.log(`   Knowledge base: ${knowledgeBasePath}`);
  console.log('');
  
  // Load base template
  if (!fs.existsSync(baseTemplatePath)) {
    console.error(`❌ Error: Base template not found: ${baseTemplatePath}`);
    process.exit(1);
  }
  
  const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf-8');
  console.log(`✅ Loaded base template: ${baseTemplatePath}`);
  
  // Load knowledge base if available
  let knowledgeBase: KnowledgeBaseManager | undefined;
  if (fs.existsSync(knowledgeBasePath)) {
    try {
      knowledgeBase = new KnowledgeBaseManager();
      const jsonl = fs.readFileSync(knowledgeBasePath, 'utf-8');
      knowledgeBase.loadFromJSONL(jsonl);
      console.log(`✅ Loaded knowledge base: ${knowledgeBasePath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to load knowledge base: ${error}`);
    }
  } else {
    console.warn(`⚠️  Knowledge base not found: ${knowledgeBasePath}`);
    console.warn('   Run extract-docs.ts first to generate knowledge base.');
  }
  
  // Load learned patterns if available
  let learnedPatterns: PatternTracker | undefined;
  for (const variant of VARIANTS) {
    const patternFile = path.join(variant.directory, 'learned-patterns.jsonl');
    if (fs.existsSync(patternFile)) {
      try {
        if (!learnedPatterns) {
          learnedPatterns = new PatternTracker();
        }
        const jsonl = fs.readFileSync(patternFile, 'utf-8');
        learnedPatterns.loadFromJSONL(jsonl);
        console.log(`✅ Loaded learned patterns from: ${patternFile}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load patterns from ${patternFile}: ${error}`);
      }
    }
  }
  
  console.log('');
  
  // Generate files for each variant
  for (const variant of VARIANTS) {
    const outputPath = path.join(variant.directory, 'automaton.canvasl');
    
    try {
      // Ensure directory exists
      if (!fs.existsSync(variant.directory)) {
        fs.mkdirSync(variant.directory, { recursive: true });
      }
      
      // Generate variant file
      const variantContent = generateVariantFile(
        variant,
        baseTemplate,
        knowledgeBase,
        learnedPatterns
      );
      
      // Write file
      fs.writeFileSync(outputPath, variantContent, 'utf-8');
      console.log(`✅ Generated: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate ${outputPath}:`, error);
    }
  }
  
  console.log('');
  console.log('✅ Variant file generation complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
