import { SparqlParser } from '../rdf/sparql-parser.js';
import { SparqlExecutor } from '../rdf/sparql-executor.js';
import { RdfTriple } from '../types/index.js';

describe('SparqlParser', () => {
  describe('Basic SELECT queries', () => {
    test('should parse simple SELECT query', () => {
      const query = `
        SELECT ?id ?type WHERE {
          ?id rdf:type ?type
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.type).toBe('SELECT');
      expect(parsed.variables).toEqual(['?id', '?type']);
      expect(parsed.where).toHaveLength(1);
      expect(parsed.where[0].subject).toBe('?id');
      expect(parsed.where[0].predicate).toBe('rdf:type');
      expect(parsed.where[0].object).toBe('?type');
    });

    test('should parse SELECT DISTINCT', () => {
      const query = `
        SELECT DISTINCT ?type WHERE {
          ?id rdf:type ?type
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.distinct).toBe(true);
      expect(parsed.variables).toEqual(['?type']);
    });

    test('should parse SELECT *', () => {
      const query = `
        SELECT * WHERE {
          ?id rdf:type ?type
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.variables).toEqual(['*']);
    });
  });

  describe('FILTER expressions', () => {
    test('should parse FILTER with equals', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
          FILTER (?type = "Node")
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.filters).toHaveLength(1);
      expect(parsed.filters![0].type).toBe('equals');
      expect(parsed.filters![0].left).toBe('?type');
      expect(parsed.filters![0].right).toBe('"Node"');
    });

    test('should parse FILTER with not equals', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
          FILTER (?type != "Edge")
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.filters).toHaveLength(1);
      expect(parsed.filters![0].type).toBe('notEquals');
    });

    test('should parse FILTER with comparison', () => {
      const query = `
        SELECT ?id WHERE {
          ?id :hasValue ?value
          FILTER (?value > 10)
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.filters).toHaveLength(1);
      expect(parsed.filters![0].type).toBe('greaterThan');
    });
  });

  describe('ORDER BY', () => {
    test('should parse ORDER BY', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        ORDER BY ?id
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.orderBy).toHaveLength(1);
      expect(parsed.orderBy![0].variable).toBe('?id');
      expect(parsed.orderBy![0].direction).toBe('ASC');
    });

    test('should parse ORDER BY DESC', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        ORDER BY DESC(?id)
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.orderBy).toHaveLength(1);
      expect(parsed.orderBy![0].direction).toBe('DESC');
    });
  });

  describe('LIMIT and OFFSET', () => {
    test('should parse LIMIT', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        LIMIT 10
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.limit).toBe(10);
    });

    test('should parse OFFSET', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        OFFSET 20
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.offset).toBe(20);
    });

    test('should parse LIMIT and OFFSET together', () => {
      const query = `
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        LIMIT 10
        OFFSET 20
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.limit).toBe(10);
      expect(parsed.offset).toBe(20);
    });
  });

  describe('OPTIONAL patterns', () => {
    test('should parse OPTIONAL', () => {
      const query = `
        SELECT ?id ?label WHERE {
          ?id rdf:type ?type
          OPTIONAL { ?id rdfs:label ?label }
        }
      `;

      const parsed = SparqlParser.parse(query);

      expect(parsed.optional).toBeDefined();
      expect(parsed.optional!.length).toBeGreaterThan(0);
    });
  });
});

describe('SparqlExecutor', () => {
  const createTestTriples = (): RdfTriple[] => [
    {
      subject: 'http://example.org/node1',
      predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
      object: 'http://example.org/Node'
    },
    {
      subject: 'http://example.org/node2',
      predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
      object: 'http://example.org/Node'
    },
    {
      subject: 'http://example.org/node1',
      predicate: 'http://www.w3.org/2000/01/rdf-schema#label',
      object: 'Node 1'
    }
  ];

  describe('Basic execution', () => {
    test('should execute simple SELECT query', async () => {
      const triples = createTestTriples();
      const executor = new SparqlExecutor(triples);
      const parser = SparqlParser;

      const query = parser.parse(`
        SELECT ?id ?type WHERE {
          ?id rdf:type ?type
        }
      `);

      const result = await executor.execute(query);

      expect(result.results.bindings).toBeDefined();
      expect(result.results.bindings.length).toBeGreaterThan(0);
    });

    test('should apply DISTINCT', async () => {
      const triples = createTestTriples();
      const executor = new SparqlExecutor(triples);
      const parser = SparqlParser;

      const query = parser.parse(`
        SELECT DISTINCT ?type WHERE {
          ?id rdf:type ?type
        }
      `);

      const result = await executor.execute(query);

      // Should have unique types
      const types = result.results.bindings.map(b => b['?type']?.value);
      const uniqueTypes = [...new Set(types)];
      expect(types.length).toBe(uniqueTypes.length);
    });

    test('should apply LIMIT', async () => {
      const triples = createTestTriples();
      const executor = new SparqlExecutor(triples);
      const parser = SparqlParser;

      const query = parser.parse(`
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        LIMIT 1
      `);

      const result = await executor.execute(query);

      expect(result.results.bindings.length).toBeLessThanOrEqual(1);
    });

    test('should apply FILTER', async () => {
      const triples = createTestTriples();
      const executor = new SparqlExecutor(triples);
      const parser = SparqlParser;

      const query = parser.parse(`
        SELECT ?id WHERE {
          ?id rdf:type ?type
          FILTER (?type = "http://example.org/Node")
        }
      `);

      const result = await executor.execute(query);

      expect(result.results.bindings.length).toBeGreaterThan(0);
      // All results should match filter
      for (const binding of result.results.bindings) {
        expect(binding['?type']?.value).toBe('http://example.org/Node');
      }
    });
  });

  describe('ORDER BY execution', () => {
    test('should sort results', async () => {
      const triples = createTestTriples();
      const executor = new SparqlExecutor(triples);
      const parser = SparqlParser;

      const query = parser.parse(`
        SELECT ?id WHERE {
          ?id rdf:type ?type
        }
        ORDER BY ?id
      `);

      const result = await executor.execute(query);

      const ids = result.results.bindings.map(b => b['?id']?.value);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    });
  });
});
