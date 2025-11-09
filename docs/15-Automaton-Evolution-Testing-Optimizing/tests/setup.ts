/**
 * Jest setup file for Automaton Evolution Testing Framework
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Add test utilities here
};

// Cleanup after all tests
afterAll(async () => {
  // Cleanup code if needed
});
