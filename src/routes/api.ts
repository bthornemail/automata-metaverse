/**
 * Main API Routes
 * 
 * Migrated API endpoints with authentication and validation
 */

import { Router, Request, Response } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth/middleware';
import { rateLimiters } from '../middleware/rate-limit';
import { validate, schemas } from '../middleware/validation';
import Joi from 'joi';
import agentApiRoutes from './agent-api';

const router = Router();

// Agent API routes (agentApiRoutes already defines /agents paths)
router.use('/', agentApiRoutes);

/**
 * GET /api/status
 * Get system status (public endpoint)
 */
router.get(
  '/status',
  optionalAuthenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Import automaton instance (would be injected in production)
      const { AdvancedSelfReferencingAutomaton } = await import('../../evolutions/advanced-automaton/advanced-automaton');
      const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
      
      res.json({
        success: true,
        data: {
          status: 'running',
          timestamp: Date.now(),
          user: req.user || null,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
      });
    }
  }
);

/**
 * POST /api/automaton/start
 * Start automaton (requires authentication)
 */
router.post(
  '/automaton/start',
  authenticate,
  rateLimiters.strict,
  validate({
    body: Joi.object({
      intervalMs: Joi.number().integer().min(100).max(60000).default(2000),
      maxIterations: Joi.number().integer().min(1).optional(),
    }),
  }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Implementation would go here
      res.json({
        success: true,
        message: 'Automaton started',
        userId: req.user!.userId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start automaton',
      });
    }
  }
);

/**
 * POST /api/automaton/stop
 * Stop automaton (requires authentication)
 */
router.post(
  '/automaton/stop',
  authenticate,
  rateLimiters.strict,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Implementation would go here
      res.json({
        success: true,
        message: 'Automaton stopped',
        userId: req.user!.userId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop automaton',
      });
    }
  }
);

export default router;
