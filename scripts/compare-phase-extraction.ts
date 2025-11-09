#!/usr/bin/env tsx
/**
 * Compare Knowledge Extraction Across Phases
 * 
 * Compares extraction results between Phase 14 (Logging) and Phase 15 (Testing & Optimizing)
 * 
 * Usage:
 *   tsx scripts/compare-phase-extraction.ts --phase14 <results1.json> --phase15 <results2.json>
 */

import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResults {
  timestamp: string;
  config: any;
  completeness: any;
  performance: any;
  understanding: any;
  summary: any;
}

interface ComparisonResult {
  phase14: BenchmarkResults;
  phase15: BenchmarkResults;
  differences: {
    completeness: {
      facts: { phase14: number; phase15: number; change: number; changePercent: number };
      rules: { phase14: number; phase15: number; change: number; changePercent: number };
      agents: { phase14: number; phase15: number; change: number; changePercent: number };
      functions: { phase14: number; phase15: number; change: number; changePercent: number };
    };
    performance: {
      extractionTime: { phase14: number; phase15: number; change: number; changePercent: number };
      filesPerSecond: { phase14: number; phase15: number; change: number; changePercent: number };
      memoryUsage: { phase14: number; phase15: number; change: number; changePercent: number };
    };
    understanding: {
      knowledgeGraph: { phase14: { nodes: number; edges: number }; phase15: { nodes: number; edges: number }; change: { nodes: number; edges: number } };
      relationships: { phase14: number; phase15: number; change: number };
    };
  };
  analysis: {
    knowledgeGrowth: string[];
    qualityImprovement: string[];
    performanceChanges: string[];
    recommendations: string[];
  };
}

function compareResults(phase14: BenchmarkResults, phase15: BenchmarkResults): ComparisonResult {
  const differences = {
    completeness: {
      facts: {
        phase14: phase14.completeness.facts.extracted,
        phase15: phase15.completeness.facts.extracted,
        change: phase15.completeness.facts.extracted - phase14.completeness.facts.extracted,
        changePercent: phase14.completeness.facts.extracted > 0
          ? ((phase15.completeness.facts.extracted - phase14.completeness.facts.extracted) / phase14.completeness.facts.extracted) * 100
          : 0
      },
      rules: {
        phase14: phase14.completeness.rules.extracted,
        phase15: phase15.completeness.rules.extracted,
        change: phase15.completeness.rules.extracted - phase14.completeness.rules.extracted,
        changePercent: phase14.completeness.rules.extracted > 0
          ? ((phase15.completeness.rules.extracted - phase14.completeness.rules.extracted) / phase14.completeness.rules.extracted) * 100
          : 0
      },
      agents: {
        phase14: phase14.completeness.agents.extracted,
        phase15: phase15.completeness.agents.extracted,
        change: phase15.completeness.agents.extracted - phase14.completeness.agents.extracted,
        changePercent: phase14.completeness.agents.extracted > 0
          ? ((phase15.completeness.agents.extracted - phase14.completeness.agents.extracted) / phase14.completeness.agents.extracted) * 100
          : 0
      },
      functions: {
        phase14: phase14.completeness.functions.extracted,
        phase15: phase15.completeness.functions.extracted,
        change: phase15.completeness.functions.extracted - phase14.completeness.functions.extracted,
        changePercent: phase14.completeness.functions.extracted > 0
          ? ((phase15.completeness.functions.extracted - phase14.completeness.functions.extracted) / phase14.completeness.functions.extracted) * 100
          : 0
      }
    },
    performance: {
      extractionTime: {
        phase14: phase14.performance.extraction.totalTime,
        phase15: phase15.performance.extraction.totalTime,
        change: phase15.performance.extraction.totalTime - phase14.performance.extraction.totalTime,
        changePercent: phase14.performance.extraction.totalTime > 0
          ? ((phase15.performance.extraction.totalTime - phase14.performance.extraction.totalTime) / phase14.performance.extraction.totalTime) * 100
          : 0
      },
      filesPerSecond: {
        phase14: phase14.performance.extraction.filesPerSecond,
        phase15: phase15.performance.extraction.filesPerSecond,
        change: phase15.performance.extraction.filesPerSecond - phase14.performance.extraction.filesPerSecond,
        changePercent: phase14.performance.extraction.filesPerSecond > 0
          ? ((phase15.performance.extraction.filesPerSecond - phase14.performance.extraction.filesPerSecond) / phase14.performance.extraction.filesPerSecond) * 100
          : 0
      },
      memoryUsage: {
        phase14: phase14.performance.extraction.peakMemory / 1024 / 1024,
        phase15: phase15.performance.extraction.peakMemory / 1024 / 1024,
        change: (phase15.performance.extraction.peakMemory - phase14.performance.extraction.peakMemory) / 1024 / 1024,
        changePercent: phase14.performance.extraction.peakMemory > 0
          ? ((phase15.performance.extraction.peakMemory - phase14.performance.extraction.peakMemory) / phase14.performance.extraction.peakMemory) * 100
          : 0
      }
    },
    understanding: {
      knowledgeGraph: {
        phase14: {
          nodes: phase14.understanding.knowledgeGraph.nodes,
          edges: phase14.understanding.knowledgeGraph.edges
        },
        phase15: {
          nodes: phase15.understanding.knowledgeGraph.nodes,
          edges: phase15.understanding.knowledgeGraph.edges
        },
        change: {
          nodes: phase15.understanding.knowledgeGraph.nodes - phase14.understanding.knowledgeGraph.nodes,
          edges: phase15.understanding.knowledgeGraph.edges - phase14.understanding.knowledgeGraph.edges
        }
      },
      relationships: {
        phase14: phase14.understanding.relationships.prerequisites + phase14.understanding.relationships.enables + phase14.understanding.relationships.related,
        phase15: phase15.understanding.relationships.prerequisites + phase15.understanding.relationships.enables + phase15.understanding.relationships.related,
        change: (phase15.understanding.relationships.prerequisites + phase15.understanding.relationships.enables + phase15.understanding.relationships.related) -
                (phase14.understanding.relationships.prerequisites + phase14.understanding.relationships.enables + phase14.understanding.relationships.related)
      }
    }
  };

  // Generate analysis
  const analysis = {
    knowledgeGrowth: [] as string[],
    qualityImprovement: [] as string[],
    performanceChanges: [] as string[],
    recommendations: [] as string[]
  };

  // Analyze knowledge growth
  if (differences.completeness.facts.change > 0) {
    analysis.knowledgeGrowth.push(`✅ Facts increased by ${differences.completeness.facts.change} (${differences.completeness.facts.changePercent.toFixed(1)}%)`);
  }
  if (differences.completeness.rules.change > 0) {
    analysis.knowledgeGrowth.push(`✅ Rules increased by ${differences.completeness.rules.change} (${differences.completeness.rules.changePercent.toFixed(1)}%)`);
  }
  if (differences.completeness.agents.change > 0) {
    analysis.knowledgeGrowth.push(`✅ Agents increased by ${differences.completeness.agents.change} (${differences.completeness.agents.changePercent.toFixed(1)}%)`);
  }
  if (differences.completeness.functions.change > 0) {
    analysis.knowledgeGrowth.push(`✅ Functions increased by ${differences.completeness.functions.change} (${differences.completeness.functions.changePercent.toFixed(1)}%)`);
  }

  // Analyze quality improvement
  const phase14Score = phase14.summary.overallScore;
  const phase15Score = phase15.summary.overallScore;
  const scoreChange = phase15Score - phase14Score;
  if (scoreChange > 0) {
    analysis.qualityImprovement.push(`✅ Overall score improved by ${scoreChange.toFixed(1)}% (${phase14Score.toFixed(1)}% → ${phase15Score.toFixed(1)}%)`);
  } else if (scoreChange < 0) {
    analysis.qualityImprovement.push(`⚠️  Overall score decreased by ${Math.abs(scoreChange).toFixed(1)}% (${phase14Score.toFixed(1)}% → ${phase15Score.toFixed(1)}%)`);
  }

  // Analyze performance changes
  if (differences.performance.extractionTime.changePercent < -10) {
    analysis.performanceChanges.push(`✅ Extraction time improved by ${Math.abs(differences.performance.extractionTime.changePercent).toFixed(1)}%`);
  } else if (differences.performance.extractionTime.changePercent > 10) {
    analysis.performanceChanges.push(`⚠️  Extraction time increased by ${differences.performance.extractionTime.changePercent.toFixed(1)}%`);
  }

  if (differences.performance.filesPerSecond.changePercent > 10) {
    analysis.performanceChanges.push(`✅ Throughput improved by ${differences.performance.filesPerSecond.changePercent.toFixed(1)}%`);
  } else if (differences.performance.filesPerSecond.changePercent < -10) {
    analysis.performanceChanges.push(`⚠️  Throughput decreased by ${Math.abs(differences.performance.filesPerSecond.changePercent).toFixed(1)}%`);
  }

  // Generate recommendations
  if (differences.completeness.agents.changePercent < 0) {
    analysis.recommendations.push(`Investigate agent extraction regression`);
  }
  if (differences.performance.memoryUsage.changePercent > 20) {
    analysis.recommendations.push(`Optimize memory usage (increased by ${differences.performance.memoryUsage.changePercent.toFixed(1)}%)`);
  }
  if (scoreChange < -5) {
    analysis.recommendations.push(`Investigate quality regression`);
  }

  return {
    phase14,
    phase15,
    differences,
    analysis
  };
}

function printComparison(comparison: ComparisonResult): void {
  console.log('📊 Phase Comparison: Phase 14 vs Phase 15\n');

  console.log('Completeness Changes:');
  console.log(`  Facts: ${comparison.differences.completeness.facts.phase14} → ${comparison.differences.completeness.facts.phase15} (${comparison.differences.completeness.facts.change > 0 ? '+' : ''}${comparison.differences.completeness.facts.change}, ${comparison.differences.completeness.facts.changePercent > 0 ? '+' : ''}${comparison.differences.completeness.facts.changePercent.toFixed(1)}%)`);
  console.log(`  Rules: ${comparison.differences.completeness.rules.phase14} → ${comparison.differences.completeness.rules.phase15} (${comparison.differences.completeness.rules.change > 0 ? '+' : ''}${comparison.differences.completeness.rules.change}, ${comparison.differences.completeness.rules.changePercent > 0 ? '+' : ''}${comparison.differences.completeness.rules.changePercent.toFixed(1)}%)`);
  console.log(`  Agents: ${comparison.differences.completeness.agents.phase14} → ${comparison.differences.completeness.agents.phase15} (${comparison.differences.completeness.agents.change > 0 ? '+' : ''}${comparison.differences.completeness.agents.change}, ${comparison.differences.completeness.agents.changePercent > 0 ? '+' : ''}${comparison.differences.completeness.agents.changePercent.toFixed(1)}%)`);
  console.log(`  Functions: ${comparison.differences.completeness.functions.phase14} → ${comparison.differences.completeness.functions.phase15} (${comparison.differences.completeness.functions.change > 0 ? '+' : ''}${comparison.differences.completeness.functions.change}, ${comparison.differences.completeness.functions.changePercent > 0 ? '+' : ''}${comparison.differences.completeness.functions.changePercent.toFixed(1)}%)\n`);

  console.log('Performance Changes:');
  console.log(`  Extraction Time: ${(comparison.differences.performance.extractionTime.phase14 / 1000).toFixed(2)}s → ${(comparison.differences.performance.extractionTime.phase15 / 1000).toFixed(2)}s (${comparison.differences.performance.extractionTime.changePercent > 0 ? '+' : ''}${comparison.differences.performance.extractionTime.changePercent.toFixed(1)}%)`);
  console.log(`  Files/Second: ${comparison.differences.performance.filesPerSecond.phase14.toFixed(1)} → ${comparison.differences.performance.filesPerSecond.phase15.toFixed(1)} (${comparison.differences.performance.filesPerSecond.changePercent > 0 ? '+' : ''}${comparison.differences.performance.filesPerSecond.changePercent.toFixed(1)}%)`);
  console.log(`  Memory Usage: ${comparison.differences.performance.memoryUsage.phase14.toFixed(1)}MB → ${comparison.differences.performance.memoryUsage.phase15.toFixed(1)}MB (${comparison.differences.performance.memoryUsage.changePercent > 0 ? '+' : ''}${comparison.differences.performance.memoryUsage.changePercent.toFixed(1)}%)\n`);

  console.log('Understanding Changes:');
  console.log(`  Knowledge Graph Nodes: ${comparison.differences.understanding.knowledgeGraph.phase14.nodes} → ${comparison.differences.understanding.knowledgeGraph.phase15.nodes} (${comparison.differences.understanding.knowledgeGraph.change.nodes > 0 ? '+' : ''}${comparison.differences.understanding.knowledgeGraph.change.nodes})`);
  console.log(`  Knowledge Graph Edges: ${comparison.differences.understanding.knowledgeGraph.phase14.edges} → ${comparison.differences.understanding.knowledgeGraph.phase15.edges} (${comparison.differences.understanding.knowledgeGraph.change.edges > 0 ? '+' : ''}${comparison.differences.understanding.knowledgeGraph.change.edges})`);
  console.log(`  Relationships: ${comparison.differences.understanding.relationships.phase14} → ${comparison.differences.understanding.relationships.phase15} (${comparison.differences.understanding.relationships.change > 0 ? '+' : ''}${comparison.differences.understanding.relationships.change})\n`);

  if (comparison.analysis.knowledgeGrowth.length > 0) {
    console.log('Knowledge Growth:');
    comparison.analysis.knowledgeGrowth.forEach(item => console.log(`  ${item}`));
    console.log('');
  }

  if (comparison.analysis.qualityImprovement.length > 0) {
    console.log('Quality Improvement:');
    comparison.analysis.qualityImprovement.forEach(item => console.log(`  ${item}`));
    console.log('');
  }

  if (comparison.analysis.performanceChanges.length > 0) {
    console.log('Performance Changes:');
    comparison.analysis.performanceChanges.forEach(item => console.log(`  ${item}`));
    console.log('');
  }

  if (comparison.analysis.recommendations.length > 0) {
    console.log('Recommendations:');
    comparison.analysis.recommendations.forEach(item => console.log(`  • ${item}`));
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);
  let phase14Path: string | null = null;
  let phase15Path: string | null = null;
  let outputPath = './benchmark-comparison.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase14' && args[i + 1]) {
      phase14Path = args[i + 1];
      i++;
    } else if (args[i] === '--phase15' && args[i + 1]) {
      phase15Path = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!phase14Path || !phase15Path) {
    console.error('Usage: tsx scripts/compare-phase-extraction.ts --phase14 <results1.json> --phase15 <results2.json> [--output <output.json>]');
    process.exit(1);
  }

  const phase14: BenchmarkResults = JSON.parse(fs.readFileSync(phase14Path, 'utf-8'));
  const phase15: BenchmarkResults = JSON.parse(fs.readFileSync(phase15Path, 'utf-8'));

  const comparison = compareResults(phase14, phase15);
  
  fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2));
  
  printComparison(comparison);
  
  console.log(`\n✅ Comparison saved to: ${outputPath}`);
}

main().catch(error => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});
