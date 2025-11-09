/**
 * Metadata Tracker
 * 
 * Tracks node metadata with Rumsfeld scores, interaction history, and analytics.
 * Integrates with blackboard architecture for epistemic node tracking.
 * 
 * Integration with automaton system:
 * - Blackboard epistemic nodes
 * - Canvas heatmap visualization
 * - Knowledge graph analytics
 * - Rumsfeld square interaction model
 */

import fs from "fs";
import path from "path";
import { keccak256 } from "ethers";
import { NodeMetadata, RumsfeldScores } from "./manifest-generator.js";

export interface MetadataHistory {
  timestamp: string;
  interaction: 'agree' | 'disagree' | 'question' | 'reference' | 'hide' | 'edit' | 'create';
  userId?: string;
  comment?: string;
  rumsfeldScores: RumsfeldScores;
  contentHash?: string;
}

export interface MetadataIndex {
  [nodeId: string]: {
    filePath: string;
    lastUpdated: string;
    contentHash: string;
    rumsfeldScores: RumsfeldScores;
  };
}

export interface InteractionWeights {
  agree: Partial<RumsfeldScores>;
  disagree: Partial<RumsfeldScores>;
  question: Partial<RumsfeldScores>;
  reference: Partial<RumsfeldScores>;
  hide: Partial<RumsfeldScores>;
}

export class MetadataTracker {
  private vaultPath: string;
  private indexPath: string;
  private index: MetadataIndex;
  private interactionWeights: InteractionWeights;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.indexPath = path.join(vaultPath, '.metadata-index.json');
    this.index = this.loadIndex();

    // Default interaction weights based on Rumsfeld Square
    this.interactionWeights = {
      agree: { kk: 1 }, // Known Known - agreement confirms understanding
      disagree: { ku: 1 }, // Known Unknown - disagreement reveals knowledge gap
      question: { ku: 1 }, // Known Unknown - questions expose uncertainty
      reference: { uu: 1 }, // Unknown Unknown - references may reveal unexpected connections
      hide: { kk: -0.5, ku: -0.5, uk: -0.5, uu: -0.5 } // Reduces all scores
    };
  }

  private loadIndex(): MetadataIndex {
    if (fs.existsSync(this.indexPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load metadata index, creating new one:', error);
      }
    }
    return {};
  }

  private saveIndex(): void {
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  private hashContent(content: string): string {
    return keccak256(Buffer.from(content, 'utf-8')).replace(/^0x/, '');
  }

  /**
   * Create or update metadata for a file
   */
  public createOrUpdateMetadata(
    filePath: string,
    options: {
      title?: string;
      author?: string;
      initialScores?: Partial<RumsfeldScores>;
      references?: string[];
    } = {}
  ): NodeMetadata {
    const fullFilePath = path.join(this.vaultPath, filePath);
    const metadataPath = this.getMetadataPath(filePath);

    // Read file content to generate hash
    let contentHash = '';
    if (fs.existsSync(fullFilePath)) {
      const content = fs.readFileSync(fullFilePath, 'utf-8');
      contentHash = this.hashContent(content);
    }

    const now = new Date().toISOString();
    const nodeId = this.hashContent(filePath + ':' + contentHash);

    let metadata: NodeMetadata;

    if (fs.existsSync(metadataPath)) {
      // Update existing metadata
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.updatedAt = now;
      if (contentHash !== (metadata as any)['contentHash']) {
        (metadata as any)['contentHash'] = contentHash;
        this.addToHistory(metadata, 'edit', undefined, 'Content updated');
      }
    } else {
      // Create new metadata
      metadata = {
        id: nodeId,
        title: options.title || path.basename(filePath, path.extname(filePath)),
        author: options.author || 'Anonymous',
        createdAt: now,
        updatedAt: now,
        rumsfeldScores: { kk: 0, ku: 0, uk: 0, uu: 0, ...options.initialScores },
        references: options.references || [],
        subcomponents: [],
        visibility: 'visible',
        status: 'draft',
        canonical_path: filePath
      };

      (metadata as any)['contentHash'] = contentHash;
      this.addToHistory(metadata, 'create', undefined, 'Initial creation');
    }

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Update index
    this.index[nodeId] = {
      filePath: metadataPath,
      lastUpdated: now,
      contentHash,
      rumsfeldScores: metadata.rumsfeldScores
    };
    this.saveIndex();

    return metadata;
  }

  /**
   * Process interaction and update Rumsfeld scores
   */
  public processInteraction(
    nodeId: string,
    interaction: 'agree' | 'disagree' | 'question' | 'reference' | 'hide',
    userId?: string,
    comment?: string
  ): NodeMetadata | null {
    const indexEntry = this.index[nodeId];
    if (!indexEntry) {
      console.warn(`Node not found in index: ${nodeId}`);
      return null;
    }

    if (!fs.existsSync(indexEntry.filePath)) {
      console.warn(`Metadata file not found: ${indexEntry.filePath}`);
      return null;
    }

    const metadata: NodeMetadata = JSON.parse(fs.readFileSync(indexEntry.filePath, 'utf-8'));

    // Apply interaction weights
    const weights = this.interactionWeights[interaction];
    for (const [score, weight] of Object.entries(weights)) {
      if (weight !== undefined) {
        metadata.rumsfeldScores[score as keyof RumsfeldScores] += weight;
      }
    }

    // Ensure scores don't go below 0
    metadata.rumsfeldScores.kk = Math.max(0, metadata.rumsfeldScores.kk);
    metadata.rumsfeldScores.ku = Math.max(0, metadata.rumsfeldScores.ku);
    metadata.rumsfeldScores.uk = Math.max(0, metadata.rumsfeldScores.uk);
    metadata.rumsfeldScores.uu = Math.max(0, metadata.rumsfeldScores.uu);

    metadata.updatedAt = new Date().toISOString();

    // Handle visibility changes
    if (interaction === 'hide') {
      metadata.visibility = 'hidden';
    }

    // Add to history
    this.addToHistory(metadata, interaction, userId, comment);

    // Save updated metadata
    fs.writeFileSync(indexEntry.filePath, JSON.stringify(metadata, null, 2));

    // Update index
    this.index[nodeId].lastUpdated = metadata.updatedAt;
    this.index[nodeId].rumsfeldScores = metadata.rumsfeldScores;
    this.saveIndex();

    return metadata;
  }

  /**
   * Aggregate scores from subcomponents
   */
  public aggregateScores(nodeId: string): RumsfeldScores {
    const metadata = this.getMetadata(nodeId);
    if (!metadata) {
      return { kk: 0, ku: 0, uk: 0, uu: 0 };
    }

    let aggregatedScores = { ...metadata.rumsfeldScores };

    // Add weighted contributions from subcomponents
    for (const subcomponentId of metadata.subcomponents) {
      const subcomponentScores = this.aggregateScores(subcomponentId); // Recursive aggregation

      // Weight subcomponent contributions at 50%
      const weight = 0.5;
      aggregatedScores.kk += subcomponentScores.kk * weight;
      aggregatedScores.ku += subcomponentScores.ku * weight;
      aggregatedScores.uk += subcomponentScores.uk * weight;
      aggregatedScores.uu += subcomponentScores.uu * weight;
    }

    return aggregatedScores;
  }

  /**
   * Get metadata by node ID
   */
  public getMetadata(nodeId: string): NodeMetadata | null {
    const indexEntry = this.index[nodeId];
    if (!indexEntry || !fs.existsSync(indexEntry.filePath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(indexEntry.filePath, 'utf-8'));
    } catch (error) {
      console.warn(`Failed to parse metadata for node ${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Search nodes by various criteria
   */
  public searchNodes(criteria: {
    author?: string;
    status?: 'draft' | 'published' | 'archived';
    visibility?: 'visible' | 'hidden' | 'private';
    minTotalScore?: number;
    hasReferences?: boolean;
    contentPattern?: RegExp;
  }): NodeMetadata[] {
    const results: NodeMetadata[] = [];

    for (const [nodeId, indexEntry] of Object.entries(this.index)) {
      const metadata = this.getMetadata(nodeId);
      if (!metadata) continue;

      // Apply filters
      if (criteria.author && metadata.author !== criteria.author) continue;
      if (criteria.status && metadata.status !== criteria.status) continue;
      if (criteria.visibility && metadata.visibility !== criteria.visibility) continue;
      if (criteria.hasReferences !== undefined) {
        if (criteria.hasReferences && metadata.references.length === 0) continue;
        if (!criteria.hasReferences && metadata.references.length > 0) continue;
      }

      if (criteria.minTotalScore !== undefined) {
        const totalScore = metadata.rumsfeldScores.kk + metadata.rumsfeldScores.ku +
                          metadata.rumsfeldScores.uk + metadata.rumsfeldScores.uu;
        if (totalScore < criteria.minTotalScore) continue;
      }

      if (criteria.contentPattern) {
        const filePath = path.join(this.vaultPath, metadata.canonical_path);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (!criteria.contentPattern.test(content)) continue;
        }
      }

      results.push(metadata);
    }

    return results;
  }

  /**
   * Generate analytics report
   */
  public generateAnalyticsReport(): {
    totalNodes: number;
    scoreDistribution: {
      highKK: number; // >5 KK score
      highKU: number; // >5 KU score
      highUK: number; // >5 UK score
      highUU: number; // >5 UU score
    };
    statusBreakdown: Record<string, number>;
    authorContributions: Record<string, number>;
    recentActivity: MetadataHistory[];
  } {
    const nodes = Object.keys(this.index).map(id => this.getMetadata(id)).filter(Boolean) as NodeMetadata[];

    const report = {
      totalNodes: nodes.length,
      scoreDistribution: {
        highKK: nodes.filter(n => n.rumsfeldScores.kk > 5).length,
        highKU: nodes.filter(n => n.rumsfeldScores.ku > 5).length,
        highUK: nodes.filter(n => n.rumsfeldScores.uk > 5).length,
        highUU: nodes.filter(n => n.rumsfeldScores.uu > 5).length
      },
      statusBreakdown: nodes.reduce((acc, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      authorContributions: nodes.reduce((acc, n) => {
        if (n.author) {
          acc[n.author] = (acc[n.author] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      recentActivity: this.getRecentActivity(50)
    };

    return report;
  }

  private addToHistory(
    metadata: NodeMetadata,
    interaction: MetadataHistory['interaction'],
    userId?: string,
    comment?: string
  ): void {
    if (!(metadata as any)['history']) {
      (metadata as any)['history'] = [];
    }

    const historyEntry: MetadataHistory = {
      timestamp: new Date().toISOString(),
      interaction,
      userId,
      comment,
      rumsfeldScores: { ...metadata.rumsfeldScores },
      contentHash: (metadata as any)['contentHash']
    };

    ((metadata as any)['history'] as MetadataHistory[]).push(historyEntry);

    // Keep only last 100 entries
    if ((metadata as any)['history'].length > 100) {
      (metadata as any)['history'] = ((metadata as any)['history'] as MetadataHistory[]).slice(-100);
    }
  }

  private getRecentActivity(limit = 20): MetadataHistory[] {
    const allHistory: MetadataHistory[] = [];

    for (const nodeId of Object.keys(this.index)) {
      const metadata = this.getMetadata(nodeId);
      if (metadata && (metadata as any)['history']) {
        allHistory.push(...((metadata as any)['history'] as MetadataHistory[]));
      }
    }

    return allHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private getMetadataPath(filePath: string): string {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    return path.join(this.vaultPath, dir, `${baseName}.json`);
  }

  /**
   * Batch update multiple nodes (useful for canvas interactions)
   */
  public batchUpdateNodes(updates: Array<{
    nodeId: string;
    interaction: 'agree' | 'disagree' | 'question' | 'reference' | 'hide';
    userId?: string;
    comment?: string;
  }>): NodeMetadata[] {
    const results: NodeMetadata[] = [];

    for (const update of updates) {
      const result = this.processInteraction(
        update.nodeId,
        update.interaction,
        update.userId,
        update.comment
      );
      if (result) {
        results.push(result);
      }
    }

    return results;
  }
}
