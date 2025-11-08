/**
 * CodeMirror 6 Extension for CanvasL Language
 * 
 * CanvasL is an extended JSONL canvas format with:
 * - R5RS function references
 * - Dimension references (0D-7D)
 * - Node/edge references (#id)
 * - Directives (@directive)
 * - Scheme expressions
 * 
 * Compatible with Lezer grammar and LSP/AST support
 * Compatible with: https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * CanvasL Syntax Highlighting Tags
 * 
 * These tags are used for Lezer grammar-based syntax highlighting
 * Compatible with @lezer/highlight
 */
export const canvaslTags = {
  canvaslDirective: t.meta,
  canvaslReference: t.variableName,
  canvaslDimension: t.number,
  canvaslType: t.typeName,
  canvaslEdgeType: t.typeName,
  canvaslR5RSFunction: t.function(t.variableName),
  canvaslSchemeExpression: t.string,
};

/**
 * CanvasL Highlighting Plugin
 * 
 * Provides syntax highlighting for CanvasL files (.canvasl extension)
 */
const canvaslHighlightPlugin = ViewPlugin.fromClass(
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

      // Parse JSONL entries line by line
      const lines = text.split('\n');
      let currentPos = 0;

      for (const line of lines) {
        if (!line.trim()) {
          currentPos += line.length + 1;
          continue;
        }

        try {
          // Try to parse as JSON
          const entry = JSON.parse(line);
          
          // Highlight based on entry type
          if (entry.id) {
            // Highlight ID
            const idMatch = line.match(/"id"\s*:\s*"([^"]+)"/);
            if (idMatch && idMatch.index !== undefined) {
              const idStart = currentPos + idMatch.index + idMatch[0].indexOf('"') + 1;
              const idEnd = idStart + idMatch[1].length;
              decorations.push(
                Decoration.mark({
                  class: 'cm-canvasl-id',
                }).range(idStart, idEnd)
              );
            }

            // Highlight type
            if (entry.type) {
              const typeMatch = line.match(/"type"\s*:\s*"([^"]+)"/);
              if (typeMatch && typeMatch.index !== undefined) {
                const typeStart = currentPos + typeMatch.index + typeMatch[0].indexOf('"') + 1;
                const typeEnd = typeStart + typeMatch[1].length;
                let typeClass = 'cm-canvasl-type';
                
                // Special highlighting for edge types
                if (['vertical', 'horizontal', 'transition', 'self-ref', 'r5rs-call'].includes(entry.type)) {
                  typeClass = 'cm-canvasl-edge-type';
                }
                
                decorations.push(
                  Decoration.mark({
                    class: typeClass,
                  }).range(typeStart, typeEnd)
                );
              }
            }

            // Highlight R5RS function references
            if (entry.function && entry.function.startsWith('r5rs:')) {
              const funcMatch = line.match(/"function"\s*:\s*"([^"]+)"/);
              if (funcMatch && funcMatch.index !== undefined) {
                const funcStart = currentPos + funcMatch.index + funcMatch[0].indexOf('r5rs:');
                const funcEnd = funcStart + entry.function.length - 5; // -5 for "r5rs:"
                decorations.push(
                  Decoration.mark({
                    class: 'cm-canvasl-r5rs-function',
                  }).range(funcStart, funcEnd)
                );
              }
            }

            // Highlight dimension references (0D-7D)
            if (entry.id.match(/^\dD-/)) {
              const dimMatch = entry.id.match(/^(\dD)/);
              if (dimMatch) {
                const dimMatchInLine = line.match(new RegExp(`"${dimMatch[1]}`));
                if (dimMatchInLine && dimMatchInLine.index !== undefined) {
                  const dimStart = currentPos + dimMatchInLine.index + 1;
                  const dimEnd = dimStart + dimMatch[1].length;
                  decorations.push(
                    Decoration.mark({
                      class: 'cm-canvasl-dimension',
                    }).range(dimStart, dimEnd)
                  );
                }
              }
            }

            // Highlight references (#id)
            const refMatches = line.matchAll(/#([a-zA-Z0-9_-]+)/g);
            for (const match of refMatches) {
              if (match.index !== undefined) {
                const refStart = currentPos + match.index;
                const refEnd = refStart + match[0].length;
                decorations.push(
                  Decoration.mark({
                    class: 'cm-canvasl-reference',
                  }).range(refStart, refEnd)
                );
              }
            }

            // Highlight directives (@directive)
            const directiveMatches = line.matchAll(/@([a-zA-Z_][a-zA-Z0-9_-]*)/g);
            for (const match of directiveMatches) {
              if (match.index !== undefined) {
                const dirStart = currentPos + match.index;
                const dirEnd = dirStart + match[0].length;
                decorations.push(
                  Decoration.mark({
                    class: 'cm-canvasl-directive',
                  }).range(dirStart, dirEnd)
                );
              }
            }
          }
        } catch (e) {
          // Invalid JSON, skip highlighting for this line
        }

        currentPos += line.length + 1;
      }

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * CanvasL Language Support
 * 
 * Creates a language support extension for .canvasl files
 * Extends JSONL canvas format with additional features
 */
export function canvaslLanguage(): Extension[] {
  return [
    // Use JSON language as base (CodeMirror's JSON parser uses Lezer)
    // We'll add CanvasL-specific highlighting on top
    canvaslHighlightPlugin,
    
    // Theme customization for CanvasL elements
    EditorView.baseTheme({
      // CanvasL ID highlighting
      '.cm-canvasl-id': {
        color: '#79b8ff',
        fontWeight: 'bold',
      },
      
      // CanvasL type highlighting
      '.cm-canvasl-type': {
        color: '#b392f0',
        fontWeight: '500',
      },
      
      // CanvasL edge type highlighting
      '.cm-canvasl-edge-type': {
        color: '#f97583',
        fontWeight: '500',
      },
      
      // R5RS function highlighting
      '.cm-canvasl-r5rs-function': {
        color: '#9ecbff',
        fontFamily: 'monospace',
        fontWeight: '500',
      },
      
      // Dimension highlighting (0D-7D)
      '.cm-canvasl-dimension': {
        color: '#ffab70',
        fontWeight: 'bold',
      },
      
      // Reference highlighting (#id)
      '.cm-canvasl-reference': {
        color: '#79b8ff',
        fontWeight: '500',
      },
      
      // Directive highlighting (@directive)
      '.cm-canvasl-directive': {
        color: '#fdaeb7',
        fontWeight: 'bold',
      },
    }),
  ];
}

/**
 * CanvasL AST Node Types
 * 
 * These types represent the AST structure for LSP support
 */
export interface CanvasLASTNode {
  type: 'node' | 'edge' | 'directive' | 'r5rs-call' | 'reference';
  id?: string;
  line: number;
  column: number;
  length: number;
  children?: CanvasLASTNode[];
  metadata?: {
    dimension?: string;
    r5rsFunction?: string;
    fromNode?: string;
    toNode?: string;
  };
}

/**
 * Parse CanvasL file into AST
 * 
 * This function creates an AST structure suitable for LSP integration
 */
export function parseCanvasLAST(content: string): CanvasLASTNode[] {
  const ast: CanvasLASTNode[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      
      if (entry.id) {
        const node: CanvasLASTNode = {
          type: entry.type === 'vertical' || entry.type === 'horizontal' || entry.type === 'transition' 
            ? 'edge' 
            : entry.function && entry.function.startsWith('r5rs:')
            ? 'r5rs-call'
            : 'node',
          id: entry.id,
          line: i + 1,
          column: 0,
          length: line.length,
          metadata: {},
        };

        // Extract dimension from ID
        const dimMatch = entry.id.match(/^(\dD)/);
        if (dimMatch) {
          node.metadata!.dimension = dimMatch[1];
        }

        // Extract R5RS function
        if (entry.function && entry.function.startsWith('r5rs:')) {
          node.metadata!.r5rsFunction = entry.function;
        }

        // Extract edge information
        if (node.type === 'edge') {
          node.metadata!.fromNode = entry.from || entry.fromNode;
          node.metadata!.toNode = entry.to || entry.toNode;
        }

        ast.push(node);
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }

  return ast;
}

/**
 * Get AST node at position (for LSP hover/definition)
 */
export function getASTNodeAtPosition(ast: CanvasLASTNode[], line: number, column: number): CanvasLASTNode | null {
  return ast.find(node => 
    node.line === line && 
    column >= node.column && 
    column <= node.column + node.length
  ) || null;
}

/**
 * Find references to a node ID (for LSP references)
 */
export function findReferences(ast: CanvasLASTNode[], nodeId: string): CanvasLASTNode[] {
  return ast.filter(node => 
    node.metadata?.fromNode === nodeId || 
    node.metadata?.toNode === nodeId ||
    node.id === nodeId
  );
}
