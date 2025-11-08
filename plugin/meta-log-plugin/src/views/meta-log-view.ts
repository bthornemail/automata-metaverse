import { BaseMetaLogView } from './base-view.js';
import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';

/**
 * Example Meta-Log view implementation
 * Shows database status and allows querying
 */
export class MetaLogView extends BaseMetaLogView {
  private contentEl: HTMLElement | null = null;
  private queryInput: HTMLInputElement | null = null;
  private resultsEl: HTMLElement | null = null;

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any) {
    super(plugin, leaf);
  }

  getViewType(): string {
    return 'meta-log-view';
  }

  getDisplayText(): string {
    return 'Meta-Log';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    // Use Obsidian's container structure
    const container = this.initializeContainer();

    // Create toolbar
    const toolbar = this.createToolbar(container);
    
    // Refresh button
    this.createButton(toolbar, 'Refresh', () => this.refresh(), {
      cls: 'mod-cta',
      icon: 'refresh'
    });

    // Create content area
    this.contentEl = this.createContent(container);

    // Create query section
    this.createQuerySection(this.contentEl);

    // Create results section
    this.createResultsSection(this.contentEl);

    // Initial load
    await this.refresh();
  }

  /**
   * Create query input section
   */
  private createQuerySection(container: HTMLElement): void {
    const querySection = container.createEl('div', {
      cls: 'meta-log-query-section'
    });

    const label = querySection.createEl('label', {
      text: 'ProLog Query:',
      attr: { for: 'meta-log-query-input' }
    });

    this.queryInput = querySection.createEl('input', {
      type: 'text',
      attr: {
        id: 'meta-log-query-input',
        placeholder: '(node ?Id ?Type)'
      },
      cls: 'meta-log-query-input'
    });
    this.queryInput.style.width = '100%';
    this.queryInput.style.padding = '8px';
    this.queryInput.style.marginBottom = '8px';

    // Execute button
    this.createButton(querySection, 'Execute Query', () => this.executeQuery(), {
      cls: 'mod-cta'
    });

    // Enter key handler
    this.queryInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        this.executeQuery();
      }
    };
  }

  /**
   * Create results display section
   */
  private createResultsSection(container: HTMLElement): void {
    const resultsSection = container.createEl('div', {
      cls: 'meta-log-results-section'
    });
    resultsSection.style.marginTop = '16px';

    const label = resultsSection.createEl('h3', {
      text: 'Results'
    });

    this.resultsEl = resultsSection.createEl('div', {
      cls: 'meta-log-results'
    });
    this.resultsEl.style.padding = '8px';
    this.resultsEl.style.backgroundColor = 'var(--background-secondary)';
    this.resultsEl.style.borderRadius = '4px';
    this.resultsEl.style.minHeight = '200px';
  }

  /**
   * Refresh view data
   */
  async refresh(): Promise<void> {
    if (!this.contentEl) return;

    try {
      const facts = this.getDb().extractFacts();
      const factCount = facts.length;

      // Update status
      const statusEl = this.contentEl.querySelector('.meta-log-status');
      if (statusEl) {
        statusEl.textContent = `Loaded ${factCount} facts`;
      } else {
        const status = this.contentEl.createEl('div', {
          cls: 'meta-log-status',
          text: `Loaded ${factCount} facts`
        });
        status.style.marginBottom = '16px';
        status.style.padding = '8px';
        status.style.backgroundColor = 'var(--background-secondary)';
        status.style.borderRadius = '4px';
      }
    } catch (error) {
      this.showNotice(`Error refreshing: ${error}`, 5000);
    }
  }

  /**
   * Execute ProLog query
   */
  async executeQuery(): Promise<void> {
    if (!this.queryInput || !this.resultsEl) return;

    const query = this.queryInput.value.trim();
    if (!query) {
      this.showNotice('Please enter a query', 3000);
      return;
    }

    try {
      this.resultsEl.textContent = 'Executing query...';

      const results = await this.getDb().prologQuery(query);

      // Display results using markdown rendering
      if (results.bindings && results.bindings.length > 0) {
        const markdown = `
## Query Results

**Query:** \`${query}\`

**Found:** ${results.bindings.length} result(s)

${results.bindings.map((binding: any, index: number) => {
          const bindingStr = Object.entries(binding)
            .map(([key, value]) => `**${key}**: \`${value}\``)
            .join(', ');
          return `### Result ${index + 1}\n\n${bindingStr}`;
        }).join('\n\n')}

> [!success]
> Query executed successfully
`;

        // Clear and render markdown
        this.resultsEl.empty();
        await this.renderMarkdown(markdown, this.resultsEl);
      } else {
        const markdown = `
## Query Results

**Query:** \`${query}\`

> [!info]
> No results found
`;

        this.resultsEl.empty();
        await this.renderMarkdown(markdown, this.resultsEl);
      }

      this.emit('queryExecuted', query, results);
    } catch (error) {
      const errorMarkdown = `
## Query Error

**Query:** \`${query}\`

> [!error]
> ${error}

\`\`\`
${error}
\`\`\`
`;

      this.resultsEl.empty();
      await this.renderMarkdown(errorMarkdown, this.resultsEl);
      this.showNotice(`Query error: ${error}`, 5000);
    }
  }
}
