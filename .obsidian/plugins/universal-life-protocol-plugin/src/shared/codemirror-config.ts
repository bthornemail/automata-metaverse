/**
 * Unified CodeMirror Configuration for Obsidian Plugin
 * 
 * This is a copy of the shared configuration adapted for the Obsidian plugin structure.
 */

import { Extension, EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { history, defaultKeymap as historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';

// Import our custom extensions
import { markdownWithFrontMatter } from '../extensions/markdown-frontmatter';
import { canvaslLanguage } from '../extensions/canvasl-language';

export type Language = 'javascript' | 'markdown' | 'canvasl';

export interface UnifiedCodeMirrorConfig {
  // Language settings
  language: Language;
  
  // Editor appearance
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily?: string;
  lineHeight?: number;
  
  // Editor features
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  highlightActiveLine: boolean;
  bracketMatching: boolean;
  closeBrackets: boolean;
  autocompletion: boolean;
  
  // OpenCode integration
  openCodeEnabled: boolean;
  openCodeAutoAnalyze: boolean;
  openCodeModel: string;
  openCodeTemperature: number;
  openCodeMaxTokens: number;
  
  // AI agent assistance
  aiAssistanceEnabled: boolean;
  aiAgentContext: boolean;
  aiAutoComplete: boolean;
  
  // JSONL automaton integration
  jsonlIntegration: boolean;
  schemeREPL: boolean;
  
  // Custom extensions
  customExtensions?: Extension[];
  
  // Platform-specific settings
  platform?: 'obsidian' | 'ui' | 'opencode';
}

export const DEFAULT_CONFIG: UnifiedCodeMirrorConfig = {
  language: 'javascript',
  theme: 'dark',
  fontSize: 14,
  showLineNumbers: true,
  wordWrap: false,
  tabSize: 2,
  highlightActiveLine: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  openCodeEnabled: false,
  openCodeAutoAnalyze: false,
  openCodeModel: 'llama2',
  openCodeTemperature: 0.7,
  openCodeMaxTokens: 2048,
  aiAssistanceEnabled: false,
  aiAgentContext: false,
  aiAutoComplete: false,
  jsonlIntegration: false,
  schemeREPL: false,
  customExtensions: [],
};

/**
 * Create base extensions that are common to all configurations
 */
function createBaseExtensions(config: UnifiedCodeMirrorConfig): Extension[] {
  const extensions: Extension[] = [
    // Core editing features
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    
    // Keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...lintKeymap,
    ]),
  ];

  // Optional features
  if (config.showLineNumbers) {
    extensions.push(lineNumbers());
  }

  if (config.highlightActiveLine) {
    extensions.push(highlightActiveLineGutter(), highlightActiveLine());
  }

  if (config.wordWrap) {
    extensions.push(EditorView.theme({
      '.cm-scroller': {
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      },
    }));
  }

  // Selection features
  extensions.push(rectangularSelection(), crosshairCursor());

  return extensions;
}

/**
 * Create language-specific extensions
 */
function createLanguageExtensions(config: UnifiedCodeMirrorConfig): Extension[] {
  switch (config.language) {
    case 'javascript':
      return [javascript()];
    case 'markdown':
      return markdownWithFrontMatter();
    case 'canvasl':
      return canvaslLanguage();
    default:
      return [];
  }
}

/**
 * Create theme extensions
 */
function createThemeExtensions(config: UnifiedCodeMirrorConfig): Extension[] {
  const extensions: Extension[] = [];

  // Custom theme for unified appearance
  extensions.push(
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${config.fontSize}px`,
        fontFamily: config.fontFamily || 'var(--font-monospace, monospace)',
        lineHeight: config.lineHeight ? `${config.lineHeight}` : undefined,
        color: config.theme === 'dark' ? '#e1e4e8' : '#24292e',
        backgroundColor: config.theme === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '100%',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--font-monospace, monospace)',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-line': {
        padding: '0 0',
      },
      '.cm-cursor': {
        borderLeftColor: config.theme === 'dark' ? '#58a6ff' : '#0969da',
      },
      '.cm-selectionBackground': {
        backgroundColor: config.theme === 'dark' ? '#264f78' : '#cce7ff',
      },
      // Platform-specific adjustments
      ...(config.platform === 'obsidian' ? {
        '.cm-content': {
          padding: '10px',
        },
      } : {}),
      ...(config.platform === 'ui' ? {
        '.cm-content': {
          padding: '12px',
          backgroundColor: config.theme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
      } : {}),
    })
  );

  return extensions;
}

/**
 * Main function to create unified CodeMirror extensions
 */
export function createUnifiedExtensions(config: Partial<UnifiedCodeMirrorConfig> = {}): Extension[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const extensions: Extension[] = [
    // Base extensions
    ...createBaseExtensions(finalConfig),
    
    // Language extensions
    ...createLanguageExtensions(finalConfig),
    
    // Theme extensions
    ...createThemeExtensions(finalConfig),
    
    // Custom extensions
    ...(finalConfig.customExtensions || []),
  ];

  return extensions;
}

/**
 * Helper function to create configuration for specific platforms
 */
export function createObsidianConfig(overrides: Partial<UnifiedCodeMirrorConfig> = {}): UnifiedCodeMirrorConfig {
  return {
    ...DEFAULT_CONFIG,
    platform: 'obsidian',
    theme: 'dark',
    fontSize: 14,
    showLineNumbers: true,
    ...overrides,
  };
}

/**
 * Language detection utilities
 */
export function detectLanguageFromExtension(filename: string): Language {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'json':
      return 'javascript';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'canvasl':
    case 'jsonl':
      return 'canvasl';
    default:
      return 'javascript';
  }
}

export function detectLanguageFromContent(content: string): Language {
  // Check for JSONL/CanvasL patterns
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    try {
      const firstLine = JSON.parse(lines[0]);
      if (firstLine.id && firstLine.type) {
        return 'canvasl';
      }
    } catch (e) {
      // Not JSON, continue checking
    }
  }
  
  // Check for front matter
  if (content.startsWith('---\n')) {
    return 'markdown';
  }
  
  // Check for markdown patterns
  if (content.includes('# ') || content.includes('## ') || content.includes('**') || content.includes('*')) {
    return 'markdown';
  }
  
  // Default to JavaScript
  return 'javascript';
}