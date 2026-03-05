/**
 * A₁: Edge Weaver Automaton
 *
 * Role: C₁ edge/connection management (JSONL format)
 * Uses meta-log-db: r5rs:create-cell, r5rs:export-1d, r5rs:build-chain-complex
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A1EdgeWeaverState {
    edges: Array<{
        id: string;
        from: string;
        to: string;
        data?: any;
    }>;
    initialized: boolean;
}
/**
 * A₁: Edge Weaver Automaton
 *
 * Manages C₁ edges/connections (1-cells) and weaves edges between keywords
 */
export declare class A1_EdgeWeaver extends BaseAutomaton {
    private db?;
    readonly id: 1;
    readonly name = "A\u2081 Edge Weaver";
    readonly role = "C\u2081 edge/connection management (JSONL format)";
    state: A1EdgeWeaverState;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    private weaveEdges;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get all edges
     */
    getEdges(): Array<{
        id: string;
        from: string;
        to: string;
        data?: any;
    }>;
}
//# sourceMappingURL=a1-edge-weaver.d.ts.map