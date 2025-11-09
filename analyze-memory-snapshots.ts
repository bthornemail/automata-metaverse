#!/usr/bin/env tsx
/**
 * Analyze Memory-Aware Snapshot Results
 * Evaluates memory usage patterns and reasoning quality
 */

import * as fs from 'fs';
import * as path from 'path';

interface MemorySnapshot {
  timestamp: number;
  isoTime: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    systemFree: number;
  };
  automatonState: {
    objectCount: number;
    selfModificationCount: number;
    currentDimension: number;
  };
  reasoning: {
    newObjects: number;
    newModifications: number;
    memoryDelta: number;
    memoryPressure: string;
  };
}

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots-memory');

function loadSnapshots(): MemorySnapshot[] {
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
    .sort();
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf-8');
    return JSON.parse(content) as MemorySnapshot;
  });
}

function analyzeMemoryPatterns(snapshots: MemorySnapshot[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 MEMORY-AWARE REASONING QUALITY ANALYSIS');
  console.log('='.repeat(80));
  
  if (snapshots.length < 2) {
    console.log('⚠️  Need at least 2 snapshots for analysis');
    return;
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const totalTime = (last.timestamp - first.timestamp) / 1000; // seconds
  
  console.log(`\n📊 Overview:`);
  console.log(`   Snapshots: ${snapshots.length}`);
  console.log(`   Time Span: ${totalTime.toFixed(3)} seconds (${(totalTime/1000).toFixed(3)}ms)`);
  console.log(`   Interval: ${(totalTime / (snapshots.length - 1)).toFixed(3)}ms average`);
  
  console.log(`\n💾 Memory Analysis:`);
  const memStartMB = first.memory.heapUsed / 1024 / 1024;
  const memEndMB = last.memory.heapUsed / 1024 / 1024;
  // Use reduce instead of spread operator to avoid stack overflow with large arrays
  const memPeakMB = snapshots.reduce((max, s) => Math.max(max, s.memory.heapUsed), snapshots[0].memory.heapUsed) / 1024 / 1024;
  const memMinMB = snapshots.reduce((min, s) => Math.min(min, s.memory.heapUsed), snapshots[0].memory.heapUsed) / 1024 / 1024;
  
  console.log(`   Start Memory: ${memStartMB.toFixed(2)}MB`);
  console.log(`   End Memory: ${memEndMB.toFixed(2)}MB`);
  console.log(`   Peak Memory: ${memPeakMB.toFixed(2)}MB`);
  console.log(`   Min Memory: ${memMinMB.toFixed(2)}MB`);
  console.log(`   Memory Change: ${(memEndMB - memStartMB).toFixed(2)}MB`);
  console.log(`   Memory Range: ${(memPeakMB - memMinMB).toFixed(2)}MB`);
  
  // Memory pressure distribution
  const pressureCounts: Record<string, number> = {};
  snapshots.forEach(s => {
    const pressure = s.reasoning.memoryPressure;
    pressureCounts[pressure] = (pressureCounts[pressure] || 0) + 1;
  });
  
  console.log(`\n📈 Memory Pressure Distribution:`);
  Object.entries(pressureCounts).forEach(([pressure, count]) => {
    const percentage = (count / snapshots.length) * 100;
    console.log(`   ${pressure.toUpperCase()}: ${count} snapshots (${percentage.toFixed(1)}%)`);
  });
  
  console.log(`\n📈 State Changes:`);
  const objectDelta = last.automatonState.objectCount - first.automatonState.objectCount;
  const modificationDelta = last.automatonState.selfModificationCount - first.automatonState.selfModificationCount;
  
  console.log(`   Objects: ${first.automatonState.objectCount} → ${last.automatonState.objectCount} (${objectDelta > 0 ? '+' : ''}${objectDelta})`);
  console.log(`   Modifications: ${first.automatonState.selfModificationCount} → ${last.automatonState.selfModificationCount} (${modificationDelta > 0 ? '+' : ''}${modificationDelta})`);
  
  // Calculate rates
  const objectsPerSecond = objectDelta / totalTime;
  const memoryPerSecond = (memEndMB - memStartMB) / totalTime;
  const objectsPerMB = (memEndMB !== memStartMB) ? objectDelta / (memEndMB - memStartMB) : 0;
  
  console.log(`\n⚡ Performance Rates:`);
  console.log(`   Objects/Second: ${objectsPerSecond.toFixed(3)}`);
  console.log(`   Memory/Second: ${memoryPerSecond.toFixed(3)}MB/sec`);
  console.log(`   Objects/MB: ${objectsPerMB.toFixed(1)}`);
  
  // Memory efficiency
  const avgMemoryPerObject = snapshots.reduce((sum, s) => 
    sum + (s.memory.heapUsed / s.automatonState.objectCount), 0) / snapshots.length;
  
  console.log(`\n💡 Memory Efficiency:`);
  console.log(`   Average Memory/Object: ${(avgMemoryPerObject / 1024).toFixed(2)}KB`);
  
  // Memory stability
  const memoryDeltas = snapshots.slice(1).map((s, i) => 
    s.memory.heapUsed - snapshots[i].memory.heapUsed
  );
  const avgMemoryDelta = memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length;
  const memoryVolatility = Math.sqrt(
    memoryDeltas.reduce((sum, d) => sum + Math.pow(d - avgMemoryDelta, 2), 0) / memoryDeltas.length
  ) / 1024 / 1024; // MB
  
  console.log(`   Memory Volatility: ${memoryVolatility.toFixed(2)}MB (std dev)`);
  console.log(`   Memory Stability: ${memoryVolatility < 10 ? '🟢 Stable' : memoryVolatility < 50 ? '🟡 Moderate' : '🔴 Volatile'}`);
  
  // Reasoning quality
  const activeSnapshots = snapshots.filter((s, i) => 
    i > 0 && (s.reasoning.newObjects > 0 || s.reasoning.newModifications > 0)
  ).length;
  
  const memoryEfficientSnapshots = snapshots.filter(s => 
    s.reasoning.memoryPressure === 'low' || s.reasoning.memoryPressure === 'medium'
  ).length;
  
  console.log(`\n🧠 Reasoning Quality:`);
  console.log(`   Active Snapshots: ${activeSnapshots}/${snapshots.length - 1}`);
  console.log(`   Memory-Efficient Periods: ${memoryEfficientSnapshots}/${snapshots.length} (${(memoryEfficientSnapshots/snapshots.length*100).toFixed(1)}%)`);
  
  const qualityScore = (
    (activeSnapshots / (snapshots.length - 1)) * 0.4 +
    (memoryEfficientSnapshots / snapshots.length) * 0.3 +
    (memoryVolatility < 50 ? 1 : 0) * 0.3
  ) * 100;
  
  console.log(`   Quality Score: ${qualityScore.toFixed(1)}/100`);
  console.log(`   Status: ${qualityScore >= 80 ? '🟢 Excellent' : qualityScore >= 60 ? '🟡 Good' : qualityScore >= 40 ? '🟠 Fair' : '🔴 Poor'}`);
  
  // Memory leak detection
  const memoryTrend = (memEndMB - memStartMB) / totalTime;
  if (memoryTrend > 1) {
    console.log(`\n⚠️  Potential Memory Leak Detected:`);
    console.log(`   Memory growing at ${memoryTrend.toFixed(2)}MB/sec`);
    console.log(`   Recommendation: Check for unclosed resources or growing arrays`);
  }
  
  console.log('\n' + '='.repeat(80));
}

function main() {
  console.log('🔍 Loading memory snapshots...');
  
  const snapshots = loadSnapshots();
  
  if (snapshots.length === 0) {
    console.log('❌ No memory snapshots found in', SNAPSHOT_DIR);
    return;
  }
  
  console.log(`✅ Loaded ${snapshots.length} memory snapshots`);
  
  analyzeMemoryPatterns(snapshots);
}

if (require.main === module) {
  main();
}

export { analyzeMemoryPatterns };
