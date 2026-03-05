/**
 * A₀: Genesis Automaton
 *
 * Role: C₀ keyword generation (JSON Canvas format)
 * Uses meta-log-db: r5rs:create-cell, r5rs:export-0d
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A0GenesisState {
    genesis: any | null;
    keywords: string[];
    initialized: boolean;
}
/**
 * A₀: Genesis Automaton
 *
 * Creates the genesis MetaLogNode and manages C₀ keywords (0-cells)
 */
export declare class A0_Genesis extends BaseAutomaton {
    private db?;
    readonly id: 0;
    readonly name = "A\u2080 Genesis";
    readonly role = "C\u2080 keyword generation (JSON Canvas format)";
    state: A0GenesisState;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get genesis node
     */
    getGenesis(): any;
    /**
     * Get keywords (C₀ cells)
     */
    getKeywords(): string[];
}
//# sourceMappingURL=a0-genesis.d.ts.map