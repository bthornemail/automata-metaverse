/**
 * Memory Utilities
 *
 * Helper functions for memory monitoring and pressure assessment
 */
/**
 * Memory pressure levels
 */
export type MemoryPressure = 'low' | 'medium' | 'high' | 'critical';
/**
 * Memory state interface
 */
export interface MemoryState {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    systemFree: number;
    systemTotal: number;
    pressure: MemoryPressure;
}
/**
 * Memory thresholds (in bytes)
 */
export declare const MEMORY_THRESHOLDS: {
    readonly LOW: number;
    readonly MEDIUM: number;
    readonly HIGH: number;
    readonly CRITICAL: number;
};
/**
 * Get current memory state
 *
 * @returns {MemoryState} Current memory state with pressure assessment
 */
export declare function getMemoryState(): MemoryState;
/**
 * Assess memory pressure from memory usage
 *
 * @param heapUsed - Heap used in bytes
 * @returns {MemoryPressure} Memory pressure level
 */
export declare function assessMemoryPressure(heapUsed: number): MemoryPressure;
/**
 * Force garbage collection (if available)
 *
 * @returns {boolean} True if GC was called
 */
export declare function forceGarbageCollection(): boolean;
/**
 * Format memory size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "123.45 MB")
 */
export declare function formatMemory(bytes: number): string;
//# sourceMappingURL=memory-utils.d.ts.map