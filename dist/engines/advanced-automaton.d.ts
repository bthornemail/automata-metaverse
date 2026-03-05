import { MetaLogDb } from 'meta-log-db';
import type { AutomatonState, VerticalTransition } from '../types/automaton-state.js';
declare class AdvancedSelfReferencingAutomaton {
    private filePath;
    private db;
    private objects;
    private currentDimension;
    private executionHistory;
    private selfModificationCount;
    private readonly MAX_EXECUTION_HISTORY;
    private objectPool;
    constructor(filePath: string, db?: MetaLogDb);
    /**
     * Initialize the automaton by loading the file
     * Call this after construction if you need to ensure the file is loaded
     */
    init(): Promise<void>;
    /**
     * Flatten Canvas structure to array of objects
     */
    private flattenCanvas;
    private load;
    protected save(): void;
    getAutomatonByDimension(level: number): AutomatonState | null;
    getCurrentAutomaton(): AutomatonState | null;
    getVerticalTransition(fromId: string): VerticalTransition | null;
    evaluateCondition(condition: string, context?: any): boolean;
    executeAction(action: string, fromState: string, toState: string, context?: any): void;
    private executeSelfReference;
    private generateChurchEncoding;
    private executeEvolution;
    private generateTopologyCode;
    protected executeSelfModification(): void;
    private generateModificationCode;
    private executeComposition;
    private executeSelfIO;
    private executeSelfValidation;
    private executeSelfTraining;
    private executeSelfObservation;
    step(stepCount?: number): void;
    run(steps?: number): void;
    /**
     * Optimize memory by trimming history and deduplicating objects
     */
    optimizeMemory(): void;
    printState(): void;
    analyzeSelfReference(): void;
}
export { AdvancedSelfReferencingAutomaton };
//# sourceMappingURL=advanced-automaton.d.ts.map