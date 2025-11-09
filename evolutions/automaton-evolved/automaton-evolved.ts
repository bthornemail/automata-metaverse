#!/usr/bin/env tsx
/**
 * Evolved Automaton - Implements Snapshot Analysis Recommendations
 * 
 * Recommendations Implemented:
 * 1. Enable dimension progression (removed 0D lock)
 * 2. Increase modification frequency (faster intervals)
 * 3. Monitor Phase 4 growth (memory growth tracking)
 */

import { MemoryOptimizedAutomaton } from '../automaton-memory-optimized/automaton-memory-optimized';
import * as fs from 'fs';
import * as path from 'path';

interface EvolvedConfig {
  // Dimension progression
  enableDimensionProgression: boolean;
  dimensionProgressionInterval: number; // ms between dimension checks
  
  // Modification frequency
  modificationInterval: number; // ms between modifications
  burstModifications: number; // number of modifications per burst
  
  // Phase 4 growth monitoring
  enablePhase4Monitoring: boolean;
  phase4Threshold: number; // MB threshold for Phase 4 detection
  phase4GrowthRateThreshold: number; // MB/sec threshold
  phase4CheckInterval: number; // ms between Phase 4 checks
}

class EvolvedAutomaton extends MemoryOptimizedAutomaton {
  private evolvedConfig: EvolvedConfig;
  private modificationTimer?: NodeJS.Timeout;
  private dimensionProgressionTimer?: NodeJS.Timeout;
  private phase4MonitorTimer?: NodeJS.Timeout;
  private memoryHistory: Array<{ timestamp: number; memory: number }> = [];
  private phase4Detected: boolean = false;
  private lastDimension: number = 0;
  private dimensionProgressionCount: number = 0;
  
  constructor(filePath: string, config?: Partial<EvolvedConfig>) {
    // Initialize with dimension progression enabled (no lock)
    super(filePath, {
      maxObjects: 2000,
      maxExecutionHistory: 500,
      gcInterval: 5000,
      trimInterval: 10000,
      memoryPressureThreshold: 200,
      enableGC: true,
      // Disable dimension locking - enable progression
      lockDimension: undefined,
      dimension0Focus: false,
    });
    
    this.evolvedConfig = {
      enableDimensionProgression: config?.enableDimensionProgression ?? true,
      dimensionProgressionInterval: config?.dimensionProgressionInterval || 5000, // 5 seconds
      modificationInterval: config?.modificationInterval || 100, // 100ms (10x faster)
      burstModifications: config?.burstModifications || 3, // 3 modifications per burst
      enablePhase4Monitoring: config?.enablePhase4Monitoring ?? true,
      phase4Threshold: config?.phase4Threshold || 50, // 50MB threshold
      phase4GrowthRateThreshold: config?.phase4GrowthRateThreshold || 0.1, // 0.1 MB/sec
      phase4CheckInterval: config?.phase4CheckInterval || 10000, // 10 seconds
    };
    
    this.lastDimension = (this as any).currentDimension || 0;
    
    // Reduced verbosity for testing
    if (process.env.VERBOSE === 'true') {
      console.log('🚀 Evolved Automaton initialized');
      console.log(`   Dimension Progression: ${this.evolvedConfig.enableDimensionProgression ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Modification Interval: ${this.evolvedConfig.modificationInterval}ms`);
      console.log(`   Burst Modifications: ${this.evolvedConfig.burstModifications}`);
      console.log(`   Phase 4 Monitoring: ${this.evolvedConfig.enablePhase4Monitoring ? '✅ Enabled' : '❌ Disabled'}`);
    }
    
    this.startEvolvedFeatures();
  }
  
  private startEvolvedFeatures(): void {
    // Start high-frequency modification loop
    this.modificationTimer = setInterval(() => {
      this.executeBurstModifications();
    }, this.evolvedConfig.modificationInterval);
    
    // Start dimension progression
    if (this.evolvedConfig.enableDimensionProgression) {
      this.dimensionProgressionTimer = setInterval(() => {
        this.progressDimension();
      }, this.evolvedConfig.dimensionProgressionInterval);
    }
    
    // Start Phase 4 monitoring
    if (this.evolvedConfig.enablePhase4Monitoring) {
      this.phase4MonitorTimer = setInterval(() => {
        this.monitorPhase4Growth();
      }, this.evolvedConfig.phase4CheckInterval);
    }
  }
  
  private executeBurstModifications(): void {
    // Execute multiple modifications in a burst for higher frequency
    for (let i = 0; i < this.evolvedConfig.burstModifications; i++) {
      try {
        this.executeSelfModification();
      } catch (error) {
        // Only log errors in verbose mode
        if (process.env.VERBOSE === 'true') {
          console.error(`Burst modification ${i + 1} error:`, error);
        }
      }
    }
  }
  
  private progressDimension(): void {
    const currentDim = (this as any).currentDimension || 0;
    
    // Only progress if we've been at current dimension for a while
    // This prevents rapid cycling
    if (currentDim === this.lastDimension) {
      // Check if we should progress
      const shouldProgress = Math.random() > 0.3; // 70% chance to progress
      
      if (shouldProgress) {
        const nextDimension = (currentDim + 1) % 8;
        (this as any).currentDimension = nextDimension;
        this.dimensionProgressionCount++;
        
        // Reduced verbosity - only log significant progressions
        if (process.env.VERBOSE === 'true' || this.dimensionProgressionCount % 5 === 0) {
          console.log(`🔄 Dimension progression: ${currentDim}D → ${nextDimension}D (Total: ${this.dimensionProgressionCount})`);
        }
        
        // Execute evolution action
        try {
          (this as any).executeEvolution();
        } catch (error) {
          console.error('Dimension progression error:', error);
        }
        
        this.lastDimension = nextDimension;
      }
    } else {
      this.lastDimension = currentDim;
    }
  }
  
  private monitorPhase4Growth(): void {
    const memUsage = process.memoryUsage();
    const memMB = memUsage.heapUsed / 1024 / 1024;
    const now = Date.now();
    
    // Add to history
    this.memoryHistory.push({ timestamp: now, memory: memMB });
    
    // Keep last 100 samples (for ~16 minutes at 10s intervals)
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
    
    // Need at least 10 samples for analysis
    if (this.memoryHistory.length < 10) {
      return;
    }
    
    // Check if we're in Phase 4 (high memory, accelerating growth)
    const recent = this.memoryHistory.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    const timeDelta = (newest.timestamp - oldest.timestamp) / 1000; // seconds
    const memoryDelta = newest.memory - oldest.memory; // MB
    const growthRate = memoryDelta / timeDelta; // MB/sec
    
    // Phase 4 detection criteria:
    // 1. Memory above threshold
    // 2. Growth rate above threshold
    // 3. Consistent growth pattern
    const isPhase4 = memMB > this.evolvedConfig.phase4Threshold &&
                     growthRate > this.evolvedConfig.phase4GrowthRateThreshold &&
                     memoryDelta > 0;
    
    if (isPhase4 && !this.phase4Detected) {
      this.phase4Detected = true;
      // Reduced verbosity - only show critical Phase 4 detection
      console.log(`⚠️  Phase 4 growth: ${memMB.toFixed(1)}MB (${growthRate.toFixed(3)}MB/s)`);
      
      // Trigger aggressive GC
      if (global.gc) {
        global.gc();
        if (process.env.VERBOSE === 'true') {
          console.log('   🧹 Aggressive GC triggered');
        }
      }
      
      // Trigger object trimming
      (this as any).trimObjects();
      (this as any).trimExecutionHistory();
    } else if (!isPhase4 && this.phase4Detected) {
      this.phase4Detected = false;
      if (process.env.VERBOSE === 'true') {
        console.log('✅ Phase 4 growth resolved - memory stabilized');
      }
    }
    
    // Reduced verbosity - only log Phase 4 status in verbose mode
    if (this.phase4Detected && process.env.VERBOSE === 'true' && this.memoryHistory.length % 10 === 0) {
      console.log(`📊 Phase 4: ${memMB.toFixed(1)}MB (${growthRate.toFixed(3)}MB/s)`);
    }
  }
  
  getStats(): any {
    const baseStats = super.getStats ? super.getStats() : {};
    const memUsage = process.memoryUsage();
    const memMB = memUsage.heapUsed / 1024 / 1024;
    
    // Calculate current growth rate
    let currentGrowthRate = 0;
    if (this.memoryHistory.length >= 2) {
      const recent = this.memoryHistory.slice(-2);
      const timeDelta = (recent[1].timestamp - recent[0].timestamp) / 1000;
      const memoryDelta = recent[1].memory - recent[0].memory;
      currentGrowthRate = memoryDelta / timeDelta;
    }
    
    return {
      ...baseStats,
      evolved: {
        dimensionProgression: {
          enabled: this.evolvedConfig.enableDimensionProgression,
          currentDimension: (this as any).currentDimension || 0,
          progressions: this.dimensionProgressionCount,
        },
        modificationFrequency: {
          interval: this.evolvedConfig.modificationInterval,
          burstSize: this.evolvedConfig.burstModifications,
          modificationsPerSecond: (1000 / this.evolvedConfig.modificationInterval) * this.evolvedConfig.burstModifications,
        },
        phase4Monitoring: {
          enabled: this.evolvedConfig.enablePhase4Monitoring,
          detected: this.phase4Detected,
          currentMemory: memMB,
          growthRate: currentGrowthRate,
          historySamples: this.memoryHistory.length,
        },
      },
    };
  }
  
  destroy(): void {
    // Stop evolved timers
    if (this.modificationTimer) {
      clearInterval(this.modificationTimer);
    }
    if (this.dimensionProgressionTimer) {
      clearInterval(this.dimensionProgressionTimer);
    }
    if (this.phase4MonitorTimer) {
      clearInterval(this.phase4MonitorTimer);
    }
    
    // Call parent destroy
    super.destroy();
    
    if (process.env.VERBOSE === 'true') {
      console.log('🛑 Evolved automaton stopped');
    }
  }
}

// Export for use in other modules
export { EvolvedAutomaton, EvolvedConfig };

// If run directly, start evolved automaton
if (require.main === module) {
  const args = process.argv.slice(2);
  const modificationInterval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
  const burstSize = args.find(arg => arg.startsWith('--burst='))?.split('=')[1];
  const noDimensionProgression = args.includes('--no-dimension-progression');
  const noPhase4Monitoring = args.includes('--no-phase4-monitoring');
  
  const automaton = new EvolvedAutomaton('./automaton.jsonl', {
    enableDimensionProgression: !noDimensionProgression,
    modificationInterval: modificationInterval ? parseInt(modificationInterval) : 100, // 100ms default
    burstModifications: burstSize ? parseInt(burstSize) : 3,
    enablePhase4Monitoring: !noPhase4Monitoring,
  });
  
  // Print stats every 30 seconds
  setInterval(() => {
    const stats = automaton.getStats();
    // Reduced verbosity - only show stats in verbose mode
    if (process.env.VERBOSE === 'true') {
      console.log('\n📊 Evolved Automaton Stats:');
      console.log(`   Dimension: ${stats.evolved.dimensionProgression.currentDimension}D (${stats.evolved.dimensionProgression.progressions} progressions)`);
      console.log(`   Modifications/sec: ${stats.evolved.modificationFrequency.modificationsPerSecond.toFixed(1)}`);
      console.log(`   Memory: ${stats.evolved.phase4Monitoring.currentMemory.toFixed(2)}MB`);
      console.log(`   Growth Rate: ${stats.evolved.phase4Monitoring.growthRate.toFixed(4)}MB/sec`);
      console.log(`   Phase 4: ${stats.evolved.phase4Monitoring.detected ? '⚠️  DETECTED' : '✅ Normal'}`);
    }
  }, 30000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    automaton.destroy();
    process.exit(0);
  });
  
  console.log('\n💡 Usage:');
  console.log('   --interval=N        Set modification interval in ms (default: 100)');
  console.log('   --burst=N           Set burst size (default: 3)');
  console.log('   --no-dimension-progression  Disable dimension progression');
  console.log('   --no-phase4-monitoring     Disable Phase 4 monitoring');
  console.log('\n🚀 Evolved automaton running with recommendations implemented...');
}
