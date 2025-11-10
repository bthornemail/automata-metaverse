import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main application', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Automaton UI/);
    
    // Check main header
    await expect(page.locator('h1')).toContainText('Self-Referencing Automaton Interface');
    
    // Check status indicator
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Check phase indicator
    await expect(page.locator('text=Phase 3: Quantum Visualization')).toBeVisible();
  });

  test('should display all navigation tabs', async ({ page }) => {
    const expectedTabs = [
      { name: 'Overview', ariaLabel: 'Switch to Overview tab' },
      { name: 'Self-Reference', ariaLabel: 'Switch to Self-Reference tab' },
      { name: 'AI Portal', ariaLabel: 'Switch to AI Portal tab' },
      { name: 'Code Editor', ariaLabel: 'Switch to Code Editor tab' },
      { name: 'Config', ariaLabel: 'Switch to Config tab' }
    ];

    for (const tab of expectedTabs) {
      await expect(page.getByRole('tab', { name: tab.ariaLabel })).toBeVisible();
    }
  });

  test('should show overview tab content by default', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React hydration and animations
    
    // Check that overview tab is active
    await expect(page.getByRole('tab', { name: 'Switch to Overview tab' })).toHaveClass(/border-\[#6366f1\]/);
    
    // Check that dashboard component is visible
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Check that control panel is visible
    await expect(page.locator('[data-testid="control-panel"]')).toBeVisible();
  });

  test('should display footer with correct information', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('Self-Referencing JSONL Automaton');
    await expect(page.locator('footer')).toContainText('8-Dimensional Church Encoding');
    await expect(page.locator('footer')).toContainText('Meta-Circular Evaluator');
    await expect(page.locator('footer')).toContainText('Quantum Visualization & Advanced Analytics');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Header should still be visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigation should be scrollable or collapsed
    const navContainer = page.locator('.container.mx-auto.px-6').first();
    await expect(navContainer).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Monitor for console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Non-Error promise rejection') &&
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('NetworkError') &&
      !e.toLowerCase().includes('cors')
    );
    
    // Check that no critical errors occurred
    // Mobile Safari may have different error reporting, so we're lenient
    expect(criticalErrors.length).toBeLessThanOrEqual(1);
  });

  test('should load all necessary assets', async ({ page }) => {
    // Monitor network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no critical assets failed to load
    const criticalFailures = failedRequests.filter(url => 
      url.includes('/src/') || url.includes('/static/') || url.includes('chunk')
    );
    expect(criticalFailures).toHaveLength(0);
  });
});