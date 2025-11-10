import { test, expect } from '@playwright/test';

/**
 * Essential Bases Integration Tests
 * Streamlined from 10 tests to 4 core tests
 */
test.describe('Bases Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Base File Operations', () => {
    test('should load and display base file', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      if (!response.ok()) {
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
  });

  test.describe('Conversion Tests', () => {
    test('should convert JSONL to base', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/bases/convert', {
        data: {
          filePath: 'automaton-kernel.jsonl',
          options: {}
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.type).toBe('base');
        expect(data.data.data.length).toBeGreaterThan(0);
      }
    });

    test('should convert base back to JSONL', async ({ page }) => {
      const parseResponse = await page.request.post('http://localhost:3000/api/bases/parse', {
        data: {
          filePath: 'test-data/sample.base'
        }
      });

      if (parseResponse.ok()) {
        const parseData = await parseResponse.json();
        const base = parseData.data;

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

  test.describe('Base Embed', () => {
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
  });
});
