/**
 * Example view demonstrating Obsidian markdown syntax rendering
 */

import { BaseMetaLogView } from './base-view.js';
import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';
import { ObsidianMarkdownRenderer } from './markdown-renderer.js';

/**
 * Example view that renders markdown with Obsidian syntax
 */
export class MarkdownView extends BaseMetaLogView {
  private renderer: ObsidianMarkdownRenderer;
  private contentEl: HTMLElement | null = null;

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any) {
    super(plugin, leaf);
    this.renderer = new ObsidianMarkdownRenderer(plugin);
  }

  getViewType(): string {
    return 'meta-log-markdown-view';
  }

  getDisplayText(): string {
    return 'Meta-Log Markdown';
  }

  getIcon(): string {
    return 'file-text';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    this.contentEl = this.createContent(container);

    // Example markdown content with Obsidian syntax
    const markdownContent = `
# Meta-Log Documentation

This view demonstrates Obsidian markdown syntax:

## Wikilinks

- Link to [[another-note]]
- Link with alias: [[another-note|Custom Text]]

## Embeds

![[embedded-file]]

## Callouts

> [!note]
> This is a note callout

> [!warning]
> This is a warning callout

> [!tip]
> This is a tip callout

## Tags

This document has tags: #meta-log #documentation #obsidian

## Code Blocks

\`\`\`typescript
const db = new MetaLogDb();
await db.loadCanvas('canvas.jsonl');
\`\`\`

## Math

Inline math: $E = mc^2$

Display math:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## Task Lists

- [ ] Task 1
- [x] Task 2 (completed)
- [ ] Task 3

## Block References

This references a block ^block-ref

## Query Results

\`\`\`
Query: (node ?Id ?Type)
Results: Found 42 nodes
\`\`\`
`;

    // Render markdown
    await this.renderer.renderMarkdown(markdownContent, this.contentEl);
  }

  /**
   * Update content with new markdown
   */
  async updateContent(markdown: string): Promise<void> {
    if (this.contentEl) {
      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
    }
  }

  /**
   * Render query results as markdown
   */
  async renderQueryResults(query: string, results: any): Promise<void> {
    if (!this.contentEl) return;

    const markdown = `
## Query Results

**Query:** \`${query}\`

**Results:**

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

> [!info]
> Found ${results.bindings?.length || 0} results
`;

    await this.renderer.renderMarkdown(markdown, this.contentEl);
  }
}
