---
id: metaverse-portal-interface-testing
title: "Metaverse Portal Interface Testing Guide"
level: practical
type: guide
tags: [testing, e2e, playwright, chat-messaging, avatars]
keywords: [testing, e2e-tests, playwright, chat-messaging, broadcast, direct-messaging, avatars, webgl, gltf]
prerequisites: [metaverse-portal-interface-readme]
enables: []
related: [metaverse-portal-interface-readme, chat-messaging-complete, webgl-gltf-svg-avatars-analysis]
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [playwright, websocket-backend]
  watchers: []
---

# Metaverse Portal Interface Testing Guide

## Overview

Comprehensive end-to-end (E2E) tests for the Metaverse Portal Interface using Playwright. These tests ensure documentation coverage for chat messaging and avatar system features.

## Test Coverage

### ✅ Chat Messaging Tests

**Broadcast (Pub/Sub) Messaging**:
- ✅ Display broadcast mode toggle
- ✅ Switch to broadcast mode
- ✅ Send broadcast messages to all participants
- ✅ Display broadcast message history
- ✅ Integrate with NL Query for agent responses

**Direct Messaging (P2P and Agents)**:
- ✅ Display direct mode toggle
- ✅ Switch to direct mode
- ✅ Display participant list
- ✅ Send direct messages to selected participant
- ✅ Send direct messages to agents
- ✅ Maintain conversation history per participant

**Click Interactions**:
- ✅ Display participant list with clickable items
- ✅ Show visual indicators for participants
- ✅ Distinguish between agents and humans
- ✅ Show dimension badges for agents
- ✅ Highlight selected participant

**WebSocket Backend Integration**:
- ✅ Establish WebSocket connection for chat
- ✅ Handle `chat:join` event
- ✅ Handle `chat:broadcast` event
- ✅ Handle `chat:direct` event
- ✅ Handle `chat:agent` event

### ✅ Avatar System Tests

**WebGL GLTF Models Analysis**:
- ✅ Verify Three.js is loaded
- ✅ Verify A-Frame is available for metaverse
- ✅ Verify GLTFLoader is available
- ✅ Verify WebGL support
- ✅ Verify avatar model loading capability

**SVG Avatars Analysis**:
- ✅ Verify SVG support
- ✅ Verify SVG to texture conversion capability
- ✅ Verify dynamic SVG update capability

**Technology Stack Verification**:
- ✅ Verify Networked-A-Frame availability
- ✅ Verify WebRTC support for voice chat
- ✅ Verify multiplayer synchronization capability

**Implementation Recommendations Coverage**:
- ✅ Verify documentation references are accessible
- ✅ Verify code examples are present in documentation

### ✅ Integration Guide Tests

- ✅ Verify chat service integration
- ✅ Verify WebSocket backend integration
- ✅ Verify NL Query integration for agent responses

## Running Tests

### Run All Metaverse Portal Interface Tests

```bash
npm run test:e2e:metaverse
```

### Run Specific Test Suites

```bash
# Chat messaging tests only
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts -g "Chat Messaging"

# Avatar system tests only
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts -g "Avatar System"

# Integration guide tests only
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts -g "Integration Guide"
```

### Run Tests in Headed Mode (Visible Browser)

```bash
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts --headed
```

### Run Tests with UI Mode

```bash
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts --ui
```

### Debug Tests

```bash
npx playwright test tests/e2e/metaverse-portal-interface.spec.ts --debug
```

## Test Structure

### Test File Location

`tests/e2e/metaverse-portal-interface.spec.ts`

### Test Organization

```
Metaverse Portal Interface Tests
├── Chat Messaging
│   ├── Broadcast (Pub/Sub) Messaging (5 tests)
│   ├── Direct Messaging (P2P and Agents) (6 tests)
│   ├── Click Interactions (5 tests)
│   └── WebSocket Backend Integration (5 tests)
├── Avatar System
│   ├── WebGL GLTF Models Analysis (5 tests)
│   ├── SVG Avatars Analysis (3 tests)
│   ├── Technology Stack Verification (3 tests)
│   └── Implementation Recommendations Coverage (2 tests)
└── Integration Guide (3 tests)
```

**Total**: 37 tests covering all documented features

## Test Documentation Alignment

### Chat Messaging Documentation

Tests align with:
- `CHAT_MESSAGING_COMPLETE.md` - Complete implementation guide
- `AIPORTAL_CHAT_INTEGRATION.md` - Integration guide

### Avatar System Documentation

Tests align with:
- `WEBGL_GLTF_SVG_AVATARS_ANALYSIS.md` - Complete analysis

### Integration Guide

Tests align with:
- `README.md` - Overview and navigation
- `STATUS.md` - Implementation status

## Test Prerequisites

1. **Server Running**: UI server must be running on `http://localhost:5173` (dev) or `http://localhost:3000` (production)
2. **WebSocket Connection**: Server must support WebSocket connections
3. **NL Query Service**: Natural Language Query service must be available for agent response tests

## Test Environment

- **Base URL**: `http://localhost:5173` (dev) or `http://localhost:3000` (production)
- **Browsers**: Chromium, Firefox, WebKit (configurable in `playwright.config.ts`)
- **Mobile**: Mobile Chrome, Mobile Safari (optional)

## Common Test Patterns

### Navigating to AI Portal

```typescript
await page.goto('/');
await page.waitForTimeout(2000);
await page.click('button:has-text("AI Portal")');
await expect(page.locator('[data-testid="ai-portal"]')).toBeVisible({ timeout: 10000 });
```

### Opening Chat Panel

```typescript
const viewChatButton = page.locator('button').filter({ hasText: /View Chat|view chat|Chat/i });
if (await viewChatButton.count() > 0) {
  await viewChatButton.click();
  await page.waitForTimeout(1000);
}
```

### Sending Messages

```typescript
const messageInput = page.locator('input[type="text"], textarea').first();
await messageInput.fill('Test message');
await messageInput.press('Enter');
await page.waitForTimeout(2000);
```

### Checking WebSocket Events

```typescript
page.on('websocket', ws => {
  ws.on('framereceived', event => {
    try {
      const data = JSON.parse(event.payload as string);
      if (data.type === 'chat:broadcast') {
        // Handle broadcast event
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  });
});
```

## Troubleshooting

### Tests Failing Due to Timing

If tests fail due to timing issues, increase wait times:

```typescript
await page.waitForTimeout(5000); // Increase from 2000
```

### WebSocket Connection Issues

Ensure WebSocket server is running and accessible:

```bash
# Check server logs
npm run pm2:logs

# Restart server
npm run pm2:restart
```

### Chat UI Not Visible

Ensure chat panel is opened:

```typescript
const viewChatButton = page.locator('button').filter({ hasText: /View Chat/i });
if (await viewChatButton.count() > 0) {
  await viewChatButton.click();
}
```

## CI/CD Integration

Tests are configured to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Metaverse Portal Interface Tests
  run: npm run test:e2e:metaverse
```

## Related Documentation

- **`README.md`**: Overview and navigation
- **`CHAT_MESSAGING_COMPLETE.md`**: Chat messaging implementation
- **`AIPORTAL_CHAT_INTEGRATION.md`**: AI Portal integration guide
- **`WEBGL_GLTF_SVG_AVATARS_ANALYSIS.md`**: Avatar system analysis
- **`STATUS.md`**: Implementation status

## Test Maintenance

### Adding New Tests

When adding new features to the Metaverse Portal Interface:

1. Add tests to `metaverse-portal-interface.spec.ts`
2. Follow existing test patterns
3. Update this documentation
4. Ensure tests align with documentation

### Updating Tests

When updating features:

1. Update corresponding tests
2. Verify test coverage
3. Update documentation if needed

---

**Last Updated**: 2025-01-07  
**Status**: Active  
**Maintainer**: 6D-Intelligence-Agent
