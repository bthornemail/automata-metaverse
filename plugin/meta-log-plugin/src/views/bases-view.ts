/**
 * Example view demonstrating Obsidian bases integration
 */

import { BaseMetaLogView } from './base-view.js';
import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';
import { ObsidianBasesParser, BaseEmbedOptions } from './bases-parser.js';
import { ObsidianMarkdownRenderer } from './markdown-renderer.js';

/**
 * View that demonstrates Obsidian bases usage
 */
export class BasesView extends BaseMetaLogView {
  private basesParser: ObsidianBasesParser;
  private renderer: ObsidianMarkdownRenderer;
  private contentEl: HTMLElement | null = null;
  private basePathInput: HTMLInputElement | null = null;

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any) {
    super(plugin, leaf);
    this.basesParser = new ObsidianBasesParser(plugin);
    this.renderer = new ObsidianMarkdownRenderer(plugin);
  }

  getViewType(): string {
    return 'meta-log-bases-view';
  }

  getDisplayText(): string {
    return 'Meta-Log Bases';
  }

  getIcon(): string {
    return 'table';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const toolbar = this.createToolbar(container);
    
    // Base path input
    this.basePathInput = this.createInput(toolbar, 'Base file path', {
      placeholder: 'path/to/base.base or path/to/file.csv',
      cls: 'base-path-input'
    });

    // Load base button
    this.createButton(toolbar, 'Load Base', () => this.loadBase(), {
      cls: 'mod-cta'
    });

    // Convert to base button
    this.createButton(toolbar, 'Convert File to Base', () => this.convertToBase(), {
      cls: 'mod-cta'
    });

    // Convert base to JSONL/CanvasL button
    this.createButton(toolbar, 'Convert Base to JSONL', () => this.convertBaseToJSONL(), {
      cls: 'mod-cta'
    });

    // Round-trip test button
    this.createButton(toolbar, 'Round-Trip Test', () => this.roundTripTest(), {
      cls: 'mod-cta'
    });

    // Refresh button
    this.createButton(toolbar, 'Refresh', () => this.refresh(), {
      cls: 'mod-cta'
    });

    this.contentEl = this.createContent(container);
    await this.refresh();
  }

  /**
   * Create input element
   */
  private createInput(
    container: HTMLElement,
    label: string,
    options: {
      placeholder?: string;
      value?: string;
      cls?: string;
    } = {}
  ): HTMLInputElement {
    const labelEl = container.createEl('label', { text: label });
    const input = container.createEl('input', {
      type: 'text',
      placeholder: options.placeholder,
      value: options.value || '',
      cls: options.cls || ''
    });
    return input;
  }

  /**
   * Load and display base
   */
  async loadBase(): Promise<void> {
    if (!this.contentEl || !this.basePathInput) return;

    const basePath = this.basePathInput.value.trim();
    if (!basePath) {
      this.showNotice('Please enter a base file path', 3000);
      return;
    }

    try {
      const base = await this.basesParser.parseBase(basePath);
      
      const markdown = `
# Base: ${basePath}

## Schema

**Version**: ${base.schema.version}

### Fields

${base.schema.fields.map(field => `
- **${field.name}** (${field.type})
  ${field.options ? `Options: ${field.options.join(', ')}` : ''}
  ${field.formula ? `Formula: ${field.formula}` : ''}
`).join('\n')}

## Data

**Rows**: ${base.data.length}

${this.generateBaseTableMarkdown(base)}
`;

      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
    } catch (error) {
      this.contentEl.textContent = `Error loading base: ${error}`;
      this.showNotice(`Error: ${error}`, 5000);
    }
  }

  /**
   * Convert file to base
   */
  async convertToBase(): Promise<void> {
    if (!this.contentEl || !this.basePathInput) return;

    const filePath = this.basePathInput.value.trim();
    if (!filePath) {
      this.showNotice('Please enter a file path to convert', 3000);
      return;
    }

    try {
      const base = await this.basesParser.convertToBase(filePath);
      
      const markdown = `
# Converted Base: ${filePath}

## Conversion Successful

**Rows**: ${base.data.length}
**Fields**: ${base.schema.fields.length}

### Fields

${base.schema.fields.map(field => `- **${field.name}** (${field.type})`).join('\n')}

## Preview

${this.generateBaseTableMarkdown(base)}
`;

      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
      
      this.showNotice('File converted to base successfully', 3000);
    } catch (error) {
      this.contentEl.textContent = `Error converting file: ${error}`;
      this.showNotice(`Error: ${error}`, 5000);
    }
  }

  /**
   * Generate markdown table from base
   */
  private generateBaseTableMarkdown(base: any): string {
    if (base.data.length === 0) {
      return '*No data*';
    }

    const fields = base.schema.fields.map((f: any) => f.name);
    const header = `| ${fields.join(' | ')} |`;
    const separator = `| ${fields.map(() => '---').join(' | ')} |`;
    const rows = base.data.slice(0, 10).map((row: any) => {
      return `| ${fields.map(field => String(row[field] || '')).replace(/\|/g, '\\|')} |`;
    }).join('\n');

    const moreRows = base.data.length > 10 ? `\n\n*... and ${base.data.length - 10} more rows*` : '';

    return `${header}\n${separator}\n${rows}${moreRows}`;
  }

  /**
   * Convert base to JSONL/CanvasL
   */
  async convertBaseToJSONL(): Promise<void> {
    if (!this.contentEl || !this.basePathInput) return;

    const basePath = this.basePathInput.value.trim();
    if (!basePath) {
      this.showNotice('Please enter a base file path', 3000);
      return;
    }

    try {
      const base = await this.basesParser.parseBase(basePath);
      const format = basePath.endsWith('.canvasl') ? 'canvasl' : 'jsonl';
      const jsonl = await this.basesParser.convertBaseToJSONL(base, { format });
      
      const markdown = `
# Converted Base to ${format.toUpperCase()}

## Conversion Successful

**Format**: ${format}
**Rows**: ${base.data.length}
**Fields**: ${base.schema.fields.length}

### Preview

\`\`\`${format}
${jsonl.split('\n').slice(0, 10).join('\n')}
${jsonl.split('\n').length > 10 ? `\n... and ${jsonl.split('\n').length - 10} more lines` : ''}
\`\`\`

> [!success]
> Base converted to ${format.toUpperCase()} successfully
`;

      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
      
      this.showNotice(`Base converted to ${format.toUpperCase()} successfully`, 3000);
    } catch (error) {
      this.contentEl.textContent = `Error converting base: ${error}`;
      this.showNotice(`Error: ${error}`, 5000);
    }
  }

  /**
   * Round-trip conversion test
   */
  async roundTripTest(): Promise<void> {
    if (!this.contentEl || !this.basePathInput) return;

    const filePath = this.basePathInput.value.trim();
    if (!filePath) {
      this.showNotice('Please enter a JSONL/CanvasL file path', 3000);
      return;
    }

    const isJSONL = filePath.endsWith('.jsonl') || filePath.endsWith('.canvasl');
    if (!isJSONL) {
      this.showNotice('Please enter a JSONL or CanvasL file path', 3000);
      return;
    }

    try {
      const result = await this.basesParser.roundTripJSONL(filePath);
      
      const markdown = `
# Round-Trip Conversion Test

## Results

**File**: ${filePath}
**Format**: ${filePath.endsWith('.canvasl') ? 'CanvasL' : 'JSONL'}
**Lossless**: ${result.lossless ? '✅ Yes' : '⚠️ No'}

### Statistics

- **Original lines**: ${result.original.split('\\n').length}
- **Base rows**: ${result.base.data.length}
- **Converted lines**: ${result.converted.split('\\n').length}
- **Base fields**: ${result.base.schema.fields.length}

### Base Schema

${result.base.schema.fields.map(f => `- **${f.name}** (${f.type})`).join('\\n')}

### Preview

**Original (first 5 lines)**:
\`\`\`jsonl
${result.original.split('\\n').slice(0, 5).join('\\n')}
\`\`\`

**Converted (first 5 lines)**:
\`\`\`jsonl
${result.converted.split('\\n').slice(0, 5).join('\\n')}
\`\`\`

${result.lossless 
  ? '> [!success]\\n> Round-trip conversion is lossless!' 
  : '> [!warning]\\n> Some data may have been lost during conversion'}
`;

      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
      
      this.showNotice(
        result.lossless 
          ? 'Round-trip test passed: Lossless conversion!' 
          : 'Round-trip test: Some data loss detected',
        5000
      );
    } catch (error) {
      this.contentEl.textContent = `Error in round-trip test: ${error}`;
      this.showNotice(`Error: ${error}`, 5000);
    }
  }

  /**
   * Refresh view
   */
  async refresh(): Promise<void> {
    if (!this.contentEl) return;

    const markdown = `
# Obsidian Bases Integration

## Overview

This view demonstrates Obsidian bases functionality:

- **Parse bases** from `.base` files
- **Convert files** to base format (CSV, JSON, Markdown tables, TSV)
- **Embed bases** in markdown
- **Filter and sort** base data

## Supported File Types

The following file types can be converted to bases:

- **CSV** (`.csv`) - Comma-separated values
- **JSON** (`.json`) - JSON objects or arrays
- **Markdown Tables** (`.md`) - Markdown table syntax
- **TSV** (`.tsv`) - Tab-separated values
- **Base Files** (`.base`, `.base.json`, `.base.md`) - Native base format

## Usage

1. Enter a file path in the input field
2. Click "Load Base" to parse an existing base
3. Click "Convert File to Base" to convert a file to base format
4. Click "Convert Base to JSONL" to convert base back to JSONL/CanvasL
5. Click "Round-Trip Test" to test data integrity (JSONL/CanvasL only)

## Base Embed Syntax

In markdown, you can embed bases:

\`\`\`markdown
![[my-base.base]]
![[my-base.base|limit=10]]
![[my-base.base|fields=name,date|sort=date:desc|filter=status:equals:active]]
\`\`\`

## Examples

### Load Base

Enter: \`examples/my-base.base\`
Click: "Load Base"

### Convert CSV

Enter: \`data/export.csv\`
Click: "Convert File to Base"
`;

    this.contentEl.empty();
    await this.renderer.renderMarkdown(markdown, this.contentEl);
  }
}
