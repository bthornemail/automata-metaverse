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

type CanvasObject = AutomatonState | Transition | SelfReference | any;

class SelfReferencingAutomaton {
  private filePath: string;
  private objects: CanvasObject[] = [];
  private currentLine: number = 0;
  private executionHistory: string[] = [];

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
          this.objects.push(obj);
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

  getAutomataByDimension(level: number): AutomatonState[] {
    return this.objects.filter(obj => 
      obj.type === 'automaton' && 
      (obj as AutomatonState).dimensionalLevel === level
    ) as AutomatonState[];
  }

  getCurrentAutomaton(): AutomatonState | null {
    const automata = this.getAutomataByDimension(this.currentLine % 8);
    return automata.length > 0 ? automata[0]! : null;
  }

  getTransitionsFrom(automatonId: string): Transition[] {
    return this.objects.filter(obj => 
      obj.type === 'transition' && 
      (obj as Transition).from === automatonId
    ) as Transition[];
  }

  evaluateCondition(condition: string): boolean {
    // Simple condition evaluator
    switch (condition) {
      case 'true':
        return true;
      case 'line_number < ∞':
        return true;
      case 'file_exists':
        return existsSync(this.filePath);
      case 'observation':
        return Math.random() > 0.5; // Random observation
      default:
        return true; // Default to true for unknown conditions
    }
  }

  executeAction(action: string, fromState: string, toState: string): void {
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
    this.currentLine = (this.currentLine + 1) % this.objects.length;
    console.log(`Evolved to line ${this.currentLine}`);
  }

  private executeSelfModification(): void {
    // Add a new self-reference object
    const newSelfRef: SelfReference = {
      id: `self-ref-modified-${Date.now()}`,
      type: 'file',
      file: this.filePath,
      text: `Self-Reference: Modified at line ${this.currentLine}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000
    };
    
    this.objects.push(newSelfRef);
    console.log(`Added self-modification reference: ${newSelfRef.id}`);
  }

  private executeComposition(): void {
    // Compose two automata states
    const automata = this.getAutomataByDimension(0);
    if (automata.length >= 2) {
      console.log(`Composed automata: ${automata[0]!.id} + ${automata[1]!.id}`);
    }
  }

  private executeSelfIO(): void {
    // Read and write to self
    this.load();
    console.log(`Performed self-I/O: read ${this.objects.length} objects`);
  }

  private executeSelfValidation(): void {
    // Validate SHACL constraints
    const automata = this.objects.filter(obj => obj.type === 'automaton');
    const validAutomata = automata.filter(obj => {
      const auto = obj as AutomatonState;
      return auto.selfReference && auto.dimensionalLevel >= 0 && auto.dimensionalLevel <= 7;
    });
    
    console.log(`Validated ${validAutomata.length}/${automata.length} automata`);
  }

  private executeSelfTraining(): void {
    // Learn from execution history
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
    // Observe own state
    const currentAutomaton = this.getCurrentAutomaton();
    if (currentAutomaton) {
      console.log(`Self-observation: Currently at ${currentAutomaton.currentState} (dimension ${currentAutomaton.dimensionalLevel})`);
    }
    
    // Collapse back to 0D
    this.currentLine = 0;
  }

  step(): void {
    const currentAutomaton = this.getCurrentAutomaton();
    if (!currentAutomaton) {
      console.log('No current automaton found');
      return;
    }

    // Find transitions from current automaton
    const transitions = this.getTransitionsFrom(currentAutomaton.id);
    
    // Also check for vertical transitions to next dimension
    const verticalTransitions = this.objects.filter(obj => 
      obj.type === 'vertical' && 
      (obj as any).fromNode === currentAutomaton.id
    );

    const allTransitions = [...transitions, ...verticalTransitions];
    
    if (allTransitions.length === 0) {
      console.log(`No transitions from ${currentAutomaton.id}`);
      return;
    }

    // Execute first valid transition
    for (const transition of allTransitions) {
      const condition = (transition as any).condition || 'true';
      if (this.evaluateCondition(condition)) {
        const action = (transition as any).action || 'evolve';
        const fromId = (transition as any).from || (transition as any).fromNode;
        const toId = (transition as any).to || (transition as any).toNode;
        
        this.executeAction(action, fromId, toId);
        
        // Update current line based on target dimension
        const targetAutomaton = this.objects.find(obj => obj.id === toId) as AutomatonState;
        if (targetAutomaton) {
          this.currentLine = targetAutomaton.dimensionalLevel;
          console.log(`Transitioned to dimension ${targetAutomaton.dimensionalLevel}: ${targetAutomaton.id}`);
        }
        break;
      }
    }
  }

  run(steps: number = 10): void {
    console.log(`Running self-referencing automaton for ${steps} steps...`);
    
    for (let i = 0; i < steps; i++) {
      console.log(`\n--- Step ${i + 1} ---`);
      this.step();
    }
    
    console.log('\n=== Execution Summary ===');
    console.log(`Total steps: ${steps}`);
    console.log(`Final line: ${this.currentLine}`);
    console.log(`Execution history: ${this.executionHistory.length} actions`);
    
    // Save any modifications
    this.save();
  }

  printState(): void {
    console.log('=== Self-Referencing Automaton State ===');
    console.log(`File: ${this.filePath}`);
    console.log(`Total objects: ${this.objects.length}`);
    console.log(`Current line: ${this.currentLine}`);
    
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

  getSelfReferences(): SelfReference[] {
    return this.objects.filter(obj => 
      obj.type === 'file' && 
      (obj as SelfReference).file === this.filePath
    ) as SelfReference[];
  }

  analyzeSelfReference(): void {
    const selfRefs = this.getSelfReferences();
    const automata = this.objects.filter(obj => obj.type === 'automaton') as AutomatonState[];
    
    console.log('=== Self-Reference Analysis ===');
    console.log(`Self-reference objects: ${selfRefs.length}`);
    console.log(`Automaton objects: ${automata.length}`);
    
    console.log('\nSelf-references:');
    selfRefs.forEach((ref, index) => {
      console.log(`  ${index + 1}. ${ref.id} -> ${ref.file}`);
      if (ref.text) {
        console.log(`     Text: ${ref.text.substring(0, 50)}...`);
      }
    });
    
    console.log('\nAutomaton self-references:');
    automata.forEach((auto, index) => {
      console.log(`  ${index + 1}. ${auto.id} -> line ${auto.selfReference.line} (${auto.selfReference.pattern})`);
    });
    
    // Check for consistency
    const consistentRefs = automata.filter(auto => 
      selfRefs.some(ref => ref.id.includes(`line-${auto.selfReference.line}`))
    );
    
    console.log(`\nConsistent self-references: ${consistentRefs.length}/${automata.length}`);
  }
}

// Main execution
async function main() {
  const automaton = new SelfReferencingAutomaton('./automaton.jsonl');
  
  console.log('=== Self-Referencing JSONL Automaton ===');
  automaton.printState();
  automaton.analyzeSelfReference();
  
  // Run the automaton
  automaton.run(15);
  
  console.log('\n=== Final State ===');
  automaton.printState();
  automaton.analyzeSelfReference();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { SelfReferencingAutomaton };