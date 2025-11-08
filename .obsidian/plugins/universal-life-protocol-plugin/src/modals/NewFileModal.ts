import { App, Modal, Setting, TFile } from 'obsidian';

export interface NewFileOptions {
  fileName: string;
  language: 'javascript' | 'markdown' | 'canvasl';
  folder?: string;
}

export class NewFileModal extends Modal {
  private onSubmit: (options: NewFileOptions) => void;
  private fileName: string = '';
  private language: 'javascript' | 'markdown' | 'canvasl' = 'javascript';
  private folder: string = '';

  constructor(app: App, onSubmit: (options: NewFileOptions) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('new-file-modal');

    contentEl.createEl('h2', { text: 'Create New File' });

    new Setting(contentEl)
      .setName('File Name')
      .setDesc('Enter the file name with extension')
      .addText(text => {
        text
          .setPlaceholder('example.js')
          .setValue(this.fileName)
          .onChange(value => {
            this.fileName = value;
            // Auto-detect language from extension
            const ext = value.split('.').pop()?.toLowerCase();
            if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
              this.language = 'javascript';
            } else if (ext === 'md' || ext === 'markdown') {
              this.language = 'markdown';
            } else if (ext === 'jsonl' || ext === 'canvasl') {
              this.language = 'canvasl';
            }
            // Update language dropdown if it exists
            const langSelect = contentEl.querySelector('.language-select') as HTMLSelectElement;
            if (langSelect) {
              langSelect.value = this.language;
            }
          });
      });

    new Setting(contentEl)
      .setName('Language')
      .setDesc('Select the file language')
      .addDropdown(dropdown => {
        dropdown
          .addOption('javascript', 'JavaScript')
          .addOption('markdown', 'Markdown')
          .addOption('canvasl', 'CanvasL')
          .setValue(this.language)
          .onChange(value => {
            this.language = value as 'javascript' | 'markdown' | 'canvasl';
          });
        dropdown.selectEl.addClass('language-select');
      });

    new Setting(contentEl)
      .setName('Folder (Optional)')
      .setDesc('Folder path where the file will be created')
      .addText(text => {
        text
          .setPlaceholder('folder/subfolder')
          .setValue(this.folder)
          .onChange(value => {
            this.folder = value;
          });
      });

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('Create')
          .setCta()
          .onClick(() => {
            if (this.fileName.trim()) {
              this.onSubmit({
                fileName: this.fileName.trim(),
                language: this.language,
                folder: this.folder.trim() || undefined,
              });
              this.close();
            }
          });
      })
      .addButton(button => {
        button
          .setButtonText('Cancel')
          .onClick(() => {
            this.close();
          });
      });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
