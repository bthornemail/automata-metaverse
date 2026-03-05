import { MetaLogDb } from 'meta-log-db';
declare class OllamaAutomatonRunner {
    private automaton;
    private ollamaModel;
    private isRunning;
    private iterationCount;
    private maxIterations;
    private opencodeModels;
    private initialized;
    constructor(automatonFile?: string, ollamaModel?: string, db?: MetaLogDb);
    /**
     * Initialize the automaton (loads the file)
     */
    init(): Promise<void>;
    private loadOpenCodeModels;
    private isOpenCodeModel;
    private queryOllama;
    private queryOllamaHTTP;
    private queryOllamaOpenAICompatible;
    private queryOllamaCLI;
    private generateContextPrompt;
    private printDecisionTrie;
    private inferReasoning;
    private executeAIAction;
    private getDimensionName;
    private progressDimension;
    private saveAndAnalyze;
    private printStatus;
    startContinuous(intervalMs?: number, maxIterations?: number): Promise<void>;
    stop(): void;
    getStatus(): void;
}
export { OllamaAutomatonRunner };
//# sourceMappingURL=ollama-automaton.d.ts.map