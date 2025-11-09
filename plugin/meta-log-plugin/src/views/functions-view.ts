/**
 * Example view demonstrating Obsidian functions integration
 */

import { BaseMetaLogView } from './base-view.js';
import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';
import { ObsidianFunctions } from './obsidian-functions.js';
import { ObsidianMarkdownRenderer } from './markdown-renderer.js';

/**
 * View that demonstrates Obsidian functions usage
 */
export class FunctionsView extends BaseMetaLogView {
  private functions: ObsidianFunctions;
  private renderer: ObsidianMarkdownRenderer;
  private contentEl: HTMLElement | null = null;

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any) {
    super(plugin, leaf);
    this.functions = new ObsidianFunctions(plugin);
    this.renderer = new ObsidianMarkdownRenderer(plugin);
  }

  getViewType(): string {
    return 'meta-log-functions-view';
  }

  getDisplayText(): string {
    return 'Meta-Log Functions';
  }

  getIcon(): string {
    return 'function';
  }

  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const toolbar = this.createToolbar(container);
    
    // Refresh button
    this.createButton(toolbar, 'Refresh', () => this.refresh(), {
      cls: 'mod-cta'
    });

    // Execute example button
    this.createButton(toolbar, 'Run Examples', () => this.runExamples(), {
      cls: 'mod-cta'
    });

    this.contentEl = this.createContent(container);
    await this.refresh();
  }

  /**
   * Refresh view with current data
   */
  async refresh(): Promise<void> {
    if (!this.contentEl) return;

    try {
      const facts = this.functions.extractFacts();
      const factsCount = facts.length;
      const now = this.functions.now();
      const formattedDate = this.functions.formatDate(now, 'YYYY-MM-DD HH:mm:ss');

      const markdown = `
# Meta-Log Functions

> [!info]
> Last updated: ${formattedDate}

## Database Status

- **Facts loaded**: ${factsCount}
- **Database**: ${this.plugin.getDb() ? 'Connected' : 'Not connected'}

## Available Functions

### File Operations

\`\`\`typescript
// Read file
const content = await functions.readFile('path/to/file.md');

// Write file
await functions.writeFile('path/to/file.md', content);

// List files
const files = await functions.listFiles('path/to/directory');
\`\`\`

### Date/Time

\`\`\`typescript
// Get current date
const now = functions.now();

// Format date
const formatted = functions.formatDate(now, 'YYYY-MM-DD');

// Parse date
const date = functions.parseDate('2025-01-01');
\`\`\`

### String Operations

\`\`\`typescript
// Join array
const joined = functions.join(['a', 'b', 'c'], ', ');

// Split string
const parts = functions.split('a,b,c', ',');

// Replace text
const replaced = functions.replace('hello world', 'world', 'universe');
\`\`\`

### Array Operations

\`\`\`typescript
// Map array
const mapped = functions.map([1, 2, 3], x => x * 2);

// Filter array
const filtered = functions.filter([1, 2, 3], x => x > 1);

// Reduce array
const sum = functions.reduce([1, 2, 3], (acc, x) => acc + x, 0);
\`\`\`

### Math Operations

\`\`\`typescript
// Sum
const total = functions.sum([1, 2, 3, 4, 5]);

// Average
const avg = functions.average([1, 2, 3, 4, 5]);

// Min/Max
const min = functions.min([1, 2, 3, 4, 5]);
const max = functions.max([1, 2, 3, 4, 5]);
\`\`\`

### Meta-Log Queries

\`\`\`typescript
// ProLog query
const results = await functions.queryMetaLog('(node ?Id ?Type)', 'prolog');

// DataLog query
const facts = await functions.queryMetaLog('(missing_implementation ?N)', 'datalog');

// SPARQL query
const triples = await functions.queryMetaLog(
  'SELECT ?id ?type WHERE { ?id rdf:type ?type }',
  'sparql'
);
\`\`\`

## Examples

Click "Run Examples" to see functions in action!
`;

      this.contentEl.empty();
      await this.renderer.renderMarkdown(markdown, this.contentEl);
    } catch (error) {
      this.contentEl.textContent = `Error: ${error}`;
    }
  }

  /**
   * Run example functions
   */
  async runExamples(): Promise<void> {
    if (!this.contentEl) return;

    try {
      const examples: string[] = [];

      // Date example
      const now = this.functions.now();
      const formatted = this.functions.formatDate(now);
      examples.push(`**Current Date**: ${formatted}`);

      // Math example
      const numbers = [1, 2, 3, 4, 5];
      const sum = this.functions.sum(numbers);
      const avg = this.functions.average(numbers);
      examples.push(`**Sum of [1,2,3,4,5]**: ${sum}`);
      examples.push(`**Average**: ${avg}`);

      // String example
      const joined = this.functions.join(['Meta', 'Log', 'Functions'], ' → ');
      examples.push(`**Join**: ${joined}`);

      // Array example
      const mapped = this.functions.map([1, 2, 3], x => x * 2);
      examples.push(`**Map [1,2,3] * 2**: [${mapped.join(', ')}]`);

      // Meta-Log query example
      try {
        const facts = this.functions.extractFacts();
        examples.push(`**Facts extracted**: ${facts.length}`);
      } catch (error) {
        examples.push(`**Query error**: ${error}`);
      }

      const resultsMarkdown = `
## Function Examples Results

${examples.map(ex => `- ${ex}`).join('\n')}

> [!success]
> Examples executed successfully
`;

      // Append results to content
      const resultsSection = this.contentEl.createEl('div', {
        cls: 'function-results'
      });
      resultsSection.style.marginTop = '24px';
      resultsSection.style.padding = '16px';
      resultsSection.style.backgroundColor = 'var(--background-secondary)';
      resultsSection.style.borderRadius = '4px';

      await this.renderer.renderMarkdown(resultsMarkdown, resultsSection);
    } catch (error) {
      this.showNotice(`Error running examples: ${error}`, 5000);
    }
  }
}
