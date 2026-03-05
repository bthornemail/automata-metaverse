import { AdvancedSelfReferencingAutomaton } from './advanced-automaton.js';
import { MetaLogDb } from 'meta-log-db';
class ContinuousAutomatonRunner {
    constructor(automatonFile = './automaton.jsonl', useOllama = false, ollamaModel = 'llama3.2', db) {
        this.isRunning = false;
        this.iterationCount = 0;
        this.maxIterations = Infinity;
        this.useOllama = false;
        this.ollamaModel = 'llama3.2';
        this.initialized = false;
        this.automaton = new AdvancedSelfReferencingAutomaton(automatonFile, db);
        this.useOllama = useOllama;
        this.ollamaModel = ollamaModel;
    }
    /**
     * Initialize the automaton (loads the file)
     */
    async init() {
        if (!this.initialized) {
            await this.automaton.init();
            this.initialized = true;
        }
    }
    getSmartAction() {
        const currentDimension = this.automaton.currentDimension;
        const selfModifications = this.automaton.selfModificationCount;
        const history = this.automaton.executionHistory;
        const iterationCount = this.iterationCount;
        // Intelligent action selection based on context
        if (iterationCount % 20 === 0) {
            return 'self-modify'; // Periodic self-modification
        }
        if (iterationCount % 15 === 0) {
            return 'self-io'; // Periodic self-I/O
        }
        if (iterationCount % 10 === 0) {
            return 'validate-self'; // Periodic validation
        }
        if (iterationCount % 8 === 0) {
            return 'self-train'; // Periodic learning
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
    async executeAction(action) {
        const currentAutomaton = this.automaton.getCurrentAutomaton();
        if (!currentAutomaton)
            return;
        console.log(`🎯 Executing: ${action}`);
        switch (action) {
            case 'evolve':
                this.automaton.executeEvolution();
                this.progressDimension();
                break;
            case 'self-reference':
                this.automaton.executeSelfReference();
                break;
            case 'self-modify':
                this.automaton.executeSelfModification();
                break;
            case 'self-io':
                await this.automaton.executeSelfIO();
                break;
            case 'validate-self':
                this.automaton.executeSelfValidation();
                break;
            case 'self-train':
                this.automaton.executeSelfTraining();
                break;
            case 'self-observe':
                this.automaton.executeSelfObservation();
                break;
            case 'compose':
                this.automaton.executeComposition();
                break;
        }
    }
    progressDimension() {
        const currentDim = this.automaton.currentDimension;
        const nextDim = (currentDim + 1) % 8;
        this.automaton.currentDimension = nextDim;
    }
    printStatus() {
        const currentAutomaton = this.automaton.getCurrentAutomaton();
        const selfModifications = this.automaton.selfModificationCount;
        const totalObjects = this.automaton.objects.length;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 Iteration ${this.iterationCount} | Dimension ${this.automaton.currentDimension}`);
        console.log(`📍 State: ${currentAutomaton?.currentState}`);
        console.log(`🔗 Self-reference: line ${currentAutomaton?.selfReference.line} (${currentAutomaton?.selfReference.pattern})`);
        console.log(`🔧 Self-modifications: ${selfModifications}`);
        console.log(`📚 Total objects: ${totalObjects}`);
        console.log(`🤖 AI Mode: ${this.useOllama ? this.ollamaModel : 'Built-in logic'}`);
    }
    async saveAndAnalyze() {
        if (this.iterationCount % 25 === 0) {
            console.log('💾 Saving automaton state...');
            this.automaton.save();
            console.log('📊 Analyzing self-reference...');
            this.automaton.analyzeSelfReference();
        }
    }
    async startContinuous(intervalMs = 2000, maxIterations) {
        if (this.isRunning) {
            console.log('⚠️ Automaton is already running');
            return;
        }
        // Ensure automaton is initialized
        if (!this.initialized) {
            await this.init();
        }
        this.isRunning = true;
        this.maxIterations = maxIterations || Infinity;
        this.iterationCount = 0;
        console.log(`🚀 Starting continuous automaton`);
        console.log(`⏱️  Interval: ${intervalMs}ms`);
        console.log(`🔄 Max iterations: ${this.maxIterations === Infinity ? 'unlimited' : this.maxIterations}`);
        console.log(`🤖 AI Mode: ${this.useOllama ? this.ollamaModel : 'Built-in intelligent logic'}`);
        this.automaton.printState();
        const runLoop = async () => {
            while (this.isRunning && this.iterationCount < this.maxIterations) {
                this.printStatus();
                let action;
                if (this.useOllama) {
                    // Try to use Ollama, fallback to built-in logic
                    try {
                        action = await this.getOllamaAction();
                    }
                    catch (error) {
                        console.log('⚠️ Ollama failed, using built-in logic');
                        action = this.getSmartAction();
                    }
                }
                else {
                    action = this.getSmartAction();
                }
                await this.executeAction(action);
                await this.saveAndAnalyze();
                this.iterationCount++;
                if (this.iterationCount < this.maxIterations) {
                    console.log(`⏳ Waiting ${intervalMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }
            }
            this.isRunning = false;
            console.log('\n🏁 Continuous execution completed');
            this.automaton.printState();
            this.automaton.analyzeSelfReference();
        };
        await runLoop();
    }
    async getOllamaAction() {
        // This would integrate with Ollama - for now return smart action
        return this.getSmartAction();
    }
    stop() {
        this.isRunning = false;
        console.log('🛑 Stopping continuous execution...');
    }
}
// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const useOllama = args.includes('--ollama');
    const model = args.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'llama3.2';
    // Parse arguments from bash script: interval [--max maxIterations] [automatonFile]
    let argIndex = 0;
    let maxIterations = undefined;
    let automatonFile = './automaton.jsonl';
    // First arg: interval (find first numeric argument)
    const intervalArg = args.find(arg => !isNaN(parseInt(arg)));
    const interval = intervalArg ? parseInt(intervalArg) : 2000;
    // Skip interval arg if found
    if (intervalArg) {
        const intervalIndex = args.indexOf(intervalArg);
        if (intervalIndex >= 0) {
            argIndex = intervalIndex + 1;
        }
    }
    // Check for --max flag
    const maxIndex = args.findIndex(arg => arg === '--max');
    if (maxIndex >= 0 && maxIndex + 1 < args.length) {
        const maxArg = args[maxIndex + 1];
        if (maxArg) {
            maxIterations = parseInt(maxArg);
        }
    }
    // Last argument that looks like a file path is the automaton file
    for (let i = args.length - 1; i >= 0; i--) {
        const arg = args[i];
        if (arg && (arg.endsWith('.jsonl') || (arg.includes('/') && !arg.startsWith('--') && arg !== '--max'))) {
            automatonFile = arg;
            break;
        }
    }
    console.log('🤖 Continuous Self-Referencing Automaton');
    console.log('='.repeat(50));
    const db = new MetaLogDb({ enableProlog: true, enableDatalog: true });
    const runner = new ContinuousAutomatonRunner(automatonFile, useOllama, model, db);
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, stopping...');
        runner.stop();
        process.exit(0);
    });
    await runner.startContinuous(interval, maxIterations);
}
if (require.main === module) {
    main().catch(console.error);
}
export { ContinuousAutomatonRunner };
//# sourceMappingURL=continuous-automaton.js.map