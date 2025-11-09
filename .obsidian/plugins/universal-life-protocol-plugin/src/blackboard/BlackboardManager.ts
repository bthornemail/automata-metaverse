/**
 * Blackboard Manager - Control component that coordinates agents
 */

import { App, TFile, Notice } from 'obsidian';
import { Blackboard } from './Blackboard';
import { IBlackboardAgent, EpistemicNode } from './types';
import { CanvasSyncAgent } from '../agents/CanvasSyncAgent';

export class BlackboardManager {
  private agents: IBlackboardAgent[] = [];
  private blackboard: Blackboard;
  private processingQueue: Set<string> = new Set();
  private isProcessing: boolean = false;

  constructor(private app: App) {
    this.blackboard = new Blackboard(app);
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    // Register default agents
    this.registerAgent(new CanvasSyncAgent());
    // Add more agents here as you create them
  }

  registerAgent(agent: IBlackboardAgent) {
    this.agents.push(agent);
    // Sort by priority (lower number = higher priority)
    this.agents.sort((a, b) => a.priority - b.priority);
    console.log(`Registered agent: ${agent.name} (priority: ${agent.priority})`);
  }

  async processNode(nodeId: string, force: boolean = false): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(nodeId) && !force) {
      console.log(`Node ${nodeId} already in processing queue`);
      return;
    }

    this.processingQueue.add(nodeId);

    try {
      const node = await this.blackboard.getNode(nodeId);
      if (!node) {
        console.warn(`Node ${nodeId} not found`);
        return;
      }

      console.log(`Processing node: ${node.frontmatter.title} (${nodeId})`);

      // Mark as processing
      await this.blackboard.updateNode(nodeId, {
        blackboard: {
          ...node.frontmatter.blackboard,
          status: 'processing',
          lastUpdate: Date.now()
        }
      });

      // Find capable agents
      const capableAgents = this.agents.filter(agent => agent.canProcess(node));
      console.log(`Found ${capableAgents.length} capable agents for ${nodeId}`);

      let hasIssues = false;
      const allIssues: string[] = [];

      // Process with each capable agent
      for (const agent of capableAgents) {
        try {
          console.log(`Agent ${agent.name} processing ${nodeId}...`);
          const result = await agent.process(node, this.blackboard);

          if (result.success) {
            console.log(`✓ Agent ${agent.name} succeeded on ${nodeId}`);
          } else {
            console.warn(`✗ Agent ${agent.name} failed on ${nodeId}`, result.issues);
            hasIssues = true;
            if (result.issues) {
              allIssues.push(...result.issues);
            }
          }
        } catch (error) {
          console.error(`Agent ${agent.name} threw error on ${nodeId}:`, error);
          hasIssues = true;
          allIssues.push(`${agent.name}: ${error.message}`);
        }
      }

      // Update final status
      await this.blackboard.updateNode(nodeId, {
        blackboard: {
          ...node.frontmatter.blackboard,
          status: hasIssues ? 'needs-review' : 'completed',
          lastUpdate: Date.now(),
          validationIssues: allIssues.length > 0 ? allIssues : undefined
        }
      });

      console.log(`Completed processing node: ${nodeId} (status: ${hasIssues ? 'needs-review' : 'completed'})`);
    } catch (error) {
      console.error(`Error processing node ${nodeId}:`, error);
      throw error;
    } finally {
      this.processingQueue.delete(nodeId);
    }
  }

  async processAll(progressCallback?: (current: number, total: number, node: string) => void): Promise<void> {
    if (this.isProcessing) {
      console.warn('Blackboard is already processing');
      return;
    }

    this.isProcessing = true;

    try {
      const allNodes = await this.blackboard.getAllNodes();
      console.log(`Processing ${allNodes.length} nodes...`);

      let current = 0;
      for (const node of allNodes) {
        current++;
        if (progressCallback) {
          progressCallback(current, allNodes.length, node.frontmatter.title);
        }
        await this.processNode(node.id);
      }

      console.log('Completed processing all nodes');
    } catch (error) {
      console.error('Error processing all nodes:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async processDirectory(directoryPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(directoryPath);
    if (!folder) {
      console.warn(`Directory not found: ${directoryPath}`);
      return;
    }

    const files = this.app.vault.getMarkdownFiles()
      .filter(file => file.path.startsWith(directoryPath));

    console.log(`Processing ${files.length} files in ${directoryPath}...`);

    for (const file of files) {
      const node = await this.blackboard.getNodeByPath(file.path);
      if (node) {
        await this.processNode(node.id);
      }
    }
  }

  async watchForChanges() {
    // Watch for file modifications
    this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile && file.extension === 'md') {
        const node = await this.blackboard.getNodeByPath(file.path);
        if (node) {
          console.log(`File modified: ${file.path}, triggering processing`);
          // Debounce processing to avoid too many triggers
          setTimeout(() => {
            this.processNode(node.id);
          }, 1000);
        }
      }
    });

    // Watch for file creation
    this.app.vault.on('create', async (file) => {
      if (file instanceof TFile && file.extension === 'md') {
        // Give time for frontmatter to be written
        setTimeout(async () => {
          const node = await this.blackboard.getNodeByPath(file.path);
          if (node) {
            console.log(`New file created: ${file.path}, triggering processing`);
            await this.processNode(node.id);
          }
        }, 2000);
      }
    });

    console.log('Blackboard watching for changes...');
  }

  getBlackboard(): Blackboard {
    return this.blackboard;
  }

  getAgents(): IBlackboardAgent[] {
    return [...this.agents];
  }

  clearCache() {
    this.blackboard.clearCache();
  }
}
