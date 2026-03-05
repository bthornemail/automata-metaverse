/**
 * 0D-Topology Automaton
 *
 * Foundation automaton for topology operations (0D dimension)
 */
import { MLVectorClockAutomaton, type MetaLog, type SwarmContext, type AutomatonMessage, type AutomatonState } from '../ml-vector-clock-automaton.js';
/**
 * 0D-Topology Automaton
 *
 * Manages quantum vacuum topology and identity processes
 */
export declare class A0_TopologyAutomaton extends MLVectorClockAutomaton {
    constructor(id?: string | number, metaLog?: MetaLog | null);
    /**
     * Execute 0D topology tick
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    protected executeTick(swarm: SwarmContext | null): Promise<void>;
    /**
     * Execute receive for 0D topology
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    protected executeReceive(from: string | number, message: AutomatonMessage): Promise<void>;
    /**
     * Validate homology for 0D topology
     *
     * @param {AutomatonState} state - State to validate
     * @returns {Promise<boolean>} True if valid
     */
    validateHomology(state: AutomatonState): Promise<boolean>;
}
//# sourceMappingURL=0d-topology-automaton.d.ts.map