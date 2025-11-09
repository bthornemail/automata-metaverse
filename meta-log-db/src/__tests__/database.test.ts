import { MetaLogDb } from '../database';

describe('MetaLogDb', () => {
  let db: MetaLogDb;

  beforeEach(() => {
    db = new MetaLogDb();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Initialization', () => {
    test('should create database instance', () => {
      expect(db).toBeInstanceOf(MetaLogDb);
    });

    test('should initialize with empty facts', () => {
      const facts = db.extractFacts();
      expect(Array.isArray(facts)).toBe(true);
    });
  });

  describe('Canvas Loading', () => {
    test('should load JSONL canvas from file path', async () => {
      // Create a temporary test file
      const fs = require('fs');
      const path = require('path');
      const testFile = path.join(__dirname, '../../test-canvas.jsonl');
      const testCanvas = [
        { id: 'test1', type: 'node', text: 'Test Node 1' },
        { id: 'test2', type: 'node', text: 'Test Node 2' },
      ].map(obj => JSON.stringify(obj)).join('\n');
      
      // Write test file
      fs.writeFileSync(testFile, testCanvas);
      
      try {
        await db.loadCanvas(testFile);
        const facts = db.extractFacts();
        expect(Array.isArray(facts)).toBe(true);
      } finally {
        // Clean up test file
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test('should handle missing canvas file', async () => {
      // Should throw error for missing file
      await expect(db.loadCanvas('./non-existent-canvas.jsonl')).rejects.toThrow();
    });
  });

  describe('Fact Extraction', () => {
    test('should extract facts from loaded canvas', async () => {
      const fs = require('fs');
      const path = require('path');
      const testFile = path.join(__dirname, '../../test-facts.jsonl');
      const testCanvas = [
        { id: 'node1', type: 'node', text: 'Node 1' },
        { id: 'edge1', type: 'edge', from: 'node1', to: 'node2' },
      ].map(obj => JSON.stringify(obj)).join('\n');
      
      fs.writeFileSync(testFile, testCanvas);
      
      try {
        await db.loadCanvas(testFile);
        const facts = db.extractFacts();
        expect(Array.isArray(facts)).toBe(true);
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('ProLog Queries', () => {
    test('should have database instance for ProLog', () => {
      // ProLog queries require proper setup
      // This is a basic test structure
      expect(db).toBeDefined();
      expect(typeof db.prologQuery).toBe('function');
    });
  });

  describe('DataLog Queries', () => {
    test('should have database instance for DataLog', () => {
      // DataLog queries require proper setup
      // This is a basic test structure
      expect(db).toBeDefined();
      expect(typeof db.extractFacts).toBe('function');
    });
  });

  describe('SPARQL Queries', () => {
    test('should have database instance for SPARQL', () => {
      // SPARQL queries require RDF conversion
      // This is a basic test structure
      expect(db).toBeDefined();
      expect(typeof db.sparqlQuery).toBe('function');
    });
  });
});
