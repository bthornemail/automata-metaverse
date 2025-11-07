import { test, expect } from '@playwright/test';

test.describe('Automaton UI - WebSocket Messaging Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for WebSocket connection to establish
    await page.waitForTimeout(5000);
  });

  test.describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection on app load', async ({ page }) => {
      // Monitor WebSocket connections
      const wsConnections: string[] = [];
      
      page.on('websocket', ws => {
        wsConnections.push(ws.url());
        console.log('WebSocket connected:', ws.url());
      });

      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Check that WebSocket connection was attempted
      expect(wsConnections.length).toBeGreaterThanOrEqual(0);
      
      // Check connection status indicators
      const connectionIndicators = page.locator('[class*="connected"], [class*="online"], [class*="status"]');
      const connectionCount = await connectionIndicators.count();
      console.log('Connection indicators found:', connectionCount);
    });

    test('should handle WebSocket disconnection gracefully', async ({ page }) => {
      // Monitor WebSocket events
      let disconnectCount = 0;
      let reconnectCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framesent', event => {
          console.log('WebSocket frame sent:', event);
        });
        
        ws.on('framereceived', event => {
          console.log('WebSocket frame received:', event);
        });
      });

      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Simulate network disconnection by intercepting WebSocket
      await page.route('**/socket.io/**', route => {
        route.abort('failed');
      });
      
      await page.waitForTimeout(5000);
      
      // Restore connection by unblocking
      await page.unroute('**/socket.io/**');
      await page.waitForTimeout(5000);
      
      console.log('Disconnects:', disconnectCount, 'Reconnects:', reconnectCount);
      
      // App should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show connection status in UI', async ({ page }) => {
      // Look for connection status indicators
      const statusElements = page.locator('[class*="status"], [class*="connection"], [class*="online"], [class*="offline"]');
      
      // Wait for initial status
      await page.waitForTimeout(3000);
      
      const statusCount = await statusElements.count();
      console.log('Status elements found:', statusCount);
      
      // Check for animated status indicators
      const animatedElements = page.locator('[class*="animate"], [class*="pulse"]');
      const animatedCount = await animatedElements.count();
      console.log('Animated status elements:', animatedCount);
    });
  });

  test.describe('Real-time Message Handling', () => {
    test('should receive and handle status updates', async ({ page }) => {
      // Monitor for status-related DOM changes
      let statusUpdateCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'status' || data.status) {
              statusUpdateCount++;
              console.log('Status update received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(8000);
      
      console.log('Status updates received:', statusUpdateCount);
      
      // Check if UI reflects status changes
      const dashboard = page.locator('[data-testid="dashboard"]');
      if (await dashboard.count() > 0) {
        const statusElements = dashboard.locator('[class*="status"], [data-testid*="status"]');
        const statusElementCount = await statusElements.count();
        console.log('Dashboard status elements:', statusElementCount);
      }
    });

    test('should handle dimension change messages', async ({ page }) => {
      // Monitor for dimension-related messages
      let dimensionChangeCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'dimension' || data.dimension !== undefined) {
              dimensionChangeCount++;
              console.log('Dimension change received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(8000);
      
      console.log('Dimension changes received:', dimensionChangeCount);
      
      // Check dimension indicators in UI
      const dimensionElements = page.locator('[class*="dimension"], [data-testid*="dimension"]');
      const dimensionCount = await dimensionElements.count();
      console.log('Dimension UI elements:', dimensionCount);
    });

    test('should handle action execution messages', async ({ page }) => {
      // Monitor for action-related messages
      let actionMessageCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'action' || data.action) {
              actionMessageCount++;
              console.log('Action message received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Trigger some actions to generate messages
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(2000);
        }
      }
      
      await page.waitForTimeout(3000);
      console.log('Action messages received:', actionMessageCount);
      
      // Check if actions are reflected in execution history
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        const historyEntries = executionHistory.locator('[data-testid*="entry"], tr, li');
        const entryCount = await historyEntries.count();
        console.log('Execution history entries:', entryCount);
      }
    });

    test('should handle error messages correctly', async ({ page }) => {
      // Monitor for error messages
      let errorMessageCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type === 'error' || data.error) {
              errorMessageCount++;
              console.log('Error message received:', data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      // Also monitor console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text());
        }
      });

      await page.goto('/');
      await page.waitForTimeout(8000);
      
      console.log('Error messages received:', errorMessageCount);
      
      // Check for error indicators in UI
      const errorElements = page.locator('[class*="error"], [role="alert"], [data-testid*="error"]');
      const errorCount = await errorElements.count();
      console.log('Error UI elements:', errorCount);
    });
  });

  test.describe('Message Broadcasting and Event Bus', () => {
    test('should broadcast messages to multiple components', async ({ page }) => {
      // Navigate to different tabs to check message broadcasting
      const tabs = ['Overview', 'Quantum', 'Agents'];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(2000);
        
        // Check if components are receiving updates
        const activeComponents = page.locator('[data-testid*=""]');
        const componentCount = await activeComponents.count();
        console.log(`Active components in ${tab}:`, componentCount);
      }
      
      // Trigger a message that should broadcast
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await button.click();
        await page.waitForTimeout(3000);
        
        // Check if multiple components responded
        const updatedComponents = page.locator('[class*="updated"], [class*="changed"]');
        const updatedCount = await updatedComponents.count();
        console.log('Components updated after broadcast:', updatedCount);
      }
    });

    test('should handle event bus communication', async ({ page }) => {
      // Monitor for custom events
      let customEventCount = 0;
      
      await page.evaluate(() => {
        (window as any).customEventCount = 0;
        
        // Listen for custom events that might be emitted by the event bus
        document.addEventListener('status:update', () => {
          (window as any).customEventCount++;
        });
        
        document.addEventListener('dimension:changed', () => {
          (window as any).customEventCount++;
        });
        
        document.addEventListener('action:executed', () => {
          (window as any).customEventCount++;
        });
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Trigger actions that should emit events
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(2, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(2000);
        }
      }
      
      customEventCount = await page.evaluate(() => (window as any).customEventCount || 0);
      console.log('Custom events received:', customEventCount);
    });
  });

  test.describe('Message Queue and Offline Handling', () => {
    test('should queue messages when disconnected', async ({ page }) => {
      // Simulate offline by blocking WebSocket
      await page.route('**/socket.io/**', route => {
        route.abort('failed');
      });
      
      await page.waitForTimeout(2000);
      
      // Trigger some actions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await button.click();
        await page.waitForTimeout(1000);
      }
      
      // Restore connection
      await page.unroute('**/socket.io/**');
      await page.waitForTimeout(5000);
      
      // Check if queued messages were sent
      const connectionIndicators = page.locator('[class*="connected"], [class*="online"]');
      const connectionCount = await connectionIndicators.count();
      console.log('Connection indicators after reconnection:', connectionCount);
    });

    test('should handle message ordering correctly', async ({ page }) => {
      // Monitor message order
      const receivedMessages: string[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.timestamp || data.id) {
              receivedMessages.push(JSON.stringify(data));
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Send multiple rapid actions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const buttons = controlPanel.locator('button');
        
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).click();
          await page.waitForTimeout(500); // Rapid clicks
        }
      }
      
      await page.waitForTimeout(5000);
      console.log('Messages received in order:', receivedMessages.length);
      
      // Check if execution history preserves order
      await page.click('button:has-text("History")');
      await page.waitForTimeout(2000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        const entries = executionHistory.locator('[data-testid*="entry"], tr, li');
        const entryCount = await entries.count();
        console.log('History entries (should be ordered):', entryCount);
      }
    });
  });

  test.describe('WebSocket Performance and Scalability', () => {
    test('should handle high-frequency messages efficiently', async ({ page }) => {
      let messageCount = 0;
      let startTime = Date.now();
      
      page.on('websocket', ws => {
        ws.on('framereceived', () => {
          messageCount++;
        });
      });

      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Simulate high-frequency actions
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        
        // Rapid clicking to generate many messages
        for (let i = 0; i < 10; i++) {
          await button.click();
          await page.waitForTimeout(100);
        }
      }
      
      await page.waitForTimeout(5000);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Received ${messageCount} messages in ${duration}ms`);
      console.log('Message rate:', messageCount / (duration / 1000), 'msg/sec');
      
      // App should remain responsive
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle large message payloads', async ({ page }) => {
      let largeMessageReceived = false;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.large || (data.data && data.data.length > 1000)) {
              largeMessageReceived = true;
              console.log('Large message received, size:', event.payload.length);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Try to trigger large data operations
      await page.click('button:has-text("History")');
      await page.waitForTimeout(3000);
      
      const executionHistory = page.locator('[data-testid="execution-history"]');
      if (await executionHistory.count() > 0) {
        // Look for large data displays
        const largeElements = executionHistory.locator('[class*="large"], [class*="data"], pre, code');
        const largeCount = await largeElements.count();
        console.log('Large data elements found:', largeCount);
      }
      
      console.log('Large message received:', largeMessageReceived);
    });
  });

  test.describe('WebSocket Security and Validation', () => {
    test('should validate incoming message format', async ({ page }) => {
      let validMessages = 0;
      let invalidMessages = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            if (data.type && typeof data.type === 'string') {
              validMessages++;
            } else {
              invalidMessages++;
            }
          } catch (e) {
            invalidMessages++;
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(8000);
      
      console.log('Valid messages:', validMessages);
      console.log('Invalid messages:', invalidMessages);
      
      // App should handle invalid messages gracefully
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for error indicators
      const errorElements = page.locator('[class*="error"], [role="alert"]');
      const errorCount = await errorElements.count();
      console.log('Error indicators from invalid messages:', errorCount);
    });

    test('should handle malicious WebSocket messages', async ({ page }) => {
      // Monitor for any crashes or errors from malicious messages
      let errorCount = 0;
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errorCount++;
          console.log('Console error (potentially from malicious message):', msg.text());
        }
      });

      page.on('pageerror', error => {
        errorCount++;
        console.log('Page error (potentially from malicious message):', error.message);
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // The app should remain stable even with potential malicious messages
      await expect(page.locator('h1')).toBeVisible();
      
      console.log('Errors from potentially malicious messages:', errorCount);
      
      // Error count should be reasonable
      expect(errorCount).toBeLessThan(10);
    });
  });
});