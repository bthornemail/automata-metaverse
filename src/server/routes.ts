/**
 * Server Routes Setup
 * 
 * Configures Express routes
 */

import express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { extname } from 'path';
import { serverConfig } from './config';
import authRoutes from '../routes/auth';
import apiRoutes from '../routes/api';

/**
 * Setup Express routes
 */
export function setupRoutes(app: express.Application): void {
  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  // Authentication routes (before other API routes)
  app.use('/api/auth', authRoutes);

  // Main API routes
  app.use('/api', apiRoutes);

  // Serve static files from UI dist
  app.use(express.static(serverConfig.uiDistPath, {
    setHeaders: (res, filePath) => {
      const ext = extname(filePath);
      const contentType = serverConfig.mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
    },
  }));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // Serve index.html for SPA routing
    const indexPath = join(serverConfig.uiDistPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not Found');
    }
  });
}
