#!/usr/bin/env node
/**
 * Optimized Self-Instantiation Bootstrap
 * Implements the optimal strategy for bootstrapping the automaton from
 * automaton-kernel.jsonl and integrating with OpenCode components
 */
import { MetaLogDb } from 'meta-log-db';
interface BootstrapConfig {
    kernelPath?: string;
    automatonPath?: string;
    db?: MetaLogDb;
}
declare class OptimizedBootstrap {
    private kernelPath;
    private automatonPath;
    private db;
    private kernelObjects;
    private automatonObjects;
    constructor(config?: BootstrapConfig);
    private dimensionalPath;
    /**
     * Main bootstrap entry point
     */
    bootstrap(): Promise<void>;
    /**
     * Phase 1: Execute transaction bootstrap from kernel
     */
    private executeTransactionBootstrap;
    /**
     * Execute individual bootstrap step
     */
    private executeBootstrapStep;
    /**
     * Begin bootstrap transaction
     */
    private beginTransaction;
    /**
     * Validate SHACL constraints
     */
    private validateSHACL;
    /**
     * Load automaton structure
     */
    private loadAutomaton;
    /**
     * Initialize Church encoding evaluator
     */
    private initializeEvaluator;
    /**
     * Commit transaction
     */
    private commitTransaction;
    /**
     * Phase 2: Progress through dimensions
     */
    private progressDimensions;
    /**
     * Instantiate a specific dimension
     */
    private instantiateDimension;
    /**
     * Phase 3: Integration activation (stub - OpenCode removed)
     */
    private activateIntegration;
    /**
     * Phase 4: Execute self-reference
     */
    private executeSelfReference;
    /**
     * Save automaton to file
     */
    private saveAutomaton;
    /**
     * Print bootstrap summary
     */
    private printBootstrapSummary;
}
export { OptimizedBootstrap };
export default OptimizedBootstrap;
//# sourceMappingURL=bootstrap-automaton.d.ts.map