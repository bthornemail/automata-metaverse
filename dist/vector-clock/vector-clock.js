/**
 * Vector Clock Implementation
 *
 * Distributed causality tracking using vector clocks
 */
/**
 * Vector Clock class for distributed causality tracking
 */
export class VectorClock {
    constructor(automatonId, initialClock) {
        this.automatonId = automatonId;
        this.clock = initialClock || new Map();
        // Initialize own tick to 0 if not present
        if (!this.clock.has(automatonId)) {
            this.clock.set(automatonId, 0);
        }
    }
    /**
     * Increment own tick
     *
     * @returns {number} New tick value
     */
    tick() {
        const currentTick = this.clock.get(this.automatonId) || 0;
        const newTick = currentTick + 1;
        this.clock.set(this.automatonId, newTick);
        return newTick;
    }
    /**
     * Get current tick for this automaton
     *
     * @returns {number} Current tick
     */
    getTick() {
        return this.clock.get(this.automatonId) || 0;
    }
    /**
     * Get tick for a specific automaton
     *
     * @param {string | number} automatonId - Automaton ID
     * @returns {number} Tick value
     */
    getTickFor(automatonId) {
        return this.clock.get(automatonId) || 0;
    }
    /**
     * Merge with another vector clock (element-wise max)
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {VectorClock} Merged vector clock (new instance)
     */
    merge(otherClock) {
        const otherMap = otherClock instanceof VectorClock ? otherClock.clock : otherClock;
        const merged = new VectorClock(this.automatonId, new Map(this.clock));
        // Element-wise max
        for (const [automatonId, tick] of otherMap) {
            const currentTick = merged.clock.get(automatonId) || 0;
            merged.clock.set(automatonId, Math.max(currentTick, tick));
        }
        return merged;
    }
    /**
     * Check if this clock happens before another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if this happens before other
     */
    happensBefore(otherClock) {
        const otherMap = otherClock instanceof VectorClock ? otherClock.clock : otherClock;
        let strictlyLess = false;
        for (const [automatonId, tick] of this.clock) {
            const otherTick = otherMap.get(automatonId) || 0;
            if (tick > otherTick) {
                return false; // Not happens-before
            }
            if (tick < otherTick) {
                strictlyLess = true;
            }
        }
        // Check if other has automata we haven't seen
        for (const [automatonId, tick] of otherMap) {
            if (!this.clock.has(automatonId) && tick > 0) {
                strictlyLess = true;
            }
        }
        return strictlyLess;
    }
    /**
     * Check if this clock is concurrent with another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(otherClock) {
        return !this.happensBefore(otherClock) &&
            !(otherClock instanceof VectorClock ? otherClock.happensBefore(this) : this._otherHappensBefore(otherClock));
    }
    /**
     * Helper: Check if other happens before this
     *
     * @param {Map<string | number, number>} otherClock - Other clock map
     * @returns {boolean} True if other happens before this
     */
    _otherHappensBefore(otherClock) {
        let strictlyLess = false;
        for (const [automatonId, tick] of otherClock) {
            const thisTick = this.clock.get(automatonId) || 0;
            if (tick > thisTick) {
                return false;
            }
            if (tick < thisTick) {
                strictlyLess = true;
            }
        }
        for (const [automatonId, tick] of this.clock) {
            if (!otherClock.has(automatonId) && tick > 0) {
                strictlyLess = true;
            }
        }
        return strictlyLess;
    }
    /**
     * Get causal chain (all automata this automaton has seen)
     *
     * @returns {Array<{automatonId: string | number, tick: number}>} Causal chain
     */
    getCausalChain() {
        return Array.from(this.clock.entries())
            .filter(([id, tick]) => id !== this.automatonId && tick > 0)
            .map(([automatonId, tick]) => ({ automatonId, tick }));
    }
    /**
     * Clone vector clock
     *
     * @returns {VectorClock} Cloned vector clock
     */
    clone() {
        return new VectorClock(this.automatonId, new Map(this.clock));
    }
    /**
     * Convert to Map
     *
     * @returns {Map<string | number, number>} Clock as Map
     */
    toMap() {
        return new Map(this.clock);
    }
    /**
     * Convert to plain object
     *
     * @returns {Record<string | number, number>} Clock as object
     */
    toObject() {
        return Object.fromEntries(this.clock);
    }
    /**
     * Create from object
     *
     * @param {string | number} automatonId - Automaton ID
     * @param {Record<string | number, number>} obj - Clock object
     * @returns {VectorClock} Vector clock instance
     */
    static fromObject(automatonId, obj) {
        return new VectorClock(automatonId, new Map(Object.entries(obj).map(([k, v]) => [k, v])));
    }
}
//# sourceMappingURL=vector-clock.js.map