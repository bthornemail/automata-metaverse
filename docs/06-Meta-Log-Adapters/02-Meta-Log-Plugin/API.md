---
id: meta-log-plugin-api
title: "Meta-Log Plugin API Reference"
level: practical
type: reference
tags: [meta-log-plugin, api-reference, plugin-infrastructure, opencode, obsidian]
keywords: [meta-log-plugin-api, opencode-adapter-api, obsidian-adapter-api, lifecycle-api, hooks-api]
prerequisites: [meta-log-plugin-readme, meta-log-plugin-setup-guide]
enables: []
related: [meta-log-db-api, opencode-readme]
readingTime: 45
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [meta-log-db]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Plugin API Reference

Complete API reference for the `meta-log-plugin` package.

## BaseMetaLogPlugin Class

### Constructor

```typescript
new BaseMetaLogPlugin(config: PluginConfig)
```

**Parameters:**
- `config.db?: MetaLogDb` - MetaLogDb instance (optional, creates new if not provided)
- `config.canvasPath?: string` - Path to canvas file
- `config.enableProlog?: boolean` - Enable ProLog (default: true)
- `config.enableDatalog?: boolean` - Enable DataLog (default: true)

### Lifecycle Methods (Abstract)

These MUST be implemented by adapters:

```typescript
abstract onLoad(): Promise<void>;
abstract onUnload(): Promise<void>;
abstract onEnable(): Promise<void>;
abstract onDisable(): Promise<void>;
```

### Plugin Hooks

```typescript
beforeQuery(query: string): Promise<string>;
afterQuery(query: string, results: any): Promise<any>;
onCanvasUpdate(canvasPath: string): Promise<void>;
onFactExtraction(facts: any[]): Promise<void>;
```

### Utility Methods

```typescript
getDb(): MetaLogDb;
getConfig(): PluginConfig;
updateConfig(updates: Partial<PluginConfig>): Promise<void>;
```

### Event Methods

```typescript
on(event: string, handler: Function): void;
off(event: string, handler: Function): void;
emit(event: string, ...args: any[]): void;
```

## OpenCodeMetaLogPlugin Class

Extends `BaseMetaLogPlugin` for OpenCode integration.

```typescript
class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  // Implements abstract lifecycle methods
  async onLoad(): Promise<void>;
  async onUnload(): Promise<void>;
  async onEnable(): Promise<void>;
  async onDisable(): Promise<void>;
}
```

## ObsidianMetaLogPlugin Class

Extends `BaseMetaLogPlugin` for Obsidian integration.

```typescript
class ObsidianMetaLogPlugin extends BaseMetaLogPlugin implements Plugin {
  app: any;  // Obsidian App instance
  manifest: any;  // Plugin manifest

  constructor(app: any, manifest: any, config: PluginConfig);

  // Implements abstract lifecycle methods
  async onLoad(): Promise<void>;
  async onUnload(): Promise<void>;
  async onEnable(): Promise<void>;
  async onDisable(): Promise<void>;

  // Obsidian-specific methods
  async loadSettings(): Promise<void>;
  async saveSettings(): Promise<void>;

  // View management
  registerMetaLogView(registration: ViewRegistration): void;
  async activateView(viewType: string): Promise<void>;
  getRegisteredViews(): ViewRegistration[];

  // Obsidian UI methods
  addRibbonIcon(icon: string, tooltip: string, callback: () => void): HTMLElement | null;
  addCommand(command: { id: string; name: string; callback: () => void }): void;
}
```

## BaseMetaLogView Class

Base class for creating Obsidian views.

```typescript
abstract class BaseMetaLogView {
  protected plugin: ObsidianMetaLogPlugin;
  protected containerEl: HTMLElement;
  protected leaf: any;

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any);

  // Abstract methods (must implement)
  abstract getViewType(): string;
  abstract getDisplayText(): string;
  abstract getIcon(): string;
  abstract onOpen(): Promise<void>;

  // Optional override
  async onClose(): Promise<void>;

  // Helper methods
  protected initializeContainer(): HTMLElement;
  protected createContainer(): HTMLElement;
  protected createToolbar(container: HTMLElement): HTMLElement;
  protected createContent(container: HTMLElement): HTMLElement;
  protected createButton(container: HTMLElement, text: string, onClick: () => void, options?: {...}): HTMLElement;
  
  // Access methods
  getPlugin(): ObsidianMetaLogPlugin;
  getDb(): MetaLogDb;
  emit(event: string, ...args: any[]): void;
  showNotice(message: string, duration?: number): void;
}
```

## ViewRegistration Interface

```typescript
interface ViewRegistration {
  viewType: string;
  displayText: string;
  icon: string;
  viewCreator: (leaf: any, plugin: ObsidianMetaLogPlugin) => BaseMetaLogView;
}
```

## ObsidianMarkdownRenderer Class

Provides Obsidian markdown syntax rendering.

```typescript
class ObsidianMarkdownRenderer {
  constructor(plugin: ObsidianMetaLogPlugin);

  // Render full markdown content
  async renderMarkdown(content: string, container: HTMLElement, sourcePath?: string): Promise<void>;

  // Render specific elements
  renderWikilink(link: string, container: HTMLElement): HTMLElement;
  async renderEmbed(file: string, container: HTMLElement): Promise<void>;
  renderCallout(type: string, content: string, container: HTMLElement): HTMLElement;
  renderTag(tag: string, container: HTMLElement): HTMLElement;
  renderBlockReference(ref: string, container: HTMLElement): HTMLElement;
  renderMath(formula: string, display: boolean, container: HTMLElement): HTMLElement;
  renderCodeBlock(code: string, language: string, container: HTMLElement): HTMLElement;
  renderTaskItem(text: string, checked: boolean, container: HTMLElement): HTMLElement;
}
```

**Supported Syntax**:
- Wikilinks: `[[link]]`
- Embeds: `![[file]]`
- Callouts: `> [!note]`
- Tags: `#tag`
- Block References: `^block-ref`
- Math: `$formula$` and `$$formula$$`
- Code Blocks: With syntax highlighting
- Task Lists: `- [ ]` and `- [x]`

**Reference**: See [Obsidian Markdown Syntax Guide](./OBSIDIAN_MARKDOWN_SYNTAX.md)

## ObsidianFunctions Class

Provides access to Obsidian's function system.

```typescript
class ObsidianFunctions {
  constructor(plugin: ObsidianMetaLogPlugin);

  // Execute Obsidian function
  async execute(functionName: string, ...args: any[]): Promise<any>;

  // File operations
  async getFile(path: string): Promise<any>;
  async readFile(path: string): Promise<string>;
  async writeFile(path: string, content: string): Promise<void>;
  async listFiles(path: string): Promise<string[]>;

  // Date/time
  now(): Date;
  formatDate(date: Date, format?: string): string;
  parseDate(dateString: string): Date;

  // String operations
  join(array: any[], separator?: string): string;
  split(str: string, separator: string): string[];
  replace(str: string, search: string, replace: string): string;
  substring(str: string, start: number, end?: number): string;

  // Array operations
  map<T, U>(array: T[], fn: (item: T, index: number) => U): U[];
  filter<T>(array: T[], fn: (item: T, index: number) => boolean): T[];
  reduce<T, U>(array: T[], fn: (acc: U, item: T, index: number) => U, initial: U): U;
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[];

  // Math operations
  sum(numbers: number[]): number;
  average(numbers: number[]): number;
  min(numbers: number[]): number;
  max(numbers: number[]): number;
  round(num: number, decimals?: number): number;

  // Meta-Log queries
  async queryMetaLog(query: string, queryType?: 'prolog' | 'datalog' | 'sparql'): Promise<any>;
  extractFacts(): any[];
  async loadCanvas(path: string): Promise<void>;
  getFactsCount(): number;

  // Custom functions
  registerFunction(name: string, fn: (...args: any[]) => any): void;
  callFunction(name: string, ...args: any[]): any;
}
```

**Reference**: See [Obsidian Functions Guide](./OBSIDIAN_FUNCTIONS.md)

## ObsidianBasesParser Class

Provides parsing and embedding support for Obsidian Bases.

```typescript
class ObsidianBasesParser {
  constructor(plugin: ObsidianMetaLogPlugin);

  // Parse base file
  async parseBase(filePath: string): Promise<BaseFile>;

  // Convert file to base format (supports JSONL, CanvasL, CSV, JSON, MD, TSV)
  async convertToBase(filePath: string, options?: {...}): Promise<BaseFile>;

  // Convert base format back to JSONL
  async convertBaseToJSONL(base: BaseFile, options?: { format?: 'jsonl' | 'canvasl', includeMetadata?: boolean }): Promise<string>;

  // Convert base format back to CanvasL
  async convertBaseToCanvasL(base: BaseFile, options?: { includeMetadata?: boolean }): Promise<string>;

  // Round-trip conversion test (JSONL → Base → JSONL)
  async roundTripJSONL(filePath: string): Promise<{ original: string, base: BaseFile, converted: string, lossless: boolean }>;

  // Create base embed HTML
  async createBaseEmbed(basePath: string, options?: BaseEmbedOptions): Promise<string>;

  // Render base embed in container
  async renderBaseEmbed(basePath: string, container: HTMLElement, options?: BaseEmbedOptions): Promise<void>;

  // Apply filters
  private applyFilters(rows: BaseRow[], filters: BaseFilter[]): BaseRow[];

  // Apply sort
  private applySort(rows: BaseRow[], sorts: BaseSort[]): BaseRow[];
}
```

### Base Types

```typescript
interface BaseFile {
  type: 'base';
  version: string;
  schema: {
    version: string;
    fields: BaseField[];
  };
  data: BaseRow[];
}

interface BaseField {
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'multiselect' | 'file' | 'url' | 'email' | 'phone' | 'formula' | 'rollup' | 'relation' | 'created' | 'updated' | 'button';
  options?: any;
  formula?: string;
  relation?: {...};
  rollup?: {...};
}

interface BaseRow {
  id: string;
  [fieldName: string]: any;
}

interface BaseEmbedOptions {
  viewId?: string;
  filters?: BaseFilter[];
  sort?: BaseSort[];
  limit?: number;
  fields?: string[];
}

interface BaseFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'before' | 'after' | 'onOrBefore' | 'onOrAfter';
  value: any;
}

interface BaseSort {
  field: string;
  direction: 'asc' | 'desc';
}
```

**Reference**: See [Obsidian Bases Guide](./OBSIDIAN_BASES.md)

## EventEmitter Class

### Methods

```typescript
on(event: string, handler: Function): void;
off(event: string, handler: Function): void;
emit(event: string, ...args: any[]): void;
```

### Events

- `beforeQuery` - Emitted before query execution
- `afterQuery` - Emitted after query execution
- `canvasUpdate` - Emitted when canvas is updated
- `factExtraction` - Emitted when facts are extracted
- `configUpdate` - Emitted when configuration is updated

## ConfigManager Class

### Constructor

```typescript
new ConfigManager(configPath?: string)
```

### Methods

```typescript
load(): Promise<any>;
save(config: any): Promise<void>;
```

## Type Definitions

```typescript
interface PluginConfig {
  db?: MetaLogDb;
  canvasPath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
}

interface PluginLifecycle {
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
}

interface PluginHooks {
  beforeQuery(query: string): Promise<string>;
  afterQuery(query: string, results: any): Promise<any>;
  onCanvasUpdate(canvasPath: string): Promise<void>;
  onFactExtraction(facts: any[]): Promise<void>;
}
```

## Usage Examples

### OpenCode Plugin

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl'
});

await plugin.onLoad();

plugin.on('beforeQuery', (query) => {
  console.log('Query:', query);
});

const results = await plugin.getDb().prologQuery('(node ?Id ?Type)');
```

### Obsidian Plugin

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
    
    this.addRibbonIcon('meta-log', 'Meta-Log', () => {
      // Open view
    });
  }
}
```

---

**See Also**: [Meta-Log Plugin README](./README.md)
