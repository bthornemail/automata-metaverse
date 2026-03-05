/**
 * A₅: Sheaf Gluer Automaton
 *
 * Role: Federation via MetaLogNode DAG
 * Uses meta-log-db: MetaLogNodeManager, DAGManager
 */
import { BaseAutomaton } from './types.js';
// @ts-ignore - extensions not yet exported in meta-log-db package.json
import { MetaLogNodeManager } from 'meta-log-db/src/extensions/metalog-node';
// @ts-ignore - extensions not yet exported in meta-log-db package.json
import { DAGManager } from 'meta-log-db/src/extensions/dag';
/**
 * A₅: Sheaf Gluer Automaton
 *
 * Manages federation via MetaLogNode DAG and glues sheaves from multiple peers
 */
export class A5_SheafGluer extends BaseAutomaton {
    constructor(db) {
        super();
        this.db = db;
        this.id = 5;
        this.name = 'A₅ Sheaf Gluer';
        this.role = 'Federation via MetaLogNode DAG';
        this.state = {
            nodes: new Map(),
            dag: {},
            peers: new Set(),
            initialized: false
        };
        if (db) {
            this.nodeManager = new MetaLogNodeManager();
            this.dagManager = new DAGManager();
        }
    }
    async tick(swarm) {
        if (!this.state.initialized) {
            await this.initialize(swarm);
        }
        // Sheaf gluing happens when new nodes arrive from peers
        // This would be triggered by network messages from A₉/A₁₀
    }
    async initialize(swarm) {
        if (!this.db || !this.nodeManager || !this.dagManager) {
            console.warn('A₅: MetaLogDb not provided, using mock federation');
            this.state.initialized = true;
            return;
        }
        try {
            // Initialize DAG with genesis node
            const genesis = swarm.get(0);
            if (genesis && 'getGenesis' in genesis && typeof genesis.getGenesis === 'function') {
                const genesisNode = genesis.getGenesis();
                if (genesisNode && genesisNode.cid) {
                    await this.addNode(genesisNode);
                }
            }
            this.state.initialized = true;
            console.log('A₅: Sheaf Gluer initialized');
        }
        catch (error) {
            console.error('A₅: Error initializing sheaf gluer:', error);
        }
    }
    /**
     * Add a MetaLogNode to the DAG
     */
    async addNode(node) {
        if (!this.nodeManager || !this.dagManager) {
            return;
        }
        try {
            // Verify node using MetaLogNodeManager
            const isValid = await this.nodeManager.verifyNode(node);
            if (!isValid) {
                console.warn('A₅: Invalid node rejected:', node.cid);
                return;
            }
            // Add to DAG
            const cid = node.cid;
            this.state.nodes.set(cid, node);
            // Update DAG structure
            if (node.parent && node.parent !== 'genesis') {
                // Add edge in DAG
                if (!this.state.dag[cid]) {
                    this.state.dag[cid] = [];
                }
                if (!this.state.dag[node.parent]) {
                    this.state.dag[node.parent] = [];
                }
                this.state.dag[node.parent].push(cid);
            }
            // Update DAGManager
            this.dagManager = new DAGManager(this.state.dag);
            console.log(`A₅: Added node ${cid} to DAG`);
        }
        catch (error) {
            console.error('A₅: Error adding node:', error);
        }
    }
    /**
     * Glue sheaves from multiple peers
     */
    async glueSheaves(peerNodes) {
        if (!this.dagManager) {
            return;
        }
        try {
            for (const { peerId, nodes } of peerNodes) {
                this.state.peers.add(peerId);
                for (const node of nodes) {
                    await this.addNode(node);
                }
            }
            // Find LCA for conflict resolution
            const allCids = Array.from(this.state.nodes.keys());
            if (allCids.length >= 2) {
                const lca = this.dagManager.findLCA(allCids[0], allCids[1]);
                if (lca) {
                    console.log(`A₅: Found LCA for conflict resolution: ${lca}`);
                }
            }
            console.log(`A₅: Glued sheaves from ${peerNodes.length} peers`);
        }
        catch (error) {
            console.error('A₅: Error gluing sheaves:', error);
        }
    }
    async receive(from, message) {
        if (message.type === 'add-node') {
            await this.addNode(message.payload?.node);
        }
        else if (message.type === 'glue-sheaves') {
            await this.glueSheaves(message.payload?.peerNodes || []);
        }
    }
    /**
     * Get DAG structure
     */
    getDAG() {
        return this.state.dag;
    }
    /**
     * Get all nodes
     */
    getNodes() {
        return this.state.nodes;
    }
}
//# sourceMappingURL=a5-sheaf-gluer.js.map