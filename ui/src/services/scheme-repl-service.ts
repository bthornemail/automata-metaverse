/**
 * Pure Scheme/R5RS REPL Service
 * Processes automaton data line-by-line using pure R5RS functions
 * No JSONL parsing - pure S-expressions
 */

export interface SchemeREPLResult {
  success: boolean;
  result?: any;
  error?: string;
  output?: string[];
}

export interface SchemeREPLService {
  evaluate(expression: string): Promise<SchemeREPLResult>;
  evaluateLine(line: string, context?: any): Promise<SchemeREPLResult>;
  processAutomatonLine(line: string): Promise<SchemeREPLResult>;
  loadR5RSFunctions(): Promise<void>;
}

class SchemeREPLServiceImpl implements SchemeREPLService {
  private r5rsFunctions: Map<string, Function> = new Map();
  private context: any = {};
  private outputBuffer: string[] = [];

  /**
   * Load R5RS functions from the engine
   */
  async loadR5RSFunctions(): Promise<void> {
    try {
      // Load R5RS functions trie
      const response = await fetch('/jsonl/r5rs-functions-trie.jsonl');
      if (response.ok) {
        const text = await response.text();
        // Ensure text is a string before splitting
        if (typeof text !== 'string') {
          console.error('evaluate: text is not a string:', typeof text, text);
          return {
            success: false,
            error: `Expected string input, got ${typeof text}`
          };
        }
        const lines = text.trim().split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.id && entry.function) {
              // Register function for REPL use
              this.r5rsFunctions.set(entry.id, this.createSchemeFunction(entry));
            }
          } catch (e) {
            // Skip invalid lines
          }
        }
      }
    } catch (error) {
      console.warn('Could not load R5RS functions:', error);
    }
  }

  /**
   * Create a Scheme function wrapper from JSONL entry
   */
  private createSchemeFunction(entry: any): Function {
    return (...args: any[]) => {
      // Pure function evaluation - no side effects
      return {
        id: entry.id,
        type: entry.type,
        result: entry.function ? this.evaluateFunction(entry.function, args) : entry,
        metadata: entry.metadata || {}
      };
    };
  }

  /**
   * Evaluate a function call
   */
  private evaluateFunction(funcName: string, args: any[]): any {
    // Map common R5RS functions
    const funcMap: Record<string, Function> = {
      'r5rs:church-zero': () => 0,
      'r5rs:church-one': () => 1,
      'r5rs:church-succ': (n: number) => n + 1,
      'r5rs:church-add': (m: number, n: number) => m + n,
      'r5rs:church-mult': (m: number, n: number) => m * n,
      'r5rs:parse-jsonl-canvas': (data: any) => this.parseCanvas(data),
      'r5rs:extract-facts': (parsed: any) => this.extractFacts(parsed),
      'r5rs:jsonl-to-rdf': (facts: any) => this.factsToRDF(facts),
      'r5rs:rdfs-entail': (triples: any[]) => this.rdfsEntail(triples),
      'r5rs:rdf-query': (triples: any[], s: any, p: any, o: any) => this.rdfQuery(triples, s, p, o),
    };

    if (funcMap[funcName]) {
      return funcMap[funcName](...args);
    }

    // Fallback: return function name and args
    return { function: funcName, args };
  }

  /**
   * Parse canvas data (pure function)
   */
  private parseCanvas(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return { error: 'Invalid JSON' };
      }
    }
    return data;
  }

  /**
   * Extract facts from parsed canvas (pure function - matches R5RS engine)
   */
  private extractFacts(parsed: any): any[] {
    const facts: any[] = [];
    
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          facts.push({
            id: item.id,
            type: item.type,
            text: item.text,
            x: item.x,
            y: item.y,
            from: item.from,
            to: item.to,
            metadata: item.metadata
          });
        }
      }
    } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      facts.push({
        id: parsed.id,
        type: parsed.type,
        text: parsed.text,
        x: parsed.x,
        y: parsed.y,
        from: parsed.from,
        to: parsed.to,
        metadata: parsed.metadata
      });
    }
    
    return facts;
  }

  /**
   * Convert facts to RDF triples (pure function - matches R5RS engine)
   */
  private factsToRDF(facts: any): any[] {
    const triples: any[] = [];
    
    // Ensure facts is always an array
    let factsArray: any[] = [];
    if (Array.isArray(facts)) {
      factsArray = facts;
    } else if (facts && typeof facts === 'object') {
      // If it's an object, try to extract array from common properties
      if (Array.isArray(facts.facts)) {
        factsArray = facts.facts;
      } else if (Array.isArray(facts.data)) {
        factsArray = facts.data;
      } else if (Array.isArray(facts.result)) {
        factsArray = facts.result;
      } else {
        // Single fact object - wrap in array
        factsArray = [facts];
      }
    } else if (facts !== null && facts !== undefined) {
      // Try to convert to array
      factsArray = [facts];
    }
    
    for (const fact of factsArray) {
      if (!fact || typeof fact !== 'object') continue;
      
      // Extract node facts
      if (fact.id && fact.type) {
        triples.push({
          subject: `canvas:${fact.id}`,
          predicate: 'rdf:type',
          object: `canvas:${fact.type}`
        });
      }
      
      // Extract edge facts (connections)
      if (fact.from && fact.to) {
        triples.push({
          subject: `canvas:${fact.from}`,
          predicate: fact.type === 'vertical' ? 'rdfs:subClassOf' : 'canvas:implements',
          object: `canvas:${fact.to}`
        });
      }
      
      // Extract text/content as rdfs:label
      if (fact.text) {
        triples.push({
          subject: `canvas:${fact.id || 'unknown'}`,
          predicate: 'rdfs:label',
          object: fact.text
        });
      }
    }
    
    return triples;
  }

  /**
   * Evaluate a Scheme expression (line-by-line REPL style)
   */
  async evaluate(expression: string): Promise<SchemeREPLResult> {
    this.outputBuffer = [];
    
    try {
      // Parse S-expression
      const parsed = this.parseSExpression(expression);
      
      if (!parsed) {
        return {
          success: false,
          error: 'Invalid S-expression syntax'
        };
      }

      // Evaluate
      const result = this.evaluateSExpression(parsed);
      
      return {
        success: true,
        result,
        output: [...this.outputBuffer]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        output: [...this.outputBuffer]
      };
    }
  }

  /**
   * Load and process JSONL file using Scheme REPL (better than JS parsing)
   */
  async loadAndProcessJSONL(filename: string): Promise<SchemeREPLResult> {
    try {
      // Load file content
      const response = await fetch(`/jsonl/${filename}`);
      if (!response.ok) {
        throw new Error(`File not found: ${filename}`);
      }
      
      const content = await response.text();
      
      // Process line-by-line using Scheme REPL
      return await this.processJSONLFile(content);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load JSONL file'
      };
    }
  }

  /**
   * Evaluate a single line (REPL style)
   */
  async evaluateLine(line: string, context?: any): Promise<SchemeREPLResult> {
    if (context) {
      this.context = { ...this.context, ...context };
    }

    // Trim and skip empty lines
    const trimmed = line.trim();
    if (!trimmed) {
      return { success: true, result: null };
    }

    // Handle comments
    if (trimmed.startsWith(';')) {
      return { success: true, result: null };
    }

    return this.evaluate(trimmed);
  }

  /**
   * Process automaton data line-by-line (pure Scheme, no JSONL parsing errors)
   * Uses R5RS functions to compile cues from JSONL
   */
  async processAutomatonLine(line: string): Promise<SchemeREPLResult> {
    const trimmed = line.trim();
    
    if (!trimmed) {
      return { success: true, result: null };
    }

    // Parse JSON line (one JSON object per line = JSONL format)
    try {
      const json = JSON.parse(trimmed);
      
      // Use R5RS functions to process the automaton cue
      // Convert JSON to S-expression
      const sexpr = this.jsonToSExpression(json);
      
      // Apply R5RS processing pipeline:
      // 1. Parse JSONL canvas entry
      // 2. Extract facts
      // 3. Convert to RDF triples
      // 4. Apply reasoning
      
      const parsedResult = this.evaluateSExpression([
        { symbol: 'r5rs:parse-jsonl-canvas' },
        sexpr
      ]);
      
      // Ensure parsed is in the right format for extractFacts
      let parsed: any = parsedResult;
      if (parsedResult && typeof parsedResult === 'object' && !Array.isArray(parsedResult)) {
        // If it's wrapped in an object, try to extract the actual parsed data
        if (parsedResult.parsed !== undefined) {
          parsed = parsedResult.parsed;
        } else if (parsedResult.data !== undefined) {
          parsed = parsedResult.data;
        } else if (parsedResult.result !== undefined) {
          parsed = parsedResult.result;
        }
      }
      
      const factsResult = this.evaluateSExpression([
        { symbol: 'r5rs:extract-facts' },
        parsed
      ]);
      
      // Ensure facts is always an array before passing to factsToRDF
      let facts: any[] = [];
      if (Array.isArray(factsResult)) {
        facts = factsResult;
      } else if (factsResult && typeof factsResult === 'object') {
        if (Array.isArray(factsResult.facts)) {
          facts = factsResult.facts;
        } else if (Array.isArray(factsResult.data)) {
          facts = factsResult.data;
        } else if (Array.isArray(factsResult.result)) {
          facts = factsResult.result;
        } else {
          // Try extractFacts directly on the object
          facts = this.extractFacts(factsResult);
        }
      } else if (factsResult !== null && factsResult !== undefined) {
        // Fallback: try extractFacts on the result
        facts = this.extractFacts(factsResult);
      }
      
      const triples = this.evaluateSExpression([
        { symbol: 'r5rs:jsonl-to-rdf' },
        facts
      ]);
      
      return {
        success: true,
        result: {
          original: json,
          parsed,
          facts,
          triples,
          processed: true
        },
        output: [...this.outputBuffer]
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.message}${error.stack ? ` | Stack: ${error.stack.split('\n').slice(0, 2).join(' -> ')}` : ''}`
        : String(error);
      return {
        success: false,
        error: `Could not parse JSONL line: ${errorMessage} | Line preview: ${trimmed.substring(0, 100)}`
      };
    }
  }

  /**
   * Process entire JSONL file line-by-line using Scheme REPL
   * Better than JavaScript parsing - pure functions, no split errors
   */
  async processJSONLFile(fileContent: string): Promise<SchemeREPLResult> {
    // Ensure fileContent is a string
    if (typeof fileContent !== 'string') {
      return {
        success: false,
        error: `processJSONLFile: Expected string, got ${typeof fileContent}`,
        result: {
          entries: 0,
          facts: [],
          triples: [],
          factsCount: 0,
          triplesCount: 0,
          originalTriplesCount: 0
        }
      };
    }
    
    const lines = fileContent.split('\n').filter(l => l.trim());
    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const result = await this.processAutomatonLine(line);
        if (result.success && result.result) {
          results.push(result.result);
        } else if (result.error) {
          // Safely convert error to string
          const errorMsg = typeof result.error === 'string' 
            ? result.error 
            : (result.error instanceof Error 
              ? result.error.message 
              : String(result.error));
          errors.push(`Line ${i + 1}: ${errorMsg}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? `${error.message}${error.stack ? ` | ${error.stack.split('\n')[0]}` : ''}`
          : String(error);
        errors.push(`Line ${i + 1}: ${errorMessage} | Content: ${line.substring(0, 100)}`);
      }
    }

    // Compile all cues together - ensure we always get arrays
    const allFacts = results.flatMap(r => {
      if (!r || !r.facts) return [];
      return Array.isArray(r.facts) ? r.facts : [];
    });
    const allTriples = results.flatMap(r => {
      if (!r || !r.triples) return [];
      return Array.isArray(r.triples) ? r.triples : [];
    });

    // Apply R5RS reasoning - ensure allTriples is always an array
    const safeTriples = Array.isArray(allTriples) ? allTriples : [];
    const reasonedTriplesResult = this.evaluateSExpression([
      { symbol: 'r5rs:rdfs-entail' },
      safeTriples
    ]);

    // Ensure triples is always an array
    let reasonedTriples: any[] = [];
    if (Array.isArray(reasonedTriplesResult)) {
      reasonedTriples = reasonedTriplesResult;
    } else if (reasonedTriplesResult && typeof reasonedTriplesResult === 'object') {
      // Try to extract array from object
      if (Array.isArray(reasonedTriplesResult.triples)) {
        reasonedTriples = reasonedTriplesResult.triples;
      } else if (Array.isArray(reasonedTriplesResult.data)) {
        reasonedTriples = reasonedTriplesResult.data;
      } else if (Array.isArray(reasonedTriplesResult.result)) {
        reasonedTriples = reasonedTriplesResult.result;
      }
    } else if (allTriples.length > 0) {
      // Fallback: use original triples if reasoning failed
      reasonedTriples = allTriples;
    }

    // If there were errors, include them in the error field
    const errorMessage = errors.length > 0 
      ? `Processed ${results.length} entries, ${errors.length} errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` (${errors.length - 3} more)` : ''}`
      : undefined;
    
    return {
      success: errors.length === 0,
      error: errorMessage,
      result: {
        entries: results.length,
        facts: allFacts,
        triples: reasonedTriples,
        errors: errors.length > 0 ? errors : undefined,
        factsCount: allFacts.length,
        triplesCount: reasonedTriples.length,
        originalTriplesCount: allTriples.length
      },
      output: [...this.outputBuffer]
    };
  }

  /**
   * Parse S-expression (simplified parser)
   */
  private parseSExpression(input: string): any {
    const trimmed = input.trim();
    
    // Handle atoms
    if (!trimmed.startsWith('(')) {
      return this.parseAtom(trimmed);
    }

    // Handle lists
    const tokens = this.tokenize(trimmed);
    return this.parseTokens(tokens);
  }

  /**
   * Tokenize S-expression
   */
  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        current += char;
      } else if (!inString) {
        if (char === '(') {
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
          tokens.push('(');
          depth++;
        } else if (char === ')') {
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
          tokens.push(')');
          depth--;
        } else if (char === ' ' || char === '\n' || char === '\t') {
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
        } else {
          current += char;
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  /**
   * Parse tokens into S-expression
   */
  private parseTokens(tokens: string[]): any {
    if (tokens.length === 0) return null;

    const stack: any[] = [];
    let current: any[] = [];

    for (const token of tokens) {
      if (token === '(') {
        stack.push(current);
        current = [];
      } else if (token === ')') {
        const list = current;
        current = stack.pop() || [];
        current.push(list);
      } else {
        current.push(this.parseAtom(token));
      }
    }

    return current.length === 1 ? current[0] : current;
  }

  /**
   * Parse atom (number, string, symbol)
   */
  private parseAtom(token: string): any {
    // Number
    if (/^-?\d+$/.test(token)) {
      return parseInt(token, 10);
    }
    if (/^-?\d+\.\d+$/.test(token)) {
      return parseFloat(token);
    }

    // String
    if (token.startsWith('"') && token.endsWith('"')) {
      return token.slice(1, -1);
    }

    // Boolean
    if (token === '#t' || token === 'true') return true;
    if (token === '#f' || token === 'false') return false;

    // Symbol
    return { symbol: token };
  }

  /**
   * Evaluate S-expression
   */
  private evaluateSExpression(expr: any): any {
    if (Array.isArray(expr)) {
      if (expr.length === 0) return null;
      
      const [head, ...args] = expr;
      
      // Handle special forms
      if (head && typeof head === 'object' && head.symbol) {
        const symbol = head.symbol;
        
        // Quote
        if (symbol === 'quote') {
          return args[0];
        }
        
        // Define
        if (symbol === 'define') {
          const name = args[0]?.symbol || args[0];
          const value = this.evaluateSExpression(args[1]);
          this.context[name] = value;
          return value;
        }
        
        // Lambda
        if (symbol === 'lambda') {
          return (...callArgs: any[]) => {
            const params = args[0];
            const body = args[1];
            const localContext = { ...this.context };
            
            if (Array.isArray(params)) {
              params.forEach((param, i) => {
                if (param.symbol) {
                  localContext[param.symbol] = callArgs[i];
                }
              });
            }
            
            const oldContext = this.context;
            this.context = localContext;
            const result = this.evaluateSExpression(body);
            this.context = oldContext;
            return result;
          };
        }
        
        // Function call
        if (this.context[symbol]) {
          const func = this.context[symbol];
          const evaluatedArgs = args.map(arg => this.evaluateSExpression(arg));
          return func(...evaluatedArgs);
        }
        
        // R5RS function
        if (symbol.startsWith('r5rs:')) {
          const evaluatedArgs = args.map(arg => this.evaluateSExpression(arg));
          return this.evaluateFunction(symbol, evaluatedArgs);
        }
      }
      
      // Evaluate each element
      return expr.map(e => this.evaluateSExpression(e));
    }
    
    // Atom
    if (expr && typeof expr === 'object' && expr.symbol) {
      return this.context[expr.symbol] || expr;
    }
    
    return expr;
  }

  /**
   * Convert JSON to S-expression
   */
  private jsonToSExpression(json: any): any {
    if (Array.isArray(json)) {
      return json.map(item => this.jsonToSExpression(item));
    }
    if (json && typeof json === 'object') {
      // Convert object to list of key-value pairs
      return Object.entries(json).map(([key, value]) => [
        { symbol: key },
        this.jsonToSExpression(value)
      ]);
    }
    return json;
  }

  /**
   * RDFS entailment (pure function - matches R5RS engine)
   */
  private rdfsEntail(triples: any[]): any[] {
    // Ensure triples is always an array
    if (!triples || !Array.isArray(triples)) {
      return [];
    }
    
    // Simple transitive closure for rdfs:subClassOf
    const subClassOfTriples = triples.filter(t => t && t.predicate === 'rdfs:subClassOf');
    const newTriples: any[] = [...triples];
    
    // Find transitive relationships
    for (const t1 of subClassOfTriples) {
      for (const t2 of subClassOfTriples) {
        if (t1.object === t2.subject) {
          const newTriple = {
            subject: t1.subject,
            predicate: 'rdfs:subClassOf',
            object: t2.object
          };
          // Add if not already present
          if (!triples.some(t => 
            t.subject === newTriple.subject &&
            t.predicate === newTriple.predicate &&
            t.object === newTriple.object
          )) {
            newTriples.push(newTriple);
          }
        }
      }
    }
    
    return newTriples;
  }

  /**
   * RDF query (pure function - matches R5RS engine)
   */
  private rdfQuery(triples: any[], s: any, p: any, o: any): any[] {
    // Ensure triples is always an array
    if (!triples || !Array.isArray(triples)) {
      return [];
    }
    
    return triples.filter(t => {
      const matchS = s === '?' || s === t.subject || (typeof s === 'string' && s === t.subject);
      const matchP = p === '?' || p === t.predicate || (typeof p === 'string' && p === t.predicate);
      const matchO = o === '?' || o === t.object || (typeof o === 'string' && o === t.object);
      return matchS && matchP && matchO;
    });
  }
}

export const schemeREPLService = new SchemeREPLServiceImpl();
