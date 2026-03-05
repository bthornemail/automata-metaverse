/**
 * A₅: Sheaf Gluer Automaton
 *
 * Role: Federation via MetaLogNode DAG
 * Uses meta-log-db: MetaLogNodeManager, DAGManager
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A5SheafGluerState {
    nodes: Map<string, any>;
    dag: any;
    peers: Set<string>;
    initialized: boolean;
}
/**
 * A₅: Sheaf Gluer Automaton
 *
 * Manages federation via MetaLogNode DAG and glues sheaves from multiple peers
 */
export declare class A5_SheafGluer extends BaseAutomaton {
    private db?;
    readonly id: 5;
    readonly name = "A\u2085 Sheaf Gluer";
    readonly role = "Federation via MetaLogNode DAG";
    state: A5SheafGluerState;
    private nodeManager?;
    private dagManager?;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    /**
     * Add a MetaLogNode to the DAG
     */
    addNode(node: any): Promise<void>;
    /**
     * Glue sheaves from multiple peers
     */
    glueSheaves(peerNodes: Array<{
        peerId: string;
        nodes: any[];
    }>): Promise<void>;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get DAG structure
     */
    getDAG(): any;
    /**
     * Get all nodes
     */
    getNodes(): Map<string, any>;
}
//# sourceMappingURL=a5-sheaf-gluer.d.ts.map