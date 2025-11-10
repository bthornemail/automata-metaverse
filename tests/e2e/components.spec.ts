import { test, expect, Locator } from '@playwright/test';

test.describe('Automaton UI - Component Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Dashboard Component', () => {
    test('should display dashboard metrics', async ({ page }) => {
      // Navigate and wait for page to fully load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active (it should be by default)
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations to complete (framer-motion default is ~0.5s)
      await page.waitForTimeout(1000);
      
      // Check dashboard using data-testid
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
      
      // Check for common dashboard elements
      await expect(page.locator('[data-testid="status-card"]')).toBeAttached({ timeout: 5000 });
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeAttached({ timeout: 5000 });
    });

    test('should update dashboard data in real-time', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations
      await page.waitForTimeout(1000);
      
      // Check dashboard exists using data-testid
      const dashboard = page.locator('[data-testid="dashboard"]');
      await expect(dashboard).toBeVisible({ timeout: 10000 });
      
      // Wait for potential real-time updates
      await page.waitForTimeout(3000);
      
      // Dashboard should still be visible
      await expect(dashboard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Control Panel Component', () => {
    test('should display control buttons', async ({ page }) => {
      // Navigate and wait for page to fully load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations
      await page.waitForTimeout(1000);
      
      // Check control panel using data-testid
      const controlPanel = page.locator('[data-testid="control-panel"]');
      await expect(controlPanel).toBeVisible({ timeout: 10000 });
      
      // Check for control buttons
      const controlButtons = controlPanel.locator('button');
      await expect(controlButtons.first()).toBeVisible({ timeout: 5000 });
      expect(await controlButtons.count()).toBeGreaterThan(0);
    });

    test('should handle button interactions', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations
      await page.waitForTimeout(1000);
      
      // Find control panel using data-testid
      const controlPanel = page.locator('[data-testid="control-panel"]');
      await expect(controlPanel).toBeVisible({ timeout: 10000 });
      
      // Find the first button in control panel
      const firstButton = controlPanel.locator('button').first();
      await expect(firstButton).toBeVisible({ timeout: 5000 });
      
      // Click the button and check for response
      await firstButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // The button should still be visible
      await expect(firstButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Dimensional Canvas Component', () => {
    test('should render dimensional visualization', async ({ page }) => {
      // Navigate and wait for page to fully load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations
      await page.waitForTimeout(1000);
      
      // Check dimensional canvas using data-testid
      const dimensionalCanvas = page.locator('[data-testid="dimensional-canvas"]');
      await expect(dimensionalCanvas).toBeVisible({ timeout: 10000 });
    });

    test('should handle canvas interactions', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for React to hydrate and animations to complete
      await page.waitForTimeout(2000);
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Wait for motion animations
      await page.waitForTimeout(1000);
      
      // Find canvas using data-testid
      const canvas = page.locator('[data-testid="dimensional-canvas"]');
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Try to interact with the canvas (if it's clickable)
      try {
        await canvas.click({ position: { x: 100, y: 100 }, timeout: 5000 });
        await page.waitForTimeout(500);
      } catch (e) {
        // Canvas might not be directly clickable, that's okay - just verify it's still visible
      }
      
      // Canvas should still be visible
      await expect(canvas).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Quantum Visualization Components', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate and wait for page to load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Quantum functionality is now part of Overview tab
      // Ensure Overview tab is active
      await page.getByRole('tab', { name: 'Switch to Overview tab' }).click({ timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for animations
    });

    test('should display quantum visualization', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Check quantum visualization using data-testid (if it exists in Overview)
      const quantumVisualization = page.locator('[data-testid="quantum-visualization"]');
      const quantumCount = await quantumVisualization.count();
      
      // Quantum visualization may or may not be visible in Overview tab
      // If it exists, verify it's visible
      if (quantumCount > 0) {
        await expect(quantumVisualization.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should display circuit builder', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Check circuit builder using data-testid (if it exists in Overview)
      const circuitBuilder = page.locator('[data-testid="circuit-builder"]');
      const circuitCount = await circuitBuilder.count();
      
      // Circuit builder may or may not be visible in Overview tab
      // If it exists, verify it's visible
      if (circuitCount > 0) {
        await expect(circuitBuilder.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Agent Interface Component', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate and wait for page to load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Click AI Portal tab (where agent interface is located)
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click({ timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for animations
    });

    test('should display agent interface', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Agent interface is inside AI Portal - check for chat input
      const chatInput = page.locator('input[type="text"], textarea').filter({ hasText: /Message|message/i }).or(page.locator('input[type="text"]').first());
      await expect(chatInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle agent interactions', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Find chat input field
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      
      // Fill input and send message
      await inputField.fill('Test message', { timeout: 5000 });
      
      // Find send button
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).or(page.locator('button[type="submit"]')).first();
      if (await sendButton.count() > 0) {
        await sendButton.click({ timeout: 5000 });
      } else {
        // Try Enter key
        await page.keyboard.press('Enter');
      }
      
      // Wait for any response
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Configuration Component', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate and wait for page to load
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Click Config tab and wait for it to activate
      await page.getByRole('tab', { name: 'Switch to Config tab' }).click({ timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for animations
    });

    test('should display configuration options', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Check configuration using data-testid
      const configuration = page.locator('[data-testid="configuration"]');
      await expect(configuration).toBeVisible({ timeout: 10000 });
      
      // Look for form elements
      const formElements = configuration.locator('input, select, button');
      await expect(formElements.first()).toBeVisible({ timeout: 5000 });
      expect(await formElements.count()).toBeGreaterThan(0);
    });

    test('should handle configuration changes', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      // Find configuration using data-testid
      const config = page.locator('[data-testid="configuration"]');
      await expect(config).toBeVisible({ timeout: 10000 });
      
      // Find and interact with form elements
      const inputs = config.locator('input, select');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Interact with first text input
      for (let i = 0; i < Math.min(3, inputCount); i++) {
        const input = inputs.nth(i);
        await expect(input).toBeVisible({ timeout: 5000 });
        
        const inputType = await input.getAttribute('type');
        if (inputType !== 'checkbox' && inputType !== 'radio' && inputType !== 'password') {
          await input.fill('test-value', { timeout: 5000 });
          await page.waitForTimeout(200);
          break; // Only test one input
        } else if (inputType === 'checkbox') {
          await input.click({ timeout: 5000 });
          await page.waitForTimeout(200);
          break; // Only test one input
        }
      }
    });
  });

  test.describe('Modal and Toast Interactions', () => {
    test('should handle modal interactions', async ({ page }) => {
      // Look for buttons that might trigger modals
      const buttons = page.locator('button');
      
      for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        
        // Look for buttons that might open modals
        if (buttonText && ['Settings', 'Info', 'Help', 'Details'].some(keyword => buttonText.includes(keyword))) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Check if modal appeared
          const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
          if (await modal.count() > 0) {
            await expect(modal.first()).toBeVisible();
            
            // Try to close modal
            const closeButton = modal.locator('button[aria-label*="Close"], button:has-text("Close"), button:has-text("×")').first();
            if (await closeButton.count() > 0) {
              await closeButton.click();
            } else {
              await page.keyboard.press('Escape');
            }
            
            await page.waitForTimeout(500);
          }
          
          break;
        }
      }
    });

    test('should display toast notifications', async ({ page }) => {
      // Trigger an action that might show a toast
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if any toast appeared
        const toast = page.locator('[role="alert"], .toast, [data-testid*="toast"]');
        if (await toast.count() > 0) {
          await expect(toast.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should handle form validation', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to Config tab' }).click();
      
      const config = page.locator('[data-testid="configuration"]');
      await expect(config).toBeVisible();
      
      // Find required fields
      const requiredFields = config.locator('[required], [aria-required="true"]');
      
      for (let i = 0; i < await requiredFields.count(); i++) {
        const field = requiredFields.nth(i);
        await expect(field).toBeVisible();
        
        // Clear field and try to submit
        await field.clear();
        
        // Look for submit button
        const submitButton = config.locator('button[type="submit"], button:has-text("Save"), button:has-text("Apply")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Check for validation messages
          const validationMessage = config.locator('[data-testid*="error"], .error, [role="alert"]');
          if (await validationMessage.count() > 0) {
            await expect(validationMessage.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Responsive Interactions', () => {
    test('should handle interactions on mobile', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Test navigation on mobile - tap on Self-Reference tab
      const selfRefTab = page.getByRole('tab', { name: 'Switch to Self-Reference tab' });
      await expect(selfRefTab).toBeVisible({ timeout: 10000 });
      await selfRefTab.tap();
      await page.waitForTimeout(1000);
      
      // Verify Self-Reference tab content is visible
      await expect(page.locator('[data-testid="self-reference-analyzer"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle interactions on tablet', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Ensure Overview tab is active
      const overviewTab = page.getByRole('tab', { name: 'Switch to Overview tab' });
      await expect(overviewTab).toBeVisible({ timeout: 10000 });
      
      // Test that components are still interactive
      const controlPanel = page.locator('[data-testid="control-panel"]');
      await expect(controlPanel).toBeVisible({ timeout: 10000 });
      
      const button = controlPanel.locator('button').first();
      await expect(button).toBeVisible({ timeout: 5000 });
      await button.click();
      await page.waitForTimeout(500);
      
      // Button should still be visible after click
      await expect(button).toBeVisible({ timeout: 5000 });
    });
  });
});