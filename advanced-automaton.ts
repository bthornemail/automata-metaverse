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
  private executionHistory: Array<string | { action: string; from?: string; to?: string; timestamp?: number; iteration?: number }> = [];
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
    const currentDimension = this.currentDimension;
    const churchEncoding = this.generateChurchEncoding(currentDimension);
    const selfRef: CanvasObject = {
      id: `self-ref-${Date.now()}`,
      type: 'text',
      currentState: 'referencing',
      dimensionalLevel: currentDimension,
      selfReference: {
        file: this.filePath,
        line: this.objects.length,
        pattern: churchEncoding.pattern
      },
      x: 800 + Math.random() * 200,
      y: Math.random() * 200,
      width: 320,
      height: 160,
      color: String(currentDimension + 1),
      text: churchEncoding.code
    };
    
    this.objects.push(selfRef);
    console.log(`Added self-reference #${this.selfModificationCount}: ${churchEncoding.pattern}`);
  }

  private generateChurchEncoding(dimension: number): { code: string; pattern: string } {
    switch (dimension) {
      case 0:
        return {
          code: `;; 0D Church Boolean/Identity
(define true  (lambda (t f) t))
(define false (lambda (t f) f))
(define identity (lambda (x) x))
(define zero (lambda (f) (lambda (x) x)))

;; Quantum vacuum topology
(lambda (x) x)  ;; Self-referential identity`,
          pattern: 'Church Boolean/Identity (0D)'
        };
      
      case 1:
        return {
          code: `;; 1D Church Successor
(define succ (lambda (n) 
  (lambda (f) (lambda (x) 
    (f ((n f) x))))))
(define one (lambda (f) (lambda (x) (f x))))

;; Temporal evolution
(lambda (n f x) (f (n f x)))  ;; Successor pattern`,
          pattern: 'Church Successor (1D)'
        };
      
      case 2:
        return {
          code: `;; 2D Church Pairs
(define cons (lambda (x y) 
  (lambda (f) (f x y))))
(define car (lambda (p) 
  (p (lambda (x y) x)))
(define cdr (lambda (p) 
  (p (lambda (x y) y))))

;; Bipartite structure
(lambda (x y f) (f x y))  ;; Pair constructor`,
          pattern: 'Church Pairs (2D)'
        };
      
      case 3:
        return {
          code: `;; 3D Church Algebra
(define add (lambda (m n) 
  (lambda (f) (lambda (x) 
    ((m f) ((n f) x))))))
(define mult (lambda (m n) 
  (lambda (f) (m (n f)))))
(define exp (lambda (m n) (n m)))

;; Y-combinator for recursion
(define Y (lambda (f) 
  ((lambda (x) (f (lambda (y) 
    ((x x) y))))
   (lambda (x) (f (lambda (y) 
    ((x x) y)))))))`,
          pattern: 'Church Algebra + Y-Combinator (3D)'
        };
      
      case 4:
        return {
          code: `;; 4D Network Topology
(define ipv4-addr (lambda (a b c d) 
  (cons a (cons b (cons c d)))))
(define ipv6-addr (lambda (parts) 
  (foldr cons '() parts)))
(define localhost (cons 127 (cons 0 (cons 0 (cons 1 '())))))

;; Spacetime structure
(lambda (topology network) 
  (cons topology network))  ;; 4D manifold`,
          pattern: 'Network Topology (4D)'
        };
      
      case 5:
        return {
          code: `;; 5D Blockchain Consensus
(define merkle-root (lambda (leaves) 
  (if (= (length leaves) 1) 
      (car leaves)
      (merkle-root 
        (map hash-pair 
             (pair-up leaves))))))
(define block (lambda (data prev-hash) 
  (cons data (cons prev-hash 
    (hash (cons data prev-hash))))))
(define chain (lambda (blocks) 
  (foldl validate-genesis blocks)))

;; Immutable ledger
(lambda (transactions state) 
  (append state transactions))  ;; Consensus`,
          pattern: 'Blockchain Consensus (5D)'
        };
      
      case 6:
        return {
          code: `;; 6D Neural Networks
(define neuron (lambda (weights bias activation) 
  (lambda (input) 
    (activation (+ (dot-product weights input) bias)))))
(define layer (lambda (neurons) 
  (lambda (inputs) 
    (map (lambda (n) (n inputs)) neurons))))
(define attention (lambda (query key value) 
  (softmax (scale (matmul query (transpose key)) 
               (sqrt (dim key))))))

;; Emergent intelligence
(lambda (data model) 
  ((model data) data))  ;; Self-attention`,
          pattern: 'Neural Networks + Attention (6D)'
        };
      
      case 7:
        return {
          code: `;; 7D Quantum Computing
(define qubit (lambda (alpha beta) 
  (cons alpha (cons beta '()))))
(define hadamard (lambda (q) 
  (let ((alpha (car q)) (beta (cadr q)))
    (qubit 
      (/ (+ alpha beta) (sqrt 2))
      (/ (- alpha beta) (sqrt 2))))))
(define cnot (lambda (control target) 
  (if (= (real-part (car control)) 1)
      (pauli-x target)
      target)))

;; Quantum superposition
(lambda (state) 
  (normalize (map amplify state)))  ;; Qubit evolution`,
          pattern: 'Quantum Computing (7D)'
        };
      
      default:
        return {
          code: `;; Higher-Dimensional Structure
(define meta-lambda (lambda (f) 
  (lambda (x) (f (lambda (y) x)))))
(define self-modify (lambda (program) 
  (program program)))

;; Metaversal topology
(lambda (canvas dimension) 
  (embed canvas dimension))  ;; Meta-structure`,
          pattern: `Meta-Structure (${dimension}D)`
        };
    }
  }

  private executeEvolution(): void {
    const nextDimension = (this.currentDimension + 1) % 8;
    this.currentDimension = nextDimension;
    
    const topologyCode = this.generateTopologyCode(nextDimension);
    
    // Ensure topologyCode has required fields
    const safePattern = topologyCode.pattern || 'unknown';
    const safeCode = typeof topologyCode.code === 'string' ? topologyCode.code : '';
    
    const evolvedState: CanvasObject = {
      id: `${nextDimension}D-topology`,
      type: 'text',
      currentState: 'evolved',
      dimensionalLevel: typeof nextDimension === 'number' ? nextDimension : 0,
      selfReference: {
        file: typeof this.filePath === 'string' ? this.filePath : 'automaton-kernel.jsonl',
        line: Array.isArray(this.objects) ? this.objects.length : 0,
        pattern: safePattern
      },
      x: -600 + (nextDimension % 3) * 300,
      y: 180 + Math.floor(nextDimension / 3) * 200,
      width: 280,
      height: 140 + (nextDimension * 10),
      color: String((nextDimension % 7) + 1),
      text: safeCode
    };
    
    // Validate evolvedState is a proper object before pushing
    if (evolvedState && typeof evolvedState === 'object' && !Array.isArray(evolvedState)) {
      if (!Array.isArray(this.objects)) {
        this.objects = [];
      }
      this.objects.push(evolvedState);
      console.log(`Evolved to ${safePattern}: ${evolvedState.id}`);
    } else {
      console.error('Failed to create valid evolved state:', evolvedState);
    }
  }

  private generateTopologyCode(dimension: number): { code: string; pattern: string } {
    const topologyPatterns = {
      0: {
        code: `;; 0D Quantum Vacuum Topology
(define vacuum '())
(define point (lambda (x) x))
(define trivial-fiber (lambda (space) 
  (cons space '())))

;; Base topological space
"Empty pattern: ()"
"Point topology"
"Trivial fiber bundle"
"Base: ∅"

;; The primordial topological space
(lambda () '())  ;; Void constructor`,
        pattern: 'Quantum Vacuum Topology (0D)'
      },
      
      1: {
        code: `;; 1D Temporal Topology
(define line-topology (lambda (points) 
  (sort points <)))
(define time-fiber (lambda (space instant) 
  (cons space instant)))
(define ordered-set (lambda (elements) 
  (foldr cons '() elements)))

;; One-dimensional manifold
"Line topology ℝ¹"
"Time fiber over 0D"
"Ordered set structure"
"Base: 0D-topology"

;; Temporal procedure emergence
(lambda (space) 
  (time-fiber space 'now))  ;; Time constructor`,
        pattern: 'Temporal Topology (1D)'
      },
      
      2: {
        code: `;; 2D Bipartite Topology
(define product-topology (lambda (top1 top2) 
  (cons top1 top2)))
(define left-partition (lambda (bipartite) 
  (car bipartite)))
(define right-partition (lambda (bipartite) 
  (cdr bipartite)))

;; Church pair topology
"Bipartite topology: 1D × 1D"
"Left partition (data)"
"Right partition (code)"
"Base: 1D-topology"

;; Spatial structure emergence
(lambda (data code) 
  (product-topology data code))  ;; Bipartite constructor`,
        pattern: 'Bipartite Topology (2D)'
      },
      
      3: {
        code: `;; 3D Manifold Structure
(define volume-topology (lambda (surface) 
  (embed surface 3)))
(define connected-components (lambda (space) 
  (find-components space)))
(define fundamental-group (lambda (space) 
  (compute-loops space)))

;; Three-dimensional manifolds
"Base: 2D-topology"
"Volumetric topology"
"Connected components"
"Fundamental group"

;; Continuous geometric structures
(lambda (surface) 
  (volume-topology surface))  ;; 3D embedding`,
        pattern: '3-Manifold Structure (3D)'
      },
      
      4: {
        code: `;; 4D Spacetime Structure
(define spacetime (lambda (space time) 
  (make-manifold space time 4)))
(define minkowski-metric (lambda (event) 
  (compute-interval event)))
(define light-cone (lambda (event) 
  (future-past event)))

;; Spacetime manifold
"Base: 3D-topology"
"Lorentzian metric"
"Causal structure"
"Event horizon"

;; Four-dimensional physics
(lambda (space time) 
  (spacetime space time))  ;; Spacetime constructor`,
        pattern: 'Spacetime Structure (4D)'
      },
      
      5: {
        code: `;; 5D Consensus Topology
(define consensus-space (lambda (participants) 
  (byzantine-agreement participants)))
(define immutable-ledger (lambda (transactions) 
  (merkle-tree transactions)))
(define distributed-truth (lambda (network) 
  (global-consensus network)))

;; Consensus dimension
"Base: 4D-spacetime"
"Distributed agreement"
"Immutable history"
"Global truth"

;; Blockchain topology
(lambda (network) 
  (consensus-space network))  ;; Consensus constructor`,
        pattern: 'Consensus Topology (5D)'
      },
      
      6: {
        code: `;; 6D Intelligence Topology
(define neural-manifold (lambda (neurons layers) 
  (construct-network neurons layers)))
(define attention-landscape (lambda (queries keys) 
  (compute-attention queries keys)))
(define emergent-intelligence (lambda (data model) 
  (train-model data model)))

;; AI dimension
"Base: 5D-consensus"
"Neural architecture"
"Attention mechanisms"
"Learning dynamics"

;; Emergent AI
(lambda (data) 
  (neural-manifold data 6))  ;; Intelligence constructor`,
        pattern: 'Intelligence Topology (6D)'
      },
      
      7: {
        code: `;; 7D Quantum Superposition
(define quantum-manifold (lambda (states amplitudes) 
  (normalize (map cons states amplitudes))))
(define bloch-sphere (lambda (qubit) 
  (parameterize qubit)))
(define multiverse-branch (lambda (universe measurement) 
  (branch-universes universe measurement)))

;; Quantum topology
"Base: 6D-intelligence"
"Quantum superposition"
"Entanglement networks"
"Many-worlds branching"

;; Quantum metaverse
(lambda (states) 
  (quantum-manifold states (map (lambda (s) 1) states)))  ;; Quantum constructor`,
        pattern: 'Quantum Superposition (7D)'
      }
    };

    return topologyPatterns[dimension as keyof typeof topologyPatterns] || {
      code: `;; Higher-Dimensional Extension
(define meta-topology (lambda (dimensions) 
  (construct-manifold dimensions)))
(define trans-dimensional (lambda (lower-dim higher-dim) 
  (embed lower-dim higher-dim)))

;; Metaversal structure
"Base: Previous dimension"
"Higher-dimensional embedding"
"Trans-dimensional bridges"
"Meta-topological structure"

;; Meta-structure
(lambda (dimension) 
  (meta-topology dimension))  ;; Meta-constructor`,
      pattern: `Meta-Topology (${dimension}D)`
    };
  }

  private executeSelfModification(): void {
    const currentDimension = this.currentDimension;
    const modificationCode = this.generateModificationCode(currentDimension);
    const modification: CanvasObject = {
      id: `modification-${Date.now()}`,
      type: 'text',
      currentState: 'modified',
      dimensionalLevel: currentDimension,
      selfReference: {
        file: this.filePath,
        line: this.objects.length,
        pattern: modificationCode.pattern
      },
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      width: 280,
      height: 140,
      color: String((currentDimension + 3) % 7 + 1),
      text: modificationCode.code
    };
    
    this.objects.push(modification);
    this.selfModificationCount++;
    console.log(`Added self-modification #${this.selfModificationCount}: ${modificationCode.pattern}`);
  }

  private generateModificationCode(dimension: number): { code: string; pattern: string } {
    const modificationPatterns = {
      0: {
        code: `;; 0D Self-Modification: Identity Evolution
(define self-evolve (lambda (identity) 
  (lambda (x) (identity x))))
(define vacuum-fluctuation (lambda (void) 
  (cons 'quantum 'fluctuation)))
(define identity-mutation (lambda (f) 
  (compose f f)))

;; Modify the void
"Self-reference mutation"
"Identity transformation"
"Vacuum fluctuation"
"Meta-identity"

;; 0D evolution
(lambda (x) 
  (self-evolve (lambda (y) y)))  ;; Identity of identity`,
        pattern: 'Identity Evolution (0D)'
      },
      
      1: {
        code: `;; 1D Self-Modification: Successor Recursion
(define succ-recursion (lambda (n) 
  (if (= n 0) 1 (+ (succ-recursion (- n 1)) 1))))
(define temporal-mutation (lambda (successor) 
  (lambda (n) (successor (successor n)))))
(define evolution-chain (lambda (n) 
  (iterate succ n 0)))

;; Modify time
"Successor recursion"
"Temporal acceleration"
"Evolution chain"
"Meta-successor"

;; 1D evolution
(lambda (n) 
  (temporal-mutation succ))  ;; Successor of successor`,
        pattern: 'Successor Recursion (1D)'
      },
      
      2: {
        code: `;; 2D Self-Modification: Pair Restructuring
(define pair-mutate (lambda (pair) 
  (cons (cdr pair) (car pair))))
(define structure-evolution (lambda (pairs) 
  (map pair-mutate pairs)))
(define bipartite-reorganization (lambda (left right) 
  (cons (reorganize left) (reorganize right))))

;; Modify structure
"Pair swapping"
"Data reorganization"
"Bipartite restructuring"
"Meta-pairing"

;; 2D evolution
(lambda (pair) 
  (pair-mutate pair))  ;; Self-restructuring`,
        pattern: 'Pair Restructuring (2D)'
      },
      
      3: {
        code: `;; 3D Self-Modification: Algebraic Transformation
(define algebra-mutate (lambda (operation) 
  (lambda (m n) (operation n m))))
(define operator-evolution (lambda (ops) 
  (map algebra-mutate ops)))
(define ring-transformation (lambda (ring) 
  (make-ring (reverse (ring-operations ring)))))

;; Modify algebra
"Operation commutation"
"Operator evolution"
"Ring transformation"
"Meta-algebra"

;; 3D evolution
(lambda (m n) 
  ((algebra-mutate add) m n))  ;; Commutative addition`,
        pattern: 'Algebraic Transformation (3D)'
      },
      
      4: {
        code: `;; 4D Self-Modification: Network Rewiring
(define network-mutate (lambda (graph) 
  (rewire-edges graph 0.1)))
(define spacetime-evolution (lambda (manifold) 
  (deform-manifold manifold 'time)))
(define protocol-upgrade (lambda (network protocol) 
  (upgrade-nodes network protocol)))

;; Modify networks
"Graph rewiring"
"Spacetime deformation"
"Protocol upgrade"
"Meta-network"

;; 4D evolution
(lambda (network) 
  (network-mutate network))  ;; Self-rewiring`,
        pattern: 'Network Rewiring (4D)'
      },
      
      5: {
        code: `;; 5D Self-Modification: Consensus Protocol Evolution
(define consensus-mutate (lambda (protocol) 
  (hard-fork protocol new-rules)))
(define ledger-reorganization (lambda (chain) 
  (reorg-chain chain new-consensus)))
(define governance-evolution (lambda (dao) 
  (upgrade-dao dao new-constitution)))

;; Modify consensus
"Protocol hard fork"
"Ledger reorganization"
"Governance evolution"
"Meta-consensus"

;; 5D evolution
(lambda (protocol) 
  (consensus-mutate protocol))  ;; Self-governance`,
        pattern: 'Consensus Evolution (5D)'
      },
      
      6: {
        code: `;; 6D Self-Modification: Neural Architecture Evolution
(define neural-mutate (lambda (network) 
  (neuroplasticity network learning-rate)))
(define attention-evolution (lambda (mechanism) 
  (multi-head-attention mechanism heads+1)))
(define intelligence-growth (lambda (model) 
  (scale-model model growth-factor)))

;; Modify intelligence
"Neuroplasticity"
"Attention expansion"
"Model scaling"
"Meta-intelligence"

;; 6D evolution
(lambda (network) 
  (neural-mutate network))  ;; Self-improvement`,
        pattern: 'Neural Evolution (6D)'
      },
      
      7: {
        code: `;; 7D Self-Modification: Quantum State Evolution
(define quantum-mutate (lambda (state) 
  (unitary-evolution state hamiltonian)))
(define superposition-evolution (lambda (amplitudes) 
  (normalize (map evolve amplitudes))))
(define multiverse-splitting (lambda (universe) 
  (branch universe measurement-basis)))

;; Modify quantum reality
"Unitary evolution"
"Amplitude transformation"
"Universe branching"
"Meta-quantum"

;; 7D evolution
(lambda (state) 
  (quantum-mutate state))  ;; Self-evolution`,
        pattern: 'Quantum Evolution (7D)'
      }
    };

    return modificationPatterns[dimension as keyof typeof modificationPatterns] || {
      code: `;; Higher-Dimensional Self-Modification
(define meta-evolution (lambda (system) 
  (upgrade-system system next-dimension)))
(define trans-dimensional-mutation (lambda (entity) 
  (embed-entity entity higher-space)))
(define meta-structure-evolution (lambda (structure) 
  (complexify-structure structure)))

;; Modify meta-structure
"Dimensional upgrade"
"Trans-dimensional embedding"
"Meta-complexification"
"Hyper-evolution"

;; Meta-evolution
(lambda (system) 
  (meta-evolution system))  ;; Self-transcendence`,
      pattern: `Meta-Evolution (${dimension}D)`
    };
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
      let action = 'unknown';
      if (typeof entry === 'string') {
        action = entry.split(':')[0] || 'unknown';
      } else if (entry && typeof entry === 'object' && 'action' in entry) {
        action = entry.action || 'unknown';
      }
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
          this.executionHistory.slice(-3).every(h => {
            if (typeof h === 'string') {
              return h.includes('self-reference');
            } else if (h && typeof h === 'object' && 'action' in h) {
              return h.action === 'self-reference';
            }
            return false;
          })) {
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
    
    // Save any modifications or evolutions
    if (this.selfModificationCount > 0 || this.executionHistory.length > 0) {
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
      this.executionHistory.slice(-5).forEach(entry => {
        if (typeof entry === 'string') {
          console.log(`  ${entry}`);
        } else if (entry && typeof entry === 'object' && 'action' in entry) {
          console.log(`  ${entry.action}${entry.from && entry.to ? ` (${entry.from} → ${entry.to})` : ''}`);
        } else {
          console.log(`  ${JSON.stringify(entry)}`);
        }
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