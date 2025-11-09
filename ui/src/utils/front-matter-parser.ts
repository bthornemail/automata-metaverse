/**
 * Front Matter Parser
 * Parses YAML front matter from markdown files and extracts JSONL references
 */

export interface FrontMatter {
  jsonl?: string | string[];
  canvas?: string | string[];
  title?: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontMatter: FrontMatter;
  content: string;
  raw: string;
}

export interface FrontMatterParser {
  parse(markdown: string): ParsedMarkdown;
  extractJSONLReferences(frontMatter: FrontMatter): string[];
  extractCanvasReferences(frontMatter: FrontMatter): string[];
  validate(frontMatter: FrontMatter): { valid: boolean; errors: string[] };
  stringify(parsed: ParsedMarkdown): string;
}

class FrontMatterParserImpl implements FrontMatterParser {
  /**
   * Parse markdown with front matter
   */
  parse(markdown: string): ParsedMarkdown {
    const trimmed = markdown.trim();
    
    // Check for front matter delimiter
    if (!trimmed.startsWith('---')) {
      return {
        frontMatter: {},
        content: trimmed,
        raw: trimmed
      };
    }

    // Find the closing delimiter
    const endIndex = trimmed.indexOf('\n---', 3);
    if (endIndex === -1) {
      // No closing delimiter, treat entire content as markdown
      return {
        frontMatter: {},
        content: trimmed,
        raw: trimmed
      };
    }

    // Extract front matter YAML
    const frontMatterYAML = trimmed.substring(3, endIndex).trim();
    const content = trimmed.substring(endIndex + 5).trim();

    // Parse YAML (simplified parser)
    const frontMatter = this.parseYAML(frontMatterYAML);

    return {
      frontMatter,
      content,
      raw: markdown
    };
  }

  /**
   * Simple YAML parser (handles basic key-value pairs and arrays)
   */
  private parseYAML(yaml: string): FrontMatter {
    const result: FrontMatter = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      let value: any = trimmed.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle arrays (starting with -)
      if (value.startsWith('-')) {
        // This is a simple array parser - for more complex cases, use a proper YAML parser
        const arrayValue = value.substring(1).trim();
        if (!result[key]) {
          result[key] = [];
        }
        if (Array.isArray(result[key])) {
          (result[key] as any[]).push(arrayValue);
        }
      } else if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Extract JSONL file references from front matter
   */
  extractJSONLReferences(frontMatter: FrontMatter): string[] {
    const references: string[] = [];
    
    if (frontMatter.jsonl) {
      if (typeof frontMatter.jsonl === 'string') {
        references.push(frontMatter.jsonl);
      } else if (Array.isArray(frontMatter.jsonl)) {
        references.push(...frontMatter.jsonl);
      }
    }
    
    return references;
  }

  /**
   * Extract canvas references from front matter
   */
  extractCanvasReferences(frontMatter: FrontMatter): string[] {
    const references: string[] = [];
    
    if (frontMatter.canvas) {
      if (typeof frontMatter.canvas === 'string') {
        references.push(frontMatter.canvas);
      } else if (Array.isArray(frontMatter.canvas)) {
        references.push(...frontMatter.canvas);
      }
    }
    
    return references;
  }

  /**
   * Validate front matter structure
   */
  validate(frontMatter: FrontMatter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (frontMatter.jsonl) {
      const jsonlRefs = this.extractJSONLReferences(frontMatter);
      for (const ref of jsonlRefs) {
        if (typeof ref !== 'string' || !ref.endsWith('.jsonl')) {
          errors.push(`Invalid JSONL reference: ${ref} (must be a string ending in .jsonl)`);
        }
      }
    }
    
    if (frontMatter.canvas) {
      const canvasRefs = this.extractCanvasReferences(frontMatter);
      for (const ref of canvasRefs) {
        if (typeof ref !== 'string') {
          errors.push(`Invalid canvas reference: ${ref} (must be a string)`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert parsed markdown back to string
   */
  stringify(parsed: ParsedMarkdown): string {
    if (Object.keys(parsed.frontMatter).length === 0) {
      return parsed.content;
    }
    
    // Convert front matter to YAML
    const yamlLines: string[] = [];
    for (const [key, value] of Object.entries(parsed.frontMatter)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          yamlLines.push(`${key}: - ${item}`);
        }
      } else if (typeof value === 'string' && (value.includes(':') || value.includes('\n'))) {
        yamlLines.push(`${key}: "${value}"`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    
    return `---\n${yamlLines.join('\n')}\n---\n\n${parsed.content}`;
  }
}

export const frontMatterParser: FrontMatterParser = new FrontMatterParserImpl();
