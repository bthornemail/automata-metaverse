# Evolution Workflow Guide

## Overview

The evolution workflow automates the process of capturing automaton evolution snapshots, analyzing patterns, and generating optimized variants for different execution environments.

## Workflow Trigger

### Automatic Trigger

The workflow runs automatically when code is pushed to the `evolution` branch:

```bash
git checkout -b evolution
git push origin evolution
```

### Manual Trigger

You can also trigger the workflow manually via GitHub Actions UI or API:

```bash
gh workflow run evolution.yml
```

### Specific Variant

To generate only a specific variant:

```bash
gh workflow run evolution.yml -f variant=llama3.2
```

Available variants:
- `llama3.2` - Llama 3.2 optimization
- `gpt-oss` - GPT-OSS 20B optimization
- `native` - Native execution
- `fast` - Fast execution mode
- `all` - Generate all variants (default)

## Workflow Steps

### 1. Setup

- Checkout code
- Setup Node.js 20
- Install dependencies
- Build Meta-Log-Db
- Link Meta-Log-Db packages

### 2. Evolution Execution

Runs automaton evolution for a configurable duration (default: 5 minutes):

```yaml
EVOLUTION_DURATION: 300  # seconds
```

**Processes Started:**
- `automaton-memory-optimized.ts` - Optimized automaton execution
- `snapshot-automaton-memory.ts` - Memory-aware snapshot capture

### 3. Snapshot Analysis

Analyzes captured snapshots:

- `analyze-memory-snapshots.ts` - Memory pattern analysis
- `memory-leak-investigator.ts` - Leak detection

**Output:** `evolution-analysis.txt`

### 4. Variant Generation

Generates optimized variants using Meta-Log-Db:

```bash
tsx scripts/generate-evolution-variants.ts \
  --input automaton.jsonl \
  --snapshots snapshots-memory \
  --variants all \
  --output-dir evolution-variants
```

**Generated Files:**
- `automaton.llama3.2:latest.canvasl`
- `automaton.gpt-oss:20b.canvasl`
- `automaton.native.canvasl`
- `automaton.fast.canvasl`

### 5. Validation

Validates all generated variants:

```bash
tsx validate-canvasl.ts <variant-file>
```

### 6. Artifact Storage

Stores evolution artifacts:

- Variant CanvasL files
- Snapshot JSON files
- Analysis reports

**Retention:** 30 days

### 7. Commit Variants

Commits generated variants to the `evolution` branch:

```bash
git add automaton.*.canvasl
git commit -m "chore: update evolution variants [skip ci]"
git push origin evolution
```

### 8. Report Generation

Creates evolution report with:

- Evolution summary
- Analysis results
- Generated variants
- Next steps

## Local Execution

### Prerequisites

```bash
# Install dependencies
npm ci
cd meta-log-db && npm ci
cd ../plugin/meta-log-plugin && npm ci

# Build Meta-Log-Db
cd meta-log-db && npm run build

# Link packages
npm link meta-log-db
cd meta-log-db && npm link
```

### Run Evolution

```bash
# Terminal 1: Start automaton
NODE_OPTIONS="--expose-gc --max-old-space-size=2048" \
tsx automaton-memory-optimized.ts

# Terminal 2: Start snapshot system
tsx snapshot-automaton-memory.ts

# Wait for evolution duration (e.g., 5 minutes)
sleep 300

# Terminal 3: Analyze and generate
tsx analyze-memory-snapshots.ts
tsx memory-leak-investigator.ts
tsx scripts/generate-evolution-variants.ts --variants all
```

### Generate Specific Variant

```bash
tsx scripts/generate-evolution-variants.ts \
  --input automaton.jsonl \
  --snapshots snapshots-memory \
  --variants llama3.2 \
  --output-dir evolution-variants
```

## Configuration

### Environment Variables

```yaml
EVOLUTION_DURATION: 300      # Evolution duration in seconds
API_URL: http://localhost:5555  # Automaton API URL
NODE_OPTIONS: --expose-gc --max-old-space-size=2048
```

### Variant Configuration

Edit `scripts/generate-evolution-variants.ts`:

```typescript
const VARIANTS: Record<string, VariantConfig> = {
  'llama3.2': {
    name: 'llama3.2:latest',
    maxObjects: 1000,
    maxHistory: 200,
    optimizations: {
      tokenOptimization: true,
      batchProcessing: true,
    },
  },
  // ... other variants
};
```

## Output Files

### Variants

- `automaton.llama3.2:latest.canvasl` - Llama 3.2 optimized
- `automaton.gpt-oss:20b.canvasl` - GPT-OSS 20B optimized
- `automaton.native.canvasl` - Native execution
- `automaton.fast.canvasl` - Fast execution

### Artifacts

- `evolution-variants/*.canvasl` - Generated variants
- `snapshots-memory/*.json` - Snapshot files
- `evolution-analysis.txt` - Analysis results
- `evolution-report.md` - Evolution report

## Troubleshooting

### Workflow Fails

1. **Check logs:** Review GitHub Actions logs
2. **Verify dependencies:** Ensure all packages are installed
3. **Check Meta-Log-Db:** Verify Meta-Log-Db is built and linked
4. **Memory issues:** Increase `max-old-space-size` if needed

### Variants Not Generated

1. **Check snapshots:** Verify snapshots exist in `snapshots-memory/`
2. **Verify input:** Ensure `automaton.jsonl` exists
3. **Check permissions:** Ensure write permissions for output directory

### Validation Fails

1. **Check CanvasL format:** Verify variant files are valid CanvasL
2. **Review directives:** Ensure directives are correct
3. **Check JSON:** Verify JSONL entries are valid

## Best Practices

1. **Regular Evolution:** Run evolution regularly to track changes
2. **Review Analysis:** Always review analysis results before merging
3. **Test Variants:** Test variants before deploying
4. **Monitor Memory:** Watch for memory leaks in analysis
5. **Version Control:** Keep evolution branch separate from main

## Next Steps

1. ✅ Document workflow process
2. ✅ Create GitHub workflow
3. ✅ Implement variant generation
4. 🔄 Add variant testing
5. 🔄 Create evolution dashboard
6. 🔄 Add automated variant deployment
