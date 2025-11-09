/**
 * Automaton Analysis Utilities
 * 
 * Analysis functions for automaton state and history
 */

import { AdvancedSelfReferencingAutomaton } from '../../evolutions/advanced-automaton/advanced-automaton';

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
export function calculateActionFrequency(
  automaton: AdvancedSelfReferencingAutomaton
): ActionFrequency[] {
  const history = (automaton as any).executionHistory || [];
  const frequency = new Map<string, number>();

  history.forEach((entry: any) => {
    const action = entry.action || 'unknown';
    frequency.set(action, (frequency.get(action) || 0) + 1);
  });

  const total = history.length || 1;
  return Array.from(frequency.entries())
    .map(([action, count]) => ({
      action,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate dimensional progression
 */
export function calculateDimensionalProgression(
  automaton: AdvancedSelfReferencingAutomaton
): DimensionalProgression[] {
  const history = (automaton as any).executionHistory || [];
  const dimensionCounts = new Map<number, number>();
  const transitions = new Map<number, number>();

  history.forEach((entry: any) => {
    const fromDim = parseInt(entry.from?.replace('D', '') || '0');
    const toDim = parseInt(entry.to?.replace('D', '') || '0');
    
    dimensionCounts.set(toDim, (dimensionCounts.get(toDim) || 0) + 1);
    
    if (fromDim !== toDim) {
      transitions.set(toDim, (transitions.get(toDim) || 0) + 1);
    }
  });

  return Array.from(dimensionCounts.entries())
    .map(([dimension, count]) => ({
      dimension,
      count,
      transitions: transitions.get(dimension) || 0,
    }))
    .sort((a, b) => a.dimension - b.dimension);
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(
  automaton: AdvancedSelfReferencingAutomaton
): PerformanceMetrics {
  const history = (automaton as any).executionHistory || [];
  const selfModifications = (automaton as any).selfModificationCount || 0;
  
  if (history.length === 0) {
    return {
      averageIterationTime: 0,
      totalIterations: 0,
      selfModifications: 0,
      errorRate: 0,
    };
  }

  // Calculate average iteration time (simplified)
  const timestamps = history.map((entry: any) => entry.timestamp || 0);
  const timeDiffs: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    timeDiffs.push(timestamps[i] - timestamps[i - 1]);
  }
  const averageIterationTime = timeDiffs.length > 0
    ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
    : 0;

  return {
    averageIterationTime,
    totalIterations: history.length,
    selfModifications,
    errorRate: 0, // Would need error tracking
  };
}

/**
 * Analyze self-references
 */
export function analyzeSelfReferences(
  automaton: AdvancedSelfReferencingAutomaton
): any {
  const objects = (automaton as any).objects || [];
  const selfRefs = objects.filter((obj: any) => {
    return obj.type === 'self-ref' || 
           obj.metadata?.selfReference ||
           obj.id === 'self-ref';
  });

  return {
    count: selfRefs.length,
    references: selfRefs.map((obj: any) => ({
      id: obj.id,
      type: obj.type,
      metadata: obj.metadata,
    })),
  };
}

/**
 * Analyze patterns in execution history
 */
export function analyzePatterns(
  automaton: AdvancedSelfReferencingAutomaton
): any {
  const history = (automaton as any).executionHistory || [];
  
  if (history.length === 0) {
    return {
      patterns: [],
      cycles: [],
    };
  }

  // Detect action cycles
  const actionSequence = history.map((entry: any) => entry.action || 'unknown');
  const cycles: string[][] = [];
  
  // Simple cycle detection (look for repeating sequences of length 3-5)
  for (let cycleLen = 3; cycleLen <= 5 && cycleLen <= actionSequence.length / 2; cycleLen++) {
    for (let i = 0; i <= actionSequence.length - cycleLen * 2; i++) {
      const sequence = actionSequence.slice(i, i + cycleLen);
      const nextSequence = actionSequence.slice(i + cycleLen, i + cycleLen * 2);
      
      if (JSON.stringify(sequence) === JSON.stringify(nextSequence)) {
        cycles.push(sequence);
        break;
      }
    }
  }

  return {
    patterns: {
      mostCommonAction: actionSequence[0] || 'unknown',
      actionDiversity: new Set(actionSequence).size,
      averageSequenceLength: actionSequence.length,
    },
    cycles: cycles.slice(0, 5), // Limit to 5 cycles
  };
}
