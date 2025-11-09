#!/usr/bin/env tsx
/**
 * Analyze Automaton Self-Modification Snapshots
 * Compares snapshots to evaluate reasoning quality
 */

import * as fs from 'fs';
import * as path from 'path';

interface Snapshot {
  timestamp: number;
  isoTime: string;
  fileStats: {
    size: number;
    mtime: number;
    lineCount: number;
  };
  automatonState: {
    objectCount: number;
    selfModificationCount: number;
    currentDimension: number;
    executionHistoryLength: number;
  };
  reasoning: {
    newObjects: number;
    newModifications: number;
    dimensionProgression: boolean;
    patternConsistency: string;
  };
}

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

function loadSnapshots(): Snapshot[] {
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
    .sort();
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf-8');
    return JSON.parse(content) as Snapshot;
  });
}

function analyzeReasoningQuality(snapshots: Snapshot[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 REASONING QUALITY ANALYSIS');
  console.log('='.repeat(80));
  
  if (snapshots.length < 2) {
    console.log('⚠️  Need at least 2 snapshots for analysis');
    return;
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  if (!first || !last) {
    console.log('⚠️  Invalid snapshot data');
    return;
  }
  const totalTime = (last.timestamp - first.timestamp) / 1000; // seconds
  
  console.log(`\n📊 Overview:`);
  console.log(`   Snapshots: ${snapshots.length}`);
  console.log(`   Time Span: ${totalTime.toFixed(1)} seconds`);
  const interval = snapshots.length > 1 ? (totalTime / (snapshots.length - 1)).toFixed(1) : '0';
  console.log(`   Interval: ${interval} seconds average`);
  
  console.log(`\n📈 State Changes:`);
  const objectDelta = last.automatonState.objectCount - first.automatonState.objectCount;
  const modificationDelta = last.automatonState.selfModificationCount - first.automatonState.selfModificationCount;
  const dimensionDelta = last.automatonState.currentDimension - first.automatonState.currentDimension;
  const historyDelta = last.automatonState.executionHistoryLength - first.automatonState.executionHistoryLength;
  
  console.log(`   Objects: ${first.automatonState.objectCount} → ${last.automatonState.objectCount} (${objectDelta > 0 ? '+' : ''}${objectDelta})`);
  console.log(`   Modifications: ${first.automatonState.selfModificationCount} → ${last.automatonState.selfModificationCount} (${modificationDelta > 0 ? '+' : ''}${modificationDelta})`);
  console.log(`   Dimension: ${first.automatonState.currentDimension}D → ${last.automatonState.currentDimension}D (${dimensionDelta > 0 ? '+' : ''}${dimensionDelta})`);
  console.log(`   History: ${first.automatonState.executionHistoryLength} → ${last.automatonState.executionHistoryLength} (${historyDelta > 0 ? '+' : ''}${historyDelta})`);
  
  console.log(`\n📏 File Changes:`);
  const sizeDelta = last.fileStats.size - first.fileStats.size;
  const lineDelta = last.fileStats.lineCount - first.fileStats.lineCount;
  console.log(`   Size: ${(first.fileStats.size / 1024).toFixed(2)} KB → ${(last.fileStats.size / 1024).toFixed(2)} KB (${sizeDelta > 0 ? '+' : ''}${(sizeDelta / 1024).toFixed(2)} KB)`);
  console.log(`   Lines: ${first.fileStats.lineCount} → ${last.fileStats.lineCount} (${lineDelta > 0 ? '+' : ''}${lineDelta})`);
  
  // Calculate rates
  const objectsPerSecond = totalTime > 0 ? objectDelta / totalTime : 0;
  const modificationsPerSecond = totalTime > 0 ? modificationDelta / totalTime : 0;
  const linesPerSecond = totalTime > 0 ? lineDelta / totalTime : 0;
  
  console.log(`\n⚡ Activity Rates:`);
  console.log(`   Objects/Second: ${objectsPerSecond.toFixed(3)}`);
  console.log(`   Modifications/Second: ${modificationsPerSecond.toFixed(3)}`);
  console.log(`   Lines/Second: ${linesPerSecond.toFixed(3)}`);
  
  // Analyze reasoning patterns
  console.log(`\n🧠 Reasoning Patterns:`);
  
  const dimensionProgressions = snapshots.filter((s, i) => {
    if (i === 0) return false;
    const prev = snapshots[i - 1];
    return prev && s.automatonState.currentDimension > prev.automatonState.currentDimension;
  }).length;
  
  const consistentPatterns = snapshots.filter(s => 
    s.reasoning.patternConsistency === 'expanding' || s.reasoning.patternConsistency === 'evolving'
  ).length;
  
  const activeSnapshots = snapshots.filter((s, i) => 
    i > 0 && (s.reasoning?.newObjects > 0 || s.reasoning?.newModifications > 0)
  ).length;
  
  console.log(`   Dimension Progressions: ${dimensionProgressions}`);
  console.log(`   Consistent Patterns: ${consistentPatterns}/${snapshots.length}`);
  console.log(`   Active Snapshots: ${activeSnapshots}/${snapshots.length - 1}`);
  
  // Quality assessment
  console.log(`\n✅ Quality Assessment:`);
  
  const qualityScore = (
    (dimensionProgressions > 0 ? 1 : 0) * 0.3 +
    (consistentPatterns > snapshots.length / 2 ? 1 : 0) * 0.3 +
    (activeSnapshots > 0 ? 1 : 0) * 0.2 +
    (objectsPerSecond > 0 || modificationsPerSecond > 0 ? 1 : 0) * 0.2
  ) * 100;
  
  console.log(`   Score: ${qualityScore.toFixed(1)}/100`);
  
  if (qualityScore >= 80) {
    console.log(`   Status: 🟢 Excellent - Strong reasoning patterns detected`);
  } else if (qualityScore >= 60) {
    console.log(`   Status: 🟡 Good - Moderate reasoning activity`);
  } else if (qualityScore >= 40) {
    console.log(`   Status: 🟠 Fair - Limited reasoning activity`);
  } else {
    console.log(`   Status: 🔴 Poor - Minimal or no reasoning detected`);
  }
  
  // Detailed comparison
  if (first && last) {
    console.log(`\n📋 Detailed Comparison (First vs Last):`);
    console.log(`   Time: ${first.isoTime} → ${last.isoTime}`);
    console.log(`   Objects: ${first.automatonState.objectCount} → ${last.automatonState.objectCount}`);
    console.log(`   Modifications: ${first.automatonState.selfModificationCount} → ${last.automatonState.selfModificationCount}`);
    console.log(`   Dimension: ${first.automatonState.currentDimension}D → ${last.automatonState.currentDimension}D`);
    
    // Show progression timeline
    if (snapshots.length > 2) {
      console.log(`\n📅 Progression Timeline:`);
      snapshots.forEach((snapshot, idx) => {
        const timeFromStart = ((snapshot.timestamp - first.timestamp) / 1000).toFixed(1);
        console.log(`   ${idx + 1}. [${timeFromStart}s] Objects: ${snapshot.automatonState.objectCount}, Mods: ${snapshot.automatonState.selfModificationCount}, Dim: ${snapshot.automatonState.currentDimension}D`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

function main() {
  console.log('🔍 Loading snapshots...');
  
  const snapshots = loadSnapshots();
  
  if (snapshots.length === 0) {
    console.log('❌ No snapshots found in', SNAPSHOT_DIR);
    return;
  }
  
  console.log(`✅ Loaded ${snapshots.length} snapshots`);
  
  analyzeReasoningQuality(snapshots);
}

if (require.main === module) {
  main();
}

export { analyzeReasoningQuality };
