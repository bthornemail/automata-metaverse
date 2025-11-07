import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';
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

const HTTP_PORT = 3000;
const WS_PORT = 3001;
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

// Simple HTTP server for API endpoints and static files
const httpServer = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const requestUrl = req.url ?? `http://localhost:${HTTP_PORT}`;
  const url = new URL(requestUrl, `http://localhost:${HTTP_PORT}`);
  const path = url.pathname || '';

  // API Routes
  if (path.startsWith('/api/')) {
    handleAPIRequest(path, req, res);
  } else {
    // Serve static files from UI dist
    serveStaticFile(path, res);
  }
});

function serveStaticFile(path: string, res: any) {
  // Default to index.html for root or non-file paths
  let filePath = path === '/' ? 'index.html' : path;
  
  // Remove leading slash
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }
  
  const fullPath = join(UI_DIST_PATH, filePath);
  const ext = extname(fullPath);
  
  // If no extension and file doesn't exist, try index.html (for SPA routing)
  if (!ext && !existsSync(fullPath)) {
    const indexPath = join(UI_DIST_PATH, 'index.html');
    if (existsSync(indexPath)) {
      filePath = 'index.html';
    }
  }
  
  const finalPath = join(UI_DIST_PATH, filePath);
  
  if (!existsSync(finalPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  
  try {
    const content = readFileSync(finalPath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

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

// API Request Handler
async function handleAPIRequest(path: string, req: any, res: any) {
    const apiPath = path.replace('/api/', '') || '';
  
  try {
    let response: any = { success: true, timestamp: Date.now() };

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
          const body = await parseRequestBody(req);
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
          const body = await parseRequestBody(req);
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
        const body = await parseRequestBody(req);
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
            useOllama: false,
            model: 'llama2',
            automatonFile: './automaton.jsonl'
          };
        } else if (req.method === 'PUT') {
          // Configuration update logic would go here
          response.data = { updated: true };
        }
        break;

      case 'file/load':
        const loadBody = await parseRequestBody(req);
        const filePath = loadBody.filePath;
        
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
        const lookupBody = await parseRequestBody(req);
        const lookupWord = lookupBody.word || apiPath.replace('wordnet/lookup/', '');
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
        const relBody = await parseRequestBody(req);
        const relWords = relBody.words || [relBody.word1, relBody.word2];
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
        const searchBody = await parseRequestBody(req);
        const pattern = searchBody.pattern;
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

      default:
        response.success = false;
        response.error = 'Unknown endpoint';
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));

  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: Date.now()
    }));
  }
}

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

    // Add to execution history
    const historyEntry = {
      iteration: iterationCount,
      action,
      from: `${fromDim}D`,
      to: `${toDim}D`,
      timestamp: Date.now()
    };
    
    if (!(automaton as any).executionHistory) {
      (automaton as any).executionHistory = [];
    }
    (automaton as any).executionHistory.push(historyEntry);

    // Emit action execution with proper data
    io.emit('action', { 
      action, 
      result: 'success', 
      timestamp: Date.now(),
      from: `${fromDim}D`,
      to: `${toDim}D`,
      iteration: iterationCount
    });

  } catch (error) {
    console.error(`❌ Failed to execute action ${action}:`, error);
    io.emit('error', { action: action, error: error instanceof Error ? error.message : 'Unknown error' });
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

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from WebSocket');
  });
});

// Start servers
httpServer.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP API server running on http://localhost:${HTTP_PORT}`);
});

io.attach(httpServer);
console.log(`🔌 WebSocket server attached to HTTP server`);

console.log('🚀 Automaton Backend Server Started');
console.log(`📊 API: http://localhost:${HTTP_PORT}/api`);
console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);