#!/usr/bin/env tsx
/**
 * Generate Evolution Variants
 * Creates optimized automaton variants using Meta-Log-Db snapshots
 */

import * as fs from 'fs';
import * as path from 'path';
import { MetaLogDb } from '../meta-log-db/src/database.js';

interface VariantConfig {
  name: string;
  maxObjects: number;
  maxHistory: number;
  optimizations: {
    tokenOptimization?: boolean;
    contextOptimization?: boolean;
    r5rsOptimization?: boolean;
    simplifiedPatterns?: boolean;
    reducedValidation?: boolean;
    batchProcessing?: boolean;
    functionCalling?: boolean;
  };
}

const VARIANTS: Record<string, VariantConfig> = {
  'llama3.2': {
    name: 'llama3.2:latest',
    maxObjects: 1000,
    maxHistory: 200,
    optimizations: {
      tokenOptimization: true,
      batchProcessing: true,
      simplifiedPatterns: true,
    },
  },
  'gpt-oss': {
    name: 'gpt-oss:20b',
    maxObjects: 2000,
    maxHistory: 500,
    optimizations: {
      contextOptimization: true,
      functionCalling: true,
    },
  },
  'native': {
    name: 'native',
    maxObjects: Infinity,
    maxHistory: Infinity,
    optimizations: {
      r5rsOptimization: true,
    },
  },
  'fast': {
    name: 'fast',
    maxObjects: 500,
    maxHistory: 100,
    optimizations: {
      simplifiedPatterns: true,
      reducedValidation: true,
    },
  },
};

async function loadSnapshots(snapshotDir: string): Promise<any[]> {
  if (!fs.existsSync(snapshotDir)) {
    console.warn(`Snapshot directory not found: ${snapshotDir}`);
    return [];
  }

  const files = fs.readdirSync(snapshotDir)
    .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
    .sort();

  const snapshots = files.map(file => {
    const content = fs.readFileSync(path.join(snapshotDir, file), 'utf-8');
    return JSON.parse(content);
  });

  return snapshots;
}

async function analyzeEvolution(snapshots: any[]): Promise<any> {
  if (snapshots.length < 2) {
    return {
      objectGrowth: 0,
      memoryGrowth: 0,
      averageObjects: 0,
      averageMemory: 0,
      pressureDistribution: {},
    };
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const totalTime = (last.timestamp - first.timestamp) / 1000;

  const objectGrowth = last.automatonState.objectCount - first.automatonState.objectCount;
  const memoryGrowth = (last.memory.heapUsed - first.memory.heapUsed) / 1024 / 1024;

  const averageObjects = snapshots.reduce((sum, s) => sum + s.automatonState.objectCount, 0) / snapshots.length;
  const averageMemory = snapshots.reduce((sum, s) => sum + s.memory.heapUsed, 0) / snapshots.length / 1024 / 1024;

  const pressureDistribution: Record<string, number> = {};
  snapshots.forEach(s => {
    const pressure = s.reasoning.memoryPressure;
    pressureDistribution[pressure] = (pressureDistribution[pressure] || 0) + 1;
  });

  return {
    objectGrowth,
    memoryGrowth,
    averageObjects,
    averageMemory,
    pressureDistribution,
    totalTime,
    snapshotCount: snapshots.length,
  };
}

function applyOptimizations(canvas: any, config: VariantConfig, analysis: any): any {
  const optimized = JSON.parse(JSON.stringify(canvas)); // Deep clone

  // Apply object limits
  if (config.maxObjects !== Infinity && optimized.nodes) {
    if (optimized.nodes.length > config.maxObjects) {
      // Keep most recent objects
      optimized.nodes = optimized.nodes.slice(-config.maxObjects);
      console.log(`   Trimmed nodes: ${canvas.nodes.length} → ${optimized.nodes.length}`);
    }
  }

  // Apply history limits (if stored in canvas)
  if (config.maxHistory !== Infinity && optimized.executionHistory) {
    if (optimized.executionHistory.length > config.maxHistory) {
      optimized.executionHistory = optimized.executionHistory.slice(-config.maxHistory);
      console.log(`   Trimmed history: ${canvas.executionHistory.length} → ${optimized.executionHistory.length}`);
    }
  }

  // Token optimization (for LLM variants)
  if (config.optimizations.tokenOptimization) {
    // Simplify object structure
    optimized.nodes = optimized.nodes.map((node: any) => {
      const simplified: any = {
        id: node.id,
        type: node.type,
      };
      if (node.text) simplified.text = node.text.substring(0, 200); // Truncate long text
      if (node.x !== undefined) simplified.x = node.x;
      if (node.y !== undefined) simplified.y = node.y;
      return simplified;
    });
    console.log(`   Applied token optimization`);
  }

  // Simplified patterns
  if (config.optimizations.simplifiedPatterns) {
    // Remove complex nested structures
    optimized.nodes = optimized.nodes.filter((node: any) => {
      return !node.complexPattern || node.complexPattern === false;
    });
    console.log(`   Applied simplified patterns`);
  }

  // Add variant metadata
  optimized._variant = {
    name: config.name,
    generated: new Date().toISOString(),
    source: 'evolution',
    analysis: {
      objectGrowth: analysis.objectGrowth,
      memoryGrowth: analysis.memoryGrowth,
      averageObjects: analysis.averageObjects,
      averageMemory: analysis.averageMemory,
    },
  };

  return optimized;
}

async function generateVariant(
  db: MetaLogDb,
  inputFile: string,
  config: VariantConfig,
  analysis: any,
  outputDir: string
): Promise<string> {
  console.log(`\n🔨 Generating variant: ${config.name}`);

  // Load base automaton
  const canvas = await db.parseCanvasL(inputFile);

  // Apply optimizations
  const optimized = applyOptimizations(canvas, config, analysis);

  // Generate CanvasL file
  const outputFile = path.join(outputDir, `automaton.${config.name}.canvasl`);

  // Write CanvasL format
  const lines: string[] = [];
  
  // Directives
  lines.push(`@version: 1.0`);
  lines.push(`@schema: automaton-evolution`);
  lines.push(`@r5rs-engine: meta-log-db`);
  lines.push(`@dimension: ${config.name}`);
  lines.push(`@variant: ${config.name}`);
  lines.push(`@generated: ${new Date().toISOString()}`);
  lines.push(``); // Blank line after directives

  // JSONL entries
  if (optimized.nodes) {
    optimized.nodes.forEach((node: any) => {
      lines.push(JSON.stringify(node));
    });
  }

  if (optimized.edges) {
    optimized.edges.forEach((edge: any) => {
      lines.push(JSON.stringify(edge));
    });
  }

  // Write file
  fs.writeFileSync(outputFile, lines.join('\n') + '\n');
  console.log(`   ✅ Generated: ${outputFile}`);

  return outputFile;
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let inputFile = 'automaton.jsonl';
  let snapshotDir = 'snapshots-memory';
  let variants = 'all';
  let outputDir = 'evolution-variants';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === '--snapshots' && args[i + 1]) {
      snapshotDir = args[i + 1];
      i++;
    } else if (args[i] === '--variants' && args[i + 1]) {
      variants = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    }
  }

  console.log('🚀 Evolution Variant Generator');
  console.log(`   Input: ${inputFile}`);
  console.log(`   Snapshots: ${snapshotDir}`);
  console.log(`   Variants: ${variants}`);
  console.log(`   Output: ${outputDir}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Initialize Meta-Log-Db
  const db = new MetaLogDb();

  // Load snapshots
  console.log('📊 Loading snapshots...');
  const snapshots = await loadSnapshots(snapshotDir);
  console.log(`   Loaded ${snapshots.length} snapshots`);

  // Analyze evolution
  console.log('\n📈 Analyzing evolution...');
  const analysis = await analyzeEvolution(snapshots);
  console.log(`   Object Growth: ${analysis.objectGrowth}`);
  console.log(`   Memory Growth: ${analysis.memoryGrowth.toFixed(2)}MB`);
  console.log(`   Average Objects: ${analysis.averageObjects.toFixed(0)}`);
  console.log(`   Average Memory: ${analysis.averageMemory.toFixed(2)}MB`);

  // Determine which variants to generate
  const variantKeys = variants === 'all' 
    ? Object.keys(VARIANTS)
    : variants.split(',').map(v => v.trim());

  // Generate variants
  const generated: string[] = [];
  for (const key of variantKeys) {
    if (!VARIANTS[key]) {
      console.warn(`   ⚠️  Unknown variant: ${key}`);
      continue;
    }

    const config = VARIANTS[key];
    const outputFile = await generateVariant(db, inputFile, config, analysis, outputDir);
    generated.push(outputFile);
  }

  console.log(`\n✅ Generated ${generated.length} variants:`);
  generated.forEach(file => console.log(`   - ${file}`));
}

if (require.main === module) {
  main().catch(console.error);
}

export { generateVariant, VARIANTS, VariantConfig };
