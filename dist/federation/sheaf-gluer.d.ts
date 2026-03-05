/**
 * Sheaf Gluer
 *
 * Glues federated data from multiple peers using DAG operations
 * Uses meta-log-db: DAGManager, MetaLogNodeManager
 */
import type { MetaLogDb } from 'meta-log-db';
export interface PeerNodes {
    peerId: string;
    nodes: any[];
}
export interface SheafGlueResult {
    merged: boolean;
    conflicts: string[];
    lca?: string;
}
/**
 * Sheaf Gluer
 *
 * Glues federated data from multiple peers using DAG structure
 */
export declare class SheafGluer {
    private db?;
    private dagManager?;
    private nodeManager?;
    constructor(db?: MetaLogDb);
    /**
     * Glue sheaves from multiple peers
     */
    glueSheaves(peerNodes: PeerNodes[]): Promise<SheafGlueResult>;
    /**
     * Resolve conflicts using LCA
     */
    resolveConflicts(conflicts: string[], lca?: string): Promise<any[]>;
    /**
     * Get DAG structure
     */
    getDAG(): any;
}
//# sourceMappingURL=sheaf-gluer.d.ts.map