/**
 * CanvasL LSP Service
 * 
 * Provides Language Server Protocol (LSP) support for .canvasl files
 * Includes AST parsing, hover information, definition finding, and references
 */

import { parseCanvasLAST, CanvasLASTNode, getASTNodeAtPosition, findReferences } from '../extensions/canvasl-language';
import { jsonlCanvasService, CanvasGraph } from './jsonl-canvas-service';
import { databaseService } from './database-service';

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPHover {
  contents: string;
  range?: LSPRange;
}

export interface LSPLocation {
  uri: string;
  range: LSPRange;
}

export interface LSPDefinition extends LSPLocation {}

export interface LSPReference extends LSPLocation {}

export interface CanvasLLSPService {
  parseAST(content: string): CanvasLASTNode[];
  hover(content: string, position: LSPPosition): LSPHover | null;
  definition(content: string, position: LSPPosition): LSPDefinition | null;
  references(content: string, position: LSPPosition): LSPReference[];
  completion(content: string, position: LSPPosition): string[];
  validate(content: string): { errors: Array<{ line: number; message: string }> };
}

class CanvasLLSPServiceImpl implements CanvasLLSPService {
  private astCache: Map<string, CanvasLASTNode[]> = new Map();
  private graphCache: Map<string, CanvasGraph> = new Map();

  /**
   * Parse content into AST
   */
  parseAST(content: string): CanvasLASTNode[] {
    const cacheKey = content.substring(0, 100);
    if (this.astCache.has(cacheKey)) {
      return this.astCache.get(cacheKey)!;
    }

    const ast = parseCanvasLAST(content);
    this.astCache.set(cacheKey, ast);
    return ast;
  }

  /**
   * Get hover information at position
   */
  hover(content: string, position: LSPPosition): LSPHover | null {
    const ast = this.parseAST(content);
    const node = getASTNodeAtPosition(ast, position.line + 1, position.character);

    if (!node) {
      return null;
    }

    let contents = `**${node.type}**: ${node.id || 'unknown'}\n\n`;

    if (node.metadata?.dimension) {
      contents += `**Dimension**: ${node.metadata.dimension}\n`;
    }

    if (node.metadata?.r5rsFunction) {
      contents += `**R5RS Function**: ${node.metadata.r5rsFunction}\n`;
    }

    if (node.metadata?.fromNode) {
      contents += `**From**: ${node.metadata.fromNode}\n`;
    }

    if (node.metadata?.toNode) {
      contents += `**To**: ${node.metadata.toNode}\n`;
    }

    return {
      contents,
      range: {
        start: { line: node.line - 1, character: node.column },
        end: { line: node.line - 1, character: node.column + node.length },
      },
    };
  }

  /**
   * Find definition of symbol at position
   */
  definition(content: string, position: LSPPosition): LSPDefinition | null {
    const ast = this.parseAST(content);
    const node = getASTNodeAtPosition(ast, position.line + 1, position.character);

    if (!node) {
      return null;
    }

    // Find the definition node
    const definitionNode = ast.find(n => n.id === node.id);

    if (!definitionNode) {
      return null;
    }

    return {
      uri: '', // Would be file URI in real LSP
      range: {
        start: { line: definitionNode.line - 1, character: definitionNode.column },
        end: { line: definitionNode.line - 1, character: definitionNode.column + definitionNode.length },
      },
    };
  }

  /**
   * Find all references to symbol at position
   */
  references(content: string, position: LSPPosition): LSPReference[] {
    const ast = this.parseAST(content);
    const node = getASTNodeAtPosition(ast, position.line + 1, position.character);

    if (!node || !node.id) {
      return [];
    }

    const refs = findReferences(ast, node.id);

    return refs.map(ref => ({
      uri: '', // Would be file URI in real LSP
      range: {
        start: { line: ref.line - 1, character: ref.column },
        end: { line: ref.line - 1, character: ref.column + ref.length },
      },
    }));
  }

  /**
   * Get completion suggestions at position
   */
  completion(content: string, position: LSPPosition): string[] {
    const ast = this.parseAST(content);
    const suggestions: string[] = [];

    // Add node IDs as suggestions
    ast.forEach(node => {
      if (node.id) {
        suggestions.push(node.id);
      }
    });

    // Add R5RS functions
    suggestions.push(
      'r5rs:church-zero',
      'r5rs:church-one',
      'r5rs:church-succ',
      'r5rs:church-add',
      'r5rs:church-mult',
      'r5rs:attention',
      'r5rs:qubit',
    );

    // Add dimension types
    suggestions.push('0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D');

    // Add node types
    suggestions.push('text', 'file', 'node', 'automaton', 'shacl', 'rfc2119', 'asp');

    // Add edge types
    suggestions.push('vertical', 'horizontal', 'transition', 'self-ref', 'r5rs-call');

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Validate CanvasL content
   */
  validate(content: string): { errors: Array<{ line: number; message: string }> } {
    const errors: Array<{ line: number; message: string }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        const validation = jsonlCanvasService.validateEntry(entry);

        if (!validation.valid) {
          errors.push({
            line: i + 1,
            message: validation.errors.join('; '),
          });
        }
      } catch (e) {
        errors.push({
          line: i + 1,
          message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
        });
      }
    }

    return { errors };
  }
}

export const canvaslLSPService: CanvasLLSPService = new CanvasLLSPServiceImpl();
