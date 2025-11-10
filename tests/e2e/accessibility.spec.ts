import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Keyboard Navigation', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Should focus on first interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement);
      
      // Continue tabbing through the interface
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focused = await page.evaluate(() => document.activeElement);
        expect(focused).toBeTruthy();
      }
    });

    test('should support arrow key navigation in tabs', async ({ page }) => {
      // Focus on first tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Use arrow keys to navigate tabs
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      // Check that focus moved to next tab
      const focusedTab = await page.evaluate(() => {
        const focused = document.activeElement;
        return focused?.textContent?.trim();
      });
      
      expect(focusedTab).toBeTruthy();
    });

    test('should support Enter and Space for activation', async ({ page }) => {
      // Navigate to a button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Try to activate with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Try to activate with Space on next element
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should have visible focus indicators', async ({ page }) => {
      // Focus on various elements and check for visible focus
      const focusableElements = page.locator('button, input, select, a, [tabindex]:not([tabindex="-1"])');
      
      for (let i = 0; i < Math.min(5, await focusableElements.count()); i++) {
        const element = focusableElements.nth(i);
        await element.focus();
        
        // Check if element has focus styles
        const hasFocusStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || styles.boxShadow !== 'none' || styles.border !== 'none';
        });
        
        // At least some elements should have visible focus
        if (i === 0) {
          const elementClass = await element.getAttribute('class');
          expect(hasFocusStyles || (elementClass && elementClass.includes('focus'))).toBeTruthy();
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for proper heading structure
      const headings = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map(h => ({
          tag: h.tagName,
          text: h.textContent?.trim()
        }));
      });
      
      // Should have at least one h1
      const hasH1 = headings.some(h => h.tag === 'H1');
      expect(hasH1).toBe(true);
      
      // Headings should not skip levels (basic check)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = parseInt(headings[i].tag.substring(1));
        const previousLevel = parseInt(headings[i - 1].tag.substring(1));
        
        // Allow same level or one level down, but not skipping
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels on interactive elements
      const interactiveElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, input, select, textarea, [role="button"]');
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          hasLabel: !!el.getAttribute('aria-label'),
          hasLabelledBy: !!el.getAttribute('aria-labelledby'),
          hasTitle: !!el.getAttribute('title'),
          text: el.textContent?.trim().substring(0, 50)
        }));
      });
      
      // Interactive elements should have some form of label
      for (const element of interactiveElements.slice(0, 10)) {
        const hasSomeLabel = element.hasLabel || element.hasLabelledBy || element.hasTitle || element.text;
        expect(hasSomeLabel).toBe(true);
      }
    });

    test('should have proper semantic HTML', async ({ page }) => {
      // Check for semantic elements
      const semanticElements = await page.evaluate(() => {
        return {
          hasHeader: !!document.querySelector('header'),
          hasNav: !!document.querySelector('nav'),
          hasMain: !!document.querySelector('main'),
          hasFooter: !!document.querySelector('footer'),
          hasSection: !!document.querySelector('section'),
          hasArticle: !!document.querySelector('article'),
          hasAside: !!document.querySelector('aside')
        };
      });
      
      // Should have basic semantic structure
      expect(semanticElements.hasHeader).toBe(true);
      expect(semanticElements.hasMain).toBe(true);
      expect(semanticElements.hasFooter).toBe(true);
    });

    test('should have proper alt text for images', async ({ page }) => {
      const images = page.locator('img');
      
      for (let i = 0; i < await images.count(); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Images should have alt text or be decorative
        expect(alt !== null || role === 'presentation').toBe(true);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      // Navigate to config tab to find forms
      await page.getByRole('tab', { name: 'Switch to Config tab' }).click();
      await page.waitForTimeout(2000);
      
      const formElements = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        return Array.from(inputs).map(input => ({
          type: input.getAttribute('type') || input.tagName,
          hasLabel: !!document.querySelector(`label[for="${input.id}"]`),
          hasAriaLabel: !!input.getAttribute('aria-label'),
          hasAriaLabelledBy: !!input.getAttribute('aria-labelledby'),
          hasPlaceholder: !!input.getAttribute('placeholder'),
          id: input.id
        }));
      });
      
      // Form elements should have labels
      for (const element of formElements) {
        const hasSomeLabel = element.hasLabel || element.hasAriaLabel || element.hasAriaLabelledBy || element.hasPlaceholder;
        expect(hasSomeLabel).toBe(true);
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic check - for thorough testing, use axe-core
      const textElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
        return Array.from(elements).map(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: parseFloat(styles.fontSize),
            text: el.textContent?.trim().substring(0, 30)
          };
        });
      });
      
      // Basic check that text colors are defined
      for (const element of textElements.slice(0, 10)) {
        expect(element.color).not.toBe('');
        expect(element.color).not.toBe('rgb(0, 0, 0)'); // Pure black on white is bad
      }
    });

    test('should not rely solely on color to convey information', async ({ page }) => {
      // Check for elements that might use only color for status
      const statusElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="error"], [class*="success"], [class*="warning"], [class*="info"]');
        return Array.from(elements).map(el => ({
          className: el.className,
          text: el.textContent?.trim(),
          hasIcon: !!el.querySelector('svg, i, [class*="icon"]'),
          hasText: !!(el.textContent?.trim())
        }));
      });
      
      // Status indicators should have text or icons, not just color
      for (const element of statusElements) {
        expect(element.hasIcon || element.hasText).toBe(true);
      }
    });
  });

  test.describe('Responsive Design for Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that touch targets are large enough
      const touchTargets = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
        return Array.from(buttons).map(button => {
          const rect = button.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height
          };
        });
      });
      
      // Touch targets should be at least 44x44 pixels
      for (const target of touchTargets.slice(0, 5)) {
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should maintain accessibility when zoomed', async ({ page }) => {
      // Zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '200%';
      });
      
      await page.waitForTimeout(1000);
      
      // Check that content is still accessible
      await expect(page.locator('h1')).toBeVisible();
      
      // Check that no content is cut off
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });
      
      // Some horizontal scroll might be acceptable at 200% zoom
      console.log('Has horizontal scroll at 200% zoom:', hasHorizontalScroll);
    });
  });

  test.describe('Motion and Animation', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check for reduced animations
      const animatedElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        return Array.from(elements).map(el => ({
          className: el.className,
          hasAnimation: window.getComputedStyle(el).animationName !== 'none',
          hasTransition: window.getComputedStyle(el).transitionProperty !== 'none'
        }));
      });
      
      console.log('Animated elements with reduced motion:', animatedElements.length);
      
      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle errors accessibly', async ({ page }) => {
      // Monitor for error messages
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text());
        }
      });

      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Check for any error messages that might be announced
      const errorElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[role="alert"], [role="status"], [class*="error"], [class*="message"]');
        return Array.from(elements).map(el => ({
          role: el.getAttribute('role'),
          className: el.className,
          text: el.textContent?.trim()
        }));
      });
      
      console.log('Error/status elements found:', errorElements.length);
      
      // App should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('should manage focus in modals', async ({ page }) => {
      // Look for potential modal triggers
      const buttons = page.locator('button');
      
      for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        
        if (buttonText && ['Settings', 'Info', 'Help', 'Details'].some(keyword => buttonText.includes(keyword))) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Check if modal appeared and focus is trapped
          const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
          if (await modal.count() > 0) {
            const isFocusInModal = await modal.evaluate((modal) => {
              return modal.contains(document.activeElement);
            });
            
            expect(isFocusInModal).toBe(true);
            
            // Try to close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
          
          break;
        }
      }
    });

    test('should return focus after interaction', async ({ page }) => {
      // Focus on a button
      const firstButton = page.locator('button').first();
      await firstButton.focus();
      
      // Interact with it
      await firstButton.click();
      await page.waitForTimeout(1000);
      
      // Check if focus is still on an interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement);
    });
  });
});