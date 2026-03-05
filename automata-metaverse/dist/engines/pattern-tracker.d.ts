#!/usr/bin/env tsx
/**
 * Pattern Tracker
 *
 * Tracks execution patterns, modification patterns, and success rates
 * for learning and adaptation
 */
export interface ModificationPattern {
    id: string;
    dimension: number;
    patternType: 'add' | 'modify' | 'remove' | 'transform';
    pattern: string;
    successCount: number;
    failureCount: number;
    averageMemoryDelta: number;
    averageExecutionTime: number;
    lastUsed: string;
    createdAt: string;
}
export interface ExecutionPattern {
    id: string;
    dimension: number;
    actionSequence: string[];
    outcome: 'success' | 'failure' | 'partial';
    memoryUsage: number;
    executionTime: number;
    timestamp: string;
    metadata: Record<string, any>;
}
export interface LearnedPattern {
    pattern: ModificationPattern;
    confidence: number;
    usageCount: number;
    lastSuccessRate: number;
    recommendations: string[];
}
/**
 * Pattern Tracker
 */
export declare class PatternTracker {
    private modificationPatterns;
    private executionHistory;
    private learnedPatterns;
    /**
     * Track a modification pattern
     */
    trackModification(dimension: number, patternType: ModificationPattern['patternType'], pattern: string, success: boolean, memoryDelta: number, executionTime: number): void;
    /**
     * Track execution pattern
     */
    trackExecution(dimension: number, actionSequence: string[], outcome: ExecutionPattern['outcome'], memoryUsage: number, executionTime: number, metadata?: Record<string, any>): void;
    /**
     * Get best patterns for a dimension
     */
    getBestPatterns(dimension: number, limit?: number): LearnedPattern[];
    /**
     * Get recommended pattern for next modification
     */
    getRecommendedPattern(dimension: number): ModificationPattern | null;
    /**
     * Get success rate for a dimension
     */
    getSuccessRate(dimension: number): number;
    /**
     * Get execution statistics for a dimension
     */
    getExecutionStats(dimension: number): {
        averageMemory: number;
        averageTime: number;
        successRate: number;
        totalExecutions: number;
    };
    /**
     * Update learned patterns based on tracked data
     */
    private updateLearnedPatterns;
    /**
     * Calculate consistency of a pattern (how stable its results are)
     */
    private calculateConsistency;
    /**
     * Generate recommendations for a pattern
     */
    private generateRecommendations;
    /**
     * Hash pattern for ID generation
     */
    private hashPattern;
    /**
     * Export patterns to JSONL
     */
    exportToJSONL(): string;
    /**
     * Load patterns from JSONL
     */
    loadFromJSONL(jsonl: string): void;
}
//# sourceMappingURL=pattern-tracker.d.ts.map