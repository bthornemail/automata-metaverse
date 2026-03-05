/**
 * A₁₁ Swarm Coordinator
 *
 * Coordinates all 11 automata (A₀-A₁₁) in the A₁₁ system
 */
import { Automaton, AutomatonId, AutomatonMessage, SwarmContext } from '../automata/types.js';
export interface A11SwarmConfig {
    tickInterval?: number;
    autoStart?: boolean;
}
/**
 * A₁₁ Swarm Coordinator
 *
 * Manages all 11 automata, coordinates message passing, and executes tick-based updates
 */
export declare class A11Swarm implements SwarmContext {
    private automata;
    private messageQueue;
    private tickInterval;
    private running;
    private tickTimer?;
    private autoStart;
    constructor(config?: A11SwarmConfig);
    /**
     * Bootstrap the swarm by initializing all 11 automata
     */
    bootstrap(): Promise<void>;
    /**
     * Register an automaton with the swarm
     */
    register(automaton: Automaton): void;
    /**
     * Elect master coordinator (A₁₁)
     *
     * In a full implementation, this would involve consensus voting.
     * For now, A₁₁ is created separately and registered.
     */
    private electMaster;
    /**
     * Start the swarm tick loop
     */
    start(): void;
    /**
     * Stop the swarm tick loop
     */
    stop(): void;
    /**
     * Execute one tick: update all automata and process messages
     */
    private tick;
    /**
     * Send message between automata
     * Messages are queued and processed during the next tick
     */
    sendMessage(from: AutomatonId, to: AutomatonId, message: AutomatonMessage): void;
    /**
     * Get automaton by ID
     */
    get(id: AutomatonId): Automaton | undefined;
    /**
     * Get all automata
     */
    getAll(): Automaton[];
    /**
     * Get state of all automata
     */
    getState(): Map<AutomatonId, any>;
    /**
     * Get swarm statistics
     */
    getStats(): {
        automataCount: number;
        messageQueueLength: number;
        running: boolean;
        tickInterval: number;
    };
}
//# sourceMappingURL=a11-swarm.d.ts.map