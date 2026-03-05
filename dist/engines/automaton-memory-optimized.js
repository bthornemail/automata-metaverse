#!/usr/bin/env tsx
/**
 * Memory-Optimized Automaton with Leak Fixes
 * Implements: GC triggers, object trimming, execution history limits
 */
import { AdvancedSelfReferencingAutomaton } from './advanced-automaton.js';
import { MetaLogDb } from 'meta-log-db';
class MemoryOptimizedAutomaton extends AdvancedSelfReferencingAutomaton {
    constructor(filePath, config, db) {
        super(filePath, db);
        this.lastGCTime = 0;
        this.lastTrimTime = 0;
        this.config = {
            maxObjects: config?.maxObjects || 2000,
            maxExecutionHistory: config?.maxExecutionHistory || 500,
            gcInterval: config?.gcInterval || 5000, // 5 seconds
            trimInterval: config?.trimInterval || 10000, // 10 seconds
            memoryPressureThreshold: config?.memoryPressureThreshold || 200, // 200MB
            enableGC: config?.enableGC ?? true,
            lockDimension: config?.lockDimension,
            dimension0Focus: config?.dimension0Focus ?? false,
            dimension0Probability: config?.dimension0Probability ?? 0.5,
        };
        // Lock to dimension 0 if configured
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
            if (process.env.VERBOSE === 'true') {
                console.log(`🔒 Locked to dimension ${this.config.lockDimension} for Identity Evolution`);
            }
        }
        this.startOptimization();
    }
    startOptimization() {
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
    forceGarbageCollection() {
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
                // Reduced verbosity - only log GC in verbose mode or if significant memory freed
                if (process.env.VERBOSE === 'true' || freed > 5.0) {
                    console.log(`🧹 GC freed ${freed.toFixed(2)}MB`);
                }
            }
        }
        else {
            // Manual cleanup hints
            this.trimObjects();
            this.trimExecutionHistory();
        }
        this.lastGCTime = now;
    }
    trimObjects() {
        const now = Date.now();
        if (now - this.lastTrimTime < this.config.trimInterval) {
            return;
        }
        const objects = this.objects || [];
        const memUsage = process.memoryUsage();
        const memMB = memUsage.heapUsed / 1024 / 1024;
        // Trim if over limit or memory pressure
        if (objects.length > this.config.maxObjects || memMB > this.config.memoryPressureThreshold) {
            const toRemove = Math.max(objects.length - this.config.maxObjects, Math.floor(objects.length * 0.1) // Remove 10% if over pressure threshold
            );
            if (toRemove > 0) {
                // Keep most recent objects, remove oldest
                this.objects = objects.slice(toRemove);
                console.log(`✂️  Trimmed ${toRemove} objects (${objects.length} → ${this.objects.length})`);
                // Save after trimming
                this.save();
            }
        }
        this.lastTrimTime = now;
    }
    trimExecutionHistory() {
        const history = this.executionHistory || [];
        if (history.length > this.config.maxExecutionHistory) {
            const toRemove = history.length - this.config.maxExecutionHistory;
            this.executionHistory = history.slice(toRemove);
            console.log(`✂️  Trimmed ${toRemove} execution history entries (${history.length} → ${this.executionHistory.length})`);
        }
    }
    // Override executeSelfModification to add memory checks and dimension control
    executeSelfModification() {
        // Ensure we're at dimension 0 if locked or focused
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
        }
        else if (this.config.dimension0Focus) {
            // Cycle back to dimension 0 with configured probability
            const currentDim = this.currentDimension || 0;
            if (currentDim !== 0 && Math.random() < this.config.dimension0Probability) {
                this.currentDimension = 0;
                if (process.env.VERBOSE === 'true') {
                    console.log(`🔄 Returning to dimension 0 for Identity Evolution`);
                }
            }
        }
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
        // Log Identity Evolution (0D) count
        const currentDim = this.currentDimension || 0;
        if (currentDim === 0) {
            const identityEvolutions = (this.objects || []).filter((obj) => obj.selfReference?.pattern === 'Identity Evolution (0D)').length;
            // Reduced verbosity - only log major milestones (every 500th) or in verbose mode
            if (process.env.VERBOSE === 'true' || identityEvolutions % 500 === 0) {
                console.log(`✨ Identity Evolution (0D): ${identityEvolutions} total`);
            }
        }
    }
    // Override executeAction to prevent dimension progression when locked
    executeAction(action, fromState, toState, context = {}) {
        // Prevent evolution if locked to dimension 0
        if (this.config.lockDimension !== undefined && action === 'evolve') {
            console.log(`🔒 Skipping evolution (locked to dimension ${this.config.lockDimension})`);
            return;
        }
        // Call parent method
        super.executeAction(action, fromState, toState, context);
        // Ensure we stay at dimension 0 if locked
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
        }
    }
    // Override methods that add to execution history
    addToHistory(entry) {
        const history = this.executionHistory || [];
        history.push(entry);
        // Trim if over limit
        if (history.length > this.config.maxExecutionHistory) {
            this.executionHistory = history.slice(-this.config.maxExecutionHistory);
        }
    }
    destroy() {
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
export { MemoryOptimizedAutomaton };
// If run directly, create optimized instance
if (require.main === module) {
    // Check for command-line arguments to focus on Identity Evolution (0D)
    const args = process.argv.slice(2);
    const focus0D = args.includes('--0d') || args.includes('--identity-evolution');
    const lock0D = args.includes('--lock-0d');
    const probability = args.find(arg => arg.startsWith('--0d-prob='))?.split('=')[1];
    const db = new MetaLogDb({ enableProlog: true, enableDatalog: true });
    const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', {
        maxObjects: 2000,
        maxExecutionHistory: 500,
        gcInterval: 5000,
        trimInterval: 10000,
        memoryPressureThreshold: 200,
        enableGC: true,
        // Identity Evolution (0D) focus options
        lockDimension: lock0D ? 0 : undefined,
        dimension0Focus: focus0D || lock0D,
        dimension0Probability: probability ? parseFloat(probability) : (focus0D ? 0.7 : 0.5),
    }, db);
    // Run self-modification loop
    // Default: 1000ms, but can be overridden with --interval flag
    const intervalArg = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
    const modificationInterval = intervalArg ? parseInt(intervalArg) : 1000;
    setInterval(() => {
        automaton.executeSelfModification();
    }, modificationInterval);
    // Handle shutdown
    process.on('SIGINT', () => {
        automaton.destroy();
        process.exit(0);
    });
    console.log('🚀 Memory-optimized automaton running...');
    console.log(`   Modification Interval: ${modificationInterval}ms`);
    if (lock0D) {
        console.log('🔒 Locked to dimension 0 for maximum Identity Evolution');
    }
    else if (focus0D) {
        console.log(`🎯 Focusing on Identity Evolution (0D) with ${(focus0D ? 0.7 : 0.5) * 100}% probability`);
    }
    else {
        console.log('✅ Dimension progression enabled (not locked to 0D)');
    }
    console.log('💡 Usage: --0d or --identity-evolution to focus on 0D, --lock-0d to lock to 0D');
    console.log('💡 Usage: --0d-prob=0.8 to set probability of returning to dimension 0');
    console.log('💡 Usage: --interval=N to set modification interval in ms (default: 1000)');
}
//# sourceMappingURL=automaton-memory-optimized.js.map