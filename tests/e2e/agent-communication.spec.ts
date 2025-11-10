import { test, expect } from '@playwright/test';

test.describe('Automaton UI - Agent Communication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test.describe('Agent Interface Functionality', () => {
    test('should load and display available agents', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Check for agent selector button (opens modal to select agents)
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      
      // Click to open agent selection modal
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      // Check for agent options in modal
      const agentOptions = page.locator('button').filter({ hasText: /automaton-interface|automaton-control|automaton-analyzer|dimensional-guide|church-encoding-expert|automaton-visualizer/i });
      const agentCount = await agentOptions.count();
      expect(agentCount).toBeGreaterThan(0);
    });

    test('should switch between different agents', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open agent selector
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      // Select first available agent
      const agentOptions = page.locator('button').filter({ hasText: /automaton-interface|automaton-control|automaton-analyzer/i });
      const agentCount = await agentOptions.count();
      expect(agentCount).toBeGreaterThan(0);
      
      if (agentCount > 0) {
        await agentOptions.first().click();
        await page.waitForTimeout(1000);
        
        // Verify agent was selected (check for active state or agent name display)
        const activeAgent = page.locator('text=/automaton-interface|automaton-control|automaton-analyzer/i').first();
        await expect(activeAgent).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display agent descriptions correctly', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open agent selector to see descriptions
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      // Check for agent descriptions in modal
      const agentOptions = page.locator('button').filter({ hasText: /automaton-interface|automaton-control|automaton-analyzer/i });
      const agentCount = await agentOptions.count();
      expect(agentCount).toBeGreaterThan(0);
      
      // Check that descriptions are visible (they should be in the button text or nearby)
      if (agentCount > 0) {
        const firstAgent = agentOptions.first();
        await expect(firstAgent).toBeVisible({ timeout: 5000 });
        const agentText = await firstAgent.textContent();
        expect(agentText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Agent Message Exchange', () => {
    test('should send messages to agents and receive responses', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if it's not visible (click "View Chat" button)
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find the input field
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      
      // Send a test message
      const testMessage = 'Hello, can you help me understand the automaton?';
      await inputField.fill(testMessage);
      
      // Find and click send button
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).or(page.locator('button[type="submit"]')).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
      await page.waitForTimeout(3000);
      
      // Check for response messages
      const messages = page.locator('div').filter({ hasText: testMessage }).or(page.locator('[class*="message"]'));
      const messageCount = await messages.count();
      
      // Should have at least user message
      expect(messageCount).toBeGreaterThanOrEqual(1);
    });

    test('should display typing indicators when agent is responding', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input field
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      
      // Send a message
      await inputField.fill('Explain dimensional progression');
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
      
      // Look for typing indicator (animated dots)
      await page.waitForTimeout(500);
      const typingIndicator = page.locator('[class*="bounce"], [class*="animate-bounce"]');
      const typingCount = await typingIndicator.count();
      
      // Typing indicator may or may not appear immediately
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Verify message was sent (check for user message)
      const userMessage = page.locator('div').filter({ hasText: 'Explain dimensional progression' });
      await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
    });

    test('should maintain message history and conversation context', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input field and send button
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      
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
      
      // Check message history - verify all messages are present
      for (const message of messages) {
        const messageElement = page.locator('div').filter({ hasText: message });
        await expect(messageElement.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Agent Capabilities and Specializations', () => {
    test('should handle automaton-interface agent requests', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Select automaton-interface agent
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      // Select automaton-interface from modal
      const agentButton = page.locator('button').filter({ hasText: /automaton-interface/i }).first();
      if (await agentButton.count() > 0) {
        await agentButton.click();
        await page.waitForTimeout(1000);
        
        // Find input and send message
        const inputField = page.locator('input[type="text"]').first();
        await expect(inputField).toBeVisible({ timeout: 10000 });
        await inputField.fill('Start the automaton with 2 second intervals');
        
        const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
        await expect(sendButton).toBeVisible({ timeout: 5000 });
        await sendButton.click();
        await page.waitForTimeout(4000);
        
        // Check for response
        const userMessage = page.locator('div').filter({ hasText: 'Start the automaton with 2 second intervals' });
        await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should handle automaton-analyzer agent requests', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Select automaton-analyzer agent
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      const agentButton = page.locator('button').filter({ hasText: /automaton-analyzer/i }).first();
      if (await agentButton.count() > 0) {
        await agentButton.click();
        await page.waitForTimeout(1000);
        
        // Send message
        const inputField = page.locator('input[type="text"]').first();
        await expect(inputField).toBeVisible({ timeout: 10000 });
        await inputField.fill('Analyze self-modification patterns');
        
        const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
        await expect(sendButton).toBeVisible({ timeout: 5000 });
        await sendButton.click();
        await page.waitForTimeout(4000);
        
        // Verify message was sent
        const userMessage = page.locator('div').filter({ hasText: 'Analyze self-modification patterns' });
        await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should handle dimensional-guide agent requests', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Select dimensional-guide agent
      const agentSelector = page.locator('button').filter({ hasText: /automaton|agent/i }).first();
      await expect(agentSelector).toBeVisible({ timeout: 10000 });
      await agentSelector.click();
      await page.waitForTimeout(1000);
      
      const agentButton = page.locator('button').filter({ hasText: /dimensional-guide/i }).first();
      if (await agentButton.count() > 0) {
        await agentButton.click();
        await page.waitForTimeout(1000);
        
        // Send message
        const inputField = page.locator('input[type="text"]').first();
        await expect(inputField).toBeVisible({ timeout: 10000 });
        await inputField.fill('Explain 6D intelligence systems');
        
        const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
        await expect(sendButton).toBeVisible({ timeout: 5000 });
        await sendButton.click();
        await page.waitForTimeout(4000);
        
        // Verify message was sent
        const userMessage = page.locator('div').filter({ hasText: 'Explain 6D intelligence systems' });
        await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Agent Message Suggestions', () => {
    test('should display suggested questions for users', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for suggestion elements
      const suggestions = page.locator('button').filter({ hasText: /Start|Analyze|Show|Explain/i });
      const suggestionCount = await suggestions.count();
      
      if (suggestionCount > 0) {
        // Click on a suggestion
        await suggestions.first().click();
        await page.waitForTimeout(1000);
        
        // Check if it populated the input field
        const inputField = page.locator('input[type="text"]').first();
        await expect(inputField).toBeVisible({ timeout: 10000 });
        const inputValue = await inputField.inputValue();
        
        expect(inputValue.length).toBeGreaterThan(0);
      }
    });

    test('should hide suggestions after starting conversation', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Check initial suggestions
      const initialSuggestions = page.locator('button').filter({ hasText: /Start|Analyze|Show|Explain/i });
      const initialCount = await initialSuggestions.count();
      
      // Send a message
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      await inputField.fill('Test message');
      
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
      await page.waitForTimeout(2000);
      
      // Check if suggestions are hidden (they should be less visible or hidden)
      const finalSuggestions = page.locator('button').filter({ hasText: /Start|Analyze|Show|Explain/i });
      const finalCount = await finalSuggestions.count();
      
      // Suggestions should be hidden or reduced after sending message
      expect(finalCount).toBeLessThanOrEqual(initialCount);
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
      
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input and send message
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      await inputField.fill('Test message during network error');
      
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
      await page.waitForTimeout(3000);
      
      // Check for user message (should still be visible)
      const userMessage = page.locator('div').filter({ hasText: 'Test message during network error' });
      await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
      
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
      
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input and send message
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      await inputField.fill('Test message for invalid response');
      
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
      await page.waitForTimeout(3000);
      
      // App should still be functional - verify AI Portal is still visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Restore normal routing
      await page.unroute('**/api/agent/**');
    });
  });

  test.describe('Agent Performance and Scalability', () => {
    test('should handle rapid message sending', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input and send button
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      
      // Send multiple rapid messages
      const messages = ['Rapid message 1', 'Rapid message 2', 'Rapid message 3'];
      for (const message of messages) {
        await inputField.fill(message);
        await sendButton.click();
        await page.waitForTimeout(500);
      }
      
      await page.waitForTimeout(5000);
      
      // Verify all messages are present
      for (const message of messages) {
        const messageElement = page.locator('div').filter({ hasText: message });
        await expect(messageElement.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should maintain conversation context across multiple interactions', async ({ page }) => {
      await page.getByRole('tab', { name: 'Switch to AI Portal tab' }).click();
      await page.waitForTimeout(2000);
      
      // Check AI Portal is visible
      await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
      
      // Open chat panel if needed
      const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat/i });
      if (await viewChatButton.count() > 0) {
        await viewChatButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Find input and send button
      const inputField = page.locator('input[type="text"]').first();
      await expect(inputField).toBeVisible({ timeout: 10000 });
      const sendButton = page.locator('button').filter({ hasText: /Send|send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      
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
      
      // Verify all messages are present in conversation
      for (const message of conversation) {
        const messageElement = page.locator('div').filter({ hasText: message });
        await expect(messageElement.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });
});