import { AdvancedSelfReferencingAutomaton } from '../advanced-automaton/advanced-automaton';

class ContinuousAutomatonRunner {
  private automaton: AdvancedSelfReferencingAutomaton;
  private isRunning: boolean = false;
  private iterationCount: number = 0;
  private maxIterations: number = Infinity;
  private useOllama: boolean = false;
  private ollamaModel: string = 'llama3.2';

  constructor(
    automatonFile: string = './automaton.jsonl',
    useOllama: boolean = false,
    ollamaModel: string = 'llama3.2'
  ) {
    this.automaton = new AdvancedSelfReferencingAutomaton(automatonFile);
    this.useOllama = useOllama;
    this.ollamaModel = ollamaModel;
  }

  private getSmartAction(): string {
    const currentDimension = (this.automaton as any).currentDimension;
    const selfModifications = (this.automaton as any).selfModificationCount;
    const history = (this.automaton as any).executionHistory;
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

  private async executeAction(action: string): Promise<void> {
    const currentAutomaton = this.automaton.getCurrentAutomaton();
    if (!currentAutomaton) return;

    console.log(`🎯 Executing: ${action}`);
    
    switch (action) {
      case 'evolve':
        (this.automaton as any).executeEvolution();
        this.progressDimension();
        break;
      case 'self-reference':
        (this.automaton as any).executeSelfReference();
        break;
      case 'self-modify':
        (this.automaton as any).executeSelfModification();
        break;
      case 'self-io':
        (this.automaton as any).executeSelfIO();
        break;
      case 'validate-self':
        (this.automaton as any).executeSelfValidation();
        break;
      case 'self-train':
        (this.automaton as any).executeSelfTraining();
        break;
      case 'self-observe':
        (this.automaton as any).executeSelfObservation();
        break;
      case 'compose':
        (this.automaton as any).executeComposition();
        break;
    }
  }

  private progressDimension(): void {
    const currentDim = (this.automaton as any).currentDimension;
    const nextDim = (currentDim + 1) % 8;
    (this.automaton as any).currentDimension = nextDim;
  }

  private printStatus(): void {
    const currentAutomaton = this.automaton.getCurrentAutomaton();
    const selfModifications = (this.automaton as any).selfModificationCount;
    const totalObjects = (this.automaton as any).objects.length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Iteration ${this.iterationCount} | Dimension ${(this.automaton as any).currentDimension}`);
    console.log(`📍 State: ${currentAutomaton?.currentState}`);
    console.log(`🔗 Self-reference: line ${currentAutomaton?.selfReference.line} (${currentAutomaton?.selfReference.pattern})`);
    console.log(`🔧 Self-modifications: ${selfModifications}`);
    console.log(`📚 Total objects: ${totalObjects}`);
    console.log(`🤖 AI Mode: ${this.useOllama ? this.ollamaModel : 'Built-in logic'}`);
  }

  private async saveAndAnalyze(): Promise<void> {
    if (this.iterationCount % 25 === 0) {
      console.log('💾 Saving automaton state...');
      (this.automaton as any).save();
      
      console.log('📊 Analyzing self-reference...');
      this.automaton.analyzeSelfReference();
    }
  }

  public async startContinuous(
    intervalMs: number = 2000,
    maxIterations?: number
  ): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Automaton is already running');
      return;
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
        
        let action: string;
        if (this.useOllama) {
          // Try to use Ollama, fallback to built-in logic
          try {
            action = await this.getOllamaAction();
          } catch (error) {
            console.log('⚠️ Ollama failed, using built-in logic');
            action = this.getSmartAction();
          }
        } else {
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

  private async getOllamaAction(): Promise<string> {
    // This would integrate with Ollama - for now return smart action
    return this.getSmartAction();
  }

  public stop(): void {
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
  let maxIterations: number | undefined = undefined;
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
  console.log('=' .repeat(50));

  const runner = new ContinuousAutomatonRunner(automatonFile, useOllama, model);

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