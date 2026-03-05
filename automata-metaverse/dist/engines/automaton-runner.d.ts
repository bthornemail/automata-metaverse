interface AutomatonState {
    id: string;
    type: string;
    currentState: string;
    dimensionalLevel: number;
    selfReference: {
        file: string;
        line: number;
        pattern: string;
    };
    provenanceHistory?: Array<{
        file: string;
        line: number;
        pattern?: string;
    }>;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    text?: string;
}
interface Transition {
    id: string;
    type: string;
    from: string;
    to: string;
    condition: string;
    action: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    text?: string;
}
interface SelfReference {
    id: string;
    type: string;
    file: string;
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
}
declare class SelfReferencingAutomaton {
    private filePath;
    private objects;
    private currentLine;
    private executionHistory;
    private readonly MAX_EXECUTION_HISTORY;
    private objectPool;
    constructor(filePath: string);
    cleanup(): void;
    private load;
    private save;
    getAutomataByDimension(level: number): AutomatonState[];
    getCurrentAutomaton(): AutomatonState | null;
    getTransitionsFrom(automatonId: string): Transition[];
    evaluateCondition(condition: string): boolean;
    executeAction(action: string, fromState: string, toState: string): void;
    private executeSelfReference;
    private executeEvolution;
    private executeSelfModification;
    private executeComposition;
    private executeSelfIO;
    private executeSelfValidation;
    private executeSelfTraining;
    private executeSelfObservation;
    step(): void;
    run(steps?: number): void;
    printState(): void;
    getSelfReferences(): SelfReference[];
    analyzeSelfReference(): void;
}
export { SelfReferencingAutomaton };
//# sourceMappingURL=automaton-runner.d.ts.map