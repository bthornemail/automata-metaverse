#!/usr/bin/env node

/**
 * Command Routing System for OpenCode-Automaton Integration
 * Routes CLI commands through appropriate dimensional agents
 */

import { spawn } from 'child_process';
import OpenCodeBridge from './opencode-bridge';

class CommandRouter {
  private bridge: OpenCodeBridge;
  
  constructor() {
    this.bridge = new OpenCodeBridge();
  }
  
  /**
   * Route command based on tool type
   */
  async route(tool: string, args: any[]): Promise<any> {
    console.log(`Routing command: ${tool} with args:`, args);
    
    switch (tool) {
      case 'read':
        return this.routeRead(args);
      case 'edit':
        return this.routeEdit(args);
      case 'write':
        return this.routeWrite(args);
      case 'bash':
        return this.routeBash(args);
      case 'glob':
        return this.routeGlob(args);
      case 'grep':
        return this.routeGrep(args);
      case 'task':
        return this.routeTask(args);
      case 'todowrite':
        return this.routeTodoWrite(args);
      case 'todoread':
        return this.routeTodoRead(args);
      default:
        return this.routeGeneric(tool, args);
    }
  }
  
  private async routeRead(args: any[]) {
    const params = { filePath: args[0] };
    return await this.bridge.routeCommand('read', params);
  }
  
  private async routeEdit(args: any[]) {
    const params = {
      filePath: args[0],
      oldString: args[1],
      newString: args[2],
      replaceAll: args[3] || false
    };
    return await this.bridge.routeCommand('edit', params);
  }
  
  private async routeWrite(args: any[]) {
    const params = {
      filePath: args[0],
      content: args[1]
    };
    return await this.bridge.routeCommand('write', params);
  }
  
  private async routeBash(args: any[]) {
    const params = {
      command: args[0],
      timeout: args[1] || 120000
    };
    return await this.bridge.routeCommand('bash', params);
  }
  
  private async routeGlob(args: any[]) {
    const params = {
      pattern: args[0],
      path: args[1]
    };
    return await this.bridge.routeCommand('glob', params);
  }
  
  private async routeGrep(args: any[]) {
    const params = {
      pattern: args[0],
      path: args[1],
      include: args[2]
    };
    return await this.bridge.routeCommand('grep', params);
  }
  
  private async routeTask(args: any[]) {
    const params = {
      description: args[0],
      prompt: args[1],
      subagent_type: args[2]
    };
    return await this.bridge.routeCommand('task', params);
  }
  
  private async routeTodoWrite(args: any[]) {
    const params = {
      todos: args[0]
    };
    return await this.bridge.routeCommand('todowrite', params);
  }
  
  private async routeTodoRead(_args: any[]) {
    return await this.bridge.routeCommand('todoread', {});
  }
  
  private async routeGeneric(tool: string, args: any[]) {
    const params = { args };
    return await this.bridge.routeCommand(tool, params);
  }
  
  /**
   * Execute external command with dimensional routing
   */
  async executeExternal(command: string, args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const tool = command.split('-')[0] || command; // Extract base tool name
      const child = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', async (code) => {
        if (code === 0) {
          try {
            // Route the successful command through dimensional hierarchy
            const result = await this.route(tool, args);
            resolve({
              command,
              args,
              stdout,
              stderr,
              exitCode: code,
              dimensionalResult: result
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', reject);
    });
  }
  
  /**
   * Batch route multiple commands
   */
  async batchRoute(commands: Array<{tool: string, args: any[]}>) {
    const results = [];
    
    for (const cmd of commands) {
      try {
        const result = await this.route(cmd.tool, cmd.args);
        results.push({ tool: cmd.tool, success: true, result });
      } catch (error: any) {
        results.push({ tool: cmd.tool, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Pipeline commands through dimensional progression
   */
  async pipeline(commands: Array<{tool: string, args: any[]}>) {
    let result = null;
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (!cmd) continue;
      
      // Pass previous result as context if available
      if (result && i > 0) {
        cmd.args.push(result);
      }
      
      try {
        result = await this.route(cmd.tool, cmd.args);
        console.log(`Pipeline step ${i + 1} completed:`, cmd.tool);
      } catch (error: any) {
        throw new Error(`Pipeline failed at step ${i + 1} (${cmd.tool}): ${error.message}`);
      }
    }
    
    return result;
  }
}

// CLI Interface
if (require.main === module) {
  const router = new CommandRouter();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: command-router <tool> <args...>');
    console.log('Available tools: read, edit, write, bash, glob, grep, task, todowrite, todoread');
    process.exit(1);
  }
  
  const tool = args[0] || '';
  const toolArgs = args.slice(1);
  
  router.route(tool, toolArgs)
    .then(result => {
      console.log('Routed result:', JSON.stringify(result, null, 2));
    })
    .catch((error: any) => {
      console.error('Routing error:', error.message);
      process.exit(1);
    });
}

export default CommandRouter;