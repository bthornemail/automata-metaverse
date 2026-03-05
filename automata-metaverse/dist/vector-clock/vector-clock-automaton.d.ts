/**
 * Vector Clock Automaton Base
 *
 * Base class for automata with vector clock state tracking
 */
import { VectorClock } from './vector-clock.js';
/**
 * Meta-Log interface for vector clock automata
 */
export interface MetaLog {
    datalog?: {
        addFacts?: (facts: Array<{
            predicate: string;
            args: any[];
        }>) => void;
    };
}
/**
 * Automaton state interface
 */
export interface AutomatonState {
    id: string | number;
    dimension: number;
    running: boolean;
    vectorClock: Map<string | number, number>;
    cellCounts: {
        C0: number;
        C1: number;
        C2: number;
        C3: number;
        C4: number;
    };
}
/**
 * Message interface
 */
export interface AutomatonMessage {
    type?: string;
    vectorClock?: Map<string | number, number> | Record<string | number, number>;
    from?: string | number;
    timestamp?: number;
    [key: string]: any;
}
/**
 * Swarm context interface
 */
export interface SwarmContext {
    [key: string]: any;
}
/**
 * Base Vector Clock Automaton
 *
 * Provides vector clock state tracking for distributed causality
 */
export declare class VectorClockAutomaton {
    protected id: string | number;
    protected metaLog: MetaLog | null;
    protected vectorClock: VectorClock;
    protected state: AutomatonState;
    constructor(id: string | number, metaLog?: MetaLog | null);
    /**
     * Tick automaton (increment own vector clock)
     *
     * @param {SwarmContext | null} swarm - Swarm context (optional)
     * @returns {Promise<void>}
     */
    tick(swarm?: SwarmContext | null): Promise<void>;
    /**
     * Receive message from another automaton
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Message object
     * @returns {Promise<void>}
     */
    receive(from: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Send message to another automaton
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Message object
     * @returns {Promise<void>}
     */
    send(to: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Get current state
     *
     * @returns {AutomatonState} Current automaton state
     */
    getState(): AutomatonState;
    /**
     * Check if this automaton happens before another
     *
     * @param {string | number} otherId - Other automaton ID
     * @param {Map<string | number, number>} otherClock - Other automaton's vector clock
     * @returns {boolean} True if this happens before other
     */
    happensBefore(otherId: string | number, otherClock: Map<string | number, number>): boolean;
    /**
     * Check if this automaton is concurrent with another
     *
     * @param {string | number} otherId - Other automaton ID
     * @param {Map<string | number, number>} otherClock - Other automaton's vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(otherId: string | number, otherClock: Map<string | number, number>): boolean;
    /**
     * Get causal chain
     *
     * @returns {Array<{automatonId: string | number, tick: number}>} Causal chain
     */
    getCausalChain(): Array<{
        automatonId: string | number;
        tick: number;
    }>;
    /**
     * Store tick in Meta-Log
     *
     * @returns {Promise<void>}
     */
    storeTickInMetaLog(): Promise<void>;
    /**
     * Store receive event in Meta-Log
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    storeReceiveInMetaLog(from: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Store send event in Meta-Log
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Sent message
     * @returns {Promise<void>}
     */
    storeSendInMetaLog(to: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Execute automaton-specific tick logic
     * Override in subclasses
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    protected executeTick(swarm: SwarmContext | null): Promise<void>;
    /**
     * Execute automaton-specific receive logic
     * Override in subclasses
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    protected executeReceive(from: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Execute automaton-specific send logic
     * Override in subclasses
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Message to send
     * @returns {Promise<void>}
     */
    protected executeSend(to: string | number, message: AutomatonMessage): Promise<void>;
}
//# sourceMappingURL=vector-clock-automaton.d.ts.map