import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Component Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Dashboard Component', () => {
    test('should display dashboard metrics', async ({ page }) => {
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Check for common dashboard elements
      await expect(page.locator('[data-testid="status-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible();
    });

    test('should update dashboard data in real-time', async ({ page }) => {
      await page.goto('/');
      
      // Wait for initial load
      await page.waitForTimeout(2000);
      
      // Check if dashboard shows loading state initially
      const dashboard = page.locator('[data-testid="dashboard"]');
      await expect(dashboard).toBeVisible();
      
      // Wait for potential real-time updates
      await page.waitForTimeout(3000);
      
      // Dashboard should still be visible and functional
      await expect(dashboard).toBeVisible();
    });
  });

  test.describe('Control Panel Component', () => {
    test('should display control buttons', async ({ page }) => {
      await expect(page.locator('[data-testid="control-panel"]')).toBeVisible();
      
      // At least some control buttons should be present
      const controlButtons = page.locator('[data-testid="control-panel"] button');
      await expect(controlButtons.first()).toBeVisible();
    });

    test('should handle button interactions', async ({ page }) => {
      const controlPanel = page.locator('[data-testid="control-panel"]');
      await expect(controlPanel).toBeVisible();
      
      // Find the first button in control panel
      const firstButton = controlPanel.locator('button').first();
      await expect(firstButton).toBeVisible();
      
      // Click the button and check for response
      await firstButton.click();
      
      // Wait for any potential state changes
      await page.waitForTimeout(1000);
      
      // The button should still be visible and functional
      await expect(firstButton).toBeVisible();
    });
  });

  test.describe('Dimensional Canvas Component', () => {
    test('should render dimensional visualization', async ({ page }) => {
      await expect(page.locator('[data-testid="dimensional-canvas"]')).toBeVisible();
      
      // Check for canvas or visualization elements
      const canvas = page.locator('canvas');
      const svg = page.locator('svg');
      
      // At least one visualization element should be present
      const hasCanvas = await canvas.count() > 0;
      const hasSvg = await svg.count() > 0;
      
      expect(hasCanvas || hasSvg).toBe(true);
    });

    test('should handle canvas interactions', async ({ page }) => {
      const canvas = page.locator('[data-testid="dimensional-canvas"]');
      await expect(canvas).toBeVisible();
      
      // Try to interact with the canvas
      await canvas.click({ position: { x: 100, y: 100 } });
      
      // Check for any response or state change
      await page.waitForTimeout(500);
      
      // Canvas should still be visible
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Quantum Visualization Components', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Quantum")');
    });

    test('should display quantum visualization', async ({ page }) => {
      await expect(page.locator('[data-testid="quantum-visualization"]')).toBeVisible();
      
      // Look for quantum-specific elements
      const quantumElements = page.locator('[data-testid*="quantum"], [data-testid*="qubit"], [data-testid*="circuit"]');
      await expect(quantumElements.first()).toBeVisible();
    });

    test('should display circuit builder', async ({ page }) => {
      await expect(page.locator('[data-testid="circuit-builder"]')).toBeVisible();
      
      // Look for circuit builder controls
      const circuitControls = page.locator('[data-testid="circuit-builder"] button, [data-testid="circuit-builder"] input');
      if (await circuitControls.count() > 0) {
        await expect(circuitControls.first()).toBeVisible();
      }
    });
  });

  test.describe('Agent Interface Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Agents")');
    });

    test('should display agent interface', async ({ page }) => {
      await expect(page.locator('[data-testid="agent-interface"]')).toBeVisible();
      
      // Look for agent-related elements
      const agentElements = page.locator('[data-testid*="agent"], [data-testid*="chat"], [data-testid*="message"]');
      await expect(agentElements.first()).toBeVisible();
    });

    test('should handle agent interactions', async ({ page }) => {
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      await expect(agentInterface).toBeVisible();
      
      // Look for input fields or buttons
      const inputField = agentInterface.locator('input, textarea').first();
      const button = agentInterface.locator('button').first();
      
      if (await inputField.count() > 0) {
        await expect(inputField).toBeVisible();
        await inputField.fill('Test message');
        await page.keyboard.press('Enter');
      } else if (await button.count() > 0) {
        await expect(button).toBeVisible();
        await button.click();
      }
      
      // Wait for any response
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Configuration Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Config")');
    });

    test('should display configuration options', async ({ page }) => {
      await expect(page.locator('[data-testid="configuration"]')).toBeVisible();
      
      // Look for form elements
      const formElements = page.locator('[data-testid="configuration"] input, [data-testid="configuration"] select, [data-testid="configuration"] button');
      await expect(formElements.first()).toBeVisible();
    });

    test('should handle configuration changes', async ({ page }) => {
      const config = page.locator('[data-testid="configuration"]');
      await expect(config).toBeVisible();
      
      // Find and interact with form elements
      const inputs = config.locator('input, select');
      
      for (let i = 0; i < Math.min(3, await inputs.count()); i++) {
        const input = inputs.nth(i);
        await expect(input).toBeVisible();
        
        if (await input.getAttribute('type') !== 'checkbox') {
          await input.fill('test-value');
        } else {
          await input.click();
        }
        
        await page.waitForTimeout(200);
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
      await page.click('button:has-text("Config")');
      
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
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test touch interactions
      const canvas = page.locator('[data-testid="dimensional-canvas"]');
      if (await canvas.count() > 0) {
        await canvas.tap();
        await page.waitForTimeout(500);
      }
      
      // Test navigation on mobile
      const firstTab = page.locator('button').first();
      await expect(firstTab).toBeVisible();
      await firstTab.tap();
      await page.waitForTimeout(500);
    });

    test('should handle interactions on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test that components are still interactive
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await expect(button).toBeVisible();
        await button.click();
        await page.waitForTimeout(500);
      }
    });
  });
});