/**
 * Automaton Types
 *
 * Core types for the A₁₁ automaton system
 */
/**
 * Automaton ID (0-11)
 */
export type AutomatonId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
/**
 * Automaton message
 */
export interface AutomatonMessage {
    type: string;
    payload?: any;
    timestamp?: number;
    from?: AutomatonId;
    to?: AutomatonId;
}
/**
 * Swarm context passed to automata
 */
export interface SwarmContext {
    sendMessage(from: AutomatonId, to: AutomatonId, message: AutomatonMessage): void;
    get(id: AutomatonId): Automaton | undefined;
    getAll(): Automaton[];
    getState(): Map<AutomatonId, any>;
}
/**
 * Base Automaton interface
 *
 * All automata in the A₁₁ system implement this interface
 */
export interface Automaton {
    readonly id: AutomatonId;
    readonly name: string;
    readonly role: string;
    state: any;
    /**
     * Called each tick (e.g., every 100ms)
     * @param swarm The swarm context for coordination
     */
    tick(swarm: SwarmContext): Promise<void>;
    /**
     * Handle messages from other automata
     * @param from Source automaton ID
     * @param message The message received
     */
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Send message to another automaton
     * @param to Target automaton ID
     * @param message The message to send
     */
    send(to: AutomatonId, message: AutomatonMessage): Promise<void>;
}
/**
 * Base automaton implementation with common functionality
 */
export declare abstract class BaseAutomaton implements Automaton {
    abstract readonly id: AutomatonId;
    abstract readonly name: string;
    abstract readonly role: string;
    state: any;
    tick(swarm: SwarmContext): Promise<void>;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    send(to: AutomatonId, message: AutomatonMessage): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map