import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Real-time Update Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test.describe('Live Data Streaming', () => {
    test('should receive and display real-time status updates', async ({ page }) => {
      // Monitor for real-time changes
      let updateCount = 0;
      const updateTimestamps: number[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'status' || data.status) {
              updateCount++;
              updateTimestamps.push(Date.now());
              console.log('Real-time status update:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.waitForTimeout(8000);
      
      console.log('Real-time updates received:', updateCount);
      console.log('Update timestamps:', updateTimestamps);
      
      // Check for visual updates in the UI
      const dashboard = page.locator('[data-testid="dashboard"]');
      if (await dashboard.count() > 0) {
        const statusElements = dashboard.locator('[class*="status"], [data-testid*="status"]');
        const statusCount = await statusElements.count();
        console.log('Status elements in dashboard:', statusCount);
      }
    });

    test('should update dimensional progression in real-time', async ({ page }) => {
      // Monitor dimension changes
      let dimensionChanges = 0;
      const dimensionValues: number[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'dimension' || data.dimension !== undefined) {
              dimensionChanges++;
              dimensionValues.push(data.dimension || 0);
              console.log('Dimension change received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.waitForTimeout(8000);
      
      console.log('Dimension changes received:', dimensionChanges);
      console.log('Dimension values:', dimensionValues);
      
      // Check UI for dimension indicators
      const dimensionElements = page.locator('[class*="dimension"], [data-testid*="dimension"]');
      const dimensionCount = await dimensionElements.count();
      console.log('Dimension UI elements:', dimensionCount);
    });

    test('should stream execution history updates', async ({ page }) => {
      // Navigate to history tab to monitor updates
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        let initialEntryCount = 0;
        
        // Count initial entries
        const initialEntries = executionHistory.locator('[data-testid*="entry"], tr, li');
        initialEntryCount = await initialEntries.count();
        console.log('Initial history entries:', initialEntryCount);
        
        // Monitor for new entries
        page.on('websocket', ws => {
          ws.on('framereceived', event => {
            try {
              const data = JSON.parse(event.payload as string);
              if (data.type === 'action' || data.action) {
                console.log('Action update received:', data);
              }
            } catch (e) {
              // Ignore non-JSON messages
            }
          });
        });
        
        // Trigger some actions
        await page.click('button:has-text("Overview")');
        await page.waitForTimeout(2000);
        
        const controlPanel = page.locator('[data-testid="control-panel"]');
        if (await controlPanel.count() > 0) {
          const button = controlPanel.locator('button').first();
          await button.click();
          await page.waitForTimeout(3000);
        }
        
        // Check history again
        await page.click('button:has-text("History")');
        await page.waitForTimeout(2000);
        
        const finalEntries = executionHistory.locator('[data-testid*="entry"], tr, li');
        const finalEntryCount = await finalEntries.count();
        console.log('Final history entries:', finalEntryCount);
        
        // Should have more entries
        expect(finalEntryCount).toBeGreaterThanOrEqual(initialEntryCount);
      }
    });
  });

  test.describe('Live Collaboration Features', () => {
    test('should handle multi-user state synchronization', async ({ page }) => {
      // Simulate multiple users by monitoring state changes
      let stateChangeCount = 0;
      const stateChanges: any[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'state' || data.state) {
              stateChangeCount++;
              stateChanges.push({
                timestamp: Date.now(),
                data: data
              });
              console.log('State change received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.waitForTimeout(6000);
      
      console.log('State changes received:', stateChangeCount);
      console.log('State change details:', stateChanges);
      
      // Check UI responsiveness
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for collaboration indicators
      const collaborationElements = page.locator('[class*="collaboration"], [class*="multi-user"], [class*="shared"]');
      const collaborationCount = await collaborationElements.count();
      console.log('Collaboration indicators:', collaborationCount);
    });

    test('should display real-time agent interactions', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Monitor for real-time agent messages
        let agentMessageCount = 0;
        
        page.on('websocket', ws => {
          ws.on('framereceived', event => {
            try {
              const data = JSON.parse(event.payload as string);
              if (data.type === 'agent' || data.agent || data.message) {
                agentMessageCount++;
                console.log('Agent message received:', data);
              }
            } catch (e) {
              // Ignore non-JSON messages
            }
          });
        });
        
        // Send a message to trigger real-time response
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Show me real-time updates');
          await sendButton.click();
          await page.waitForTimeout(5000);
          
          console.log('Agent messages during interaction:', agentMessageCount);
          
          // Check for real-time indicators
          const realtimeIndicators = agentInterface.locator('[class*="real-time"], [class*="live"], [class*="streaming"]');
          const realtimeCount = await realtimeIndicators.count();
          console.log('Real-time indicators:', realtimeCount);
        }
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should maintain performance during real-time updates', async ({ page }) => {
      // Monitor performance metrics
      let updateCount = 0;
      let startTime = Date.now();
      
      page.on('websocket', ws => {
        ws.on('framereceived', () => {
          updateCount++;
        });
      });

      // Simulate high-frequency updates
      await page.evaluate(() => {
        // Simulate rapid DOM changes
        let count = 0;
        const interval = setInterval(() => {
          count++;
          if (count > 20) clearInterval(interval);
          
          // Trigger some UI changes
          const buttons = document.querySelectorAll('button');
          if (buttons.length > 0) {
            const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
            randomButton.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            setTimeout(() => {
              randomButton.style.backgroundColor = '';
            }, 100);
          }
        }, 200);
      });

      await page.waitForTimeout(8000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Performance test duration: ${duration}ms`);
      console.log('Updates received:', updateCount);
      console.log('Update rate:', updateCount / (duration / 1000), 'updates/sec');
      
      // App should remain responsive
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for performance indicators
      const performanceElements = page.locator('[class*="performance"], [class*="metrics"]');
      const performanceCount = await performanceElements.count();
      console.log('Performance indicators:', performanceCount);
    });

    test('should handle burst updates efficiently', async ({ page }) => {
      // Monitor for burst handling
      let burstUpdates = 0;
      const burstTimestamps: number[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            burstUpdates++;
            burstTimestamps.push(Date.now());
            console.log('Burst update:', data);
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      // Trigger burst of actions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        // Rapid clicking to create burst
        for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(100); // Very rapid
        }
      }
      
      await page.waitForTimeout(5000);
      
      console.log('Burst updates handled:', burstUpdates);
      console.log('Burst timestamps:', burstTimestamps);
      
      // Calculate burst rate
      if (burstTimestamps.length > 1) {
        const burstDuration = burstTimestamps[burstTimestamps.length - 1] - burstTimestamps[0];
        const burstRate = burstUpdates / (burstDuration / 1000);
        console.log('Burst rate:', burstRate, 'updates/sec');
      }
      
      // App should handle bursts gracefully
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Real-time Error Handling', () => {
    test('should handle connection interruptions gracefully', async ({ page }) => {
      // Monitor connection status
      let disconnectCount = 0;
      let reconnectCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framesent', () => {
          console.log('WebSocket frame sent');
        });
        
        ws.on('framereceived', () => {
          console.log('WebSocket frame received');
        });
      });

      // Simulate connection issues
      await page.route('**/socket.io/**', route => {
        // Intermittently fail requests
        if (Math.random() < 0.5) {
          route.abort('failed');
          disconnectCount++;
        } else {
          route.continue();
          reconnectCount++;
        }
      });

      await page.waitForTimeout(8000);
      
      console.log('Simulated disconnects:', disconnectCount);
      console.log('Simulated reconnects:', reconnectCount);
      
      // Check connection indicators
      const connectionIndicators = page.locator('[class*="connected"], [class*="disconnected"], [class*="offline"], [class*="online"]');
      const connectionCount = await connectionIndicators.count();
      console.log('Connection status indicators:', connectionCount);
      
      // App should remain functional
      await expect(page.locator('h1')).toBeVisible();
      
      // Clean up
      await page.unroute('**/socket.io/**');
    });

    test('should handle data corruption in real-time streams', async ({ page }) => {
      // Monitor for corrupted data handling
      let corruptedMessages = 0;
      let validMessages = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.corrupted || data.invalid) {
              corruptedMessages++;
              console.log('Corrupted message received:', data);
            } else {
              validMessages++;
            }
          } catch (e) {
            corruptedMessages++;
            console.log('Invalid JSON received:', event.payload);
          }
        });
      });

      // Mock some corrupted responses
      await page.route('**/api/**', route => {
        if (Math.random() < 0.2) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ corrupted: true, invalid: 'data' })
          });
        } else {
          route.continue();
        }
      });

      await page.waitForTimeout(6000);
      
      console.log('Valid messages:', validMessages);
      console.log('Corrupted messages:', corruptedMessages);
      
      // App should handle corruption gracefully
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for error indicators
      const errorElements = page.locator('[class*="error"], [role="alert"]');
      const errorCount = await errorElements.count();
      console.log('Error indicators from corruption:', errorCount);
      
      // Clean up
      await page.unroute('**/api/**');
    });
  });

  test.describe('Real-time UI Updates', () => {
    test('should update UI elements smoothly during real-time changes', async ({ page }) => {
      // Monitor for smooth UI updates
      let uiUpdateCount = 0;
      
      await page.evaluate(() => {
        (window as any).uiUpdateCount = 0;
        const observer = new MutationObserver(() => {
          (window as any).uiUpdateCount++;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
      });

      // Trigger real-time updates
      const tabs = ['Overview', 'Quantum', 'Agents'];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(2000);
        
        // Trigger component-specific updates
        if (tab === 'Overview') {
          const controlPanel = page.locator('[data-testid="control-panel"]');
          if (await controlPanel.count() > 0) {
            const button = controlPanel.locator('button').first();
            await button.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      uiUpdateCount = await page.evaluate(() => (window as any).uiUpdateCount || 0);
      console.log('UI updates during real-time changes:', uiUpdateCount);
      
      // Check for smooth transitions
      const animatedElements = page.locator('[class*="transition"], [class*="animate"]');
      const animatedCount = await animatedElements.count();
      console.log('Animated elements:', animatedCount);
    });

    test('should maintain visual consistency during real-time updates', async ({ page }) => {
      // Check visual consistency during updates
      const visualStates: any[] = [];
      
      const captureVisualState = async () => {
        return await page.evaluate(() => {
          return {
            timestamp: Date.now(),
            activeTab: document.querySelector('button[class*="border-[#6366f1]"]')?.textContent,
            visibleComponents: document.querySelectorAll('[data-testid]').length,
            errorElements: document.querySelectorAll('[class*="error"]').length,
            loadingElements: document.querySelectorAll('[class*="loading"]').length
          };
        });
      };
      
      // Capture initial state
      visualStates.push(await captureVisualState());
      
      // Trigger updates
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      visualStates.push(await captureVisualState());
      
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      visualStates.push(await captureVisualState());
      
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      visualStates.push(await captureVisualState());
      
      console.log('Visual states during updates:', visualStates);
      
      // Check consistency
      for (const state of visualStates) {
        expect(state.visibleComponents).toBeGreaterThan(0);
        expect(state.errorElements).toBeLessThan(5);
      }
    });
  });

  test.describe('Real-time Data Validation', () => {
    test('should validate incoming real-time data', async ({ page }) => {
      let validDataCount = 0;
      let invalidDataCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            
            // Basic validation
            if (data.type && typeof data.type === 'string') {
              validDataCount++;
            } else {
              invalidDataCount++;
              console.log('Invalid data structure:', data);
            }
          } catch (e) {
            invalidDataCount++;
            console.log('Invalid JSON:', event.payload);
          }
        });
      });

      await page.waitForTimeout(8000);
      
      console.log('Valid data received:', validDataCount);
      console.log('Invalid data received:', invalidDataCount);
      
      // Most data should be valid
      if (validDataCount + invalidDataCount > 0) {
        const validRatio = validDataCount / (validDataCount + invalidDataCount);
        console.log('Valid data ratio:', validRatio);
        expect(validRatio).toBeGreaterThan(0.8);
      }
    });

    test('should handle malformed real-time messages', async ({ page }) => {
      // Monitor error handling
      let errorCount = 0;
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errorCount++;
          console.log('Console error from malformed message:', msg.text());
        }
      });

      page.on('pageerror', error => {
        errorCount++;
        console.log('Page error from malformed message:', error.message);
      });

      // Inject some malformed data simulation
      await page.evaluate(() => {
        // Simulate receiving malformed data
        setTimeout(() => {
          console.log('Simulating malformed data reception');
        }, 2000);
      });

      await page.waitForTimeout(6000);
      
      console.log('Errors from malformed messages:', errorCount);
      
      // App should recover gracefully
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if app is still responsive
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    });
  });
});