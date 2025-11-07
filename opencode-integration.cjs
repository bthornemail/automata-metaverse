#!/usr/bin/env node

/**
 * OpenCode Integration Manager (CommonJS)
 * Integrates opencode CLI commands with the automaton system
 * Provides unified interface for dimensional operations
 */

const { spawn } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

// Simple OpenCode Bridge for CommonJS
class OpenCodeBridge {
  constructor(canvasPath = './automaton.jsonl') {
    this.canvasPath = canvasPath;
  }
  
  async routeCommand(tool, params) {
    console.log(`Routing ${tool} through dimensional hierarchy`);
    
    // Update canvas with operation
    await this.updateCanvas(tool, params);
    
    // Execute command
    return await this.executeCommand(tool, params);
  }
  
  async updateCanvas(tool, params) {
    if (!existsSync(this.canvasPath)) {
      console.log('Canvas file not found, skipping update');
      return;
    }
    
    try {
      const fs = require('fs');
      const canvasData = fs.readFileSync(this.canvasPath, 'utf8');
      const lines = canvasData.split('\n').filter(line => line.trim());
      
      // Create new entry for this operation
      const newEntry = {
        id: `opencode-${tool}-${Date.now()}`,
        type: 'operation',
        tool,
        params,
        timestamp: new Date().toISOString(),
        x: Math.random() * 1000,
        y: Math.random() * 1000
      };
      
      // Add to canvas
      lines.push(JSON.stringify(newEntry));
      
      // Write back
      fs.writeFileSync(this.canvasPath, lines.join('\n') + '\n');
      console.log(`Updated canvas with ${tool} operation`);
    } catch (error) {
      console.error('Failed to update canvas:', error);
    }
  }
  
  async executeCommand(tool, params) {
    return new Promise((resolve, reject) => {
      let child;
      
      if (tool === 'read' && params.filePath) {
        // Read file directly
        try {
          const content = require('fs').readFileSync(params.filePath, 'utf8');
          resolve({ success: true, content, tool });
        } catch (error) {
          resolve({ success: false, error: error.message, tool });
        }
      } else if (tool === 'bash' && params.command) {
        // Execute bash command
        child = spawn('bash', ['-c', params.command], { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      } else if (tool === 'ls') {
        // List directory
        child = spawn('ls', ['-la'], { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      } else {
        // Generic command execution
        const args = Array.isArray(params.args) ? params.args : [];
        child = spawn(tool, args, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }
      
      if (!child) {
        resolve({ success: false, error: 'Unknown command', tool });
        return;
      }
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({ 
          success: code === 0, 
          stdout, 
          stderr, 
          exitCode: code, 
          tool 
        });
      });
      
      child.on('error', (error) => {
        resolve({ 
          success: false, 
          stdout: '', 
          stderr: error.message, 
          exitCode: -1, 
          tool 
        });
      });
    });
  }
}

class OpenCodeIntegration {
  constructor(config = {}) {
    this.config = {
      canvasPath: './automaton.jsonl',
      enableRouting: true,
      enableCanvasUpdate: true,
      logLevel: 'info',
      ...config
    };
    
    this.bridge = new OpenCodeBridge(this.config.canvasPath);
  }
  
  async executeCommand(command) {
    const { tool, args = [], priority = 'medium' } = command;
    
    this.log(`Executing ${tool} with priority ${priority}`, 'info');
    
    try {
      // Route through bridge
      const params = { args };
      if (tool === 'read' && args[0]) {
        params.filePath = args[0];
      } else if (tool === 'bash' && args[0]) {
        params.command = args[0];
      }
      
      const result = await this.bridge.routeCommand(tool, params);
      this.log(`Successfully executed ${tool}`, 'debug');
      return result;
      
    } catch (error) {
      this.log(`Failed to execute ${tool}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async batchExecute(commands) {
    this.log(`Executing batch of ${commands.length} commands`, 'info');
    
    const results = [];
    
    for (const command of commands) {
      try {
        const result = await this.executeCommand(command);
        results.push({ 
          tool: command.tool, 
          success: true, 
          result 
        });
      } catch (error) {
        results.push({ 
          tool: command.tool, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
  
  async getTopologyState() {
    if (!existsSync(this.config.canvasPath)) {
      return { error: 'Canvas file not found' };
    }
    
    try {
      const canvasData = require('fs').readFileSync(this.config.canvasPath, 'utf8');
      const lines = canvasData.split('\n').filter(line => line.trim());
      const entries = lines.map(line => JSON.parse(line));
      
      // Analyze current state
      const state = { total: entries.length, recent: [] };
      
      // Recent operations
      state.recent = entries
        .filter(entry => entry.type === 'operation')
        .slice(-10)
        .map(entry => ({
          tool: entry.tool || 'unknown',
          timestamp: entry.timestamp || 'unknown'
        }));
      
      return state;
    } catch (error) {
      return { error: `Failed to read canvas: ${error.message}` };
    }
  }
  
  async createReport() {
    const topologyState = await this.getTopologyState();
    
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      topology: topologyState,
      integration: {
        bridge: 'OpenCodeBridge active',
        canvas: this.config.enableCanvasUpdate ? 'enabled' : 'disabled'
      }
    };
  }
  
  log(message, level = 'info') {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    const messageLevel = levels[level] || 1;
    
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
    console.log('  opencode-integration status');
    console.log('  opencode-integration report');
    console.log('');
    console.log('Examples:');
    console.log('  opencode-integration execute read ./package.json');
    console.log('  opencode-integration execute bash "ls -la"');
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
        .catch((error) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    case 'status':
      integration.getTopologyState()
        .then(state => {
          console.log('Topology State:', JSON.stringify(state, null, 2));
        })
        .catch((error) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      integration.createReport()
        .then(report => {
          console.log('Integration Report:', JSON.stringify(report, null, 2));
        })
        .catch((error) => {
          console.error('Error:', error.message);
          process.exit(1);
        });
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

module.exports = OpenCodeIntegration;