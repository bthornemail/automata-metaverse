/**
 * Code Editor Panel
 * Extracted from CodeEditor component for use in UnifiedEditor
 */

import React, { useEffect, useRef, useState } from 'react';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { EditorPanelProps } from '../types';
import { markdownWithFrontMatter } from '../../../extensions/markdown-frontmatter';
import { canvaslLanguage } from '../../../extensions/canvasl-language';
import { prologLanguage } from '../../../extensions/prolog-language';
import { datalogLanguage } from '../../../extensions/datalog-language';

interface CodeEditorPanelState {
  showLineNumbers: boolean;
  theme: 'dark' | 'light';
  fontSize: number;
  wordWrap: boolean;
}

export const CodeEditorPanel: React.FC<EditorPanelProps> = ({
  content,
  language,
  onContentChange,
  readOnly = false,
  height = '100%'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [config, setConfig] = useState<CodeEditorPanelState>({
    showLineNumbers: true,
    theme: 'dark',
    fontSize: 14,
    wordWrap: true
  });

  useEffect(() => {
    if (!editorRef.current) return;

    // Destroy existing editor if language changed
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Create new editor with appropriate language
    let languageExtensions: Extension[];
    try {
      if (language === 'markdown') {
        languageExtensions = markdownWithFrontMatter();
      } else if (language === 'canvasl') {
        languageExtensions = canvaslLanguage();
      } else if (language === 'prolog') {
        languageExtensions = prologLanguage();
      } else if (language === 'datalog') {
        languageExtensions = datalogLanguage();
      } else {
        languageExtensions = [javascript()];
      }
    } catch (error) {
      console.error('Error loading language extensions:', error);
      languageExtensions = [javascript()];
    }
    
    const baseExtensions: Extension[] = [
      ...languageExtensions,
      ...(config.showLineNumbers ? [lineNumbers()] : []),
      ...(config.theme === 'dark' ? [oneDark] : []),
      keymap.of(defaultKeymap as any[]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readOnly) {
          const newContent = update.state.doc.toString();
          onContentChange(newContent);
        }
      }),
      EditorView.theme({
        '&': {
          height: height,
          fontSize: `${config.fontSize}px`
        },
        '.cm-scroller': {
          overflow: 'auto'
        },
        '.cm-content': {
          padding: '12px'
        }
      }),
      EditorState.readOnly.of(readOnly)
    ];

    const startState = EditorState.create({
      doc: content,
      extensions: baseExtensions
    });

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [language, config.theme, config.fontSize, config.showLineNumbers, readOnly, height]);

  // Update content when prop changes externally
  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content
        }
      });
      viewRef.current.dispatch(transaction);
    }
  }, [content]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {language === 'markdown' ? 'Markdown Editor' : 
             language === 'canvasl' ? 'CanvasL Editor' : 
             language === 'prolog' ? 'Prolog Editor' :
             language === 'datalog' ? 'Datalog Editor' :
             'JavaScript Editor'}
          </span>
        </div>
        <span className="text-xs text-gray-500">CodeMirror 6</span>
      </div>
      <div className="flex-1 overflow-hidden" ref={editorRef} />
    </div>
  );
};
