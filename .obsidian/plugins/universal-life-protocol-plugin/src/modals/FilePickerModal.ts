import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class FilePickerModal extends FuzzySuggestModal<TFile> {
  private onSelect: (file: TFile) => void;

  constructor(app: App, onSelect: (file: TFile) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  getItems(): TFile[] {
    // Get all files from vault that can be edited
    const allFiles = this.app.vault.getFiles();
    return allFiles.filter(file => {
      const ext = file.extension.toLowerCase();
      return ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx' || 
             ext === 'md' || ext === 'markdown' || 
             ext === 'jsonl' || ext === 'canvasl' ||
             ext === 'json' || ext === 'txt';
    });
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(item);
  }
}
