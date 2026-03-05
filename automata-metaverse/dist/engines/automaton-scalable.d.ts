#!/usr/bin/env tsx
/**
 * Scalable Automaton with GPU Acceleration and Multi-Core Support
 * Dynamically scales based on available resources (CPU cores, GPU, memory)
 */
interface ScalabilityConfig {
    maxWorkers: number;
    workerInterval: number;
    enableWorkerThreads: boolean;
    enableGPU: boolean;
    gpuBatchSize: number;
    autoScale: boolean;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    minWorkers: number;
    maxWorkersLimit: number;
    parallelModifications: number;
    executionBatchSize: number;
}
declare class ScalableAutomaton {
    private mainAutomaton;
    private config;
    private workers;
    private workerResults;
    private activeWorkers;
    private cpuCores;
    private gpuAvailable;
    constructor(filePath: string, config?: Partial<ScalabilityConfig>);
    private checkGPUAvailability;
    private initializeWorkers;
    private executeParallelModifications;
    private executeWorkerModifications;
    private executeGPUBatch;
    private getMemoryUsage;
    private scaleWorkers;
    executeScalable(): Promise<void>;
    start(intervalMs?: number): void;
    destroy(): void;
    getStats(): any;
}
export { ScalableAutomaton, ScalabilityConfig };
//# sourceMappingURL=automaton-scalable.d.ts.map