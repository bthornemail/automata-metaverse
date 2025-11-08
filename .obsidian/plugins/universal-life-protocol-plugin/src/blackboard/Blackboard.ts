/**
 * Blackboard - Core data structure for knowledge sharing
 */

import { App, TFile } from 'obsidian';
import {
  EpistemicNode,
  EpistemicNodeFrontmatter,
  Canvas,
  CanvasNode,
  IBlackboard
} from './types';
import { parseYaml, stringifyYaml } from 'obsidian';

export class Blackboard implements IBlackboard {
  private nodeCache: Map<string, EpistemicNode> = new Map();
  private canvasCache: Map<string, Canvas> = new Map();

  constructor(private app: App) {}

  async getNode(nodeId: string): Promise<EpistemicNode | null> {
    if (this.nodeCache.has(nodeId)) {
      return this.nodeCache.get(nodeId)!;
    }

    const file = this.findFileByNodeId(nodeId);
    if (!file) return null;

    const node = await this.loadNode(file);
    if (node) {
      this.nodeCache.set(nodeId, node);
    }

    return node;
  }

  async getNodeByPath(path: string): Promise<EpistemicNode | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return null;

    return await this.loadNode(file);
  }

  async getAllNodes(): Promise<EpistemicNode[]> {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: EpistemicNode[] = [];

    for (const file of files) {
      const node = await this.loadNode(file);
      if (node && node.id) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  async updateNode(nodeId: string, updates: Partial<EpistemicNodeFrontmatter>): Promise<void> {
    const file = this.findFileByNodeId(nodeId);
    if (!file) {
      console.warn(`Node ${nodeId} not found`);
      return;
    }

    const content = await this.app.vault.read(file);
    const updatedContent = this.updateFrontmatter(content, updates);
    await this.app.vault.modify(file, updatedContent);

    // Clear cache
    this.nodeCache.delete(nodeId);
  }

  async getDocumentContent(nodeId: string): Promise<string> {
    const file = this.findFileByNodeId(nodeId);
    if (!file) return '';

    const content = await this.app.vault.read(file);
    // Remove frontmatter
    return content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  async findCanvasNode(nodeId: string): Promise<CanvasNode | null> {
    const canvasFiles = this.app.vault.getFiles().filter(f => f.extension === 'canvas');

    for (const canvasFile of canvasFiles) {
      const canvas = await this.getCanvas(canvasFile.path);
      if (!canvas) continue;

      const node = canvas.nodes?.find((n: CanvasNode) =>
        n.metadata?.epistemicNodeId === nodeId
      );

      if (node) {
        return { ...node, canvasFile: canvasFile.path } as any;
      }
    }

    return null;
  }

  async createCanvasNode(node: CanvasNode): Promise<void> {
    const canvasPath = this.determineCanvasPath(node);
    const canvas = await this.getCanvas(canvasPath);

    if (canvas) {
      canvas.nodes.push(node);
      await this.updateCanvas(canvasPath, canvas);
    }
  }

  async updateCanvasNode(nodeId: string, updates: Partial<CanvasNode>): Promise<void> {
    const canvasNode = await this.findCanvasNode(nodeId);
    if (!canvasNode) return;

    const canvasPath = (canvasNode as any).canvasFile;
    const canvas = await this.getCanvas(canvasPath);
    if (!canvas) return;

    const index = canvas.nodes.findIndex(n => n.id === canvasNode.id);
    if (index !== -1) {
      canvas.nodes[index] = { ...canvas.nodes[index], ...updates };
      await this.updateCanvas(canvasPath, canvas);
    }
  }

  async getCanvas(canvasPath: string): Promise<Canvas | null> {
    if (this.canvasCache.has(canvasPath)) {
      return this.canvasCache.get(canvasPath)!;
    }

    const file = this.app.vault.getAbstractFileByPath(canvasPath);
    if (!(file instanceof TFile)) {
      // Create new canvas if it doesn't exist
      return { nodes: [], edges: [] };
    }

    try {
      const content = await this.app.vault.read(file);
      const canvas: Canvas = JSON.parse(content);
      this.canvasCache.set(canvasPath, canvas);
      return canvas;
    } catch (error) {
      console.error(`Error loading canvas ${canvasPath}:`, error);
      return null;
    }
  }

  async updateCanvas(canvasPath: string, canvas: Canvas): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(canvasPath);
    const content = JSON.stringify(canvas, null, 2);

    if (file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      // Create new canvas file
      await this.app.vault.create(canvasPath, content);
    }

    this.canvasCache.set(canvasPath, canvas);
  }

  clearCache() {
    this.nodeCache.clear();
    this.canvasCache.clear();
  }

  // Private helper methods

  private findFileByNodeId(nodeId: string): TFile | null {
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter?.id === nodeId) {
        return file;
      }
    }

    return null;
  }

  private async loadNode(file: TFile): Promise<EpistemicNode | null> {
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return null;

    const frontmatter = cache.frontmatter as EpistemicNodeFrontmatter;
    if (!frontmatter.id) return null;

    return {
      id: frontmatter.id,
      path: file.path,
      frontmatter
    };
  }

  private updateFrontmatter(content: string, updates: any): string {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return content;

    try {
      const yamlText = match[1];
      const frontmatter = parseYaml(yamlText);
      const merged = this.deepMerge(frontmatter, updates);

      const newYaml = stringifyYaml(merged);
      return content.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
    } catch (error) {
      console.error('Error updating frontmatter:', error);
      return content;
    }
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  private determineCanvasPath(node: CanvasNode): string {
    // Logic to determine which canvas this node belongs to
    // Based on metadata or default to main epistemic canvas
    return '00-Canvas/Epistemic-Network.canvas';
  }
}
