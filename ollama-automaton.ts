import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

interface OllamaResponse {
  response: string;
  done: boolean;
}

class OllamaAutomatonRunner {
  private automaton: AdvancedSelfReferencingAutomaton;
  private ollamaModel: string;
  private isRunning: boolean = false;
  private iterationCount: number = 0;
  private maxIterations: number = Infinity;

  constructor(
    automatonFile: string = './automaton.jsonl',
    ollamaModel: string = 'llama3.2'
  ) {
    this.automaton = new AdvancedSelfReferencingAutomaton(automatonFile);
    this.ollamaModel = ollamaModel;
  }

  private async queryOllama(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ollama = spawn('ollama', ['run', this.ollamaModel]);
      let output = '';
      let error = '';

      ollama.stdin.write(prompt);
      ollama.stdin.end();

      ollama.stdout.on('data', (data) => {
        output += data.toString();
      });

      ollama.stderr.on('data', (data) => {
        error += data.toString();
      });

      ollama.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ollama exited with code ${code}: ${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  private generateContextPrompt(): string {
    const currentAutomaton = this.automaton.getCurrentAutomaton();
    const history = (this.automaton as any).executionHistory.slice(-5);
    
    return `
You are an AI controller for a self-referencing JSONL automaton. The automaton operates across 8 dimensions (0D-7D) with the following states:

0D: identity (λx.x) - Self-reference foundation
1D: successor (λn.λf.λx.f(nfx)) - Temporal evolution  
2D: pair (λx.λy.λf.fxy) - Pattern matching
3D: addition (λm.λn.λf.λx.mf(nfx)) - Algebraic composition
4D: network (localhost:8080) - File I/O operations
5D: consensus (blockchain) - Self-validation
6D: intelligence (neural_network) - Self-learning
7D: quantum (|ψ⟩ = α|0⟩ + β|1⟩) - Self-observation

Current state:
- Dimension: ${this.automaton.getCurrentAutomaton()?.dimensionalLevel}
- State: ${currentAutomaton?.currentState}
- Self-reference: line ${currentAutomaton?.selfReference.line}
- Pattern: ${currentAutomaton?.selfReference.pattern}
- Iteration: ${this.iterationCount}
- Recent actions: ${history.join(', ')}

Available actions:
- evolve: Progress to next dimension
- self-reference: Execute self-reference pattern
- self-modify: Add new self-referential object
- self-io: Read/write own JSONL file
- validate-self: Check SHACL compliance
- self-train: Learn from execution history
- self-observe: Quantum observation and collapse
- compose: Compose multiple states

Respond with ONLY the action name that should be executed next. Consider:
1. Dimensional context and mathematical meaning
2. Execution history patterns
3. Self-referential integrity
4. Exploration vs exploitation balance

Action:`;
  }

  private async executeAIAction(): Promise<void> {
    try {
      const prompt = this.generateContextPrompt();
      console.log(`🤖 Querying Ollama (${this.ollamaModel})...`);
      
      const response = await this.queryOllama(prompt);
      const action = response.toLowerCase().trim().replace(/\s+/g, '-');
      
      console.log(`🧠 AI Decision: ${action}`);
      
      // Execute the chosen action
      const currentAutomaton = this.automaton.getCurrentAutomaton();
      if (currentAutomaton) {
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
          default:
            console.log(`⚠️ Unknown action: ${action}, defaulting to evolve`);
            (this.automaton as any).executeEvolution();
            this.progressDimension();
        }
      }
      
    } catch (error) {
      console.error('❌ Ollama query failed:', error);
      // Fallback to automatic evolution
      (this.automaton as any).executeEvolution();
      this.progressDimension();
    }
  }

  private progressDimension(): void {
    const currentDim = (this.automaton as any).currentDimension;
    const nextDim = (currentDim + 1) % 8;
    (this.automaton as any).currentDimension = nextDim;
    console.log(`📈 Progressed to dimension ${nextDim}`);
  }

  private async saveAndAnalyze(): Promise<void> {
    if (this.iterationCount % 10 === 0) {
      console.log('💾 Saving automaton state...');
      (this.automaton as any).save();
      
      console.log('📊 Analyzing self-reference...');
      this.automaton.analyzeSelfReference();
    }
  }

  private printStatus(): void {
    const currentAutomaton = this.automaton.getCurrentAutomaton();
    const selfModifications = (this.automaton as any).selfModificationCount;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Iteration ${this.iterationCount} | Dimension ${(this.automaton as any).currentDimension}`);
    console.log(`📍 State: ${currentAutomaton?.currentState}`);
    console.log(`🔗 Self-reference: line ${currentAutomaton?.selfReference.line} (${currentAutomaton?.selfReference.pattern})`);
    console.log(`🔧 Self-modifications: ${selfModifications}`);
    console.log(`📚 Total objects: ${(this.automaton as any).objects.length}`);
  }

  public async startContinuous(
    intervalMs: number = 2000,
    maxIterations?: number
  ): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Automaton is already running');
      return;
    }

    // Check if Ollama is available
    try {
      await this.queryOllama('test');
    } catch (error) {
      console.error('❌ Ollama not available. Please install Ollama first:');
      console.error('   curl -fsSL https://ollama.ai/install.sh | sh');
      console.error('   ollama pull llama3.2');
      return;
    }

    this.isRunning = true;
    this.maxIterations = maxIterations || Infinity;
    this.iterationCount = 0;

    console.log(`🚀 Starting continuous automaton with ${this.ollamaModel}`);
    console.log(`⏱️  Interval: ${intervalMs}ms`);
    console.log(`🔄 Max iterations: ${this.maxIterations === Infinity ? 'unlimited' : this.maxIterations}`);
    
    this.automaton.printState();

    const runLoop = async () => {
      while (this.isRunning && this.iterationCount < this.maxIterations) {
        this.printStatus();
        
        await this.executeAIAction();
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

  public stop(): void {
    this.isRunning = false;
    console.log('🛑 Stopping continuous execution...');
  }

  public getStatus(): void {
    console.log('📊 Current Status:');
    console.log(`  Running: ${this.isRunning}`);
    console.log(`  Iteration: ${this.iterationCount}`);
    console.log(`  Dimension: ${(this.automaton as any).currentDimension || 0}`);
    console.log(`  Model: ${this.ollamaModel}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const model = args[0] || 'llama3.2';
  const interval = parseInt(args[1] || '3000') || 3000;
  const maxIterations = args[2] ? parseInt(args[2]) : undefined;

  console.log('🤖 Ollama-Powered Self-Referencing Automaton');
  console.log('=' .repeat(50));

  const runner = new OllamaAutomatonRunner('./automaton.jsonl', model);

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

export { OllamaAutomatonRunner };