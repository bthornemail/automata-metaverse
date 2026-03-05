import { readFileSync, writeFileSync, existsSync } from 'fs';
// Note: global.gc is already declared by @types/node as NodeJS.GCFunction | undefined
// Memory pool for CanvasObject reuse to reduce memory volatility
class ObjectPool {
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
}
class SelfReferencingAutomaton {
    constructor(filePath) {
        this.objects = [];
        this.currentLine = 0;
        this.executionHistory = [];
        this.MAX_EXECUTION_HISTORY = 1000; // Limit history to prevent memory leaks
        // Memory pool for object reuse
        this.objectPool = new ObjectPool(() => ({ id: '', type: '', currentState: '', dimensionalLevel: 0 }), (obj) => {
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
        this.load();
    }
    // Cleanup method for memory management
    cleanup() {
        // Trim execution history
        if (this.executionHistory.length > this.MAX_EXECUTION_HISTORY) {
            this.executionHistory = this.executionHistory.slice(-this.MAX_EXECUTION_HISTORY);
        }
        // Trigger GC if available
        if (global.gc) {
            global.gc();
        }
        // Clear object pool if needed
        // (Keep pool for reuse, but can clear if memory pressure is high)
    }
    load() {
        if (!existsSync(this.filePath)) {
            throw new Error(`Automaton file not found: ${this.filePath}`);
        }
        const content = readFileSync(this.filePath, 'utf-8');
        const lines = content.trim().split('\n');
        this.objects = [];
        // Map: ID -> { obj, provenanceHistory, seenInFiles }
        const seenIds = new Map();
        let duplicateCount = 0;
        let provenanceMergedCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
                try {
                    const obj = JSON.parse(line);
                    if (obj && typeof obj === 'object') {
                        if (obj.id) {
                            const currentFile = obj.selfReference?.file || this.filePath;
                            const currentProvenance = obj.selfReference
                                ? { file: obj.selfReference.file, line: obj.selfReference.line, pattern: obj.selfReference.pattern }
                                : { file: this.filePath, line: i + 1 };
                            if (seenIds.has(obj.id)) {
                                const existing = seenIds.get(obj.id);
                                const existingFile = existing.obj.selfReference?.file || this.filePath;
                                // Check if this is a cross-file duplicate (federated provenance)
                                if (currentFile !== existingFile && currentFile !== this.filePath && existingFile !== this.filePath) {
                                    // Cross-file duplicate: preserve both for federated provenance
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
                                    this.objects.push(obj);
                                    provenanceMergedCount++;
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
                            this.objects.push(obj);
                        }
                        else if (!seenIds.has(obj.id)) {
                            this.objects.push(obj);
                        }
                        else {
                            const existing = seenIds.get(obj.id);
                            const existingIndex = this.objects.findIndex(o => o.id === obj.id);
                            if (existingIndex < 0) {
                                this.objects.push(existing.obj);
                            }
                            else if (existing.seenInFiles.size > 1) {
                                this.objects.push(obj);
                            }
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to parse line ${i + 1}: ${line}`);
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
                    continue;
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
    getAutomataByDimension(level) {
        return this.objects.filter(obj => obj.type === 'automaton' &&
            obj.dimensionalLevel === level);
    }
    getCurrentAutomaton() {
        const automata = this.getAutomataByDimension(this.currentLine % 8);
        return automata.length > 0 ? automata[0] : null;
    }
    getTransitionsFrom(automatonId) {
        return this.objects.filter(obj => obj.type === 'transition' &&
            obj.from === automatonId);
    }
    evaluateCondition(condition) {
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
    executeAction(action, fromState, toState) {
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
        // Periodic cleanup
        if (this.executionHistory.length % 100 === 0) {
            this.cleanup();
        }
    }
    executeSelfReference() {
        const currentAutomaton = this.getCurrentAutomaton();
        if (currentAutomaton && currentAutomaton.selfReference) {
            console.log(`Self-reference to line ${currentAutomaton.selfReference.line}: ${currentAutomaton.selfReference.pattern}`);
        }
    }
    executeEvolution() {
        this.currentLine = (this.currentLine + 1) % this.objects.length;
        // Reduced verbosity - only log evolution in verbose mode
        if (process.env.VERBOSE === 'true') {
            console.log(`Evolved to line ${this.currentLine}`);
        }
    }
    executeSelfModification() {
        // Add a new self-reference object
        const newSelfRef = {
            id: `self-ref-modified-${Date.now()}`,
            type: 'file',
            file: this.filePath,
            text: `Self-Reference: Modified at line ${this.currentLine}`,
            x: Math.random() * 1000,
            y: Math.random() * 1000
        };
        this.objects.push(newSelfRef);
        // Reduced verbosity - only log in verbose mode
        if (process.env.VERBOSE === 'true') {
            console.log(`Added self-modification reference: ${newSelfRef.id}`);
        }
    }
    executeComposition() {
        // Compose two automata states
        const automata = this.getAutomataByDimension(0);
        if (automata.length >= 2) {
            console.log(`Composed automata: ${automata[0].id} + ${automata[1].id}`);
        }
    }
    executeSelfIO() {
        // Read and write to self
        this.load();
        console.log(`Performed self-I/O: read ${this.objects.length} objects`);
    }
    executeSelfValidation() {
        // Validate SHACL constraints
        const automata = this.objects.filter(obj => obj.type === 'automaton');
        const validAutomata = automata.filter(obj => {
            const auto = obj;
            return auto.selfReference && auto.dimensionalLevel >= 0 && auto.dimensionalLevel <= 7;
        });
        console.log(`Validated ${validAutomata.length}/${automata.length} automata`);
    }
    executeSelfTraining() {
        // Learn from execution history
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
        // Observe own state
        const currentAutomaton = this.getCurrentAutomaton();
        if (currentAutomaton) {
            console.log(`Self-observation: Currently at ${currentAutomaton.currentState} (dimension ${currentAutomaton.dimensionalLevel})`);
        }
        // Collapse back to 0D
        this.currentLine = 0;
    }
    step() {
        const currentAutomaton = this.getCurrentAutomaton();
        if (!currentAutomaton) {
            console.log('No current automaton found');
            return;
        }
        // Find transitions from current automaton
        const transitions = this.getTransitionsFrom(currentAutomaton.id);
        // Also check for vertical transitions to next dimension
        const verticalTransitions = this.objects.filter(obj => obj.type === 'vertical' &&
            obj.fromNode === currentAutomaton.id);
        const allTransitions = [...transitions, ...verticalTransitions];
        if (allTransitions.length === 0) {
            console.log(`No transitions from ${currentAutomaton.id}`);
            return;
        }
        // Execute first valid transition
        for (const transition of allTransitions) {
            const condition = transition.condition || 'true';
            if (this.evaluateCondition(condition)) {
                const action = transition.action || 'evolve';
                const fromId = transition.from || transition.fromNode;
                const toId = transition.to || transition.toNode;
                this.executeAction(action, fromId, toId);
                // Update current line based on target dimension
                const targetAutomaton = this.objects.find(obj => obj.id === toId);
                if (targetAutomaton) {
                    this.currentLine = targetAutomaton.dimensionalLevel;
                    console.log(`Transitioned to dimension ${targetAutomaton.dimensionalLevel}: ${targetAutomaton.id}`);
                }
                break;
            }
        }
    }
    run(steps = 10) {
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
    printState() {
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
    getSelfReferences() {
        return this.objects.filter(obj => obj.type === 'file' &&
            obj.file === this.filePath);
    }
    analyzeSelfReference() {
        const selfRefs = this.getSelfReferences();
        const automata = this.objects.filter(obj => obj.type === 'automaton');
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
        const consistentRefs = automata.filter(auto => selfRefs.some(ref => ref.id.includes(`line-${auto.selfReference.line}`)));
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
//# sourceMappingURL=automaton-runner.js.map