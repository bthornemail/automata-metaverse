#!/usr/bin/env tsx
/**
 * Memory-Optimized Automaton with Leak Fixes
 * Implements: GC triggers, object trimming, execution history limits
 */
import { AdvancedSelfReferencingAutomaton } from './advanced-automaton.js';
import { MetaLogDb } from 'meta-log-db';
interface MemoryOptimizationConfig {
    maxObjects: number;
    maxExecutionHistory: number;
    gcInterval: number;
    trimInterval: number;
    memoryPressureThreshold: number;
    enableGC: boolean;
    lockDimension?: number;
    dimension0Focus?: boolean;
    dimension0Probability?: number;
}
declare class MemoryOptimizedAutomaton extends AdvancedSelfReferencingAutomaton {
    private config;
    private gcTimer?;
    private trimTimer?;
    private lastGCTime;
    private lastTrimTime;
    constructor(filePath: string, config?: Partial<MemoryOptimizationConfig>, db?: MetaLogDb);
    private startOptimization;
    private forceGarbageCollection;
    private trimObjects;
    private trimExecutionHistory;
    executeSelfModification(): void;
    executeAction(action: string, fromState: string, toState: string, context?: any): void;
    private addToHistory;
    destroy(): void;
}
export { MemoryOptimizedAutomaton, MemoryOptimizationConfig };
//# sourceMappingURL=automaton-memory-optimized.d.ts.map