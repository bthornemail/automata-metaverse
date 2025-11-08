---
id: meta-log-plugin-obsidian-markdown-syntax
title: "Obsidian Markdown Syntax Integration"
level: practical
type: guide
tags: [meta-log-plugin, obsidian, markdown, syntax, wikilinks, embeds, callouts]
keywords: [obsidian-markdown, wikilinks, embeds, callouts, markdown-rendering, obsidian-syntax]
prerequisites: [meta-log-plugin-readme, meta-log-plugin-views-guide]
enables: []
related: [obsidian-view-docs, meta-log-plugin-api]
readingTime: 25
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [meta-log-db]
  watchers: []
---

# Obsidian Markdown Syntax Integration

**Guide to using Obsidian's markdown syntax in Meta-Log views.**

## Overview

The Meta-Log plugin provides `ObsidianMarkdownRenderer` for rendering markdown with full Obsidian syntax support, including:

- **Wikilinks**: `[[link]]` and `[[link|alias]]`
- **Embeds**: `![[file]]`
- **Callouts**: `> [!note]`
- **Tags**: `#tag`
- **Block References**: `^block-ref`
- **Math**: `$formula$` and `$$formula$$`
- **Code Blocks**: With syntax highlighting
- **Task Lists**: `- [ ]` and `- [x]`

## ObsidianMarkdownRenderer Class

### Basic Usage

```typescript
import { ObsidianMarkdownRenderer } from 'meta-log-plugin';

const renderer = new ObsidianMarkdownRenderer(plugin);

// Render markdown content
await renderer.renderMarkdown(markdownContent, containerElement);
```

### Methods

#### `renderMarkdown(content, container, sourcePath?)`

Render full markdown content with Obsidian syntax:

```typescript
const markdown = `
# Title

[[link-to-note]]

> [!note]
> Callout content
`;

await renderer.renderMarkdown(markdown, container);
```

#### `renderWikilink(link, container)`

Render a single wikilink:

```typescript
renderer.renderWikilink('my-note', container);
// Creates clickable link that opens in Obsidian
```

#### `renderEmbed(file, container)`

Render an embedded file:

```typescript
await renderer.renderEmbed('my-file.md', container);
// Loads and renders the file content
```

#### `renderCallout(type, content, container)`

Render a callout:

```typescript
renderer.renderCallout('note', 'This is a note', container);
renderer.renderCallout('warning', 'This is a warning', container);
renderer.renderCallout('tip', 'This is a tip', container);
```

#### `renderTag(tag, container)`

Render a tag:

```typescript
renderer.renderTag('meta-log', container);
// Creates clickable tag
```

## Using in Views

### In BaseMetaLogView

The `BaseMetaLogView` class provides helper methods:

```typescript
class MyView extends BaseMetaLogView {
  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);

    // Render markdown using helper method
    await this.renderMarkdown(`
# My View

[[linked-note]]

> [!info]
> Information callout
`, content);
  }
}
```

### Example: Query Results View

```typescript
class QueryResultsView extends BaseMetaLogView {
  async renderResults(query: string, results: any): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);

    const markdown = `
## Query Results

**Query:** \`${query}\`

**Results:**

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

> [!success]
> Found ${results.bindings.length} results

[[related-query]] | [[documentation]]
`;

    await this.renderMarkdown(markdown, content);
  }
}
```

## Supported Syntax

### Wikilinks

```markdown
[[note-name]]
[[note-name|Display Text]]
```

### Embeds

```markdown
![[file.md]]
![[file.md#heading]]
![[file.md^block-ref]]
```

### Callouts

```markdown
> [!note]
> Note content

> [!warning]
> Warning content

> [!tip]
> Tip content

> [!info]
> Info content

> [!success]
> Success content
```

### Tags

```markdown
#tag
#multi-word-tag
```

### Block References

```markdown
^block-ref
```

### Math

```markdown
Inline: $E = mc^2$

Display:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$
```

### Code Blocks

```markdown
\`\`\`typescript
const code = 'here';
\`\`\`
```

### Task Lists

```markdown
- [ ] Incomplete task
- [x] Completed task
```

## Integration Example

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';
import { MarkdownView } from 'meta-log-plugin';

export default class MyPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();

    // Register markdown view
    this.registerMetaLogView({
      viewType: 'markdown-view',
      displayText: 'Markdown View',
      icon: 'file-text',
      viewCreator: (leaf, plugin) => new MarkdownView(plugin, leaf)
    });
  }
}
```

## Reference

- **Obsidian Syntax Docs**: https://help.obsidian.md/bases/syntax
- **ObsidianMarkdownRenderer**: `plugin/meta-log-plugin/src/views/markdown-renderer.ts`
- **MarkdownView Example**: `plugin/meta-log-plugin/src/views/markdown-view.ts`

---

**Last Updated**: 2025-11-08
