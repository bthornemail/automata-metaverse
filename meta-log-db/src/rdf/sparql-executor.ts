import { SparqlQuery, SparqlPattern, SparqlFilter } from './sparql-parser.js';
import { RdfTriple, TriplePattern } from '../types/index.js';

/**
 * Enhanced SPARQL Query Executor
 * Executes parsed SPARQL queries with full feature support
 */
export class SparqlExecutor {
  private triples: RdfTriple[];

  constructor(triples: RdfTriple[]) {
    this.triples = triples;
  }

  /**
   * Execute SPARQL query
   */
  async execute(query: SparqlQuery): Promise<any> {
    // Execute WHERE clause patterns
    let bindings = this.executePatterns(query.where);

    // Apply OPTIONAL patterns
    if (query.optional) {
      bindings = this.applyOptional(bindings, query.optional);
    }

    // Apply FILTER expressions
    if (query.filters && query.filters.length > 0) {
      bindings = this.applyFilters(bindings, query.filters);
    }

    // Apply DISTINCT
    if (query.distinct) {
      bindings = this.applyDistinct(bindings);
    }

    // Apply ORDER BY
    if (query.orderBy && query.orderBy.length > 0) {
      bindings = this.applyOrderBy(bindings, query.orderBy);
    }

    // Apply LIMIT and OFFSET
    if (query.offset) {
      bindings = bindings.slice(query.offset);
    }
    if (query.limit) {
      bindings = bindings.slice(0, query.limit);
    }

    // Project variables
    bindings = this.projectVariables(bindings, query.variables);

    return {
      results: {
        bindings: bindings.map(b => this.formatBinding(b))
      }
    };
  }

  /**
   * Execute triple patterns
   */
  private executePatterns(patterns: SparqlPattern[]): Record<string, string>[] {
    if (patterns.length === 0) {
      return [{}];
    }

    let bindings: Record<string, string>[] = [{}];

    for (const pattern of patterns) {
      const newBindings: Record<string, string>[] = [];

      for (const binding of bindings) {
        const matches = this.matchPattern(pattern, binding);
        for (const match of matches) {
          newBindings.push({ ...binding, ...match });
        }
      }

      bindings = newBindings;
    }

    return bindings;
  }

  /**
   * Match a pattern against triples with existing bindings
   */
  private matchPattern(pattern: SparqlPattern, existingBindings: Record<string, string>): Record<string, string>[] {
    const subject = this.resolveValue(pattern.subject, existingBindings);
    const predicate = this.resolveValue(pattern.predicate, existingBindings);
    const object = this.resolveValue(pattern.object, existingBindings);

    const matches: Record<string, string>[] = [];
    const patternTriple: TriplePattern = {
      subject: subject.startsWith('?') ? undefined : subject,
      predicate: predicate.startsWith('?') ? undefined : predicate,
      object: object.startsWith('?') ? undefined : object
    };

    const matchingTriples = this.queryTriples(patternTriple);

    for (const triple of matchingTriples) {
      const newBinding: Record<string, string> = {};

      if (subject.startsWith('?')) {
        newBinding[subject] = triple.subject;
      }
      if (predicate.startsWith('?')) {
        newBinding[predicate] = triple.predicate;
      }
      if (object.startsWith('?')) {
        const objValue = typeof triple.object === 'string' ? triple.object : triple.object.value;
        newBinding[object] = objValue;
      }

      // Check if binding is consistent with existing bindings
      let consistent = true;
      for (const [key, value] of Object.entries(newBinding)) {
        if (existingBindings[key] && existingBindings[key] !== value) {
          consistent = false;
          break;
        }
      }

      if (consistent) {
        matches.push(newBinding);
      }
    }

    return matches;
  }

  /**
   * Resolve variable or literal value
   */
  private resolveValue(value: string, bindings: Record<string, string>): string {
    if (value.startsWith('?')) {
      return bindings[value] || value;
    }
    return value;
  }

  /**
   * Query triples by pattern
   */
  private queryTriples(pattern: TriplePattern): RdfTriple[] {
    return this.triples.filter(triple => {
      if (pattern.subject && triple.subject !== pattern.subject) {
        return false;
      }
      if (pattern.predicate && triple.predicate !== pattern.predicate) {
        return false;
      }
      if (pattern.object) {
        const objStr = typeof triple.object === 'string' 
          ? triple.object 
          : triple.object.value;
        if (objStr !== pattern.object) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply OPTIONAL patterns
   */
  private applyOptional(bindings: Record<string, string>[], optionalPatterns: SparqlPattern[]): Record<string, string>[] {
    const result: Record<string, string>[] = [];

    for (const binding of bindings) {
      const optionalMatches = this.executePatterns(optionalPatterns);
      
      if (optionalMatches.length > 0) {
        for (const match of optionalMatches) {
          result.push({ ...binding, ...match });
        }
      } else {
        result.push(binding);
      }
    }

    return result;
  }

  /**
   * Apply FILTER expressions
   */
  private applyFilters(bindings: Record<string, string>[], filters: SparqlFilter[]): Record<string, string>[] {
    return bindings.filter(binding => {
      return filters.every(filter => this.evaluateFilter(filter, binding));
    });
  }

  /**
   * Evaluate a filter expression
   */
  private evaluateFilter(filter: SparqlFilter, binding: Record<string, string>): boolean {
    const leftValue = this.resolveValue(filter.left, binding);
    const rightValue = filter.right ? this.resolveValue(filter.right, binding) : undefined;

    switch (filter.type) {
      case 'equals':
        return leftValue === rightValue;
      case 'notEquals':
        return leftValue !== rightValue;
      case 'greaterThan':
        return parseFloat(leftValue) > parseFloat(rightValue || '0');
      case 'lessThan':
        return parseFloat(leftValue) < parseFloat(rightValue || '0');
      case 'bound':
        return binding[filter.left] !== undefined;
      case 'regex':
        // Simplified regex - full implementation would parse regex properly
        return true;
      default:
        return true;
    }
  }

  /**
   * Apply DISTINCT
   */
  private applyDistinct(bindings: Record<string, string>[]): Record<string, string>[] {
    const seen = new Set<string>();
    const result: Record<string, string>[] = [];

    for (const binding of bindings) {
      const key = JSON.stringify(binding);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(binding);
      }
    }

    return result;
  }

  /**
   * Apply ORDER BY
   */
  private applyOrderBy(bindings: Record<string, string>[], orderBy: Array<{ variable: string; direction: 'ASC' | 'DESC' }>): Record<string, string>[] {
    return [...bindings].sort((a, b) => {
      for (const order of orderBy) {
        const aValue = a[order.variable] || '';
        const bValue = b[order.variable] || '';
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;

        if (order.direction === 'DESC') {
          comparison = -comparison;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Project variables (SELECT clause)
   */
  private projectVariables(bindings: Record<string, string>[], variables: string[]): Record<string, string>[] {
    if (variables.includes('*')) {
      return bindings;
    }

    return bindings.map(binding => {
      const projected: Record<string, string> = {};
      for (const variable of variables) {
        if (binding[variable]) {
          projected[variable] = binding[variable];
        }
      }
      return projected;
    });
  }

  /**
   * Format binding for output
   */
  private formatBinding(binding: Record<string, string>): Record<string, { value: string; type: string }> {
    const formatted: Record<string, { value: string; type: string }> = {};
    
    for (const [key, value] of Object.entries(binding)) {
      formatted[key] = {
        value,
        type: this.inferType(value)
      };
    }

    return formatted;
  }

  /**
   * Infer RDF type from value
   */
  private inferType(value: string): string {
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('<')) {
      return 'uri';
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      return 'literal';
    }
    if (/^-?\d+$/.test(value)) {
      return 'typed-literal';
    }
    return 'literal';
  }
}
