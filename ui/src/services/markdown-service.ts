/**
 * Markdown Service
 * Manages markdown files with front matter and JSONL references
 */

import { frontMatterParser, ParsedMarkdown, FrontMatter } from '../utils/front-matter-parser';
import { databaseService } from './database-service';

export interface MarkdownFile {
  path: string;
  frontMatter: FrontMatter;
  content: string;
  jsonlReferences: string[];
  canvasReferences: string[];
  lastModified: number;
}

export interface MarkdownService {
  loadMarkdown(path: string): Promise<MarkdownFile | null>;
  saveMarkdown(file: MarkdownFile): Promise<void>;
  linkToJSONL(markdownPath: string, jsonlPath: string): Promise<void>;
  getLinkedJSONLFiles(markdownPath: string): Promise<string[]>;
  getMarkdownFilesReferencingJSONL(jsonlPath: string): Promise<string[]>;
  updateFrontMatter(path: string, updates: Partial<FrontMatter>): Promise<void>;
}

class MarkdownServiceImpl implements MarkdownService {
  private cache: Map<string, MarkdownFile> = new Map();

  /**
   * Load markdown file
   */
  async loadMarkdown(path: string): Promise<MarkdownFile | null> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    try {
      // Try to load from API or local file service
      let content: string;
      
      // Try API first
      try {
        const response = await fetch(`/api/markdown/${encodeURIComponent(path)}`);
        if (response.ok) {
          const data = await response.json();
          content = data.content || data;
        } else {
          throw new Error('Not found via API');
        }
      } catch {
        // Fallback: try to load from public directory
        try {
          const response = await fetch(`/${path}`);
          if (response.ok) {
            content = await response.text();
          } else {
            return null;
          }
        } catch {
          return null;
        }
      }

      // Parse front matter
      const parsed = frontMatterParser.parse(content);
      
      const file: MarkdownFile = {
        path,
        frontMatter: parsed.frontMatter,
        content: parsed.content,
        jsonlReferences: frontMatterParser.extractJSONLReferences(parsed.frontMatter),
        canvasReferences: frontMatterParser.extractCanvasReferences(parsed.frontMatter),
        lastModified: Date.now()
      };

      this.cache.set(path, file);
      return file;
    } catch (error) {
      console.error(`Failed to load markdown file: ${path}`, error);
      return null;
    }
  }

  /**
   * Save markdown file
   */
  async saveMarkdown(file: MarkdownFile): Promise<void> {
    // Update references
    file.jsonlReferences = frontMatterParser.extractJSONLReferences(file.frontMatter);
    file.canvasReferences = frontMatterParser.extractCanvasReferences(file.frontMatter);
    file.lastModified = Date.now();

    // Reconstruct markdown with front matter
    const parsed: ParsedMarkdown = {
      frontMatter: file.frontMatter,
      content: file.content,
      raw: ''
    };
    const markdownContent = frontMatterParser.stringify(parsed);

    // Save via API
    try {
      await fetch(`/api/markdown/${encodeURIComponent(file.path)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdownContent })
      });
    } catch (error) {
      console.error(`Failed to save markdown file: ${file.path}`, error);
      throw error;
    }

    // Update cache
    this.cache.set(file.path, file);
  }

  /**
   * Link markdown file to JSONL file
   */
  async linkToJSONL(markdownPath: string, jsonlPath: string): Promise<void> {
    const file = await this.loadMarkdown(markdownPath);
    if (!file) {
      throw new Error(`Markdown file not found: ${markdownPath}`);
    }

    // Add JSONL reference to front matter
    const jsonlRefs = file.jsonlReferences;
    if (!jsonlRefs.includes(jsonlPath)) {
      if (!file.frontMatter.jsonl) {
        file.frontMatter.jsonl = jsonlPath;
      } else if (typeof file.frontMatter.jsonl === 'string') {
        file.frontMatter.jsonl = [file.frontMatter.jsonl, jsonlPath];
      } else if (Array.isArray(file.frontMatter.jsonl)) {
        file.frontMatter.jsonl.push(jsonlPath);
      }
    }

    await this.saveMarkdown(file);
  }

  /**
   * Get JSONL files linked to markdown
   */
  async getLinkedJSONLFiles(markdownPath: string): Promise<string[]> {
    const file = await this.loadMarkdown(markdownPath);
    return file ? file.jsonlReferences : [];
  }

  /**
   * Get markdown files referencing a JSONL file
   */
  async getMarkdownFilesReferencingJSONL(jsonlPath: string): Promise<string[]> {
    // This would typically query a database or index
    // For now, we'll check cached files
    const referencing: string[] = [];
    
    for (const [path, file] of this.cache.entries()) {
      if (file.jsonlReferences.includes(jsonlPath)) {
        referencing.push(path);
      }
    }
    
    return referencing;
  }

  /**
   * Update front matter
   */
  async updateFrontMatter(path: string, updates: Partial<FrontMatter>): Promise<void> {
    const file = await this.loadMarkdown(path);
    if (!file) {
      throw new Error(`Markdown file not found: ${path}`);
    }

    file.frontMatter = { ...file.frontMatter, ...updates };
    await this.saveMarkdown(file);
  }
}

export const markdownService: MarkdownService = new MarkdownServiceImpl();
