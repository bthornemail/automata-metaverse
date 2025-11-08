/**
 * Bipartite Relationship Service
 * Tracks markdown ↔ JSONL relationships and maintains reference graph
 */

import { markdownService } from './markdown-service';
import { databaseService } from './database-service';
import { frontMatterParser } from '../utils/front-matter-parser';

export interface BipartiteRelationship {
  markdownPath: string;
  jsonlPath: string;
  createdAt: number;
  lastModified: number;
}

export interface RelationshipGraph {
  markdownToJSONL: Map<string, Set<string>>;
  jsonlToMarkdown: Map<string, Set<string>>;
  relationships: BipartiteRelationship[];
}

export interface BipartiteService {
  getRelationships(): Promise<RelationshipGraph>;
  addRelationship(markdownPath: string, jsonlPath: string): Promise<void>;
  removeRelationship(markdownPath: string, jsonlPath: string): Promise<void>;
  getMarkdownFilesForJSONL(jsonlPath: string): Promise<string[]>;
  getJSONLFilesForMarkdown(markdownPath: string): Promise<string[]>;
  validateBipartiteStructure(): Promise<{ valid: boolean; errors: string[] }>;
  updateRelationshipsFromFiles(): Promise<void>;
}

class BipartiteServiceImpl implements BipartiteService {
  private relationships: Map<string, BipartiteRelationship> = new Map();
  private cache: RelationshipGraph | null = null;

  /**
   * Get all relationships
   */
  async getRelationships(): Promise<RelationshipGraph> {
    if (this.cache) {
      return this.cache;
    }

    await this.updateRelationshipsFromFiles();
    return this.cache || this.buildEmptyGraph();
  }

  /**
   * Build empty graph
   */
  private buildEmptyGraph(): RelationshipGraph {
    return {
      markdownToJSONL: new Map(),
      jsonlToMarkdown: new Map(),
      relationships: []
    };
  }

  /**
   * Add relationship
   */
  async addRelationship(markdownPath: string, jsonlPath: string): Promise<void> {
    const key = `${markdownPath}::${jsonlPath}`;
    
    // Update markdown file front matter
    await markdownService.linkToJSONL(markdownPath, jsonlPath);
    
    // Cache relationship
    const relationship: BipartiteRelationship = {
      markdownPath,
      jsonlPath,
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    this.relationships.set(key, relationship);
    this.cache = null; // Invalidate cache
  }

  /**
   * Remove relationship
   */
  async removeRelationship(markdownPath: string, jsonlPath: string): Promise<void> {
    const key = `${markdownPath}::${jsonlPath}`;
    this.relationships.delete(key);
    
    // Update markdown file front matter
    const file = await markdownService.loadMarkdown(markdownPath);
    if (file) {
      const jsonlRefs = file.jsonlReferences.filter(ref => ref !== jsonlPath);
      if (jsonlRefs.length === 0) {
        delete file.frontMatter.jsonl;
      } else if (jsonlRefs.length === 1) {
        file.frontMatter.jsonl = jsonlRefs[0];
      } else {
        file.frontMatter.jsonl = jsonlRefs;
      }
      await markdownService.saveMarkdown(file);
    }
    
    this.cache = null; // Invalidate cache
  }

  /**
   * Get markdown files referencing a JSONL file
   */
  async getMarkdownFilesForJSONL(jsonlPath: string): Promise<string[]> {
    const graph = await this.getRelationships();
    return Array.from(graph.jsonlToMarkdown.get(jsonlPath) || []);
  }

  /**
   * Get JSONL files referenced by a markdown file
   */
  async getJSONLFilesForMarkdown(markdownPath: string): Promise<string[]> {
    const graph = await this.getRelationships();
    return Array.from(graph.markdownToJSONL.get(markdownPath) || []);
  }

  /**
   * Validate bipartite structure
   */
  async validateBipartiteStructure(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const graph = await this.getRelationships();
    
    // Check for cycles (shouldn't exist in bipartite graph)
    for (const [markdownPath, jsonlSet] of graph.markdownToJSONL.entries()) {
      for (const jsonlPath of jsonlSet) {
        // Verify reverse relationship exists
        const reverseSet = graph.jsonlToMarkdown.get(jsonlPath);
        if (!reverseSet || !reverseSet.has(markdownPath)) {
          errors.push(`Missing reverse relationship: ${jsonlPath} -> ${markdownPath}`);
        }
      }
    }
    
    // Check for orphaned relationships
    for (const relationship of graph.relationships) {
      // Verify markdown file exists (would need file system access)
      // Verify JSONL file exists
      try {
        await databaseService.readJSONL(relationship.jsonlPath);
      } catch {
        errors.push(`JSONL file not found: ${relationship.jsonlPath}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Update relationships from files
   */
  async updateRelationshipsFromFiles(): Promise<void> {
    const markdownToJSONL = new Map<string, Set<string>>();
    const jsonlToMarkdown = new Map<string, Set<string>>();
    const relationships: BipartiteRelationship[] = [];
    
    // This would typically scan all markdown files
    // For now, we'll use a simple approach: check known markdown files
    const knownMarkdownFiles: string[] = [
      // Add known markdown files here
      // 'docs/example.md',
    ];
    
    for (const markdownPath of knownMarkdownFiles) {
      try {
        const file = await markdownService.loadMarkdown(markdownPath);
        if (file && file.jsonlReferences.length > 0) {
          const jsonlSet = new Set<string>();
          
          for (const jsonlPath of file.jsonlReferences) {
            jsonlSet.add(jsonlPath);
            
            // Add reverse relationship
            if (!jsonlToMarkdown.has(jsonlPath)) {
              jsonlToMarkdown.set(jsonlPath, new Set());
            }
            jsonlToMarkdown.get(jsonlPath)!.add(markdownPath);
            
            // Create relationship
            relationships.push({
              markdownPath,
              jsonlPath,
              createdAt: file.lastModified,
              lastModified: file.lastModified
            });
          }
          
          markdownToJSONL.set(markdownPath, jsonlSet);
        }
      } catch (error) {
        console.warn(`Failed to process markdown file ${markdownPath}:`, error);
      }
    }
    
    this.cache = {
      markdownToJSONL,
      jsonlToMarkdown,
      relationships
    };
  }
}

export const bipartiteService: BipartiteService = new BipartiteServiceImpl();
