/**
 * Automaton Analysis Utilities
 *
 * Analysis functions for automaton state and history
 */
import { AdvancedSelfReferencingAutomaton } from '../engines/advanced-automaton.js';
export interface ActionFrequency {
    action: string;
    count: number;
    percentage: number;
}
export interface DimensionalProgression {
    dimension: number;
    count: number;
    transitions: number;
}
export interface PerformanceMetrics {
    averageIterationTime: number;
    totalIterations: number;
    selfModifications: number;
    errorRate: number;
}
/**
 * Calculate action frequency from execution history
 */
export declare function calculateActionFrequency(automaton: AdvancedSelfReferencingAutomaton): ActionFrequency[];
/**
 * Calculate dimensional progression
 */
export declare function calculateDimensionalProgression(automaton: AdvancedSelfReferencingAutomaton): DimensionalProgression[];
/**
 * Calculate performance metrics
 */
export declare function calculatePerformanceMetrics(automaton: AdvancedSelfReferencingAutomaton): PerformanceMetrics;
/**
 * Analyze self-references
 */
export declare function analyzeSelfReferences(automaton: AdvancedSelfReferencingAutomaton): any;
/**
 * Analyze patterns in execution history
 */
export declare function analyzePatterns(automaton: AdvancedSelfReferencingAutomaton): any;
//# sourceMappingURL=automaton-analysis.d.ts.map