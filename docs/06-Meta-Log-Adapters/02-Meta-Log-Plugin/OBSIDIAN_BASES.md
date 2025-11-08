---
id: meta-log-plugin-obsidian-bases
title: "Obsidian Bases Integration"
level: practical
type: guide
tags: [meta-log-plugin, obsidian, bases, tables, data-structures]
keywords: [obsidian-bases, base-parser, base-embed, csv-conversion, json-conversion, markdown-tables]
prerequisites: [meta-log-plugin-readme, meta-log-plugin-views-guide]
enables: []
related: [obsidian-markdown-syntax, obsidian-functions, meta-log-plugin-api]
readingTime: 45
difficulty: 4
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [meta-log-db]
  watchers: []
---

# Obsidian Bases Integration

**Guide to using Obsidian Bases in Meta-Log views.**

## Overview

The Meta-Log plugin provides `ObsidianBasesParser` class for working with Obsidian bases:

- **Parse bases** from `.base` files
- **Embed bases** in markdown with filtering and sorting
- **Convert files** to base format (CSV, JSON, Markdown tables, TSV)
- **Query and filter** base data

**Reference**: 
- [Obsidian Bases Documentation](https://help.obsidian.md/bases)
- [Create Base Guide](https://help.obsidian.md/bases/create-base)

## ObsidianBasesParser Class

### Basic Usage

```typescript
import { ObsidianBasesParser } from 'meta-log-plugin';

const parser = new ObsidianBasesParser(plugin);

// Parse a base file
const base = await parser.parseBase('path/to/base.base');

// Convert file to base
const base = await parser.convertToBase('path/to/file.csv');
```

### In BaseMetaLogView

The `BaseMetaLogView` class provides helper methods:

```typescript
class MyView extends BaseMetaLogView {
  async onOpen(): Promise<void> {
    const parser = this.getBasesParser();
    
    // Parse base
    const base = await parser.parseBase('my-base.base');
    
    // Render base embed
    await parser.renderBaseEmbed('my-base.base', this.contentEl);
  }
}
```

## Base File Structure

### Base File Format

```json
{
  "type": "base",
  "version": "1.0",
  "schema": {
    "version": "1.0",
    "fields": [
      {
        "name": "name",
        "type": "text"
      },
      {
        "name": "date",
        "type": "date"
      },
      {
        "name": "status",
        "type": "select",
        "options": ["active", "inactive"]
      }
    ]
  },
  "data": [
    {
      "id": "row-1",
      "name": "Example",
      "date": "2025-11-08",
      "status": "active"
    }
  ]
}
```

### Field Types

Supported field types:

- **text** - Text string
- **number** - Numeric value
- **date** - Date value
- **checkbox** - Boolean (true/false)
- **select** - Single selection from options
- **multiselect** - Multiple selections
- **file** - File reference
- **url** - URL link
- **email** - Email address
- **phone** - Phone number
- **formula** - Calculated field
- **rollup** - Aggregated data from related base
- **relation** - Link to another base
- **created** - Creation timestamp
- **updated** - Update timestamp
- **button** - Action button

## Parsing Bases

### Parse Base File

```typescript
const base = await parser.parseBase('path/to/base.base');
// Returns: BaseFile object
```

### Parse Markdown Base

Bases can also be stored as markdown with frontmatter:

```markdown
---
name: text
date: date
status: select
---

Row 1 | 2025-11-08 | active
Row 2 | 2025-11-09 | inactive
```

```typescript
const base = await parser.parseBase('path/to/base.base.md');
```

## Converting Files to Bases

### Supported File Types

The following file types can be converted to bases:

#### CSV Files

```typescript
const base = await parser.convertToBase('data/export.csv');
```

CSV format:
```csv
name,date,status
Example,2025-11-08,active
Another,2025-11-09,inactive
```

#### JSON Files

```typescript
const base = await parser.convertToBase('data/export.json');
```

JSON array format:
```json
[
  {"name": "Example", "date": "2025-11-08", "status": "active"},
  {"name": "Another", "date": "2025-11-09", "status": "inactive"}
]
```

JSON object format:
```json
{
  "name": "Example",
  "date": "2025-11-08",
  "status": "active"
}
```

#### Markdown Tables

```typescript
const base = await parser.convertToBase('data/table.md');
```

Markdown table format:
```markdown
| name | date | status |
| --- | --- | --- |
| Example | 2025-11-08 | active |
| Another | 2025-11-09 | inactive |
```

#### TSV Files

```typescript
const base = await parser.convertToBase('data/export.tsv');
```

TSV format (tab-separated):
```
name	date	status
Example	2025-11-08	active
Another	2025-11-09	inactive
```

## Embedding Bases

### Basic Embed

```markdown
![[my-base.base]]
```

### With Options

```markdown
![[my-base.base|limit=10]]
![[my-base.base|fields=name,date|sort=date:desc]]
![[my-base.base|filter=status:equals:active]]
```

### Embed Options

#### Limit Rows

```markdown
![[my-base.base|limit=10]]
```

#### Select Fields

```markdown
![[my-base.base|fields=name,date,status]]
```

#### Sort

```markdown
![[my-base.base|sort=date:desc]]
![[my-base.base|sort=name:asc|sort=date:desc]]
```

#### Filter

```markdown
![[my-base.base|filter=status:equals:active]]
![[my-base.base|filter=date:after:2025-01-01]]
```

### Filter Operators

- **equals** - Exact match
- **notEquals** - Not equal
- **contains** - Contains substring
- **notContains** - Does not contain
- **isEmpty** - Field is empty
- **isNotEmpty** - Field is not empty
- **greaterThan** - Greater than (numbers)
- **lessThan** - Less than (numbers)
- **greaterThanOrEqual** - Greater than or equal
- **lessThanOrEqual** - Less than or equal
- **before** - Before date
- **after** - After date
- **onOrBefore** - On or before date
- **onOrAfter** - On or after date

### Combined Options

```markdown
![[my-base.base|fields=name,date|sort=date:desc|filter=status:equals:active|limit=10]]
```

## Programmatic Base Embedding

### Render Base Embed

```typescript
const options: BaseEmbedOptions = {
  limit: 10,
  fields: ['name', 'date'],
  sort: [{ field: 'date', direction: 'desc' }],
  filters: [
    { field: 'status', operator: 'equals', value: 'active' }
  ]
};

await parser.renderBaseEmbed('my-base.base', container, options);
```

### Create Base Embed HTML

```typescript
const html = await parser.createBaseEmbed('my-base.base', options);
container.innerHTML = html;
```

## Filtering and Sorting

### Apply Filters

```typescript
const filters: BaseFilter[] = [
  { field: 'status', operator: 'equals', value: 'active' },
  { field: 'date', operator: 'after', value: '2025-01-01' }
];

const filteredRows = parser.applyFilters(base.data, filters);
```

### Apply Sort

```typescript
const sort: BaseSort[] = [
  { field: 'date', direction: 'desc' },
  { field: 'name', direction: 'asc' }
];

const sortedRows = parser.applySort(base.data, sort);
```

## Usage Examples

### Example 1: Load and Display Base

```typescript
class MyView extends BaseMetaLogView {
  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);
    
    const parser = this.getBasesParser();
    const base = await parser.parseBase('my-base.base');
    
    // Display base info
    const markdown = `
# Base: ${base.schema.fields.length} fields, ${base.data.length} rows

${base.schema.fields.map(f => `- ${f.name} (${f.type})`).join('\n')}
`;
    
    await this.renderMarkdown(markdown, content);
  }
}
```

### Example 2: Convert CSV to Base

```typescript
const parser = this.getBasesParser();
const base = await parser.convertToBase('data/export.csv');

// Save as base file
await this.plugin.app.vault.create(
  'data/export.base',
  JSON.stringify(base, null, 2)
);
```

### Example 3: Filtered Base Embed

```typescript
const parser = this.getBasesParser();
const options: BaseEmbedOptions = {
  filters: [
    { field: 'status', operator: 'equals', value: 'active' }
  ],
  sort: [{ field: 'date', direction: 'desc' }],
  limit: 10
};

await parser.renderBaseEmbed('my-base.base', container, options);
```

### Example 4: Markdown with Base Embed

```typescript
const markdown = `
# My Document

Here's my base data:

![[my-base.base|fields=name,date|sort=date:desc|limit=5]]

More content here...
`;

await this.renderMarkdown(markdown, container);
```

## Integration with Views

### BasesView Example

See `src/views/bases-view.ts` for a complete example demonstrating:
- Base parsing
- File conversion
- Base embedding
- Filtering and sorting

## File Type Reduction

### Supported Conversions

The following file types can be reduced to bases:

1. **JSONL** → Base (backward compatible, preserves nodes/edges)
2. **CanvasL** → Base (backward compatible, preserves directives and R5RS functions)
3. **CSV** → Base (automatic field detection)
4. **JSON** → Base (array or object)
5. **Markdown Tables** → Base (table parsing)
6. **TSV** → Base (tab-separated)
7. **Base Files** → Base (native format)

### Bidirectional Conversion

#### JSONL/CanvasL → Base

Converts JSONL/CanvasL canvas files to base format:
- Nodes become rows with fields: `id`, `type`, `x`, `y`, `text`, plus all custom fields
- Edges become rows with fields: `id`, `type`, `fromNode`, `toNode`, plus all custom fields
- CanvasL directives are preserved in metadata
- R5RS function calls and dimensions are preserved as custom fields

#### Base → JSONL/CanvasL

Converts base format back to JSONL/CanvasL:
- Rows with `x`/`y` coordinates become nodes
- Rows with `fromNode`/`toNode` become edges
- CanvasL directives are restored from metadata
- All custom fields are preserved

#### Round-Trip Testing

Test data integrity through conversion cycle:

```typescript
const result = await parser.roundTripJSONL('my-canvas.jsonl');
// Returns: { original, base, converted, lossless }
```

### Conversion Process

1. **Parse file** based on extension
2. **Detect fields** from headers or structure
3. **Infer field types** from data
4. **Create base schema** with fields
5. **Convert rows** to base data format

## Reference

- **Obsidian Bases Docs**: https://help.obsidian.md/bases
- **Create Base Guide**: https://help.obsidian.md/bases/create-base
- **ObsidianBasesParser Class**: `plugin/meta-log-plugin/src/views/bases-parser.ts`
- **BasesView Example**: `plugin/meta-log-plugin/src/views/bases-view.ts`

---

**Last Updated**: 2025-11-08
