#!/usr/bin/env tsx
/**
 * Memory-Optimized Automaton with Leak Fixes
 * Implements: GC triggers, object trimming, execution history limits
 */

import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';
import * as fs from 'fs';
import * as path from 'path';

interface MemoryOptimizationConfig {
  maxObjects: number;
  maxExecutionHistory: number;
  gcInterval: number; // ms
  trimInterval: number; // ms
  memoryPressureThreshold: number; // MB
  enableGC: boolean;
}

class MemoryOptimizedAutomaton extends AdvancedSelfReferencingAutomaton {
  private config: MemoryOptimizationConfig;
  private gcTimer?: NodeJS.Timeout;
  private trimTimer?: NodeJS.Timeout;
  private lastGCTime: number = 0;
  private lastTrimTime: number = 0;

  constructor(filePath: string, config?: Partial<MemoryOptimizationConfig>) {
    super(filePath);
    
    this.config = {
      maxObjects: config?.maxObjects || 2000,
      maxExecutionHistory: config?.maxExecutionHistory || 500,
      gcInterval: config?.gcInterval || 5000, // 5 seconds
      trimInterval: config?.trimInterval || 10000, // 10 seconds
      memoryPressureThreshold: config?.memoryPressureThreshold || 200, // 200MB
      enableGC: config?.enableGC ?? true,
    };
    
    this.startOptimization();
  }

  private startOptimization(): void {
    // Start GC timer
    if (this.config.enableGC) {
      this.gcTimer = setInterval(() => {
        this.forceGarbageCollection();
      }, this.config.gcInterval);
    }
    
    // Start trimming timer
    this.trimTimer = setInterval(() => {
      this.trimObjects();
      this.trimExecutionHistory();
    }, this.config.trimInterval);
    
    console.log('✅ Memory optimization started');
    console.log(`   Max Objects: ${this.config.maxObjects}`);
    console.log(`   Max Execution History: ${this.config.maxExecutionHistory}`);
    console.log(`   GC Interval: ${this.config.gcInterval}ms`);
    console.log(`   Trim Interval: ${this.config.trimInterval}ms`);
  }

  private forceGarbageCollection(): void {
    const now = Date.now();
    if (now - this.lastGCTime < this.config.gcInterval) {
      return;
    }
    
    const memBefore = process.memoryUsage();
    
    // Force GC if available (requires --expose-gc flag)
    if (global.gc) {
      global.gc();
      const memAfter = process.memoryUsage();
      const freed = (memBefore.heapUsed - memAfter.heapUsed) / 1024 / 1024;
      
      if (freed > 1) {
        console.log(`🧹 GC freed ${freed.toFixed(2)}MB`);
      }
    } else {
      // Manual cleanup hints
      this.trimObjects();
      this.trimExecutionHistory();
    }
    
    this.lastGCTime = now;
  }

  private trimObjects(): void {
    const now = Date.now();
    if (now - this.lastTrimTime < this.config.trimInterval) {
      return;
    }
    
    const objects = (this as any).objects || [];
    const memUsage = process.memoryUsage();
    const memMB = memUsage.heapUsed / 1024 / 1024;
    
    // Trim if over limit or memory pressure
    if (objects.length > this.config.maxObjects || memMB > this.config.memoryPressureThreshold) {
      const toRemove = Math.max(
        objects.length - this.config.maxObjects,
        Math.floor(objects.length * 0.1) // Remove 10% if over pressure threshold
      );
      
      if (toRemove > 0) {
        // Keep most recent objects, remove oldest
        (this as any).objects = objects.slice(toRemove);
        console.log(`✂️  Trimmed ${toRemove} objects (${objects.length} → ${(this as any).objects.length})`);
        
        // Save after trimming
        this.save();
      }
    }
    
    this.lastTrimTime = now;
  }

  private trimExecutionHistory(): void {
    const history = (this as any).executionHistory || [];
    
    if (history.length > this.config.maxExecutionHistory) {
      const toRemove = history.length - this.config.maxExecutionHistory;
      (this as any).executionHistory = history.slice(toRemove);
      console.log(`✂️  Trimmed ${toRemove} execution history entries (${history.length} → ${(this as any).executionHistory.length})`);
    }
  }

  // Override executeSelfModification to add memory checks
  executeSelfModification(): void {
    // Check memory before execution
    const memBefore = process.memoryUsage();
    const memMB = memBefore.heapUsed / 1024 / 1024;
    
    // Trim if memory pressure is high
    if (memMB > this.config.memoryPressureThreshold) {
      this.trimObjects();
      this.trimExecutionHistory();
    }
    
    // Call parent method
    super.executeSelfModification();
    
    // Check memory after execution
    const memAfter = process.memoryUsage();
    const memDelta = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
    
    if (memDelta > 5) { // > 5MB growth
      console.log(`⚠️  Large memory growth detected: +${memDelta.toFixed(2)}MB`);
      this.forceGarbageCollection();
    }
  }

  // Override methods that add to execution history
  private addToHistory(entry: any): void {
    const history = (this as any).executionHistory || [];
    history.push(entry);
    
    // Trim if over limit
    if (history.length > this.config.maxExecutionHistory) {
      (this as any).executionHistory = history.slice(-this.config.maxExecutionHistory);
    }
  }

  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    if (this.trimTimer) {
      clearInterval(this.trimTimer);
    }
    console.log('🛑 Memory optimization stopped');
  }
}

// Export for use in spawner
export { MemoryOptimizedAutomaton, MemoryOptimizationConfig };

// If run directly, create optimized instance
if (require.main === module) {
  const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', {
    maxObjects: 2000,
    maxExecutionHistory: 500,
    gcInterval: 5000,
    trimInterval: 10000,
    memoryPressureThreshold: 200,
    enableGC: true,
  });
  
  // Run self-modification loop
  setInterval(() => {
    automaton.executeSelfModification();
  }, 1000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    automaton.destroy();
    process.exit(0);
  });
  
  console.log('🚀 Memory-optimized automaton running...');
}
