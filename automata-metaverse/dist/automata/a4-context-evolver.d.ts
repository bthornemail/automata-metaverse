/**
 * A₄: Context Evolver Automaton
 *
 * Role: C₄ evolution context management (CANVASL format)
 * Uses meta-log-db: r5rs:export-4d, r5rs:format-fibration
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A4ContextEvolverState {
    contexts: Array<{
        id: string;
        volumes: string[];
        data?: any;
    }>;
    initialized: boolean;
}
/**
 * A₄: Context Evolver Automaton
 *
 * Manages C₄ evolution contexts (4-cells) and evolves contexts from volumes
 */
export declare class A4_ContextEvolver extends BaseAutomaton {
    private db?;
    readonly id: 4;
    readonly name = "A\u2084 Context Evolver";
    readonly role = "C\u2084 evolution context management (CANVASL format)";
    state: A4ContextEvolverState;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    private evolveContexts;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get all evolution contexts
     */
    getContexts(): Array<{
        id: string;
        volumes: string[];
        data?: any;
    }>;
}
//# sourceMappingURL=a4-context-evolver.d.ts.map