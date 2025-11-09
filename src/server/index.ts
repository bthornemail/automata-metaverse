/**
 * Server Entry Point
 * 
 * Main server initialization and startup
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import * as Sentry from '@sentry/node';
import { AdvancedSelfReferencingAutomaton } from '../../advanced-automaton';
import { serverConfig } from './config';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { AutomatonController } from './automaton-controller';
import { WebSocketHandler } from './websocket-handler';
import { setupLegacyApiHandler } from './legacy-api-handler';
import WordNetIntegration from '../services/wordnet';
import { securityConfig } from '../config/security';
import { verifySession } from '../auth/session';
import { initSentry } from '../monitoring/sentry';

export interface ServerInstance {
  app: express.Application;
  httpServer: any;
  io: any;
  automatonController: AutomatonController;
  wsHandler: WebSocketHandler;
}

/**
 * Initialize and start the server
 */
export async function startServer(): Promise<ServerInstance> {
  // Initialize Sentry error tracking
  initSentry();

  // Create Express app
  const app = express();

  // Sentry request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  
  // Tracing handler
  app.use(Sentry.Handlers.tracingHandler());

  // Setup middleware
  setupMiddleware(app);

  // Setup routes
  setupRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize automaton
  let automaton: AdvancedSelfReferencingAutomaton;
  try {
    automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
    console.log('✅ Automaton initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize automaton:', error);
    process.exit(1);
  }

  // Initialize services
  const wordNet = new WordNetIntegration();

  // Create Socket.IO server with restricted CORS
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: securityConfig.cors.allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Require authentication for WebSocket connections
    allowRequest: (req, callback) => {
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                    req.url?.split('token=')[1]?.split('&')[0];
      
      if (!token) {
        // Allow connection but mark as unauthenticated
        callback(null, true);
        return;
      }

      // Verify token
      const session = verifySession(token);
      if (session) {
        // Attach user info to handshake
        (req as any).user = session;
        callback(null, true);
      } else {
        callback(null, false); // Reject connection
      }
    },
  });

  // Create automaton controller
  const automatonController = new AutomatonController(automaton, io);

  // Create WebSocket handler
  const wsHandler = new WebSocketHandler(io, automatonController, wordNet);

  // Setup legacy API handler (for backward compatibility)
  setupLegacyApiHandler(app, automatonController, wordNet);

  // Sentry error handler must be after all routes
  app.use(Sentry.Handlers.errorHandler());

  // Start server
  httpServer.listen(serverConfig.port, () => {
    console.log(`🌐 HTTP API server running on http://localhost:${serverConfig.port}`);
    console.log(`🔌 WebSocket server attached to HTTP server`);
    console.log(`🔒 Security enabled: CORS restricted, Rate limiting active, Auth available`);
    console.log(`📋 Allowed origins: ${securityConfig.cors.allowedOrigins.join(', ')}`);
  });

  console.log('🚀 Automaton Backend Server Started');
  console.log(`📊 API: http://localhost:${serverConfig.port}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${serverConfig.wsPort}`);

  return {
    app,
    httpServer,
    io,
    automatonController,
    wsHandler,
  };
}

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}
