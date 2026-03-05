/**
 * A₆: Homology Checker Automaton
 *
 * Role: ∂² = 0 validation
 * Uses meta-log-db: HomologyValidator, r5rs:validate-homology
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A6HomologyCheckerState {
    lastCheck: number;
    violations: string[];
    validationCount: number;
    initialized: boolean;
}
/**
 * A₆: Homology Checker Automaton
 *
 * Validates ∂² = 0 property and checks homology violations
 */
export declare class A6_HomologyChecker extends BaseAutomaton {
    private db?;
    readonly id: 6;
    readonly name = "A\u2086 Homology Checker";
    readonly role = "\u2202\u00B2 = 0 validation";
    state: A6HomologyCheckerState;
    private checkInterval;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    private validateSwarm;
    private buildChainComplex;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get validation violations
     */
    getViolations(): string[];
}
//# sourceMappingURL=a6-homology-checker.d.ts.map