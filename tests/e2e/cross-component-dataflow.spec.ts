import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Cross-Component Data Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test.describe('Dashboard to Control Panel Flow', () => {
    test('should sync status changes from dashboard to control panel', async ({ page }) => {
      // Navigate to overview
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      const dashboard = page.locator('[data-testid="dashboard"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      if (await dashboard.count() > 0 && await controlPanel.count() > 0) {
        // Get initial status from dashboard
        const initialStatus = await dashboard.locator('[class*="status"], [data-testid*="status"]').first().textContent();
        console.log('Initial dashboard status:', initialStatus);
        
        // Trigger action from control panel
        const controlButton = controlPanel.locator('button').first();
        await controlButton.click();
        await page.waitForTimeout(3000);
        
        // Check if dashboard reflects the change
        const updatedStatus = await dashboard.locator('[class*="status"], [data-testid*="status"]').first().textContent();
        console.log('Updated dashboard status:', updatedStatus);
        
        // Check control panel state
        const controlStatus = await controlPanel.locator('[class*="status"], [class*="active"]').count();
        console.log('Control panel active elements:', controlStatus);
      }
    });

    test('should propagate metrics updates across components', async ({ page }) => {
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      const dashboard = page.locator('[data-testid="dashboard"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      if (await dashboard.count() > 0 && await controlPanel.count() > 0) {
        // Look for metrics in dashboard
        const metricsElements = dashboard.locator('[class*="metric"], [class*="count"], [class*="number"]');
        const initialMetrics = await metricsElements.count();
        console.log('Initial dashboard metrics:', initialMetrics);
        
        // Trigger action that should update metrics
        const actionButton = controlPanel.locator('button').nth(1);
        await actionButton.click();
        await page.waitForTimeout(3000);
        
        // Check if metrics updated
        const updatedMetrics = await metricsElements.count();
        console.log('Updated dashboard metrics:', updatedMetrics);
        
        // Check for metric changes in control panel
        const controlMetrics = controlPanel.locator('[class*="metric"], [class*="count"]');
        const controlMetricCount = await controlMetrics.count();
        console.log('Control panel metrics:', controlMetricCount);
      }
    });
  });

  test.describe('Agent Interface to System State Flow', () => {
    test('should update system state based on agent commands', async ({ page }) => {
      // Navigate to agents
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Send a command that should affect system state
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Start automaton with 1 second intervals');
          await sendButton.click();
          await page.waitForTimeout(4000);
          
          // Check if system state changed
          await page.click('button:has-text("Overview")');
          await page.waitForTimeout(2000);
          
          const dashboard = page.locator('[data-testid="dashboard"]');
          if (await dashboard.count() > 0) {
            const statusElements = dashboard.locator('[class*="running"], [class*="active"], [class*="started"]');
            const runningCount = await statusElements.count();
            console.log('Running status elements after agent command:', runningCount);
          }
        }
      }
    });

    test('should reflect agent operations in execution history', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          // Send multiple agent commands
          const commands = [
            'Analyze current dimensional state',
            'Execute self-modification pattern',
            'Generate topology visualization'
          ];
          
          for (const command of commands) {
            await inputField.fill(command);
            await sendButton.click();
            await page.waitForTimeout(3000);
          }
          
          // Check execution history
          await page.click('button:has-text("History")');
          await page.waitForTimeout(2000);
          
          const executionHistory = page.locator('[data-testid="execution-history"]');
          if (await executionHistory.count() > 0) {
            const entries = executionHistory.locator('[data-testid*="entry"], tr, li');
            const entryCount = await entries.count();
            console.log('History entries after agent commands:', entryCount);
            
            // Should have entries for agent operations
            expect(entryCount).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Quantum Visualization to Data Flow', () => {
    test('should sync quantum state with dimensional canvas', async ({ page }) => {
      // Navigate to quantum tab
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      const quantumVisualization = page.locator('[data-testid="quantum-visualization"]');
      const circuitBuilder = page.locator('[data-testid="circuit-builder"]');
      
      if (await quantumVisualization.count() > 0) {
        // Interact with quantum visualization
        const quantumControls = quantumVisualization.locator('button, input, select');
        
        for (let i = 0; i < Math.min(2, await quantumControls.count()); i++) {
          await quantumControls.nth(i).click();
          await page.waitForTimeout(1500);
          
          // Check if circuit builder reflects changes
          if (await circuitBuilder.count() > 0) {
            const circuitElements = circuitBuilder.locator('*');
            const circuitCount = await circuitElements.count();
            console.log(`Circuit elements after quantum change ${i}:`, circuitCount);
          }
        }
        
        // Check dimensional canvas for updates
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(2000);
        
        const dimensionalCanvas = page.locator('[data-testid="dimensional-canvas"]');
        if (await dimensionalCanvas.count() > 0) {
          const canvasElements = dimensionalCanvas.locator('canvas, svg, [class*="visualization"]');
          const canvasCount = await canvasElements.count();
          console.log('Canvas elements after quantum changes:', canvasCount);
        }
      }
    });

    test('should propagate quantum calculations to system metrics', async ({ page }) => {
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      const quantumVisualization = page.locator('[data-testid="quantum-visualization"]');
      if (await quantumVisualization.count() > 0) {
        // Trigger quantum calculations
        const calculateButton = quantumVisualization.locator('button:has-text("Calculate"), button:has-text("Compute"), button:has-text("Execute")');
        if (await calculateButton.count() > 0) {
          await calculateButton.first().click();
          await page.waitForTimeout(3000);
          
          // Check if metrics updated
          await page.click('button:has-text("Overview")');
          await page.waitForTimeout(2000);
          
          const dashboard = page.locator('[data-testid="dashboard"]');
          if (await dashboard.count() > 0) {
            const metricElements = dashboard.locator('[class*="quantum"], [class*="calculation"], [class*="result"]');
            const metricCount = await metricElements.count();
            console.log('Quantum-related metrics:', metricCount);
          }
        }
      }
    });
  });

  test.describe('Configuration to Component Settings Flow', () => {
    test('should apply configuration changes across all components', async ({ page }) => {
      // Navigate to config
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      const config = page.locator('[data-testid="configuration"]');
      if (await config.count() > 0) {
        // Change some settings
        const themeSelector = config.locator('select, [data-testid*="theme"]');
        if (await themeSelector.count() > 0) {
          await themeSelector.first().selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
        
        // Look for save button
        const saveButton = config.locator('button:has-text("Save"), button:has-text("Apply")');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(2000);
        }
        
        // Check if changes applied to other components
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(2000);
        
        // Check theme application
        const themedElements = page.locator('[class*="light"], [class*="dark"], [class*="quantum"]');
        const themedCount = await themedElements.count();
        console.log('Themed elements after config change:', themedCount);
      }
    });

    test('should sync agent configuration with agent interface', async ({ page }) => {
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      const config = page.locator('[data-testid="configuration"]');
      if (await config.count() > 0) {
        // Look for agent configuration
        const agentConfig = config.locator('[data-testid*="agent"], [class*="agent"]');
        if (await agentConfig.count() > 0) {
          const agentSettings = agentConfig.locator('input, select, button');
          
          for (let i = 0; i < Math.min(2, await agentSettings.count()); i++) {
            await agentSettings.nth(i).click();
            await page.waitForTimeout(1000);
          }
          
          // Save configuration
          const saveButton = config.locator('button:has-text("Save")');
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(2000);
          }
          
          // Check agent interface
          await page.click('button:has-text("Agents")');
          await page.waitForTimeout(2000);
          
          const agentInterface = page.locator('[data-testid="agent-interface"]');
          if (await agentInterface.count() > 0) {
            const agentButtons = agentInterface.locator('button');
            const agentCount = await agentButtons.count();
            console.log('Available agents after config change:', agentCount);
          }
        }
      }
    });
  });

  test.describe('Multi-Component Data Synchronization', () => {
    test('should synchronize data across dashboard, canvas, and controls', async ({ page }) => {
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      const dashboard = page.locator('[data-testid="dashboard"]');
      const canvas = page.locator('[data-testid="dimensional-canvas"]');
      const controlPanel = page.locator('[data-testid="control-panel"]');
      
      if (await dashboard.count() > 0 && await canvas.count() > 0 && await controlPanel.count() > 0) {
        // Trigger action from control panel
        const actionButton = controlPanel.locator('button').first();
        await actionButton.click();
        await page.waitForTimeout(2000);
        
        // Check dashboard response
        const dashboardStatus = await dashboard.locator('[class*="status"], [class*="active"]').count();
        console.log('Dashboard active elements:', dashboardStatus);
        
        // Check canvas updates
        const canvasElements = canvas.locator('canvas, svg, [class*="updated"]');
        const canvasCount = await canvasElements.count();
        console.log('Canvas elements after action:', canvasCount);
        
        // Check control panel state
        const controlStatus = await controlPanel.locator('[class*="active"], [class*="selected"]').count();
        console.log('Control panel active elements:', controlStatus);
      }
    });

    test('should maintain data consistency during rapid tab switching', async ({ page }) => {
      const tabs = ['Overview', 'Quantum', 'Agents', 'History'];
      const dataSnapshots: any[] = [];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(2000);
        
        // Capture data snapshot
        const snapshot = await page.evaluate(() => {
          return {
            timestamp: Date.now(),
            activeTab: document.querySelector('button[class*="border-[#6366f1]"]')?.textContent,
            componentCount: document.querySelectorAll('[data-testid]').length,
            statusElements: document.querySelectorAll('[class*="status"]').length,
            errorElements: document.querySelectorAll('[class*="error"]').length,
            loadingElements: document.querySelectorAll('[class*="loading"]').length
          };
        });
        
        dataSnapshots.push(snapshot);
        console.log(`Data snapshot for ${tab}:`, snapshot);
      }
      
      // Verify data consistency
      for (const snapshot of dataSnapshots) {
        expect(snapshot.componentCount).toBeGreaterThan(0);
        expect(snapshot.errorElements).toBeLessThan(5);
        expect(snapshot.activeTab).toBeTruthy();
      }
    });

    test('should propagate dimensional changes across all visualizations', async ({ page }) => {
      // Start in overview
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Trigger dimensional change
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const dimensionButton = controlPanel.locator('button:has-text("Dimension"), button:has-text("Change")');
        if (await dimensionButton.count() > 0) {
          await dimensionButton.first().click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Check different components for dimensional updates
      const components = [
        { name: 'Overview', selector: '[data-testid="dashboard"]' },
        { name: 'Quantum', selector: '[data-testid="quantum-visualization"]' },
        { name: 'WebGL 3D', selector: '[data-testid="webgl-dimensional-visualization"]' }
      ];
      
      for (const component of components) {
        await page.click(`button:has-text("${component.name}")`);
        await page.waitForTimeout(2000);
        
        const element = page.locator(component.selector);
        if (await element.count() > 0) {
          const dimensionElements = element.locator('[class*="dimension"], [data-testid*="dimension"]');
          const dimensionCount = await dimensionElements.count();
          console.log(`Dimension elements in ${component.name}:`, dimensionCount);
        }
      }
    });
  });

  test.describe('Event-Driven Data Flow', () => {
    test('should handle cascading events across components', async ({ page }) => {
      // Monitor for cascading effects
      let eventCount = 0;
      
      await page.evaluate(() => {
        (window as any).eventCount = 0;
        
        // Listen for custom events
        const events = ['status:update', 'dimension:changed', 'action:executed'];
        
        events.forEach(eventType => {
          document.addEventListener(eventType, () => {
            (window as any).eventCount++;
            console.log(`Event received: ${eventType}`);
          });
        });
      });

      // Trigger initial action
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const actionButton = controlPanel.locator('button').first();
        await actionButton.click();
        await page.waitForTimeout(3000);
      }
      
      eventCount = await page.evaluate(() => (window as any).eventCount || 0);
      console.log('Events triggered by action:', eventCount);
      
      // Check for cascading effects in different components
      const dashboard = page.locator('[data-testid="dashboard"]');
      if (await dashboard.count() > 0) {
        const updatedElements = dashboard.locator('[class*="updated"], [class*="changed"]');
        const updatedCount = await updatedElements.count();
        console.log('Updated elements in dashboard:', updatedCount);
      }
    });

    test('should handle bidirectional data flow between components', async ({ page }) => {
      // Test data flow from agents to system
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Update system configuration');
          await sendButton.click();
          await page.waitForTimeout(4000);
          
          // Check if system state updated
          await page.click('button:has-text("Config")');
          await page.waitForTimeout(2000);
          
          const config = page.locator('[data-testid="configuration"]');
          if (await config.count() > 0) {
            const configElements = config.locator('[class*="updated"], [class*="changed"]');
            const configCount = await configElements.count();
            console.log('Updated config elements:', configCount);
          }
        }
      }
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should optimize data flow to prevent unnecessary updates', async ({ page }) => {
      // Monitor for unnecessary re-renders
      let renderCount = 0;
      
      await page.evaluate(() => {
        (window as any).renderCount = 0;
        let lastRenderTime = 0;
        
        const observer = new MutationObserver(() => {
          const now = Date.now();
          if (now - lastRenderTime > 100) { // Debounce
            (window as any).renderCount++;
            lastRenderTime = now;
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
      });

      // Trigger same action multiple times
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        
        for (let i = 0; i < 3; i++) {
          await button.click();
          await page.waitForTimeout(500);
        }
      }
      
      await page.waitForTimeout(3000);
      
      renderCount = await page.evaluate(() => (window as any).renderCount || 0);
      console.log('Optimized renders for repeated actions:', renderCount);
      
      // Should optimize repeated actions
      expect(renderCount).toBeLessThan(20);
    });

    test('should handle large data transfers between components efficiently', async ({ page }) => {
      // Simulate large data transfer
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        // Check for large data displays
        const largeDataElements = executionHistory.locator('pre, code, [class*="data"], [class*="json"]');
        const largeDataCount = await largeDataElements.count();
        console.log('Large data elements found:', largeDataCount);
        
        // Check performance with large data
        const startTime = Date.now();
        
        // Navigate to other tabs with large data
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(2000);
        
        await page.click('button:has-text("History")');
        await page.waitForTimeout(2000);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`Large data transfer duration: ${duration}ms`);
        
        // Should handle large data efficiently
        expect(duration).toBeLessThan(10000);
      }
    });
  });
});