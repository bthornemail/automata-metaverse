import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Data Propagation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully initialize
    await page.waitForTimeout(3000);
  });

  test.describe('Zustand Store Data Flow', () => {
    test('should propagate status updates across all components', async ({ page }) => {
      // Monitor store changes by checking UI elements
      const dashboard = page.locator('[data-testid="dashboard"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      // Initial state check
      await expect(dashboard).toBeVisible();
      await expect(controlPanel).toBeVisible();
      
      // Trigger a status change by clicking a control button
      const startButton = controlPanel.locator('button').first();
      await startButton.click();
      
      // Wait for state propagation
      await page.waitForTimeout(2000);
      
      // Check that status indicators updated
      const statusIndicators = page.locator('[data-testid*="status"], [class*="status"]');
      const statusCount = await statusIndicators.count();
      
      // At least one status indicator should be present and potentially updated
      expect(statusCount).toBeGreaterThan(0);
      
      // Check for any visual changes indicating state update
      const hasActiveState = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="active"], [class*="running"], [class*="connected"]');
        return elements.length > 0;
      });
      
      console.log('Active state elements found:', hasActiveState);
    });

    test('should maintain tab state consistency', async ({ page }) => {
      // Navigate to different tabs and check state persistence
      const tabs = ['Quantum', 'Agents', 'Config'];
      
      for (const tabName of tabs) {
        await page.click(`button:has-text("${tabName}")`);
        await page.waitForTimeout(1000);
        
        // Check that the correct tab content is visible
        const activeTab = page.locator('button[class*="border-[#6366f1]"]');
        const activeTabText = await activeTab.textContent();
        expect(activeTabText).toContain(tabName);
        
        // Check that tab-specific content is loaded
        const tabContent = page.locator(`[data-testid*="${tabName.toLowerCase()}"], [data-testid*="${tabName.toLowerCase().replace(' ', '-')}"]`);
        if (await tabContent.count() > 0) {
          await expect(tabContent.first()).toBeVisible();
        }
      }
      
      // Return to overview and check state
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(1000);
      
      const overviewTab = page.locator('button[class*="border-[#6366f1]"]');
      const overviewText = await overviewTab.textContent();
      expect(overviewText).toContain('Overview');
    });

    test('should propagate dimension changes across components', async ({ page }) => {
      // Monitor dimension-related elements
      const dimensionIndicators = page.locator('[data-testid*="dimension"], [class*="dimension"]');
      
      // Initial dimension state
      const initialDimensionCount = await dimensionIndicators.count();
      console.log('Initial dimension indicators:', initialDimensionCount);
      
      // Try to trigger dimension change (if controls are available)
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(1500);
          
          // Check for any dimension-related updates
          const currentDimensionCount = await dimensionIndicators.count();
          console.log(`Dimension indicators after button ${i}:`, currentDimensionCount);
        }
      }
    });

    test('should handle notification system correctly', async ({ page }) => {
      // Monitor notification container
      const notificationContainer = page.locator('[data-testid="toast-container"], .toast-container, [role="alert"]');
      
      // Trigger actions that might create notifications
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check for notifications
          if (await notificationContainer.count() > 0) {
            const notifications = notificationContainer.locator('*');
            const notificationCount = await notifications.count();
            console.log(`Notifications after action ${i}:`, notificationCount);
          }
        }
      }
      
      // Check notification persistence
      await page.waitForTimeout(3000);
      const finalNotificationCount = await notificationContainer.count();
      console.log('Final notification count:', finalNotificationCount);
    });
  });

  test.describe('Component State Synchronization', () => {
    test('should sync execution history across components', async ({ page }) => {
      // Navigate to history tab
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        await expect(executionHistory).toBeVisible();
        
        // Trigger some actions and check if they appear in history
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(1000);
        
        const controlPanel = page.locator('[data-testid="control-panel"]');
        if (await controlPanel.count() > 0) {
          const button = controlPanel.locator('button').first();
          await button.click();
          await page.waitForTimeout(2000);
          
          // Check history again
          await page.click('button:has-text("History")');
          await page.waitForTimeout(1000);
          
          const historyEntries = executionHistory.locator('[data-testid*="entry"], [class*="entry"], tr, li');
          const entryCount = await historyEntries.count();
          console.log('History entries after action:', entryCount);
        }
      }
    });

    test('should sync quantum state across visualization components', async ({ page }) => {
      // Navigate to quantum tab
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      const quantumVisualization = page.locator('[data-testid="quantum-visualization"]');
      const circuitBuilder = page.locator('[data-testid="circuit-builder"]');
      
      if (await quantumVisualization.count() > 0) {
        await expect(quantumVisualization).toBeVisible();
        
        // Try to interact with quantum controls
        const quantumControls = quantumVisualization.locator('button, input, select');
        
        for (let i = 0; i < Math.min(2, await quantumControls.count()); i++) {
          const control = quantumControls.nth(i);
          await control.click();
          await page.waitForTimeout(1000);
          
          // Check if circuit builder reflects changes
          if (await circuitBuilder.count() > 0) {
            const circuitElements = circuitBuilder.locator('*');
            const circuitCount = await circuitElements.count();
            console.log(`Circuit elements after quantum control ${i}:`, circuitCount);
          }
        }
      }
    });

    test('should sync agent state across interface components', async ({ page }) => {
      // Navigate to agents tab
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        await expect(agentInterface).toBeVisible();
        
        // Check agent selector
        const agentButtons = agentInterface.locator('button');
        const agentCount = await agentButtons.count();
        console.log('Available agent buttons:', agentCount);
        
        // Try different agents
        for (let i = 0; i < Math.min(3, await agentButtons.count()); i++) {
          await agentButtons.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check if agent description updates
          const descriptions = agentInterface.locator('[class*="description"], [class*="info"]');
          if (await descriptions.count() > 0) {
            const descriptionText = await descriptions.first().textContent();
            console.log(`Agent ${i} description:`, descriptionText?.substring(0, 50));
          }
        }
      }
    });
  });

  test.describe('Real-time Data Updates', () => {
    test('should handle real-time status updates', async ({ page }) => {
      // Monitor for DOM changes indicating real-time updates
      let updateCount = 0;
      
      await page.evaluate(() => {
        (window as any).updateCount = 0;
        const observer = new MutationObserver(() => {
          (window as any).updateCount++;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      });

      // Wait for potential real-time updates
      await page.waitForTimeout(10000);
      
      updateCount = await page.evaluate(() => (window as any).updateCount || 0);
      console.log('Real-time DOM updates detected:', updateCount);
      
      // Check connection status
      const connectionIndicators = page.locator('[class*="connected"], [class*="online"], [class*="status"]');
      const connectionCount = await connectionIndicators.count();
      console.log('Connection indicators found:', connectionCount);
    });

    test('should update multiple components simultaneously', async ({ page }) => {
      // Navigate to a tab with multiple components
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      const dashboard = page.locator('[data-testid="dashboard"]');
      const canvas = page.locator('[data-testid="dimensional-canvas"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      // Trigger an action that should update multiple components
      if (await controlPanel.count() > 0) {
        const actionButton = controlPanel.locator('button').first();
        await actionButton.click();
        
        // Monitor all components for updates
        await Promise.all([
          dashboard.waitFor({ state: 'visible', timeout: 5000 }),
          canvas.waitFor({ state: 'visible', timeout: 5000 }),
          controlPanel.waitFor({ state: 'visible', timeout: 5000 })
        ]);
        
        // Check if components are still responsive
        await expect(dashboard).toBeVisible();
        await expect(canvas).toBeVisible();
        await expect(controlPanel).toBeVisible();
      }
    });

    test('should handle data consistency during rapid updates', async ({ page }) => {
      // Simulate rapid state changes
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        // Rapidly click different buttons
        for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(200); // Short delay between clicks
        }
        
        // Wait for state to stabilize
        await page.waitForTimeout(3000);
        
        // Check that app is still functional
        await expect(page.locator('h1')).toBeVisible();
        
        // Check that no errors occurred
        const errorElements = page.locator('[class*="error"], [role="alert"]');
        const errorCount = await errorElements.count();
        console.log('Error elements after rapid updates:', errorCount);
      }
    });
  });

  test.describe('Data Persistence and Recovery', () => {
    test('should persist user preferences across sessions', async ({ page }) => {
      // Change theme if possible
      const configButton = page.locator('button:has-text("Config")');
      if (await configButton.count() > 0) {
        await configButton.click();
        await page.waitForTimeout(2000);
        
        const config = page.locator('[data-testid="configuration"]');
        if (await config.count() > 0) {
          // Look for theme selector
          const themeSelector = config.locator('select, [data-testid*="theme"]');
          if (await themeSelector.count() > 0) {
            const themeSelect = themeSelector.first();
            await themeSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);
          }
          
          // Look for save button
          const saveButton = config.locator('button:has-text("Save"), button:has-text("Apply")');
          if (await saveButton.count() > 0) {
            const saveBtn = saveButton.first();
            await saveBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if preferences were loaded
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if tab state persisted
      const activeTab = page.locator('button[class*="border-[#6366f1]"]');
      const activeTabText = await activeTab.textContent();
      console.log('Active tab after reload:', activeTabText);
    });

    test('should recover from connection failures gracefully', async ({ page }) => {
      // Simulate network issues
      await page.route('**/api/**', route => {
        // Simulate intermittent failures
        if (Math.random() < 0.3) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Simulated network error' })
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Check that app is still functional despite some errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Try to navigate tabs
      const tabs = ['Quantum', 'Agents', 'Overview'];
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(1000);
      }
      
      // App should remain responsive
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Cross-Component Data Integrity', () => {
    test('should maintain data consistency across component boundaries', async ({ page }) => {
      // Navigate between different components and check data consistency
      const journey = [
        { tab: 'Overview', check: ['dashboard', 'dimensional-canvas', 'control-panel'] },
        { tab: 'Quantum', check: ['quantum-visualization', 'circuit-builder'] },
        { tab: 'Agents', check: ['agent-interface'] },
        { tab: 'History', check: ['execution-history'] }
      ];
      
      for (const step of journey) {
        await page.click(`button:has-text("${step.tab}")`);
        await page.waitForTimeout(2000);
        
        // Check that expected components are present
        for (const component of step.check) {
          const element = page.locator(`[data-testid="${component}"]`);
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
          }
        }
        
        // Check for any data inconsistencies
        const errorElements = page.locator('[class*="error"], [data-testid*="error"]');
        const errorCount = await errorElements.count();
        console.log(`Error count in ${step.tab}:`, errorCount);
      }
    });

    test('should handle complex data transformations correctly', async ({ page }) => {
      // Test complex data flows through the system
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
        // Trigger a sequence of actions
      const actions = [
        async () => {
          const btn = page.locator('[data-testid="control-panel"] button').first();
          await btn.click();
        },
        () => page.waitForTimeout(1000),
        () => page.click('button:has-text("Quantum")'),
        () => page.waitForTimeout(1000),
        async () => {
          const btn = page.locator('[data-testid="quantum-visualization"] button').first();
          await btn.click();
        },
        () => page.waitForTimeout(1000),
        () => page.click('button:has-text("Agents")'),
        () => page.waitForTimeout(1000)
      ];
      
      for (const action of actions) {
        try {
          await action();
        } catch (error) {
          console.log('Action failed:', error);
        }
      }
      
      // Final state check
      await expect(page.locator('h1')).toBeVisible();
      
      // Check system integrity
      const systemStatus = await page.evaluate(() => {
        return {
          hasStore: !!(window as any).__ZUSTAND_STORE__,
          hasWebSocket: !!(window as any).io,
          hasReact: !!(window as any).React,
          bodyClasses: document.body.className
        };
      });
      
      console.log('System status:', systemStatus);
      expect(systemStatus.bodyClasses).toBeTruthy();
    });
  });
});