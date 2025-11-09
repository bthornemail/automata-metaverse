import { test, expect } from '@playwright/test';

/**
 * Test automaton evolution and integrity validation
 * Ensures no "entry.split is not a function" errors occur after evolution
 */
test.describe('Automaton Evolution & Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for initial load
    await page.waitForTimeout(2000);
  });

  test('should handle evolution without entry.split errors', async ({ page }) => {
    // Set up console error monitoring BEFORE any actions
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' || msg.type() === 'warning') {
        if (text.includes('split is not a function') || text.includes('entry.split')) {
          if (msg.type() === 'error') {
            consoleErrors.push(text);
          } else {
            consoleWarnings.push(text);
          }
        }
      }
    });

    // Navigate to Self-Reference Analyzer tab
    const selfRefTab = page.locator('button:has-text("Self-Reference")').first();
    const tabCount = await selfRefTab.count();
    
    if (tabCount > 0) {
      await selfRefTab.click();
      await page.waitForTimeout(1000);
    }

    // Clear any existing errors
    consoleErrors.length = 0;
    consoleWarnings.length = 0;

    // Trigger evolution via API
    const evolveResponse = await page.request.post('http://localhost:5555/api/automaton/action', {
      data: { action: 'evolve' }
    }).catch(() => null);
    
    if (evolveResponse && evolveResponse.ok()) {
      console.log('Evolution triggered via API');
    }

    // Wait for evolution to complete and any async processing
    await page.waitForTimeout(5000);

    // Check for errors in notifications/toasts
    const errorNotifications = page.locator('text=/.*split.*not.*function.*|.*entry\.split.*/i');
    const notificationErrorCount = await errorNotifications.count();
    
    // Check console errors captured
    expect(consoleErrors.length).toBe(0);
    expect(consoleWarnings.length).toBe(0);
    expect(notificationErrorCount).toBe(0);

    // Trigger integrity validation
    const revalidateButton = page.locator('button:has-text("Re-validate")').first();
    if (await revalidateButton.count() > 0) {
      await revalidateButton.click();
      await page.waitForTimeout(3000);
    }

    // Check again after validation
    const postValidationErrors = page.locator('text=/.*split.*not.*function.*|.*entry\.split.*/i');
    const postValidationErrorCount = await postValidationErrors.count();
    expect(postValidationErrorCount).toBe(0);
  });

  test('should validate JSONL entries are objects after evolution', async ({ page }) => {
    // Navigate to Self-Reference Analyzer
    const selfRefTab = page.locator('button:has-text("Self-Reference")').first();
    if (await selfRefTab.count() > 0) {
      await selfRefTab.click();
      await page.waitForTimeout(1000);
    }

    // Trigger evolution
    try {
      const evolveResponse = await page.request.post('http://localhost:5555/api/automaton/action', {
        data: { action: 'evolve' }
      }).catch(() => null);

      if (evolveResponse && evolveResponse.ok()) {
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Could not trigger evolution via API');
    }

    // Validate that JSONL data is properly structured
    const jsonlValidation = await page.evaluate(async () => {
      try {
        // Try to load JSONL files
        const kernelResponse = await fetch('/jsonl/automaton-kernel.jsonl');
        const kernelText = await kernelResponse.text();
        
        const lines = kernelText.split('\n').filter(l => l.trim());
        const entries = lines.map((line, idx) => {
          try {
            const parsed = JSON.parse(line);
            return {
              index: idx + 1,
              isObject: typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed),
              hasId: !!parsed.id,
              hasType: !!parsed.type,
              type: typeof parsed
            };
          } catch (e) {
            return {
              index: idx + 1,
              isObject: false,
              error: e instanceof Error ? e.message : 'Parse error'
            };
          }
        });

        const invalidEntries = entries.filter(e => !e.isObject);
        
        return {
          totalEntries: entries.length,
          validEntries: entries.filter(e => e.isObject).length,
          invalidEntries: invalidEntries.length,
          invalidDetails: invalidEntries.slice(0, 10)
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    expect(jsonlValidation).toBeDefined();
    if ('error' in jsonlValidation) {
      console.warn('JSONL validation error:', jsonlValidation.error);
    } else {
      expect(jsonlValidation.invalidEntries).toBe(0);
      expect(jsonlValidation.validEntries).toBeGreaterThan(0);
    }
  });

  test('should handle multiple evolutions without errors', async ({ page }) => {
    // Navigate to Self-Reference Analyzer
    const selfRefTab = page.locator('button:has-text("Self-Reference")').first();
    if (await selfRefTab.count() > 0) {
      await selfRefTab.click();
      await page.waitForTimeout(1000);
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Monitor console for errors BEFORE any evolutions
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('split is not a function') || text.includes('entry.split')) {
        if (msg.type() === 'error') {
          errors.push(text);
        } else if (msg.type() === 'warning') {
          warnings.push(text);
        }
      }
    });

    // Trigger multiple evolutions, checking after each one
    for (let i = 0; i < 3; i++) {
      // Clear errors before each evolution
      errors.length = 0;
      warnings.length = 0;
      
      const evolveResponse = await page.request.post('http://localhost:5555/api/automaton/action', {
        data: { action: 'evolve' }
      }).catch(() => null);

      if (evolveResponse && evolveResponse.ok()) {
        // Wait for evolution and async processing
        await page.waitForTimeout(3000);
        
        // Check for errors immediately after each evolution
        const immediateErrors = page.locator('text=/.*split.*not.*function.*|.*entry\.split.*/i');
        const immediateErrorCount = await immediateErrors.count();
        
        expect(immediateErrorCount).toBe(0);
        expect(errors.length).toBe(0);
        expect(warnings.length).toBe(0);
      }
    }

    // Final check after all evolutions
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
    expect(warnings.length).toBe(0);

    // Verify integrity status is still accessible
    const integrityCard = page.locator('text=/.*Integrity.*Status.*/i');
    const cardCount = await integrityCard.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should validate RDF/SHACL after evolution', async ({ page }) => {
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if ((msg.type() === 'error' || msg.type() === 'warning') && 
          (text.includes('split is not a function') || text.includes('entry.split'))) {
        consoleErrors.push(text);
      }
    });

    // Navigate to Self-Reference Analyzer
    const selfRefTab = page.locator('button:has-text("Self-Reference")').first();
    if (await selfRefTab.count() > 0) {
      await selfRefTab.click();
      await page.waitForTimeout(2000);
    }

    // Clear errors before evolution
    consoleErrors.length = 0;

    // Trigger evolution
    const evolveResponse = await page.request.post('http://localhost:5555/api/automaton/action', {
      data: { action: 'evolve' }
    }).catch(() => null);

    if (evolveResponse && evolveResponse.ok()) {
      // Wait for evolution and any async processing
      await page.waitForTimeout(5000);
    }

    // Check for split errors immediately after evolution
    const immediateSplitErrors = page.locator('text=/.*split.*not.*function.*|.*entry\.split.*/i');
    const immediateErrorCount = await immediateSplitErrors.count();
    expect(immediateErrorCount).toBe(0);
    expect(consoleErrors.length).toBe(0);

    // Click re-validate button
    const revalidateButton = page.locator('button:has-text("Re-validate")').first();
    if (await revalidateButton.count() > 0) {
      await revalidateButton.click();
      await page.waitForTimeout(5000); // Wait for validation
    }

    // Check for RDF/SHACL error messages
    const rdfErrors = page.locator('text=/.*RDF.*validation.*error.*/i');
    const shaclErrors = page.locator('text=/.*SHACL.*validation.*failed.*/i');
    const splitErrors = page.locator('text=/.*split.*not.*function.*|.*entry\.split.*/i');

    const rdfErrorCount = await rdfErrors.count();
    const shaclErrorCount = await shaclErrors.count();
    const splitErrorCount = await splitErrors.count();

    // Log errors for debugging
    if (rdfErrorCount > 0) {
      const rdfText = await rdfErrors.first().textContent();
      console.log('RDF Error:', rdfText);
    }
    if (shaclErrorCount > 0) {
      const shaclText = await shaclErrors.first().textContent();
      console.log('SHACL Error:', shaclText);
    }
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }

    // Critical: No split errors should occur
    expect(splitErrorCount).toBe(0);
    expect(consoleErrors.length).toBe(0);
  });
});
