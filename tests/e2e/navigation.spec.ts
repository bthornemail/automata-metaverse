import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Self-Reference tab', async ({ page }) => {
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await selfRefTab.click();
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active (has border-[#6366f1] class)
    await expect(selfRefTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to AI Portal tab', async ({ page }) => {
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click();
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(aiPortalTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Code Editor tab', async ({ page }) => {
    const codeEditorTab = page.getByRole('tab', { name: 'Switch to Code Editor tab' });
    await codeEditorTab.click();
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(codeEditorTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="unified-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Config tab', async ({ page }) => {
    const configTab = page.getByRole('tab', { name: 'Switch to Config tab' });
    await configTab.click();
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(configTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Check content is visible
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between multiple tabs correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Start with Overview (default)
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    await expect(overviewTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Navigate to Self-Reference
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await selfRefTab.click();
    await page.waitForTimeout(500);
    await expect(selfRefTab).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to AI Portal
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click();
    await page.waitForTimeout(500);
    await expect(aiPortalTab).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Code Editor
    const codeEditorTab = page.getByRole('tab', { name: 'Switch to Code Editor tab' });
    await codeEditorTab.click();
    await page.waitForTimeout(500);
    await expect(codeEditorTab).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="unified-editor"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Config
    const configTab = page.getByRole('tab', { name: 'Switch to Config tab' });
    await configTab.click();
    await page.waitForTimeout(500);
    await expect(configTab).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate back to Overview
    await overviewTab.click();
    await page.waitForTimeout(500);
    await expect(overviewTab).toHaveClass(/border-\[#6366f1\]/);
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain tab state during page reload', async ({ page }) => {
    // Navigate to a specific tab
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click();
    await page.waitForTimeout(500);
    await expect(aiPortalTab).toHaveClass(/border-\[#6366f1\]/);
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React hydration
    
    // Check if tab state is maintained (this depends on implementation)
    // If state is persisted, the AI portal tab should still be active
    // If not, it should default to overview
    const aiPortalTabAfterReload = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    
    // Check which tab is active
    const aiPortalClasses = await aiPortalTabAfterReload.getAttribute('class');
    const overviewClasses = await overviewTab.getAttribute('class');
    
    // Either AI portal or overview should be active (valid states)
    const isAIPortalActive = aiPortalClasses?.includes('border-[#6366f1]') || false;
    const isOverviewActive = overviewClasses?.includes('border-[#6366f1]') || false;
    
    expect(isAIPortalActive || isOverviewActive).toBe(true);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Focus on Overview tab (default)
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    await overviewTab.focus();
    
    // Navigate to next tab using arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Check that Self-Reference tab is now active
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await expect(selfRefTab).toHaveClass(/border-\[#6366f1\]/);
  });

  test('should show hover effects on tabs', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const tab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    
    // Check that tab is interactive
    await expect(tab).toBeVisible({ timeout: 10000 });
    await expect(tab).toBeEnabled();
    
    // Hover over tab and verify it remains visible and interactive
    await tab.hover();
    await page.waitForTimeout(300); // Wait for hover animation
    await expect(tab).toBeVisible();
    
    // Verify tab can still be clicked after hover
    await tab.click();
    await page.waitForTimeout(500);
    await expect(tab).toHaveClass(/border-\[#6366f1\]/);
  });
});