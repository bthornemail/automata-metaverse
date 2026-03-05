import { MetaLogDb } from 'meta-log-db';
declare class ContinuousAutomatonRunner {
    private automaton;
    private isRunning;
    private iterationCount;
    private maxIterations;
    private useOllama;
    private ollamaModel;
    private initialized;
    constructor(automatonFile?: string, useOllama?: boolean, ollamaModel?: string, db?: MetaLogDb);
    /**
     * Initialize the automaton (loads the file)
     */
    init(): Promise<void>;
    private getSmartAction;
    private executeAction;
    private progressDimension;
    private printStatus;
    private saveAndAnalyze;
    startContinuous(intervalMs?: number, maxIterations?: number): Promise<void>;
    private getOllamaAction;
    stop(): void;
}
export { ContinuousAutomatonRunner };
//# sourceMappingURL=continuous-automaton.d.ts.map