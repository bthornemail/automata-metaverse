/**
 * JSONL Automaton Integration for CodeMirror
 * 
 * Provides integration with JSONL automaton system and LLM enhancements:
 * - Real-time JSONL parsing and validation
 * - CanvasL language support with dimensional progression
 * - Automaton state management
 * - LLM-powered suggestions and completions
 * - Church encoding pattern recognition
 * - Self-reference tracking
 */

import { Extension, EditorState } from '@codemirror/state';
import { EditorView, ViewPlugin, Decoration, DecorationSet, keymap } from '@codemirror/view';

export interface JSONLEntry {
  id: string;
  type: string;
  x?: number;
  y?: number;
  text?: string;
  from?: string;
  to?: string;
  function?: string;
  dimension?: string;
  [key: string]: any;
}

export interface AutomatonState {
  entries: JSONLEntry[];
  dimensions: Set<string>;
  references: Map<string, string[]>;
  functions: Set<string>;
  errors: Array<{ line: number; message: string; entry?: JSONLEntry }>;
  metadata: {
    totalEntries: number;
    canvasBounds: { minX: number; minY: number; maxX: number; maxY: number };
    lastModified: number;
  };
}

export interface LLMSuggestion {
  type: 'completion' | 'correction' | 'enhancement' | 'pattern';
  text: string;
  description: string;
  confidence: number;
  line?: number;
  position?: number;
}

export interface JSONLIntegrationConfig {
  enabled: boolean;
  autoValidate: boolean;
  llmEnabled: boolean;
  llmEndpoint?: string;
  llmModel?: string;
  showErrors: boolean;
  showSuggestions: boolean;
  trackReferences: boolean;
  churchEncodingMode: boolean;
}

/**
 * JSONL Parser and Validator
 */
class JSONLParser {
  static parse(content: string): { entries: JSONLEntry[]; errors: Array<{ line: number; message: string }> } {
    const entries: JSONLEntry[] = [];
    const errors: Array<{ line: number; message: string }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const entry = JSON.parse(line) as JSONLEntry;
        
        // Validate required fields
        if (!entry.id) {
          errors.push({ line: i + 1, message: 'Missing required field: id' });
          continue;
        }
        
        if (!entry.type) {
          errors.push({ line: i + 1, message: 'Missing required field: type' });
          continue;
        }

        // Validate entry type
        const validTypes = ['node', 'edge', 'vertical', 'horizontal', 'transition', 'self-ref', 'r5rs-call', 'directive'];
        if (!validTypes.includes(entry.type)) {
          errors.push({ line: i + 1, message: `Invalid type: ${entry.type}` });
        }

        // Validate coordinates for nodes
        if (['node'].includes(entry.type) && (entry.x === undefined || entry.y === undefined)) {
          errors.push({ line: i + 1, message: 'Node entries require x and y coordinates' });
        }

        // Validate edge connections
        if (['edge', 'vertical', 'horizontal', 'transition'].includes(entry.type)) {
          if (!entry.from && !entry.to) {
            errors.push({ line: i + 1, message: 'Edge entries require from or to field' });
          }
        }

        entries.push(entry);
      } catch (error) {
        errors.push({ line: i + 1, message: `Invalid JSON: ${error.message}` });
      }
    }

    return { entries, errors };
  }

  static extractDimensions(entries: JSONLEntry[]): Set<string> {
    const dimensions = new Set<string>();
    
    for (const entry of entries) {
      // Extract from ID pattern (e.g., "0D-topology", "1D-temporal")
      const match = entry.id.match(/^(\dD)/);
      if (match) {
        dimensions.add(match[1]);
      }
      
      // Extract from dimension field if present
      if (entry.dimension) {
        dimensions.add(entry.dimension);
      }
    }
    
    return dimensions;
  }

  static extractReferences(entries: JSONLEntry[]): Map<string, string[]> {
    const references = new Map<string, string[]>();
    
    for (const entry of entries) {
      const refs: string[] = [];
      
      // Extract from/to references
      if (entry.from) refs.push(entry.from);
      if (entry.to) refs.push(entry.to);
      
      // Extract #id references in text
      if (entry.text) {
        const refMatches = entry.text.match(/#([a-zA-Z0-9_-]+)/g);
        if (refMatches) {
          refs.push(...refMatches.map(ref => ref.substring(1)));
        }
      }
      
      // Extract @directive references
      if (entry.text) {
        const dirMatches = entry.text.match(/@([a-zA-Z_][a-zA-Z0-9_-]*)/g);
        if (dirMatches) {
          refs.push(...dirMatches);
        }
      }
      
      if (refs.length > 0) {
        references.set(entry.id, refs);
      }
    }
    
    return references;
  }

  static extractFunctions(entries: JSONLEntry[]): Set<string> {
    const functions = new Set<string>();
    
    for (const entry of entries) {
      if (entry.function) {
        functions.add(entry.function);
      }
      
      // Extract function calls from text
      if (entry.text) {
        const funcMatches = entry.text.match(/([a-zA-Z_][a-zA-Z0-9_-]*)\s*\(/g);
        if (funcMatches) {
          funcMatches.forEach(match => {
            const funcName = match.replace(/\s*\($/, '');
            functions.add(funcName);
          });
        }
      }
    }
    
    return functions;
  }

  static calculateCanvasBounds(entries: JSONLEntry[]): { minX: number; minY: number; maxX: number; maxY: number } {
    const nodes = entries.filter(entry => entry.x !== undefined && entry.y !== undefined);
    
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    const xCoords = nodes.map(n => n.x!);
    const yCoords = nodes.map(n => n.y!);
    
    return {
      minX: Math.min(...xCoords),
      minY: Math.min(...yCoords),
      maxX: Math.max(...xCoords),
      maxY: Math.max(...yCoords),
    };
  }
}

/**
 * LLM Integration for JSONL Enhancement
 */
class LLMIntegrator {
  private config: JSONLIntegrationConfig;
  private cache = new Map<string, LLMSuggestion[]>();

  constructor(config: JSONLIntegrationConfig) {
    this.config = config;
  }

  async getSuggestions(content: string, cursorPos?: number): Promise<LLMSuggestion[]> {
    if (!this.config.llmEnabled || !this.config.llmEndpoint) {
      return [];
    }

    const cacheKey = `${content.substring(0, 100)}_${cursorPos}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const suggestions = await this.generateSuggestions(content, cursorPos);
      this.cache.set(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('LLM suggestion generation failed:', error);
      return [];
    }
  }

  private async generateSuggestions(content: string, cursorPos?: number): Promise<LLMSuggestion[]> {
    // This would integrate with actual LLM service
    // For now, return mock suggestions based on patterns
    
    const suggestions: LLMSuggestion[] = [];
    const lines = content.split('\n');
    const currentLine = cursorPos ? content.substring(0, cursorPos).split('\n').length - 1 : 0;

    // Pattern-based suggestions
    if (currentLine < lines.length) {
      const currentLineText = lines[currentLine];
      
      // Suggest entry types
      if (currentLineText.includes('"type":')) {
        suggestions.push({
          type: 'completion',
          text: '"node"',
          description: 'Node entry type',
          confidence: 0.9,
          line: currentLine,
        });
        
        suggestions.push({
          type: 'completion',
          text: '"vertical"',
          description: 'Vertical edge type',
          confidence: 0.8,
          line: currentLine,
        });
      }
      
      // Suggest Church encoding patterns
      if (this.config.churchEncodingMode && currentLineText.includes('"function":')) {
        suggestions.push({
          type: 'pattern',
          text: '"r5rs:church-add"',
          description: 'Church addition function',
          confidence: 0.85,
          line: currentLine,
        });
        
        suggestions.push({
          type: 'pattern',
          text: '"r5rs:church-mul"',
          description: 'Church multiplication function',
          confidence: 0.85,
          line: currentLine,
        });
      }
      
      // Suggest dimensional IDs
      if (currentLineText.includes('"id":')) {
        const dimensions = ['0D', '1D', '2D', '3D', '4D', '5D', '6D', '7D'];
        dimensions.forEach(dim => {
          suggestions.push({
            type: 'completion',
            text: `"${dim}-${this.generateSuggestedName(dim)}"`,
            description: `${dim} dimensional node`,
            confidence: 0.7,
            line: currentLine,
          });
        });
      }
    }

    return suggestions;
  }

  private generateSuggestedName(dimension: string): string {
    const names = {
      '0D': ['topology', 'point', 'vacuum', 'identity'],
      '1D': ['temporal', 'line', 'successor', 'sequence'],
      '2D': ['structural', 'surface', 'pattern', 'unification'],
      '3D': ['algebraic', 'volume', 'church', 'lambda'],
      '4D': ['network', 'spacetime', 'ipv4', 'localhost'],
      '5D': ['consensus', 'blockchain', 'ledger', 'merkle'],
      '6D': ['intelligence', 'ai', 'neural', 'transformer'],
      '7D': ['quantum', 'superposition', 'entanglement', 'qubit'],
    };
    
    const dimNames = names[dimension as keyof typeof names] || ['node'];
    return dimNames[Math.floor(Math.random() * dimNames.length)];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * JSONL Integration Plugin
 */
const jsonlIntegrationPlugin = ViewPlugin.fromClass(
  class {
    private config: JSONLIntegrationConfig;
    private parser = JSONLParser;
    private llmIntegrator: LLMIntegrator;
    private state: AutomatonState;
    public decorations: DecorationSet;
    private suggestions: LLMSuggestion[] = [];
    private debounceTimer?: number;

    constructor(view: EditorView) {
      this.config = {
        enabled: true,
        autoValidate: true,
        llmEnabled: false,
        showErrors: true,
        showSuggestions: true,
        trackReferences: true,
        churchEncodingMode: true,
      };
      
      this.llmIntegrator = new LLMIntegrator(this.config);
      this.state = this.initializeState();
      this.decorations = Decoration.none;
      
      this.updateState(view);
    }

    update(update: any) {
      if (update.docChanged) {
        // Debounce state updates
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = window.setTimeout(() => {
          this.updateState(update.view);
        }, 300);
      }
    }

    private updateState(view: EditorView) {
      const content = view.state.doc.toString();
      
      // Parse JSONL
      const { entries, errors } = this.parser.parse(content);
      
      // Extract metadata
      const dimensions = this.parser.extractDimensions(entries);
      const references = this.parser.extractReferences(entries);
      const functions = this.parser.extractFunctions(entries);
      const canvasBounds = this.parser.calculateCanvasBounds(entries);
      
      // Update state
      this.state = {
        entries,
        dimensions,
        references,
        functions,
        errors: errors.map(e => ({ ...e, entry: entries[e.line - 1] })),
        metadata: {
          totalEntries: entries.length,
          canvasBounds,
          lastModified: Date.now(),
        },
      };
      
      // Update decorations
      this.decorations = this.buildDecorations(view);
      
      // Generate LLM suggestions if enabled
      if (this.config.llmEnabled) {
        const cursorPos = view.state.selection.main.head;
        this.llmIntegrator.getSuggestions(content, cursorPos).then(suggestions => {
          this.suggestions = suggestions;
          // Trigger re-render
          this.decorations = this.buildDecorations(view);
        });
      }
    }

    private initializeState(): AutomatonState {
      return {
        entries: [],
        dimensions: new Set(),
        references: new Map(),
        functions: new Set(),
        errors: [],
        metadata: {
          totalEntries: 0,
          canvasBounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
          lastModified: Date.now(),
        },
      };
    }

    private buildDecorations(view: EditorView): DecorationSet {
      const decorations: any[] = [];
      const doc = view.state.doc;
      const text = doc.toString();
      const lines = text.split('\n');

      // Error decorations
      if (this.config.showErrors) {
        for (const error of this.state.errors) {
          if (error.line > 0 && error.line <= lines.length) {
            const lineStart = doc.line(error.line).from;
            const lineEnd = doc.line(error.line).to;
            
            decorations.push(
              Decoration.line({
                class: 'cm-jsonl-error-line',
                attributes: {
                  title: error.message,
                },
              }).range(lineStart)
            );
          }
        }
      }

      // Dimension highlighting
      let currentPos = 0;
      for (const line of lines) {
        const dimMatch = line.match(/"(\dD)-([^"]+)"/);
        if (dimMatch) {
          const dimStart = currentPos + line.indexOf(dimMatch[1]);
          const dimEnd = dimStart + dimMatch[1].length;
          
          decorations.push(
            Decoration.mark({
              class: 'cm-jsonl-dimension',
            }).range(dimStart, dimEnd)
          );
        }
        
        // Function highlighting
        const funcMatch = line.match(/"function":\s*"([^"]+)"/);
        if (funcMatch) {
          const funcStart = currentPos + line.indexOf(funcMatch[1]);
          const funcEnd = funcStart + funcMatch[1].length;
          
          let className = 'cm-jsonl-function';
          if (funcMatch[1].startsWith('r5rs:')) {
            className = 'cm-jsonl-r5rs-function';
          }
          
          decorations.push(
            Decoration.mark({
              class: className,
            }).range(funcStart, funcEnd)
          );
        }
        
        // Reference highlighting
        const refRegex = /#([a-zA-Z0-9_-]+)/g;
        let refMatch;
        while ((refMatch = refRegex.exec(line)) !== null) {
          if (refMatch.index !== undefined) {
            const refStart = currentPos + refMatch.index;
            const refEnd = refStart + refMatch[0].length;
            
            decorations.push(
              Decoration.mark({
                class: 'cm-jsonl-reference',
              }).range(refStart, refEnd)
            );
          }
        }
        
        currentPos += line.length + 1;
      }

      // Suggestion decorations
      if (this.config.showSuggestions && this.suggestions.length > 0) {
        // Add suggestion widget or gutter
        for (const suggestion of this.suggestions.slice(0, 3)) {
          if (suggestion.line && suggestion.line > 0 && suggestion.line <= lines.length) {
            const lineStart = doc.line(suggestion.line).from;
            
            decorations.push(
              Decoration.widget({
                widget: this.createSuggestionWidget(suggestion),
              }).range(lineStart)
            );
          }
        }
      }

      return Decoration.set(decorations);
    }

    private createSuggestionWidget(suggestion: LLMSuggestion) {
      let cachedDOM: HTMLSpanElement | null = null;
      
      return {
        toDOM: () => {
          if (!cachedDOM) {
            cachedDOM = document.createElement('span');
            cachedDOM.className = 'cm-jsonl-suggestion';
            cachedDOM.textContent = '💡 ' + suggestion.description;
            cachedDOM.style.cssText = `
              font-size: 12px;
              color: #58a6ff;
              background: rgba(88, 166, 255, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
              margin-left: 8px;
              cursor: pointer;
            `;
            
            cachedDOM.addEventListener('click', () => {
              // Apply suggestion
              console.log('Applying suggestion:', suggestion);
            });
          }
          return cachedDOM;
        },
        eq: () => false,
        updateDOM: () => false,
        estimatedHeight: -1,
        lineBreaks: 0,
        ignoreEvent: () => false,
        coordsAt: () => null,
        destroy: () => {
          if (cachedDOM) {
            cachedDOM.remove();
            cachedDOM = null;
          }
        }
      };
    }

    getState(): AutomatonState {
      return this.state;
    }

    getSuggestions(): LLMSuggestion[] {
      return this.suggestions;
    }

    updateConfig(newConfig: Partial<JSONLIntegrationConfig>): void {
      this.config = { ...this.config, ...newConfig };
      this.llmIntegrator = new LLMIntegrator(this.config);
    }

    getConfig(): JSONLIntegrationConfig {
      return this.config;
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * JSONL Keymap Extensions
 */
function createJSONLKeymap(): Extension {
  return keymap.of([
    {
      key: 'Ctrl-Shift-V',
      run: (view) => {
        // Validate JSONL
        const plugin = view.plugin(jsonlIntegrationPlugin);
        if (plugin) {
          const state = plugin.getState();
          console.log('JSONL State:', state);
        }
        return true;
      },
    },
    {
      key: 'Ctrl-Shift-L',
      run: (view) => {
        // Toggle LLM suggestions
        const plugin = view.plugin(jsonlIntegrationPlugin);
        if (plugin) {
          plugin.updateConfig({ llmEnabled: !plugin.getConfig().llmEnabled });
        }
        return true;
      },
    },
  ]);
}

/**
 * Main JSONL Integration Extension
 */
export function jsonlIntegration(config: Partial<JSONLIntegrationConfig> = {}): Extension[] {
  return [
    jsonlIntegrationPlugin,
    createJSONLKeymap(),
    EditorView.baseTheme({
      '.cm-jsonl-error-line': {
        backgroundColor: 'rgba(248, 81, 82, 0.1)',
        borderLeft: '3px solid #f85152',
        paddingLeft: '8px',
      },
      '.cm-jsonl-dimension': {
        color: '#ffab70',
        fontWeight: 'bold',
      },
      '.cm-jsonl-function': {
        color: '#79b8ff',
        fontWeight: '500',
      },
      '.cm-jsonl-r5rs-function': {
        color: '#9ecbff',
        fontFamily: 'monospace',
        fontWeight: '500',
      },
      '.cm-jsonl-reference': {
        color: '#79b8ff',
        textDecoration: 'underline',
        cursor: 'pointer',
      },
      '.cm-jsonl-suggestion': {
        display: 'inline-block',
        margin: '2px 0',
      },
      '.cm-jsonl-suggestion:hover': {
        backgroundColor: 'rgba(88, 166, 255, 0.2)',
      },
    }),
  ];
}

/**
 * Utility functions for JSONL integration
 */
export function getJSONLState(view: EditorView): AutomatonState | null {
  const plugin = view.plugin(jsonlIntegrationPlugin);
  return plugin ? plugin.getState() : null;
}

export function getJSONLSuggestions(view: EditorView): LLMSuggestion[] {
  const plugin = view.plugin(jsonlIntegrationPlugin);
  return plugin ? plugin.getSuggestions() : [];
}

export function updateJSONLConfig(view: EditorView, config: Partial<JSONLIntegrationConfig>): void {
  const plugin = view.plugin(jsonlIntegrationPlugin);
  if (plugin) {
    plugin.updateConfig(config);
  }
}