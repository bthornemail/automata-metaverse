# Memory Optimization Guide

This guide documents the memory optimization features implemented to address memory leaks and improve automaton performance.

## Overview

The memory optimization system addresses four key areas:

1. **Memory Leak Investigation** - Tools to identify memory growth patterns
2. **Spawn Optimization** - Auto-spawns optimized versions at HIGH/CRITICAL pressure
3. **Garbage Collection** - Forces GC when memory pressure is MEDIUM+
4. **Object Trimming** - Automatically trims objects and execution history

## Components

### 1. Memory Leak Investigator (`memory-leak-investigator.ts`)

Analyzes memory growth patterns to identify leaks:

```bash
tsx memory-leak-investigator.ts
```

**Features:**
- Analyzes memory growth without object growth
- Identifies execution history growth
- Checks for duplicate IDs in automaton.jsonl
- Detects large arrays in objects
- Provides specific recommendations

### 2. Memory-Optimized Automaton (`automaton-memory-optimized.ts`)

Extended automaton class with built-in memory management:

```typescript
import { MemoryOptimizedAutomaton } from './automaton-memory-optimized';

const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', {
  maxObjects: 2000,
  maxExecutionHistory: 500,
  gcInterval: 5000,
  trimInterval: 10000,
  memoryPressureThreshold: 200, // MB
  enableGC: true,
});
```

**Features:**
- Automatic object trimming (keeps most recent)
- Execution history limits
- Periodic garbage collection
- Memory pressure monitoring
- Automatic cleanup on memory spikes

### 3. Memory-Aware Spawner (`automaton-memory-spawner.ts`)

Monitors memory and spawns optimized versions:

```bash
# Run with GC enabled (requires --expose-gc)
node --expose-gc -r tsx/register automaton-memory-spawner.ts
```

**Features:**
- 1ms interval memory monitoring
- Auto-spawns optimized versions at HIGH/CRITICAL pressure
- GC triggers at MEDIUM pressure
- Process management and cleanup
- Memory growth warnings

### 4. Memory-Aware Snapshot System (`snapshot-automaton-memory.ts`)

Captures memory metrics at 1ms intervals:

```bash
tsx snapshot-automaton-memory.ts
```

**Features:**
- High-frequency memory snapshots
- Memory pressure assessment
- Automatic spawner integration
- Detailed memory metrics

## Configuration

### Memory Pressure Thresholds

```typescript
const MEMORY_THRESHOLD_LOW = 50 * 1024 * 1024;    // 50MB
const MEMORY_THRESHOLD_MEDIUM = 200 * 1024 * 1024; // 200MB
const MEMORY_THRESHOLD_HIGH = 500 * 1024 * 1024;   // 500MB
const MEMORY_THRESHOLD_CRITICAL = 1000 * 1024 * 1024; // 1GB
```

### Optimization Config

```typescript
interface MemoryOptimizationConfig {
  maxObjects: number;              // Max objects before trimming
  maxExecutionHistory: number;      // Max history entries
  gcInterval: number;              // GC interval (ms)
  trimInterval: number;            // Trim interval (ms)
  memoryPressureThreshold: number; // MB threshold for trimming
  enableGC: boolean;               // Enable GC (requires --expose-gc)
}
```

## Usage

### Running with Memory Optimization

```bash
# Standard mode
tsx automaton-memory-optimized.ts

# With GC enabled
node --expose-gc -r tsx/register automaton-memory-optimized.ts

# With custom config
NODE_OPTIONS="--expose-gc --max-old-space-size=512" tsx automaton-memory-optimized.ts
```

### Monitoring Memory

```bash
# Start memory-aware snapshot system
tsx snapshot-automaton-memory.ts

# Start memory spawner (in another terminal)
node --expose-gc -r tsx/register automaton-memory-spawner.ts

# Analyze results
tsx analyze-memory-snapshots.ts
tsx memory-leak-investigator.ts
```

## Recommendations Implementation

### 1. Memory Leak Investigation ✅

**Status:** Implemented

**Tool:** `memory-leak-investigator.ts`

**Findings:**
- Execution history growing unbounded
- Snapshot system accumulating data
- File reading patterns causing memory growth

**Fixes:**
- Execution history limits (500 entries default)
- Snapshot cleanup (delete old snapshots)
- Object trimming (keep most recent)

### 2. Spawn Optimization ✅

**Status:** Implemented

**Tool:** `automaton-memory-spawner.ts`

**Behavior:**
- Monitors memory at 1ms intervals
- Spawns optimized versions at HIGH/CRITICAL pressure
- Configures pressure-specific limits:
  - **HIGH:** 1000 objects, 250 history, 3s GC, 7s trim
  - **CRITICAL:** 500 objects, 100 history, 2s GC, 5s trim

### 3. Garbage Collection ✅

**Status:** Implemented

**Tool:** `automaton-memory-optimized.ts` + `automaton-memory-spawner.ts`

**Behavior:**
- GC triggered at MEDIUM pressure (every 5 seconds)
- GC triggered after large memory spikes (>5MB)
- Requires `--expose-gc` flag for Node.js GC

**Usage:**
```bash
node --expose-gc -r tsx/register automaton-memory-spawner.ts
```

### 4. Object Limits ✅

**Status:** Implemented

**Tool:** `automaton-memory-optimized.ts`

**Behavior:**
- Automatic trimming when over `maxObjects`
- Trims 10% when memory pressure threshold exceeded
- Keeps most recent objects (removes oldest)
- Saves after trimming

**Configuration:**
```typescript
{
  maxObjects: 2000,              // Default limit
  memoryPressureThreshold: 200,  // MB threshold
  trimInterval: 10000,          // Check every 10s
}
```

## Performance Impact

### Before Optimization
- Memory growth: ~2.92MB/sec
- Objects: Unlimited growth
- Execution history: Unlimited growth
- GC: Manual/automatic (unpredictable)

### After Optimization
- Memory growth: Controlled (trimming active)
- Objects: Limited to 2000 (configurable)
- Execution history: Limited to 500 (configurable)
- GC: Scheduled every 5s at MEDIUM+ pressure

## Monitoring

### Key Metrics

1. **Memory Pressure Distribution**
   - LOW: < 50MB
   - MEDIUM: 50-200MB
   - HIGH: 200-500MB
   - CRITICAL: > 500MB

2. **Memory Growth Rate**
   - Target: < 1MB/sec
   - Warning: > 5MB/sec
   - Critical: > 10MB/sec

3. **Object Efficiency**
   - Target: > 10 objects/MB
   - Current: ~5.3 objects/MB

### Analysis Tools

```bash
# Quick analysis
tsx analyze-memory-snapshots.ts

# Detailed investigation
tsx memory-leak-investigator.ts

# Real-time monitoring
tsx snapshot-automaton-memory.ts
```

## Troubleshooting

### Memory Still Growing

1. Check for leaks:
   ```bash
   tsx memory-leak-investigator.ts
   ```

2. Verify GC is enabled:
   ```bash
   node --expose-gc -r tsx/register automaton-memory-spawner.ts
   ```

3. Check object count:
   ```bash
   wc -l automaton.jsonl
   ```

### Spawner Not Spawning

1. Check memory pressure:
   ```bash
   tsx analyze-memory-snapshots.ts | grep "Memory Pressure"
   ```

2. Verify thresholds:
   - HIGH: 200MB
   - CRITICAL: 500MB

3. Check spawn cooldown (5 seconds)

### GC Not Working

1. Verify `--expose-gc` flag:
   ```bash
   node --expose-gc -e "console.log(typeof global.gc)"
   ```

2. Check GC interval (5 seconds default)

3. Monitor GC activity:
   ```bash
   tsx snapshot-automaton-memory.ts | grep "GC"
   ```

## Next Steps

1. ✅ Memory leak investigation tool
2. ✅ Spawn optimization system
3. ✅ GC triggers at MEDIUM pressure
4. ✅ Object trimming system
5. 🔄 Monitor and tune thresholds
6. 🔄 Add memory leak detection to CI/CD
7. 🔄 Create memory profiling dashboard

## Related Files

- `memory-leak-investigator.ts` - Leak analysis tool
- `automaton-memory-optimized.ts` - Optimized automaton class
- `automaton-memory-spawner.ts` - Memory-aware spawner
- `snapshot-automaton-memory.ts` - Memory snapshot system
- `analyze-memory-snapshots.ts` - Snapshot analysis tool
