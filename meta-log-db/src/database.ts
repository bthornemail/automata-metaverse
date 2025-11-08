import { MetaLogDbConfig, Fact } from './types/index.js';
import { PrologEngine } from './prolog/engine.js';
import { DatalogEngine } from './datalog/engine.js';
import { R5RSRegistry } from './r5rs/registry.js';
import { JsonlParser } from './jsonl/parser.js';
import { TripleStore } from './rdf/triple-store.js';
import { ShaclValidator } from './shacl/validator.js';

/**
 * Meta-Log Database - Main class
 */
export class MetaLogDb {
  private prolog?: PrologEngine;
  private datalog?: DatalogEngine;
  private r5rs?: R5RSRegistry;
  private jsonl: JsonlParser;
  private rdf?: TripleStore;
  private shacl?: ShaclValidator;
  private config: MetaLogDbConfig;

  constructor(config: MetaLogDbConfig = {}) {
    this.config = {
      enableProlog: true,
      enableDatalog: true,
      enableRdf: true,
      enableShacl: true,
      ...config
    };

    this.jsonl = new JsonlParser();

    if (this.config.enableProlog) {
      this.prolog = new PrologEngine();
    }

    if (this.config.enableDatalog) {
      this.datalog = new DatalogEngine();
    }

    if (this.config.enableRdf) {
      this.rdf = new TripleStore();
    }

    if (this.config.enableShacl) {
      this.shacl = new ShaclValidator();
    }

    if (this.config.r5rsEnginePath) {
      this.loadR5RSEngine(this.config.r5rsEnginePath);
    }
  }

  /**
   * Load R5RS engine from file
   */
  async loadR5RSEngine(path: string): Promise<void> {
    this.r5rs = new R5RSRegistry(path);
    await this.r5rs.load();
  }

  /**
   * Load canvas file (JSONL or CanvasL)
   */
  async loadCanvas(path: string): Promise<void> {
    let canvas;
    
    if (path.endsWith('.canvasl')) {
      canvas = await this.jsonl.parseCanvasL(path);
    } else {
      canvas = await this.jsonl.parse(path);
    }

    const facts = this.jsonl.extractFacts(canvas);
    
    if (this.prolog) {
      this.prolog.addFacts(facts);
    }
    
    if (this.datalog) {
      this.datalog.addFacts(facts);
    }
    
    if (this.rdf) {
      const triples = this.jsonl.toRdf(facts);
      this.rdf.addTriples(triples);
    }
  }

  /**
   * Parse JSONL canvas
   */
  async parseJsonlCanvas(path: string): Promise<any> {
    return await this.jsonl.parse(path);
  }

  /**
   * Parse CanvasL file
   */
  async parseCanvasL(path: string): Promise<any> {
    return await this.jsonl.parseCanvasL(path);
  }

  /**
   * Extract facts from canvas
   */
  extractFactsFromCanvas(canvas: any): Fact[] {
    return this.jsonl.extractFacts(canvas);
  }

  /**
   * Extract facts
   */
  extractFacts(): Fact[] {
    return this.jsonl.getFacts();
  }

  /**
   * Convert JSONL facts to RDF
   */
  jsonlToRdf(facts?: Fact[]): any[] {
    return this.jsonl.toRdf(facts);
  }

  /**
   * Execute ProLog query
   */
  async prologQuery(query: string): Promise<any> {
    if (!this.prolog) {
      throw new Error('ProLog engine not enabled');
    }
    return await this.prolog.query(query);
  }

  /**
   * Build ProLog database from facts
   */
  buildPrologDb(facts: Fact[]): void {
    if (!this.prolog) {
      throw new Error('ProLog engine not enabled');
    }
    this.prolog.buildDb(facts);
  }

  /**
   * Add ProLog rule
   */
  addPrologRule(rule: string): void {
    if (!this.prolog) {
      throw new Error('ProLog engine not enabled');
    }
    // Parse rule string into PrologRule format
    const match = rule.match(/^(.+?)\s*:-\s*(.+)$/);
    if (match) {
      const head = match[1].trim();
      const body = match[2].split(',').map(b => b.trim());
      this.prolog.addRule({ head, body });
    }
  }

  /**
   * Execute DataLog query
   */
  async datalogQuery(query: string, program?: any): Promise<any> {
    if (!this.datalog) {
      throw new Error('DataLog engine not enabled');
    }
    return await this.datalog.query(query, program);
  }

  /**
   * Build DataLog program
   */
  buildDatalogProgram(rules: string[]): any {
    if (!this.datalog) {
      throw new Error('DataLog engine not enabled');
    }
    const parsedRules = rules.map(rule => {
      const match = rule.match(/^(.+?)\s*:-\s*(.+)$/);
      if (match) {
        return {
          head: match[1].trim(),
          body: match[2].split(',').map(b => b.trim())
        };
      }
      throw new Error(`Invalid rule format: ${rule}`);
    });
    return this.datalog.buildProgram(parsedRules);
  }

  /**
   * Execute SPARQL query
   */
  async sparqlQuery(query: string): Promise<any> {
    if (!this.rdf) {
      throw new Error('RDF engine not enabled');
    }
    return await this.rdf.sparql(query);
  }

  /**
   * Store RDF triples
   */
  storeTriples(triples: any[]): void {
    if (!this.rdf) {
      throw new Error('RDF engine not enabled');
    }
    this.rdf.addTriples(triples);
  }

  /**
   * RDFS entailment
   */
  rdfsEntailment(triples: any[]): any[] {
    if (!this.rdf) {
      throw new Error('RDF engine not enabled');
    }
    return this.rdf.rdfsEntailment(triples);
  }

  /**
   * Load SHACL shapes
   */
  async loadShaclShapes(path: string): Promise<any> {
    if (!this.shacl) {
      throw new Error('SHACL validator not enabled');
    }
    return await this.shacl.loadShapes(path);
  }

  /**
   * Validate SHACL
   */
  async validateShacl(shapes?: any, triples?: any): Promise<any> {
    if (!this.shacl) {
      throw new Error('SHACL validator not enabled');
    }
    
    const targetTriples = triples || (this.rdf ? this.rdf.getTriples() : []);
    return await this.shacl.validate(shapes || {}, targetTriples);
  }

  /**
   * Execute R5RS function
   */
  async executeR5RS(functionName: string, args: any[]): Promise<any> {
    if (!this.r5rs) {
      throw new Error('R5RS engine not loaded');
    }
    return await this.r5rs.execute(functionName, args);
  }

  /**
   * Register R5RS function
   */
  registerR5RSFunction(name: string, fn: Function): void {
    if (!this.r5rs) {
      this.r5rs = new R5RSRegistry();
    }
    this.r5rs.register(name, fn);
  }

  /**
   * Get configuration
   */
  getConfig(): MetaLogDbConfig {
    return { ...this.config };
  }
}

export type { MetaLogDbConfig } from './types/index.js';
