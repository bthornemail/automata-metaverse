/**
 * Obsidian plugin type definitions
 */

declare module 'obsidian' {
  export interface Plugin {
    app: App;
    manifest: PluginManifest;
    onload?(): void | Promise<void>;
    onunload?(): void | Promise<void>;
    registerView(viewType: string, viewCreator: (leaf: WorkspaceLeaf) => ItemView): void;
    addRibbonIcon(icon: string, tooltip: string, callback: () => void): HTMLElement;
    addCommand(command: Command): void;
    addSettingTab(tab: SettingTab): void;
    addStatusBarItem(): HTMLElement;
  }

  export interface App {
    vault: Vault;
    workspace: Workspace;
  }

  export interface Workspace {
    onLayoutReady(callback: () => void): void;
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    getLeaf(viewType: string): WorkspaceLeaf | null;
    revealLeaf(leaf: WorkspaceLeaf): void;
  }

  export interface WorkspaceLeaf {
    view: ItemView;
    setViewState(state: ViewState): void;
  }

  export interface ViewState {
    type: string;
    state?: any;
  }

  export interface ItemView {
    containerEl: HTMLElement;
    getViewType(): string;
    getDisplayText(): string;
    getIcon(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
  }

  export interface Vault {
    configDir: string;
    adapter: FileSystemAdapter;
  }

  export interface FileSystemAdapter {
    read(path: string): Promise<string>;
    write(path: string, data: string): Promise<void>;
  }

  export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
  }

  export interface Command {
    id: string;
    name: string;
    callback: () => void;
    hotkeys?: Hotkey[];
  }

  export interface Hotkey {
    modifiers: string[];
    key: string;
  }

  export interface SettingTab {
    app: App;
    plugin: Plugin;
  }
}
