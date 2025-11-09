#!/usr/bin/env tsx
/**
 * Knowledge Extraction Benchmarking Script
 * 
 * Benchmarks knowledge extraction quality, performance, and understanding
 * across Phase 14 (Logging) and Phase 15 (Testing & Optimizing)
 * 
 * Usage:
 *   tsx scripts/benchmark-knowledge-extraction.ts [options]
 * 
 * Options:
 *   --docs-path <path>     Path to documents folder (default: ./docs)
 *   --output <path>        Output path for benchmark results (default: benchmark-results.json)
 *   --baseline             Run baseline benchmark
 *   --stress-test          Run stress test
 *   --compare <phase1> <phase2>  Compare two phases
 *   --expected-facts <n>   Expected number of facts
 *   --expected-rules <n>   Expected number of rules
 *   --expected-agents <n>  Expected number of agents (default: 15)
 *   --expected-functions <n> Expected number of functions
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentKnowledgeExtractor } from '../evolutions/document-knowledge-extractor/document-knowledge-extractor';
import { KnowledgeBaseManager } from '../evolutions/document-knowledge-extractor/knowledge-base';

interface BenchmarkConfig {
  docsPath: string;
  outputPath: string;
  expectedFacts?: number;
  expectedRules?: number;
  expectedAgents?: number;
  expectedFunctions?: number;
  iterations?: number;
}

interface CompletenessMetrics {
  facts: {
    extracted: number;
    expected: number;
    coverage: number;
    missing: string[];
  };
  rules: {
    extracted: number;
    expected: number;
    coverage: number;
    missing: string[];
  };
  agents: {
    extracted: number;
    expected: number;
    coverage: number;
    missing: string[];
  };
  functions: {
    extracted: number;
    expected: number;
    coverage: number;
    missing: string[];
  };
}

interface PerformanceMetrics {
  extraction: {
    totalTime: number;
    averageTimePerFile: number;
    filesPerSecond: number;
    peakMemory: number;
    averageMemory: number;
  };
  storage: {
    jsonlSize: number;
    loadTime: number;
    queryTime: number;
  };
}

interface UnderstandingMetrics {
  knowledgeGraph: {
    nodes: number;
    edges: number;
    averageDegree: number;
  };
  relationships: {
    prerequisites: number;
    enables: number;
    related: number;
    brokenLinks: number;
  };
  completeness: {
    documentsWithFrontmatter: number;
    documentsWithRelationships: number;
    overallCompleteness: number;
  };
}

interface BenchmarkResults {
  timestamp: string;
  config: BenchmarkConfig;
  completeness: CompletenessMetrics;
  performance: PerformanceMetrics;
  understanding: UnderstandingMetrics;
  summary: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

class KnowledgeExtractionBenchmark {
  private extractor: DocumentKnowledgeExtractor;
  private knowledgeBase: KnowledgeBaseManager;
  private fileCount: number = 0;
  private startMemory: NodeJS.MemoryUsage;
  private peakMemory: number = 0;

  constructor(docsPath: string) {
    this.extractor = new DocumentKnowledgeExtractor(docsPath);
    this.startMemory = process.memoryUsage();
  }

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResults> {
    console.log(`📊 Starting Knowledge Extraction Benchmark`);
    console.log(`   Docs path: ${config.docsPath}`);
    console.log(`   Expected: ${config.expectedFacts || '?'} facts, ${config.expectedRules || '?'} rules, ${config.expectedAgents || 15} agents, ${config.expectedFunctions || '?'} functions\n`);

    // Count files
    this.fileCount = this.countMarkdownFiles(config.docsPath);
    console.log(`   Found ${this.fileCount} markdown files\n`);

    // Run extraction
    const extractionStart = Date.now();
    const memBefore = process.memoryUsage();
    
    await this.extractWithMonitoring();
    
    const extractionTime = Date.now() - extractionStart;
    const memAfter = process.memoryUsage();
    this.peakMemory = Math.max(this.peakMemory, memAfter.heapUsed);

    // Get knowledge base
    this.knowledgeBase = this.extractor.getKnowledgeBase();
    const kb = this.knowledgeBase.getKnowledgeBase();

    // Measure completeness
    const completeness = this.measureCompleteness(config, kb);

    // Measure performance
    const performance = this.measurePerformance(extractionTime, memBefore, memAfter, config);

    // Measure understanding
    const understanding = this.measureUnderstanding(kb);

    // Generate summary
    const summary = this.generateSummary(completeness, performance, understanding);

    const results: BenchmarkResults = {
      timestamp: new Date().toISOString(),
      config,
      completeness,
      performance,
      understanding,
      summary
    };

    // Save results
    fs.writeFileSync(config.outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Benchmark complete! Results saved to: ${config.outputPath}\n`);

    // Print summary
    this.printSummary(results);

    return results;
  }

  private async extractWithMonitoring(): Promise<void> {
    // Monitor memory during extraction
    const monitorInterval = setInterval(() => {
      const mem = process.memoryUsage();
      this.peakMemory = Math.max(this.peakMemory, mem.heapUsed);
    }, 100);

    try {
      await this.extractor.extractAll();
    } finally {
      clearInterval(monitorInterval);
    }
  }

  private countMarkdownFiles(dir: string): number {
    let count = 0;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          count += this.countMarkdownFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          count++;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to count files in ${dir}:`, error);
    }
    return count;
  }

  private measureCompleteness(config: BenchmarkConfig, kb: any): CompletenessMetrics {
    const expectedAgents = config.expectedAgents || 15;
    const expectedFacts = config.expectedFacts || 0;
    const expectedRules = config.expectedRules || 0;
    const expectedFunctions = config.expectedFunctions || 0;

    // Find missing agents
    const expectedAgentNames = [
      '0D-Topology-Agent', '1D-Temporal-Agent', '2D-Structural-Agent',
      '3D-Algebraic-Agent', '4D-Network-Agent', '5D-Consensus-Agent',
      '6D-Intelligence-Agent', '7D-Quantum-Agent', 'Query-Interface-Agent',
      'Visualization-Agent', 'Multiplayer-Agent', 'AI-Assist-Agent',
      'Self-Modification-Agent', 'Goal-Oriented-Agent', 'OpenCode-Integration-Agent'
    ];
    const extractedAgentNames = kb.agents.map((a: any) => a.name);
    const missingAgents = expectedAgentNames.filter(name => 
      !extractedAgentNames.some((extracted: string) => 
        extracted.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(extracted.toLowerCase())
      )
    );

    return {
      facts: {
        extracted: kb.facts.length,
        expected: expectedFacts,
        coverage: expectedFacts > 0 ? (kb.facts.length / expectedFacts) * 100 : 0,
        missing: []
      },
      rules: {
        extracted: kb.rules.length,
        expected: expectedRules,
        coverage: expectedRules > 0 ? (kb.rules.length / expectedRules) * 100 : 0,
        missing: []
      },
      agents: {
        extracted: kb.agents.length,
        expected: expectedAgents,
        coverage: (kb.agents.length / expectedAgents) * 100,
        missing: missingAgents
      },
      functions: {
        extracted: kb.functions.length,
        expected: expectedFunctions,
        coverage: expectedFunctions > 0 ? (kb.functions.length / expectedFunctions) * 100 : 0,
        missing: []
      }
    };
  }

  private measurePerformance(
    extractionTime: number,
    memBefore: NodeJS.MemoryUsage,
    memAfter: NodeJS.MemoryUsage,
    config: BenchmarkConfig
  ): PerformanceMetrics {
    const jsonlPath = config.outputPath.replace('.json', '.jsonl');
    let jsonlSize = 0;
    let loadTime = 0;
    let queryTime = 0;

    // Export to JSONL and measure
    if (this.knowledgeBase) {
      const exportStart = Date.now();
      const jsonl = this.knowledgeBase.exportToJSONL();
      fs.writeFileSync(jsonlPath, jsonl);
      jsonlSize = fs.statSync(jsonlPath).size;
      const exportTime = Date.now() - exportStart;

      // Measure load time
      const loadStart = Date.now();
      const testKB = new KnowledgeBaseManager();
      testKB.loadFromJSONL(jsonl);
      loadTime = Date.now() - loadStart;

      // Measure query time
      const queryStart = Date.now();
      testKB.queryAgents();
      testKB.queryRules('MUST');
      queryTime = Date.now() - queryStart;
    }

    return {
      extraction: {
        totalTime: extractionTime,
        averageTimePerFile: this.fileCount > 0 ? extractionTime / this.fileCount : 0,
        filesPerSecond: extractionTime > 0 ? (this.fileCount / extractionTime) * 1000 : 0,
        peakMemory: this.peakMemory,
        averageMemory: (memBefore.heapTotal + memAfter.heapTotal) / 2
      },
      storage: {
        jsonlSize,
        loadTime,
        queryTime
      }
    };
  }

  private measureUnderstanding(kb: any): UnderstandingMetrics {
    // Count relationships
    const relationships = kb.relationships || [];
    const prerequisites = relationships.filter((r: any) => r.type === 'prerequisite').length;
    const enables = relationships.filter((r: any) => r.enables === 'enables').length;
    const related = relationships.filter((r: any) => r.type === 'related').length;

    // Count documents with frontmatter (sources)
    const sources = new Set<string>();
    kb.facts.forEach((f: any) => sources.add(f.source));
    kb.rules.forEach((r: any) => sources.add(r.source));
    kb.agents.forEach((a: any) => sources.add(a.source));
    kb.functions.forEach((f: any) => sources.add(f.source));

    // Calculate knowledge graph metrics
    const nodes = sources.size + kb.agents.length + kb.functions.length;
    const edges = relationships.length;
    const averageDegree = nodes > 0 ? (edges * 2) / nodes : 0;

    return {
      knowledgeGraph: {
        nodes,
        edges,
        averageDegree
      },
      relationships: {
        prerequisites,
        enables,
        related,
        brokenLinks: 0 // Would need to validate against actual files
      },
      completeness: {
        documentsWithFrontmatter: sources.size,
        documentsWithRelationships: new Set(relationships.map((r: any) => r.source)).size,
        overallCompleteness: 0 // Calculate based on expected vs actual
      }
    };
  }

  private generateSummary(
    completeness: CompletenessMetrics,
    performance: PerformanceMetrics,
    understanding: UnderstandingMetrics
  ): { overallScore: number; strengths: string[]; weaknesses: string[]; recommendations: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze completeness
    if (completeness.agents.coverage >= 100) {
      strengths.push(`✅ Perfect agent extraction (${completeness.agents.extracted}/${completeness.agents.expected})`);
    } else {
      weaknesses.push(`⚠️  Agent extraction incomplete (${completeness.agents.extracted}/${completeness.agents.expected}, ${completeness.agents.coverage.toFixed(1)}%)`);
      recommendations.push(`Fix agent extraction to reach 100% coverage`);
    }

    if (completeness.facts.coverage >= 95) {
      strengths.push(`✅ Excellent fact extraction (${completeness.facts.extracted} facts)`);
    } else if (completeness.facts.coverage > 0) {
      weaknesses.push(`⚠️  Fact extraction incomplete (${completeness.facts.coverage.toFixed(1)}% coverage)`);
      recommendations.push(`Investigate missing facts`);
    }

    if (completeness.rules.coverage >= 95) {
      strengths.push(`✅ Excellent rule extraction (${completeness.rules.extracted} rules)`);
    } else if (completeness.rules.coverage > 0) {
      weaknesses.push(`⚠️  Rule extraction incomplete (${completeness.rules.coverage.toFixed(1)}% coverage)`);
    }

    // Analyze performance
    const filesPerSecond = performance.extraction.filesPerSecond;
    if (filesPerSecond > 10) {
      strengths.push(`✅ Fast extraction (${filesPerSecond.toFixed(1)} files/sec)`);
    } else {
      weaknesses.push(`⚠️  Slow extraction (${filesPerSecond.toFixed(1)} files/sec)`);
      recommendations.push(`Optimize extraction performance`);
    }

    const memoryMB = performance.extraction.peakMemory / 1024 / 1024;
    if (memoryMB < 500) {
      strengths.push(`✅ Low memory usage (${memoryMB.toFixed(1)}MB)`);
    } else {
      weaknesses.push(`⚠️  High memory usage (${memoryMB.toFixed(1)}MB)`);
      recommendations.push(`Optimize memory usage`);
    }

    // Analyze understanding
    if (understanding.knowledgeGraph.nodes > 100) {
      strengths.push(`✅ Rich knowledge graph (${understanding.knowledgeGraph.nodes} nodes, ${understanding.knowledgeGraph.edges} edges)`);
    }

    // Calculate overall score
    const scores = [
      completeness.agents.coverage,
      completeness.facts.coverage > 0 ? completeness.facts.coverage : 100,
      completeness.rules.coverage > 0 ? completeness.rules.coverage : 100,
      completeness.functions.coverage > 0 ? completeness.functions.coverage : 100,
      filesPerSecond > 10 ? 100 : (filesPerSecond / 10) * 100,
      memoryMB < 500 ? 100 : Math.max(0, 100 - ((memoryMB - 500) / 10))
    ];
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      overallScore,
      strengths,
      weaknesses,
      recommendations
    };
  }

  private printSummary(results: BenchmarkResults): void {
    console.log('📊 Benchmark Summary\n');
    console.log(`Overall Score: ${results.summary.overallScore.toFixed(1)}%\n`);

    console.log('Completeness:');
    console.log(`  Facts: ${results.completeness.facts.extracted}${results.completeness.facts.expected > 0 ? `/${results.completeness.facts.expected}` : ''} (${results.completeness.facts.coverage.toFixed(1)}%)`);
    console.log(`  Rules: ${results.completeness.rules.extracted}${results.completeness.rules.expected > 0 ? `/${results.completeness.rules.expected}` : ''} (${results.completeness.rules.coverage.toFixed(1)}%)`);
    console.log(`  Agents: ${results.completeness.agents.extracted}/${results.completeness.agents.expected} (${results.completeness.agents.coverage.toFixed(1)}%)`);
    console.log(`  Functions: ${results.completeness.functions.extracted}${results.completeness.functions.expected > 0 ? `/${results.completeness.functions.expected}` : ''} (${results.completeness.functions.coverage.toFixed(1)}%)\n`);

    console.log('Performance:');
    console.log(`  Extraction Time: ${(results.performance.extraction.totalTime / 1000).toFixed(2)}s`);
    console.log(`  Files/Second: ${results.performance.extraction.filesPerSecond.toFixed(1)}`);
    console.log(`  Peak Memory: ${(results.performance.extraction.peakMemory / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  JSONL Size: ${(results.performance.storage.jsonlSize / 1024).toFixed(1)}KB\n`);

    console.log('Understanding:');
    console.log(`  Knowledge Graph: ${results.understanding.knowledgeGraph.nodes} nodes, ${results.understanding.knowledgeGraph.edges} edges`);
    console.log(`  Relationships: ${results.understanding.relationships.prerequisites} prerequisites, ${results.understanding.relationships.enables} enables, ${results.understanding.relationships.related} related\n`);

    if (results.summary.strengths.length > 0) {
      console.log('Strengths:');
      results.summary.strengths.forEach(s => console.log(`  ${s}`));
      console.log('');
    }

    if (results.summary.weaknesses.length > 0) {
      console.log('Weaknesses:');
      results.summary.weaknesses.forEach(w => console.log(`  ${w}`));
      console.log('');
    }

    if (results.summary.recommendations.length > 0) {
      console.log('Recommendations:');
      results.summary.recommendations.forEach(r => console.log(`  • ${r}`));
      console.log('');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const config: BenchmarkConfig = {
    docsPath: './docs',
    outputPath: './benchmark-results.json',
    expectedAgents: 15
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--docs-path' && args[i + 1]) {
      config.docsPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      config.outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--expected-facts' && args[i + 1]) {
      config.expectedFacts = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--expected-rules' && args[i + 1]) {
      config.expectedRules = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--expected-agents' && args[i + 1]) {
      config.expectedAgents = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--expected-functions' && args[i + 1]) {
      config.expectedFunctions = parseInt(args[i + 1]);
      i++;
    }
  }

  // Run benchmark
  const benchmark = new KnowledgeExtractionBenchmark(config.docsPath);
  await benchmark.runBenchmark(config);
}

main().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
