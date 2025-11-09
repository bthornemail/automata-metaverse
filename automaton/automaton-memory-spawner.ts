#!/usr/bin/env tsx
/**
 * Memory-Aware Automaton Spawner
 * Watches memory and spawns optimized versions based on memory pressure
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface MemoryState {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  systemFree: number;
  systemTotal: number;
  pressure: 'low' | 'medium' | 'high' | 'critical';
}

const MEMORY_CHECK_INTERVAL = 1; // 1ms
const MEMORY_THRESHOLD_LOW = 50 * 1024 * 1024; // 50MB
const MEMORY_THRESHOLD_MEDIUM = 200 * 1024 * 1024; // 200MB
const MEMORY_THRESHOLD_HIGH = 500 * 1024 * 1024; // 500MB
const MEMORY_THRESHOLD_CRITICAL = 1000 * 1024 * 1024; // 1GB

let spawnedProcesses: Map<string, ChildProcess> = new Map();
let memoryHistory: MemoryState[] = [];
let lastSpawnTime = 0;
const SPAWN_COOLDOWN = 5000; // 5 seconds between spawns

function getMemoryState(): MemoryState {
  const mem = process.memoryUsage();
  const systemMem = { total: os.totalmem(), free: os.freemem() };
  
  let pressure: 'low' | 'medium' | 'high' | 'critical';
  if (mem.heapUsed < MEMORY_THRESHOLD_LOW) {
    pressure = 'low';
  } else if (mem.heapUsed < MEMORY_THRESHOLD_MEDIUM) {
    pressure = 'medium';
  } else if (mem.heapUsed < MEMORY_THRESHOLD_HIGH) {
    pressure = 'high';
  } else {
    pressure = 'critical';
  }
  
  return {
    ...mem,
    systemFree: systemMem.free,
    systemTotal: systemMem.total,
    pressure
  };
}

function createOptimizedScript(pressure: string, maxObjects: number): string {
  const scriptPath = path.join(__dirname, `automaton-optimized-${pressure}.ts`);
  
  const script = `#!/usr/bin/env tsx
/**
 * Memory-Optimized Automaton Runner
 * Spawned for ${pressure} memory pressure
 * Max Objects: ${maxObjects}
 */

import { MemoryOptimizedAutomaton } from './automaton-memory-optimized';

const MAX_OBJECTS = ${maxObjects};
const OPTIMIZATION_MODE = '${pressure}';

console.log(\`🚀 Starting optimized automaton (${pressure} pressure, max ${maxObjects} objects)\`);

// Create memory-optimized automaton with pressure-specific config
const config = {
  maxObjects: ${maxObjects},
  maxExecutionHistory: ${pressure === 'critical' ? 100 : pressure === 'high' ? 250 : 500},
  gcInterval: ${pressure === 'critical' ? 2000 : pressure === 'high' ? 3000 : 5000},
  trimInterval: ${pressure === 'critical' ? 5000 : pressure === 'high' ? 7000 : 10000},
  memoryPressureThreshold: ${pressure === 'critical' ? 100 : pressure === 'high' ? 150 : 200},
  enableGC: true,
};

const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', config);

// Execute self-modification with rate limiting based on pressure
const modificationInterval = ${pressure === 'critical' ? 5000 : pressure === 'high' ? 2000 : 1000};

setInterval(() => {
  try {
    automaton.executeSelfModification();
  } catch (error) {
    console.error('Error in optimized automaton:', error);
  }
}, modificationInterval);

// Monitor memory
setInterval(() => {
  const mem = process.memoryUsage();
  const memMB = mem.heapUsed / 1024 / 1024;
  const objCount = (automaton as any).objects?.length || 0;
  const historyLength = (automaton as any).executionHistory?.length || 0;
  console.log(\`[${pressure.toUpperCase()}] Objects: \${objCount}, History: \${historyLength}, Memory: \${memMB.toFixed(2)}MB\`);
}, 10000);

// Handle shutdown
process.on('SIGINT', () => {
  automaton.destroy();
  process.exit(0);
});

console.log('✅ Optimized automaton running');
`;
  
  fs.writeFileSync(scriptPath, script);
  return scriptPath;
}

function spawnOptimizedVersion(pressure: string): void {
  const now = Date.now();
  
  // Cooldown check
  if (now - lastSpawnTime < SPAWN_COOLDOWN) {
    return;
  }
  
  // Don't spawn if already spawned for this pressure
  if (spawnedProcesses.has(pressure)) {
    const existing = spawnedProcesses.get(pressure);
    if (existing && !existing.killed) {
      return;
    }
  }
  
  // Determine max objects based on pressure
  const maxObjects = pressure === 'critical' ? 500 :
                    pressure === 'high' ? 1000 :
                    pressure === 'medium' ? 2000 : 5000;
  
  const scriptPath = createOptimizedScript(pressure, maxObjects);
  
  console.log(`\n🚀 Spawning optimized version for ${pressure.toUpperCase()} memory pressure`);
  console.log(`   Script: ${scriptPath}`);
  console.log(`   Max Objects: ${maxObjects}`);
  
  const child = spawn('tsx', [scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      MEMORY_PRESSURE: pressure,
      NODE_OPTIONS: '--max-old-space-size=512' // Limit heap for spawned process
    },
    detached: false
  });
  
  spawnedProcesses.set(pressure, child);
  lastSpawnTime = now;
  
  // Log output
  child.stdout?.on('data', (data) => {
    console.log(`[${pressure}] ${data.toString().trim()}`);
  });
  
  child.stderr?.on('data', (data) => {
    console.error(`[${pressure}-ERR] ${data.toString().trim()}`);
  });
  
  child.on('exit', (code) => {
    console.log(`[${pressure}] Process exited with code ${code}`);
    spawnedProcesses.delete(pressure);
  });
  
  child.on('error', (error) => {
    console.error(`[${pressure}] Spawn error:`, error);
    spawnedProcesses.delete(pressure);
  });
}

function monitorMemory(): void {
  const state = getMemoryState();
  memoryHistory.push(state);
  
  // Keep last 1000 samples
  if (memoryHistory.length > 1000) {
    memoryHistory.shift();
  }
  
  // Force GC when memory pressure is MEDIUM or higher
  if (state.pressure === 'medium' && global.gc) {
    // Only GC every 5 seconds to avoid performance impact
    const lastGC = (global as any).lastGC || 0;
    if (Date.now() - lastGC > 5000) {
      global.gc();
      (global as any).lastGC = Date.now();
      console.log(`🧹 GC triggered (MEDIUM pressure)`);
    }
  }
  
  // Check if we need to spawn optimized version
  if (state.pressure === 'high' || state.pressure === 'critical') {
    spawnOptimizedVersion(state.pressure);
  }
  
  // Log every 100ms
  if (memoryHistory.length % 100 === 0) {
    const memMB = state.heapUsed / 1024 / 1024;
    const rssMB = state.rss / 1024 / 1024;
    const systemFreeMB = state.systemFree / 1024 / 1024;
    
    console.log(`💾 Memory: ${memMB.toFixed(2)}MB heap | ${rssMB.toFixed(2)}MB RSS | ${systemFreeMB.toFixed(2)}MB free | Pressure: ${state.pressure.toUpperCase()}`);
    console.log(`   Spawned Processes: ${spawnedProcesses.size} (${Array.from(spawnedProcesses.keys()).join(', ')})`);
    
    // Warn if memory is growing rapidly
    if (memoryHistory.length >= 10) {
      const recent = memoryHistory.slice(-10);
      const memGrowth = (recent[recent.length - 1].heapUsed - recent[0].heapUsed) / 1024 / 1024;
      if (memGrowth > 10) {
        console.log(`   ⚠️  Rapid memory growth detected: +${memGrowth.toFixed(2)}MB in last 10 samples`);
      }
    }
  }
}

function main() {
  console.log('🔍 Starting Memory-Aware Automaton Spawner');
  console.log(`   Check Interval: ${MEMORY_CHECK_INTERVAL}ms`);
  console.log(`   Memory Thresholds:`);
  console.log(`      Low: < ${MEMORY_THRESHOLD_LOW / 1024 / 1024}MB`);
  console.log(`      Medium: < ${MEMORY_THRESHOLD_MEDIUM / 1024 / 1024}MB`);
  console.log(`      High: < ${MEMORY_THRESHOLD_HIGH / 1024 / 1024}MB`);
  console.log(`      Critical: >= ${MEMORY_THRESHOLD_HIGH / 1024 / 1024}MB`);
  console.log(`   Spawn Cooldown: ${SPAWN_COOLDOWN}ms\n`);
  
  // Start monitoring
  const interval = setInterval(monitorMemory, MEMORY_CHECK_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping memory spawner...');
    clearInterval(interval);
    
    // Kill all spawned processes
    spawnedProcesses.forEach((child, pressure) => {
      console.log(`   Killing ${pressure} process...`);
      child.kill();
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Memory Samples: ${memoryHistory.length}`);
    if (memoryHistory.length > 0) {
      const avgMem = memoryHistory.reduce((sum, s) => sum + s.heapUsed, 0) / memoryHistory.length / 1024 / 1024;
      const maxMem = Math.max(...memoryHistory.map(s => s.heapUsed)) / 1024 / 1024;
      console.log(`   Average Memory: ${avgMem.toFixed(2)}MB`);
      console.log(`   Peak Memory: ${maxMem.toFixed(2)}MB`);
    }
    console.log(`   Processes Spawned: ${spawnedProcesses.size}`);
    
    process.exit(0);
  });
  
  console.log('⏳ Monitoring memory at 1ms intervals... Press Ctrl+C to stop\n');
}

if (require.main === module) {
  main();
}

export { monitorMemory, spawnOptimizedVersion, getMemoryState };
