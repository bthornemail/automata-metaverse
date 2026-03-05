#!/usr/bin/env tsx
/**
 * Evolved Automaton - Implements Snapshot Analysis Recommendations
 *
 * Recommendations Implemented:
 * 1. Enable dimension progression (removed 0D lock)
 * 2. Increase modification frequency (faster intervals)
 * 3. Monitor Phase 4 growth (memory growth tracking)
 */
import { MemoryOptimizedAutomaton } from './automaton-memory-optimized.js';
interface EvolvedConfig {
    enableDimensionProgression: boolean;
    dimensionProgressionInterval: number;
    modificationInterval: number;
    burstModifications: number;
    enablePhase4Monitoring: boolean;
    phase4Threshold: number;
    phase4GrowthRateThreshold: number;
    phase4CheckInterval: number;
}
declare class EvolvedAutomaton extends MemoryOptimizedAutomaton {
    private evolvedConfig;
    private modificationTimer?;
    private dimensionProgressionTimer?;
    private phase4MonitorTimer?;
    private memoryHistory;
    private phase4Detected;
    private lastDimension;
    private dimensionProgressionCount;
    constructor(filePath: string, config?: Partial<EvolvedConfig>);
    private startEvolvedFeatures;
    private executeBurstModifications;
    private progressDimension;
    private monitorPhase4Growth;
    getStats(): any;
    destroy(): void;
}
export { EvolvedAutomaton, EvolvedConfig };
//# sourceMappingURL=automaton-evolved.d.ts.map