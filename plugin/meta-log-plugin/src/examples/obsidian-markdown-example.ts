/**
 * Example Obsidian plugin demonstrating markdown syntax rendering
 */

import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';
import { BaseMetaLogView } from '../views/base-view.js';
import { MarkdownView } from '../views/markdown-view.js';

/**
 * Example view that uses Obsidian markdown syntax
 */
class DocumentationView extends BaseMetaLogView {
  getViewType(): string {
    return 'meta-log-documentation-view';
  }

  getDisplayText(): string {
    return 'Meta-Log Documentation';
  }

  getIcon(): string {
    return 'book';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);

    // Render documentation with Obsidian syntax
    const documentation = `
# Meta-Log Documentation

Welcome to the Meta-Log system! This view demonstrates Obsidian markdown syntax.

## Quick Links

- [[meta-log-query-view|Query View]]
- [[meta-log-settings|Settings]]
- [[documentation|Full Documentation]]

## Features

> [!tip]
> Use ProLog queries to explore your canvas data

### Supported Queries

\`\`\`prolog
(node ?Id ?Type)
(edge ?Id ?From ?To)
(inherits ?X ?Y)
\`\`\`

## Examples

### Example 1: Find All Nodes

\`\`\`typescript
const results = await db.prologQuery('(node ?Id ?Type)');
\`\`\`

### Example 2: Find Inheritance

\`\`\`typescript
const inheritance = await db.datalogQuery('(inherits ?X ?Y)');
\`\`\`

## Tags

This documentation covers: #meta-log #prolog #datalog #r5rs

## Math Examples

Inline math: $\\lambda x. x$

Display math:
$$
\\sum_{i=0}^{n} 2^i = 2^{n+1} - 1
$$

## Task List

- [x] Implement ProLog engine
- [x] Implement DataLog engine
- [x] Add markdown rendering
- [ ] Add more examples
- [ ] Create tutorials

## Related Files

![[automaton-kernel.jsonl]]

## Block Reference

See the implementation details ^implementation-block
`;

    await this.renderMarkdown(documentation, content);
  }
}

/**
 * Example plugin using markdown rendering
 */
export default class ExampleMarkdownPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();

    // Register markdown view
    this.registerMetaLogView({
      viewType: 'meta-log-markdown-view',
      displayText: 'Meta-Log Markdown',
      icon: 'file-text',
      viewCreator: (leaf, plugin) => new MarkdownView(plugin, leaf)
    });

    // Register documentation view
    this.registerMetaLogView({
      viewType: 'meta-log-documentation-view',
      displayText: 'Documentation',
      icon: 'book',
      viewCreator: (leaf, plugin) => new DocumentationView(plugin, leaf)
    });

    // Add ribbon icons
    this.addRibbonIcon('file-text', 'Open Markdown View', () => {
      this.activateView('meta-log-markdown-view');
    });

    this.addRibbonIcon('book', 'Open Documentation', () => {
      this.activateView('meta-log-documentation-view');
    });

    // Add commands
    this.addCommand({
      id: 'open-markdown-view',
      name: 'Open Markdown View',
      callback: () => {
        this.activateView('meta-log-markdown-view');
      }
    });

    this.addCommand({
      id: 'open-documentation',
      name: 'Open Documentation',
      callback: () => {
        this.activateView('meta-log-documentation-view');
      }
    });
  }
}
