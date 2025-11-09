/**
 * Unified Code Editor Service
 * 
 * Provides integration between CodeMirror editor and various services:
 * - OpenCode API integration
 * - Scheme REPL service
 * - AI agent assistance
 * - JSONL automaton integration
 * - Code analysis and completion
 */

import { opencodeApi } from './api';
import { schemeREPLService, SchemeREPLResult } from './scheme-repl-service';
import { frontMatterParser } from '../utils/front-matter-parser';
import { databaseService } from './database-service';

export interface AnalysisResult {
  patterns: string[];
  suggestions: string[];
  codeQuality: number;
  complexity: number;
  recommendations: string[];
  triples?: any[];
}

export interface CodeEditorIntegration {
  analyzeCode(code: string): Promise<AnalysisResult>;
  generateCodeWithAI(prompt: string, context?: string): Promise<string>;
  completeCode(code: string, language: string): Promise<string>;
  executePrologQuery(query: string, database?: any[]): Promise<SchemeREPLResult>;
  executeDatalogQuery(query: string, program?: any[]): Promise<SchemeREPLResult>;
  validateWithSHACL(data: any, shapes: any): Promise<SchemeREPLResult>;
  queryRDF(query: string, graph: any): Promise<SchemeREPLResult>;
  analyzeAndQuery(code: string, queryType: 'prolog' | 'datalog' | 'sparql', query: string): Promise<SchemeREPLResult>;
  generateWithContext(prompt: string, codeContext: string, queryContext?: any): Promise<string>;
}

class UnifiedCodeEditorService implements CodeEditorIntegration {
  private static instance: UnifiedCodeEditorService;

  static getInstance(): UnifiedCodeEditorService {
    if (!UnifiedCodeEditorService.instance) {
      UnifiedCodeEditorService.instance = new UnifiedCodeEditorService();
    }
    return UnifiedCodeEditorService.instance;
  }

  // ============================================================================
  // CODE ANALYSIS METHODS
  // ============================================================================

  async analyzeCode(code: string): Promise<AnalysisResult> {
    try {
      // Basic code analysis
      const lines = code.split('\n');
      const patterns = this.extractPatterns(code);
      const suggestions = this.generateSuggestions(code);
      const complexity = this.calculateComplexity(code);
      const codeQuality = this.calculateCodeQuality(code, complexity);
      const recommendations = this.generateRecommendations(code, patterns, complexity);

      return {
        patterns,
        suggestions,
        codeQuality,
        complexity,
        recommendations,
        triples: this.extractRDFTriples(code)
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        patterns: [],
        suggestions: [],
        codeQuality: 0,
        complexity: 0,
        recommendations: []
      };
    }
  }

  private extractPatterns(code: string): string[] {
    const patterns: string[] = [];
    
    // Church encoding patterns
    if (code.includes('λf.λx.x')) patterns.push('Church numeral zero');
    if (code.includes('λn.λf.λx.f(nfx)')) patterns.push('Church successor');
    if (code.includes('λm.λn.λf.λx.mf(nfx)')) patterns.push('Church addition');
    if (code.includes('λm.λn.λf.m(nf)')) patterns.push('Church multiplication');
    
    // Functional patterns
    if (code.includes('=>') && code.includes('const')) patterns.push('Arrow functions');
    if (code.includes('map(') || code.includes('filter(') || code.includes('reduce(')) {
      patterns.push('Functional programming');
    }
    
    // JSONL patterns
    if (code.includes('"id"') && code.includes('"type"')) {
      patterns.push('JSONL canvas format');
    }
    
    // Scheme patterns
    if (code.includes('(define ') || code.includes('(lambda ')) {
      patterns.push('Scheme/Lisp expressions');
    }
    
    return patterns;
  }

  private generateSuggestions(code: string): string[] {
    const suggestions: string[] = [];
    
    if (code.length > 1000) {
      suggestions.push('Consider breaking down large functions into smaller ones');
    }
    
    if (!code.includes('return') && code.includes('function')) {
      suggestions.push('Function missing return statement');
    }
    
    if (code.includes('var ')) {
      suggestions.push('Consider using const or let instead of var');
    }
    
    if (code.includes('console.log') && code.split('\n').length > 20) {
      suggestions.push('Remove debug console.log statements');
    }
    
    return suggestions;
  }

  private calculateComplexity(code: string): number {
    let complexity = 1;
    
    // Count control structures
    const controlStructures = ['if', 'else', 'for', 'while', 'switch', 'case'];
    controlStructures.forEach(struct => {
      const regex = new RegExp(`\\b${struct}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });
    
    // Count nested functions
    const functionMatches = code.match(/function\s+\w+/g);
    if (functionMatches) complexity += functionMatches.length * 2;
    
    // Count ternary operators
    const ternaryMatches = code.match(/\?./g);
    if (ternaryMatches) complexity += ternaryMatches.length;
    
    return Math.min(complexity, 10);
  }

  private calculateCodeQuality(code: string, complexity: number): number {
    let quality = 100;
    
    // Deduct for high complexity
    quality -= complexity * 5;
    
    // Deduct for long lines
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 100).length;
    quality -= (longLines / lines.length) * 20;
    
    // Deduct for missing documentation
    if (!code.includes('//') && !code.includes('/*')) {
      quality -= 10;
    }
    
    return Math.max(0, Math.min(100, quality));
  }

  private generateRecommendations(code: string, patterns: string[], complexity: number): string[] {
    const recommendations: string[] = [];
    
    if (complexity > 7) {
      recommendations.push('Consider refactoring complex functions');
    }
    
    if (patterns.includes('Church encoding')) {
      recommendations.push('Add Church encoding documentation and examples');
    }
    
    if (patterns.includes('JSONL canvas format')) {
      recommendations.push('Validate JSONL schema and add type definitions');
    }
    
    if (!code.includes('try') && !code.includes('catch')) {
      recommendations.push('Add error handling for robustness');
    }
    
    return recommendations;
  }

  private extractRDFTriples(code: string): any[] {
    const triples: any[] = [];
    
    // Extract RDF-like patterns from comments or structured data
    const triplePattern = /<([^>]+)>\s+<([^>]+)>\s+<([^>]+)>/g;
    let match;
    while ((match = triplePattern.exec(code)) !== null) {
      triples.push({
        subject: match[1],
        predicate: match[2],
        object: match[3]
      });
    }
    
    return triples;
  }

  // ============================================================================
  // AI CODE GENERATION METHODS
  // ============================================================================

  async generateCodeWithAI(prompt: string, context?: string): Promise<string> {
    try {
      const response = await opencodeApi.generateCode({
        prompt,
        context: context || '',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 2048
      });
      
      return (response.data as any)?.code || '';
    } catch (error) {
      console.error('AI code generation failed:', error);
      return `// Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async completeCode(code: string, language: string): Promise<string> {
    try {
      const response = await opencodeApi.completeCode({
        code,
        language,
        model: 'codellama',
        temperature: 0.3,
        maxTokens: 512
      });
      
      return (response.data as any)?.completion || '';
    } catch (error) {
      console.error('Code completion failed:', error);
      return '';
    }
  }

  // ============================================================================
  // QUERY EXECUTION METHODS
  // ============================================================================

  async executePrologQuery(query: string, database?: any[]): Promise<SchemeREPLResult> {
    try {
      const dbParam = database ? JSON.stringify(database) : "'*prolog-db*'";
      const schemeQuery = `(r5rs:prolog-query ${dbParam} '${query})`;
      
      const result = await schemeREPLService.evaluate(schemeQuery);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Prolog query failed'
      };
    }
  }

  async executeDatalogQuery(query: string, program?: any[]): Promise<SchemeREPLResult> {
    try {
      const progParam = program ? JSON.stringify(program) : "'*datalog-program*'";
      const schemeQuery = `(r5rs:datalog-query ${progParam} '${query})`;
      
      const result = await schemeREPLService.evaluate(schemeQuery);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Datalog query failed'
      };
    }
  }

  async validateWithSHACL(data: any, shapes: any): Promise<SchemeREPLResult> {
    try {
      const schemeQuery = `(r5rs:shacl-validate '${JSON.stringify(data)} '${JSON.stringify(shapes)})`;
      
      const result = await schemeREPLService.evaluate(schemeQuery);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SHACL validation failed'
      };
    }
  }

  async queryRDF(query: string, graph: any): Promise<SchemeREPLResult> {
    try {
      const schemeQuery = `(r5rs:rdf-query '${query} '${JSON.stringify(graph)})`;
      
      const result = await schemeREPLService.evaluate(schemeQuery);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'RDF query failed'
      };
    }
  }

  async analyzeAndQuery(code: string, queryType: 'prolog' | 'datalog' | 'sparql', query: string): Promise<SchemeREPLResult> {
    const analysis = await this.analyzeCode(code);
    
    switch (queryType) {
      case 'prolog':
        return await this.executePrologQuery(query);
      case 'datalog':
        return await this.executeDatalogQuery(query);
      case 'sparql':
        const sparqlQuery = `(r5rs:sparql-query "${query}" '${JSON.stringify(analysis.triples || [])})`;
        return await schemeREPLService.evaluate(sparqlQuery);
      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  async generateWithContext(prompt: string, codeContext: string, queryContext?: any): Promise<string> {
    let fullContext = `Code Context:\n${codeContext}\n\n`;

    if (queryContext) {
      fullContext += `Query Context:\n${JSON.stringify(queryContext, null, 2)}\n\n`;
    }

    fullContext += `Prompt: ${prompt}`;

    return await this.generateCodeWithAI(fullContext);
  }
}

// Export singleton instance
export const unifiedCodeEditorService = UnifiedCodeEditorService.getInstance();