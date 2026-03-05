import { AdvancedSelfReferencingAutomaton } from './advanced-automaton.js';
import { MetaLogDb } from 'meta-log-db';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import * as http from 'http';
import * as path from 'path';
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
export { OllamaAutomatonRunner };
//# sourceMappingURL=ollama-automaton.js.map