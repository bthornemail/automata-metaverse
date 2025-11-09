# Meta-Log Database Linking Setup

## ✅ Completed Setup

The `meta-log-db` package has been successfully created and linked.

### 1. Package Created
- Location: `/home/main/automaton/meta-log-db/`
- npm link created: ✅

### 2. Linked to meta-log-plugin
- Location: `/home/main/automaton/plugin/meta-log-plugin/`
- Link status: ✅ Linked

### 3. Linked to OpenCode Plugin
- Location: `/home/main/automaton/.opencode/`
- Link status: ✅ Linked (via meta-log-plugin dependency)

### 4. Linked to Obsidian Plugin
- Location: `/home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin/`
- Link status: ✅ Linked (via meta-log-plugin dependency)

## Verification

You can verify the links are working:

```bash
# Check meta-log-plugin link
cd /home/main/automaton/plugin/meta-log-plugin
npm list meta-log-db

# Check OpenCode link
cd /home/main/automaton/.opencode
npm list meta-log-db

# Check Obsidian link
cd /home/main/automaton/.obsidian/plugins/universal-life-protocol-plugin
npm list meta-log-db
```

## Package Structure

```
meta-log-db/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                 # Main export
│   ├── database.ts              # MetaLogDb class
│   ├── prolog/
│   │   ├── engine.ts            # ProLog query engine
│   │   ├── unification.ts       # Unification algorithm
│   │   └── resolution.ts        # SLD resolution
│   ├── datalog/
│   │   ├── engine.ts            # DataLog engine
│   │   ├── fact-extraction.ts   # Fact extraction from JSONL
│   │   └── fixed-point.ts       # Fixed-point computation
│   ├── r5rs/
│   │   └── registry.ts          # R5RS function registry
│   ├── jsonl/
│   │   └── parser.ts            # JSONL/CanvasL parser
│   ├── rdf/
│   │   └── triple-store.ts      # RDF triple storage & SPARQL
│   ├── shacl/
│   │   └── validator.ts         # SHACL validation
│   └── types/
│       └── index.ts             # TypeScript definitions
└── dist/                        # Compiled output (after build)
```

## Next Steps

### 1. Build Package

```bash
cd /home/main/automaton/meta-log-db
npm install
npm run build
```

### 2. Build meta-log-plugin

After meta-log-db is built:

```bash
cd /home/main/automaton/plugin/meta-log-plugin
npm run build
```

### 3. Use in Plugins

Both plugins can now use meta-log-db:

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  enableProlog: true,
  enableDatalog: true,
  enableRdf: true,
  enableShacl: true
});

await db.loadCanvas('./automaton-kernel.jsonl');
```

## Development Workflow

When making changes to `meta-log-db`:

1. Edit source files in `/home/main/automaton/meta-log-db/src/`
2. Rebuild: `cd /home/main/automaton/meta-log-db && npm run build`
3. Changes automatically available in linked packages (no need to re-link)

## Features Implemented

- ✅ JSONL/CanvasL Parser
- ✅ ProLog Engine (unification, SLD resolution)
- ✅ DataLog Engine (fact extraction, fixed-point computation)
- ✅ R5RS Registry (function registry and execution)
- ✅ RDF Triple Store (with simplified SPARQL support)
- ✅ SHACL Validator (shape constraint validation)

## Testing

```bash
cd /home/main/automaton/meta-log-db
npm test
```

## Troubleshooting

### Build Errors
If build fails:
```bash
npm install
npm run build
```

### Link Not Found
If plugins can't find meta-log-db:
```bash
cd /home/main/automaton/meta-log-db
npm link

cd /home/main/automaton/plugin/meta-log-plugin
npm link meta-log-db
```

### Type Errors
Ensure TypeScript definitions are generated:
```bash
npm run build
```
