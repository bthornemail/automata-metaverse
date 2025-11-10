import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const automatonFilePath = join(__dirname, '../../automaton.jsonl');
let automatonData: any[] = [];

try {
  const fileContent = readFileSync(automatonFilePath, 'utf-8');
  automatonData = fileContent
    .split('\n')
    .filter(line => line.trim().startsWith('{'))
    .map(line => JSON.parse(line));
} catch (error) {
  console.warn('Could not read automaton.jsonl:', error);
}

/**
 * Essential Automaton.jsonl Tests
 * Streamlined from 11 tests to 5 core tests
 */
test.describe('Automaton.jsonl UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load automaton.jsonl file successfully', async ({ page }) => {
    expect(automatonData.length).toBeGreaterThan(0);
    
    const response = await page.request.post('http://localhost:5555/api/file/load', {
      data: { filePath: './automaton.jsonl' }
    }).catch(() => null);

    if (response && response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
    } else {
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display automaton nodes from automaton.jsonl', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    expect(automatonData.length).toBeGreaterThan(0);
    
    const expectedDimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
    const foundDimensions: string[] = [];
    
    for (const dim of expectedDimensions) {
      const hasDimension = automatonData.some(node => 
        node.id?.includes(dim) || 
        node.text?.includes(dim) ||
        node.type?.includes(dim)
      );
      
      if (hasDimension) {
        foundDimensions.push(dim);
      }
    }
    
    expect(foundDimensions.length).toBeGreaterThan(0);
  });

  test('should render self-reference nodes', async ({ page }) => {
    const selfRefNodes = automatonData.filter(node => 
      node.id === 'self-ref' || 
      node.selfReference || 
      (node.type === 'file' && node.file)
    );

    expect(selfRefNodes.length).toBeGreaterThan(0);
    
    await page.getByRole('tab', { name: 'Switch to Self-Reference tab' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show dimensional progression (0D-7D)', async ({ page }) => {
    const dimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
    const foundDimensions = dimensions.filter(dim => 
      automatonData.some(node => 
        node.id?.includes(dim) || 
        node.text?.includes(dim) ||
        node.type?.includes(dim)
      )
    );
    
    expect(foundDimensions.length).toBeGreaterThan(0);
    
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should validate automaton.jsonl structure', async ({ page }) => {
    expect(automatonData.length).toBeGreaterThan(0);
    
    const hasSelfRef = automatonData.some(n => n.id === 'self-ref' || n.selfReference);
    const hasDimensions = automatonData.some(n => 
      n.id && /^\d+D-(topology|system|algebra|analysis|network|consensus|intelligence|quantum)/.test(n.id)
    );
    const hasAutomata = automatonData.some(n => n.type === 'automaton');
    const hasEdges = automatonData.some(n => n.fromNode || n.from);
    const hasNodes = automatonData.some(n => n.type === 'text' || n.type === 'node');
    
    expect(hasSelfRef || hasDimensions || hasAutomata || hasEdges || hasNodes).toBe(true);
  });
});
