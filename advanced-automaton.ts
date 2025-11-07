import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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

interface VerticalTransition {
  id: string;
  type: string;
  fromNode: string;
  toNode: string;
  label: string;
}

type CanvasObject = AutomatonState | Transition | VerticalTransition | any;

class AdvancedSelfReferencingAutomaton {
  private filePath: string;
  private objects: CanvasObject[] = [];
  private currentDimension: number = 0;
  private executionHistory: string[] = [];
  private selfModificationCount: number = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) {
      throw new Error(`Automaton file not found: ${this.filePath}`);
    }

    const content = readFileSync(this.filePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    this.objects = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const obj = JSON.parse(line);
          if (obj && typeof obj === 'object') {
            this.objects.push(obj);
          }
        } catch (error) {
          console.warn(`Failed to parse line ${i + 1}: ${line}`);
        }
      }
    }
    
    console.log(`Loaded ${this.objects.length} objects from ${this.filePath}`);
  }

  private save(): void {
    const jsonlContent = this.objects.map(obj => JSON.stringify(obj)).join('\n');
    writeFileSync(this.filePath, jsonlContent + '\n');
    console.log(`Saved ${this.objects.length} objects to ${this.filePath}`);
  }

  getAutomatonByDimension(level: number): AutomatonState | null {
    const automata = this.objects.filter(obj => 
      obj.type === 'automaton' && 
      (obj as AutomatonState).dimensionalLevel === level
    ) as AutomatonState[];
    
    return automata.length > 0 ? automata[0]! : null;
  }

  getCurrentAutomaton(): AutomatonState | null {
    return this.getAutomatonByDimension(this.currentDimension);
  }

  getVerticalTransition(fromId: string): VerticalTransition | null {
    const transitions = this.objects.filter(obj => 
      obj.type === 'vertical' && 
      (obj as VerticalTransition).fromNode === fromId
    ) as VerticalTransition[];
    
    return transitions.length > 0 ? transitions[0]! : null;
  }

  evaluateCondition(condition: string, context: any = {}): boolean {
    switch (condition) {
      case 'true':
        return true;
      case 'line_number < ∞':
        return true;
      case 'file_exists':
        return existsSync(this.filePath);
      case 'observation':
        return Math.random() > 0.7; // Random observation
      case 'unifiable(a,b)':
        return Math.random() > 0.3;
      case 'numeric(m,n)':
        return Math.random() > 0.4;
      case 'majority_agree':
        return Math.random() > 0.5;
      case 'gradient_descent':
        return Math.random() > 0.6;
      default:
        if (condition.includes('step_count')) {
          const stepCount = context.stepCount || 0;
          return stepCount > 3; // Force progression after a few steps
        }
        return true;
    }
  }

  executeAction(action: string, fromState: string, toState: string, context: any = {}): void {
    console.log(`Executing action: ${action} from ${fromState} to ${toState}`);
    
    switch (action) {
      case 'self-reference':
        this.executeSelfReference();
        break;
      case 'evolve':
        this.executeEvolution();
        break;
      case 'self-modify':
        this.executeSelfModification();
        break;
      case 'compose':
        this.executeComposition();
        break;
      case 'self-io':
        this.executeSelfIO();
        break;
      case 'validate-self':
        this.executeSelfValidation();
        break;
      case 'self-train':
        this.executeSelfTraining();
        break;
      case 'self-observe':
        this.executeSelfObservation();
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
    
    this.executionHistory.push(`${action}:${fromState}→${toState}`);
  }

  private executeSelfReference(): void {
    const currentAutomaton = this.getCurrentAutomaton();
    if (currentAutomaton && currentAutomaton.selfReference) {
      console.log(`Self-reference to line ${currentAutomaton.selfReference.line}: ${currentAutomaton.selfReference.pattern}`);
    }
  }

  private executeEvolution(): void {
    console.log(`Evolving from dimension ${this.currentDimension} to ${this.currentDimension + 1}`);
  }

  private executeSelfModification(): void {
    this.selfModificationCount++;
    
    // Add a new self-reference object
    const newSelfRef = {
      id: `self-ref-modified-${Date.now()}`,
      type: 'file',
      file: this.filePath,
      text: `Self-Reference: Modified at dimension ${this.currentDimension}, modification #${this.selfModificationCount}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      width: 300,
      height: 120,
      color: String((this.selfModificationCount % 6) + 1)
    };
    
    this.objects.push(newSelfRef);
    console.log(`Added self-modification #${this.selfModificationCount}: ${newSelfRef.id}`);
  }

  private executeComposition(): void {
    const automata = this.objects.filter(obj => obj.type === 'automaton') as AutomatonState[];
    if (automata.length >= 2) {
      console.log(`Composed automata: ${automata[0]!.id} + ${automata[1]!.id}`);
    }
  }

  private executeSelfIO(): void {
    this.load();
    console.log(`Performed self-I/O: read ${this.objects.length} objects`);
  }

  private executeSelfValidation(): void {
    const automata = this.objects.filter(obj => obj.type === 'automaton') as AutomatonState[];
    const validAutomata = automata.filter(obj => {
      return obj.selfReference && obj.dimensionalLevel >= 0 && obj.dimensionalLevel <= 7;
    });
    
    console.log(`Validated ${validAutomata.length}/${automata.length} automata`);
  }

  private executeSelfTraining(): void {
    const actionCounts = new Map<string, number>();
    this.executionHistory.forEach(entry => {
      const action = entry.split(':')[0] || 'unknown';
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });
    
    console.log('Learned action frequencies:');
    actionCounts.forEach((count, action) => {
      console.log(`  ${action}: ${count}`);
    });
  }

  private executeSelfObservation(): void {
    const currentAutomaton = this.getCurrentAutomaton();
    if (currentAutomaton) {
      console.log(`Self-observation: Currently at ${currentAutomaton.currentState} (dimension ${currentAutomaton.dimensionalLevel})`);
    }
    
    // Collapse back to 0D after observation
    console.log('Quantum collapse: returning to 0D');
    this.currentDimension = 0;
  }

  step(stepCount: number = 0): void {
    const currentAutomaton = this.getCurrentAutomaton();
    if (!currentAutomaton) {
      console.log('No current automaton found');
      return;
    }

    // First try horizontal transitions
    const horizontalTransitions = this.objects.filter(obj => 
      obj.type === 'transition' && 
      (obj as Transition).from === currentAutomaton.id
    ) as Transition[];

    // Then try vertical transitions for dimensional progression
    const verticalTransition = this.getVerticalTransition(currentAutomaton.id);

    // Prioritize vertical transitions for progression
    const transitions = verticalTransition ? [verticalTransition] : horizontalTransitions;
    
    if (transitions.length === 0) {
      console.log(`No transitions from ${currentAutomaton.id}`);
      return;
    }

    // Execute first valid transition
    for (const transition of transitions) {
      const condition = (transition as any).condition || 'true';
      const context = { stepCount };
      
      if (this.evaluateCondition(condition, context)) {
        const action = (transition as any).action || 'evolve';
        const fromId = (transition as any).from || (transition as any).fromNode;
        const toId = (transition as any).to || (transition as any).toNode;
        
        this.executeAction(action, fromId, toId, context);
        
        // Update current dimension based on target
        const targetAutomaton = this.objects.find(obj => obj.id === toId) as AutomatonState;
        if (targetAutomaton) {
          this.currentDimension = targetAutomaton.dimensionalLevel;
          console.log(`Transitioned to dimension ${targetAutomaton.dimensionalLevel}: ${targetAutomaton.id}`);
        }
        break;
      }
    }
  }

  run(steps: number = 20): void {
    console.log(`Running advanced self-referencing automaton for ${steps} steps...`);
    
    for (let i = 0; i < steps; i++) {
      console.log(`\n--- Step ${i + 1} (Dimension ${this.currentDimension}) ---`);
      this.step(i);
      
      // Force progression if stuck
      if (this.executionHistory.length > 3 && 
          this.executionHistory.slice(-3).every(h => h.includes('self-reference'))) {
        console.log('Forcing dimensional progression...');
        const verticalTransition = this.getVerticalTransition(`0D-automaton`);
        if (verticalTransition) {
          this.currentDimension = (this.currentDimension + 1) % 8;
        }
      }
    }
    
    console.log('\n=== Execution Summary ===');
    console.log(`Total steps: ${steps}`);
    console.log(`Final dimension: ${this.currentDimension}`);
    console.log(`Self-modifications: ${this.selfModificationCount}`);
    console.log(`Execution history: ${this.executionHistory.length} actions`);
    
    // Save any modifications
    if (this.selfModificationCount > 0) {
      this.save();
    }
  }

  printState(): void {
    console.log('=== Advanced Self-Referencing Automaton State ===');
    console.log(`File: ${this.filePath}`);
    console.log(`Total objects: ${this.objects.length}`);
    console.log(`Current dimension: ${this.currentDimension}`);
    console.log(`Self-modifications: ${this.selfModificationCount}`);
    
    const currentAutomaton = this.getCurrentAutomaton();
    if (currentAutomaton) {
      console.log(`Current automaton: ${currentAutomaton.id}`);
      console.log(`State: ${currentAutomaton.currentState}`);
      console.log(`Dimension: ${currentAutomaton.dimensionalLevel}`);
      console.log(`Self-reference: ${JSON.stringify(currentAutomaton.selfReference)}`);
    }
    
    console.log(`Execution history: ${this.executionHistory.length} actions`);
    if (this.executionHistory.length > 0) {
      console.log('Recent actions:');
      this.executionHistory.slice(-5).forEach(action => {
        console.log(`  ${action}`);
      });
    }
  }

  analyzeSelfReference(): void {
    const selfRefs = this.objects.filter(obj => 
      obj.type === 'file' && 
      (obj as any).file === this.filePath
    );

    const automata = this.objects.filter(obj => obj.type === 'automaton') as AutomatonState[];
    
    console.log('=== Self-Reference Analysis ===');
    console.log(`Self-reference objects: ${selfRefs.length}`);
    console.log(`Automaton objects: ${automata.length}`);
    console.log(`Self-modifications: ${this.selfModificationCount}`);
    
    console.log('\nDimensional progression:');
    automata.forEach((auto, index) => {
      console.log(`  ${auto.dimensionalLevel}D: ${auto.id} -> line ${auto.selfReference.line} (${auto.selfReference.pattern})`);
    });
    
    if (selfRefs.length > 0) {
      console.log('\nDynamic self-references:');
      selfRefs.slice(-3).forEach((ref, index) => {
        console.log(`  ${index + 1}. ${(ref as any).id}`);
        if ((ref as any).text) {
          console.log(`     ${(ref as any).text.substring(0, 60)}...`);
        }
      });
    }
  }
}

// Main execution
async function main() {
  const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
  
  console.log('=== Advanced Self-Referencing JSONL Automaton ===');
  automaton.printState();
  automaton.analyzeSelfReference();
  
  // Run the automaton
  automaton.run(20);
  
  console.log('\n=== Final State ===');
  automaton.printState();
  automaton.analyzeSelfReference();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { AdvancedSelfReferencingAutomaton };