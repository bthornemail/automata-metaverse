import { RdfTriple, TriplePattern, SparqlQueryResult } from '../types/index.js';

/**
 * RDF Triple Store
 */
export class TripleStore {
  private triples: RdfTriple[] = [];

  /**
   * Add triples to the store
   */
  addTriples(triples: RdfTriple[]): void {
    this.triples.push(...triples);
  }

  /**
   * Query triples by pattern
   */
  query(pattern: TriplePattern): RdfTriple[] {
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
   * Execute SPARQL query (simplified implementation)
   */
  async sparql(query: string): Promise<SparqlQueryResult> {
    // Simple SELECT query parser
    const selectMatch = query.match(/SELECT\s+(.*?)\s+WHERE/i);
    if (!selectMatch) {
      throw new Error('Unsupported SPARQL query format');
    }

    const variables = selectMatch[1].split(/\s+/).filter(v => v.startsWith('?'));
    
    // Extract WHERE clause patterns
    const whereMatch = query.match(/WHERE\s*\{([^}]+)\}/is);
    if (!whereMatch) {
      return { results: { bindings: [] } };
    }

    const patterns = this.parseSparqlPatterns(whereMatch[1]);
    const bindings: Record<string, { value: string; type: string }>[] = [];

    // Simple pattern matching (full SPARQL would be more complex)
    for (const pattern of patterns) {
      const matches = this.query(pattern);
      for (const match of matches) {
        const binding: Record<string, { value: string; type: string }> = {};
        
        if (pattern.subject?.startsWith('?')) {
          binding[pattern.subject] = { value: match.subject, type: 'uri' };
        }
        if (pattern.predicate?.startsWith('?')) {
          binding[pattern.predicate] = { value: match.predicate, type: 'uri' };
        }
        if (pattern.object?.startsWith('?')) {
          const objValue = typeof match.object === 'string' ? match.object : match.object.value;
          binding[pattern.object] = { value: objValue, type: 'uri' };
        }
        
        bindings.push(binding);
      }
    }

    return { results: { bindings } };
  }

  /**
   * Parse SPARQL patterns from WHERE clause
   */
  private parseSparqlPatterns(whereClause: string): TriplePattern[] {
    const patterns: TriplePattern[] = [];
    const lines = whereClause.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      const match = line.match(/(\S+)\s+(\S+)\s+(\S+)\s*\./);
      if (match) {
        patterns.push({
          subject: match[1],
          predicate: match[2],
          object: match[3]
        });
      }
    }

    return patterns;
  }

  /**
   * RDFS entailment (simplified)
   */
  rdfsEntailment(triples: RdfTriple[]): RdfTriple[] {
    const entailed: RdfTriple[] = [...triples];
    const rdfType = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>';
    const rdfsSubClassOf = '<http://www.w3.org/2000/01/rdf-schema#subClassOf>';

    // Find subClassOf relationships
    const subClassTriples = triples.filter(t => 
      t.predicate === rdfsSubClassOf
    );

    // Apply subClassOf transitivity
    for (const subClassTriple of subClassTriples) {
      const subClass = subClassTriple.subject;
      const superClass = typeof subClassTriple.object === 'string' 
        ? subClassTriple.object 
        : subClassTriple.object.value;

      // Find all instances of subClass
      const instances = triples.filter(t => 
        t.predicate === rdfType && 
        (typeof t.object === 'string' ? t.object : t.object.value) === subClass
      );

      // Add type assertions for superClass
      for (const instance of instances) {
        entailed.push({
          subject: instance.subject,
          predicate: rdfType,
          object: superClass
        });
      }
    }

    return entailed;
  }

  /**
   * Get all triples
   */
  getTriples(): RdfTriple[] {
    return [...this.triples];
  }

  /**
   * Clear all triples
   */
  clear(): void {
    this.triples = [];
  }
}
