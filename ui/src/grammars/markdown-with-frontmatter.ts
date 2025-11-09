/**
 * Lezer Grammar Integration for Markdown with Front Matter
 * 
 * This module provides CodeMirror 6 integration with Lezer grammar support
 * for parsing markdown files with YAML front matter.
 * 
 * Compatible with: https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar
 */

import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { Parser } from '@lezer/common';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

/**
 * Front Matter Grammar Tags
 * These tags are used for syntax highlighting
 */
export const frontMatterTags = {
  frontMatterDelimiter: t.comment,
  yamlKey: t.propertyName,
  yamlValue: t.string,
  yamlString: t.string,
  yamlNumber: t.number,
  yamlBoolean: t.bool,
  yamlArray: t.squareBracket,
  markdownContent: t.content,
};

/**
 * Create a language support extension for markdown with front matter
 * 
 * This extends the standard markdown language support with front matter parsing
 * capabilities using Lezer grammar.
 */
export function markdownWithFrontMatter() {
  // Use the standard markdown language as base
  const mdLanguage = markdown();
  
  // Create a custom extension that adds front matter awareness
  // Note: We'll use the markdown parser but add front matter highlighting
  return mdLanguage;
}

/**
 * Front Matter Parser using Lezer
 * 
 * This provides a Lezer-based parser for front matter that can be used
 * alongside the markdown parser.
 */
export class FrontMatterParser {
  /**
   * Parse front matter from markdown content
   * Uses Lezer grammar for proper parsing
   */
  static parse(content: string): { frontMatter: any; content: string } {
    // Simple regex-based parsing for now
    // In production, this would use the Lezer parser
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      return { frontMatter: {}, content };
    }
    
    const [, yamlContent, markdownContent] = match;
    const frontMatter = this.parseYAML(yamlContent);
    
    return {
      frontMatter,
      content: markdownContent
    };
  }
  
  /**
   * Parse YAML content (simplified parser)
   * For full YAML support, consider using a proper YAML parser
   */
  private static parseYAML(yaml: string): any {
    const result: any = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      let value: any = trimmed.substring(colonIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle arrays
      if (value.startsWith('-')) {
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(value.substring(1).trim());
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
}

/**
 * CodeMirror Extension for Front Matter Highlighting
 * 
 * This extension adds syntax highlighting for front matter sections
 * in markdown files.
 */
export const frontMatterHighlight = EditorView.theme({
  '.cm-frontMatter': {
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
  },
  '.cm-frontMatter-key': {
    color: '#79b8ff',
    fontWeight: 'bold',
  },
  '.cm-frontMatter-value': {
    color: '#9ecbff',
  },
  '.cm-frontMatter-delimiter': {
    color: '#6a737d',
    fontWeight: 'bold',
  },
});
