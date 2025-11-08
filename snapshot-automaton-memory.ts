#!/usr/bin/env tsx
/**
 * Memory-Aware Automaton Snapshot Monitor
 * Monitors at 1ms intervals with memory tracking and spawns optimized versions
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

// Type declaration for global.gc (requires --expose-gc flag)
declare global {
  var gc: (() => void) | undefined;
}

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

// Adaptive sampling configuration
const BASE_SNAPSHOT_INTERVAL = 1; // Base interval: 1ms
const IDLE_SNAPSHOT_INTERVAL = 100; // Idle interval: 100ms (reduce frequency during idle)
const ACTIVE_SNAPSHOT_INTERVAL = 1; // Active interval: 1ms (high frequency during active reasoning)
const MIN_ACTIVITY_THRESHOLD = 1; // Minimum objects/modifications to consider "active"
const IDLE_DURATION_THRESHOLD = 5000; // 5 seconds of inactivity before switching to idle mode

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots-memory');
const AUTOMATON_FILE = path.join(__dirname, 'automaton.jsonl');
const MEMORY_THRESHOLD_LOW = 50 * 1024 * 1024; // 50MB
const MEMORY_THRESHOLD_MEDIUM = 200 * 1024 * 1024; // 200MB
const MEMORY_THRESHOLD_HIGH = 500 * 1024 * 1024; // 500MB
const MEMORY_THRESHOLD_CRITICAL = 1000 * 1024 * 1024; // 1GB
const MAX_SNAPSHOTS = 1000; // Keep only last 1000 snapshots
const CLEANUP_INTERVAL = 60000; // Cleanup every 60 seconds

// Adaptive sampling state
let currentInterval = BASE_SNAPSHOT_INTERVAL;
let lastActivityTime = Date.now();
let consecutiveIdleSnapshots = 0;
let activityWindow: Array<{ timestamp: number; newObjects: number; newModifications: number }> = [];
const ACTIVITY_WINDOW_SIZE = 10; // Track last 10 snapshots for activity detection

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

let previousSnapshot: MemorySnapshot | null = null;
let snapshotCount = 0;
let spawnedProcesses: ChildProcess[] = [];
let memoryHistory: number[] = [];
let snapshotIntervalHandle: NodeJS.Timeout | null = null;

// Memory pooling for object reuse
class MemoryPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize: number = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

// Memory pool for snapshots (reuse objects to reduce allocation)
const snapshotPool = new MemoryPool<MemorySnapshot>(
  () => ({
    timestamp: 0,
    isoTime: '',
    memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, systemTotal: 0, systemFree: 0 },
    automatonState: { objectCount: 0, selfModificationCount: 0, currentDimension: 0, executionHistoryLength: 0 },
    fileStats: { size: 0, mtime: 0, lineCount: 0 },
    performance: { cpuUsage: { user: 0, system: 0 }, uptime: 0 },
    reasoning: { newObjects: 0, newModifications: 0, memoryDelta: 0, memoryPressure: 'low' }
  }),
  (snapshot) => {
    // Reset snapshot for reuse
    snapshot.timestamp = 0;
    snapshot.isoTime = '';
  },
  50 // Max pool size
);

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

function isActiveReasoning(reasoning: MemorySnapshot['reasoning']): boolean {
  return reasoning.newObjects >= MIN_ACTIVITY_THRESHOLD || 
         reasoning.newModifications >= MIN_ACTIVITY_THRESHOLD ||
         Math.abs(reasoning.memoryDelta) > 1024 * 1024; // >1MB change indicates activity
}

function updateAdaptiveSampling(reasoning: MemorySnapshot['reasoning']): void {
  const now = Date.now();
  const isActive = isActiveReasoning(reasoning);
  
  // Track activity in window
  activityWindow.push({
    timestamp: now,
    newObjects: reasoning.newObjects,
    newModifications: reasoning.newModifications
  });
  
  // Keep window size manageable
  if (activityWindow.length > ACTIVITY_WINDOW_SIZE) {
    activityWindow.shift();
  }
  
  // Calculate recent activity level
  const recentActivity = activityWindow.reduce((sum, entry) => 
    sum + entry.newObjects + entry.newModifications, 0);
  
  if (isActive || recentActivity > MIN_ACTIVITY_THRESHOLD * 2) {
    // Active reasoning detected - use high frequency
    lastActivityTime = now;
    consecutiveIdleSnapshots = 0;
    
    if (currentInterval !== ACTIVE_SNAPSHOT_INTERVAL) {
      currentInterval = ACTIVE_SNAPSHOT_INTERVAL;
      console.log(`🟢 Switching to ACTIVE sampling (${ACTIVE_SNAPSHOT_INTERVAL}ms interval)`);
      restartSnapshotInterval();
    }
  } else {
    // Idle period - check if we should reduce frequency
    consecutiveIdleSnapshots++;
    const timeSinceActivity = now - lastActivityTime;
    
    if (timeSinceActivity > IDLE_DURATION_THRESHOLD && currentInterval !== IDLE_SNAPSHOT_INTERVAL) {
      currentInterval = IDLE_SNAPSHOT_INTERVAL;
      console.log(`🟡 Switching to IDLE sampling (${IDLE_SNAPSHOT_INTERVAL}ms interval) - ${consecutiveIdleSnapshots} idle snapshots`);
      restartSnapshotInterval();
    }
  }
}

function restartSnapshotInterval(): void {
  if (snapshotIntervalHandle) {
    clearInterval(snapshotIntervalHandle);
  }
  
  snapshotIntervalHandle = setInterval(async () => {
    try {
      const snapshot = await takeSnapshot();
      
      // Only save snapshots during active reasoning or periodically during idle
      const shouldSave = isActiveReasoning(snapshot.reasoning) || 
                        snapshotCount % 10 === 0; // Save every 10th snapshot during idle
      
      if (shouldSave) {
        saveSnapshot(snapshot);
      }
      
      // Update adaptive sampling
      updateAdaptiveSampling(snapshot.reasoning);
      
      // Print every 100th saved snapshot to avoid spam
      if (shouldSave && snapshotCount % 100 === 0) {
        printSnapshot(snapshot);
      }
      
      previousSnapshot = snapshot;
    } catch (error) {
      console.error('❌ Error taking snapshot:', error);
    }
  }, currentInterval);
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

  // Use memory pool to reduce allocations
  const snapshot = snapshotPool.acquire();
  
  snapshot.timestamp = now;
  snapshot.isoTime = isoTime;
  snapshot.memory.heapUsed = memory.heapUsed;
  snapshot.memory.heapTotal = memory.heapTotal;
  snapshot.memory.external = memory.external;
  snapshot.memory.rss = memory.rss;
  snapshot.memory.systemTotal = systemMem.total;
  snapshot.memory.systemFree = systemMem.free;
  snapshot.automatonState.objectCount = automatonState.objectCount;
  snapshot.automatonState.selfModificationCount = automatonState.selfModificationCount;
  snapshot.automatonState.currentDimension = automatonState.currentDimension;
  snapshot.automatonState.executionHistoryLength = automatonState.executionHistoryLength;
  snapshot.fileStats.size = fileStats.size;
  snapshot.fileStats.mtime = fileStats.mtimeMs;
  snapshot.fileStats.lineCount = lineCount;
  snapshot.performance.cpuUsage = cpuUsage;
  snapshot.performance.uptime = process.uptime();
  snapshot.reasoning.memoryPressure = assessMemoryPressure(memory);

  // Analyze reasoning compared to previous
  snapshot.reasoning = analyzeReasoning(snapshot, previousSnapshot);
  
  // Track memory history (limit size to reduce memory volatility)
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
  
  // Periodic cleanup: keep only last MAX_SNAPSHOTS
  if (snapshotCount % 100 === 0) {
    cleanupOldSnapshots();
  }
}

function cleanupOldSnapshots(): void {
  try {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(SNAPSHOT_DIR, f),
        mtime: fs.statSync(path.join(SNAPSHOT_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first
    
    if (files.length > MAX_SNAPSHOTS) {
      const toDelete = files.slice(MAX_SNAPSHOTS);
      let deletedCount = 0;
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          deletedCount++;
        } catch (err) {
          // Ignore deletion errors
        }
      });
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old snapshots (kept ${MAX_SNAPSHOTS} most recent)`);
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
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

  // Start adaptive sampling interval
  restartSnapshotInterval();
  
  // Set up periodic cleanup and GC triggers
  const cleanupInterval = setInterval(() => {
    cleanupOldSnapshots();
    // Trigger GC if available (Node.js with --expose-gc flag)
    if (global.gc) {
      global.gc();
    }
  }, CLEANUP_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping memory-aware snapshot monitor...');
    clearInterval(interval);
    clearInterval(cleanupInterval);
    
    // Final cleanup
    cleanupOldSnapshots();
    
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

  console.log('\n⏳ Monitoring with adaptive sampling...');
  console.log(`   Base interval: ${BASE_SNAPSHOT_INTERVAL}ms`);
  console.log(`   Active interval: ${ACTIVE_SNAPSHOT_INTERVAL}ms (during reasoning)`);
  console.log(`   Idle interval: ${IDLE_SNAPSHOT_INTERVAL}ms (during inactivity)`);
  console.log(`   Activity threshold: ${MIN_ACTIVITY_THRESHOLD} objects/modifications`);
  console.log(`   Idle threshold: ${IDLE_DURATION_THRESHOLD}ms`);
  console.log('   Press Ctrl+C to stop\n');
}

if (require.main === module) {
  main().catch(console.error);
}

export { takeSnapshot, MemorySnapshot, spawnOptimizedVersion };
