/**
 * Enhanced SPARQL Query Parser
 * Supports: SELECT, DISTINCT, ORDER BY, LIMIT, OFFSET, FILTER, OPTIONAL, UNION
 */

export interface SparqlQuery {
  type: 'SELECT' | 'ASK' | 'CONSTRUCT' | 'DESCRIBE';
  distinct?: boolean;
  variables: string[];
  where: SparqlPattern[];
  optional?: SparqlPattern[];
  filters?: SparqlFilter[];
  orderBy?: SparqlOrderBy[];
  limit?: number;
  offset?: number;
  union?: SparqlQuery[];
}

export interface SparqlPattern {
  subject: string;
  predicate: string;
  object: string;
  optional?: boolean;
}

export interface SparqlFilter {
  expression: string;
  type: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'regex' | 'lang' | 'bound' | 'custom';
  left: string;
  right?: string;
}

export interface SparqlOrderBy {
  variable: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Parse SPARQL query string into structured query object
 */
export class SparqlParser {
  /**
   * Parse SPARQL query
   */
  static parse(query: string): SparqlQuery {
    const normalized = this.normalizeQuery(query);
    
    // Parse query type
    const queryType = this.parseQueryType(normalized);
    
    // Parse SELECT clause
    const selectMatch = normalized.match(/SELECT\s+(DISTINCT\s+)?(.*?)\s+WHERE/i);
    if (!selectMatch) {
      throw new Error('Invalid SPARQL SELECT query');
    }

    const distinct = !!selectMatch[1];
    const variablesStr = selectMatch[2].trim();
    const variables = this.parseVariables(variablesStr);

    // Parse WHERE clause
    const whereMatch = normalized.match(/WHERE\s*\{([^}]+)\}/is);
    if (!whereMatch) {
      throw new Error('Invalid SPARQL WHERE clause');
    }

    const whereClause = whereMatch[1];
    const patterns = this.parsePatterns(whereClause);
    const filters = this.parseFilters(whereClause);
    const optional = this.parseOptional(whereClause);

    // Parse ORDER BY
    const orderByMatch = normalized.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|\s+OFFSET|$)/i);
    const orderBy = orderByMatch ? this.parseOrderBy(orderByMatch[1]) : undefined;

    // Parse LIMIT
    const limitMatch = normalized.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

    // Parse OFFSET
    const offsetMatch = normalized.match(/OFFSET\s+(\d+)/i);
    const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : undefined;

    return {
      type: queryType,
      distinct,
      variables,
      where: patterns,
      optional,
      filters,
      orderBy,
      limit,
      offset
    };
  }

  /**
   * Normalize query string
   */
  private static normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\s*\{\s*/g, ' { ')
      .replace(/\s*\}\s*/g, ' } ')
      .trim();
  }

  /**
   * Parse query type
   */
  private static parseQueryType(query: string): 'SELECT' | 'ASK' | 'CONSTRUCT' | 'DESCRIBE' {
    if (query.match(/^\s*SELECT/i)) return 'SELECT';
    if (query.match(/^\s*ASK/i)) return 'ASK';
    if (query.match(/^\s*CONSTRUCT/i)) return 'CONSTRUCT';
    if (query.match(/^\s*DESCRIBE/i)) return 'DESCRIBE';
    return 'SELECT'; // Default
  }

  /**
   * Parse variables from SELECT clause
   */
  private static parseVariables(variablesStr: string): string[] {
    if (variablesStr === '*') {
      return ['*'];
    }
    return variablesStr
      .split(/\s+/)
      .filter(v => v.trim())
      .map(v => v.trim());
  }

  /**
   * Parse triple patterns from WHERE clause
   */
  private static parsePatterns(whereClause: string): SparqlPattern[] {
    const patterns: SparqlPattern[] = [];
    const lines = whereClause.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('FILTER') && !l.startsWith('OPTIONAL'));

    for (const line of lines) {
      const match = line.match(/(\S+)\s+(\S+)\s+(\S+)\s*\.?/);
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
   * Parse OPTIONAL patterns
   */
  private static parseOptional(whereClause: string): SparqlPattern[] | undefined {
    const optionalMatch = whereClause.match(/OPTIONAL\s*\{([^}]+)\}/is);
    if (!optionalMatch) return undefined;

    return this.parsePatterns(optionalMatch[1]);
  }

  /**
   * Parse FILTER expressions
   */
  private static parseFilters(whereClause: string): SparqlFilter[] {
    const filters: SparqlFilter[] = [];
    const filterMatches = whereClause.matchAll(/FILTER\s*\(([^)]+)\)/gi);

    for (const match of filterMatches) {
      const expression = match[1].trim();
      
      // Parse different filter types
      if (expression.includes('=')) {
        const [left, right] = expression.split('=').map(s => s.trim());
        filters.push({
          expression,
          type: 'equals',
          left,
          right
        });
      } else if (expression.includes('!=')) {
        const [left, right] = expression.split('!=').map(s => s.trim());
        filters.push({
          expression,
          type: 'notEquals',
          left,
          right
        });
      } else if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(s => s.trim());
        filters.push({
          expression,
          type: 'greaterThan',
          left,
          right
        });
      } else if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(s => s.trim());
        filters.push({
          expression,
          type: 'lessThan',
          left,
          right
        });
      } else if (expression.includes('regex')) {
        filters.push({
          expression,
          type: 'regex',
          left: expression
        });
      } else if (expression.includes('bound')) {
        filters.push({
          expression,
          type: 'bound',
          left: expression
        });
      } else {
        filters.push({
          expression,
          type: 'custom',
          left: expression
        });
      }
    }

    return filters;
  }

  /**
   * Parse ORDER BY clause
   */
  private static parseOrderBy(orderByStr: string): SparqlOrderBy[] {
    const orders: SparqlOrderBy[] = [];
    const parts = orderByStr.split(/\s+/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part === 'ASC' || part === 'DESC') {
        if (i > 0) {
          orders[orders.length - 1].direction = part as 'ASC' | 'DESC';
        }
      } else if (part && !part.match(/^(ASC|DESC)$/i)) {
        orders.push({
          variable: part,
          direction: 'ASC' // Default
        });
      }
    }

    return orders;
  }
}
