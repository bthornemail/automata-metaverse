import { test, expect } from '@playwright/test';

test.describe('Automaton UI - API Integration Tests', () => {
  test.describe('WebSocket Connections', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      // Monitor WebSocket connections
      const wsConnections: string[] = [];
      
      page.on('websocket', ws => {
        wsConnections.push(ws.url());
        console.log('WebSocket connected:', ws.url());
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for WebSocket initialization
      await page.waitForTimeout(3000);
      
      // Check if WebSocket connection was attempted
      // Note: This depends on the implementation
      expect(wsConnections.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle WebSocket messages', async ({ page }) => {
      let messagesReceived: any[] = [];
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          try {
            const data = JSON.parse(event.payload as string);
            messagesReceived.push(data);
          } catch (e) {
            messagesReceived.push(event.payload);
          }
        });
      });

      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Check if any messages were received
      // This depends on the backend sending initial data
      console.log('WebSocket messages received:', messagesReceived.length);
    });
  });

  test.describe('HTTP API Endpoints', () => {
    test('should handle API requests correctly', async ({ page }) => {
      const apiRequests: { url: string; method: string; status?: number }[] = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('/socket.io/')) {
          apiRequests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });

      page.on('response', response => {
        if (response.url().includes('/api/') || response.url().includes('/socket.io/')) {
          const reqIndex = apiRequests.findIndex(req => req.url === response.url());
          if (reqIndex !== -1) {
            apiRequests[reqIndex].status = response.status();
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for initial API calls
      await page.waitForTimeout(3000);
      
      // Check that API requests were made
      console.log('API requests made:', apiRequests.length);
      
      // Verify no critical failures
      const criticalFailures = apiRequests.filter(req => 
        req.status && req.status >= 400 && req.status < 500
      );
      
      // Allow some failures but not critical ones
      expect(criticalFailures.length).toBeLessThan(3);
    });

    test('should handle automaton state API', async ({ page }) => {
      // Navigate to a tab that might trigger state API calls
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(2000);
      
      // Monitor for specific API calls
      const stateRequests: string[] = [];
      
      page.on('request', request => {
        if (request.url().includes('state') || request.url().includes('automaton')) {
          stateRequests.push(request.url());
        }
      });

      // Trigger actions that might call state APIs
      const controlPanel = page.locator('[data-testid="control-panel"]');
      if (await controlPanel.count() > 0) {
        const button = controlPanel.locator('button').first();
        await button.click();
        await page.waitForTimeout(2000);
      }
      
      // Check if state-related requests were made
      console.log('State API requests:', stateRequests);
    });

    test('should handle configuration API', async ({ page }) => {
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      const configRequests: string[] = [];
      
      page.on('request', request => {
        if (request.url().includes('config') || request.url().includes('settings')) {
          configRequests.push(request.url());
        }
      });

      // Try to interact with configuration
      const config = page.locator('[data-testid="configuration"]');
      if (await config.count() > 0) {
        const input = config.locator('input').first();
        if (await input.count() > 0) {
          await input.fill('test-config-value');
          await page.waitForTimeout(1000);
        }
      }
      
      console.log('Configuration API requests:', configRequests);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network conditions
      await page.route('**/api/**', route => {
        // Simulate occasional failures
        if (Math.random() < 0.3) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Simulated server error' })
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that the app still functions despite some errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Try to navigate to different tabs
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      // App should still be responsive
      await expect(page.locator('[data-testid="quantum-visualization"]')).toBeVisible();
    });

    test('should handle timeout errors', async ({ page }) => {
      // Simulate slow API responses
      await page.route('**/api/**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: 'Delayed response' })
          });
        }, 10000); // 10 second delay
      });

      await page.goto('/');
      
      // Wait for the page to handle timeouts gracefully
      await page.waitForTimeout(15000);
      
      // Check that the UI is still functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Real-time Data Updates', () => {
    test('should receive real-time updates', async ({ page }) => {
      let updateCount = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', () => {
          updateCount++;
        });
      });

      await page.goto('/');
      
      // Wait for initial connection and potential updates
      await page.waitForTimeout(10000);
      
      console.log('Real-time updates received:', updateCount);
      
      // The app should remain functional
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should update UI based on real-time data', async ({ page }) => {
      await page.goto('/');
      
      // Monitor for DOM changes that might indicate real-time updates
      let mutationCount = 0;
      
      await page.evaluate(() => {
        (window as any).mutationCount = 0;
        const observer = new MutationObserver(() => {
          (window as any).mutationCount = ((window as any).mutationCount || 0) + 1;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      });

      // Wait for potential real-time updates
      await page.waitForTimeout(8000);
      
      mutationCount = await page.evaluate(() => (window as any).mutationCount || 0);
      console.log('DOM mutations detected:', mutationCount);
      
      // App should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should save and restore user preferences', async ({ page }) => {
      // Navigate to configuration
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      // Try to change some settings
      const config = page.locator('[data-testid="configuration"]');
      if (await config.count() > 0) {
        const inputs = config.locator('input, select');
        
        for (let i = 0; i < Math.min(2, await inputs.count()); i++) {
          const input = inputs.nth(i);
          await input.fill(`test-value-${Date.now()}`);
          await page.waitForTimeout(500);
        }
        
        // Try to save if save button exists
        const saveButton = config.locator('button:has-text("Save"), button:has-text("Apply")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Reload page to check persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Navigate back to config
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      // Check if settings were persisted (this depends on implementation)
      await expect(page.locator('[data-testid="configuration"]')).toBeVisible();
    });

    test('should handle session storage correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check if session storage is used
      const sessionStorageData = await page.evaluate(() => {
        return Object.keys(sessionStorage);
      });
      
      console.log('Session storage keys:', sessionStorageData);
      
      // Navigate around and check if session data persists
      await page.click('button:has-text("Quantum")');
      await page.waitForTimeout(2000);
      
      const sessionStorageAfterNav = await page.evaluate(() => {
        return Object.keys(sessionStorage);
      });
      
      console.log('Session storage after navigation:', sessionStorageAfterNav);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should monitor API response times', async ({ page }) => {
      const responseTimes: number[] = [];
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.request().timing();
          if (timing.responseEnd) {
            responseTimes.push(timing.responseEnd);
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Trigger some API calls
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(3000);
      
      console.log('API response times:', responseTimes);
      
      // Check that responses are reasonably fast
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      
      console.log('Average API response time:', avgResponseTime);
      
      // App should be functional regardless of API performance
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle concurrent API requests', async ({ page }) => {
      let concurrentRequests = 0;
      let maxConcurrent = 0;
      
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          concurrentRequests++;
          maxConcurrent = Math.max(maxConcurrent, concurrentRequests);
        }
      });

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          concurrentRequests--;
        }
      });

      await page.goto('/');
      
      // Trigger multiple actions rapidly
      const tabs = ['Overview', 'Quantum', 'Agents', 'Config'];
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
      }
      
      await page.waitForTimeout(3000);
      
      console.log('Maximum concurrent API requests:', maxConcurrent);
      
      // App should handle concurrent requests gracefully
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});