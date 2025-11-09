import { ManifestGenerator, Manifest, NodeMetadata } from "./manifest-generator.js";
import { SharedSecretManager, EncryptedManifest } from "./shared-secrets.js";
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
  fromSide: string;
  toNode: string;
  toSide: string;
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

export class ObsidianPluginIntegration {
  private vaultPath: string;
  private manifestGenerator: ManifestGenerator;
  private sharedSecretManager: SharedSecretManager;

  constructor(vaultPath: string, mnemonic: string) {
    this.vaultPath = vaultPath;
    this.manifestGenerator = new ManifestGenerator(vaultPath, mnemonic);
    this.sharedSecretManager = new SharedSecretManager(mnemonic);
  }

  /**
   * Parse Obsidian canvas file to extract referenced content
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
    const canvasData: CanvasData = JSON.parse(canvasContent);

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
        this.sharedSecretManager['mnemonic'],
        options.derivationPath
      );

      const result = await tempGenerator.buildManifest(undefined, options.notes);

      // Handle private sharing if peer keys provided
      let encryptedManifests: Record<string, EncryptedManifest> | undefined;
      if (options.peerPublicKeys && options.peerPublicKeys.length > 0) {
        encryptedManifests = {};
        for (const peerKey of options.peerPublicKeys) {
          encryptedManifests[peerKey] = this.sharedSecretManager.encryptManifest(
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
   * Process Rumsfeld square interaction on a node
   */
  public processRumsfeldInteraction(
    interaction: RumsfeldInteraction
  ): NodeMetadata | null {
    const { nodeId, type } = interaction;

    // Find the file associated with this node ID
    const metadataPath = this.findMetadataByNodeId(nodeId);
    if (!metadataPath) {
      console.warn(`No metadata found for node ID: ${nodeId}`);
      return null;
    }

    // Load existing metadata
    let metadata: NodeMetadata;
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } else {
      // Create default metadata
      const relativePath = path.relative(this.vaultPath, metadataPath.replace('.json', '.md'));
      metadata = this.manifestGenerator.generateMetadataTemplate(relativePath);
    }

    // Update Rumsfeld scores based on interaction
    const updatedMetadata = this.manifestGenerator.updateRumsfeldScores(metadata, type);

    // Add interaction to history
    if (!updatedMetadata['history']) {
      updatedMetadata['history'] = [];
    }
    updatedMetadata['history'].push({
      timestamp: interaction.timestamp,
      interaction: type,
      userId: interaction.userId,
      comment: interaction.comment,
      rumsfeldScores: { ...updatedMetadata.rumsfeldScores }
    });

    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return updatedMetadata;
  }

  /**
   * Aggregate Rumsfeld scores for canvas visualization
   */
  public aggregateCanvasScores(canvasPath: string): Record<string, {
    nodeId: string;
    scores: typeof NodeMetadata.prototype.rumsfeldScores;
    childScores: Array<typeof NodeMetadata.prototype.rumsfeldScores>;
    totalScore: number;
  }> {
    const { canvasNodes, referencedFiles } = this.parseCanvasFile(canvasPath);
    const aggregatedScores: Record<string, any> = {};

    for (const node of canvasNodes) {
      const nodeScores = {
        nodeId: node.id,
        scores: { kk: 0, ku: 0, uk: 0, uu: 0 },
        childScores: [],
        totalScore: 0
      };

      // If node references a file, get its metadata
      if (node.file) {
        const metadataPath = this.getMetadataPath(node.file);
        if (fs.existsSync(metadataPath)) {
          const metadata: NodeMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          nodeScores.scores = metadata.rumsfeldScores;

          // Aggregate child scores if any
          for (const childId of metadata.subcomponents) {
            const childMetadataPath = this.findMetadataByNodeId(childId);
            if (childMetadataPath && fs.existsSync(childMetadataPath)) {
              const childMetadata: NodeMetadata = JSON.parse(fs.readFileSync(childMetadataPath, 'utf-8'));
              nodeScores.childScores.push(childMetadata.rumsfeldScores);
            }
          }

          // Calculate total weighted score
          const totalChildScore = nodeScores.childScores.reduce(
            (sum, childScore) => sum + childScore.kk + childScore.ku + childScore.uk + childScore.uu,
            0
          );
          const ownScore = nodeScores.scores.kk + nodeScores.scores.ku + nodeScores.scores.uk + nodeScores.scores.uu;
          nodeScores.totalScore = ownScore + (totalChildScore * 0.5); // Weight child contributions at 50%
        }
      }

      aggregatedScores[node.id] = nodeScores;
    }

    return aggregatedScores;
  }

  /**
   * Generate visualization data for canvas heatmap
   */
  public generateCanvasHeatmapData(canvasPath: string): {
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
    const aggregatedScores = this.aggregateCanvasScores(canvasPath);

    const heatmapNodes = canvasNodes.map(node => {
      const scores = aggregatedScores[node.id];
      const totalScore = scores?.totalScore || 0;

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
        kkScore: scores?.scores.kk || 0,
        kuScore: scores?.scores.ku || 0,
        ukScore: scores?.scores.uk || 0,
        uuScore: scores?.scores.uu || 0,
        totalScore,
        heatmapColor
      };
    });

    const maxScore = Math.max(...heatmapNodes.map(n => n.totalScore));

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

  private findMetadataByNodeId(nodeId: string): string | null {
    // This would typically involve scanning metadata files or maintaining an index
    // For now, implementing a simple search approach
    const metadataFiles = this.findFilesRecursive(this.vaultPath, '.json');

    for (const metadataFile of metadataFiles) {
      try {
        const content = fs.readFileSync(metadataFile, 'utf-8');
        const metadata = JSON.parse(content);
        if (metadata.id === nodeId) {
          return metadataFile;
        }
      } catch (error) {
        // Skip invalid JSON files
      }
    }

    return null;
  }

  private findFilesRecursive(dir: string, extension: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...this.findFilesRecursive(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }

    return files;
  }
}