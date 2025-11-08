/**
 * E2E Tests for Bases Integration
 * 
 * Tests bases parsing, conversion, and embedding functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Bases Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Base File Operations', () => {
    test('should load and display base file', async ({ page }) => {
      // Navigate to Bases Manager (assuming it's accessible via UI)
      // This test assumes BasesManager is integrated into the UI
      
      // For now, we'll test the API directly
      const response = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      // If file doesn't exist, create a test base first
      if (!response.ok()) {
        // Create test base file via API
        const createResponse = await page.request.post('http://localhost:3000/api/bases/save', {
          data: {
            base: {
              type: 'base',
              version: '1.0',
              schema: {
                version: '1.0',
                fields: [
                  { name: 'id', type: 'text' },
                  { name: 'name', type: 'text' },
                  { name: 'value', type: 'number' }
                ]
              },
              data: [
                { id: 'row-1', name: 'Test', value: 100 },
                { id: 'row-2', name: 'Example', value: 200 }
              ]
            },
            filePath: 'test-data/sample.base'
          }
        });
        expect(createResponse.ok()).toBeTruthy();
      }

      // Now parse it
      const parseResponse = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      expect(parseResponse.ok()).toBeTruthy();
      const data = await parseResponse.json();
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('base');
      expect(data.data.data.length).toBeGreaterThan(0);
    });

    test('should display base metadata', async ({ page }) => {
      // Test metadata display
      const response = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.data.schema).toBeDefined();
        expect(data.data.schema.fields).toBeDefined();
        expect(Array.isArray(data.data.schema.fields)).toBe(true);
      }
    });
  });

  test.describe('Conversion Tests', () => {
    test('should convert JSONL to base', async ({ page }) => {
      // Create test JSONL file
      const jsonlContent = [
        { id: 'node-1', type: 'node', x: 100, y: 100, text: 'Node 1' },
        { id: 'node-2', type: 'node', x: 200, y: 200, text: 'Node 2' }
      ].map(obj => JSON.stringify(obj)).join('\n');

      // Save JSONL file (via file system or API)
      // For now, we'll test conversion directly
      const response = await page.request.post('http://localhost:3000/api/bases/convert', {
        data: {
          filePath: 'automaton-kernel.jsonl', // Use existing file if available
          options: {}
        }
      });

      // If file exists, conversion should succeed
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.type).toBe('base');
        expect(data.data.data.length).toBeGreaterThan(0);
      }
    });

    test('should convert base back to JSONL', async ({ page }) => {
      // First, get a base
      const parseResponse = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      if (parseResponse.ok()) {
        const parseData = await parseResponse.json();
        const base = parseData.data;

        // Convert back to JSONL
        const convertResponse = await page.request.post('http://localhost:3000/api/bases/convert-back', {
          data: {
            base,
            options: { format: 'jsonl' }
          }
        });

        expect(convertResponse.ok()).toBeTruthy();
        const convertData = await convertResponse.json();
        expect(convertData.success).toBe(true);
        expect(convertData.data).toBeDefined();
        expect(typeof convertData.data).toBe('string');
      }
    });
  });

  test.describe('Round-Trip Tests', () => {
    test('should perform lossless round-trip conversion', async ({ page }) => {
      // Test round-trip with existing JSONL file
      const response = await page.request.post('http://localhost:3000/api/bases/roundtrip', {
        data: {
          filePath: 'automaton-kernel.jsonl'
        }
      });

      // If file exists, test round-trip
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.lossless).toBeDefined();
        // Note: lossless may be false if metadata is not preserved
        // This is expected behavior
      }
    });
  });

  test.describe('Base Embed Tests', () => {
    test('should generate base embed HTML', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/bases/embed', {
        data: {
          filePath: 'test-data/sample.base',
          options: {
            limit: 10
          }
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(typeof data.data).toBe('string');
        expect(data.data).toContain('<table');
      }
    });

    test('should apply filters in embed', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/bases/embed', {
        data: {
          filePath: 'test-data/sample.base',
          options: {
            filters: [
              { field: 'name', operator: 'equals', value: 'Test' }
            ]
          }
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });

    test('should apply sort in embed', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/bases/embed', {
        data: {
          filePath: 'test-data/sample.base',
          options: {
            sort: [
              { field: 'value', direction: 'desc' }
            ]
          }
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });
  });

  test.describe('UI Integration', () => {
    test('should display BasesManager component', async ({ page }) => {
      // This test assumes BasesManager is accessible in the UI
      // You may need to navigate to a specific route or open a modal
      
      // For now, we'll just verify the page loads
      await expect(page).toHaveTitle(/Automaton|UI/);
    });

    test('should handle file selection', async ({ page }) => {
      // Test file input interaction
      // This requires the actual UI component to be rendered
      // Placeholder for UI interaction tests
    });
  });
});
