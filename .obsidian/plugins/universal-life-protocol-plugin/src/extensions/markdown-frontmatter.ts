/**
 * CodeMirror 6 Extension for Markdown with Front Matter
 * 
 * Provides Lezer grammar-compatible front matter parsing and highlighting
 * Compatible with: https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar
 * 
 * This extension:
 * 1. Extends the standard markdown language support
 * 2. Adds syntax highlighting for YAML front matter
 * 3. Uses CodeMirror's ViewPlugin API for efficient updates
 * 4. Provides visual feedback for front matter sections
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { frontMatterParser } from '../utils/front-matter-parser';

/**
 * Front Matter Highlighting Plugin
 * 
 * Uses CodeMirror's ViewPlugin API to add syntax highlighting for front matter sections.
 * This plugin:
 * - Detects front matter delimiters (---)
 * - Highlights YAML keys and values
 * - Provides visual separation between front matter and content
 */
const frontMatterHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: any) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: any[] = [];
      const doc = view.state.doc;
      const text = doc.toString();

      // Parse front matter using our parser
      const parsed = frontMatterParser.parse(text);
      
      // Only add decorations if front matter exists
      if (Object.keys(parsed.frontMatter).length > 0) {
        // Find front matter boundaries using regex
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = text.match(frontMatterRegex);
        
        if (match && match.index !== undefined) {
          const startPos = match.index;
          const endPos = startPos + match[0].length;
          
          // Add decoration for entire front matter section
          decorations.push(
            Decoration.mark({
              class: 'cm-frontMatter-section',
              attributes: { 'data-frontmatter': 'true' }
            }).range(startPos, endPos)
          );
          
          // Highlight YAML keys and values within front matter
          const yamlContent = match[1];
          const lines = yamlContent.split('\n');
          let currentPos = startPos + 4; // After "---\n"
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
              currentPos += line.length + 1; // +1 for newline
              continue;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
              const key = line.substring(0, colonIndex).trim();
              // Find key position accounting for leading whitespace
              const keyOffset = line.indexOf(key);
              const keyStart = currentPos + keyOffset;
              const keyEnd = keyStart + key.length;
              
              // Highlight YAML key
              decorations.push(
                Decoration.mark({
                  class: 'cm-frontMatter-key',
                }).range(keyStart, keyEnd)
              );
              
              // Highlight YAML value
              const value = line.substring(colonIndex + 1).trim();
              if (value) {
                // Find value position accounting for whitespace after colon
                const valueOffset = colonIndex + 1;
                const whitespaceMatch = line.substring(valueOffset).match(/^\s*/);
                const whitespaceLength = whitespaceMatch ? whitespaceMatch[0].length : 0;
                const valueStart = currentPos + valueOffset + whitespaceLength;
                const valueEnd = valueStart + value.length;
                
                // Determine value type for appropriate highlighting
                let valueClass = 'cm-frontMatter-value';
                if (value.startsWith('"') || value.startsWith("'")) {
                  valueClass = 'cm-frontMatter-string';
                } else if (value === 'true' || value === 'false') {
                  valueClass = 'cm-frontMatter-boolean';
                } else if (!isNaN(Number(value)) && value !== '') {
                  valueClass = 'cm-frontMatter-number';
                }
                
                decorations.push(
                  Decoration.mark({
                    class: valueClass,
                  }).range(valueStart, valueEnd)
                );
              }
            }
            
            currentPos += line.length + 1; // +1 for newline
          }
          
          // Highlight delimiters
          decorations.push(
            Decoration.mark({
              class: 'cm-frontMatter-delimiter',
            }).range(startPos, startPos + 3) // First "---"
          );
          
          decorations.push(
            Decoration.mark({
              class: 'cm-frontMatter-delimiter',
            }).range(endPos - 4, endPos - 1) // Last "---"
          );
        }
      }

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Front Matter Extension
 * 
 * Combines markdown language support with front matter highlighting.
 * This extension:
 * 1. Uses the standard markdown language support from @codemirror/lang-markdown
 * 2. Adds front matter syntax highlighting via ViewPlugin
 * 3. Provides theme customization for front matter elements
 * 
 * Compatible with Lezer grammar system and CodeMirror 6 architecture.
 * 
 * @returns Array of CodeMirror extensions
 */
export function markdownWithFrontMatter(): Extension[] {
  return [
    // Base markdown language support (uses Lezer internally)
    markdown(),
    
    // Front matter highlighting plugin
    frontMatterHighlightPlugin,
    
    // Theme customization for front matter elements
    EditorView.baseTheme({
      // Front matter section background
      '.cm-frontMatter-section': {
        backgroundColor: 'rgba(100, 100, 100, 0.08)',
        padding: '2px 0',
        borderRadius: '2px',
        display: 'block',
      },
      
      // YAML key styling
      '.cm-frontMatter-key': {
        color: '#79b8ff',
        fontWeight: '500',
      },
      
      // YAML value styling (generic)
      '.cm-frontMatter-value': {
        color: '#9ecbff',
      },
      
      // YAML string value styling
      '.cm-frontMatter-string': {
        color: '#9ecbff',
        fontStyle: 'italic',
      },
      
      // YAML boolean value styling
      '.cm-frontMatter-boolean': {
        color: '#79b8ff',
        fontWeight: 'bold',
      },
      
      // YAML number value styling
      '.cm-frontMatter-number': {
        color: '#79b8ff',
      },
      
      // Front matter delimiter styling
      '.cm-frontMatter-delimiter': {
        color: '#6a737d',
        fontWeight: 'bold',
        opacity: 0.8,
      },
    }),
  ];
}
