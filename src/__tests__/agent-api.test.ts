/**
 * Agent API Endpoint Tests
 * 
 * Tests the backend Agent API endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import agentApiRoutes from '../routes/agent-api';

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
const mockOptionalAuth = (req: any, res: any, next: any) => {
  req.user = null;
  next();
};

const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'test-user' };
  next();
};

// Mock rate limiters
const mockRateLimiter = (req: any, res: any, next: any) => {
  next();
};

// Apply routes with mocked middleware
app.use((req, res, next) => {
  // Mock optional auth for GET requests
  if (req.method === 'GET') {
    mockOptionalAuth(req, res, next);
  } else {
    mockAuth(req, res, next);
  }
});

app.use((req, res, next) => {
  mockRateLimiter(req, res, next);
});

app.use('/', agentApiRoutes);

describe('Agent API Endpoints', () => {
  beforeAll(() => {
    // Setup test environment
  });

  afterAll(() => {
    // Cleanup
  });

  describe('GET /api/agents', () => {
    test('should list all agents', async () => {
      const response = await request(app)
        .get('/agents')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should return agent with correct structure', async () => {
      const response = await request(app)
        .get('/agents')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      const agent = response.body.data[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('status');
    });
  });

  describe('GET /api/agents/:id', () => {
    test('should get specific agent', async () => {
      const response = await request(app)
        .get('/agents/0D-Topology-Agent')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe('0D-Topology-Agent');
    });

    test('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .get('/agents/NonExistent-Agent')
        .set('X-API-Key', 'test-api-key')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/agents/execute', () => {
    test('should execute operation', async () => {
      const response = await request(app)
        .post('/agents/execute')
        .set('X-API-Key', 'test-api-key')
        .send({
          agentId: '0D-Topology-Agent',
          operation: 'query',
          parameters: { query: 'test' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('agentId');
      expect(response.body.data).toHaveProperty('operation');
    });

    test('should return error for invalid agent', async () => {
      const response = await request(app)
        .post('/agents/execute')
        .set('X-API-Key', 'test-api-key')
        .send({
          agentId: 'Invalid-Agent',
          operation: 'query'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate request body', async () => {
      const response = await request(app)
        .post('/agents/execute')
        .set('X-API-Key', 'test-api-key')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/agents/:id/status', () => {
    test('should get agent status', async () => {
      const response = await request(app)
        .get('/agents/0D-Topology-Agent/status')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(['active', 'busy', 'inactive', 'error']).toContain(response.body.data);
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
