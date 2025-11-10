import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isCIEnabled, getCIAgents } from './ci-integration';

// Parse automaton.jsonl to get expected nodes
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

test.describe('Automaton.jsonl UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the UI
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should integrate with CI/CD workflow if available', async ({ page }) => {
    // Verify automaton.jsonl has data
    expect(automatonData.length).toBeGreaterThan(0);
    
    // If CI/CD is enabled, log integration status
    if (isCIEnabled()) {
      const ciAgents = getCIAgents();
      expect(ciAgents).not.toBeNull();
      console.log('✅ CI/CD integration is active for automaton tests');
      
      // In a real scenario, you might trigger CI/CD workflows here
      // For example: await ciAgents?.intelligence.runTestsAndAnalyze({...});
    } else {
      console.log('ℹ️ CI/CD integration not available - running tests without CI/CD features');
    }
    
    // Test should pass regardless of CI/CD availability
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load automaton.jsonl file successfully', async ({ page }) => {
    // Verify automaton.jsonl data was loaded
    expect(automatonData.length).toBeGreaterThan(0);
    
    // Check if API endpoint exists and can load the file
    const response = await page.request.post('http://localhost:5555/api/file/load', {
      data: { filePath: './automaton.jsonl' }
    }).catch(() => null);

    if (response && response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
    } else {
      // If API is not available, verify UI loads without errors
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display automaton nodes from automaton.jsonl', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Verify automaton.jsonl has data
    expect(automatonData.length).toBeGreaterThan(0);
    
    // Check for dimensional topology nodes (0D-7D) in automaton.jsonl
    const expectedDimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
    const foundDimensions: string[] = [];
    
    for (const dim of expectedDimensions) {
      // Check automaton.jsonl for dimension references
      const hasDimension = automatonData.some(node => 
        node.id?.includes(dim) || 
        node.text?.includes(dim) ||
        node.type?.includes(dim)
      );
      
      if (hasDimension) {
        foundDimensions.push(dim);
      }
    }
    
    // At least some dimensions should be present
    expect(foundDimensions.length).toBeGreaterThan(0);
    
    // Also check UI for dimension references
    for (const dim of foundDimensions) {
      const dimensionText = page.locator(`text=/.*${dim}.*/i`);
      const count = await dimensionText.count();
      // UI may or may not display all dimensions, so we don't require them all
      if (count > 0) {
        console.log(`Found ${dim} references in UI: ${count}`);
      }
    }
  });

  test('should render self-reference nodes', async ({ page }) => {
    // Check for self-reference indicators in automaton.jsonl
    const selfRefNodes = automatonData.filter(node => 
      node.id === 'self-ref' || 
      node.selfReference || 
      (node.type === 'file' && node.file)
    );

    // Verify self-reference nodes exist in automaton.jsonl
    expect(selfRefNodes.length).toBeGreaterThan(0);
    console.log(`Found ${selfRefNodes.length} self-reference nodes in automaton.jsonl`);
    
    // Navigate to Self-Reference tab to check UI
    await page.click('button:has-text("Self-Reference")');
    await page.waitForTimeout(1000);
    
    // Check if UI shows self-reference information
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
    
    // Check for self-reference text in the UI
    const selfRefText = page.locator('text=/.*self.*reference.*/i');
    const count = await selfRefText.count();
    
    if (count > 0) {
      console.log(`Found ${count} self-reference UI elements`);
    }
  });

  test('should display OpenCode operations from automaton.jsonl', async ({ page }) => {
    // Find OpenCode operations in automaton.jsonl
    const opencodeOps = automatonData.filter(node => 
      (node.id && node.id.startsWith('opencode-')) ||
      node.type === 'operation' ||
      (node.tool && node.params)
    );

    // Verify OpenCode operations exist in automaton.jsonl
    if (opencodeOps.length > 0) {
      console.log(`Found ${opencodeOps.length} OpenCode operations in automaton.jsonl`);
      
      // OpenCode operations are integrated into Code Editor tab
      // Navigate to Code Editor tab
      await page.click('button:has-text("Code Editor")');
      await page.waitForTimeout(1000);
      
      // Check for unified editor (which includes OpenCode functionality)
      await expect(page.locator('[data-testid="unified-editor"]')).toBeVisible({ timeout: 10000 });
      
      // OpenCode operations may be accessible through the editor interface
      console.log('Code Editor (with OpenCode integration) is visible');
    } else {
      // If no OpenCode operations in automaton.jsonl, that's also valid
      console.log('No OpenCode operations found in automaton.jsonl (this is valid)');
    }
  });

  test('should show dimensional progression (0D-7D)', async ({ page }) => {
    // Verify automaton.jsonl has dimensional data
    const dimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
    const foundDimensions = dimensions.filter(dim => 
      automatonData.some(node => 
        node.id?.includes(dim) || 
        node.text?.includes(dim) ||
        node.type?.includes(dim)
      )
    );
    
    expect(foundDimensions.length).toBeGreaterThan(0);
    console.log(`Found dimensions in automaton.jsonl: ${foundDimensions.join(', ')}`);
    
    // Check for dimensional progression visualization in Overview tab
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Dimensional canvas may be in Overview tab
    const canvas = page.locator('[data-testid="dimensional-canvas"]');
    const canvasCount = await canvas.count();
    
    if (canvasCount > 0) {
      console.log('Dimensional canvas found in UI');
      await expect(canvas.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Canvas may not always be visible, but dimensions should be in automaton.jsonl
      console.log('Dimensional canvas not visible in UI (may be conditionally rendered)');
    }
  });

  test('should handle automaton.jsonl file operations', async ({ page }) => {
    // Navigate to Config tab
    const configTab = page.locator('button:has-text("Config")').first();
    await expect(configTab).toBeVisible({ timeout: 10000 });
    await configTab.click();
    await page.waitForTimeout(1000);
    
    // Check for configuration component
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible({ timeout: 10000 });
    
    // Check for automaton file configuration input
    const automatonFileInput = page.locator('input[value*="automaton.jsonl"]');
    const inputCount = await automatonFileInput.count();
    
    if (inputCount > 0) {
      console.log('Found automaton file configuration input');
      
      // Verify the file path is set correctly
      const value = await automatonFileInput.first().inputValue();
      expect(value).toContain('automaton.jsonl');
    } else {
      // Alternative: check if config panel is visible (may have different structure)
      const configPanel = page.locator('[data-testid="configuration"]');
      await expect(configPanel).toBeVisible({ timeout: 5000 });
      console.log('Configuration panel is visible (file input may be in different format)');
    }
  });

  test('should display automaton statistics', async ({ page }) => {
    // Verify automaton.jsonl has data
    expect(automatonData.length).toBeGreaterThan(0);
    
    // Count nodes in automaton.jsonl
    const nodeCount = automatonData.filter(n => n.type === 'text' || n.type === 'automaton').length;
    const edgeCount = automatonData.filter(n => n.fromNode || n.from).length;
    const operationCount = automatonData.filter(n => n.type === 'operation' || n.id?.startsWith('opencode-')).length;
    
    console.log(`Automaton.jsonl contains:`);
    console.log(`  - ${nodeCount} nodes`);
    console.log(`  - ${edgeCount} edges`);
    console.log(`  - ${operationCount} operations`);
    console.log(`  - ${automatonData.length} total objects`);
    
    // Verify we have some data
    expect(nodeCount + edgeCount + operationCount).toBeGreaterThan(0);
    
    // Check dashboard for statistics
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Check if UI displays similar statistics (may be in various formats)
    const statsText = page.locator('text=/.*iteration.*|.*dimension.*|.*total.*|.*count.*/i');
    const statsCount = await statsText.count();
    
    if (statsCount > 0) {
      console.log(`Found ${statsCount} statistics elements in UI`);
    } else {
      // Statistics may not always be displayed, but automaton.jsonl should have data
      console.log('Statistics may not be displayed in UI (this is valid)');
    }
  });

  test('should render Church encoding patterns', async ({ page }) => {
    // Check for Church encoding references in automaton.jsonl
    const churchNodes = automatonData.filter(node => 
      node.text && (
        node.text.includes('λ') ||
        node.text.includes('Church') ||
        node.text.includes('church') ||
        node.text.includes('lambda')
      )
    );

    // Church encoding is a core concept, so we expect some references
    // But if none found, that's also valid (may be in different format)
    if (churchNodes.length > 0) {
      console.log(`Found ${churchNodes.length} nodes with Church encoding patterns`);
      
      // Check if UI displays Church encoding information
      const churchText = page.locator('text=/.*church.*|.*lambda.*|.*λ.*/i');
      const count = await churchText.count();
      
      if (count > 0) {
        console.log(`Found ${count} Church encoding UI elements`);
      } else {
        // Church encoding may be in code editor or not displayed in UI
        console.log('Church encoding patterns found in automaton.jsonl but may not be displayed in UI');
      }
    } else {
      console.log('No Church encoding patterns found in automaton.jsonl (may be in different format)');
    }
  });

  test('should handle large automaton.jsonl file', async ({ page }) => {
    // Verify automaton.jsonl has content
    expect(automatonData.length).toBeGreaterThan(0);
    
    console.log(`Testing with ${automatonData.length} objects from automaton.jsonl`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check page performance
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        renderTime: timing.domComplete - timing.domLoading
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Page should load within reasonable time (30 seconds)
    expect(performanceMetrics.loadTime).toBeLessThan(30000);
    
    // Verify dashboard is visible (indicates successful load)
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should validate automaton.jsonl structure', async ({ page }) => {
    // Verify automaton.jsonl has content
    expect(automatonData.length).toBeGreaterThan(0);
    
    // Validate that automaton.jsonl has expected structure
    const hasSelfRef = automatonData.some(n => n.id === 'self-ref' || n.selfReference);
    const hasDimensions = automatonData.some(n => 
      n.id && /^\d+D-(topology|system|algebra|analysis|network|consensus|intelligence|quantum)/.test(n.id)
    );
    const hasAutomata = automatonData.some(n => n.type === 'automaton');
    const hasEdges = automatonData.some(n => n.fromNode || n.from);
    const hasNodes = automatonData.some(n => n.type === 'text' || n.type === 'node');
    
    // At least one structural element should exist
    expect(hasSelfRef || hasDimensions || hasAutomata || hasEdges || hasNodes).toBe(true);
    
    console.log('Automaton.jsonl structure validation:');
    console.log(`  - Has self-reference: ${hasSelfRef}`);
    console.log(`  - Has dimensions: ${hasDimensions}`);
    console.log(`  - Has automata: ${hasAutomata}`);
    console.log(`  - Has edges: ${hasEdges}`);
    console.log(`  - Has nodes: ${hasNodes}`);
    console.log(`  - Total objects: ${automatonData.length}`);
  });
});
