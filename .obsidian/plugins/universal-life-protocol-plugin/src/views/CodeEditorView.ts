import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { foldGutter, foldKeymap } from '@codemirror/fold';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
// import { defaultHighlightStyle } from '@codemirror/highlight'; // Not used currently
import { history, defaultKeymap as historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { markdownWithFrontMatter } from '../extensions/markdown-frontmatter';
import { canvaslLanguage } from '../extensions/canvasl-language';
import { FilePickerModal } from '../modals/FilePickerModal';
import { NewFileModal, NewFileOptions } from '../modals/NewFileModal';
import UniversalLifeProtocolPlugin from '../../main';

export const CODE_EDITOR_VIEW_TYPE = 'code-editor-view';

export type Language = 'javascript' | 'markdown' | 'canvasl';

export interface CodeEditorSettings {
  defaultLanguage: Language;
  fontSize: number;
  theme: 'dark' | 'light';
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
}

const DEFAULT_SETTINGS: CodeEditorSettings = {
  defaultLanguage: 'javascript',
  fontSize: 14,
  theme: 'dark',
  showLineNumbers: true,
  wordWrap: false,
  tabSize: 2,
};

export class CodeEditorView extends ItemView {
  plugin: UniversalLifeProtocolPlugin;
  editorView: EditorView | null = null;
  currentFile: TFile | null = null;
  currentLanguage: Language = 'javascript';
  settings: CodeEditorSettings = DEFAULT_SETTINGS;
  isDirty: boolean = false;

  getViewType(): string {
    return CODE_EDITOR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Code Editor';
  }

  getIcon(): string {
    return 'code';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('code-editor-view-container');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    // Create toolbar
    const toolbar = container.createEl('div', { cls: 'code-editor-toolbar' });
    
    // Language selector
    const langSelect = toolbar.createEl('select', { cls: 'code-editor-lang-select' });
    langSelect.createEl('option', { text: 'JavaScript', value: 'javascript' });
    langSelect.createEl('option', { text: 'Markdown', value: 'markdown' });
    langSelect.createEl('option', { text: 'CanvasL', value: 'canvasl' });
    langSelect.value = this.currentLanguage;
    langSelect.onchange = (e) => {
      const target = e.target as HTMLSelectElement;
      this.setLanguage(target.value as Language);
    };

    // File operations buttons
    const buttonGroup = toolbar.createEl('div', { cls: 'code-editor-buttons' });
    
    const openBtn = buttonGroup.createEl('button', { text: 'Open File', cls: 'mod-cta' });
    openBtn.onclick = () => this.openFile();

    const saveBtn = buttonGroup.createEl('button', { text: 'Save', cls: 'mod-cta' });
    saveBtn.onclick = () => this.saveFile();

    const newBtn = buttonGroup.createEl('button', { text: 'New' });
    newBtn.onclick = () => this.newFile();

    // Create editor container
    const editorContainer = container.createEl('div', { cls: 'code-editor-container' });
    editorContainer.style.flex = '1';
    editorContainer.style.overflow = 'hidden';
    
    // Initialize CodeMirror editor
    await this.initializeEditor(editorContainer);
  }

  async onClose(): Promise<void> {
    if (this.isDirty && this.currentFile) {
      const shouldSave = confirm('You have unsaved changes. Do you want to save?');
      if (shouldSave) {
        await this.saveFile();
      }
    }
    
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }

  private async initializeEditor(container: HTMLElement): Promise<void> {
    const extensions: any[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...searchKeymap,
        ...lintKeymap,
        {
          key: 'Mod-s',
          run: () => {
            this.saveFile();
            return true;
          },
        },
      ] as any) as any,
    ];

    // Add language-specific extensions
    const languageExtensions = this.getLanguageExtensions(this.currentLanguage);
    extensions.push(...languageExtensions);

    // Add theme
    if (this.settings.theme === 'dark') {
      extensions.push(oneDark);
    }

    // Add base theme for Obsidian integration
    extensions.push(
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: `${this.settings.fontSize}px`,
        },
        '.cm-content': {
          padding: '10px',
          minHeight: '100%',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-scroller': {
          fontFamily: 'var(--font-monospace)',
          overflow: 'auto',
        },
        '.cm-editor': {
          height: '100%',
        },
      })
    );

    const state = EditorState.create({
      doc: this.getInitialContent(),
      extensions,
    });

    this.editorView = new EditorView({
      state,
      parent: container,
    });

    // Focus the editor
    this.editorView.focus();
  }

  private getLanguageExtensions(language: Language): any[] {
    switch (language) {
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

  private getInitialContent(): string {
    switch (this.currentLanguage) {
      case 'javascript':
        return `// Welcome to Code Editor
// Start typing your JavaScript code here...

function example() {
  return 'Hello, World!';
}

console.log(example());`;
      case 'markdown':
        return `---
title: "New Document"
description: "Document description"
tags: []
---

# New Document

Start writing your markdown content here...`;
      case 'canvasl':
        return `{"id":"example-node","type":"node","x":0,"y":0,"text":"Example Node"}
{"id":"example-edge","type":"vertical","from":"example-node","to":"example-node"}`;
      default:
        return '';
    }
  }

  private setLanguage(language: Language): void {
    if (language === this.currentLanguage) return;

    this.currentLanguage = language;
    
    if (this.editorView) {
      const content = this.editorView.state.doc.toString();
      const languageExtensions = this.getLanguageExtensions(language);
      
      // Rebuild editor with new language
      const extensions: any[] = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...searchKeymap,
        ...lintKeymap,
        {
          key: 'Mod-s',
          run: () => {
            this.saveFile();
            return true;
          },
        },
      ] as any),
        ...languageExtensions,
      ];

      if (this.settings.theme === 'dark') {
        extensions.push(oneDark);
      }

      extensions.push(
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: `${this.settings.fontSize}px`,
          },
          '.cm-content': {
            padding: '10px',
            minHeight: '100%',
          },
          '.cm-focused': {
            outline: 'none',
          },
          '.cm-scroller': {
            fontFamily: 'var(--font-monospace)',
          },
        })
      );

      const state = EditorState.create({
        doc: content,
        extensions,
      });

      this.editorView.setState(state);
    }
  }

  private async openFile(): Promise<void> {
    const modal = new FilePickerModal(this.plugin.app, async (file: TFile) => {
      await this.loadFile(file);
    });
    modal.open();
  }

  private async loadFile(file: TFile): Promise<void> {
    try {
      const content = await this.plugin.app.vault.read(file);
      this.currentFile = file;

      // Detect language from file extension
      const ext = file.extension.toLowerCase();
      if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx' || ext === 'json') {
        this.setLanguage('javascript');
      } else if (ext === 'md' || ext === 'markdown') {
        this.setLanguage('markdown');
      } else if (ext === 'canvasl' || ext === 'jsonl') {
        this.setLanguage('canvasl');
      } else {
        // Default to JavaScript for unknown types
        this.setLanguage('javascript');
      }
      
      // Update language selector in toolbar
      const langSelect = this.containerEl.querySelector('.code-editor-lang-select') as HTMLSelectElement;
      if (langSelect) {
        langSelect.value = this.currentLanguage;
      }

      // Update editor content
      if (this.editorView) {
        const transaction = this.editorView.state.update({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: content,
          },
        });
        this.editorView.dispatch(transaction);
      }

      this.isDirty = false;
      new Notice(`Opened: ${file.name}`);
    } catch (error) {
      new Notice(`Error opening file: ${error.message}`);
    }
  }

  private async saveFile(): Promise<void> {
    if (!this.currentFile) {
      // Show new file modal
      const modal = new NewFileModal(this.plugin.app, async (options: NewFileOptions) => {
        try {
          const content = this.editorView?.state.doc.toString() || '';
          const filePath = options.folder 
            ? `${options.folder}/${options.fileName}`
            : options.fileName;
          
          const file = await this.plugin.app.vault.create(filePath, content);
          this.currentFile = file;
          this.setLanguage(options.language);
          this.isDirty = false;
          new Notice(`Saved: ${file.name}`);
        } catch (error: any) {
          new Notice(`Error saving file: ${error.message}`);
        }
      });
      modal.open();
      return;
    }

    try {
      const content = this.editorView?.state.doc.toString() || '';
      await this.plugin.app.vault.modify(this.currentFile, content);
      this.isDirty = false;
      new Notice(`Saved: ${this.currentFile.name}`);
    } catch (error: any) {
      new Notice(`Error saving file: ${error.message}`);
    }
  }

  private newFile(): void {
    const modal = new NewFileModal(this.plugin.app, async (options: NewFileOptions) => {
      this.currentFile = null;
      this.isDirty = false;
      this.setLanguage(options.language);
      
      if (this.editorView) {
        const content = this.getInitialContent();
        const transaction = this.editorView.state.update({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: content,
          },
        });
        this.editorView.dispatch(transaction);
      }
    });
    modal.open();
  }

  getEditorContent(): string {
    return this.editorView?.state.doc.toString() || '';
  }

  setEditorContent(content: string): void {
    if (this.editorView) {
      const transaction = this.editorView.state.update({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: content,
        },
      });
      this.editorView.dispatch(transaction);
    }
  }
}
