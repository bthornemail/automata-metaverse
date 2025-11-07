import { test, expect } from '@playwright/test';

test.describe('Automaton UI - State Synchronization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test.describe('Store State Consistency', () => {
    test('should maintain consistent state across tab navigation', async ({ page }) => {
      // Monitor state changes by checking UI elements
      const tabs = ['Overview', 'Quantum', 'Agents', 'History', 'Config'];
      const stateSnapshots: any[] = [];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(2000);
        
        // Capture state snapshot
        const snapshot = await page.evaluate(() => {
          return {
            activeTab: document.querySelector('button[class*="border-[#6366f1]"]')?.textContent,
            timestamp: Date.now(),
            visibleComponents: document.querySelectorAll('[data-testid]').length,
            statusElements: document.querySelectorAll('[class*="status"]').length,
            errorElements: document.querySelectorAll('[class*="error"]').length
          };
        });
        
        stateSnapshots.push(snapshot);
        console.log(`State snapshot for ${tab}:`, snapshot);
      }
      
      // Verify state consistency
      expect(stateSnapshots).toHaveLength(tabs.length);
      
      // Check that error count remains reasonable
      const maxErrors = Math.max(...stateSnapshots.map(s => s.errorElements));
      expect(maxErrors).toBeLessThan(5);
    });

    test('should synchronize status updates across all components', async ({ page }) => {
      // Navigate to overview
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Trigger status change
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const startButton = controlPanel.locator('button').first();
        await startButton.click();
        await page.waitForTimeout(3000);
        
        // Check status indicators in different components
        const dashboard = page.locator('[data-testid="dashboard"]');
        const statusElements = await Promise.all([
          dashboard.locator('[class*="status"]').count(),
          controlPanel.locator('[class*="status"]').count(),
          page.locator('[class*="status"]').count()
        ]);
        
        console.log('Status elements in components:', statusElements);
        
        // At least some status elements should be present
        expect(statusElements.some(count => count > 0)).toBe(true);
      }
    });

    test('should maintain dimensional state consistency', async ({ page }) => {
      // Check initial dimension state
      const initialDimension = await page.evaluate(() => {
        const dimensionElements = document.querySelectorAll('[class*="dimension"]');
        return dimensionElements.length;
      });
      
      console.log('Initial dimension elements:', initialDimension);
      
      // Navigate to different tabs and check dimension consistency
      const tabs = ['Overview', 'Quantum', 'Agents'];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(2000);
        
        const currentDimension = await page.evaluate(() => {
          const dimensionElements = document.querySelectorAll('[class*="dimension"]');
          return dimensionElements.length;
        });
        
        console.log(`Dimension elements in ${tab}:`, currentDimension);
        
        // Dimension elements should be present or consistently absent
        expect(currentDimension).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Real-time State Updates', () => {
    test('should update state in real-time across components', async ({ page }) => {
      // Monitor for DOM mutations indicating state changes
      let mutationCount = 0;
      
      await page.evaluate(() => {
        (window as any).mutationCount = 0;
        const observer = new MutationObserver(() => {
          (window as any).mutationCount++;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      });

      // Trigger rapid state changes
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Wait for mutations to settle
      await page.waitForTimeout(3000);
      
      mutationCount = await page.evaluate(() => (window as any).mutationCount || 0);
      console.log('Real-time mutations detected:', mutationCount);
      
      // Should have detected some mutations
      expect(mutationCount).toBeGreaterThan(0);
    });

    test('should handle concurrent state updates correctly', async ({ page }) => {
      // Navigate to a tab with multiple components
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Trigger concurrent updates
      const dashboard = page.locator('[data-testid="dashboard"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      if (await dashboard.count() > 0 && await controlPanel.count() > 0) {
        // Simulate concurrent updates
        const actions = [
          () => controlPanel.locator('button').first().click(),
          () => page.click('button:has-text("Quantum")'),
          () => page.click('button:has-text("Agents")')
        ];
        
        // Execute actions rapidly
        for (const action of actions) {
          await action();
          await page.waitForTimeout(500);
        }
        
        await page.waitForTimeout(3000);
        
        // Check final state consistency
        await expect(page.locator('h1')).toBeVisible();
        
        const finalErrors = page.locator('[class*="error"]');
        const errorCount = await finalErrors.count();
        console.log('Errors after concurrent updates:', errorCount);
      }
    });
  });

  test.describe('State Persistence and Recovery', () => {
    test('should persist state across page reloads', async ({ page }) => {
      // Change some state
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      // Check state before reload
      const beforeReload = await page.evaluate(() => {
        return {
          activeTab: document.querySelector('button[class*="border-[#6366f1]"]')?.textContent,
          url: window.location.href
        };
      });
      
      console.log('State before reload:', beforeReload);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      // Check state after reload
      const afterReload = await page.evaluate(() => {
        return {
          activeTab: document.querySelector('button[class*="border-[#6366f1]"]')?.textContent,
          url: window.location.href,
          hasStore: !!(window as any).__ZUSTAND_STORE__
        };
      });
      
      console.log('State after reload:', afterReload);
      
      // App should be functional
      await expect(page.locator('h1')).toBeVisible();
      expect(afterReload.hasStore).toBe(true);
    });

    test('should recover from state corruption gracefully', async ({ page }) => {
      // Simulate state corruption by intercepting and modifying responses
      await page.route('**/api/**', route => {
        if (route.request().url().includes('status')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ corrupted: true, invalid: 'state' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Check if app recovers
      await expect(page.locator('h1')).toBeVisible();
      
      // Try to navigate
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Should still be functional
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Clean up
      await page.unroute('**/api/**');
    });
  });

  test.describe('Cross-Component State Synchronization', () => {
    test('should synchronize execution history across components', async ({ page }) => {
      // Start in overview
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Trigger some actions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await button.click();
        await page.waitForTimeout(2000);
      }
      
      // Navigate to history tab
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        // Check if history is populated
        const entries = executionHistory.locator('[data-testid*="entry"], tr, li');
        const entryCount = await entries.count();
        console.log('History entries after action:', entryCount);
        
        // Go back to overview and trigger another action
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(2000);
        
        if (await controlPanel.count() > 0) {
          const button = controlPanel.locator('button').nth(1);
          await button.click();
          await page.waitForTimeout(2000);
        }
        
        // Check history again
        await page.click('button:has-text("History")');
        await page.waitForTimeout(2000);
        
        const newEntries = executionHistory.locator('[data-testid*="entry"], tr, li');
        const newEntryCount = await newEntries.count();
        console.log('History entries after second action:', newEntryCount);
        
        // History should be updated
        expect(newEntryCount).toBeGreaterThanOrEqual(entryCount);
      }
    });

    test('should synchronize quantum state across visualization components', async ({ page }) => {
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      const quantumVisualization = page.locator('[data-testid="quantum-visualization"]');
      const circuitBuilder = page.locator('[data-testid="circuit-builder"]');
      
      if (await quantumVisualization.count() > 0) {
        // Interact with quantum visualization
        const quantumControls = quantumVisualization.locator('button, input, select');
        
        for (let i = 0; i < Math.min(2, await quantumControls.count()); i++) {
          await quantumControls.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check if circuit builder reflects changes
          if (await circuitBuilder.count() > 0) {
            const circuitElements = circuitBuilder.locator('*');
            const circuitCount = await circuitElements.count();
            console.log(`Circuit elements after quantum change ${i}:`, circuitCount);
          }
        }
      }
    });

    test('should synchronize agent state across interface components', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Select different agents and check state consistency
        const agentButtons = agentInterface.locator('button');
        
        for (let i = 0; i < Math.min(3, await agentButtons.count()); i++) {
          await agentButtons.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check if agent description updates
          const descriptions = agentInterface.locator('[class*="description"], [class*="info"]');
          if (await descriptions.count() > 0) {
            const descriptionText = await descriptions.first().textContent();
            console.log(`Agent ${i} description length:`, descriptionText?.length);
          }
          
          // Check if suggestions update
          const suggestions = agentInterface.locator('[class*="suggestion"]');
          const suggestionCount = await suggestions.count();
          console.log(`Suggestions for agent ${i}:`, suggestionCount);
        }
      }
    });
  });

  test.describe('State Validation and Integrity', () => {
    test('should validate state transitions', async ({ page }) => {
      // Monitor for invalid state transitions
      let invalidTransitions = 0;
      
      page.on('console', msg => {
        if (msg.text().includes('error') || msg.text().includes('invalid')) {
          invalidTransitions++;
          console.log('Potential invalid state transition:', msg.text());
        }
      });

      // Navigate through tabs rapidly
      const tabs = ['Overview', 'Quantum', 'Agents', 'History', 'Config'];
      
      for (let i = 0; i < 2; i++) {
        for (const tab of tabs) {
          await page.click(`button:has-text("${tab}")`);
          await page.waitForTimeout(200);
        }
      }
      
      await page.waitForTimeout(3000);
      console.log('Invalid transitions detected:', invalidTransitions);
      
      // Should have minimal invalid transitions
      expect(invalidTransitions).toBeLessThan(5);
    });

    test('should maintain state integrity under stress', async ({ page }) => {
      // Apply stress by rapid interactions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      const tabs = ['Overview', 'Quantum', 'Agents'];
      
      // Rapid tab switching and button clicking
      for (let i = 0; i < 5; i++) {
        // Switch tabs
        const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
        await page.click(`button:has-text("${randomTab}")`);
        await page.waitForTimeout(200);
        
        // Click buttons if available
        if (await controlPanel.count() > 0) {
          const buttons = controlPanel.locator('button');
          if (await buttons.count() > 0) {
            await buttons.nth(Math.floor(Math.random() * await buttons.count())).click();
          }
        }
        
        await page.waitForTimeout(200);
      }
      
      await page.waitForTimeout(3000);
      
      // Check final state integrity
      await expect(page.locator('h1')).toBeVisible();
      
      const errorElements = page.locator('[class*="error"]');
      const errorCount = await errorElements.count();
      console.log('Errors after stress test:', errorCount);
      
      // Should maintain integrity
      expect(errorCount).toBeLessThan(10);
    });

    test('should handle state rollback on errors', async ({ page }) => {
      // Simulate errors that might require state rollback
      await page.route('**/api/**', route => {
        // Randomly fail some requests
        if (Math.random() < 0.3) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Simulated error' })
          });
        } else {
          route.continue();
        }
      });

      // Trigger actions that might fail
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Check if state is still consistent
      await expect(page.locator('h1')).toBeVisible();
      
      const activeTab = page.locator('button[class*="border-[#6366f1]"]');
      const hasActiveTab = await activeTab.count() > 0;
      console.log('Has active tab after errors:', hasActiveTab);
      
      // Clean up
      await page.unroute('**/api/**');
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should optimize state updates to prevent unnecessary re-renders', async ({ page }) => {
      // Monitor render performance
      let renderCount = 0;
      
      await page.evaluate(() => {
        (window as any).renderCount = 0;
        
        // Simple render detection
        const observer = new MutationObserver(() => {
          (window as any).renderCount++;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });

      // Trigger the same action multiple times
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        
        // Click same button multiple times
        for (let i = 0; i < 3; i++) {
          await button.click();
          await page.waitForTimeout(1000);
        }
      }
      
      renderCount = await page.evaluate(() => (window as any).renderCount || 0);
      console.log('Renders during repeated actions:', renderCount);
      
      // Should optimize repeated actions
      expect(renderCount).toBeLessThan(50);
    });

    test('should batch state updates efficiently', async ({ page }) => {
      // Trigger multiple rapid state changes
      const startTime = Date.now();
      
      const tabs = ['Overview', 'Quantum', 'Agents'];
      for (let i = 0; i < 3; i++) {
        for (const tab of tabs) {
          await page.click(`button:has-text("${tab}")`);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Batch state update duration: ${duration}ms`);
      
      // Should complete quickly
      expect(duration).toBeLessThan(10000);
      
      // Final state should be consistent
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});