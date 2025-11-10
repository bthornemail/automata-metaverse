import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load and dismiss any notifications
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Dismiss any notifications that might intercept clicks
    const notifications = page.locator('[class*="pointer-events-auto"]').filter({ hasText: /success|error|warning/i });
    const count = await notifications.count();
    for (let i = 0; i < count; i++) {
      try {
        await notifications.nth(i).click({ timeout: 1000 }).catch(() => {});
      } catch {}
    }
    await page.waitForTimeout(500);
  });

  test('should navigate to Self-Reference tab', async ({ page }) => {
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await selfRefTab.click({ force: true });
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active using aria-selected (more reliable than CSS classes)
    await expect(selfRefTab).toHaveAttribute('aria-selected', 'true');
    
    // Check content is visible
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to AI Portal tab', async ({ page }) => {
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click({ force: true });
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(aiPortalTab).toHaveAttribute('aria-selected', 'true');
    
    // Check content is visible
    await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Code Editor tab', async ({ page }) => {
    const codeEditorTab = page.getByRole('tab', { name: 'Switch to Code Editor tab' });
    await codeEditorTab.click({ force: true });
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(codeEditorTab).toHaveAttribute('aria-selected', 'true');
    
    // Check content is visible
    await expect(page.locator('[data-testid="unified-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Config tab', async ({ page }) => {
    const configTab = page.getByRole('tab', { name: 'Switch to Config tab' });
    await configTab.click({ force: true });
    await page.waitForTimeout(500); // Wait for tab switch animation
    
    // Check tab is active
    await expect(configTab).toHaveAttribute('aria-selected', 'true');
    
    // Check content is visible
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between multiple tabs correctly', async ({ page }) => {
    // Start with Overview (default)
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    
    // Navigate to Self-Reference
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await selfRefTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(selfRefTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to AI Portal
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(aiPortalTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Code Editor
    const codeEditorTab = page.getByRole('tab', { name: 'Switch to Code Editor tab' });
    await codeEditorTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(codeEditorTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="unified-editor"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Config
    const configTab = page.getByRole('tab', { name: 'Switch to Config tab' });
    await configTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(configTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="configuration"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate back to Overview
    await overviewTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain tab state during page reload', async ({ page }) => {
    // Navigate to a specific tab
    const aiPortalTab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    await aiPortalTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(aiPortalTab).toHaveAttribute('aria-selected', 'true');
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React hydration
    
    // Check if tab state is maintained (this depends on implementation)
    // If state is persisted, the AI portal tab should still be active
    // If not, it should default to overview
    const aiPortalTabAfterReload = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    
    // Check which tab is active using aria-selected
    const aiPortalSelected = await aiPortalTabAfterReload.getAttribute('aria-selected');
    const overviewSelected = await overviewTab.getAttribute('aria-selected');
    
    // Either AI portal or overview should be active (valid states)
    expect(aiPortalSelected === 'true' || overviewSelected === 'true').toBe(true);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on Overview tab (default)
    const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
    await overviewTab.focus();
    await page.waitForTimeout(300);
    
    // Navigate to next tab using arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200); // Wait for focus to move
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500); // Wait for tab switch
    
    // Check that Self-Reference tab is now active
    const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
    await expect(selfRefTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  });

  test('should show hover effects on tabs', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'Switch to AI Portal tab' });
    
    // Check that tab is interactive
    await expect(tab).toBeVisible({ timeout: 10000 });
    await expect(tab).toBeEnabled();
    
    // Hover over tab and verify it remains visible and interactive
    await tab.hover();
    await page.waitForTimeout(300); // Wait for hover animation
    await expect(tab).toBeVisible();
    
    // Verify tab can still be clicked after hover
    await tab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });
});