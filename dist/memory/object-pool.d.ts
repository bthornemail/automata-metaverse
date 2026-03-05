/**
 * Object Pool for Memory Optimization
 *
 * Reuses objects to reduce allocation overhead and GC pressure
 */
/**
 * Generic object pool implementation
 */
export declare class ObjectPool<T> {
    private pool;
    private createFn;
    private resetFn;
    private maxSize;
    /**
     * Create a new object pool
     *
     * @param createFn - Function to create new objects
     * @param resetFn - Function to reset objects for reuse
     * @param maxSize - Maximum pool size (default: 100)
     */
    constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize?: number);
    /**
     * Acquire an object from the pool
     *
     * @returns {T} Object from pool or newly created
     */
    acquire(): T;
    /**
     * Release an object back to the pool
     *
     * @param obj - Object to release
     */
    release(obj: T): void;
    /**
     * Clear the pool
     */
    clear(): void;
    /**
     * Get current pool size
     */
    get size(): number;
}
//# sourceMappingURL=object-pool.d.ts.map