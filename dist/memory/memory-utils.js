/**
 * Memory Utilities
 *
 * Helper functions for memory monitoring and pressure assessment
 */
import * as os from 'os';
/**
 * Memory thresholds (in bytes)
 */
export const MEMORY_THRESHOLDS = {
    LOW: 50 * 1024 * 1024, // 50MB
    MEDIUM: 200 * 1024 * 1024, // 200MB
    HIGH: 500 * 1024 * 1024, // 500MB
    CRITICAL: 1000 * 1024 * 1024, // 1GB
};
/**
 * Get current memory state
 *
 * @returns {MemoryState} Current memory state with pressure assessment
 */
export function getMemoryState() {
    const mem = process.memoryUsage();
    const systemMem = { total: os.totalmem(), free: os.freemem() };
    let pressure;
    if (mem.heapUsed < MEMORY_THRESHOLDS.LOW) {
        pressure = 'low';
    }
    else if (mem.heapUsed < MEMORY_THRESHOLDS.MEDIUM) {
        pressure = 'medium';
    }
    else if (mem.heapUsed < MEMORY_THRESHOLDS.HIGH) {
        pressure = 'high';
    }
    else {
        pressure = 'critical';
    }
    return {
        ...mem,
        systemFree: systemMem.free,
        systemTotal: systemMem.total,
        pressure
    };
}
/**
 * Assess memory pressure from memory usage
 *
 * @param heapUsed - Heap used in bytes
 * @returns {MemoryPressure} Memory pressure level
 */
export function assessMemoryPressure(heapUsed) {
    if (heapUsed < MEMORY_THRESHOLDS.LOW)
        return 'low';
    if (heapUsed < MEMORY_THRESHOLDS.MEDIUM)
        return 'medium';
    if (heapUsed < MEMORY_THRESHOLDS.HIGH)
        return 'high';
    return 'critical';
}
/**
 * Force garbage collection (if available)
 *
 * @returns {boolean} True if GC was called
 */
export function forceGarbageCollection() {
    if (typeof global !== 'undefined' && global.gc) {
        global.gc();
        return true;
    }
    return false;
}
/**
 * Format memory size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "123.45 MB")
 */
export function formatMemory(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
//# sourceMappingURL=memory-utils.js.map