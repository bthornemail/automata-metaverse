---
id: meta-log-adapters-quick-start
title: "Meta-Log Adapters Quick Start"
level: practical
type: guide
tags: [meta-log-adapters, quick-start, npm-link, setup]
keywords: [meta-log-adapters-quick-start, npm-link-quick-start, setup-guide, common-interface]
prerequisites: []
enables: [meta-log-db-setup, meta-log-plugin-setup]
related: [meta-log-adapters-readme]
readingTime: 15
difficulty: 2
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: []
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Adapters Quick Start

Get started with Meta-Log adapters in 5 minutes.

## Prerequisites

- Node.js 18+
- npm
- TypeScript 5.0+

## Step 1: Create Database Package

```bash
mkdir -p plugin/meta-log-db
cd plugin/meta-log-db
npm init -y
```

## Step 2: Create Plugin Package

```bash
mkdir -p plugin/meta-log-plugin
cd plugin/meta-log-plugin
npm init -y
```

## Step 3: Link Packages

```bash
# Link database
cd plugin/meta-log-db
npm link

# Link plugin (depends on database)
cd ../meta-log-plugin
npm link
npm link meta-log-db
```

## Step 4: Use in OpenCode Plugin

```bash
cd .opencode/plugin
npm link meta-log-db
npm link meta-log-plugin
```

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl'
});

await plugin.onLoad();
```

## Step 5: Use in Obsidian Plugin

```bash
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
npm link meta-log-plugin
```

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
  }
}
```

## Development Workflow

```bash
# Make changes to packages
cd plugin/meta-log-db
# Edit files
npm run build

cd ../meta-log-plugin
# Edit files
npm run build

# Changes automatically available in linked plugins!
```

## Next Steps

- Read [Database Setup Guide](./01-Meta-Log-Db/SETUP_GUIDE.md)
- Read [Plugin Setup Guide](./02-Meta-Log-Plugin/SETUP_GUIDE.md)
- Check [API References](./01-Meta-Log-Db/API.md)

---

**See Also**: [Meta-Log Adapters Overview](./README.md)
