/**
 * Canvas Manager
 * 
 * Parses and manages Obsidian/JSONL canvas files, extracts referenced content,
 * and generates subgraph exports with manifest generation.
 * 
 * Integration with automaton system:
 * - automaton.canvas.space.jsonl processing
 * - Metaverse canvas visualization
 * - CanvasL format support
 * - Subgraph export for sharing
 */

import { ManifestGenerator, Manifest, NodeMetadata } from "./manifest-generator.js";
import { SharedSecretManager, EncryptedManifest } from "../shared/crypto/shared-secrets.js";
import path from "path";
import fs from "fs";

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  file?: string;
  text?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: string;
  toNode: string;
  toSide?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface PublishOptions {
  includePrivate?: boolean;
  peerPublicKeys?: string[];
  derivationPath?: string;
  notes?: string;
}

export interface RumsfeldInteraction {
  type: 'agree' | 'disagree' | 'question' | 'reference' | 'hide';
  nodeId: string;
  userId?: string;
  timestamp: string;
  comment?: string;
}

export class CanvasManager {
  private vaultPath: string;
  private manifestGenerator?: ManifestGenerator;
  private sharedSecretManager?: SharedSecretManager;

  constructor(vaultPath: string, mnemonic?: string) {
    this.vaultPath = vaultPath;
    if (mnemonic) {
      this.manifestGenerator = new ManifestGenerator(vaultPath, mnemonic);
      this.sharedSecretManager = new SharedSecretManager(mnemonic);
    }
  }

  /**
   * Parse canvas file (Obsidian or JSONL format) to extract referenced content
   */
  public parseCanvasFile(canvasPath: string): {
    canvasData: CanvasData;
    referencedFiles: string[];
    canvasNodes: CanvasNode[];
  } {
    const fullCanvasPath = path.join(this.vaultPath, canvasPath);

    if (!fs.existsSync(fullCanvasPath)) {
      throw new Error(`Canvas file not found: ${canvasPath}`);
    }

    const canvasContent = fs.readFileSync(fullCanvasPath, 'utf-8');
    
    // Handle JSONL format (automaton canvas files)
    let canvasData: CanvasData;
    if (fullCanvasPath.endsWith('.jsonl')) {
      // Parse JSONL - extract nodes and edges
      const lines = canvasContent.split('\n').filter(line => line.trim());
      const nodes: CanvasNode[] = [];
      const edges: CanvasEdge[] = [];
      
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'node' || obj.id) {
            nodes.push({
              id: obj.id || `node-${nodes.length}`,
              x: obj.x || 0,
              y: obj.y || 0,
              width: obj.width || 200,
              height: obj.height || 100,
              type: obj.type || 'text',
              file: obj.file,
              text: obj.text
            });
          } else if (obj.type === 'edge' || (obj.fromNode && obj.toNode)) {
            edges.push({
              id: obj.id || `edge-${edges.length}`,
              fromNode: obj.fromNode || obj.from,
              fromSide: obj.fromSide,
              toNode: obj.toNode || obj.to,
              toSide: obj.toSide
            });
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
      
      canvasData = { nodes, edges };
    } else {
      // Handle standard JSON canvas format
      canvasData = JSON.parse(canvasContent);
    }

    const referencedFiles: string[] = [];
    const canvasNodes: CanvasNode[] = [];

    // Extract file references from canvas nodes
    for (const node of canvasData.nodes) {
      if (node.file) {
        // Normalize path relative to vault
        const normalizedPath = node.file.startsWith('/')
          ? node.file.substring(1)
          : node.file;

        referencedFiles.push(normalizedPath);
      }
      canvasNodes.push(node);
    }

    return {
      canvasData,
      referencedFiles: [...new Set(referencedFiles)], // Remove duplicates
      canvasNodes
    };
  }

  /**
   * Export canvas subgraph including all referenced files
   */
  public async exportCanvasSubgraph(
    canvasPath: string,
    options: PublishOptions = {}
  ): Promise<{
    manifest: Manifest;
    encryptedManifests?: Record<string, EncryptedManifest>;
    canvasData: CanvasData;
  }> {
    if (!this.manifestGenerator || !this.sharedSecretManager) {
      throw new Error('CanvasManager not initialized with mnemonic. Cannot generate manifest.');
    }

    const { canvasData, referencedFiles } = this.parseCanvasFile(canvasPath);

    // Create temporary directory with canvas and referenced files
    const tempDir = path.join(this.vaultPath, '.temp-export');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Copy canvas file
      const canvasFileName = path.basename(canvasPath);
      fs.copyFileSync(
        path.join(this.vaultPath, canvasPath),
        path.join(tempDir, canvasFileName)
      );

      // Copy referenced files
      for (const filePath of referencedFiles) {
        const fullPath = path.join(this.vaultPath, filePath);
        if (fs.existsSync(fullPath)) {
          const destPath = path.join(tempDir, path.basename(filePath));
          fs.copyFileSync(fullPath, destPath);

          // Also copy metadata if it exists
          const metadataPath = this.getMetadataPath(filePath);
          if (fs.existsSync(metadataPath)) {
            const metadataDestPath = path.join(tempDir, path.basename(metadataPath));
            fs.copyFileSync(metadataPath, metadataDestPath);
          }
        }
      }

      // Generate manifest for the subgraph
      const tempGenerator = new ManifestGenerator(
        tempDir,
        (this.sharedSecretManager as any).mnemonic,
        options.derivationPath
      );

      const result = await tempGenerator.buildManifest(undefined, options.notes);

      // Handle private sharing if peer keys provided
      let encryptedManifests: Record<string, EncryptedManifest> | undefined;
      if (options.peerPublicKeys && options.peerPublicKeys.length > 0) {
        encryptedManifests = {};
        for (const peerKey of options.peerPublicKeys) {
          encryptedManifests[peerKey] = this.sharedSecretManager!.encryptManifest(
            result.manifestStr,
            peerKey
          );
        }
      }

      return {
        manifest: result.manifest,
        encryptedManifests,
        canvasData
      };

    } finally {
      // Cleanup temporary directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Generate visualization data for canvas heatmap based on Rumsfeld scores
   */
  public generateCanvasHeatmapData(
    canvasPath: string,
    metadataTracker?: any // MetadataTracker instance
  ): {
    nodes: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      kkScore: number;
      kuScore: number;
      ukScore: number;
      uuScore: number;
      totalScore: number;
      heatmapColor: string;
    }>;
    maxScore: number;
  } {
    const { canvasNodes } = this.parseCanvasFile(canvasPath);
    
    const heatmapNodes = canvasNodes.map(node => {
      // Default scores if no metadata tracker
      let scores = { kk: 0, ku: 0, uk: 0, uu: 0 };
      
      if (metadataTracker && node.file) {
        // Try to get metadata for this file
        const metadataPath = this.getMetadataPath(node.file);
        if (fs.existsSync(metadataPath)) {
          try {
            const metadata: NodeMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            scores = metadata.rumsfeldScores;
          } catch (e) {
            // Use default scores
          }
        }
      }
      
      const totalScore = scores.kk + scores.ku + scores.uk + scores.uu;

      // Generate heatmap color based on total score
      const intensity = Math.min(totalScore / 10, 1); // Normalize to 0-1
      const red = Math.floor(255 * intensity);
      const green = Math.floor(255 * (1 - intensity));
      const heatmapColor = `rgb(${red}, ${green}, 0)`;

      return {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        kkScore: scores.kk,
        kuScore: scores.ku,
        ukScore: scores.uk,
        uuScore: scores.uu,
        totalScore,
        heatmapColor
      };
    });

    const maxScore = Math.max(...heatmapNodes.map(n => n.totalScore), 1);

    return {
      nodes: heatmapNodes,
      maxScore
    };
  }

  private getMetadataPath(filePath: string): string {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    return path.join(this.vaultPath, dir, `${baseName}.json`);
  }
}
