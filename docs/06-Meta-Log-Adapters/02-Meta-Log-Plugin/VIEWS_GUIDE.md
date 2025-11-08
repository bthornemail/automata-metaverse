---
id: meta-log-plugin-views-guide
title: "Meta-Log Plugin Views Guide"
level: practical
type: guide
tags: [meta-log-plugin, views, obsidian, itemview, base-view]
keywords: [meta-log-plugin-views, obsidian-views, base-view, itemview-integration, view-registration]
prerequisites: [meta-log-plugin-readme, meta-log-plugin-api]
enables: []
related: [meta-log-plugin-api, obsidian-view-docs]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [meta-log-db]
  watchers: []
---

# Meta-Log Plugin Views Guide

**Guide to creating Obsidian views using the Meta-Log plugin infrastructure.**

## Overview

The Meta-Log plugin provides a `BaseMetaLogView` class that simplifies creating Obsidian views. This class provides:

- Common view structure (toolbar, content area)
- Database access via `getDb()`
- Event emission via `emit()`
- Helper methods for creating UI elements
- Integration with Obsidian's ItemView system

## BaseMetaLogView Class

### Abstract Methods

You must implement these methods:

```typescript
abstract getViewType(): string;      // Unique view type identifier
abstract getDisplayText(): string;  // Display name in Obsidian
abstract getIcon(): string;         // Icon name (Obsidian icon set)
abstract onOpen(): Promise<void>;   // Called when view opens
```

### Helper Methods

Available helper methods:

```typescript
// Container creation
createContainer(): HTMLElement;
createToolbar(container: HTMLElement): HTMLElement;
createContent(container: HTMLElement): HTMLElement;

// UI elements
createButton(container: HTMLElement, text: string, onClick: () => void, options?: {...}): HTMLElement;

// Database access
getDb(): MetaLogDb;

// Events
emit(event: string, ...args: any[]): void;

// Notifications
showNotice(message: string, duration?: number): void;
```

## Creating a Custom View

### Step 1: Extend BaseMetaLogView

```typescript
import { BaseMetaLogView } from 'meta-log-plugin';
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

class MyCustomView extends BaseMetaLogView {
  getViewType(): string {
    return 'my-custom-view';
  }

  getDisplayText(): string {
    return 'My Custom View';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);
    
    // Add your content
    content.createEl('h2', { text: 'My Custom View' });
  }
}
```

### Step 2: Register View in Plugin

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';
import { MyCustomView } from './views/MyCustomView';

export default class MyPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    
    // Register view
    this.registerMetaLogView({
      viewType: 'my-custom-view',
      displayText: 'My Custom View',
      icon: 'database',
      viewCreator: (leaf, plugin) => new MyCustomView(plugin, leaf)
    });
    
    // Add ribbon icon
    this.addRibbonIcon('database', 'Open My View', () => {
      this.activateView('my-custom-view');
    });
    
    // Add command
    this.addCommand({
      id: 'open-my-view',
      name: 'Open My Custom View',
      callback: () => {
        this.activateView('my-custom-view');
      }
    });
  }
}
```

## Example: Query View

```typescript
class QueryView extends BaseMetaLogView {
  private queryInput: HTMLInputElement | null = null;
  private resultsEl: HTMLElement | null = null;

  getViewType(): string {
    return 'meta-log-query-view';
  }

  getDisplayText(): string {
    return 'Meta-Log Query';
  }

  getIcon(): string {
    return 'search';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);

    // Query input
    const querySection = content.createEl('div');
    querySection.createEl('label', { text: 'ProLog Query:' });
    
    this.queryInput = querySection.createEl('input', {
      type: 'text',
      attr: { placeholder: '(node ?Id ?Type)' }
    });
    this.queryInput.style.width = '100%';
    this.queryInput.style.padding = '8px';

    // Execute button
    this.createButton(querySection, 'Execute', () => this.executeQuery());

    // Results area
    this.resultsEl = content.createEl('div', {
      cls: 'query-results'
    });
  }

  private async executeQuery(): Promise<void> {
    if (!this.queryInput || !this.resultsEl) return;

    const query = this.queryInput.value.trim();
    if (!query) {
      this.showNotice('Please enter a query');
      return;
    }

    try {
      const results = await this.getDb().prologQuery(query);
      this.resultsEl.textContent = JSON.stringify(results, null, 2);
    } catch (error) {
      this.resultsEl.textContent = `Error: ${error}`;
    }
  }
}
```

## Obsidian ItemView Integration

The `BaseMetaLogView` class works with Obsidian's ItemView system:

1. **Registration**: Views are registered via `registerMetaLogView()`
2. **Wrapper**: A wrapper implements the ItemView interface
3. **Lifecycle**: `onOpen()` and `onClose()` are called automatically
4. **Container**: Container element is provided by Obsidian

## Reference

- **BaseMetaLogView**: `plugin/meta-log-plugin/src/views/base-view.ts`
- **Example View**: `plugin/meta-log-plugin/src/views/meta-log-view.ts`
- **Obsidian Docs**: https://docs.obsidian.md/plugins/guides/bases-view
- **Example Plugin**: `plugin/meta-log-plugin/src/examples/obsidian-view-example.ts`

---

**Last Updated**: 2025-11-08
