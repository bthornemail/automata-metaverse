/**
 * CodeMirror 6 Extension for Prolog Language
 * 
 * Provides syntax highlighting for Prolog queries and facts
 * Compatible with Lezer grammar system
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Prolog Highlighting Plugin
 */
const prologHighlightPlugin = ViewPlugin.fromClass(
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
      const lines = text.split('\n');
      let currentPos = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('%')) {
          currentPos += line.length + 1;
          continue;
        }

        // Highlight predicates (words followed by parentheses or ending with period)
        const predicateRegex = /([a-z][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        while ((match = predicateRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[1].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-prolog-predicate',
              }).range(start, end)
            );
          }
        }

        // Highlight variables (words starting with uppercase)
        const variableRegex = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
        while ((match = variableRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-prolog-variable',
              }).range(start, end)
            );
          }
        }

        // Highlight operators (:- , . ; |)
        const operatorRegex = /(:-|,|\.|;|\|)/g;
        while ((match = operatorRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-prolog-operator',
              }).range(start, end)
            );
          }
        }

        // Highlight strings
        const stringRegex = /"([^"]*)"/g;
        while ((match = stringRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-prolog-string',
              }).range(start, end)
            );
          }
        }

        // Highlight numbers
        const numberRegex = /\b(\d+\.?\d*)\b/g;
        while ((match = numberRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-prolog-number',
              }).range(start, end)
            );
          }
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
 * Prolog Language Support
 */
export function prologLanguage(): Extension[] {
  return [
    prologHighlightPlugin,
    
    EditorView.baseTheme({
      // Prolog predicate highlighting
      '.cm-prolog-predicate': {
        color: '#79b8ff',
        fontWeight: 'bold',
      },
      
      // Prolog variable highlighting
      '.cm-prolog-variable': {
        color: '#ffab70',
        fontWeight: '500',
      },
      
      // Prolog operator highlighting
      '.cm-prolog-operator': {
        color: '#f97583',
        fontWeight: 'bold',
      },
      
      // Prolog string highlighting
      '.cm-prolog-string': {
        color: '#9ecbff',
        fontStyle: 'italic',
      },
      
      // Prolog number highlighting
      '.cm-prolog-number': {
        color: '#79b8ff',
      },
    }),
  ];
}
