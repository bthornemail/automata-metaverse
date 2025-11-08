# Meta-Log Plugin Views

This directory contains view interfaces and implementations for Obsidian plugins.

## BaseMetaLogView

Abstract base class for creating Obsidian views that integrate with Meta-Log.

### Features

- Common view structure (toolbar, content area)
- Database access via `getDb()`
- Event emission via `emit()`
- Helper methods for creating UI elements

### Usage

```typescript
import { BaseMetaLogView } from 'meta-log-plugin';
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

class MyView extends BaseMetaLogView {
  getViewType(): string {
    return 'my-view';
  }

  getDisplayText(): string {
    return 'My View';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    const container = this.createContainer();
    const content = this.createContent(container);
    
    // Add your view content
    content.createEl('h2', { text: 'My View Content' });
  }
}
```

## MetaLogView

Example implementation showing:
- Query input
- Results display
- Database status
- Refresh functionality

## Integration with ObsidianMetaLogPlugin

```typescript
import { ObsidianMetaLogPlugin, MetaLogView } from 'meta-log-plugin';

export default class MyPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    
    // Register view
    this.registerMetaLogView({
      viewType: 'meta-log-view',
      displayText: 'Meta-Log',
      icon: 'database',
      viewCreator: (leaf, plugin) => new MetaLogView(plugin, leaf)
    });
    
    // Add ribbon icon
    this.addRibbonIcon('database', 'Open Meta-Log', () => {
      this.activateView('meta-log-view');
    });
  }
}
```

## Reference

- [Obsidian View Documentation](https://docs.obsidian.md/plugins/guides/bases-view)
- [BaseMetaLogView Source](./base-view.ts)
- [MetaLogView Source](./meta-log-view.ts)
