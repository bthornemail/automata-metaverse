/**
 * Agent API Routes
 * 
 * REST endpoints for agent operations
 */

import { Router, Request, Response } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth/middleware';
import { rateLimiters } from '../middleware/rate-limit';
import { AgentService } from '../services/agent-service';

const router = Router();
const agentService = new AgentService();

/**
 * GET /api/agents
 * List all available agents
 */
router.get(
  '/agents',
  optionalAuthenticate,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agents = await agentService.listAgents();
      res.json({
        success: true,
        data: agents,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list agents',
        timestamp: Date.now()
      });
    }
  }
);

/**
 * GET /api/agents/:id
 * Get specific agent by ID
 */
router.get(
  '/agents/:id',
  optionalAuthenticate,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agentId = req.params.id;
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: 'Agent ID is required',
          timestamp: Date.now()
        });
      }
      const agent = await agentService.getAgent(agentId);
      return res.json({
        success: true,
        data: agent,
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Agent not found',
        timestamp: Date.now()
      });
    }
  }
);

/**
 * POST /api/agents/execute
 * Execute an operation on an agent
 */
router.post(
  '/agents/execute',
  authenticate,
  rateLimiters.strict,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agentId, operation, parameters, timeout } = req.body;

      if (!agentId || !operation) {
        return res.status(400).json({
          success: false,
          error: 'agentId and operation are required',
          timestamp: Date.now()
        });
      }

      const result = await agentService.execute({
        agentId,
        operation,
        parameters,
        timeout
      });

      return res.json({
        success: result.success,
        data: result.result,
        error: result.error,
        agentId: result.agentId,
        operation: result.operation,
        duration: result.duration,
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        timestamp: Date.now()
      });
    }
  }
);

/**
 * GET /api/agents/:id/status
 * Get agent status
 */
router.get(
  '/agents/:id/status',
  optionalAuthenticate,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agentId = req.params.id;
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: 'Agent ID is required',
          timestamp: Date.now()
        });
      }
      const status = await agentService.getAgentStatus(agentId);
      return res.json({
        success: true,
        data: { status },
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Agent not found',
        timestamp: Date.now()
      });
    }
  }
);

/**
 * GET /api/health
 * Health check endpoint (includes agent service health)
 */
router.get(
  '/health',
  async (req: Request, res: Response) => {
    try {
      const health = await agentService.healthCheck();
      res.json({
        status: health ? 'ok' : 'degraded',
        agents: {
          total: await agentService.getAgentCount(),
          healthy: await agentService.getHealthyAgentCount()
        },
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: Date.now()
      });
    }
  }
);

export default router;
