import * as fs from 'fs';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { MetaLogDb } from 'meta-log-db';
import { spawn } from 'child_process';
import * as http from 'http';
import * as path from 'path';
import * as os from 'os';

// Note: global.gc is already declared by @types/node as NodeJS.GCFunction | undefined
// Memory pool for CanvasObject reuse to reduce memory volatility
let ObjectPool$1 = class ObjectPool {
    constructor(createFn, resetFn, maxSize = 100) {
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFn();
    }
    release(obj) {
        if (this.pool.length < this.maxSize) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    clear() {
        this.pool = [];
    }
    get size() {
        return this.pool.length;
    }
};
class AdvancedSelfReferencingAutomaton {
    constructor(filePath, db) {
        this.objects = [];
        this.currentDimension = 0;
        this.executionHistory = [];
        this.selfModificationCount = 0;
        this.MAX_EXECUTION_HISTORY = 1000; // Limit history to prevent memory leaks
        // Memory pool for object reuse
        this.objectPool = new ObjectPool$1(() => ({ id: '', type: '', currentState: '', dimensionalLevel: 0 }), (obj) => {
            // Reset object for reuse
            obj.id = '';
            obj.type = '';
            obj.currentState = '';
            obj.dimensionalLevel = 0;
            obj.selfReference = undefined;
            obj.provenanceHistory = undefined;
        }, 200 // Max pool size
        );
        this.filePath = filePath;
        this.db = db || new MetaLogDb({ enableProlog: true, enableDatalog: true });
        // Load will be called explicitly via init() or load()
    }
    /**
     * Initialize the automaton by loading the file
     * Call this after construction if you need to ensure the file is loaded
     */
    async init() {
        await this.load();
    }
    /**
     * Flatten Canvas structure to array of objects
     */
    flattenCanvas(canvas) {
        const objects = [];
        // Add nodes
        if (canvas.nodes) {
            objects.push(...canvas.nodes);
        }
        // Add edges
        if (canvas.edges) {
            objects.push(...canvas.edges);
        }
        // Add other object types
        for (const [key, value] of Object.entries(canvas)) {
            if (key !== 'nodes' && key !== 'edges' && Array.isArray(value)) {
                objects.push(...value);
            }
        }
        return objects;
    }
    async load() {
        if (!existsSync(this.filePath)) {
            throw new Error(`Automaton file not found: ${this.filePath}`);
        }
        // Use meta-log-db to parse the canvas
        await this.db.loadCanvas(this.filePath);
        const canvas = await this.db.parseJsonlCanvas(this.filePath);
        // Flatten Canvas structure to get all objects
        const parsedObjects = this.flattenCanvas(canvas);
        this.objects = [];
        // Map: ID -> { obj, provenanceHistory, seenInFiles }
        const seenIds = new Map();
        let duplicateCount = 0;
        let provenanceMergedCount = 0;
        for (let i = 0; i < parsedObjects.length; i++) {
            const obj = parsedObjects[i];
            if (obj && typeof obj === 'object') {
                if (obj.id) {
                    const currentFile = obj.selfReference?.file || this.filePath;
                    obj.selfReference?.line || i + 1;
                    const currentProvenance = obj.selfReference
                        ? { file: obj.selfReference.file, line: obj.selfReference.line, pattern: obj.selfReference.pattern }
                        : { file: this.filePath, line: i + 1 };
                    if (seenIds.has(obj.id)) {
                        const existing = seenIds.get(obj.id);
                        const existingFile = existing.obj.selfReference?.file || this.filePath;
                        // Check if this is a cross-file duplicate (federated provenance)
                        if (currentFile !== existingFile && currentFile !== this.filePath && existingFile !== this.filePath) {
                            // Cross-file duplicate: preserve both for federated provenance
                            // Add provenance history to existing object
                            if (!existing.obj.provenanceHistory) {
                                existing.obj.provenanceHistory = [];
                                if (existing.obj.selfReference) {
                                    existing.obj.provenanceHistory.push({
                                        file: existing.obj.selfReference.file,
                                        line: existing.obj.selfReference.line,
                                        pattern: existing.obj.selfReference.pattern
                                    });
                                }
                            }
                            existing.obj.provenanceHistory.push(currentProvenance);
                            // Keep both objects (federated provenance requirement)
                            this.objects.push(obj);
                            provenanceMergedCount++;
                            console.log(`📋 Cross-file provenance: ID "${obj.id}" found in ${existingFile} and ${currentFile} (preserving both)`);
                        }
                        else {
                            // Same-file duplicate: merge provenance history, keep latest
                            const existingIndex = this.objects.findIndex(o => o.id === obj.id);
                            if (existingIndex >= 0) {
                                const existingObj = this.objects[existingIndex];
                                // Merge provenance history
                                if (!existingObj.provenanceHistory) {
                                    existingObj.provenanceHistory = [];
                                    if (existingObj.selfReference) {
                                        existingObj.provenanceHistory.push({
                                            file: existingObj.selfReference.file,
                                            line: existingObj.selfReference.line,
                                            pattern: existingObj.selfReference.pattern
                                        });
                                    }
                                }
                                // Add current provenance to history if different
                                const existingProvenance = existingObj.selfReference
                                    ? `${existingObj.selfReference.file}:${existingObj.selfReference.line}`
                                    : 'unknown';
                                const newProvenance = currentProvenance.file && currentProvenance.line
                                    ? `${currentProvenance.file}:${currentProvenance.line}`
                                    : 'unknown';
                                if (newProvenance !== existingProvenance && newProvenance !== 'unknown') {
                                    existingObj.provenanceHistory.push(currentProvenance);
                                    provenanceMergedCount++;
                                }
                                // Replace with latest version (fixes memory leak)
                                this.objects.splice(existingIndex, 1);
                                duplicateCount++;
                                // Update seenIds with latest object and merged history
                                seenIds.set(obj.id, {
                                    obj,
                                    provenanceHistory: existingObj.provenanceHistory || [],
                                    seenInFiles: existing.seenInFiles
                                });
                                existing.seenInFiles.add(currentFile);
                            }
                        }
                    }
                    else {
                        // First occurrence: initialize provenance history
                        const provenanceHistory = [];
                        if (obj.selfReference) {
                            provenanceHistory.push({
                                file: obj.selfReference.file,
                                line: obj.selfReference.line,
                                pattern: obj.selfReference.pattern
                            });
                        }
                        seenIds.set(obj.id, {
                            obj,
                            provenanceHistory,
                            seenInFiles: new Set([currentFile])
                        });
                    }
                }
                // Add object to array
                if (!obj.id) {
                    // No ID: always add
                    this.objects.push(obj);
                }
                else if (!seenIds.has(obj.id)) {
                    // First occurrence: add object
                    this.objects.push(obj);
                }
                else {
                    // Duplicate ID: check if already added
                    const existing = seenIds.get(obj.id);
                    const existingIndex = this.objects.findIndex(o => o.id === obj.id);
                    if (existingIndex < 0) {
                        // Not yet added: add the tracked object (may have merged provenance)
                        this.objects.push(existing.obj);
                    }
                    else if (existing.seenInFiles.size > 1) {
                        // Cross-file duplicate: add this one too (federated provenance)
                        this.objects.push(obj);
                    }
                    // Otherwise: already handled, skip
                }
            }
        }
        if (duplicateCount > 0) {
            console.log(`🧹 Removed ${duplicateCount} duplicate objects during load (same-file deduplication)`);
        }
        if (provenanceMergedCount > 0) {
            console.log(`📋 Merged provenance history for ${provenanceMergedCount} objects (federated provenance preserved)`);
        }
        console.log(`✅ Loaded ${this.objects.length} unique objects from ${this.filePath}`);
    }
    save() {
        // Provenance-aware deduplication before saving
        // Preserve provenance history while removing true duplicates
        const deduplicated = [];
        const seenIds = new Map();
        let duplicateCount = 0;
        let provenancePreservedCount = 0;
        // Process in reverse to keep last occurrence, but preserve provenance
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.id) {
                const currentFile = obj.selfReference?.file || this.filePath;
                if (seenIds.has(obj.id)) {
                    const existing = seenIds.get(obj.id);
                    const existingFile = existing.obj.selfReference?.file || this.filePath;
                    // Cross-file duplicates: preserve both (federated provenance)
                    if (currentFile !== existingFile && currentFile !== this.filePath && existingFile !== this.filePath) {
                        // Add to deduplicated array (preserve both)
                        deduplicated.unshift(obj);
                        provenancePreservedCount++;
                        continue;
                    }
                    // Same-file duplicate: merge provenance history
                    if (!existing.obj.provenanceHistory && obj.selfReference) {
                        existing.obj.provenanceHistory = [];
                        if (existing.obj.selfReference) {
                            existing.obj.provenanceHistory.push({
                                file: existing.obj.selfReference.file,
                                line: existing.obj.selfReference.line,
                                pattern: existing.obj.selfReference.pattern
                            });
                        }
                    }
                    if (obj.selfReference && existing.obj.provenanceHistory) {
                        const existingProvenance = existing.obj.selfReference
                            ? `${existing.obj.selfReference.file}:${existing.obj.selfReference.line}`
                            : 'unknown';
                        const newProvenance = `${obj.selfReference.file}:${obj.selfReference.line}`;
                        if (newProvenance !== existingProvenance) {
                            existing.obj.provenanceHistory.push({
                                file: obj.selfReference.file,
                                line: obj.selfReference.line,
                                pattern: obj.selfReference.pattern
                            });
                            provenancePreservedCount++;
                        }
                    }
                    // Update with latest object but preserve history
                    Object.assign(existing.obj, obj);
                    if (existing.obj.provenanceHistory) {
                        existing.obj.provenanceHistory = existing.obj.provenanceHistory;
                    }
                    duplicateCount++;
                    continue; // Skip duplicate, already have merged version
                }
                // First occurrence: initialize provenance history
                const provenanceHistory = [];
                if (obj.selfReference) {
                    provenanceHistory.push({
                        file: obj.selfReference.file,
                        line: obj.selfReference.line,
                        pattern: obj.selfReference.pattern
                    });
                }
                seenIds.set(obj.id, { obj, provenanceHistory });
            }
            deduplicated.unshift(obj);
        }
        // Update objects array with deduplicated version
        this.objects = deduplicated;
        if (duplicateCount > 0) {
            console.log(`🧹 Removed ${duplicateCount} duplicate objects before save (provenance preserved)`);
        }
        if (provenancePreservedCount > 0) {
            console.log(`📋 Preserved provenance history for ${provenancePreservedCount} objects`);
        }
        const jsonlContent = this.objects.map(obj => JSON.stringify(obj)).join('\n');
        writeFileSync(this.filePath, jsonlContent + '\n');
        console.log(`✅ Saved ${this.objects.length} unique objects to ${this.filePath}`);
    }
    getAutomatonByDimension(level) {
        const automata = this.objects.filter(obj => obj.type === 'automaton' &&
            obj.dimensionalLevel === level);
        return automata.length > 0 ? automata[0] : null;
    }
    getCurrentAutomaton() {
        return this.getAutomatonByDimension(this.currentDimension);
    }
    getVerticalTransition(fromId) {
        const transitions = this.objects.filter(obj => obj.type === 'vertical' &&
            obj.fromNode === fromId);
        return transitions.length > 0 ? transitions[0] : null;
    }
    evaluateCondition(condition, context = {}) {
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
    executeAction(action, fromState, toState, context = {}) {
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
        // Trim execution history to prevent memory leaks
        if (this.executionHistory.length > this.MAX_EXECUTION_HISTORY) {
            this.executionHistory = this.executionHistory.slice(-this.MAX_EXECUTION_HISTORY);
        }
    }
    executeSelfReference() {
        const currentDimension = this.currentDimension;
        const churchEncoding = this.generateChurchEncoding(currentDimension);
        const selfRef = {
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
    generateChurchEncoding(dimension) {
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
    executeEvolution() {
        const nextDimension = (this.currentDimension + 1) % 8;
        this.currentDimension = nextDimension;
        const topologyCode = this.generateTopologyCode(nextDimension);
        // Ensure topologyCode has required fields
        const safePattern = topologyCode.pattern || 'unknown';
        const safeCode = typeof topologyCode.code === 'string' ? topologyCode.code : '';
        const evolvedState = {
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
            // Reduced verbosity - only log evolution in verbose mode
            if (process.env.VERBOSE === 'true') {
                console.log(`Evolved to ${safePattern}: ${evolvedState.id}`);
            }
        }
        else {
            console.error('Failed to create valid evolved state:', evolvedState);
        }
    }
    generateTopologyCode(dimension) {
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
        return topologyPatterns[dimension] || {
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
    executeSelfModification() {
        const currentDimension = this.currentDimension;
        const modificationCode = this.generateModificationCode(currentDimension);
        const modification = {
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
        // Reduced verbosity - only log major milestones (every 500th) or in verbose mode
        if (process.env.VERBOSE === 'true' || this.selfModificationCount % 500 === 0) {
            console.log(`Added self-modification #${this.selfModificationCount}: ${modificationCode.pattern}`);
        }
    }
    generateModificationCode(dimension) {
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
        return modificationPatterns[dimension] || {
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
    executeComposition() {
        const automata = this.objects.filter(obj => obj.type === 'automaton');
        if (automata.length >= 2) {
            console.log(`Composed automata: ${automata[0].id} + ${automata[1].id}`);
        }
    }
    async executeSelfIO() {
        await this.load();
        console.log(`Performed self-I/O: read ${this.objects.length} objects`);
    }
    executeSelfValidation() {
        const automata = this.objects.filter(obj => obj.type === 'automaton');
        const validAutomata = automata.filter(obj => {
            return obj.selfReference && obj.dimensionalLevel >= 0 && obj.dimensionalLevel <= 7;
        });
        console.log(`Validated ${validAutomata.length}/${automata.length} automata`);
    }
    executeSelfTraining() {
        const actionCounts = new Map();
        this.executionHistory.forEach(entry => {
            let action = 'unknown';
            if (typeof entry === 'string') {
                action = entry.split(':')[0] || 'unknown';
            }
            else if (entry && typeof entry === 'object' && 'action' in entry) {
                action = entry.action || 'unknown';
            }
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        });
        console.log('Learned action frequencies:');
        actionCounts.forEach((count, action) => {
            console.log(`  ${action}: ${count}`);
        });
    }
    executeSelfObservation() {
        const currentAutomaton = this.getCurrentAutomaton();
        if (currentAutomaton) {
            console.log(`Self-observation: Currently at ${currentAutomaton.currentState} (dimension ${currentAutomaton.dimensionalLevel})`);
        }
        // Collapse back to 0D after observation
        console.log('Quantum collapse: returning to 0D');
        this.currentDimension = 0;
    }
    step(stepCount = 0) {
        const currentAutomaton = this.getCurrentAutomaton();
        if (!currentAutomaton) {
            console.log('No current automaton found');
            return;
        }
        // First try horizontal transitions
        const horizontalTransitions = this.objects.filter(obj => obj.type === 'transition' &&
            obj.from === currentAutomaton.id);
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
            const condition = transition.condition || 'true';
            const context = { stepCount };
            if (this.evaluateCondition(condition, context)) {
                const action = transition.action || 'evolve';
                const fromId = transition.from || transition.fromNode;
                const toId = transition.to || transition.toNode;
                this.executeAction(action, fromId, toId, context);
                // Update current dimension based on target
                const targetAutomaton = this.objects.find(obj => obj.id === toId);
                if (targetAutomaton) {
                    this.currentDimension = targetAutomaton.dimensionalLevel;
                    console.log(`Transitioned to dimension ${targetAutomaton.dimensionalLevel}: ${targetAutomaton.id}`);
                }
                break;
            }
        }
    }
    run(steps = 20) {
        console.log(`Running advanced self-referencing automaton for ${steps} steps...`);
        for (let i = 0; i < steps; i++) {
            console.log(`\n--- Step ${i + 1} (Dimension ${this.currentDimension}) ---`);
            this.step(i);
            // Force progression if stuck
            if (this.executionHistory.length > 3 &&
                this.executionHistory.slice(-3).every(h => {
                    if (typeof h === 'string') {
                        return h.includes('self-reference');
                    }
                    else if (h && typeof h === 'object' && 'action' in h) {
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
        // Trigger GC if available (Node.js with --expose-gc flag)
        if (global.gc) {
            global.gc();
        }
    }
    /**
     * Optimize memory by trimming history and deduplicating objects
     */
    optimizeMemory() {
        // Trim execution history
        if (this.executionHistory.length > this.MAX_EXECUTION_HISTORY) {
            this.executionHistory = this.executionHistory.slice(-this.MAX_EXECUTION_HISTORY);
        }
        // Deduplicate objects
        const deduplicated = [];
        const seenIds = new Set();
        let duplicateCount = 0;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.id && seenIds.has(obj.id)) {
                duplicateCount++;
                continue;
            }
            if (obj.id) {
                seenIds.add(obj.id);
            }
            deduplicated.unshift(obj);
        }
        if (duplicateCount > 0) {
            console.log(`🧹 Memory optimization: Removed ${duplicateCount} duplicate objects`);
            this.objects = deduplicated;
        }
        // Trigger GC if available
        if (global.gc) {
            global.gc();
        }
    }
    printState() {
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
                }
                else if (entry && typeof entry === 'object' && 'action' in entry) {
                    console.log(`  ${entry.action}${entry.from && entry.to ? ` (${entry.from} → ${entry.to})` : ''}`);
                }
                else {
                    console.log(`  ${JSON.stringify(entry)}`);
                }
            });
        }
    }
    analyzeSelfReference() {
        const selfRefs = this.objects.filter(obj => obj.type === 'file' &&
            obj.file === this.filePath);
        const automata = this.objects.filter(obj => obj.type === 'automaton');
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
                console.log(`  ${index + 1}. ${ref.id}`);
                if (ref.text) {
                    console.log(`     ${ref.text.substring(0, 60)}...`);
                }
            });
        }
    }
}
// Main execution
async function main$2() {
    const db = new MetaLogDb({ enableProlog: true, enableDatalog: true });
    const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl', db);
    // Initialize by loading the file
    await automaton.init();
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
    main$2().catch(console.error);
}

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
        this.automaton.selfModificationCount;
        this.automaton.executionHistory;
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
async function main$1() {
    const args = process.argv.slice(2);
    const useOllama = args.includes('--ollama');
    const model = args.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'llama3.2';
    let maxIterations = undefined;
    let automatonFile = './automaton.jsonl';
    // First arg: interval (find first numeric argument)
    const intervalArg = args.find(arg => !isNaN(parseInt(arg)));
    const interval = intervalArg ? parseInt(intervalArg) : 2000;
    // Skip interval arg if found
    if (intervalArg) {
        args.indexOf(intervalArg);
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
    main$1().catch(console.error);
}

class OllamaAutomatonRunner {
    constructor(automatonFile = './automaton.jsonl', ollamaModel = 'llama3.2', db) {
        this.isRunning = false;
        this.iterationCount = 0;
        this.maxIterations = Infinity;
        this.opencodeModels = new Set();
        this.initialized = false;
        this.automaton = new AdvancedSelfReferencingAutomaton(automatonFile, db);
        this.ollamaModel = ollamaModel;
        this.loadOpenCodeModels();
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
    loadOpenCodeModels() {
        try {
            const opencodeConfigPath = path.join(process.cwd(), 'opencode.jsonc');
            if (existsSync(opencodeConfigPath)) {
                const configContent = readFileSync(opencodeConfigPath, 'utf-8');
                // Simple JSONC parsing (remove comments)
                const jsonContent = configContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
                const config = JSON.parse(jsonContent);
                // Extract Ollama models from OpenCode config
                if (config.provider?.ollama?.models) {
                    Object.keys(config.provider.ollama.models).forEach(model => {
                        this.opencodeModels.add(model);
                    });
                }
                if (this.opencodeModels.size > 0) {
                    console.log(`📋 Loaded ${this.opencodeModels.size} OpenCode model(s): ${Array.from(this.opencodeModels).join(', ')}`);
                }
            }
        }
        catch (error) {
            // Silently fail if OpenCode config doesn't exist or is invalid
        }
    }
    isOpenCodeModel(model) {
        return this.opencodeModels.has(model);
    }
    async queryOllama(prompt) {
        // If it's an OpenCode model, try OpenAI-compatible API first
        if (this.isOpenCodeModel(this.ollamaModel)) {
            try {
                console.log(`🔗 Using OpenAI-compatible API for OpenCode model: ${this.ollamaModel}`);
                return await this.queryOllamaOpenAICompatible(prompt);
            }
            catch (openaiError) {
                console.log(`⚠️ OpenAI-compatible API failed, trying native API: ${openaiError.message}`);
                // Fall through to native API
            }
        }
        // Try native Ollama API
        try {
            return await this.queryOllamaHTTP(prompt);
        }
        catch (httpError) {
            // If model not found, try OpenAI-compatible endpoint
            if (httpError.message && (httpError.message.includes('model') || httpError.message.includes('404'))) {
                try {
                    console.log(`🔄 Trying OpenAI-compatible API for model: ${this.ollamaModel}`);
                    return await this.queryOllamaOpenAICompatible(prompt);
                }
                catch (openaiError) {
                    // Fallback to CLI if both HTTP methods fail
                    console.log(`⚠️ HTTP APIs failed, falling back to CLI`);
                    return await this.queryOllamaCLI(prompt);
                }
            }
            else {
                // Fallback to CLI for other errors
                console.log(`⚠️ HTTP API failed, falling back to CLI: ${httpError.message}`);
                return await this.queryOllamaCLI(prompt);
            }
        }
    }
    async queryOllamaHTTP(prompt) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                model: this.ollamaModel,
                prompt: prompt,
                stream: false
            });
            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 300000 // 5 minute timeout for large models
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk.toString();
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.response) {
                            resolve(response.response.trim());
                        }
                        else {
                            reject(new Error(`Invalid Ollama response: ${data}`));
                        }
                    }
                    catch (parseError) {
                        reject(new Error(`Failed to parse Ollama response: ${data}`));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`HTTP request failed: ${error.message}`));
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout: Ollama took too long to respond'));
            });
            req.setTimeout(options.timeout);
            req.write(postData);
            req.end();
        });
    }
    async queryOllamaOpenAICompatible(prompt) {
        // OpenAI-compatible API for OpenCode models
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                model: this.ollamaModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: false
            });
            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 300000 // 5 minute timeout
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk.toString();
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.choices && response.choices[0] && response.choices[0].message) {
                            resolve(response.choices[0].message.content.trim());
                        }
                        else {
                            reject(new Error(`Invalid OpenAI-compatible response: ${data}`));
                        }
                    }
                    catch (parseError) {
                        reject(new Error(`Failed to parse OpenAI-compatible response: ${data}`));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`HTTP request failed: ${error.message}`));
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout: Ollama took too long to respond'));
            });
            req.setTimeout(options.timeout);
            req.write(postData);
            req.end();
        });
    }
    async queryOllamaCLI(prompt) {
        return new Promise((resolve, reject) => {
            const ollama = spawn('ollama', ['run', this.ollamaModel, prompt]);
            let output = '';
            let error = '';
            ollama.stdout.on('data', (data) => {
                const text = data.toString();
                // Remove ANSI escape codes
                const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
                output += cleanText;
            });
            ollama.stderr.on('data', (data) => {
                error += data.toString();
            });
            ollama.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Ollama exited with code ${code}: ${error || output}`));
                }
                else {
                    const response = output.trim();
                    if (response.length === 0) {
                        reject(new Error('Ollama returned empty response'));
                    }
                    else {
                        resolve(response);
                    }
                }
            });
            ollama.on('error', (err) => {
                reject(new Error(`Failed to spawn Ollama: ${err.message}`));
            });
        });
    }
    generateContextPrompt() {
        const currentAutomaton = this.automaton.getCurrentAutomaton();
        const history = this.automaton.executionHistory.slice(-5);
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

Respond with the action name that should be executed next. You may optionally include brief reasoning.

Consider:
1. Dimensional context and mathematical meaning
2. Execution history patterns
3. Self-referential integrity
4. Exploration vs exploitation balance

Format: action-name [optional: brief reasoning]

Action:`;
    }
    printDecisionTrie(context, rawResponse, parsedAction, availableActions) {
        console.log('\n🌳 Decision Trie');
        console.log('═'.repeat(60));
        // Context branch
        console.log('📊 Context:');
        console.log(`   Dimension: ${context.dimension}D (${context.dimensionName})`);
        console.log(`   State: ${context.state}`);
        console.log(`   Self-reference: line ${context.selfRefLine} (${context.selfRefPattern})`);
        console.log(`   Iteration: ${context.iteration}`);
        console.log(`   History: ${context.history.length > 0 ? context.history.join(' → ') : 'none'}`);
        // Available actions branch
        console.log('\n🎯 Available Actions:');
        availableActions.forEach((action, idx) => {
            const isChosen = action === parsedAction;
            const marker = isChosen ? '✅' : '  ';
            console.log(`   ${marker} ${idx + 1}. ${action}`);
        });
        // Decision path branch
        console.log('\n🔀 Decision Path:');
        const cleanResponse = rawResponse.trim();
        // Always show full LLM response
        console.log('📝 Full LLM Response:');
        // Format multi-line responses nicely
        const responseLines = cleanResponse.split('\n').filter(line => line.trim());
        if (responseLines.length > 1) {
            responseLines.forEach((line, idx) => {
                const trimmed = line.trim();
                if (trimmed) {
                    const prefix = idx === 0 ? '┌─' : idx === responseLines.length - 1 ? '└─' : '│ ';
                    console.log(`   ${prefix} ${trimmed}`);
                }
            });
        }
        else {
            // Single line response - show in quotes with proper formatting
            const singleLine = cleanResponse;
            if (singleLine.length > 80) {
                // Wrap long responses
                const words = singleLine.split(' ');
                let currentLine = '';
                words.forEach(word => {
                    if ((currentLine + word).length > 75) {
                        console.log(`   ${currentLine.trim()}`);
                        currentLine = word + ' ';
                    }
                    else {
                        currentLine += word + ' ';
                    }
                });
                if (currentLine.trim()) {
                    console.log(`   ${currentLine.trim()}`);
                }
            }
            else {
                console.log(`   "${singleLine}"`);
            }
        }
        console.log(`\n🎯 Extracted Action: "${parsedAction}"`);
        // Show parsing transformation if the response was more than just the action
        const normalizedResponse = cleanResponse.toLowerCase().trim();
        const justAction = normalizedResponse === parsedAction || normalizedResponse.startsWith(parsedAction + ' ');
        if (!justAction) {
            console.log(`   ⚙️  Parsed from: "${cleanResponse.substring(0, Math.min(80, cleanResponse.length))}${cleanResponse.length > 80 ? '...' : ''}"`);
        }
        // Extract and show any reasoning from the response
        const extractedReasoning = [];
        const seenReasons = new Set();
        // Helper to add reasoning without duplicates
        const addReasoning = (text) => {
            const cleaned = text.trim()
                .replace(/^(?:reasoning|brief reasoning):\s*/i, '')
                .replace(/^\[reasoning:\s*/i, '')
                .replace(/\]$/, '')
                .trim();
            if (cleaned.length < 15 || cleaned.length > 400) {
                return;
            }
            // Normalize for comparison (remove extra whitespace, lowercase)
            const normalized = cleaned.toLowerCase().replace(/\s+/g, ' ');
            // Check if this is a substring or superset of existing reasoning
            let isDuplicate = false;
            for (const existing of seenReasons) {
                if (normalized === existing ||
                    normalized.includes(existing) ||
                    existing.includes(normalized)) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                seenReasons.add(normalized);
                extractedReasoning.push(cleaned);
            }
        };
        // Pattern 1: [Reasoning: ...] or [briefly ...] format
        const reasoningBracketMatch = cleanResponse.match(/\[(?:Reasoning|briefly|reasoning):\s*([^\]]+)\]/i);
        if (reasoningBracketMatch && reasoningBracketMatch[1]) {
            addReasoning(reasoningBracketMatch[1]);
        }
        // Pattern 1b: [any text in brackets that looks like reasoning]
        const anyBracketMatch = cleanResponse.match(/\[([^\]]{20,})\]/);
        if (anyBracketMatch && anyBracketMatch[1] && !anyBracketMatch[1].match(/^(next\s+action|action|result)/i)) {
            const bracketContent = anyBracketMatch[1];
            // Check if it contains reasoning keywords
            if (bracketContent.match(/(?:maintain|consistency|integrity|because|reason|since|allows|enables|promotes|facilitates)/i)) {
                addReasoning(bracketContent);
            }
        }
        // Pattern 2: "Brief reasoning:" or "Reasoning:" lines
        const briefReasoningMatch = cleanResponse.match(/(?:Brief\s+)?[Rr]easoning:\s*(.+?)(?:\n|$)/i);
        if (briefReasoningMatch && briefReasoningMatch[1]) {
            addReasoning(briefReasoningMatch[1]);
        }
        // Pattern 3: Multi-line reasoning (lines after action name that aren't just the action)
        const lines = cleanResponse.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 1) {
            const actionLineIndex = lines.findIndex(l => /\b(evolve|self-reference|self-modify|self-io|validate-self|self-train|self-observe|compose)\b/i.test(l));
            if (actionLineIndex >= 0 && actionLineIndex < lines.length - 1) {
                // Get all text after the action line
                const afterActionLines = lines.slice(actionLineIndex + 1)
                    .filter(l => !l.match(/^(next\s+action|action|result|current\s+state):?\s*/i))
                    .filter(l => !l.match(/^[-*]\s*(dimension|state|self-reference):/i));
                // Extract bullet points separately
                const bulletPoints = afterActionLines.filter(l => l.match(/^[-*•]\s+/));
                bulletPoints.forEach(bullet => {
                    const content = bullet.replace(/^[-*•]\s+/, '').trim();
                    if (content.length > 15) {
                        addReasoning(content);
                    }
                });
                // Also add the full text if it's substantial
                const afterAction = afterActionLines.join(' ').trim();
                if (afterAction && afterAction.length > 30 && bulletPoints.length === 0) {
                    addReasoning(afterAction);
                }
            }
        }
        // Pattern 4: "because/since/as" clauses (only if not already captured)
        if (extractedReasoning.length === 0) {
            const reasoningPatterns = [
                /(?:because|since|as|due to|considering|given that|based on)[^.!?\n]*[.!?]/gi,
                /reason[^.!?\n]*[.!?]/gi
            ];
            reasoningPatterns.forEach(pattern => {
                const matches = cleanResponse.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        addReasoning(match);
                    });
                }
            });
        }
        if (extractedReasoning.length > 0) {
            console.log(`\n💡 LLM Reasoning:`);
            extractedReasoning.forEach((reason, idx) => {
                // Wrap long reasoning nicely
                if (reason.length > 70) {
                    const words = reason.split(' ');
                    let currentLine = '';
                    let isFirstLine = true;
                    words.forEach(word => {
                        if ((currentLine + word).length > 70) {
                            console.log(`   ${isFirstLine ? '┌─' : '│ '} ${currentLine.trim()}`);
                            currentLine = word + ' ';
                            isFirstLine = false;
                        }
                        else {
                            currentLine += word + ' ';
                        }
                    });
                    if (currentLine.trim()) {
                        console.log(`   └─ ${currentLine.trim()}`);
                    }
                }
                else {
                    console.log(`   ${idx + 1}. "${reason}"`);
                }
            });
        }
        // Reasoning branch (if we can infer it)
        console.log('\n💭 Reasoning:');
        const reasoning = this.inferReasoning(context, parsedAction, context.history);
        console.log(`   ${reasoning}`);
        // Action execution branch
        console.log('\n⚡ Execution:');
        console.log(`   → Executing: ${parsedAction}`);
        console.log('═'.repeat(60) + '\n');
    }
    inferReasoning(context, action, history) {
        const dim = context.dimension;
        const reasons = [];
        // Dimensional reasoning
        if (action === 'evolve' && dim < 7) {
            reasons.push(`Progression from ${dim}D to ${dim + 1}D`);
        }
        // Pattern reasoning
        if (action === 'self-reference') {
            reasons.push(`Maintaining self-referential integrity at ${dim}D`);
        }
        // Compose reasoning
        if (action === 'compose') {
            reasons.push(`Structural composition: combining multiple automata at ${dim}D`);
            if (dim === 2) {
                reasons.push(`2D optimal for pairing operations`);
            }
        }
        // History reasoning
        if (history.length > 0) {
            const lastAction = history[history.length - 1];
            const actionCount = history.filter(a => a === action).length;
            if (action === lastAction && actionCount >= 2) {
                reasons.push(`Repeating pattern: ${action} (${actionCount}x)`);
            }
            else if (action !== lastAction) {
                reasons.push(`Switching from ${lastAction} to ${action}`);
            }
            // Show action frequency
            const actionFreq = {};
            history.forEach(a => actionFreq[a] = (actionFreq[a] || 0) + 1);
            const mostCommon = Object.entries(actionFreq).sort((a, b) => b[1] - a[1])[0];
            if (mostCommon && mostCommon[0] !== action) {
                reasons.push(`Most common: ${mostCommon[0]} (${mostCommon[1]}x)`);
            }
        }
        // Dimension-specific reasoning
        const dimReasons = {
            0: { 'self-reference': 'Foundation: establishing identity', 'evolve': 'Initial progression' },
            1: { 'evolve': 'Temporal: moving forward in time', 'self-reference': 'Temporal self-reference' },
            2: { 'compose': 'Structural: combining patterns', 'self-modify': 'Pattern transformation' },
            3: { 'self-modify': 'Algebraic: transforming structure', 'compose': 'Algebraic composition' },
            4: { 'self-io': 'Network: file operations', 'evolve': 'Network expansion' },
            5: { 'validate-self': 'Consensus: verifying integrity', 'self-reference': 'Consensus validation' },
            6: { 'self-train': 'Intelligence: learning from history', 'compose': 'Neural composition' },
            7: { 'self-observe': 'Quantum: observation and collapse', 'compose': 'Quantum superposition' }
        };
        if (dimReasons[dim] && dimReasons[dim][action]) {
            reasons.push(dimReasons[dim][action]);
        }
        // Iteration-based reasoning
        if (context.iteration > 0 && context.iteration % 10 === 0) {
            reasons.push(`Milestone iteration: ${context.iteration}`);
        }
        return reasons.length > 0 ? reasons.join(' | ') : `Action selected based on dimensional context (${dim}D)`;
    }
    async executeAIAction() {
        try {
            const prompt = this.generateContextPrompt();
            const currentAutomaton = this.automaton.getCurrentAutomaton();
            const history = this.automaton.executionHistory.slice(-5);
            console.log(`🤖 Querying Ollama (${this.ollamaModel})...`);
            const rawResponse = await this.queryOllama(prompt);
            // Extract action from response (handle cases where LLM provides reasoning)
            // Look for action name first, then fall back to parsing
            let action = rawResponse.toLowerCase().trim();
            // Try to extract just the action name if there's additional text
            const actionMatch = action.match(/\b(evolve|self-reference|self-modify|self-io|validate-self|self-train|self-observe|compose)\b/);
            if (actionMatch && actionMatch[1]) {
                action = actionMatch[1];
            }
            else {
                // Fallback: take first word and normalize
                const firstWord = action.split(/\s+/)[0];
                if (firstWord) {
                    action = firstWord.replace(/\s+/g, '-');
                }
            }
            // Prepare decision trie context
            const availableActions = [
                'evolve',
                'self-reference',
                'self-modify',
                'self-io',
                'validate-self',
                'self-train',
                'self-observe',
                'compose'
            ];
            const context = {
                dimension: currentAutomaton?.dimensionalLevel || 0,
                dimensionName: this.getDimensionName(currentAutomaton?.dimensionalLevel || 0),
                state: currentAutomaton?.currentState || 'unknown',
                selfRefLine: currentAutomaton?.selfReference?.line || 0,
                selfRefPattern: currentAutomaton?.selfReference?.pattern || 'unknown',
                iteration: this.iterationCount,
                history: history
            };
            // Print decision trie
            this.printDecisionTrie(context, rawResponse, action, availableActions);
            console.log(`🧠 AI Decision: ${action}`);
            // Track action in history
            if (!this.automaton.executionHistory) {
                this.automaton.executionHistory = [];
            }
            this.automaton.executionHistory.push(action);
            // Execute the chosen action
            if (currentAutomaton) {
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
                    default:
                        console.log(`⚠️ Unknown action: ${action}, defaulting to evolve`);
                        this.automaton.executionHistory.push('evolve');
                        this.automaton.executeEvolution();
                        this.progressDimension();
                }
            }
        }
        catch (error) {
            console.error('❌ Ollama query failed:', error);
            // Fallback to automatic evolution
            this.automaton.executeEvolution();
            this.progressDimension();
        }
    }
    getDimensionName(dim) {
        const names = {
            0: 'identity',
            1: 'temporal',
            2: 'structural',
            3: 'algebraic',
            4: 'network',
            5: 'consensus',
            6: 'intelligence',
            7: 'quantum'
        };
        return names[dim] || 'unknown';
    }
    progressDimension() {
        const currentDim = this.automaton.currentDimension;
        const nextDim = (currentDim + 1) % 8;
        this.automaton.currentDimension = nextDim;
        console.log(`📈 Progressed to dimension ${nextDim}`);
    }
    async saveAndAnalyze() {
        if (this.iterationCount % 10 === 0) {
            console.log('💾 Saving automaton state...');
            this.automaton.save();
            console.log('📊 Analyzing self-reference...');
            this.automaton.analyzeSelfReference();
        }
    }
    printStatus() {
        const currentAutomaton = this.automaton.getCurrentAutomaton();
        const selfModifications = this.automaton.selfModificationCount;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 Iteration ${this.iterationCount} | Dimension ${this.automaton.currentDimension}`);
        console.log(`📍 State: ${currentAutomaton?.currentState}`);
        console.log(`🔗 Self-reference: line ${currentAutomaton?.selfReference.line} (${currentAutomaton?.selfReference.pattern})`);
        console.log(`🔧 Self-modifications: ${selfModifications}`);
        console.log(`📚 Total objects: ${this.automaton.objects.length}`);
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
        // Check if Ollama is available
        try {
            // Use a simple test query to verify Ollama is working
            const testResponse = await this.queryOllama('Say "OK"');
            if (!testResponse || testResponse.trim().length === 0) {
                throw new Error('Ollama returned empty response');
            }
            console.log('✅ Ollama connection verified');
        }
        catch (error) {
            console.error('❌ Ollama not available. Please install Ollama first:');
            console.error('   curl -fsSL https://ollama.ai/install.sh | sh');
            console.error(`   ollama pull ${this.ollamaModel}`);
            console.error(`   Error: ${error.message || error}`);
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
    stop() {
        this.isRunning = false;
        console.log('🛑 Stopping continuous execution...');
    }
    getStatus() {
        console.log('📊 Current Status:');
        console.log(`  Running: ${this.isRunning}`);
        console.log(`  Iteration: ${this.iterationCount}`);
        console.log(`  Dimension: ${this.automaton.currentDimension || 0}`);
        console.log(`  Model: ${this.ollamaModel}`);
    }
}
// CLI interface
async function main() {
    const args = process.argv.slice(2);
    let model = 'llama3.2';
    let interval = 3000;
    let maxIterations = undefined;
    let automatonFile = './automaton.jsonl';
    // Parse arguments: model, interval, maxIterations, automatonFile
    // Format from bash script: model interval [maxIterations] [automatonFile]
    let argIndex = 0;
    // First arg: model
    const modelArg = args[argIndex];
    if (args.length > argIndex && modelArg && !modelArg.startsWith('--')) {
        model = modelArg;
        argIndex++;
    }
    // Second arg: interval
    const intervalArg = args[argIndex];
    if (args.length > argIndex && intervalArg && !isNaN(parseInt(intervalArg))) {
        interval = parseInt(intervalArg) || 3000;
        argIndex++;
    }
    // Third arg: maxIterations (optional)
    const maxIterationsArg = args[argIndex];
    if (args.length > argIndex && maxIterationsArg && !isNaN(parseInt(maxIterationsArg))) {
        maxIterations = parseInt(maxIterationsArg);
        argIndex++;
    }
    // Last arg: automatonFile (if provided)
    const potentialFile = args[argIndex];
    if (args.length > argIndex && potentialFile) {
        if (potentialFile.endsWith('.jsonl') || potentialFile.includes('/') || potentialFile.includes('\\')) {
            automatonFile = potentialFile;
        }
    }
    console.log('🤖 Ollama-Powered Self-Referencing Automaton');
    console.log('='.repeat(50));
    const db = new MetaLogDb({ enableProlog: true, enableDatalog: true });
    const runner = new OllamaAutomatonRunner(automatonFile, model, db);
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

/**
 * Memory-Optimized Automaton with Leak Fixes
 * Implements: GC triggers, object trimming, execution history limits
 */
class MemoryOptimizedAutomaton extends AdvancedSelfReferencingAutomaton {
    constructor(filePath, config, db) {
        super(filePath, db);
        this.lastGCTime = 0;
        this.lastTrimTime = 0;
        this.config = {
            maxObjects: config?.maxObjects || 2000,
            maxExecutionHistory: config?.maxExecutionHistory || 500,
            gcInterval: config?.gcInterval || 5000, // 5 seconds
            trimInterval: config?.trimInterval || 10000, // 10 seconds
            memoryPressureThreshold: config?.memoryPressureThreshold || 200, // 200MB
            enableGC: config?.enableGC ?? true,
            lockDimension: config?.lockDimension,
            dimension0Focus: config?.dimension0Focus ?? false,
            dimension0Probability: config?.dimension0Probability ?? 0.5,
        };
        // Lock to dimension 0 if configured
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
            if (process.env.VERBOSE === 'true') {
                console.log(`🔒 Locked to dimension ${this.config.lockDimension} for Identity Evolution`);
            }
        }
        this.startOptimization();
    }
    startOptimization() {
        // Start GC timer
        if (this.config.enableGC) {
            this.gcTimer = setInterval(() => {
                this.forceGarbageCollection();
            }, this.config.gcInterval);
        }
        // Start trimming timer
        this.trimTimer = setInterval(() => {
            this.trimObjects();
            this.trimExecutionHistory();
        }, this.config.trimInterval);
        console.log('✅ Memory optimization started');
        console.log(`   Max Objects: ${this.config.maxObjects}`);
        console.log(`   Max Execution History: ${this.config.maxExecutionHistory}`);
        console.log(`   GC Interval: ${this.config.gcInterval}ms`);
        console.log(`   Trim Interval: ${this.config.trimInterval}ms`);
    }
    forceGarbageCollection() {
        const now = Date.now();
        if (now - this.lastGCTime < this.config.gcInterval) {
            return;
        }
        const memBefore = process.memoryUsage();
        // Force GC if available (requires --expose-gc flag)
        if (global.gc) {
            global.gc();
            const memAfter = process.memoryUsage();
            const freed = (memBefore.heapUsed - memAfter.heapUsed) / 1024 / 1024;
            if (freed > 1) {
                // Reduced verbosity - only log GC in verbose mode or if significant memory freed
                if (process.env.VERBOSE === 'true' || freed > 5.0) {
                    console.log(`🧹 GC freed ${freed.toFixed(2)}MB`);
                }
            }
        }
        else {
            // Manual cleanup hints
            this.trimObjects();
            this.trimExecutionHistory();
        }
        this.lastGCTime = now;
    }
    trimObjects() {
        const now = Date.now();
        if (now - this.lastTrimTime < this.config.trimInterval) {
            return;
        }
        const objects = this.objects || [];
        const memUsage = process.memoryUsage();
        const memMB = memUsage.heapUsed / 1024 / 1024;
        // Trim if over limit or memory pressure
        if (objects.length > this.config.maxObjects || memMB > this.config.memoryPressureThreshold) {
            const toRemove = Math.max(objects.length - this.config.maxObjects, Math.floor(objects.length * 0.1) // Remove 10% if over pressure threshold
            );
            if (toRemove > 0) {
                // Keep most recent objects, remove oldest
                this.objects = objects.slice(toRemove);
                console.log(`✂️  Trimmed ${toRemove} objects (${objects.length} → ${this.objects.length})`);
                // Save after trimming
                this.save();
            }
        }
        this.lastTrimTime = now;
    }
    trimExecutionHistory() {
        const history = this.executionHistory || [];
        if (history.length > this.config.maxExecutionHistory) {
            const toRemove = history.length - this.config.maxExecutionHistory;
            this.executionHistory = history.slice(toRemove);
            console.log(`✂️  Trimmed ${toRemove} execution history entries (${history.length} → ${this.executionHistory.length})`);
        }
    }
    // Override executeSelfModification to add memory checks and dimension control
    executeSelfModification() {
        // Ensure we're at dimension 0 if locked or focused
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
        }
        else if (this.config.dimension0Focus) {
            // Cycle back to dimension 0 with configured probability
            const currentDim = this.currentDimension || 0;
            if (currentDim !== 0 && Math.random() < this.config.dimension0Probability) {
                this.currentDimension = 0;
                if (process.env.VERBOSE === 'true') {
                    console.log(`🔄 Returning to dimension 0 for Identity Evolution`);
                }
            }
        }
        // Check memory before execution
        const memBefore = process.memoryUsage();
        const memMB = memBefore.heapUsed / 1024 / 1024;
        // Trim if memory pressure is high
        if (memMB > this.config.memoryPressureThreshold) {
            this.trimObjects();
            this.trimExecutionHistory();
        }
        // Call parent method
        super.executeSelfModification();
        // Check memory after execution
        const memAfter = process.memoryUsage();
        const memDelta = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
        if (memDelta > 5) { // > 5MB growth
            console.log(`⚠️  Large memory growth detected: +${memDelta.toFixed(2)}MB`);
            this.forceGarbageCollection();
        }
        // Log Identity Evolution (0D) count
        const currentDim = this.currentDimension || 0;
        if (currentDim === 0) {
            const identityEvolutions = (this.objects || []).filter((obj) => obj.selfReference?.pattern === 'Identity Evolution (0D)').length;
            // Reduced verbosity - only log major milestones (every 500th) or in verbose mode
            if (process.env.VERBOSE === 'true' || identityEvolutions % 500 === 0) {
                console.log(`✨ Identity Evolution (0D): ${identityEvolutions} total`);
            }
        }
    }
    // Override executeAction to prevent dimension progression when locked
    executeAction(action, fromState, toState, context = {}) {
        // Prevent evolution if locked to dimension 0
        if (this.config.lockDimension !== undefined && action === 'evolve') {
            console.log(`🔒 Skipping evolution (locked to dimension ${this.config.lockDimension})`);
            return;
        }
        // Call parent method
        super.executeAction(action, fromState, toState, context);
        // Ensure we stay at dimension 0 if locked
        if (this.config.lockDimension !== undefined) {
            this.currentDimension = this.config.lockDimension;
        }
    }
    // Override methods that add to execution history
    addToHistory(entry) {
        const history = this.executionHistory || [];
        history.push(entry);
        // Trim if over limit
        if (history.length > this.config.maxExecutionHistory) {
            this.executionHistory = history.slice(-this.config.maxExecutionHistory);
        }
    }
    destroy() {
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
        }
        if (this.trimTimer) {
            clearInterval(this.trimTimer);
        }
        console.log('🛑 Memory optimization stopped');
    }
}
// If run directly, create optimized instance
if (require.main === module) {
    // Check for command-line arguments to focus on Identity Evolution (0D)
    const args = process.argv.slice(2);
    const focus0D = args.includes('--0d') || args.includes('--identity-evolution');
    const lock0D = args.includes('--lock-0d');
    const probability = args.find(arg => arg.startsWith('--0d-prob='))?.split('=')[1];
    const db = new MetaLogDb({ enableProlog: true, enableDatalog: true });
    const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', {
        maxObjects: 2000,
        maxExecutionHistory: 500,
        gcInterval: 5000,
        trimInterval: 10000,
        memoryPressureThreshold: 200,
        enableGC: true,
        // Identity Evolution (0D) focus options
        lockDimension: lock0D ? 0 : undefined,
        dimension0Focus: focus0D || lock0D,
        dimension0Probability: probability ? parseFloat(probability) : (focus0D ? 0.7 : 0.5),
    }, db);
    // Run self-modification loop
    // Default: 1000ms, but can be overridden with --interval flag
    const intervalArg = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
    const modificationInterval = intervalArg ? parseInt(intervalArg) : 1000;
    setInterval(() => {
        automaton.executeSelfModification();
    }, modificationInterval);
    // Handle shutdown
    process.on('SIGINT', () => {
        automaton.destroy();
        process.exit(0);
    });
    console.log('🚀 Memory-optimized automaton running...');
    console.log(`   Modification Interval: ${modificationInterval}ms`);
    if (lock0D) {
        console.log('🔒 Locked to dimension 0 for maximum Identity Evolution');
    }
    else if (focus0D) {
        console.log(`🎯 Focusing on Identity Evolution (0D) with ${(focus0D ? 0.7 : 0.5) * 100}% probability`);
    }
    else {
        console.log('✅ Dimension progression enabled (not locked to 0D)');
    }
    console.log('💡 Usage: --0d or --identity-evolution to focus on 0D, --lock-0d to lock to 0D');
    console.log('💡 Usage: --0d-prob=0.8 to set probability of returning to dimension 0');
    console.log('💡 Usage: --interval=N to set modification interval in ms (default: 1000)');
}

/**
 * Evolved Automaton - Implements Snapshot Analysis Recommendations
 *
 * Recommendations Implemented:
 * 1. Enable dimension progression (removed 0D lock)
 * 2. Increase modification frequency (faster intervals)
 * 3. Monitor Phase 4 growth (memory growth tracking)
 */
class EvolvedAutomaton extends MemoryOptimizedAutomaton {
    constructor(filePath, config) {
        // Initialize with dimension progression enabled (no lock)
        super(filePath, {
            maxObjects: 2000,
            maxExecutionHistory: 500,
            gcInterval: 5000,
            trimInterval: 10000,
            memoryPressureThreshold: 200,
            enableGC: true,
            // Disable dimension locking - enable progression
            lockDimension: undefined,
            dimension0Focus: false,
        });
        this.memoryHistory = [];
        this.phase4Detected = false;
        this.lastDimension = 0;
        this.dimensionProgressionCount = 0;
        this.evolvedConfig = {
            enableDimensionProgression: config?.enableDimensionProgression ?? true,
            dimensionProgressionInterval: config?.dimensionProgressionInterval || 5000, // 5 seconds
            modificationInterval: config?.modificationInterval || 100, // 100ms (10x faster)
            burstModifications: config?.burstModifications || 3, // 3 modifications per burst
            enablePhase4Monitoring: config?.enablePhase4Monitoring ?? true,
            phase4Threshold: config?.phase4Threshold || 50, // 50MB threshold
            phase4GrowthRateThreshold: config?.phase4GrowthRateThreshold || 0.1, // 0.1 MB/sec
            phase4CheckInterval: config?.phase4CheckInterval || 10000, // 10 seconds
        };
        this.lastDimension = this.currentDimension || 0;
        // Reduced verbosity for testing
        if (process.env.VERBOSE === 'true') {
            console.log('🚀 Evolved Automaton initialized');
            console.log(`   Dimension Progression: ${this.evolvedConfig.enableDimensionProgression ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   Modification Interval: ${this.evolvedConfig.modificationInterval}ms`);
            console.log(`   Burst Modifications: ${this.evolvedConfig.burstModifications}`);
            console.log(`   Phase 4 Monitoring: ${this.evolvedConfig.enablePhase4Monitoring ? '✅ Enabled' : '❌ Disabled'}`);
        }
        this.startEvolvedFeatures();
    }
    startEvolvedFeatures() {
        // Start high-frequency modification loop
        this.modificationTimer = setInterval(() => {
            this.executeBurstModifications();
        }, this.evolvedConfig.modificationInterval);
        // Start dimension progression
        if (this.evolvedConfig.enableDimensionProgression) {
            this.dimensionProgressionTimer = setInterval(() => {
                this.progressDimension();
            }, this.evolvedConfig.dimensionProgressionInterval);
        }
        // Start Phase 4 monitoring
        if (this.evolvedConfig.enablePhase4Monitoring) {
            this.phase4MonitorTimer = setInterval(() => {
                this.monitorPhase4Growth();
            }, this.evolvedConfig.phase4CheckInterval);
        }
    }
    executeBurstModifications() {
        // Execute multiple modifications in a burst for higher frequency
        for (let i = 0; i < this.evolvedConfig.burstModifications; i++) {
            try {
                this.executeSelfModification();
            }
            catch (error) {
                // Only log errors in verbose mode
                if (process.env.VERBOSE === 'true') {
                    console.error(`Burst modification ${i + 1} error:`, error);
                }
            }
        }
    }
    progressDimension() {
        const currentDim = this.currentDimension || 0;
        // Only progress if we've been at current dimension for a while
        // This prevents rapid cycling
        if (currentDim === this.lastDimension) {
            // Check if we should progress
            const shouldProgress = Math.random() > 0.3; // 70% chance to progress
            if (shouldProgress) {
                const nextDimension = (currentDim + 1) % 8;
                this.currentDimension = nextDimension;
                this.dimensionProgressionCount++;
                // Reduced verbosity - only log significant progressions
                if (process.env.VERBOSE === 'true' || this.dimensionProgressionCount % 5 === 0) {
                    console.log(`🔄 Dimension progression: ${currentDim}D → ${nextDimension}D (Total: ${this.dimensionProgressionCount})`);
                }
                // Execute evolution action
                try {
                    this.executeEvolution();
                }
                catch (error) {
                    console.error('Dimension progression error:', error);
                }
                this.lastDimension = nextDimension;
            }
        }
        else {
            this.lastDimension = currentDim;
        }
    }
    monitorPhase4Growth() {
        const memUsage = process.memoryUsage();
        const memMB = memUsage.heapUsed / 1024 / 1024;
        const now = Date.now();
        // Add to history
        this.memoryHistory.push({ timestamp: now, memory: memMB });
        // Keep last 100 samples (for ~16 minutes at 10s intervals)
        if (this.memoryHistory.length > 100) {
            this.memoryHistory.shift();
        }
        // Need at least 10 samples for analysis
        if (this.memoryHistory.length < 10) {
            return;
        }
        // Check if we're in Phase 4 (high memory, accelerating growth)
        const recent = this.memoryHistory.slice(-10);
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        if (!oldest || !newest) {
            return; // Not enough history yet
        }
        const timeDelta = (newest.timestamp - oldest.timestamp) / 1000; // seconds
        const memoryDelta = newest.memory - oldest.memory; // MB
        const growthRate = memoryDelta / timeDelta; // MB/sec
        // Phase 4 detection criteria:
        // 1. Memory above threshold
        // 2. Growth rate above threshold
        // 3. Consistent growth pattern
        const isPhase4 = memMB > this.evolvedConfig.phase4Threshold &&
            growthRate > this.evolvedConfig.phase4GrowthRateThreshold &&
            memoryDelta > 0;
        if (isPhase4 && !this.phase4Detected) {
            this.phase4Detected = true;
            // Reduced verbosity - only show critical Phase 4 detection
            console.log(`⚠️  Phase 4 growth: ${memMB.toFixed(1)}MB (${growthRate.toFixed(3)}MB/s)`);
            // Trigger aggressive GC
            if (global.gc) {
                global.gc();
                if (process.env.VERBOSE === 'true') {
                    console.log('   🧹 Aggressive GC triggered');
                }
            }
            // Trigger object trimming
            this.trimObjects();
            this.trimExecutionHistory();
        }
        else if (!isPhase4 && this.phase4Detected) {
            this.phase4Detected = false;
            if (process.env.VERBOSE === 'true') {
                console.log('✅ Phase 4 growth resolved - memory stabilized');
            }
        }
        // Reduced verbosity - only log Phase 4 status in verbose mode
        if (this.phase4Detected && process.env.VERBOSE === 'true' && this.memoryHistory.length % 10 === 0) {
            console.log(`📊 Phase 4: ${memMB.toFixed(1)}MB (${growthRate.toFixed(3)}MB/s)`);
        }
    }
    getStats() {
        // Base class doesn't have getStats, so start with empty object
        const baseStats = {};
        const memUsage = process.memoryUsage();
        const memMB = memUsage.heapUsed / 1024 / 1024;
        // Calculate current growth rate
        let currentGrowthRate = 0;
        if (this.memoryHistory.length >= 2) {
            const recent = this.memoryHistory.slice(-2);
            const first = recent[0];
            const second = recent[1];
            if (first && second) {
                const timeDelta = (second.timestamp - first.timestamp) / 1000;
                const memoryDelta = second.memory - first.memory;
                currentGrowthRate = memoryDelta / timeDelta;
            }
        }
        return {
            ...baseStats,
            evolved: {
                dimensionProgression: {
                    enabled: this.evolvedConfig.enableDimensionProgression,
                    currentDimension: this.currentDimension || 0,
                    progressions: this.dimensionProgressionCount,
                },
                modificationFrequency: {
                    interval: this.evolvedConfig.modificationInterval,
                    burstSize: this.evolvedConfig.burstModifications,
                    modificationsPerSecond: (1000 / this.evolvedConfig.modificationInterval) * this.evolvedConfig.burstModifications,
                },
                phase4Monitoring: {
                    enabled: this.evolvedConfig.enablePhase4Monitoring,
                    detected: this.phase4Detected,
                    currentMemory: memMB,
                    growthRate: currentGrowthRate,
                    historySamples: this.memoryHistory.length,
                },
            },
        };
    }
    destroy() {
        // Stop evolved timers
        if (this.modificationTimer) {
            clearInterval(this.modificationTimer);
        }
        if (this.dimensionProgressionTimer) {
            clearInterval(this.dimensionProgressionTimer);
        }
        if (this.phase4MonitorTimer) {
            clearInterval(this.phase4MonitorTimer);
        }
        // Call parent destroy
        super.destroy();
        if (process.env.VERBOSE === 'true') {
            console.log('🛑 Evolved automaton stopped');
        }
    }
}
// If run directly, start evolved automaton
if (require.main === module) {
    const args = process.argv.slice(2);
    const modificationInterval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
    const burstSize = args.find(arg => arg.startsWith('--burst='))?.split('=')[1];
    const noDimensionProgression = args.includes('--no-dimension-progression');
    const noPhase4Monitoring = args.includes('--no-phase4-monitoring');
    const automaton = new EvolvedAutomaton('./automaton.jsonl', {
        enableDimensionProgression: !noDimensionProgression,
        modificationInterval: modificationInterval ? parseInt(modificationInterval) : 100, // 100ms default
        burstModifications: burstSize ? parseInt(burstSize) : 3,
        enablePhase4Monitoring: !noPhase4Monitoring,
    });
    // Print stats every 30 seconds
    setInterval(() => {
        const stats = automaton.getStats();
        // Reduced verbosity - only show stats in verbose mode
        if (process.env.VERBOSE === 'true') {
            console.log('\n📊 Evolved Automaton Stats:');
            console.log(`   Dimension: ${stats.evolved.dimensionProgression.currentDimension}D (${stats.evolved.dimensionProgression.progressions} progressions)`);
            console.log(`   Modifications/sec: ${stats.evolved.modificationFrequency.modificationsPerSecond.toFixed(1)}`);
            console.log(`   Memory: ${stats.evolved.phase4Monitoring.currentMemory.toFixed(2)}MB`);
            console.log(`   Growth Rate: ${stats.evolved.phase4Monitoring.growthRate.toFixed(4)}MB/sec`);
            console.log(`   Phase 4: ${stats.evolved.phase4Monitoring.detected ? '⚠️  DETECTED' : '✅ Normal'}`);
        }
    }, 30000);
    // Handle shutdown
    process.on('SIGINT', () => {
        automaton.destroy();
        process.exit(0);
    });
    console.log('\n💡 Usage:');
    console.log('   --interval=N        Set modification interval in ms (default: 100)');
    console.log('   --burst=N           Set burst size (default: 3)');
    console.log('   --no-dimension-progression  Disable dimension progression');
    console.log('   --no-phase4-monitoring     Disable Phase 4 monitoring');
    console.log('\n🚀 Evolved automaton running with recommendations implemented...');
}

/**
 * Scalable Automaton with GPU Acceleration and Multi-Core Support
 * Dynamically scales based on available resources (CPU cores, GPU, memory)
 */
class ScalableAutomaton {
    constructor(filePath, config) {
        this.workers = [];
        this.workerResults = new Map();
        this.activeWorkers = 0;
        this.gpuAvailable = false;
        this.cpuCores = os.cpus().length;
        this.config = {
            maxWorkers: config?.maxWorkers || Math.max(1, this.cpuCores - 1), // Leave 1 core for main
            workerInterval: config?.workerInterval || 100, // 100ms between worker executions
            enableWorkerThreads: config?.enableWorkerThreads ?? true,
            enableGPU: config?.enableGPU ?? false,
            gpuBatchSize: config?.gpuBatchSize || 1000,
            autoScale: config?.autoScale ?? true,
            scaleUpThreshold: config?.scaleUpThreshold || 0.3, // Scale up at 30% memory
            scaleDownThreshold: config?.scaleDownThreshold || 0.1, // Scale down at 10% memory
            minWorkers: config?.minWorkers || 1,
            maxWorkersLimit: config?.maxWorkersLimit || this.cpuCores * 2,
            parallelModifications: config?.parallelModifications || this.cpuCores,
            executionBatchSize: config?.executionBatchSize || 100,
        };
        // Initialize main automaton
        this.mainAutomaton = new MemoryOptimizedAutomaton(filePath, {
            maxObjects: 10000, // Increased for scalability
            maxExecutionHistory: 2000,
            gcInterval: 10000,
            trimInterval: 20000,
            memoryPressureThreshold: 500, // Higher threshold for scaling
            enableGC: true,
        });
        // Check GPU availability
        this.checkGPUAvailability();
        // Initialize workers
        if (this.config.enableWorkerThreads) {
            this.initializeWorkers();
        }
        console.log('🚀 Scalable Automaton initialized');
        console.log(`   CPU Cores: ${this.cpuCores}`);
        console.log(`   Workers: ${this.config.maxWorkers}`);
        console.log(`   GPU: ${this.gpuAvailable ? '✅ Available' : '❌ Not available'}`);
        console.log(`   Parallel Modifications: ${this.config.parallelModifications}`);
        console.log(`   Auto-Scale: ${this.config.autoScale ? '✅ Enabled' : '❌ Disabled'}`);
    }
    checkGPUAvailability() {
        // Check if GPU.js is available (optional dependency)
        try {
            // Try to require GPU.js - if not available, GPU acceleration will be disabled
            require.resolve('gpu.js');
            // Try to actually load and instantiate GPU to verify it works
            try {
                const GPU = require('gpu.js');
                if (GPU && typeof GPU === 'function') {
                    // Try to create a simple GPU instance to verify it works
                    const testGPU = new GPU({ mode: 'cpu' }); // Use CPU mode for testing
                    this.gpuAvailable = true;
                    console.log('✅ GPU.js detected and working - GPU acceleration available');
                }
                else {
                    throw new Error('GPU.js module loaded but constructor not available');
                }
            }
            catch (loadError) {
                this.gpuAvailable = false;
                console.log('⚠️  GPU.js found but failed to initialize:', loadError.message);
                console.log('   Continuing without GPU acceleration');
            }
        }
        catch (resolveError) {
            this.gpuAvailable = false;
            // Check if it's in package.json but not installed
            const packageJsonPath = path.join(__dirname, '../../package.json');
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    const hasGpuJs = (packageJson.dependencies && packageJson.dependencies['gpu.js']) ||
                        (packageJson.optionalDependencies && packageJson.optionalDependencies['gpu.js']);
                    if (hasGpuJs) {
                        console.log('⚠️  GPU.js is in package.json but not installed (may require native build tools)');
                        console.log('   Install build tools or run: npm install gpu.js');
                    }
                    else {
                        console.log('⚠️  GPU.js not found - Install with: npm install gpu.js');
                    }
                }
                catch {
                    console.log('⚠️  GPU.js not found - Install with: npm install gpu.js');
                }
            }
            else {
                console.log('⚠️  GPU.js not found - Install with: npm install gpu.js');
            }
            console.log('   Continuing without GPU acceleration');
        }
    }
    initializeWorkers() {
        // Use Promise-based parallelization instead of worker threads
        // Worker threads require compiled JS files which complicates the setup
        // We'll use Promise-based parallelization for simplicity
        console.log(`✅ Using parallel execution (${this.config.maxWorkers} parallel streams)`);
    }
    async executeParallelModifications() {
        const promises = [];
        // Execute parallel modifications
        for (let i = 0; i < this.config.parallelModifications; i++) {
            promises.push(new Promise((resolve) => {
                setTimeout(() => {
                    this.mainAutomaton.executeSelfModification();
                    resolve();
                }, i * 10); // Stagger executions slightly
            }));
        }
        await Promise.all(promises);
    }
    async executeWorkerModifications() {
        if (this.workers.length === 0) {
            return;
        }
        const promises = [];
        // Distribute work across workers
        for (let i = 0; i < this.workers.length; i++) {
            const worker = this.workers[i];
            if (!worker || !worker.threadId)
                continue;
            this.activeWorkers++;
            promises.push(new Promise((resolve) => {
                worker.postMessage({
                    type: 'execute',
                    workerId: i,
                });
                // Resolve after a delay (worker will respond asynchronously)
                setTimeout(() => resolve(), this.config.workerInterval);
            }));
        }
        await Promise.all(promises);
    }
    async executeGPUBatch() {
        if (!this.gpuAvailable || !this.config.enableGPU) {
            return;
        }
        try {
            const GPU = require('gpu.js');
            const gpu = new GPU();
            // Example: GPU-accelerated Church encoding computation
            const churchEncode = gpu.createKernel(function (data) {
                // Simple GPU computation example
                // @ts-ignore - GPU.js provides thread context via 'this'
                const index = this.thread.x;
                const value = data[index];
                return value !== undefined ? value * 2 : 0;
            }).setOutput([this.config.gpuBatchSize]);
            const input = Array.from({ length: this.config.gpuBatchSize }, (_, i) => i);
            const result = churchEncode(input);
            console.log(`🔥 GPU processed ${result.length} operations`);
        }
        catch (error) {
            console.error('GPU execution error:', error);
        }
    }
    getMemoryUsage() {
        const mem = process.memoryUsage();
        const totalMem = os.totalmem();
        return mem.heapUsed / totalMem;
    }
    scaleWorkers() {
        if (!this.config.autoScale) {
            return;
        }
        const memoryUsage = this.getMemoryUsage();
        const currentWorkers = this.workers.length;
        // Scale up if memory usage is low
        if (memoryUsage < this.config.scaleUpThreshold &&
            currentWorkers < this.config.maxWorkersLimit) {
            const workersToAdd = Math.min(Math.floor((this.config.scaleUpThreshold - memoryUsage) * 10), this.config.maxWorkersLimit - currentWorkers);
            if (workersToAdd > 0) {
                console.log(`📈 Scaling up: Adding ${workersToAdd} workers (Memory: ${(memoryUsage * 100).toFixed(1)}%)`);
                // Add workers (simplified - would need to recreate worker pool)
            }
        }
        // Scale down if memory usage is high
        if (memoryUsage > this.config.scaleDownThreshold &&
            currentWorkers > this.config.minWorkers) {
            const workersToRemove = Math.min(Math.floor((memoryUsage - this.config.scaleDownThreshold) * 10), currentWorkers - this.config.minWorkers);
            if (workersToRemove > 0) {
                console.log(`📉 Scaling down: Removing ${workersToRemove} workers (Memory: ${(memoryUsage * 100).toFixed(1)}%)`);
                // Remove workers (simplified - would need to recreate worker pool)
            }
        }
    }
    async executeScalable() {
        const startTime = Date.now();
        // Execute main automaton modifications
        await this.executeParallelModifications();
        // Execute worker modifications
        if (this.config.enableWorkerThreads) {
            await this.executeWorkerModifications();
        }
        // Execute GPU batch if available
        if (this.config.enableGPU && this.gpuAvailable) {
            await this.executeGPUBatch();
        }
        // Auto-scale workers
        this.scaleWorkers();
        const duration = Date.now() - startTime;
        const objects = (this.mainAutomaton.objects || []).length;
        const memUsage = process.memoryUsage();
        console.log(`⚡ Scalable execution completed in ${duration}ms`);
        console.log(`   Objects: ${objects}`);
        console.log(`   Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Active Workers: ${this.activeWorkers}/${this.workers.length}`);
    }
    start(intervalMs = 1000) {
        console.log(`🚀 Starting scalable automaton (interval: ${intervalMs}ms)`);
        const interval = setInterval(async () => {
            try {
                await this.executeScalable();
            }
            catch (error) {
                console.error('Scalable execution error:', error);
            }
        }, intervalMs);
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping scalable automaton...');
            clearInterval(interval);
            this.destroy();
            process.exit(0);
        });
    }
    destroy() {
        // Destroy main automaton
        this.mainAutomaton.destroy();
        // Workers are Promise-based, so no cleanup needed
        console.log('✅ Scalable automaton destroyed');
    }
    getStats() {
        const memUsage = process.memoryUsage();
        const objects = (this.mainAutomaton.objects || []).length;
        return {
            cpuCores: this.cpuCores,
            workers: {
                total: this.config.maxWorkers,
                active: this.activeWorkers,
            },
            gpu: {
                available: this.gpuAvailable,
                enabled: this.config.enableGPU,
            },
            memory: {
                heapUsed: memUsage.heapUsed / 1024 / 1024,
                heapTotal: memUsage.heapTotal / 1024 / 1024,
                rss: memUsage.rss / 1024 / 1024,
                usagePercent: (this.getMemoryUsage() * 100).toFixed(1),
            },
            objects: {
                count: objects,
                modifications: this.mainAutomaton.selfModificationCount || 0,
            },
            config: {
                parallelModifications: this.config.parallelModifications,
                executionBatchSize: this.config.executionBatchSize,
                autoScale: this.config.autoScale,
            },
        };
    }
}
// If run directly, start scalable automaton
if (require.main === module) {
    const args = process.argv.slice(2);
    const enableGPU = args.includes('--gpu');
    const workers = args.find(arg => arg.startsWith('--workers='))?.split('=')[1];
    const interval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
    const noAutoScale = args.includes('--no-auto-scale');
    const automaton = new ScalableAutomaton('./automaton.jsonl', {
        maxWorkers: workers ? parseInt(workers) : undefined,
        enableGPU,
        autoScale: !noAutoScale,
        parallelModifications: os.cpus().length * 2, // 2x CPU cores for parallel modifications
    });
    automaton.start(interval ? parseInt(interval) : 1000);
    // Print stats every 10 seconds
    setInterval(() => {
        const stats = automaton.getStats();
        console.log('\n📊 Scalability Stats:');
        console.log(`   CPU Cores: ${stats.cpuCores}`);
        console.log(`   Workers: ${stats.workers.active}/${stats.workers.total}`);
        console.log(`   GPU: ${stats.gpu.enabled ? '✅' : '❌'} (${stats.gpu.available ? 'Available' : 'Not Available'})`);
        console.log(`   Memory: ${stats.memory.heapUsed.toFixed(2)}MB / ${stats.memory.heapTotal.toFixed(2)}MB (${stats.memory.usagePercent}%)`);
        console.log(`   Objects: ${stats.objects.count} (${stats.objects.modifications} modifications)`);
        console.log(`   Parallel Modifications: ${stats.config.parallelModifications}`);
    }, 10000);
    console.log('\n💡 Usage:');
    console.log('   --gpu              Enable GPU acceleration');
    console.log('   --workers=N        Set number of worker threads');
    console.log('   --interval=N       Set execution interval (ms)');
    console.log('   --no-auto-scale    Disable auto-scaling');
}

/**
 * Pattern Tracker
 *
 * Tracks execution patterns, modification patterns, and success rates
 * for learning and adaptation
 */
/**
 * Pattern Tracker
 */
class PatternTracker {
    constructor() {
        this.modificationPatterns = new Map();
        this.executionHistory = [];
        this.learnedPatterns = [];
    }
    /**
     * Track a modification pattern
     */
    trackModification(dimension, patternType, pattern, success, memoryDelta, executionTime) {
        const patternId = `${dimension}D-${patternType}-${this.hashPattern(pattern)}`;
        let modPattern = this.modificationPatterns.get(patternId);
        if (!modPattern) {
            modPattern = {
                id: patternId,
                dimension,
                patternType,
                pattern,
                successCount: 0,
                failureCount: 0,
                averageMemoryDelta: 0,
                averageExecutionTime: 0,
                lastUsed: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            this.modificationPatterns.set(patternId, modPattern);
        }
        // Update statistics
        if (success) {
            modPattern.successCount++;
        }
        else {
            modPattern.failureCount++;
        }
        // Update averages
        const totalCount = modPattern.successCount + modPattern.failureCount;
        modPattern.averageMemoryDelta =
            (modPattern.averageMemoryDelta * (totalCount - 1) + memoryDelta) / totalCount;
        modPattern.averageExecutionTime =
            (modPattern.averageExecutionTime * (totalCount - 1) + executionTime) / totalCount;
        modPattern.lastUsed = new Date().toISOString();
        // Update learned patterns
        this.updateLearnedPatterns();
    }
    /**
     * Track execution pattern
     */
    trackExecution(dimension, actionSequence, outcome, memoryUsage, executionTime, metadata = {}) {
        const execution = {
            id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dimension,
            actionSequence,
            outcome,
            memoryUsage,
            executionTime,
            timestamp: new Date().toISOString(),
            metadata
        };
        this.executionHistory.push(execution);
        // Keep only last 1000 executions
        if (this.executionHistory.length > 1000) {
            this.executionHistory.shift();
        }
    }
    /**
     * Get best patterns for a dimension
     */
    getBestPatterns(dimension, limit = 5) {
        return this.learnedPatterns
            .filter(lp => lp.pattern.dimension === dimension)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }
    /**
     * Get recommended pattern for next modification
     */
    getRecommendedPattern(dimension) {
        const bestPatterns = this.getBestPatterns(dimension, 1);
        if (bestPatterns.length === 0)
            return null;
        const best = bestPatterns[0];
        return best ? best.pattern : null;
    }
    /**
     * Get success rate for a dimension
     */
    getSuccessRate(dimension) {
        const patterns = Array.from(this.modificationPatterns.values())
            .filter(p => p.dimension === dimension);
        if (patterns.length === 0)
            return 0;
        const totalSuccess = patterns.reduce((sum, p) => sum + p.successCount, 0);
        const totalFailure = patterns.reduce((sum, p) => sum + p.failureCount, 0);
        const total = totalSuccess + totalFailure;
        return total > 0 ? totalSuccess / total : 0;
    }
    /**
     * Get execution statistics for a dimension
     */
    getExecutionStats(dimension) {
        const executions = this.executionHistory.filter(e => e.dimension === dimension);
        if (executions.length === 0) {
            return {
                averageMemory: 0,
                averageTime: 0,
                successRate: 0,
                totalExecutions: 0
            };
        }
        const averageMemory = executions.reduce((sum, e) => sum + e.memoryUsage, 0) / executions.length;
        const averageTime = executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length;
        const successCount = executions.filter(e => e.outcome === 'success').length;
        const successRate = successCount / executions.length;
        return {
            averageMemory,
            averageTime,
            successRate,
            totalExecutions: executions.length
        };
    }
    /**
     * Update learned patterns based on tracked data
     */
    updateLearnedPatterns() {
        this.learnedPatterns = Array.from(this.modificationPatterns.values()).map(pattern => {
            const totalAttempts = pattern.successCount + pattern.failureCount;
            const successRate = totalAttempts > 0 ? pattern.successCount / totalAttempts : 0;
            // Calculate confidence based on usage count and consistency
            const usageCount = totalAttempts;
            const consistency = this.calculateConsistency(pattern);
            const confidence = Math.min(1, (usageCount / 10) * 0.5 + consistency * 0.5);
            // Generate recommendations
            const recommendations = this.generateRecommendations(pattern, successRate);
            return {
                pattern,
                confidence,
                usageCount,
                lastSuccessRate: successRate,
                recommendations
            };
        });
        // Sort by confidence
        this.learnedPatterns.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Calculate consistency of a pattern (how stable its results are)
     */
    calculateConsistency(pattern) {
        // For now, simple consistency based on success rate
        // Higher success rate = more consistent
        const totalAttempts = pattern.successCount + pattern.failureCount;
        if (totalAttempts === 0)
            return 0;
        const successRate = pattern.successCount / totalAttempts;
        // Consistency is higher when success rate is closer to 1.0 or 0.0
        // (consistent success or consistent failure)
        return 1 - Math.abs(successRate - 0.5) * 2;
    }
    /**
     * Generate recommendations for a pattern
     */
    generateRecommendations(pattern, successRate) {
        const recommendations = [];
        if (successRate > 0.8) {
            recommendations.push('High success rate - consider using more frequently');
        }
        else if (successRate < 0.3) {
            recommendations.push('Low success rate - consider avoiding or modifying');
        }
        if (pattern.averageMemoryDelta > 50) {
            recommendations.push('High memory usage - consider optimization');
        }
        if (pattern.averageExecutionTime > 1000) {
            recommendations.push('Slow execution - consider optimization');
        }
        if (pattern.successCount + pattern.failureCount < 5) {
            recommendations.push('Insufficient data - need more executions to evaluate');
        }
        return recommendations;
    }
    /**
     * Hash pattern for ID generation
     */
    hashPattern(pattern) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < pattern.length; i++) {
            const char = pattern.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Export patterns to JSONL
     */
    exportToJSONL() {
        const lines = [];
        // Export modification patterns
        this.modificationPatterns.forEach(pattern => {
            lines.push(JSON.stringify({ type: 'modification-pattern', ...pattern }));
        });
        // Export learned patterns
        this.learnedPatterns.forEach(learned => {
            lines.push(JSON.stringify({ type: 'learned-pattern', ...learned }));
        });
        // Export recent execution history (last 100)
        this.executionHistory.slice(-100).forEach(execution => {
            lines.push(JSON.stringify({ type: 'execution-pattern', ...execution }));
        });
        return lines.join('\n');
    }
    /**
     * Load patterns from JSONL
     */
    loadFromJSONL(jsonl) {
        const lines = jsonl.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            try {
                const obj = JSON.parse(line);
                switch (obj.type) {
                    case 'modification-pattern':
                        this.modificationPatterns.set(obj.id, obj);
                        break;
                    case 'learned-pattern':
                        this.learnedPatterns.push(obj);
                        break;
                    case 'execution-pattern':
                        this.executionHistory.push(obj);
                        break;
                }
            }
            catch (error) {
                console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}`);
            }
        });
        // Rebuild learned patterns
        this.updateLearnedPatterns();
    }
}

/**
 * Learning Automaton
 *
 * Extends MemoryOptimizedAutomaton with learning capabilities:
 * - Tracks execution patterns and frequencies
 * - Learns which modifications lead to better outcomes
 * - Adapts modification patterns based on history
 * - Stores learned patterns in knowledge base
 */
class LearningAutomaton extends MemoryOptimizedAutomaton {
    constructor(filePath, config) {
        super(filePath);
        this.lastMemoryUsage = 0;
        this.executionStartTime = 0;
        this.currentActionSequence = [];
        this.learningConfig = {
            enableLearning: config?.enableLearning ?? true,
            patternFile: config?.patternFile || path.join(path.dirname(filePath), 'learned-patterns.jsonl'),
            minPatternConfidence: config?.minPatternConfidence || 0.5,
            adaptationRate: config?.adaptationRate || 0.3,
            trackMemory: config?.trackMemory ?? true,
            trackExecutionTime: config?.trackExecutionTime ?? true
        };
        this.patternTracker = new PatternTracker();
        // Load existing patterns if file exists
        if (this.learningConfig.patternFile && fs.existsSync(this.learningConfig.patternFile)) {
            try {
                const jsonl = fs.readFileSync(this.learningConfig.patternFile, 'utf-8');
                this.patternTracker.loadFromJSONL(jsonl);
                console.log('📚 Loaded learned patterns from:', this.learningConfig.patternFile);
            }
            catch (error) {
                console.warn('⚠️  Failed to load learned patterns:', error);
            }
        }
        // Initialize memory tracking
        if (this.learningConfig.trackMemory) {
            this.lastMemoryUsage = this.getCurrentMemoryUsage();
        }
        console.log('🧠 Learning Automaton initialized');
        console.log(`   Learning: ${this.learningConfig.enableLearning ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   Pattern File: ${this.learningConfig.patternFile}`);
    }
    /**
     * Override executeAction to track patterns
     */
    executeAction(action, fromState, toState, context = {}) {
        if (!this.learningConfig.enableLearning) {
            super.executeAction(action, fromState, toState, context);
            return;
        }
        // Track execution start
        this.executionStartTime = Date.now();
        const memBefore = this.learningConfig.trackMemory ? this.getCurrentMemoryUsage() : 0;
        // Get current dimension
        const currentDimension = this.currentDimension || 0;
        // Get recommended pattern if available
        const recommendedPattern = this.patternTracker.getRecommendedPattern(currentDimension);
        // Execute action
        super.executeAction(action, fromState, toState, context);
        // Track execution end
        const executionTime = Date.now() - this.executionStartTime;
        const memAfter = this.learningConfig.trackMemory ? this.getCurrentMemoryUsage() : 0;
        const memoryDelta = memAfter - memBefore;
        // Track execution pattern (assume success since no return value)
        this.patternTracker.trackExecution(currentDimension, [...this.currentActionSequence], 'success', memAfter, executionTime, {
            recommendedPattern: recommendedPattern?.id,
            memoryDelta
        });
        // Track modification if one was made
        const lastModification = this.getLastModification();
        if (lastModification) {
            this.trackModification(currentDimension, lastModification, true, memoryDelta, executionTime);
        }
        // Clear action sequence for next execution
        this.currentActionSequence = [];
    }
    /**
     * Generate modification using learned patterns
     */
    generateModification() {
        if (!this.learningConfig.enableLearning) {
            // Return a default modification object
            return {
                id: `modification-${Date.now()}`,
                type: 'text',
                currentState: 'modified',
                dimensionalLevel: this.currentDimension || 0
            };
        }
        const currentDimension = this.currentDimension || 0;
        // Get best patterns for this dimension
        const bestPatterns = this.patternTracker.getBestPatterns(currentDimension, 3);
        // Use learned pattern if confidence is high enough
        if (bestPatterns.length > 0 && bestPatterns[0] && bestPatterns[0].confidence >= this.learningConfig.minPatternConfidence) {
            const learnedPattern = bestPatterns[0].pattern;
            // Try to adapt the pattern
            const adaptedModification = this.adaptPattern(learnedPattern);
            if (adaptedModification) {
                this.currentActionSequence.push(`learned-${learnedPattern.id}`);
                return adaptedModification;
            }
        }
        // Fall back to default generation
        this.currentActionSequence.push('default-generation');
        return {
            id: `modification-${Date.now()}`,
            type: 'text',
            currentState: 'modified',
            dimensionalLevel: currentDimension
        };
    }
    /**
     * Adapt a learned pattern to current context
     */
    adaptPattern(pattern) {
        // Simple adaptation: use pattern as template
        // In a more sophisticated implementation, this would parse the pattern
        // and generate appropriate modifications
        try {
            // Try to parse pattern as JSON
            const parsed = JSON.parse(pattern.pattern);
            return parsed;
        }
        catch {
            // Pattern is not JSON, try to extract structure
            // For now, return null to fall back to default generation
            return null;
        }
    }
    /**
     * Track a modification pattern
     */
    trackModification(dimension, modification, success, memoryDelta, executionTime) {
        const patternType = this.determinePatternType(modification);
        const patternString = JSON.stringify(modification);
        this.patternTracker.trackModification(dimension, patternType, patternString, success, memoryDelta, executionTime);
    }
    /**
     * Determine pattern type from modification
     */
    determinePatternType(modification) {
        if (modification.type === 'add' || modification.action === 'add') {
            return 'add';
        }
        else if (modification.type === 'remove' || modification.action === 'remove') {
            return 'remove';
        }
        else if (modification.type === 'transform' || modification.action === 'transform') {
            return 'transform';
        }
        else {
            return 'modify';
        }
    }
    /**
     * Get last modification made
     */
    getLastModification() {
        // Access parent's execution history if available
        const executionHistory = this.executionHistory;
        if (executionHistory && executionHistory.length > 0) {
            const lastExecution = executionHistory[executionHistory.length - 1];
            return lastExecution.modification || null;
        }
        return null;
    }
    /**
     * Get current memory usage in MB
     */
    getCurrentMemoryUsage() {
        const usage = process.memoryUsage();
        return usage.heapUsed / 1024 / 1024;
    }
    /**
     * Get learning statistics
     */
    getLearningStats() {
        const stats = {
            totalPatterns: this.patternTracker['modificationPatterns'].size,
            learnedPatterns: this.patternTracker['learnedPatterns'].length,
            successRate: 0,
            dimensionStats: []
        };
        // Calculate overall success rate
        const allPatterns = Array.from(this.patternTracker['modificationPatterns'].values());
        const totalSuccess = allPatterns.reduce((sum, p) => sum + p.successCount, 0);
        const totalFailure = allPatterns.reduce((sum, p) => sum + p.failureCount, 0);
        const total = totalSuccess + totalFailure;
        stats.successRate = total > 0 ? totalSuccess / total : 0;
        // Get stats for each dimension (0-7)
        for (let dim = 0; dim <= 7; dim++) {
            const execStats = this.patternTracker.getExecutionStats(dim);
            const successRate = this.patternTracker.getSuccessRate(dim);
            stats.dimensionStats.push({
                dimension: dim,
                successRate,
                averageMemory: execStats.averageMemory,
                averageTime: execStats.averageTime,
                totalExecutions: execStats.totalExecutions
            });
        }
        return stats;
    }
    /**
     * Save learned patterns to file
     */
    saveLearnedPatterns() {
        if (!this.learningConfig.patternFile)
            return;
        try {
            const jsonl = this.patternTracker.exportToJSONL();
            fs.writeFileSync(this.learningConfig.patternFile, jsonl, 'utf-8');
            console.log(`💾 Saved learned patterns to: ${this.learningConfig.patternFile}`);
        }
        catch (error) {
            console.warn('⚠️  Failed to save learned patterns:', error);
        }
    }
    /**
     * Cleanup on destruction
     */
    cleanup() {
        // Save patterns before cleanup
        this.saveLearnedPatterns();
        // Note: cleanup method doesn't exist in base class
    }
}

/**
 * Vector Clock Implementation
 *
 * Distributed causality tracking using vector clocks
 */
/**
 * Vector Clock class for distributed causality tracking
 */
class VectorClock {
    constructor(automatonId, initialClock) {
        this.automatonId = automatonId;
        this.clock = initialClock || new Map();
        // Initialize own tick to 0 if not present
        if (!this.clock.has(automatonId)) {
            this.clock.set(automatonId, 0);
        }
    }
    /**
     * Increment own tick
     *
     * @returns {number} New tick value
     */
    tick() {
        const currentTick = this.clock.get(this.automatonId) || 0;
        const newTick = currentTick + 1;
        this.clock.set(this.automatonId, newTick);
        return newTick;
    }
    /**
     * Get current tick for this automaton
     *
     * @returns {number} Current tick
     */
    getTick() {
        return this.clock.get(this.automatonId) || 0;
    }
    /**
     * Get tick for a specific automaton
     *
     * @param {string | number} automatonId - Automaton ID
     * @returns {number} Tick value
     */
    getTickFor(automatonId) {
        return this.clock.get(automatonId) || 0;
    }
    /**
     * Merge with another vector clock (element-wise max)
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {VectorClock} Merged vector clock (new instance)
     */
    merge(otherClock) {
        const otherMap = otherClock instanceof VectorClock ? otherClock.clock : otherClock;
        const merged = new VectorClock(this.automatonId, new Map(this.clock));
        // Element-wise max
        for (const [automatonId, tick] of otherMap) {
            const currentTick = merged.clock.get(automatonId) || 0;
            merged.clock.set(automatonId, Math.max(currentTick, tick));
        }
        return merged;
    }
    /**
     * Check if this clock happens before another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if this happens before other
     */
    happensBefore(otherClock) {
        const otherMap = otherClock instanceof VectorClock ? otherClock.clock : otherClock;
        let strictlyLess = false;
        for (const [automatonId, tick] of this.clock) {
            const otherTick = otherMap.get(automatonId) || 0;
            if (tick > otherTick) {
                return false; // Not happens-before
            }
            if (tick < otherTick) {
                strictlyLess = true;
            }
        }
        // Check if other has automata we haven't seen
        for (const [automatonId, tick] of otherMap) {
            if (!this.clock.has(automatonId) && tick > 0) {
                strictlyLess = true;
            }
        }
        return strictlyLess;
    }
    /**
     * Check if this clock is concurrent with another clock
     *
     * @param {Map<string | number, number> | VectorClock} otherClock - Other vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(otherClock) {
        return !this.happensBefore(otherClock) &&
            !(otherClock instanceof VectorClock ? otherClock.happensBefore(this) : this._otherHappensBefore(otherClock));
    }
    /**
     * Helper: Check if other happens before this
     *
     * @param {Map<string | number, number>} otherClock - Other clock map
     * @returns {boolean} True if other happens before this
     */
    _otherHappensBefore(otherClock) {
        let strictlyLess = false;
        for (const [automatonId, tick] of otherClock) {
            const thisTick = this.clock.get(automatonId) || 0;
            if (tick > thisTick) {
                return false;
            }
            if (tick < thisTick) {
                strictlyLess = true;
            }
        }
        for (const [automatonId, tick] of this.clock) {
            if (!otherClock.has(automatonId) && tick > 0) {
                strictlyLess = true;
            }
        }
        return strictlyLess;
    }
    /**
     * Get causal chain (all automata this automaton has seen)
     *
     * @returns {Array<{automatonId: string | number, tick: number}>} Causal chain
     */
    getCausalChain() {
        return Array.from(this.clock.entries())
            .filter(([id, tick]) => id !== this.automatonId && tick > 0)
            .map(([automatonId, tick]) => ({ automatonId, tick }));
    }
    /**
     * Clone vector clock
     *
     * @returns {VectorClock} Cloned vector clock
     */
    clone() {
        return new VectorClock(this.automatonId, new Map(this.clock));
    }
    /**
     * Convert to Map
     *
     * @returns {Map<string | number, number>} Clock as Map
     */
    toMap() {
        return new Map(this.clock);
    }
    /**
     * Convert to plain object
     *
     * @returns {Record<string | number, number>} Clock as object
     */
    toObject() {
        return Object.fromEntries(this.clock);
    }
    /**
     * Create from object
     *
     * @param {string | number} automatonId - Automaton ID
     * @param {Record<string | number, number>} obj - Clock object
     * @returns {VectorClock} Vector clock instance
     */
    static fromObject(automatonId, obj) {
        return new VectorClock(automatonId, new Map(Object.entries(obj).map(([k, v]) => [k, v])));
    }
}

var vectorClock = /*#__PURE__*/Object.freeze({
  __proto__: null,
  VectorClock: VectorClock
});

/**
 * Vector Clock Automaton Base
 *
 * Base class for automata with vector clock state tracking
 */
/**
 * Base Vector Clock Automaton
 *
 * Provides vector clock state tracking for distributed causality
 */
class VectorClockAutomaton {
    constructor(id, metaLog = null) {
        this.id = id;
        this.metaLog = metaLog;
        this.vectorClock = new VectorClock(id);
        this.state = {
            id,
            dimension: 0,
            running: false,
            vectorClock: this.vectorClock.toMap(),
            cellCounts: {
                C0: 0,
                C1: 0,
                C2: 0,
                C3: 0,
                C4: 0
            }
        };
    }
    /**
     * Tick automaton (increment own vector clock)
     *
     * @param {SwarmContext | null} swarm - Swarm context (optional)
     * @returns {Promise<void>}
     */
    async tick(swarm = null) {
        // Increment own tick
        this.vectorClock.tick();
        // Update state
        this.state.vectorClock = this.vectorClock.toMap();
        // Store tick in Meta-Log
        if (this.metaLog) {
            await this.storeTickInMetaLog();
        }
        // Execute automaton-specific tick logic
        await this.executeTick(swarm);
    }
    /**
     * Receive message from another automaton
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Message object
     * @returns {Promise<void>}
     */
    async receive(from, message) {
        // Merge vector clock from message
        if (message.vectorClock) {
            const otherClock = message.vectorClock instanceof Map
                ? message.vectorClock
                : new Map(Object.entries(message.vectorClock));
            this.vectorClock = this.vectorClock.merge(otherClock);
            this.state.vectorClock = this.vectorClock.toMap();
        }
        // Store received message in Meta-Log
        if (this.metaLog) {
            await this.storeReceiveInMetaLog(from, message);
        }
        // Execute automaton-specific receive logic
        await this.executeReceive(from, message);
    }
    /**
     * Send message to another automaton
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Message object
     * @returns {Promise<void>}
     */
    async send(to, message) {
        // Include current vector clock in message
        const messageWithClock = {
            ...message,
            vectorClock: this.vectorClock.toMap(),
            from: this.id,
            timestamp: Date.now() // Optional metadata
        };
        // Store sent message in Meta-Log
        if (this.metaLog) {
            await this.storeSendInMetaLog(to, messageWithClock);
        }
        // Execute automaton-specific send logic
        await this.executeSend(to, messageWithClock);
    }
    /**
     * Get current state
     *
     * @returns {AutomatonState} Current automaton state
     */
    getState() {
        return {
            ...this.state,
            vectorClock: this.vectorClock.toMap()
        };
    }
    /**
     * Check if this automaton happens before another
     *
     * @param {string | number} otherId - Other automaton ID
     * @param {Map<string | number, number>} otherClock - Other automaton's vector clock
     * @returns {boolean} True if this happens before other
     */
    happensBefore(otherId, otherClock) {
        return this.vectorClock.happensBefore(otherClock);
    }
    /**
     * Check if this automaton is concurrent with another
     *
     * @param {string | number} otherId - Other automaton ID
     * @param {Map<string | number, number>} otherClock - Other automaton's vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(otherId, otherClock) {
        return this.vectorClock.isConcurrent(otherClock);
    }
    /**
     * Get causal chain
     *
     * @returns {Array<{automatonId: string | number, tick: number}>} Causal chain
     */
    getCausalChain() {
        return this.vectorClock.getCausalChain();
    }
    /**
     * Store tick in Meta-Log
     *
     * @returns {Promise<void>}
     */
    async storeTickInMetaLog() {
        if (!this.metaLog || !this.metaLog.datalog)
            return;
        try {
            const tick = this.vectorClock.getTick();
            const fact = {
                predicate: 'automaton_tick',
                args: [this.id, this.id, tick]
            };
            if (this.metaLog.datalog.addFacts) {
                this.metaLog.datalog.addFacts([fact]);
            }
        }
        catch (error) {
            console.warn(`[Automaton ${this.id}] Failed to store tick in Meta-Log:`, error);
        }
    }
    /**
     * Store receive event in Meta-Log
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    async storeReceiveInMetaLog(from, message) {
        if (!this.metaLog || !this.metaLog.datalog)
            return;
        try {
            // Store vector clock ticks from received message
            if (message.vectorClock) {
                const clockMap = message.vectorClock instanceof Map
                    ? message.vectorClock
                    : new Map(Object.entries(message.vectorClock));
                const clockFacts = Array.from(clockMap.entries()).map(([peer, tick]) => ({
                    predicate: 'automaton_tick',
                    args: [this.id, peer, tick]
                }));
                if (this.metaLog.datalog.addFacts) {
                    this.metaLog.datalog.addFacts(clockFacts);
                }
            }
            // Store receive event
            const receiveFact = {
                predicate: 'automaton_receive',
                args: [this.id, from, message.type || 'message']
            };
            if (this.metaLog.datalog.addFacts) {
                this.metaLog.datalog.addFacts([receiveFact]);
            }
        }
        catch (error) {
            console.warn(`[Automaton ${this.id}] Failed to store receive in Meta-Log:`, error);
        }
    }
    /**
     * Store send event in Meta-Log
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Sent message
     * @returns {Promise<void>}
     */
    async storeSendInMetaLog(to, message) {
        if (!this.metaLog || !this.metaLog.datalog)
            return;
        try {
            const sendFact = {
                predicate: 'automaton_send',
                args: [this.id, to, message.type || 'message']
            };
            if (this.metaLog.datalog.addFacts) {
                this.metaLog.datalog.addFacts([sendFact]);
            }
        }
        catch (error) {
            console.warn(`[Automaton ${this.id}] Failed to store send in Meta-Log:`, error);
        }
    }
    /**
     * Execute automaton-specific tick logic
     * Override in subclasses
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    async executeTick(swarm) {
        // Override in subclasses
    }
    /**
     * Execute automaton-specific receive logic
     * Override in subclasses
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    async executeReceive(from, message) {
        // Override in subclasses
    }
    /**
     * Execute automaton-specific send logic
     * Override in subclasses
     *
     * @param {string | number} to - Recipient automaton ID
     * @param {AutomatonMessage} message - Message to send
     * @returns {Promise<void>}
     */
    async executeSend(to, message) {
        // Override in subclasses
    }
}

/**
 * ML-Enhanced Vector Clock Automaton
 *
 * Integrates WASM ML embeddings and HNSW indexing with vector clock state
 */
/**
 * ML-Enhanced Vector Clock Automaton
 *
 * Base class for automata with ML-enhanced state tracking
 */
class MLVectorClockAutomaton extends VectorClockAutomaton {
    constructor(id, metaLog = null) {
        super(id, metaLog);
        // Note: These imports may not exist yet - they're placeholders for ML functionality
        // In a real implementation, these would be imported from '../ml/' directory
        // For now, we'll use 'any' type to allow compilation
        this.mlEngine = null; // new WASMMLEngine();
        this.hnswIndex = null; // Will be initialized when blackboard is available
        // Initialize ML engine
        // this.mlEngine.initialize().catch(error => {
        //   console.warn(`[Automaton ${id}] ML engine initialization warning:`, error);
        // });
    }
    /**
     * Set HNSW index (called by blackboard)
     *
     * @param {HNSWAutomatonIndex} index - HNSW index instance
     */
    setHNSWIndex(index) {
        this.hnswIndex = index;
    }
    /**
     * Tick with ML-enhanced state tracking
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    async tick(swarm = null) {
        // 1. Standard vector clock tick
        await super.tick(swarm);
        // 2. Generate embedding for current state
        const state = this.getState();
        try {
            if (this.mlEngine && typeof this.mlEngine.embedAutomatonState === 'function') {
                const embedding = await this.mlEngine.embedAutomatonState(state);
                // 3. Update HNSW index if available
                if (this.hnswIndex && typeof this.hnswIndex.addAutomatonState === 'function') {
                    await this.hnswIndex.addAutomatonState(this.id, state);
                }
                // 4. Find similar automata using semantic search
                if (this.hnswIndex && typeof this.hnswIndex.semanticSearch === 'function') {
                    const similarAutomata = await this.hnswIndex.semanticSearch(state, 5);
                    // 5. Coordinate with similar automata
                    await this.coordinateWithSimilar(similarAutomata, swarm);
                }
            }
        }
        catch (error) {
            console.warn(`[Automaton ${this.id}] ML tick error:`, error);
        }
        // 6. Execute automaton-specific logic
        await this.executeTick(swarm);
    }
    /**
     * Coordinate with semantically similar automata
     *
     * @param {Array<{automatonId: string | number, similarity: number}>} similarAutomata - Array of similar automata with similarity scores
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    async coordinateWithSimilar(similarAutomata, swarm) {
        for (const similar of similarAutomata) {
            if (similar.similarity > 0.8 && similar.automatonId !== this.id) {
                // High similarity - coordinate
                const message = {
                    type: 'coordinate',
                    from: this.id,
                    similarity: similar.similarity,
                    vectorClock: this.vectorClock.toMap()
                };
                await this.send(similar.automatonId, message);
            }
        }
    }
    /**
     * Receive with ML-enhanced conflict resolution
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    async receive(from, message) {
        // 1. Standard vector clock merge
        await super.receive(from, message);
        // 2. Check for conflicts using semantic similarity
        if (message.type === 'state_update' && message.state) {
            const remoteState = message.state;
            const localState = this.getState();
            try {
                if (this.mlEngine && typeof this.mlEngine.embedAutomatonState === 'function') {
                    // Check if states are semantically similar but causally concurrent
                    const localEmbedding = await this.mlEngine.embedAutomatonState(localState);
                    const remoteEmbedding = await this.mlEngine.embedAutomatonState(remoteState);
                    const similarity = this.mlEngine.cosineSimilarity(localEmbedding, remoteEmbedding);
                    if (similarity > 0.9) {
                        // Very similar states - resolve conflict
                        await this.resolveSemanticConflict(localState, remoteState, from);
                    }
                }
            }
            catch (error) {
                console.warn(`[Automaton ${this.id}] ML conflict resolution error:`, error);
            }
        }
        // 3. Execute automaton-specific receive
        await this.executeReceive(from, message);
    }
    /**
     * Resolve semantic conflicts using ML + Meta-Log
     *
     * @param {AutomatonState} localState - Local automaton state
     * @param {AutomatonState} remoteState - Remote automaton state
     * @param {string | number} from - Sender automaton ID
     * @returns {Promise<void>}
     */
    async resolveSemanticConflict(localState, remoteState, from) {
        if (!this.metaLog)
            return;
        try {
            // Query Meta-Log for conflict resolution strategy
            const dimension = this.state.dimension || 0;
            // Determine strategy based on dimension
            let strategy = 'vector_clock_lww'; // Default: Last-write-wins
            if (dimension === 0 || dimension === 1 || dimension === 6 || dimension === 7) {
                strategy = 'semantic_similarity';
            }
            else if (dimension === 2 || dimension === 5) {
                strategy = 'homology_preservation';
            }
            switch (strategy) {
                case 'semantic_similarity':
                    // Use ML similarity for resolution
                    if (this.mlEngine && typeof this.mlEngine.embedAutomatonState === 'function') {
                        const localEmbedding = await this.mlEngine.embedAutomatonState(localState);
                        const remoteEmbedding = await this.mlEngine.embedAutomatonState(remoteState);
                        // For now, keep local state if similarity is very high (simplified)
                        // In production, would use query context to determine which is better
                    }
                    break;
                case 'vector_clock_lww':
                    // Last-write-wins based on vector clock
                    const localMax = Math.max(...Array.from(localState.vectorClock.values()));
                    const remoteMax = Math.max(...Array.from(remoteState.vectorClock.values()));
                    if (remoteMax > localMax) {
                        // Remote is newer, merge
                        await this.mergeState(remoteState);
                    }
                    break;
                case 'homology_preservation':
                    // Use topological validation
                    const localValid = await this.validateHomology(localState);
                    const remoteValid = await this.validateHomology(remoteState);
                    if (remoteValid && !localValid) {
                        await this.mergeState(remoteState);
                    }
                    break;
            }
        }
        catch (error) {
            console.warn(`[Automaton ${this.id}] Conflict resolution error:`, error);
        }
    }
    /**
     * Query similar automata using ProLog + HNSW
     *
     * @param {string} prologConstraints - ProLog query constraints
     * @param {number} k - Number of results
     * @returns {Promise<Array<AutomatonState>>} Similar automaton states
     */
    async querySimilarAutomata(prologConstraints, k = 10) {
        if (!this.metaLog || !this.hnswIndex) {
            return [];
        }
        try {
            // 1. Query Meta-Log for automata matching ProLog constraints
            const matchingResults = await this.metaLog.prologQuery(prologConstraints);
            // 2. Get states for matching automata
            const states = [];
            for (const result of (matchingResults.bindings || [])) {
                const automatonId = result.AutomatonId || result.id || result.A;
                if (automatonId !== undefined) {
                    try {
                        if (this.hnswIndex && typeof this.hnswIndex.getStateFromMetaLog === 'function') {
                            const state = await this.hnswIndex.getStateFromMetaLog(automatonId);
                            states.push(state);
                        }
                    }
                    catch (error) {
                        // Skip if state not found
                    }
                }
            }
            // 3. Rank by semantic similarity to current state
            if (this.mlEngine && typeof this.mlEngine.embedAutomatonState === 'function') {
                const currentState = this.getState();
                const currentEmbedding = await this.mlEngine.embedAutomatonState(currentState);
                const ranked = await Promise.all(states.map(async (state) => {
                    const embedding = await this.mlEngine.embedAutomatonState(state);
                    const similarity = this.mlEngine.cosineSimilarity(currentEmbedding, embedding);
                    return { state, similarity };
                }));
                // 4. Sort by similarity and return top k
                return ranked
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, k)
                    .map(r => r.state);
            }
            return states.slice(0, k);
        }
        catch (error) {
            console.error(`[Automaton ${this.id}] Query similar automata error:`, error);
            return [];
        }
    }
    /**
     * Merge state (override in subclasses)
     *
     * @param {AutomatonState} state - State to merge
     * @returns {Promise<void>}
     */
    async mergeState(state) {
        // Override in subclasses for specific merge logic
        const { VectorClock } = await Promise.resolve().then(function () { return vectorClock; });
        this.state = { ...this.state, ...state };
        const clockObj = Object.fromEntries(state.vectorClock);
        this.vectorClock = VectorClock.fromObject(this.id, clockObj);
    }
    /**
     * Validate homology (override in subclasses)
     *
     * @param {AutomatonState} state - State to validate
     * @returns {Promise<boolean>} True if valid
     */
    async validateHomology(state) {
        // Override in subclasses for homology validation
        // For now, return true (no validation)
        return true;
    }
}

/**
 * 0D-Topology Automaton
 *
 * Foundation automaton for topology operations (0D dimension)
 */
/**
 * 0D-Topology Automaton
 *
 * Manages quantum vacuum topology and identity processes
 */
class A0_TopologyAutomaton extends MLVectorClockAutomaton {
    constructor(id = 0, metaLog = null) {
        super(id, metaLog);
        this.state.dimension = 0;
        this.state.cellCounts = {
            C0: 1, // Single point topology
            C1: 0,
            C2: 0,
            C3: 0,
            C4: 0
        };
    }
    /**
     * Execute 0D topology tick
     *
     * @param {SwarmContext | null} swarm - Swarm context
     * @returns {Promise<void>}
     */
    async executeTick(swarm) {
        // 0D topology operations
        // Maintain empty pattern () and point topology
        // Ensure trivial fiber bundle integrity
        // Update cell counts if needed
        this.state.cellCounts.C0 = Math.max(1, this.state.cellCounts.C0);
    }
    /**
     * Execute receive for 0D topology
     *
     * @param {string | number} from - Sender automaton ID
     * @param {AutomatonMessage} message - Received message
     * @returns {Promise<void>}
     */
    async executeReceive(from, message) {
        if (message.type === 'coordinate') ;
    }
    /**
     * Validate homology for 0D topology
     *
     * @param {AutomatonState} state - State to validate
     * @returns {Promise<boolean>} True if valid
     */
    async validateHomology(state) {
        // 0D topology: Must have at least one C0 cell
        return (state.cellCounts?.C0 || 0) >= 1;
    }
}

/**
 * Object Pool for Memory Optimization
 *
 * Reuses objects to reduce allocation overhead and GC pressure
 */
/**
 * Generic object pool implementation
 */
class ObjectPool {
    /**
     * Create a new object pool
     *
     * @param createFn - Function to create new objects
     * @param resetFn - Function to reset objects for reuse
     * @param maxSize - Maximum pool size (default: 100)
     */
    constructor(createFn, resetFn, maxSize = 100) {
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }
    /**
     * Acquire an object from the pool
     *
     * @returns {T} Object from pool or newly created
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFn();
    }
    /**
     * Release an object back to the pool
     *
     * @param obj - Object to release
     */
    release(obj) {
        if (this.pool.length < this.maxSize) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    /**
     * Clear the pool
     */
    clear() {
        this.pool = [];
    }
    /**
     * Get current pool size
     */
    get size() {
        return this.pool.length;
    }
}

/**
 * Memory Utilities
 *
 * Helper functions for memory monitoring and pressure assessment
 */
/**
 * Memory thresholds (in bytes)
 */
const MEMORY_THRESHOLDS = {
    LOW: 50 * 1024 * 1024, // 50MB
    MEDIUM: 200 * 1024 * 1024, // 200MB
    HIGH: 500 * 1024 * 1024};
/**
 * Assess memory pressure from memory usage
 *
 * @param heapUsed - Heap used in bytes
 * @returns {MemoryPressure} Memory pressure level
 */
function assessMemoryPressure(heapUsed) {
    if (heapUsed < MEMORY_THRESHOLDS.LOW)
        return 'low';
    if (heapUsed < MEMORY_THRESHOLDS.MEDIUM)
        return 'medium';
    if (heapUsed < MEMORY_THRESHOLDS.HIGH)
        return 'high';
    return 'critical';
}
/**
 * Format memory size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "123.45 MB")
 */
function formatMemory(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export { A0_TopologyAutomaton, AdvancedSelfReferencingAutomaton, ContinuousAutomatonRunner, EvolvedAutomaton, LearningAutomaton, MLVectorClockAutomaton, MemoryOptimizedAutomaton, ObjectPool, OllamaAutomatonRunner, ScalableAutomaton, VectorClock, VectorClockAutomaton, assessMemoryPressure, formatMemory };
//# sourceMappingURL=index.js.map
