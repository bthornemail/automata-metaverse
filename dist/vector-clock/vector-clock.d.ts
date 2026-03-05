/**
 * Vector Clock Implementation
 *
 * Distributed causality tracking using vector clocks
 */
/**
 * Vector Clock class for distributed causality tracking
 */
export declare class VectorClock {
    private automatonId;
    private clock;
    constructor(automatonId: string | number, initialClock?: Map<string | number, number> | null);
    /**
     * Increment own tick
     *
     * @returns {number} New tick value
     */
    tick(): number;
    /**
     * Get current tick for this automaton
     *
     * @returns {number} Current tick
     */
    getTick(): number;
    /**
     * Get tick for a specific automaton
     *
     * @param {string | number} automatonId - Automaton ID
     * @returns {number} Tick value
     */
    getTickFor(automatonId: string | number): number;
    /**
     * Merge with another vector clock (element-wise max)
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {VectorClock} Merged vector clock (new instance)
     */
    merge(otherClock: Map<string | number, number> | VectorClock): VectorClock;
    /**
     * Check if this clock happens before another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if this happens before other
     */
    happensBefore(otherClock: Map<string | number, number> | VectorClock): boolean;
    /**
     * Check if this clock is concurrent with another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(otherClock: Map<string | number, number> | VectorClock): boolean;
    /**
     * Helper: Check if other happens before this
     *
     * @param {Map<string | number, number>} otherClock - Other clock map
     * @returns {boolean} True if other happens before this
     */
    private _otherHappensBefore;
    /**
     * Get causal chain (all automata this automaton has seen)
     *
     * @returns {Array<{automatonId: string | number, tick: number}>} Causal chain
     */
    getCausalChain(): Array<{
        automatonId: string | number;
        tick: number;
    }>;
    /**
     * Clone vector clock
     *
     * @returns {VectorClock} Cloned vector clock
     */
    clone(): VectorClock;
    /**
     * Convert to Map
     *
     * @returns {Map<string | number, number>} Clock as Map
     */
    toMap(): Map<string | number, number>;
    /**
     * Convert to plain object
     *
     * @returns {Record<string | number, number>} Clock as object
     */
    toObject(): Record<string | number, number>;
    /**
     * Create from object
     *
     * @param {string | number} automatonId - Automaton ID
     * @param {Record<string | number, number>} obj - Clock object
     * @returns {VectorClock} Vector clock instance
     */
    static fromObject(automatonId: string | number, obj: Record<string | number, number>): VectorClock;
}
//# sourceMappingURL=vector-clock.d.ts.map