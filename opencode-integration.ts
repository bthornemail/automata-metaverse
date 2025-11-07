#!/usr/bin/env node

/**
 * OpenCode Integration Manager
 * Integrates opencode CLI commands with the automaton system
 * Provides unified interface for dimensional operations
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import OpenCodeBridge from './opencode-bridge';
import CommandRouter from './command-router';

interface OpenCodeCommand {
  tool: string;
  args: any[];
  dimension?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface IntegrationConfig {
  canvasPath: string;
  enableRouting: boolean;
  enableCanvasUpdate: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class OpenCodeIntegration {
  private bridge: OpenCodeBridge;
  private router: CommandRouter;
  private config: IntegrationConfig;
  
  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      canvasPath: './automaton.jsonl',
      enableRouting: true,
      enableCanvasUpdate: true,
      logLevel: 'info',
      ...config
    };
    
    this.bridge = new OpenCodeBridge(this.config.canvasPath);
    this.router = new CommandRouter();
  }
  
  /**
   * Execute opencode command with full integration
   */
  async executeCommand(command: OpenCodeCommand): Promise<any> {
    const { tool, args, priority = 'medium' } = command;
    
    this.log(`Executing ${tool} with priority ${priority}`, 'info');
    
    try {
      // Route through dimensional hierarchy if enabled
      if (this.config.enableRouting) {
        const routedResult = await this.router.route(tool, args);
        this.log(`Routed ${tool} through dimensional hierarchy`, 'debug');
        return routedResult;
      }
      
      // Direct execution
      const result = await this.executeDirect(tool, args);
      return result;
      
    } catch (error: any) {
      this.log(`Routing failed for ${tool}, falling back to direct execution: ${error.message}`, 'warn');
      
      // Fallback to direct execution
      try {
        const result = await this.executeDirect(tool, args);
        this.log(`Direct execution succeeded for ${tool}`, 'debug');
        return result;
      } catch (directError: any) {
        this.log(`Both routing and direct execution failed for ${tool}: ${directError.message}`, 'error');
        throw directError;
      }
    }
  }
  
  /**
   * Execute command directly using bridge
   */
  private async executeDirect(tool: string, args: any[]): Promise<any> {
    // Map args to params based on tool type
    let params: any = {};
    
    switch (tool) {
      case 'read':
        params = { filePath: args[0] };
        break;
      case 'write':
        params = { filePath: args[0], content: args[1] };
        break;
      case 'edit':
        params = { 
          filePath: args[0], 
          oldString: args[1] || '', 
          newString: args[2] || '',
          replaceAll: args[3] || false
        };
        break;
      case 'glob':
        params = { pattern: args[0] || '**/*', path: args[1] };
        break;
      case 'grep':
        params = { pattern: args[0], path: args[1], include: args[2] };
        break;
      case 'bash':
        params = { command: args[0], timeout: args[1] };
        break;
      case 'task':
        params = { description: args[0], prompt: args[1] };
        break;
      case 'todowrite':
        params = { todos: args[0] };
        break;
      case 'todoread':
        params = {};
        break;
      case 'generate-metaverse':
        params = { outputPath: args[0] || './generate.metaverse.jsonl' };
        break;
      default:
        params = { args };
    }
    
    // Route through bridge
    return await this.bridge.routeCommand(tool, params);
  }
  
  /**
   * Batch execute multiple commands
   */
  async batchExecute(commands: OpenCodeCommand[]): Promise<any[]> {
    this.log(`Executing batch of ${commands.length} commands`, 'info');
    
    const results = [];
    
    // Sort by priority
    const sortedCommands = commands.sort((a, b) => {
      const priorities = { low: 0, medium: 1, high: 2 };
      return (priorities[b.priority || 'medium'] || 1) - (priorities[a.priority || 'medium'] || 1);
    });
    
    for (const command of sortedCommands) {
      try {
        const result = await this.executeCommand(command);
        results.push({ 
          tool: command.tool, 
          success: true, 
          result 
        });
      } catch (error: any) {
        results.push({ 
          tool: command.tool, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
  
  /**
   * Pipeline commands with dimensional progression
   */
  async pipeline(commands: OpenCodeCommand[]): Promise<any> {
    this.log(`Starting pipeline with ${commands.length} commands`, 'info');
    
    let context = null;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) {
        throw new Error(`Command at index ${i} is undefined`);
      }
      
      // Add context from previous command
      if (context && command.args.length > 0) {
        command.args.push(JSON.stringify(context));
      }
      
      try {
        const result = await this.executeCommand(command);
        context = result;
        this.log(`Pipeline step ${i + 1} (${command.tool}) completed`, 'debug');
      } catch (error: any) {
        throw new Error(`Pipeline failed at step ${i + 1} (${command.tool}): ${error.message}`);
      }
    }
    
    return context;
  }
  
  /**
   * Get current state of computational topology
   */
  async getTopologyState(): Promise<any> {
    if (!existsSync(this.config.canvasPath)) {
      return { error: 'Canvas file not found' };
    }
    
    try {
      const canvasData = readFileSync(this.config.canvasPath, 'utf8');
      const lines = canvasData.split('\n').filter(line => line.trim());
      const entries = lines.map(line => JSON.parse(line));
      
      // Analyze current state
      const dimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
      const state: any = { total: entries.length, dimensions: {} };
      
      for (const dim of dimensions) {
        state.dimensions[dim] = entries.filter(entry => entry.dimension === dim).length;
      }
      
      // Recent operations
      state.recent = entries
        .filter(entry => entry.type === 'operation')
        .slice(-10)
        .map(entry => ({
          tool: entry.tool || 'unknown',
          dimension: entry.dimension || 'unknown',
          timestamp: entry.timestamp || 'unknown'
        }));
      
      return state;
    } catch (error: any) {
      return { error: `Failed to read canvas: ${error.message}` };
    }
  }
  
  /**
   * Create integration report
   */
  async createReport(): Promise<any> {
    const topologyState = await this.getTopologyState();
    
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      topology: topologyState,
      integration: {
        bridge: 'OpenCodeBridge active',
        router: 'CommandRouter active',
        canvas: this.config.enableCanvasUpdate ? 'enabled' : 'disabled'
      }
    };
  }
  
  /**
   * Logging utility
   */
  private log(message: string, level: string = 'info'): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    const messageLevel = levels[level as keyof typeof levels] || 1;
    
    if (messageLevel >= configLevel) {
      console.log(`[OpenCodeIntegration] ${level.toUpperCase()}: ${message}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('OpenCode Integration Manager');
    console.log('');
    console.log('Usage:');
    console.log('  opencode-integration execute <tool> <args...>');
    console.log('  opencode-integration batch <json-file>');
    console.log('  opencode-integration pipeline <json-file>');
    console.log('  opencode-integration status');
    console.log('  opencode-integration report');
    console.log('');
    console.log('Examples:');
    console.log('  opencode-integration execute read ./package.json');
    console.log('  opencode-integration execute bash "ls -la"');
    console.log('  opencode-integration execute generate-metaverse ./generate.metaverse.jsonl');
    process.exit(0);
  }
  
  const command = args[0];
  const integration = new OpenCodeIntegration();
  
  switch (command) {
    case 'execute':
      if (args.length < 2) {
        console.error('Usage: opencode-integration execute <tool> <args...>');
        process.exit(1);
      }
      
      const tool = args[1] || '';
      const toolArgs = args.slice(2);
      
      integration.executeCommand({ tool, args: toolArgs })
        .then(result => {
          console.log('Result:', JSON.stringify(result, null, 2));
        })
        .catch((error: any) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    case 'status':
      integration.getTopologyState()
        .then(state => {
          console.log('Topology State:', JSON.stringify(state, null, 2));
        })
        .catch((error: any) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      integration.createReport()
        .then(report => {
          console.log('Integration Report:', JSON.stringify(report, null, 2));
        })
        .catch((error: any) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

export default OpenCodeIntegration;