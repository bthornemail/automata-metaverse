# Meta-Log Plugin Linking Setup

## ✅ Completed Setup

The `meta-log-plugin` package has been successfully linked to both OpenCode and Obsidian plugins.

### 1. Package Created
- Location: `/home/main/automaton/plugin/meta-log-plugin/`
- npm link created: ✅

### 2. OpenCode Plugin Link
- Location: `/home/main/automaton/.opencode/`
- Link status: ✅ Linked
- Package.json updated: ✅ Added `meta-log-plugin` dependency

### 3. Obsidian Plugin Link
- Location: `/home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin/`
- Link status: ✅ Linked
- Package.json updated: ✅ Added `meta-log-plugin` dependency

## Verification

You can verify the links are working:

```bash
# Check OpenCode link
cd /home/main/automaton/.opencode
npm list meta-log-plugin

# Check Obsidian link
cd /home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin
npm list meta-log-plugin
```

Both should show:
```
└── meta-log-plugin@1.0.0 extraneous -> ./../plugin/meta-log-plugin
```

## ⚠️ Next Steps Required

### 1. Create meta-log-db Package

The `meta-log-plugin` depends on `meta-log-db` which needs to be created first:

```bash
# Create meta-log-db package
mkdir -p /home/main/automaton/plugin/meta-log-db
cd /home/main/automaton/plugin/meta-log-db
# Follow setup guide in docs/06-Meta-Log-Adapters/01-Meta-Log-Db/SETUP_GUIDE.md
```

### 2. Link meta-log-db

Once `meta-log-db` is created:

```bash
# Link meta-log-db
cd /home/main/automaton/plugin/meta-log-db
npm link

# Link it in meta-log-plugin
cd /home/main/automaton/plugin/meta-log-plugin
npm link meta-log-db

# Link it in OpenCode plugin
cd /home/main/automaton/.opencode
npm link meta-log-db

# Link it in Obsidian plugin
cd /home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
```

### 3. Build meta-log-plugin

After `meta-log-db` is linked:

```bash
cd /home/main/automaton/plugin/meta-log-plugin
npm install
npm run build
```

## Usage Examples

### OpenCode Plugin

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl',
  enableProlog: true,
  enableDatalog: true
});

await plugin.onLoad();
```

### Obsidian Plugin

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
    // ... Obsidian-specific setup
  }
}
```

## Development Workflow

When making changes to `meta-log-plugin`:

1. Edit source files in `/home/main/automaton/plugin/meta-log-plugin/src/`
2. Rebuild: `cd /home/main/automaton/plugin/meta-log-plugin && npm run build`
3. Changes are automatically available in both linked plugins (no need to re-link)

## Troubleshooting

### Link Not Found
If you get "module not found" errors:
```bash
# Re-link the package
cd /home/main/automaton/plugin/meta-log-plugin
npm link

cd /home/main/automaton/.opencode
npm link meta-log-plugin

cd /home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-plugin
```

### TypeScript Errors
If TypeScript can't find types:
- Ensure `meta-log-db` is created and linked
- Run `npm install` in `meta-log-plugin` directory
- Run `npm run build` to generate type definitions

### Build Errors
If build fails due to missing `meta-log-db`:
- Create `meta-log-db` package first (see Next Steps above)
- Link `meta-log-db` before building `meta-log-plugin`
