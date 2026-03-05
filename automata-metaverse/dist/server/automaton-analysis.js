/**
 * Automaton Analysis Utilities
 *
 * Analysis functions for automaton state and history
 */
/**
 * Calculate action frequency from execution history
 */
export function calculateActionFrequency(automaton) {
    const history = automaton.executionHistory || [];
    const frequency = new Map();
    history.forEach((entry) => {
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
export function calculateDimensionalProgression(automaton) {
    const history = automaton.executionHistory || [];
    const dimensionCounts = new Map();
    const transitions = new Map();
    history.forEach((entry) => {
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
export function calculatePerformanceMetrics(automaton) {
    const history = automaton.executionHistory || [];
    const selfModifications = automaton.selfModificationCount || 0;
    if (history.length === 0) {
        return {
            averageIterationTime: 0,
            totalIterations: 0,
            selfModifications: 0,
            errorRate: 0,
        };
    }
    // Calculate average iteration time (simplified)
    const timestamps = history.map((entry) => entry.timestamp || 0);
    const timeDiffs = [];
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
export function analyzeSelfReferences(automaton) {
    const objects = automaton.objects || [];
    const selfRefs = objects.filter((obj) => {
        return obj.type === 'self-ref' ||
            obj.metadata?.selfReference ||
            obj.id === 'self-ref';
    });
    return {
        count: selfRefs.length,
        references: selfRefs.map((obj) => ({
            id: obj.id,
            type: obj.type,
            metadata: obj.metadata,
        })),
    };
}
/**
 * Analyze patterns in execution history
 */
export function analyzePatterns(automaton) {
    const history = automaton.executionHistory || [];
    if (history.length === 0) {
        return {
            patterns: [],
            cycles: [],
        };
    }
    // Detect action cycles
    const actionSequence = history.map((entry) => entry.action || 'unknown');
    const cycles = [];
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
//# sourceMappingURL=automaton-analysis.js.map