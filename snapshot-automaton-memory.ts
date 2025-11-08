#!/usr/bin/env tsx
/**
 * Memory-Aware Automaton Snapshot Monitor
 * Monitors at 1ms intervals with memory tracking and spawns optimized versions
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

interface MemorySnapshot {
  timestamp: number;
  isoTime: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    systemTotal: number;
    systemFree: number;
  };
  automatonState: {
    objectCount: number;
    selfModificationCount: number;
    currentDimension: number;
    executionHistoryLength: number;
  };
  fileStats: {
    size: number;
    mtime: number;
    lineCount: number;
  };
  performance: {
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
  reasoning: {
    newObjects: number;
    newModifications: number;
    memoryDelta: number;
    memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  };
}

const SNAPSHOT_INTERVAL = 1; // 1ms intervals
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots-memory');
const AUTOMATON_FILE = path.join(__dirname, 'automaton.jsonl');
const MEMORY_THRESHOLD_LOW = 50 * 1024 * 1024; // 50MB
const MEMORY_THRESHOLD_MEDIUM = 200 * 1024 * 1024; // 200MB
const MEMORY_THRESHOLD_HIGH = 500 * 1024 * 1024; // 500MB
const MEMORY_THRESHOLD_CRITICAL = 1000 * 1024 * 1024; // 1GB

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

let previousSnapshot: MemorySnapshot | null = null;
let snapshotCount = 0;
let spawnedProcesses: ChildProcess[] = [];
let memoryHistory: number[] = [];

function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

function getSystemMemory(): { total: number; free: number } {
  const total = os.totalmem();
  const free = os.freemem();
  return { total, free };
}

function assessMemoryPressure(memory: NodeJS.MemoryUsage): 'low' | 'medium' | 'high' | 'critical' {
  const heapUsed = memory.heapUsed;
  
  if (heapUsed < MEMORY_THRESHOLD_LOW) return 'low';
  if (heapUsed < MEMORY_THRESHOLD_MEDIUM) return 'medium';
  if (heapUsed < MEMORY_THRESHOLD_HIGH) return 'high';
  return 'critical';
}

function readAutomatonFile(): { objects: any[]; lineCount: number } {
  if (!fs.existsSync(AUTOMATON_FILE)) {
    return { objects: [], lineCount: 0 };
  }

  const content = fs.readFileSync(AUTOMATON_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());
  const objects = lines.map((line, idx) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  return { objects, lineCount: lines.length };
}

async function getAutomatonState(): Promise<any> {
  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:5555'}/api/automaton/state`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // API not available, use file-based state
  }
  return null;
}

function analyzeReasoning(current: MemorySnapshot, previous: MemorySnapshot | null): MemorySnapshot['reasoning'] {
  if (!previous) {
    return {
      newObjects: current.automatonState.objectCount,
      newModifications: current.automatonState.selfModificationCount,
      memoryDelta: 0,
      memoryPressure: current.reasoning.memoryPressure
    };
  }

  const newObjects = current.automatonState.objectCount - previous.automatonState.objectCount;
  const newModifications = current.automatonState.selfModificationCount - previous.automatonState.selfModificationCount;
  const memoryDelta = current.memory.heapUsed - previous.memory.heapUsed;
  const memoryPressure = assessMemoryPressure(current.memory);

  return {
    newObjects,
    newModifications,
    memoryDelta,
    memoryPressure
  };
}

async function takeSnapshot(): Promise<MemorySnapshot> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const memory = getMemoryUsage();
  const systemMem = getSystemMemory();
  const cpuUsage = process.cpuUsage();
  
  // Read file state
  const { objects, lineCount } = readAutomatonFile();
  const fileStats = fs.statSync(AUTOMATON_FILE);
  
  // Try to get API state
  const apiState = await getAutomatonState();
  
  const automatonState = {
    objectCount: objects.length,
    selfModificationCount: apiState?.selfModificationCount || objects.filter((obj: any) => 
      obj.currentState === 'modified' || obj.currentState === 'evolved'
    ).length,
    currentDimension: apiState?.currentDimension || apiState?.status?.currentDimension || 0,
    executionHistoryLength: apiState?.executionHistory?.length || 0
  };

  const snapshot: MemorySnapshot = {
    timestamp: now,
    isoTime,
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss,
      systemTotal: systemMem.total,
      systemFree: systemMem.free
    },
    automatonState,
    fileStats: {
      size: fileStats.size,
      mtime: fileStats.mtimeMs,
      lineCount
    },
    performance: {
      cpuUsage,
      uptime: process.uptime()
    },
    reasoning: {
      newObjects: 0,
      newModifications: 0,
      memoryDelta: 0,
      memoryPressure: assessMemoryPressure(memory)
    }
  };

  // Analyze reasoning compared to previous
  snapshot.reasoning = analyzeReasoning(snapshot, previousSnapshot);
  
  // Track memory history
  memoryHistory.push(memory.heapUsed);
  if (memoryHistory.length > 100) {
    memoryHistory.shift();
  }

  return snapshot;
}

function saveSnapshot(snapshot: MemorySnapshot): void {
  snapshotCount++;
  const filename = `memory-snapshot-${snapshotCount.toString().padStart(6, '0')}-${snapshot.timestamp}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
}

function spawnOptimizedVersion(memoryPressure: string): void {
  const scriptPath = path.join(__dirname, 'automaton-optimized.ts');
  
  // Create optimized version script if it doesn't exist
  if (!fs.existsSync(scriptPath)) {
    const optimizedScript = `#!/usr/bin/env tsx
// Memory-optimized automaton runner
// Spawned when memory pressure is ${memoryPressure}

import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';

const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');

// Run with memory optimizations
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceeded') {
    console.warn('Memory warning:', warning.message);
  }
});

// Limit object count based on memory pressure
const MAX_OBJECTS = ${memoryPressure === 'critical' ? '500' : memoryPressure === 'high' ? '1000' : '2000'};

setInterval(() => {
  const currentCount = (automaton as any).objects?.length || 0;
  if (currentCount > MAX_OBJECTS) {
    // Trim oldest objects
    (automaton as any).objects = (automaton as any).objects.slice(-MAX_OBJECTS);
  }
  
  // Execute action
  (automaton as any).executeSelfModification();
}, 1000);
`;
    fs.writeFileSync(scriptPath, optimizedScript);
  }
  
  // Spawn optimized process
  const child = spawn('tsx', [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env, MEMORY_PRESSURE: memoryPressure }
  });
  
  spawnedProcesses.push(child);
  
  child.on('exit', (code) => {
    console.log(`Optimized process exited with code ${code}`);
    spawnedProcesses = spawnedProcesses.filter(p => p !== child);
  });
  
  console.log(`🚀 Spawned optimized version for ${memoryPressure} memory pressure`);
}

function printSnapshot(snapshot: MemorySnapshot): void {
  const memMB = snapshot.memory.heapUsed / (1024 * 1024);
  const memTotalMB = snapshot.memory.heapTotal / (1024 * 1024);
  const rssMB = snapshot.memory.rss / (1024 * 1024);
  const systemFreeMB = snapshot.memory.systemFree / (1024 * 1024);
  
  console.log(`\n📸 [${snapshotCount}] ${snapshot.isoTime}`);
  console.log(`   Objects: ${snapshot.automatonState.objectCount} | Mods: ${snapshot.automatonState.selfModificationCount} | Dim: ${snapshot.automatonState.currentDimension}D`);
  console.log(`   Memory: ${memMB.toFixed(2)}MB / ${memTotalMB.toFixed(2)}MB heap | RSS: ${rssMB.toFixed(2)}MB | System Free: ${systemFreeMB.toFixed(2)}MB`);
  console.log(`   Pressure: ${snapshot.reasoning.memoryPressure.toUpperCase()} | Δ: ${(snapshot.reasoning.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
  
  if (snapshotCount > 1 && previousSnapshot) {
    const objRate = snapshot.reasoning.newObjects / ((snapshot.timestamp - previousSnapshot.timestamp) / 1000);
    console.log(`   Rate: ${objRate.toFixed(3)} obj/sec | Memory Trend: ${snapshot.reasoning.memoryDelta > 0 ? '↑' : '↓'}`);
  }
  
  // Spawn optimized version if memory pressure is high
  if (snapshot.reasoning.memoryPressure === 'high' || snapshot.reasoning.memoryPressure === 'critical') {
    if (spawnedProcesses.length === 0) {
      spawnOptimizedVersion(snapshot.reasoning.memoryPressure);
    }
  }
}

async function main() {
  console.log('🔍 Starting Memory-Aware Automaton Snapshot Monitor');
  console.log(`   Interval: ${SNAPSHOT_INTERVAL}ms`);
  console.log(`   File: ${AUTOMATON_FILE}`);
  console.log(`   Snapshots will be saved to: ${SNAPSHOT_DIR}\n`);
  console.log(`   Memory Thresholds:`);
  console.log(`      Low: < ${MEMORY_THRESHOLD_LOW / 1024 / 1024}MB`);
  console.log(`      Medium: < ${MEMORY_THRESHOLD_MEDIUM / 1024 / 1024}MB`);
  console.log(`      High: < ${MEMORY_THRESHOLD_HIGH / 1024 / 1024}MB`);
  console.log(`      Critical: >= ${MEMORY_THRESHOLD_HIGH / 1024 / 1024}MB\n`);

  // Take initial snapshot
  const initialSnapshot = await takeSnapshot();
  previousSnapshot = initialSnapshot;
  saveSnapshot(initialSnapshot);
  printSnapshot(initialSnapshot);

  // Set up interval (1ms)
  const interval = setInterval(async () => {
    try {
      const snapshot = await takeSnapshot();
      saveSnapshot(snapshot);
      
      // Print every 100th snapshot to avoid spam
      if (snapshotCount % 100 === 0) {
        printSnapshot(snapshot);
      }
      
      previousSnapshot = snapshot;
    } catch (error) {
      console.error('❌ Error taking snapshot:', error);
    }
  }, SNAPSHOT_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping memory-aware snapshot monitor...');
    clearInterval(interval);
    
    // Kill spawned processes
    spawnedProcesses.forEach(child => {
      child.kill();
    });
    
    if (previousSnapshot) {
      console.log(`\n📊 Summary:`);
      console.log(`   Total Snapshots: ${snapshotCount}`);
      console.log(`   Final Objects: ${previousSnapshot.automatonState.objectCount}`);
      console.log(`   Final Memory: ${(previousSnapshot.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Memory Pressure: ${previousSnapshot.reasoning.memoryPressure}`);
      console.log(`   Spawned Processes: ${spawnedProcesses.length}`);
    }
    
    process.exit(0);
  });

  console.log('\n⏳ Monitoring at 1ms intervals... Press Ctrl+C to stop\n');
}

if (require.main === module) {
  main().catch(console.error);
}

export { takeSnapshot, MemorySnapshot, spawnOptimizedVersion };
