/**
 * Automaton Controller
 *
 * Handles automaton control functions (start, stop, execute actions, etc.)
 */
import { AdvancedSelfReferencingAutomaton } from '../engines/advanced-automaton.js';
export class AutomatonController {
    constructor(config) {
        this.state = {
            automaton: config.automaton,
            isRunning: false,
            intervalId: null,
        };
        this.io = config.io;
    }
    /**
     * Emit event to Socket.IO if available
     */
    emit(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    /**
     * Start automaton execution
     */
    start(intervalMs, maxIterations) {
        if (this.state.isRunning)
            return;
        this.state.isRunning = true;
        let iterationCount = 0;
        console.log(`🚀 Starting automaton with ${intervalMs}ms interval`);
        this.state.intervalId = setInterval(() => {
            if (iterationCount >= maxIterations) {
                this.stop();
                return;
            }
            // Get smart action based on current state
            const currentDimension = this.state.automaton.currentDimension;
            const action = this.getSmartAction(currentDimension, iterationCount);
            this.executeAction(action);
            // Emit status update
            this.emit('status', {
                isRunning: true,
                currentDimension: this.state.automaton.currentDimension,
                iterationCount: this.state.automaton.executionHistory.length,
                selfModificationCount: this.state.automaton.selfModificationCount,
                totalObjects: this.state.automaton.objects.length,
                executionMode: 'builtin',
                status: 'running',
                lastAction: action,
            });
            iterationCount++;
        }, intervalMs);
    }
    /**
     * Stop automaton execution
     */
    stop() {
        if (!this.state.isRunning)
            return;
        this.state.isRunning = false;
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
            this.state.intervalId = null;
        }
        console.log('🛑 Automaton stopped');
        // Emit status update
        if (this.io) {
            this.io.emit('status', {
                isRunning: false,
                currentDimension: this.state.automaton.currentDimension || '0D',
                iterationCount: this.state.automaton.executionHistory?.length || 0,
                selfModificationCount: this.state.automaton.selfModificationCount || 0,
                totalObjects: this.state.automaton.objects?.length || 0,
                executionMode: 'builtin',
                status: 'idle',
            });
        }
    }
    /**
     * Execute a single action (exponential, forward propagation)
     * Actions are exponential transformations: Affine → Projective
     * Effect: Forward propagation, exponential growth
     */
    executeAction(action) {
        try {
            console.log(`🎯 Executing ACTION (exponential): ${action}`);
            const currentDim = this.state.automaton.currentDimension;
            const iterationCount = this.state.automaton.executionHistory?.length || 0;
            let fromDim = currentDim;
            let toDim = currentDim;
            // Actions are exponential (forward, projective)
            switch (action) {
                case 'evolve':
                    this.state.automaton.executeEvolution();
                    this.progressDimension();
                    toDim = this.state.automaton.currentDimension;
                    break;
                case 'self-modify':
                    this.state.automaton.executeSelfModification();
                    if (this.io) {
                        this.io.emit('modification', { type: 'self-modify', timestamp: Date.now() });
                    }
                    break;
                case 'self-io':
                    this.state.automaton.executeSelfIO();
                    break;
                case 'self-train':
                    this.state.automaton.executeSelfTraining();
                    break;
                case 'compose':
                    this.state.automaton.executeComposition();
                    break;
                default:
                    console.warn(`Unknown action: ${action}`);
            }
            // Add to execution history
            const historyEntry = {
                iteration: typeof iterationCount === 'number' ? iterationCount : 0,
                action: typeof action === 'string' ? action : 'unknown',
                from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
                to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
                timestamp: Date.now()
            };
            if (historyEntry && typeof historyEntry === 'object' && !Array.isArray(historyEntry)) {
                if (!this.state.automaton.executionHistory) {
                    this.state.automaton.executionHistory = [];
                }
                this.state.automaton.executionHistory.push(historyEntry);
            }
            // Emit action execution (exponential transformation)
            const actionData = {
                action: typeof action === 'string' ? action : 'unknown',
                result: 'success',
                timestamp: Date.now(),
                from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
                to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
                iteration: typeof iterationCount === 'number' ? iterationCount : 0,
                type: 'action', // exponential
                transformation: 'exponential' // forward propagation
            };
            if (actionData && typeof actionData === 'object' && !Array.isArray(actionData) && this.io) {
                this.io.emit('action', actionData);
            }
        }
        catch (error) {
            console.error(`❌ Failed to execute action ${action}:`, error);
            let errorMessage;
            try {
                errorMessage = error instanceof Error ? error.message : String(error);
            }
            catch (e) {
                errorMessage = 'Unknown error occurred';
            }
            if (this.io) {
                this.io.emit('error', { action: action, error: errorMessage });
            }
        }
    }
    /**
     * Execute observation (linear, backward propagation)
     * Observations are linear transformations: Projective → Affine
     * Effect: Backward propagation, linear collapse
     */
    executeObservation(observation) {
        try {
            console.log(`👁️ Executing OBSERVATION (linear): ${observation}`);
            const currentDim = this.state.automaton.currentDimension;
            const iterationCount = this.state.automaton.executionHistory?.length || 0;
            // Observations are linear (backward, affine)
            switch (observation) {
                case 'self-reference':
                    this.state.automaton.executeSelfReference();
                    break;
                case 'validate-self':
                    this.state.automaton.executeSelfValidation();
                    break;
                case 'self-observe':
                    this.state.automaton.executeSelfObservation();
                    break;
                default:
                    console.warn(`Unknown observation: ${observation}`);
            }
            // Add to execution history
            const historyEntry = {
                iteration: typeof iterationCount === 'number' ? iterationCount : 0,
                observation: typeof observation === 'string' ? observation : 'unknown',
                dimension: typeof currentDim === 'number' ? `${currentDim}D` : 'unknown',
                timestamp: Date.now(),
                type: 'observation', // linear
                transformation: 'linear' // backward propagation
            };
            if (historyEntry && typeof historyEntry === 'object' && !Array.isArray(historyEntry)) {
                if (!this.state.automaton.executionHistory) {
                    this.state.automaton.executionHistory = [];
                }
                this.state.automaton.executionHistory.push(historyEntry);
            }
            // Emit observation execution (linear transformation)
            const observationData = {
                observation: typeof observation === 'string' ? observation : 'unknown',
                result: 'success',
                timestamp: Date.now(),
                dimension: typeof currentDim === 'number' ? `${currentDim}D` : 'unknown',
                iteration: typeof iterationCount === 'number' ? iterationCount : 0,
                type: 'observation', // linear
                transformation: 'linear' // backward propagation
            };
            if (observationData && typeof observationData === 'object' && !Array.isArray(observationData) && this.io) {
                this.io.emit('observation', observationData);
            }
        }
        catch (error) {
            console.error(`❌ Failed to execute observation ${observation}:`, error);
            let errorMessage;
            try {
                errorMessage = error instanceof Error ? error.message : String(error);
            }
            catch (e) {
                errorMessage = 'Unknown error occurred';
            }
            if (this.io) {
                this.io.emit('error', { observation: observation, error: errorMessage });
            }
        }
    }
    /**
     * Progress to next dimension
     */
    progressDimension() {
        const currentDim = this.state.automaton.currentDimension;
        const nextDim = (currentDim + 1) % 8;
        this.state.automaton.currentDimension = nextDim;
        if (this.io) {
            this.io.emit('dimension', { dimension: nextDim });
        }
    }
    /**
     * Get smart action based on current state
     */
    getSmartAction(currentDimension, iterationCount) {
        // Intelligent action selection based on context
        if (iterationCount % 20 === 0) {
            return 'self-modify';
        }
        if (iterationCount % 15 === 0) {
            return 'self-io';
        }
        if (iterationCount % 10 === 0) {
            return 'validate-self';
        }
        if (iterationCount % 8 === 0) {
            return 'self-train';
        }
        // Dimension-specific actions
        switch (currentDimension) {
            case 0:
                return Math.random() > 0.7 ? 'self-reference' : 'evolve';
            case 2:
                return Math.random() > 0.6 ? 'self-modify' : 'evolve';
            case 4:
                return Math.random() > 0.5 ? 'self-io' : 'evolve';
            case 6:
                return Math.random() > 0.4 ? 'self-train' : 'evolve';
            case 7:
                return Math.random() > 0.3 ? 'self-observe' : 'evolve';
            default:
                return 'evolve';
        }
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get automaton instance
     */
    getAutomaton() {
        return this.state.automaton;
    }
    /**
     * Reset automaton
     */
    reset(filePath = './automaton.jsonl') {
        this.stop();
        try {
            this.state.automaton = new AdvancedSelfReferencingAutomaton(filePath);
            console.log('✅ Automaton reset successfully');
        }
        catch (error) {
            console.error('❌ Failed to reset automaton:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=automaton-controller.js.map