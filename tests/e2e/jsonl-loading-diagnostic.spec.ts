import { test, expect } from '@playwright/test';

test.describe('JSONL Loading Diagnostic', () => {
  test('should test JSONL loading from local files and API', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('jsonl') || request.url().includes('api')) {
        requests.push(`${request.method()} ${request.url()}`);
        console.log(`[Network] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('jsonl') || response.url().includes('api')) {
        console.log(`[Network Response] ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to UI
    console.log('Navigating to UI...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait a bit for initial load
    await page.waitForTimeout(2000);

    // Test 1: Check if local JSONL files are accessible
    console.log('\n=== Testing Local JSONL File Access ===');
    const localFileTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/jsonl/generate.metaverse.jsonl');
        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          hasContent: response.ok
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    console.log('Local file test result:', localFileTest);

    // Test 2: Check if API endpoint is accessible
    console.log('\n=== Testing API JSONL Endpoint ===');
    const apiTest = await page.evaluate(async () => {
      try {
        const apiUrl = (window as any).VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/jsonl/generate.metaverse.jsonl`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          apiSuccess: data.success,
          itemCount: data.data?.length || 0
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    console.log('API test result:', apiTest);

    // Test 3: Check browser console for JSONL loading messages
    console.log('\n=== Checking Console Logs ===');
    const consoleLogs = await page.evaluate(() => {
      // This won't capture logs from before, but we can check if there are any errors
      return {
        hasErrors: (window as any).consoleErrors || [],
        hasWarnings: (window as any).consoleWarnings || []
      };
    });
    console.log('Console state:', consoleLogs);

    // Test 4: Try to load JSONL via the database service
    console.log('\n=== Testing Database Service JSONL Loading ===');
    const dbServiceTest = await page.evaluate(async () => {
      try {
        // Simulate what the database service does
        // First try local
        let localSuccess = false;
        try {
          const localResponse = await fetch('/jsonl/generate.metaverse.jsonl');
          if (localResponse.ok) {
            const text = await localResponse.text();
            const lines = text.trim().split('\n').filter((l: string) => l.trim());
            localSuccess = lines.length > 0;
            console.log(`Local file loaded: ${lines.length} lines`);
          }
        } catch (e) {
          console.log('Local file failed:', e);
        }

        // Then try API
        let apiSuccess = false;
        try {
          const apiUrl = (window as any).VITE_API_URL || 'http://localhost:3000/api';
          const apiResponse = await fetch(`${apiUrl}/jsonl/generate.metaverse.jsonl`);
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            apiSuccess = data.success && data.data?.length > 0;
            console.log(`API loaded: ${data.data?.length || 0} items`);
          }
        } catch (e) {
          console.log('API failed:', e);
        }

        return {
          localSuccess,
          apiSuccess,
          working: localSuccess || apiSuccess
        };
      } catch (error: any) {
        return {
          error: error.message
        };
      }
    });
    console.log('Database service test result:', dbServiceTest);

    // Test 5: Check if UI components are trying to load JSONL
    console.log('\n=== Checking UI State ===');
    const uiState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasReactRoot: !!document.querySelector('#root'),
        hasApp: !!document.querySelector('[data-testid]'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    console.log('UI State:', uiState);

    // Summary
    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    console.log('Network Requests:', requests);
    console.log('Local File Access:', localFileTest.success ? '✅' : '❌');
    console.log('API Access:', apiTest.success ? '✅' : '❌');
    console.log('Database Service:', dbServiceTest.working ? '✅' : '❌');
    
    // Assertions
    expect(localFileTest.success || apiTest.success).toBe(true);
  });

  test('should verify JSONL files exist in public directory', async ({ page }) => {
    const files = [
      'generate.metaverse.jsonl',
      'automaton-kernel.jsonl',
      'automaton.jsonl',
      'r5rs-functions-trie.jsonl'
    ];

    for (const file of files) {
      const response = await page.request.get(`/jsonl/${file}`);
      console.log(`${file}: ${response.status()} ${response.statusText()}`);
      if (response.ok()) {
        const text = await response.text();
        const lines = text.trim().split('\n').filter(l => l.trim());
        console.log(`  ✓ ${lines.length} lines loaded`);
      } else {
        console.log(`  ✗ Failed to load`);
      }
    }
  });
});
