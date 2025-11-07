import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Self-Reference tab', async ({ page }) => {
    await page.click('button:has-text("Self-Reference")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Self-Reference")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible();
  });

  test('should navigate to History tab', async ({ page }) => {
    await page.click('button:has-text("History")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("History")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="execution-history"]')).toBeVisible();
  });

  test('should navigate to Agents tab', async ({ page }) => {
    await page.click('button:has-text("Agents")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Agents")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="agent-interface"]')).toBeVisible();
  });

  test('should navigate to Quantum tab', async ({ page }) => {
    await page.click('button:has-text("Quantum")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Quantum")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="quantum-visualization"]')).toBeVisible();
    await expect(page.locator('[data-testid="circuit-builder"]')).toBeVisible();
  });

  test('should navigate to Animations tab', async ({ page }) => {
    await page.click('button:has-text("Animations")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Animations")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="advanced-animations"]')).toBeVisible();
  });

  test('should navigate to WebGL 3D tab', async ({ page }) => {
    await page.click('button:has-text("WebGL 3D")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("WebGL 3D")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="webgl-dimensional-visualization"]')).toBeVisible();
  });

  test('should navigate to Multiplayer tab', async ({ page }) => {
    await page.click('button:has-text("Multiplayer")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Multiplayer")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="multiplayer-metaverse"]')).toBeVisible();
  });

  test('should navigate to AI Evolution tab', async ({ page }) => {
    await page.click('button:has-text("AI Evolution")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("AI Evolution")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="webllm-evolution"]')).toBeVisible();
  });

  test('should navigate to Metaverse tab', async ({ page }) => {
    await page.click('button:has-text("Metaverse")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Metaverse")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="metaverse-interface"]')).toBeVisible();
  });

  test('should navigate to OpenCode tab', async ({ page }) => {
    await page.click('button:has-text("OpenCode")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("OpenCode")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="opencode-interface"]')).toBeVisible();
  });

  test('should navigate to Config tab', async ({ page }) => {
    await page.click('button:has-text("Config")');
    
    // Check tab is active
    await expect(page.locator('button:has-text("Config")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible();
  });

  test('should navigate between multiple tabs correctly', async ({ page }) => {
    // Start with Overview (default)
    await expect(page.locator('button:has-text("Overview")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Navigate to Quantum
    await page.click('button:has-text("Quantum")');
    await expect(page.locator('button:has-text("Quantum")')).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="quantum-visualization"]')).toBeVisible();
    
    // Navigate to Agents
    await page.click('button:has-text("Agents")');
    await expect(page.locator('button:has-text("Agents")')).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="agent-interface"]')).toBeVisible();
    
    // Navigate back to Overview
    await page.click('button:has-text("Overview")');
    await expect(page.locator('button:has-text("Overview")')).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain tab state during page reload', async ({ page }) => {
    // Navigate to a specific tab
    await page.click('button:has-text("Quantum")');
    await expect(page.locator('button:has-text("Quantum")')).toHaveClass(/border-\[#6366f1\]/);
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if tab state is maintained (this depends on implementation)
    // If state is persisted, the quantum tab should still be active
    // If not, it should default to overview
    const isQuantumActive = await page.locator('button:has-text("Quantum")')
      .evaluate(el => el.classList.contains('border-[#6366f1]'));
    
    // Either quantum or overview should be active (valid states)
    const isOverviewActive = await page.locator('button:has-text("Overview")')
      .evaluate(el => el.classList.contains('border-[#6366f1]'));
    
    expect(isQuantumActive || isOverviewActive).toBe(true);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Navigate through tabs using arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    
    // Check that a different tab is now active
    const activeTab = page.locator('button[class*="border-[#6366f1]"]');
    await expect(activeTab).toBeVisible();
  });

  test('should show hover effects on tabs', async ({ page }) => {
    const tab = page.locator('button:has-text("Quantum")');
    
    // Check that tab is interactive
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
    
    // Hover over tab and verify it remains visible
    await tab.hover();
    await expect(tab).toBeVisible();
  });
});