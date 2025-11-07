# Playwright E2E Testing Guide

This directory contains end-to-end tests for the Automaton UI using Playwright.

## Setup

1. Install Playwright browsers:
```bash
npm run test:e2e:install
```

2. Run tests:
```bash
npm run test:e2e
```

## Test Structure

### Core Tests
- `smoke.spec.ts` - Basic application smoke tests
- `navigation.spec.ts` - Navigation and routing tests
- `components.spec.ts` - Component interaction tests
- `api-integration.spec.ts` - API and WebSocket integration tests
- `accessibility.spec.ts` - Accessibility compliance tests

### Data Propagation & Messaging Tests
- `data-propagation.spec.ts` - Comprehensive data flow through Zustand store
- `websocket-messaging.spec.ts` - WebSocket connection and real-time messaging
- `agent-communication.spec.ts` - Agent interface and communication testing
- `state-synchronization.spec.ts` - State consistency and synchronization
- `realtime-updates.spec.ts` - Real-time update handling and performance
- `cross-component-dataflow.spec.ts` - Cross-component data flow and integration

## Available Scripts

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with Playwright UI
- `npm run test:e2e:debug` - Debug tests with Playwright inspector
- `npm run test:e2e:codegen` - Generate tests with Playwright codegen
- `npm run test:e2e:report` - View HTML test report
- `npm run test:all` - Run unit tests and E2E tests

## Configuration

Playwright is configured in `playwright.config.ts` with:
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile viewport testing
- Automatic dev server startup
- Video recording on failure
- Screenshots on failure
- HTML reports

## Writing Tests

Follow these patterns when writing new tests:

1. Use `test.describe()` to group related tests
2. Use `test.beforeEach()` for common setup
3. Use descriptive test names
4. Use data-testid attributes for reliable element selection
5. Include accessibility considerations
6. Test both happy paths and error cases

## Running Tests in CI

The tests are configured to run in CI with:
- Headless mode
- Parallel execution
- Retry on failure
- JSON and HTML reports

## Debugging

Use the Playwright Inspector for debugging:
```bash
npm run test:e2e:debug
```

Or generate tests interactively:
```bash
npm run test:e2e:codegen
```