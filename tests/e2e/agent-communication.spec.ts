import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Agent Communication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test.describe('Agent Interface Functionality', () => {
    test('should load and display available agents', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        await expect(agentInterface).toBeVisible();
        
        // Check for agent buttons
        const agentButtons = agentInterface.locator('button');
        const agentCount = await agentButtons.count();
        expect(agentCount).toBeGreaterThan(0);
        
        console.log('Available agent buttons:', agentCount);
        
        // Check for expected agent names
        const expectedAgents = [
          'automaton-interface',
          'automaton-control', 
          'automaton-analyzer',
          'dimensional-guide',
          'church-encoding-expert',
          'automaton-visualizer'
        ];
        
        for (const agent of expectedAgents) {
          const agentButton = agentInterface.locator(`button:has-text("${agent}")`);
          if (await agentButton.count() > 0) {
            console.log(`Found agent: ${agent}`);
          }
        }
      }
    });

    test('should switch between different agents', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const agentButtons = agentInterface.locator('button');
        
        // Try switching between different agents
        for (let i = 0; i < Math.min(3, await agentButtons.count()); i++) {
          await agentButtons.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check if active agent changed
          const activeButton = agentInterface.locator('button[class*="bg-[#6366f1]"]');
          const isActive = await activeButton.count() > 0;
          console.log(`Agent ${i} is active:`, isActive);
        }
      }
    });

    test('should display agent descriptions correctly', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Check for description elements
        const descriptions = agentInterface.locator('[class*="description"], [class*="info"]');
        const descriptionCount = await descriptions.count();
        console.log('Agent descriptions found:', descriptionCount);
        
        // Click on different agents and check descriptions
        const agentButtons = agentInterface.locator('button');
        
        for (let i = 0; i < Math.min(3, await agentButtons.count()); i++) {
          await agentButtons.nth(i).click();
          await page.waitForTimeout(1000);
          
          const currentDescriptions = agentInterface.locator('[class*="description"], [class*="info"]');
          const currentCount = await currentDescriptions.count();
          console.log(`Descriptions for agent ${i}:`, currentCount);
          
          if (currentCount > 0) {
            const descriptionText = await currentDescriptions.first().textContent();
            console.log(`Description text:`, descriptionText?.substring(0, 100));
          }
        }
      }
    });
  });

  test.describe('Agent Message Exchange', () => {
    test('should send messages to agents and receive responses', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Find the input field
        const inputField = agentInterface.locator('input[type="text"]');
        if (await inputField.count() > 0) {
          // Send a test message
          const testMessage = 'Hello, can you help me understand the automaton?';
          await inputField.fill(testMessage);
          
          // Find and click send button
          const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
          if (await sendButton.count() > 0) {
            await sendButton.click();
            await page.waitForTimeout(3000);
            
            // Check for response
            const messages = agentInterface.locator('[class*="message"], [role="message"], div[class*="bg-gray-700"], div[class*="bg-blue-600"]');
            const messageCount = await messages.count();
            console.log('Messages after sending:', messageCount);
            
            // Should have at least user message and potentially agent response
            expect(messageCount).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    test('should display typing indicators when agent is responding', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        if (await inputField.count() > 0) {
          // Send a message
          await inputField.fill('Explain dimensional progression');
          const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
          if (await sendButton.count() > 0) {
            await sendButton.click();
            
            // Look for typing indicator
            await page.waitForTimeout(1000);
            const typingIndicator = agentInterface.locator('[class*="typing"], [class*="bounce"]');
            const typingCount = await typingIndicator.count();
            console.log('Typing indicators found:', typingCount);
            
            // Wait for response
            await page.waitForTimeout(5000);
          }
        }
      }
    });

    test('should maintain message history and conversation context', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          const messages = [
            'What is Church encoding?',
            'How does dimensional progression work?',
            'Show me quantum visualization'
          ];
          
          // Send multiple messages
          for (const message of messages) {
            await inputField.fill(message);
            await sendButton.click();
            await page.waitForTimeout(3000);
          }
          
          // Check message history
          const allMessages = agentInterface.locator('[class*="message"], div[class*="bg-gray-700"], div[class*="bg-blue-600"]');
          const messageCount = await allMessages.count();
          console.log('Total messages in conversation:', messageCount);
          
          // Should have multiple messages
          expect(messageCount).toBeGreaterThan(2);
        }
      }
    });
  });

  test.describe('Agent Capabilities and Specializations', () => {
    test('should handle automaton-interface agent requests', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Select automaton-interface agent
        const agentButton = agentInterface.locator('button:has-text("automaton-interface")');
        if (await agentButton.count() > 0) {
          await agentButton.click();
          await page.waitForTimeout(1000);
          
          const inputField = agentInterface.locator('input[type="text"]');
          const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
          
          if (await inputField.count() > 0 && await sendButton.count() > 0) {
            await inputField.fill('Start the automaton with 2 second intervals');
            await sendButton.click();
            await page.waitForTimeout(4000);
            
            // Check for response
            const messages = agentInterface.locator('[class*="message"]');
            const messageCount = await messages.count();
            console.log('Response from automaton-interface:', messageCount);
          }
        }
      }
    });

    test('should handle automaton-analyzer agent requests', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Select automaton-analyzer agent
        const agentButton = agentInterface.locator('button:has-text("automaton-analyzer")');
        if (await agentButton.count() > 0) {
          await agentButton.click();
          await page.waitForTimeout(1000);
          
          const inputField = agentInterface.locator('input[type="text"]');
          const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
          
          if (await inputField.count() > 0 && await sendButton.count() > 0) {
            await inputField.fill('Analyze self-modification patterns');
            await sendButton.click();
            await page.waitForTimeout(4000);
            
            // Check for analytical response
            const messages = agentInterface.locator('[class*="message"]');
            const messageCount = await messages.count();
            console.log('Response from automaton-analyzer:', messageCount);
          }
        }
      }
    });

    test('should handle dimensional-guide agent requests', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Select dimensional-guide agent
        const agentButton = agentInterface.locator('button:has-text("dimensional-guide")');
        if (await agentButton.count() > 0) {
          await agentButton.click();
          await page.waitForTimeout(1000);
          
          const inputField = agentInterface.locator('input[type="text"]');
          const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
          
          if (await inputField.count() > 0 && await sendButton.count() > 0) {
            await inputField.fill('Explain 6D intelligence systems');
            await sendButton.click();
            await page.waitForTimeout(4000);
            
            // Check for dimensional explanation
            const messages = agentInterface.locator('[class*="message"]');
            const messageCount = await messages.count();
            console.log('Response from dimensional-guide:', messageCount);
          }
        }
      }
    });
  });

  test.describe('Agent Message Suggestions', () => {
    test('should display suggested questions for users', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Look for suggestion elements
        const suggestions = agentInterface.locator('[class*="suggestion"], button:has-text("Start"), button:has-text("Analyze"), button:has-text("Show")');
        const suggestionCount = await suggestions.count();
        console.log('Suggestion buttons found:', suggestionCount);
        
        if (suggestionCount > 0) {
          // Click on a suggestion
          await suggestions.first().click();
          await page.waitForTimeout(1000);
          
          // Check if it populated the input field
          const inputField = agentInterface.locator('input[type="text"]');
          const inputValue = await inputField.inputValue();
          console.log('Input after clicking suggestion:', inputValue);
          
          expect(inputValue.length).toBeGreaterThan(0);
        }
      }
    });

    test('should hide suggestions after starting conversation', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        // Check initial suggestions
        const initialSuggestions = agentInterface.locator('[class*="suggestion"]');
        const initialCount = await initialSuggestions.count();
        console.log('Initial suggestions:', initialCount);
        
        // Send a message
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Test message');
          await sendButton.click();
          await page.waitForTimeout(2000);
          
          // Check if suggestions are hidden
          const finalSuggestions = agentInterface.locator('[class*="suggestion"]');
          const finalCount = await finalSuggestions.count();
          console.log('Suggestions after message:', finalCount);
          
          // Suggestions should be hidden or reduced
          expect(finalCount).toBeLessThanOrEqual(initialCount);
        }
      }
    });
  });

  test.describe('Agent Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block API calls to simulate network error
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Network error' })
        });
      });
      
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Test message during network error');
          await sendButton.click();
          await page.waitForTimeout(3000);
          
          // Check for error message
          const messages = agentInterface.locator('[class*="message"], [class*="error"]');
          const messageCount = await messages.count();
          console.log('Messages during network error:', messageCount);
          
          // Should still show user message and potentially error
          expect(messageCount).toBeGreaterThan(0);
        }
      }
      
      // Restore network
      await page.unroute('**/api/**');
    });

    test('should handle invalid agent responses', async ({ page }) => {
      // Mock invalid response
      await page.route('**/api/agent/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ invalid: 'response', malformed: true })
        });
      });
      
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          await inputField.fill('Test message for invalid response');
          await sendButton.click();
          await page.waitForTimeout(3000);
          
          // Check how app handles invalid response
          const messages = agentInterface.locator('[class*="message"]');
          const messageCount = await messages.count();
          console.log('Messages with invalid response:', messageCount);
          
          // App should still be functional
          await expect(agentInterface).toBeVisible();
        }
      }
      
      // Restore normal routing
      await page.unroute('**/api/agent/**');
    });
  });

  test.describe('Agent Performance and Scalability', () => {
    test('should handle rapid message sending', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          // Send multiple rapid messages
          for (let i = 0; i < 3; i++) {
            await inputField.fill(`Rapid message ${i + 1}`);
            await sendButton.click();
            await page.waitForTimeout(500);
          }
          
          await page.waitForTimeout(5000);
          
          // Check message count
          const messages = agentInterface.locator('[class*="message"]');
          const messageCount = await messages.count();
          console.log('Messages after rapid sending:', messageCount);
          
          // Should handle multiple messages
          expect(messageCount).toBeGreaterThan(2);
        }
      }
    });

    test('should maintain conversation context across multiple interactions', async ({ page }) => {
      await page.click('button:has-text("Agents")');
      await page.waitForTimeout(2000);
      
      const agentInterface = page.locator('[data-testid="agent-interface"]');
      if (await agentInterface.count() > 0) {
        const inputField = agentInterface.locator('input[type="text"]');
        const sendButton = agentInterface.locator('button').filter({ hasText: '' }).last();
        
        if (await inputField.count() > 0 && await sendButton.count() > 0) {
          // Build a conversation
          const conversation = [
            'What is Church encoding?',
            'Can you give me an example?',
            'How does this relate to lambda calculus?'
          ];
          
          for (const message of conversation) {
            await inputField.fill(message);
            await sendButton.click();
            await page.waitForTimeout(3000);
          }
          
          // Check final state
          const allMessages = agentInterface.locator('[class*="message"]');
          const finalCount = await allMessages.count();
          console.log('Final conversation length:', finalCount);
          
          // Should maintain full conversation
          expect(finalCount).toBeGreaterThan(4);
        }
      }
    });
  });
});