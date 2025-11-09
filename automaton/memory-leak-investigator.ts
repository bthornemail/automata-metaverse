#!/usr/bin/env tsx
/**
 * Memory Leak Investigator
 * Analyzes memory growth patterns to identify leaks
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  objects: number;
  executionHistoryLength: number;
  fileSize: number;
  callStack: string[];
}

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots-memory');
const AUTOMATON_FILE = path.join(__dirname, 'automaton.jsonl');

function analyzeMemoryLeak(): void {
  console.log('🔍 Memory Leak Investigation\n');
  console.log('='.repeat(80));
  
  // Load recent snapshots
  const snapshotFiles = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
    .sort()
    .slice(-100); // Last 100 snapshots
  
  if (snapshotFiles.length < 10) {
    console.log('❌ Need at least 10 snapshots for analysis');
    return;
  }
  
  const snapshots = snapshotFiles.map(file => {
    const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf-8');
    return JSON.parse(content);
  });
  
  // Analyze memory growth patterns
  console.log('\n📊 Memory Growth Analysis:');
  console.log('─'.repeat(80));
  
  const memoryDeltas: number[] = [];
  const objectDeltas: number[] = [];
  const memoryPerObject: number[] = [];
  
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    
    const memDelta = curr.memory.heapUsed - prev.memory.heapUsed;
    const objDelta = curr.automatonState.objectCount - prev.automatonState.objectCount;
    const timeDelta = (curr.timestamp - prev.timestamp) / 1000;
    
    memoryDeltas.push(memDelta);
    objectDeltas.push(objDelta);
    
    if (objDelta !== 0) {
      memoryPerObject.push(memDelta / objDelta);
    } else if (memDelta > 0) {
      // Memory growing without object growth - potential leak
      memoryPerObject.push(Infinity);
    }
  }
  
  const avgMemoryDelta = memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length;
  const avgObjectDelta = objectDeltas.reduce((a, b) => a + b, 0) / objectDeltas.length;
  const memoryWithoutObjects = memoryDeltas.filter((_, i) => objectDeltas[i] === 0);
  const avgMemoryWithoutObjects = memoryWithoutObjects.length > 0 
    ? memoryWithoutObjects.reduce((a, b) => a + b, 0) / memoryWithoutObjects.length 
    : 0;
  
  console.log(`   Average Memory Delta: ${(avgMemoryDelta / 1024 / 1024).toFixed(3)}MB per snapshot`);
  console.log(`   Average Object Delta: ${avgObjectDelta.toFixed(2)} objects per snapshot`);
  console.log(`   Memory Growth Without Objects: ${(avgMemoryWithoutObjects / 1024 / 1024).toFixed(3)}MB per snapshot`);
  console.log(`   Snapshots with Memory Growth but No Objects: ${memoryWithoutObjects.length}/${memoryDeltas.length}`);
  
  // Identify potential leak sources
  console.log('\n🔍 Potential Leak Sources:');
  console.log('─'.repeat(80));
  
  // Check execution history growth
  const historyGrowth = snapshots.map(s => s.automatonState.executionHistoryLength);
  const maxHistory = Math.max(...historyGrowth);
  const minHistory = Math.min(...historyGrowth);
  
  if (maxHistory > minHistory) {
    console.log(`   ⚠️  Execution History Growing: ${minHistory} → ${maxHistory} (+${maxHistory - minHistory})`);
    console.log(`      This array may not be trimmed, causing memory growth`);
  }
  
  // Check file reading patterns
  const fileSizes = snapshots.map(s => s.fileStats.size);
  const maxFileSize = Math.max(...fileSizes);
  const minFileSize = Math.min(...fileSizes);
  
  console.log(`   📄 File Size: ${(minFileSize / 1024).toFixed(2)}KB → ${(maxFileSize / 1024).toFixed(2)}KB`);
  
  // Check if snapshot system itself is leaking
  const snapshotCount = snapshots.length;
  const memoryGrowth = (snapshots[snapshots.length - 1].memory.heapUsed - snapshots[0].memory.heapUsed) / 1024 / 1024;
  const memoryPerSnapshot = memoryGrowth / snapshotCount;
  
  console.log(`   📸 Snapshot System: ${memoryPerSnapshot.toFixed(3)}MB per snapshot`);
  if (memoryPerSnapshot > 0.1) {
    console.log(`      ⚠️  Snapshot system may be accumulating data`);
  }
  
  // Analyze memory pressure correlation
  console.log('\n📈 Memory Pressure Correlation:');
  console.log('─'.repeat(80));
  
  const pressureGroups: Record<string, { count: number; avgMemory: number; avgObjects: number }> = {};
  
  snapshots.forEach(snap => {
    const pressure = snap.reasoning.memoryPressure;
    if (!pressureGroups[pressure]) {
      pressureGroups[pressure] = { count: 0, avgMemory: 0, avgObjects: 0 };
    }
    pressureGroups[pressure].count++;
    pressureGroups[pressure].avgMemory += snap.memory.heapUsed;
    pressureGroups[pressure].avgObjects += snap.automatonState.objectCount;
  });
  
  Object.entries(pressureGroups).forEach(([pressure, stats]) => {
    stats.avgMemory /= stats.count;
    stats.avgObjects /= stats.count;
    console.log(`   ${pressure.toUpperCase()}: ${stats.count} snapshots`);
    console.log(`      Avg Memory: ${(stats.avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`      Avg Objects: ${stats.avgObjects.toFixed(0)}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('─'.repeat(80));
  
  if (avgMemoryWithoutObjects > 1024 * 1024) { // > 1MB
    console.log('   1. ⚠️  CRITICAL: Memory growing without object growth');
    console.log('      → Check for:');
    console.log('         - Unclosed file handles');
    console.log('         - Growing arrays (executionHistory, call stacks)');
    console.log('         - Event listeners not being removed');
    console.log('         - Cached data structures');
  }
  
  if (maxHistory > 1000) {
    console.log('   2. ⚠️  Execution history too large');
    console.log(`      → Current: ${maxHistory} entries`);
    console.log('      → Implement: History trimming (keep last N entries)');
  }
  
  if (memoryPerSnapshot > 0.1) {
    console.log('   3. ⚠️  Snapshot system accumulating memory');
    console.log('      → Implement: Snapshot cleanup (delete old snapshots)');
    console.log('      → Or: Use streaming snapshot format');
  }
  
  if (fileSizes[fileSizes.length - 1] > fileSizes[0] * 2) {
    console.log('   4. ⚠️  File size doubling');
    console.log('      → Check: Object duplication in automaton.jsonl');
    console.log('      → Implement: Deduplication logic');
  }
  
  console.log('\n' + '='.repeat(80));
}

function checkAutomatonFile(): void {
  console.log('\n🔍 Analyzing automaton.jsonl for leaks:\n');
  
  if (!fs.existsSync(AUTOMATON_FILE)) {
    console.log('❌ File not found:', AUTOMATON_FILE);
    return;
  }
  
  const content = fs.readFileSync(AUTOMATON_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());
  
  // Check for duplicate IDs
  const ids = new Set<string>();
  const duplicates: string[] = [];
  
  lines.forEach((line, idx) => {
    try {
      const obj = JSON.parse(line);
      if (obj.id) {
        if (ids.has(obj.id)) {
          duplicates.push(`Line ${idx + 1}: ${obj.id}`);
        }
        ids.add(obj.id);
      }
    } catch (e) {
      // Skip invalid JSON
    }
  });
  
  console.log(`   Total Lines: ${lines.length}`);
  console.log(`   Unique IDs: ${ids.size}`);
  console.log(`   Duplicate IDs: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n   ⚠️  Duplicate IDs found (first 10):');
    duplicates.slice(0, 10).forEach(dup => console.log(`      ${dup}`));
  }
  
  // Check for growing arrays in objects
  const largeArrays: Array<{ line: number; id: string; field: string; size: number }> = [];
  
  lines.forEach((line, idx) => {
    try {
      const obj = JSON.parse(line);
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 100) {
          largeArrays.push({ line: idx + 1, id: obj.id || 'unknown', field: key, size: value.length });
        }
      });
    } catch (e) {
      // Skip
    }
  });
  
  if (largeArrays.length > 0) {
    console.log('\n   ⚠️  Large arrays found:');
    largeArrays.slice(0, 10).forEach(arr => {
      console.log(`      Line ${arr.line} (${arr.id}): ${arr.field} = ${arr.size} items`);
    });
  }
}

function main() {
  analyzeMemoryLeak();
  checkAutomatonFile();
  
  console.log('\n✅ Investigation complete');
  console.log('\n📝 Next Steps:');
  console.log('   1. Review recommendations above');
  console.log('   2. Implement fixes in advanced-automaton.ts');
  console.log('   3. Add object trimming and GC triggers');
  console.log('   4. Re-run monitoring to verify fixes');
}

if (require.main === module) {
  main();
}

export { analyzeMemoryLeak, checkAutomatonFile };
