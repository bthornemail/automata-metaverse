/**
 * ML-Enhanced Vector Clock Automaton
 *
 * Integrates WASM ML embeddings and HNSW indexing with vector clock state
 */
import { VectorClockAutomaton } from './vector-clock-automaton.js';
import type { MetaLog, SwarmContext, AutomatonMessage, AutomatonState } from './vector-clock-automaton.js';
export type { MetaLog, SwarmContext, AutomatonMessage, AutomatonState };
import type { HNSWAutomatonIndex } from '../ml/hnsw-automaton-index.js';
import type { WASMMLEngine } from '../ml/wasm-ml-engine.js';
/**
 * ML-Enhanced Vector Clock Automaton
 *
 * Base class for automata with ML-enhanced state tracking
 */
export declare class MLVectorClockAutomaton extends VectorClockAutomaton {
    protected mlEngine: WASMMLEngine;
    protected hnswIndex: HNSWAutomatonIndex | null;
    constructor(id: string | number, metaLog?: MetaLog | null);
    /**
     * Set HNSW index (called by blackboard)
     *
     * @param {HNSWAutomatonIndex} index - HNSW index instance
     */
    setHNSWIndex(index: HNSWAutomatonIndex): void;
    /**
     * Tick with ML-enhanced state tracking
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    tick(swarm?: SwarmContext | null): Promise<void>;
    /**
     * Coordinate with semantically similar automata
     *
     * @param {Array<{automatonId: string | number, similarity: number}>} similarAutomata - Array of similar automata with similarity scores
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    coordinateWithSimilar(similarAutomata: Array<{
        automatonId: string | number;
        similarity: number;
    }>, swarm: SwarmContext | null): Promise<void>;
    /**
     * Receive with ML-enhanced conflict resolution
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    receive(from: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Resolve semantic conflicts using ML + Meta-Log
     *
     * @param {AutomatonState} localState - Local automaton state
     * @param {AutomatonState} remoteState - Remote automaton state
     * @param {string | number} from - Sender automaton ID
     * @returns {Promise<void>}
     */
    resolveSemanticConflict(localState: AutomatonState, remoteState: AutomatonState, from: string | number): Promise<void>;
    /**
     * Query similar automata using ProLog + HNSW
     *
     * @param {string} prologConstraints - ProLog query constraints
     * @param {number} k - Number of results
     * @returns {Promise<Array<AutomatonState>>} Similar automaton states
     */
    querySimilarAutomata(prologConstraints: string, k?: number): Promise<Array<AutomatonState>>;
    /**
     * Merge state (override in subclasses)
     *
     * @param {AutomatonState} state - State to merge
     * @returns {Promise<void>}
     */
    mergeState(state: AutomatonState): Promise<void>;
    /**
     * Validate homology (override in subclasses)
     *
     * @param {AutomatonState} state - State to validate
     * @returns {Promise<boolean>} True if valid
     */
    validateHomology(state: AutomatonState): Promise<boolean>;
}
//# sourceMappingURL=ml-vector-clock-automaton.d.ts.map