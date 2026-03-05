/**
 * Object Pool for Memory Optimization
 *
 * Reuses objects to reduce allocation overhead and GC pressure
 */
/**
 * Generic object pool implementation
 */
export class ObjectPool {
    /**
     * Create a new object pool
     *
     * @param createFn - Function to create new objects
     * @param resetFn - Function to reset objects for reuse
     * @param maxSize - Maximum pool size (default: 100)
     */
    constructor(createFn, resetFn, maxSize = 100) {
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }
    /**
     * Acquire an object from the pool
     *
     * @returns {T} Object from pool or newly created
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFn();
    }
    /**
     * Release an object back to the pool
     *
     * @param obj - Object to release
     */
    release(obj) {
        if (this.pool.length < this.maxSize) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    /**
     * Clear the pool
     */
    clear() {
        this.pool = [];
    }
    /**
     * Get current pool size
     */
    get size() {
        return this.pool.length;
    }
}
//# sourceMappingURL=object-pool.js.map