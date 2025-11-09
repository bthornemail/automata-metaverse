#!/usr/bin/env tsx
/**
 * Test Snapshot Analysis - Detailed visualization
 * Shows snapshot progression and analysis breakdown
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

function analyzeSnapshotProgression(snapshots: MemorySnapshot[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📈 SNAPSHOT PROGRESSION ANALYSIS');
  console.log('='.repeat(80));
  
  if (snapshots.length < 10) {
    console.log('⚠️  Need at least 10 snapshots for progression analysis');
    return;
  }
  
  // Sample snapshots at different points
  const samplePoints = [
    { label: 'Start (0%)', index: 0 },
    { label: 'Early (10%)', index: Math.floor(snapshots.length * 0.1) },
    { label: 'Mid (25%)', index: Math.floor(snapshots.length * 0.25) },
    { label: 'Mid (50%)', index: Math.floor(snapshots.length * 0.5) },
    { label: 'Mid (75%)', index: Math.floor(snapshots.length * 0.75) },
    { label: 'Late (90%)', index: Math.floor(snapshots.length * 0.9) },
    { label: 'End (100%)', index: snapshots.length - 1 },
  ];
  
  console.log('\n📊 Sample Snapshot Progression:');
  console.log('─'.repeat(80));
  console.log(
    'Stage'.padEnd(15) +
    'Memory (MB)'.padEnd(15) +
    'Objects'.padEnd(12) +
    'Mods'.padEnd(12) +
    'Dimension'.padEnd(12) +
    'Pressure'
  );
  console.log('─'.repeat(80));
  
  for (const point of samplePoints) {
    const s = snapshots[point.index];
    if (!s) continue;
    const memMB = s.memory.heapUsed / 1024 / 1024;
    const pressure = s.reasoning.memoryPressure || 'unknown';
    console.log(
      point.label.padEnd(15) +
      memMB.toFixed(2).padEnd(15) +
      s.automatonState.objectCount.toString().padEnd(12) +
      s.automatonState.selfModificationCount.toString().padEnd(12) +
      s.automatonState.currentDimension.toString().padEnd(12) +
      pressure.toUpperCase()
    );
  }
  
  // Memory growth phases
  console.log('\n📈 Memory Growth Phases:');
  console.log('─'.repeat(80));
  
  const phaseSize = Math.floor(snapshots.length / 4);
  for (let i = 0; i < 4; i++) {
    const startIdx = i * phaseSize;
    const endIdx = Math.min((i + 1) * phaseSize, snapshots.length - 1);
    const startSnapshot = snapshots[startIdx];
    const endSnapshot = snapshots[endIdx];
    if (!startSnapshot || !endSnapshot) continue;
    
    const startMem = startSnapshot.memory.heapUsed / 1024 / 1024;
    const endMem = endSnapshot.memory.heapUsed / 1024 / 1024;
    const growth = endMem - startMem;
    const timeDiff = (endSnapshot.timestamp - startSnapshot.timestamp) / 1000;
    const growthRate = timeDiff > 0 ? growth / timeDiff : 0;
    
    console.log(`Phase ${i + 1} (${startIdx} → ${endIdx}):`);
    console.log(`  Memory: ${startMem.toFixed(2)}MB → ${endMem.toFixed(2)}MB (${growth > 0 ? '+' : ''}${growth.toFixed(2)}MB)`);
    console.log(`  Growth Rate: ${growthRate.toFixed(4)}MB/sec`);
    console.log(`  Objects: ${startSnapshot.automatonState.objectCount} → ${endSnapshot.automatonState.objectCount}`);
    console.log();
  }
  
  // Dimension distribution
  console.log('🎯 Dimension Distribution:');
  console.log('─'.repeat(80));
  const dimCounts: Record<number, number> = {};
  snapshots.forEach(s => {
    const dim = s.automatonState.currentDimension;
    dimCounts[dim] = (dimCounts[dim] || 0) + 1;
  });
  
  for (let dim = 0; dim <= 7; dim++) {
    const count = dimCounts[dim] || 0;
    const percentage = (count / snapshots.length) * 100;
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`  ${dim}D: ${count.toString().padStart(8)} (${percentage.toFixed(1).padStart(5)}%) ${bar}`);
  }
  
  // Memory pressure timeline
  console.log('\n💾 Memory Pressure Timeline:');
  console.log('─'.repeat(80));
  const pressureTransitions: Array<{ from: string; to: string; at: number }> = [];
  const firstSnapshot = snapshots[0];
  if (!firstSnapshot) {
    console.log('No snapshots available');
    return;
  }
  let lastPressure = firstSnapshot.reasoning.memoryPressure || 'unknown';
  
  for (let i = 1; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    if (!snapshot) continue;
    const currentPressure = snapshot.reasoning.memoryPressure || 'unknown';
    if (currentPressure !== lastPressure) {
      pressureTransitions.push({
        from: lastPressure,
        to: currentPressure,
        at: i
      });
      lastPressure = currentPressure;
    }
  }
  
  console.log(`Total Pressure Transitions: ${pressureTransitions.length}`);
  if (pressureTransitions.length > 0 && pressureTransitions.length <= 20) {
    pressureTransitions.forEach((t, i) => {
      const percentage = (t.at / snapshots.length) * 100;
      console.log(`  ${i + 1}. ${t.from.toUpperCase()} → ${t.to.toUpperCase()} at ${percentage.toFixed(1)}% (snapshot ${t.at})`);
    });
  } else if (pressureTransitions.length > 20) {
    console.log('  (Too many transitions to display individually)');
    const pressureCounts: Record<string, number> = {};
    pressureTransitions.forEach(t => {
      const key = `${t.from}→${t.to}`;
      pressureCounts[key] = (pressureCounts[key] || 0) + 1;
    });
    Object.entries(pressureCounts).forEach(([transition, count]) => {
      console.log(`  ${transition}: ${count} times`);
    });
  }
  
  // Active periods
  console.log('\n⚡ Active Modification Periods:');
  console.log('─'.repeat(80));
  const activeSnapshots = snapshots.filter((s, i) => 
    i > 0 && (s.reasoning.newObjects > 0 || s.reasoning.newModifications > 0)
  );
  
  console.log(`Total Active Snapshots: ${activeSnapshots.length}/${snapshots.length - 1}`);
  console.log(`Active Percentage: ${((activeSnapshots.length / (snapshots.length - 1)) * 100).toFixed(1)}%`);
  
  if (activeSnapshots.length > 0) {
    const avgNewObjects = activeSnapshots.reduce((sum, s) => sum + s.reasoning.newObjects, 0) / activeSnapshots.length;
    const avgNewMods = activeSnapshots.reduce((sum, s) => sum + s.reasoning.newModifications, 0) / activeSnapshots.length;
    console.log(`Average New Objects per Active Snapshot: ${avgNewObjects.toFixed(2)}`);
    console.log(`Average New Modifications per Active Snapshot: ${avgNewMods.toFixed(2)}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

function main() {
  console.log('🔍 Loading memory snapshots for detailed analysis...');
  
  const snapshots = loadSnapshots();
  
  if (snapshots.length === 0) {
    console.log('❌ No memory snapshots found in', SNAPSHOT_DIR);
    return;
  }
  
  console.log(`✅ Loaded ${snapshots.length} memory snapshots`);
  
  analyzeSnapshotProgression(snapshots);
}

if (require.main === module) {
  main();
}

export { analyzeSnapshotProgression };
