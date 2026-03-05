#!/usr/bin/env tsx
/**
 * Learning Automaton
 *
 * Extends MemoryOptimizedAutomaton with learning capabilities:
 * - Tracks execution patterns and frequencies
 * - Learns which modifications lead to better outcomes
 * - Adapts modification patterns based on history
 * - Stores learned patterns in knowledge base
 */
import { MemoryOptimizedAutomaton } from './automaton-memory-optimized.js';
interface LearningConfig {
    enableLearning: boolean;
    patternFile?: string;
    minPatternConfidence: number;
    adaptationRate: number;
    trackMemory: boolean;
    trackExecutionTime: boolean;
}
export declare class LearningAutomaton extends MemoryOptimizedAutomaton {
    private learningConfig;
    private patternTracker;
    private lastMemoryUsage;
    private executionStartTime;
    private currentActionSequence;
    constructor(filePath: string, config?: Partial<LearningConfig>);
    /**
     * Override executeAction to track patterns
     */
    executeAction(action: string, fromState: string, toState: string, context?: any): void;
    /**
     * Generate modification using learned patterns
     */
    protected generateModification(): any;
    /**
     * Adapt a learned pattern to current context
     */
    private adaptPattern;
    /**
     * Track a modification pattern
     */
    private trackModification;
    /**
     * Determine pattern type from modification
     */
    private determinePatternType;
    /**
     * Get last modification made
     */
    private getLastModification;
    /**
     * Get current memory usage in MB
     */
    private getCurrentMemoryUsage;
    /**
     * Get learning statistics
     */
    getLearningStats(): {
        totalPatterns: number;
        learnedPatterns: number;
        successRate: number;
        dimensionStats: Array<{
            dimension: number;
            successRate: number;
            averageMemory: number;
            averageTime: number;
            totalExecutions: number;
        }>;
    };
    /**
     * Save learned patterns to file
     */
    saveLearnedPatterns(): void;
    /**
     * Cleanup on destruction
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=learning-automaton.d.ts.map