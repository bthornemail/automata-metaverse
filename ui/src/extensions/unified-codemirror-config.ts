/**
 * Unified CodeMirror Configuration
 * 
 * Shared configuration for CodeMirror 6 across:
 * - Obsidian Plugin
 * - OpenCode Interface  
 * - UI CodeEditor
 * - JSONL Automaton Integration
 * 
 * Ensures consistent editing experience across all platforms
 */

import { Extension, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { history, defaultKeymap as historyKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';

export interface IUnifiedEditorConfig {
  fontSize: number;
  theme: 'dark' | 'light';
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  highlightActiveLine: boolean;
  bracketMatching: boolean;
  autocompletion: boolean;
  foldGutter: boolean;
  keybindings: {
    save: string;
    find: string;
    replace: string;
    format: string;
    evaluateInREPL: string;
    openCodeAnalysis: string;
    aiAssist: string;
  };
}

export const DEFAULT_UNIFIED_CONFIG: IUnifiedEditorConfig = {
  fontSize: 14,
  theme: 'dark',
  showLineNumbers: true,
  wordWrap: true,
  tabSize: 2,
  highlightActiveLine: true,
  bracketMatching: true,
  autocompletion: true,
  foldGutter: true,
  keybindings: {
    save: 'Mod-s',
    find: 'Mod-f',
    replace: 'Mod-h',
    format: 'Mod-Shift-f',
    evaluateInREPL: 'Mod-Enter',
    openCodeAnalysis: 'Mod-Shift-a',
    aiAssist: 'Mod-Shift-i'
  }
};

/**
 * Create base CodeMirror extensions with unified configuration
 */
export function createBaseExtensions(config: IUnifiedEditorConfig = DEFAULT_UNIFIED_CONFIG): Extension[] {
  const extensions: Extension[] = [
    // Core editing features
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    
    // Keybindings
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
    ]),
  ];

  // Optional features based on config
  if (config.showLineNumbers) {
    extensions.push(lineNumbers(), highlightActiveLineGutter());
  }

  if (config.highlightActiveLine) {
    extensions.push(highlightActiveLine());
  }

  if (config.autocompletion) {
    extensions.push(closeBrackets(), autocompletion());
    extensions.push(keymap.of([...closeBracketsKeymap, ...completionKeymap]));
  }

  // Advanced selection features
  extensions.push(rectangularSelection(), crosshairCursor());

  // Theme
  if (config.theme === 'dark') {
    extensions.push(oneDark);
  }

  // Base theme for consistent styling
  extensions.push(
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${config.fontSize}px`,
        fontFamily: 'var(--font-monospace, "JetBrains Mono", "Fira Code", monospace)',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '100%',
        lineHeight: '1.5',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'inherit',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-line': {
        padding: '0 0',
      },
      '.cm-gutters': {
        backgroundColor: config.theme === 'dark' ? '#2d2d30' : '#f5f5f5',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: config.theme === 'dark' ? '#37373d' : '#e8e8e8',
      },
      '.cm-cursor': {
        borderLeftColor: config.theme === 'dark' ? '#ffffff' : '#000000',
      },
    })
  );

  return extensions;
}

/**
 * Platform-specific extension sets
 */
export const PLATFORM_EXTENSIONS = {
  // Obsidian-specific extensions
  obsidian: (config: IUnifiedEditorConfig, onSave?: () => void, onAnalyze?: () => void, onAIAssist?: () => void): Extension[] => [
    keymap.of([
      {
        key: config.keybindings.save,
        run: () => {
          onSave?.();
          return true;
        },
      },
      {
        key: config.keybindings.openCodeAnalysis,
        run: () => {
          onAnalyze?.();
          return true;
        },
      },
      {
        key: config.keybindings.aiAssist,
        run: () => {
          onAIAssist?.();
          return true;
        },
      },
    ]),
  ],

  // OpenCode-specific extensions
  opencode: (config: IUnifiedEditorConfig, onSave?: () => void, onAnalyze?: () => void, onEvaluate?: () => void): Extension[] => [
    keymap.of([
      {
        key: config.keybindings.save,
        run: () => {
          onSave?.();
          return true;
        },
      },
      {
        key: config.keybindings.openCodeAnalysis,
        run: () => {
          onAnalyze?.();
          return true;
        },
      },
      {
        key: config.keybindings.evaluateInREPL,
        run: () => {
          onEvaluate?.();
          return true;
        },
      },
    ]),
  ],

  // UI-specific extensions
  ui: (config: IUnifiedEditorConfig, onSave?: () => void, onAnalyze?: () => void, onEvaluate?: () => void, onAIAssist?: () => void): Extension[] => [
    keymap.of([
      {
        key: config.keybindings.save,
        run: () => {
          onSave?.();
          return true;
        },
      },
      {
        key: config.keybindings.openCodeAnalysis,
        run: () => {
          onAnalyze?.();
          return true;
        },
      },
      {
        key: config.keybindings.evaluateInREPL,
        run: () => {
          onEvaluate?.();
          return true;
        },
      },
      {
        key: config.keybindings.aiAssist,
        run: () => {
          onAIAssist?.();
          return true;
        },
      },
    ]),
  ],
};

/**
 * Language-specific configurations
 */
export const LANGUAGE_CONFIGS = {
  javascript: {
    extensions: [] as Extension[],
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    mimeType: 'application/javascript',
  },
  
  typescript: {
    extensions: [] as Extension[],
    fileExtensions: ['.ts', '.tsx'],
    mimeType: 'application/typescript',
  },
  
  markdown: {
    extensions: [] as Extension[],
    fileExtensions: ['.md', '.markdown'],
    mimeType: 'text/markdown',
  },
  
  canvasl: {
    extensions: [] as Extension[],
    fileExtensions: ['.canvasl', '.jsonl'],
    mimeType: 'application/jsonl',
  },
  
  scheme: {
    extensions: [] as Extension[],
    fileExtensions: ['.scm', '.ss'],
    mimeType: 'text/x-scheme',
  },
};

/**
 * Create unified editor configuration for a specific platform
 */
export function createUnifiedEditorConfig(
  platform: 'obsidian' | 'opencode' | 'ui',
  config: Partial<IUnifiedEditorConfig> = {},
  callbacks: {
    onSave?: () => void;
    onAnalyze?: () => void;
    onEvaluate?: () => void;
    onAIAssist?: () => void;
  } = {}
): Extension[] {
  const finalConfig = { ...DEFAULT_UNIFIED_CONFIG, ...config };
  
  const baseExtensions = createBaseExtensions(finalConfig);
  const platformExtensions = PLATFORM_EXTENSIONS[platform](
    finalConfig,
    callbacks.onSave,
    callbacks.onAnalyze,
    callbacks.onEvaluate,
    callbacks.onAIAssist
  );

  return [...baseExtensions, ...platformExtensions];
}

/**
 * Detect language from file path or content
 */
export function detectLanguageFromPath(filePath: string): keyof typeof LANGUAGE_CONFIGS {
  const ext = filePath.toLowerCase().split('.').pop();
  
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.fileExtensions.some(ext => filePath.toLowerCase().endsWith(ext))) {
      return lang as keyof typeof LANGUAGE_CONFIGS;
    }
  }
  
  // Default to JavaScript
  return 'javascript';
}

/**
 * Detect language from content
 */
export function detectLanguageFromContent(content: string): keyof typeof LANGUAGE_CONFIGS {
  // Check for JSONL/CanvasL format
  if (content.trim().split('\n').every(line => {
    const trimmed = line.trim();
    return !trimmed || (trimmed.startsWith('{') && trimmed.endsWith('}'));
  })) {
    return 'canvasl';
  }
  
  // Check for Markdown front matter
  if (content.trim().startsWith('---')) {
    return 'markdown';
  }
  
  // Check for Scheme
  if (content.includes('(define ') || content.includes('(lambda ') || content.includes('(let ')) {
    return 'scheme';
  }
  
  // Check for TypeScript
  if (content.includes(': ') || content.includes('interface ') || content.includes('type ')) {
    return 'typescript';
  }
  
  // Default to JavaScript
  return 'javascript';
}

/**
 * Export configuration for use in different platforms
 */
export type { UnifiedEditorConfig };