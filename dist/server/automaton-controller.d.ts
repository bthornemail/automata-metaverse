/**
 * Automaton Controller
 *
 * Handles automaton control functions (start, stop, execute actions, etc.)
 */
import { AdvancedSelfReferencingAutomaton } from '../engines/advanced-automaton.js';
import type { Server as SocketIOServer } from 'socket.io';
export interface AutomatonState {
    automaton: AdvancedSelfReferencingAutomaton;
    isRunning: boolean;
    intervalId: NodeJS.Timeout | null;
}
export interface AutomatonControllerConfig {
    automaton: AdvancedSelfReferencingAutomaton;
    io?: SocketIOServer;
}
export declare class AutomatonController {
    private state;
    private io?;
    constructor(config: AutomatonControllerConfig);
    /**
     * Emit event to Socket.IO if available
     */
    private emit;
    /**
     * Start automaton execution
     */
    start(intervalMs: number, maxIterations: number): void;
    /**
     * Stop automaton execution
     */
    stop(): void;
    /**
     * Execute a single action (exponential, forward propagation)
     * Actions are exponential transformations: Affine → Projective
     * Effect: Forward propagation, exponential growth
     */
    executeAction(action: string): void;
    /**
     * Execute observation (linear, backward propagation)
     * Observations are linear transformations: Projective → Affine
     * Effect: Backward propagation, linear collapse
     */
    executeObservation(observation: string): void;
    /**
     * Progress to next dimension
     */
    private progressDimension;
    /**
     * Get smart action based on current state
     */
    private getSmartAction;
    /**
     * Get current state
     */
    getState(): AutomatonState;
    /**
     * Get automaton instance
     */
    getAutomaton(): AdvancedSelfReferencingAutomaton;
    /**
     * Reset automaton
     */
    reset(filePath?: string): void;
}
//# sourceMappingURL=automaton-controller.d.ts.map