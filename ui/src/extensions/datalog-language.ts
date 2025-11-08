/**
 * CodeMirror 6 Extension for Datalog Language
 * 
 * Provides syntax highlighting for Datalog rules and queries
 * Compatible with Lezer grammar system
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Datalog Highlighting Plugin
 */
const datalogHighlightPlugin = ViewPlugin.fromClass(
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
        if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('//')) {
          currentPos += line.length + 1;
          continue;
        }

        // Highlight rule head (before :-)
        const ruleHeadMatch = line.match(/^([^:-]+):-/);
        if (ruleHeadMatch && ruleHeadMatch.index !== undefined) {
          const start = currentPos + ruleHeadMatch.index;
          const end = start + ruleHeadMatch[1].length;
          decorations.push(
            Decoration.mark({
              class: 'cm-datalog-rule-head',
            }).range(start, end)
          );
        }

        // Highlight predicates
        const predicateRegex = /\b([a-z][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        while ((match = predicateRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[1].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-datalog-predicate',
              }).range(start, end)
            );
          }
        }

        // Highlight variables (words starting with uppercase or ?)
        const variableRegex = /\b([A-Z?][a-zA-Z0-9_]*)\b/g;
        while ((match = variableRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-datalog-variable',
              }).range(start, end)
            );
          }
        }

        // Highlight operators (:- , . ;)
        const operatorRegex = /(:-|,|\.|;)/g;
        while ((match = operatorRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-datalog-operator',
              }).range(start, end)
            );
          }
        }

        // Highlight negation (not, !)
        const negationRegex = /\b(not|!)\b/g;
        while ((match = negationRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-datalog-negation',
              }).range(start, end)
            );
          }
        }

        // Highlight aggregation functions (count, sum, avg, min, max)
        const aggRegex = /\b(count|sum|avg|min|max)\s*\(/gi;
        while ((match = aggRegex.exec(line)) !== null) {
          if (match.index !== undefined) {
            const start = currentPos + match.index;
            const end = start + match[1].length;
            decorations.push(
              Decoration.mark({
                class: 'cm-datalog-aggregate',
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
 * Datalog Language Support
 */
export function datalogLanguage(): Extension[] {
  return [
    datalogHighlightPlugin,
    
    EditorView.baseTheme({
      // Datalog rule head highlighting
      '.cm-datalog-rule-head': {
        color: '#79b8ff',
        fontWeight: 'bold',
      },
      
      // Datalog predicate highlighting
      '.cm-datalog-predicate': {
        color: '#b392f0',
        fontWeight: '500',
      },
      
      // Datalog variable highlighting
      '.cm-datalog-variable': {
        color: '#ffab70',
        fontWeight: '500',
      },
      
      // Datalog operator highlighting
      '.cm-datalog-operator': {
        color: '#f97583',
        fontWeight: 'bold',
      },
      
      // Datalog negation highlighting
      '.cm-datalog-negation': {
        color: '#fdaeb7',
        fontWeight: 'bold',
      },
      
      // Datalog aggregate function highlighting
      '.cm-datalog-aggregate': {
        color: '#9ecbff',
        fontWeight: 'bold',
      },
    }),
  ];
}
