/**
 * Legacy API Handler
 * 
 * Handles legacy API endpoints for backward compatibility
 * This will be gradually migrated to Express routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AutomatonController } from './automaton-controller';
import WordNetIntegration from '../services/wordnet';
import { simpleOpenCodeService } from '../services/simple-opencode';
import OpenCodeIntegration from '../../opencode-integration';
import { calculateActionFrequency, calculateDimensionalProgression, calculatePerformanceMetrics, analyzeSelfReferences, analyzePatterns } from './automaton-analysis';
import { handleAgentMessage } from './agent-handler';

/**
 * Setup legacy API handler middleware
 */
export function setupLegacyApiHandler(
  app: express.Application,
  automatonController: AutomatonController,
  wordNet: WordNetIntegration
): void {
  const automaton = automatonController.getAutomaton();
  app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    // Skip routes already handled by Express routers
    if (req.path.startsWith('/auth') || res.headersSent) {
      return next();
    }

    const apiPath = req.path.replace('/api/', '') || '';
    
    try {
      let response: any = { success: true, timestamp: Date.now() };
      
      // Parse body if needed (Express already parsed it)
      const body = (req as any).body || {};

      // Handle NL Query endpoints
      if (apiPath.startsWith('nl-query/')) {
        const { handleNLQueryRequest } = await import('../routes/nl-query-simple');
        const handled = await handleNLQueryRequest(apiPath, req, res);
        if (handled) {
          return;
        }
      }

      // Handle JSONL endpoints
      if (apiPath.startsWith('jsonl/')) {
        const fileName = apiPath.replace('jsonl/', '');
        try {
          const filePath = join(__dirname, '../../', fileName);
          
          if (!existsSync(filePath)) {
            response.success = false;
            response.error = `File not found: ${fileName}`;
          } else {
            const content = readFileSync(filePath, 'utf-8');
            
            if (typeof content !== 'string') {
              response.success = false;
              response.error = `Invalid file content: expected string, got ${typeof content}`;
            } else {
              let data: any[] = [];
              
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  data = parsed;
                } else {
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
        
        res.json(response);
        return;
      }

      // Handle other legacy endpoints
      const state = automatonController.getState();

      switch (apiPath) {
        case 'status':
          response.data = {
            isRunning: state.isRunning,
            currentDimension: (automaton as any).currentDimension,
            iterationCount: (automaton as any).executionHistory.length,
            selfModificationCount: (automaton as any).selfModificationCount,
            totalObjects: (automaton as any).objects.length,
            executionMode: 'builtin',
            status: state.isRunning ? 'running' : 'idle',
          };
          break;

        case 'automaton/start':
          if (state.isRunning) {
            response.success = false;
            response.error = 'Automaton is already running';
          } else {
            const intervalMs = body.intervalMs || 2000;
            const maxIterations = body.maxIterations || Infinity;
            automatonController.start(intervalMs, maxIterations);
          }
          break;

        case 'automaton/stop':
          if (!state.isRunning) {
            response.success = false;
            response.error = 'Automaton is not running';
          } else {
            automatonController.stop();
          }
          break;

        case 'automaton/reset':
          try {
            automatonController.reset();
            response.success = true;
          } catch (error) {
            response.success = false;
            response.error = 'Failed to reset automaton';
          }
          break;

        case 'automaton/action':
          if (!state.isRunning) {
            const action = body.action;
            if (action) {
              automatonController.executeAction(action);
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
          if (!state.isRunning) {
            const dimension = body.dimension;
            if (dimension >= 0 && dimension <= 7) {
              (automaton as any).currentDimension = dimension;
              response.data = { dimension, set: true };
              // Notify clients via WebSocket (would need io instance)
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
            actionFrequency: calculateActionFrequency(automaton),
            dimensionalProgression: calculateDimensionalProgression(automaton),
            performanceMetrics: calculatePerformanceMetrics(automaton),
          };
          break;

        case 'analysis/self-reference':
          response.data = analyzeSelfReferences(automaton);
          break;

        case 'analysis/patterns':
          response.data = analyzePatterns(automaton);
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
            response.data = await handleAgentMessage(agent, message, automatonController);
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
            response.data = { updated: true };
          }
          break;

        case 'file/load':
          const filePath = body.filePath;
          if (filePath) {
            try {
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
          const model = body.model;
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
          const analyzeWord = body.word || apiPath.replace('wordnet/analyze/', '');
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
            isRunning: state.isRunning,
            currentDimension: (automaton as any).currentDimension,
            iterationCount: (automaton as any).executionHistory?.length || 0,
            selfModificationCount: (automaton as any).selfModificationCount,
            totalObjects: (automaton as any).objects.length,
            status: state.isRunning ? 'running' : 'idle',
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
            currentSession: null,
            availableModels: simpleOpenCodeService.getAvailableModels(),
            availableAgents: simpleOpenCodeService.getAvailableAgents()
          };
          break;

        case 'opencode/agent/list':
          response.data = simpleOpenCodeService.getAvailableAgents();
          break;

        case 'opencode/agent/execute':
          const agentName = body.agent;
          const agentTask = body.task;
          
          if (agentName && agentTask) {
            response.data = await simpleOpenCodeService.executeAgentTask(agentName, agentTask);
          } else {
            response.success = false;
            response.error = 'Agent name and task are required';
          }
          break;

        case 'opencode/model/set':
          const newModel = body.model;
          
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
          // Let Express handle it
          return next();
      }

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
}
