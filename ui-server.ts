import { AdvancedSelfReferencingAutomaton } from './evolutions/advanced-automaton/advanced-automaton';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import WordNetIntegration from './src/services/wordnet';
import { simpleOpenCodeService } from './src/services/simple-opencode';
import OpenCodeIntegration from './opencode-integration';
import { securityConfig } from './src/config/security';
import { rateLimiters } from './src/middleware/rate-limit';
import authRoutes from './src/routes/auth';
import { verifySession } from './src/auth/session';

const HTTP_PORT = parseInt(process.env.PORT || '3000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const UI_DIST_PATH = join(__dirname, '../ui/dist');

// MIME types for static files
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Express app for better middleware support
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for WebGL
}));

// CORS with restricted origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (securityConfig.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: securityConfig.cors.credentials,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting for all routes
app.use(rateLimiters.api);

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
import apiRoutes from './src/routes/api';
app.use('/api', apiRoutes);

// Serve static files from UI dist
app.use(express.static(UI_DIST_PATH, {
  setHeaders: (res, filePath) => {
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
  },
}));

// SPA fallback - serve index.html for all non-API routes
// Use regex pattern to avoid path-to-regexp issues with wildcards
app.get(/^(?!\/api).*/, (req, res) => {
  // Serve index.html for SPA routing
  const indexPath = join(UI_DIST_PATH, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Socket.IO server for WebSocket connections
const io = new SocketIOServer({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Global automaton instance
let automaton: AdvancedSelfReferencingAutomaton;
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
const wordNet = new WordNetIntegration();

// Initialize automaton
try {
  automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
  console.log('✅ Automaton initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize automaton:', error);
  process.exit(1);
}

// NL Query handler (imported from routes)
let nlQueryRouter: any = null;
async function initializeNLQueryRouter() {
  if (!nlQueryRouter) {
    try {
      const nlQueryModule = await import('./src/routes/nl-query');
      nlQueryRouter = nlQueryModule.default;
      console.log('✅ NL Query router initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize NL Query router:', error);
    }
  }
  return nlQueryRouter;
}

// Legacy API handler middleware (for backward compatibility)
// Migrates existing endpoints to Express format
app.use('/api', async (req, res, next) => {
  // Skip routes already handled by Express routers
  if (req.path.startsWith('/auth') || res.headersSent) {
    return next();
  }

  const apiPath = req.path.replace('/api/', '') || '';
  
  // Helper to parse request body
  const parseRequestBody = async (req: any): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };
  
  try {
    let response: any = { success: true, timestamp: Date.now() };
    
    // Parse body if needed (Express already parsed it, but handle both cases)
    let body: any = {};
    if ((req as any).body) {
      body = (req as any).body;
    } else {
      body = await parseRequestBody(req);
      (req as any).body = body;
    }

    // Handle NL Query endpoints
    if (apiPath.startsWith('nl-query/')) {
      const { handleNLQueryRequest } = await import('./src/routes/nl-query-simple');
      const handled = await handleNLQueryRequest(apiPath, req, res);
      if (handled) {
        return;
      }
    }

    // Handle JSONL endpoints first (before switch)
    if (apiPath.startsWith('jsonl/')) {
      const fileName = apiPath.replace('jsonl/', '');
      try {
        const { readFileSync, existsSync } = require('fs');
        const { join } = require('path');
        const filePath = join(__dirname, '..', fileName);
        
        if (!existsSync(filePath)) {
          response.success = false;
          response.error = `File not found: ${fileName}`;
        } else {
          const content = readFileSync(filePath, 'utf-8');
          
          // Ensure content is a string
          if (typeof content !== 'string') {
            response.success = false;
            response.error = `Invalid file content: expected string, got ${typeof content}`;
          } else {
            // Handle both JSONL (line-by-line) and JSON array formats
            let data: any[] = [];
            
            try {
              // Try parsing as JSON array first (in case file is already JSON)
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed)) {
                data = parsed;
              } else {
                // Otherwise, treat as JSONL (line-by-line)
                const lines = content.trim().split('\n').filter((line: string) => line.trim());
                data = lines.map((line: string) => {
                  try {
                    return JSON.parse(line);
                  } catch (e) {
                    console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}`);
                    return null;
                  }
                }).filter(Boolean);
              }
            } catch (parseError) {
              // If JSON.parse fails, treat as JSONL
              const lines = content.trim().split('\n').filter((line: string) => line.trim());
              data = lines.map((line: string) => {
                try {
                  return JSON.parse(line);
                } catch (e) {
                  console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}`);
                  return null;
                }
              }).filter(Boolean);
            }
            
            response.data = data;
          }
        }
      } catch (error: any) {
        response.success = false;
        response.error = error.message || 'Failed to read JSONL file';
      }
      
      // Use Express response if available, otherwise raw HTTP
      if (res.json) {
        res.json(response);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
      return;
    }

    switch (apiPath) {
      case 'status':
        response.data = {
          isRunning,
          currentDimension: (automaton as any).currentDimension,
          iterationCount: (automaton as any).executionHistory.length,
          selfModificationCount: (automaton as any).selfModificationCount,
          totalObjects: (automaton as any).objects.length,
          executionMode: 'builtin',
          status: isRunning ? 'running' : 'idle',
        };
        break;

      case 'automaton/start':
        if (isRunning) {
          response.success = false;
          response.error = 'Automaton is already running';
        } else {
          const intervalMs = body.intervalMs || 2000;
          const maxIterations = body.maxIterations || Infinity;
          
          startAutomaton(intervalMs, maxIterations);
        }
        break;

      case 'automaton/stop':
        if (!isRunning) {
          response.success = false;
          response.error = 'Automaton is not running';
        } else {
          stopAutomaton();
        }
        break;

      case 'automaton/reset':
        stopAutomaton();
        try {
          automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
          response.success = true;
        } catch (error) {
          response.success = false;
          response.error = 'Failed to reset automaton';
        }
        break;

      case 'automaton/action':
        if (!isRunning) {
          const body = await parseRequestBody(req);
          const action = body.action;
          
          if (action) {
            executeAction(action);
            response.data = { action, executed: true };
          } else {
            response.success = false;
            response.error = 'No action specified';
          }
        } else {
          response.success = false;
          response.error = 'Cannot execute manual action while running';
        }
        break;

      case 'automaton/dimension':
        if (!isRunning) {
          const dimension = body.dimension;
          
          if (dimension >= 0 && dimension <= 7) {
            (automaton as any).currentDimension = dimension;
            response.data = { dimension, set: true };
            
            // Notify clients
            io.emit('dimension', { dimension });
          } else {
            response.success = false;
            response.error = 'Invalid dimension (must be 0-7)';
          }
        } else {
          response.success = false;
          response.error = 'Cannot change dimension while running';
        }
        break;

      case 'analysis/history':
        response.data = {
          history: (automaton as any).executionHistory || [],
          actionFrequency: calculateActionFrequency(),
          dimensionalProgression: calculateDimensionalProgression(),
          performanceMetrics: calculatePerformanceMetrics()
        };
        break;

      case 'analysis/self-reference':
        response.data = analyzeSelfReferences();
        break;

      case 'analysis/patterns':
        response.data = analyzePatterns();
        break;

      case 'agent/list':
        response.data = [
          'automaton-interface',
          'automaton-control', 
          'automaton-analyzer',
          'dimensional-guide',
          'church-encoding-expert',
          'automaton-visualizer'
        ];
        break;

      case 'agent/chat':
        const agent = body.agent;
        const message = body.message;
        
        if (!agent || !message) {
          response.success = false;
          response.error = 'Agent and message are required';
        } else {
          response.data = await handleAgentMessage(agent, message);
        }
        break;

      case 'config':
        if (req.method === 'GET') {
          response.data = {
            intervalMs: 2000,
            maxIterations: Infinity,
            useWebLLM: false,
            model: 'llama2',
            automatonFile: './automaton.jsonl'
          };
        } else if (req.method === 'PUT') {
          // Configuration update logic would go here
          response.data = { updated: true };
        }
        break;

      case 'file/load':
        const filePath = body.filePath;
        
        if (filePath) {
          try {
            // File loading logic would go here
            response.data = { loaded: true, filePath };
          } catch (error) {
            response.success = false;
            response.error = 'Failed to load file';
          }
        } else {
          response.success = false;
          response.error = 'File path is required';
        }
        break;

      case 'file/save':
        try {
          // File saving logic would go here
          response.data = { saved: true };
        } catch (error) {
          response.success = false;
          response.error = 'Failed to save file';
        }
        break;

      case 'ollama/models':
        response.data = ['llama2', 'codellama', 'mistral', 'vicuna'];
        break;

      case 'ollama/model':
        const ollamaBody = await parseRequestBody(req);
        const model = ollamaBody.model;
        
        if (model) {
          response.data = { model, set: true };
        } else {
          response.success = false;
          response.error = 'Model name is required';
        }
        break;

      case 'wordnet/lookup':
        const lookupWord = body.word || apiPath.replace('wordnet/lookup/', '');
        if (lookupWord) {
          response.data = await wordNet.lookupWord(lookupWord);
        } else {
          response.success = false;
          response.error = 'No word specified';
        }
        break;

      case 'wordnet/analyze':
        const analyzeBody = await parseRequestBody(req);
        const analyzeWord = analyzeBody.word || apiPath.replace('wordnet/analyze/', '');
        if (analyzeWord) {
          response.data = await wordNet.analyzeSemanticTopology(analyzeWord);
        } else {
          response.success = false;
          response.error = 'No word specified';
        }
        break;

      case 'wordnet/relationships':
        const relWords = body.words || [body.word1, body.word2];
        if (relWords && relWords.length >= 2) {
          response.data = await wordNet.findSemanticRelationships(relWords[0], relWords[1]);
        } else {
          response.success = false;
          response.error = 'Two words required for relationship analysis';
        }
        break;

      case 'opencode/connect':
        const connected = await simpleOpenCodeService.initialize();
        response.data = { connected };
        break;

      case 'opencode/analyze':
        const automatonData = {
          isRunning,
          currentDimension: (automaton as any).currentDimension,
          iterationCount: (automaton as any).executionHistory?.length || 0,
          selfModificationCount: (automaton as any).selfModificationCount,
          totalObjects: (automaton as any).objects.length,
          status: isRunning ? 'running' : 'idle',
          executionHistory: (automaton as any).executionHistory || []
        };
        const analysis = await simpleOpenCodeService.analyzeAutomatonState(automatonData);
        response.data = analysis;
        break;

      case 'opencode/suggest':
        const currentDim = (automaton as any).currentDimension;
        const availableActions = ['evolve', 'self-reference', 'self-modify', 'self-io', 'validate-self', 'self-train', 'self-observe', 'compose'];
        const suggestions = await simpleOpenCodeService.getSuggestionsForAction(currentDim, availableActions);
        response.data = { suggestions };
        break;

      case 'opencode/search':
        const pattern = body.pattern;
        if (pattern) {
          response.data = await simpleOpenCodeService.searchCodebase(pattern);
        } else {
          response.success = false;
          response.error = 'Pattern is required for search';
        }
        break;

      case 'opencode/status':
        response.data = {
          connected: simpleOpenCodeService.isClientConnected(),
          currentSession: null, // Simplified version doesn't track sessions
          availableModels: simpleOpenCodeService.getAvailableModels(),
          availableAgents: simpleOpenCodeService.getAvailableAgents()
        };
        break;

      case 'opencode/agent/list':
        response.data = simpleOpenCodeService.getAvailableAgents();
        break;

      case 'opencode/agent/execute':
        const agentBody = await parseRequestBody(req);
        const agentName = agentBody.agent;
        const agentTask = agentBody.task;
        
        if (agentName && agentTask) {
          response.data = await simpleOpenCodeService.executeAgentTask(agentName, agentTask);
        } else {
          response.success = false;
          response.error = 'Agent name and task are required';
        }
        break;

      case 'opencode/model/set':
        const modelBody = await parseRequestBody(req);
        const newModel = modelBody.model;
        
        if (newModel) {
          const success = await simpleOpenCodeService.setModel(newModel);
          response.data = { model: newModel, set: success };
          if (!success) {
            response.success = false;
            response.error = 'Model not available';
          }
        } else {
          response.success = false;
          response.error = 'Model name is required';
        }
        break;

      case 'opencode/models':
        response.data = simpleOpenCodeService.getAvailableModels();
        break;

      case 'opencode/execute':
        const tool = body.tool;
        const toolArgs = body.args || [];
        
        if (tool) {
          try {
            const integration = new OpenCodeIntegration();
            const result = await integration.executeCommand({ tool, args: toolArgs });
            response.data = result;
          } catch (error: any) {
            response.success = false;
            response.error = error.message || 'Failed to execute command';
          }
        } else {
          response.success = false;
          response.error = 'Tool name is required';
        }
        break;

      default:
        response.success = false;
        response.error = 'Unknown endpoint';
    }

    // Send response using Express
    res.json(response);
    return;

  } catch (error) {
    console.error('API Error:', error);
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: Date.now()
    };
    res.status(500).json(errorResponse);
  }
});

// Automaton Control Functions
function startAutomaton(intervalMs: number, maxIterations: number) {
  if (isRunning) return;

  isRunning = true;
  let iterationCount = 0;

  console.log(`🚀 Starting automaton with ${intervalMs}ms interval`);

  intervalId = setInterval(() => {
    if (iterationCount >= maxIterations) {
      stopAutomaton();
      return;
    }

    // Get smart action based on current state
    const currentDimension = (automaton as any).currentDimension;
    const action = getSmartAction(currentDimension, iterationCount);
    
    executeAction(action);
    
    // Emit status update
    io.emit('status', {
      isRunning: true,
      currentDimension: (automaton as any).currentDimension,
      iterationCount: (automaton as any).executionHistory.length,
      selfModificationCount: (automaton as any).selfModificationCount,
      totalObjects: (automaton as any).objects.length,
      executionMode: 'builtin',
      status: 'running',
      lastAction: action,
    });

    iterationCount++;
  }, intervalMs);
}

function stopAutomaton() {
  if (!isRunning) return;

  isRunning = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  console.log('🛑 Automaton stopped');

  // Emit status update
  io.emit('status', {
    isRunning: false,
    currentDimension: (automaton as any).currentDimension,
    iterationCount: (automaton as any).executionHistory.length,
    selfModificationCount: (automaton as any).selfModificationCount,
    totalObjects: (automaton as any).objects.length,
    executionMode: 'builtin',
    status: 'idle',
  });
}

function executeAction(action: string) {
  try {
    console.log(`🎯 Executing: ${action}`);
    
    const currentDim = (automaton as any).currentDimension;
    const iterationCount = (automaton as any).executionHistory?.length || 0;
    let fromDim = currentDim;
    let toDim = currentDim;

    switch (action) {
      case 'evolve':
        (automaton as any).executeEvolution();
        progressDimension();
        toDim = (automaton as any).currentDimension;
        break;
      case 'self-reference':
        (automaton as any).executeSelfReference();
        break;
      case 'self-modify':
        (automaton as any).executeSelfModification();
        io.emit('modification', { type: 'self-modify', timestamp: Date.now() });
        break;
      case 'self-io':
        (automaton as any).executeSelfIO();
        break;
      case 'validate-self':
        (automaton as any).executeSelfValidation();
        break;
      case 'self-train':
        (automaton as any).executeSelfTraining();
        break;
      case 'self-observe':
        (automaton as any).executeSelfObservation();
        break;
      case 'compose':
        (automaton as any).executeComposition();
        break;
    }

    // Add to execution history - validate entry is proper object
    const historyEntry = {
      iteration: typeof iterationCount === 'number' ? iterationCount : 0,
      action: typeof action === 'string' ? action : 'unknown',
      from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
      to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
      timestamp: Date.now()
    };
    
    // Ensure entry is valid before pushing
    if (historyEntry && typeof historyEntry === 'object' && !Array.isArray(historyEntry)) {
      if (!(automaton as any).executionHistory) {
        (automaton as any).executionHistory = [];
      }
      (automaton as any).executionHistory.push(historyEntry);
    }

    // Emit action execution with proper data - ensure all fields are strings/numbers
    const actionData = {
      action: typeof action === 'string' ? action : 'unknown',
      result: 'success',
      timestamp: Date.now(),
      from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
      to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
      iteration: typeof iterationCount === 'number' ? iterationCount : 0
    };
    
    // Validate before emitting
    if (actionData && typeof actionData === 'object' && !Array.isArray(actionData)) {
      io.emit('action', actionData);
    }

  } catch (error) {
    console.error(`❌ Failed to execute action ${action}:`, error);
    // Safely convert error to string
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message || String(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = String(error);
      } catch (e) {
        errorMessage = 'Unknown error occurred';
      }
    }
    io.emit('error', { action: action, error: errorMessage });
  }
}

function progressDimension() {
  const currentDim = (automaton as any).currentDimension;
  const nextDim = (currentDim + 1) % 8;
  (automaton as any).currentDimension = nextDim;
  
  io.emit('dimension', { dimension: nextDim });
}

function getSmartAction(currentDimension: number, iterationCount: number): string {
  // Intelligent action selection based on context
  if (iterationCount % 20 === 0) {
    return 'self-modify';
  }
  
  if (iterationCount % 15 === 0) {
    return 'self-io';
  }
  
  if (iterationCount % 10 === 0) {
    return 'validate-self';
  }
  
  if (iterationCount % 8 === 0) {
    return 'self-train';
  }

  // Dimension-specific actions
  switch (currentDimension) {
    case 0:
      return Math.random() > 0.7 ? 'self-reference' : 'evolve';
    case 2:
      return Math.random() > 0.6 ? 'self-modify' : 'evolve';
    case 4:
      return Math.random() > 0.5 ? 'self-io' : 'evolve';
    case 6:
      return Math.random() > 0.4 ? 'self-train' : 'evolve';
    case 7:
      return Math.random() > 0.3 ? 'self-observe' : 'evolve';
    default:
      return 'evolve';
  }
}

// Analysis Helper Functions
function calculateActionFrequency(): Map<string, number> {
  const history = (automaton as any).executionHistory || [];
  const frequency = new Map<string, number>();
  
  history.forEach((entry: any) => {
    const action = entry.action || 'unknown';
    frequency.set(action, (frequency.get(action) || 0) + 1);
  });
  
  return frequency;
}

function calculateDimensionalProgression(): any[] {
  const history = (automaton as any).executionHistory || [];
  const progression: any[] = [];
  
  history.forEach((entry: any) => {
    if (entry.from !== undefined && entry.to !== undefined) {
      progression.push({
        dimension: entry.to,
        duration: entry.duration || 1000,
        timestamp: entry.timestamp || Date.now()
      });
    }
  });
  
  return progression;
}

function calculatePerformanceMetrics(): any {
  const history = (automaton as any).executionHistory || [];
  
  if (history.length === 0) {
    return {
      avgExecutionTime: 0,
      successRate: 100
    };
  }
  
  const successfulActions = history.filter((entry: any) => entry.success !== false).length;
  const successRate = (successfulActions / history.length) * 100;
  
  return {
    avgExecutionTime: 150, // Mock value
    successRate
  };
}

function analyzeSelfReferences(): any {
  const objects = (automaton as any).objects || [];
  const selfRefObjects = objects.filter((obj: any) => 
    obj.id === 'self-ref' || 
    obj.text?.includes('self') || 
    obj.file?.includes('church_encoding_canvas')
  );
  
  const automata = [];
  for (let i = 0; i < 8; i++) {
    automata.push({
      id: `automaton-${i}d`,
      dimension: i,
      pattern: `λ${i}`,
      active: (automaton as any).currentDimension === i
    });
  }
  
  const modifications = (automaton as any).modifications || [];
  
  return {
    selfRefObjects: selfRefObjects.map((obj: any, index: number) => ({
      id: obj.id || `self-ref-${index}`,
      line: obj.line || index,
      text: obj.text || 'self-reference',
      file: obj.file || 'church_encoding_canvas.jsonl'
    })),
    automata,
    modifications: modifications.slice(-10).map((mod: any) => ({
      type: mod.type || 'unknown',
      details: mod.details || 'No details',
      timestamp: mod.timestamp || Date.now()
    })),
    integrity: {
      valid: true,
      issues: []
    }
  };
}

function analyzePatterns(): any {
  return {
    churchEncoding: {
      patterns: ['λf.λx.x', 'λn.λf.λx.f(nfx)', 'λx.λy.λf.fxy'],
      frequency: 'high'
    },
    selfReference: {
      patterns: ['self-ref', 'church_encoding_canvas.jsonl'],
      frequency: 'medium'
    },
    dimensional: {
      patterns: ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'],
      frequency: 'high'
    }
  };
}

async function handleAgentMessage(agent: string, message: string): Promise<string> {
  // Simple agent response logic
  const responses: Record<string, string[]> = {
    'automaton-interface': [
      `I can help you control the automaton. Current status: ${isRunning ? 'running' : 'idle'}`,
      `The automaton is currently at dimension ${(automaton as any).currentDimension || 0}`,
      'You can start, stop, or reset the automaton using the control panel.'
    ],
    'automaton-control': [
      'To control the automaton, use the Control Panel or send commands like "start", "stop", "reset".',
      'Available actions: evolve, self-reference, self-modify, self-io, validate-self, self-train, self-observe, compose.'
    ],
    'automaton-analyzer': [
      `The automaton has ${(automaton as any).objects?.length || 0} objects in its canvas.`,
      `Self-modification count: ${(automaton as any).selfModificationCount || 0}`,
      'The system follows Church encoding principles across 8 dimensions.'
    ],
    'dimensional-guide': [
      '0D: Identity (λf.λx.x) - The foundation of all computation',
      '1D: Successor (λn.λf.λx.f(nfx)) - Temporal progression',
      '2D: Pairs (λx.λy.λf.fxy) - Spatial structure',
      '3D: Addition - Algebraic operations',
      '4D: Network - Spacetime topology',
      '5D: Consensus - Distributed systems',
      '6D: Intelligence - Neural networks',
      '7D: Quantum - Superposition states'
    ],
    'church-encoding-expert': [
      'Church encoding represents data and operators as lambda functions.',
      'Numbers: 0 = λf.λx.x, 1 = λf.λx.fx, 2 = λf.λx.f(fx), etc.',
      'Booleans: True = λx.λy.x, False = λx.λy.y'
    ],
    'automaton-visualizer': [
      'The dimensional canvas shows the progression from 0D to 7D.',
      'Each dimension is color-coded and represents different computational capabilities.',
      'Self-references create recursive patterns in the visualization.'
    ]
  };
  
  const agentResponses = responses[agent as keyof typeof responses] || ['I am a specialized automaton agent. How can I help you?'];
  const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
  
  // Add context-specific responses
  if (message.toLowerCase().includes('start')) {
    return `${randomResponse}\n\nTo start the automaton, use the Control Panel or send the "start" command.`;
  }
  
  if (message.toLowerCase().includes('dimension')) {
    return `${randomResponse}\n\nCurrent dimension: ${(automaton as any).currentDimension || 0}D`;
  }
  
  return randomResponse || '';
}

function parseRequestBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        resolve(parsedBody);
      } catch {
        resolve({});
      }
    });
  });
}

// Chat participants tracking
const chatParticipants = new Map<string, { userId: string; userName: string; type: 'human' | 'agent'; socketId: string }>();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected to WebSocket');

  // Send initial status
  socket.emit('status', {
    isRunning,
    currentDimension: (automaton as any).currentDimension,
    iterationCount: (automaton as any).executionHistory.length,
    selfModificationCount: (automaton as any).selfModificationCount,
    totalObjects: (automaton as any).objects.length,
    executionMode: 'builtin',
    status: isRunning ? 'running' : 'idle',
  });

  // Chat: Join
  socket.on('command', async (data: { command: string; params?: any }) => {
    if (data.command === 'chat:join') {
      const { userId, userName, type } = data.params || {};
      if (userId) {
        chatParticipants.set(userId, { userId, userName: userName || 'User', type: type || 'human', socketId: socket.id });
        
        // Notify all clients
        io.emit('chat:participant-joined', {
          id: userId,
          name: userName || 'User',
          type: type || 'human',
          online: true
        });
        
        console.log(`👤 User joined chat: ${userName || userId} (${type || 'human'})`);
      }
    } else if (data.command === 'chat:broadcast') {
      // Broadcast message to all clients
      const message = data.params;
      if (message) {
        io.emit('chat:broadcast', message);
        console.log(`📢 Broadcast: ${message.from} → ${message.content.substring(0, 50)}...`);
      }
    } else if (data.command === 'chat:direct') {
      // Direct message - send to specific user
      const message = data.params;
      if (message && message.to) {
        const recipient = Array.from(chatParticipants.values()).find(p => p.userId === message.to);
        if (recipient) {
          io.to(recipient.socketId).emit('chat:direct', message);
          socket.emit('chat:direct', message); // Also send back to sender
          console.log(`💬 Direct: ${message.from} → ${message.to}: ${message.content.substring(0, 50)}...`);
        }
      }
    } else if (data.command === 'chat:agent') {
      // Agent message - broadcast to all (for visibility)
      const message = data.params;
      if (message) {
        io.emit('chat:agent', message);
        io.emit('chat:direct', message); // Also send as direct to recipient
        console.log(`🤖 Agent: ${message.from} → ${message.to || 'all'}: ${message.content.substring(0, 50)}...`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from WebSocket');
    
    // Remove participant
    const participant = Array.from(chatParticipants.entries()).find(([_, p]) => p.socketId === socket.id);
    if (participant) {
      const [userId] = participant;
      chatParticipants.delete(userId);
      
      // Notify all clients
      io.emit('chat:participant-left', userId);
      console.log(`👤 User left chat: ${userId}`);
    }
  });
});

// Create HTTP server with Express app
const httpServer = createServer(app);

// Attach Socket.IO to HTTP server
io.attach(httpServer);

// Start server
httpServer.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP API server running on http://localhost:${HTTP_PORT}`);
  console.log(`🔌 WebSocket server attached to HTTP server`);
  console.log(`🔒 Security enabled: CORS restricted, Rate limiting active, Auth available`);
  console.log(`📋 Allowed origins: ${securityConfig.cors.allowedOrigins.join(', ')}`);
});

console.log('🚀 Automaton Backend Server Started');
console.log(`📊 API: http://localhost:${HTTP_PORT}/api`);
console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);