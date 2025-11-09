/**
 * Obsidian Markdown Syntax Renderer
 * 
 * Provides integration with Obsidian's markdown rendering system
 * Supports Obsidian-specific syntax: wikilinks, embeds, callouts, tags, etc.
 */

import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';
import { ObsidianBasesParser, BaseEmbedOptions } from './bases-parser.js';

/**
 * Markdown renderer interface for Obsidian syntax
 */
export class ObsidianMarkdownRenderer {
  private plugin: ObsidianMetaLogPlugin;
  private basesParser: ObsidianBasesParser;

  constructor(plugin: ObsidianMetaLogPlugin) {
    this.plugin = plugin;
    this.basesParser = new ObsidianBasesParser(plugin);
  }

  /**
   * Render markdown content with Obsidian syntax support
   * 
   * Supports:
   * - Wikilinks: [[link]]
   * - Embeds: ![[file]]
   * - Callouts: > [!note]
   * - Tags: #tag
   * - Block references: ^block-ref
   * - Math: $formula$ or $$formula$$
   * - Code blocks with language
   * - Task lists: - [ ] and - [x]
   */
  async renderMarkdown(
    content: string,
    container: HTMLElement,
    sourcePath?: string
  ): Promise<void> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      // Fallback: render as plain HTML if Obsidian API not available
      container.innerHTML = this.escapeHtml(content);
      return;
    }

    try {
      // Use Obsidian's MarkdownRenderer if available
      const obsidianModule = await import('obsidian');
      const MarkdownRenderer = (obsidianModule as any).MarkdownRenderer || (obsidianModule as any).default?.MarkdownRenderer;
      
      // Create a temporary container for rendering
      const tempContainer = container.createEl('div', {
        cls: 'markdown-preview-view'
      });

      // Render markdown with Obsidian's renderer
      await MarkdownRenderer.renderMarkdown(
        content,
        tempContainer,
        sourcePath || '',
        this.plugin.app
      );
    } catch (error) {
      // Fallback to basic HTML rendering
      console.warn('Obsidian MarkdownRenderer not available, using fallback:', error);
      container.innerHTML = this.escapeHtml(content);
    }
  }

  /**
   * Render a single markdown element (paragraph, heading, etc.)
   */
  async renderElement(
    element: string,
    container: HTMLElement,
    sourcePath?: string
  ): Promise<void> {
    await this.renderMarkdown(element, container, sourcePath);
  }

  /**
   * Render wikilink [[link]]
   */
  renderWikilink(link: string, container: HTMLElement): HTMLElement {
    const wikilinkEl = container.createEl('a', {
      text: link,
      attr: {
        'data-href': link,
        'href': link,
        'class': 'internal-link'
      }
    });

    // Add click handler to open link in Obsidian
    wikilinkEl.onclick = (e: MouseEvent) => {
      e.preventDefault();
      if (this.plugin.app && this.plugin.app.workspace) {
        const file = this.plugin.app.metadataCache.getFirstLinkpathDest(link, '');
        if (file) {
          this.plugin.app.workspace.openLinkText(link, '', false);
        }
      }
    };

    return wikilinkEl;
  }

  /**
   * Render embed ![[file]]
   * Supports both regular file embeds and base embeds
   */
  async renderEmbed(file: string, container: HTMLElement, options?: BaseEmbedOptions): Promise<void> {
    const embedContainer = container.createEl('div', {
      cls: 'markdown-embed'
    });

    if (this.plugin.app && this.plugin.app.vault) {
      try {
        const targetFile = this.plugin.app.metadataCache.getFirstLinkpathDest(file, '');
        if (targetFile) {
          // Check if file is a base file
          const extension = targetFile.path.split('.').pop()?.toLowerCase();
          const isBaseFile = extension === 'base' || 
                             targetFile.path.endsWith('.base.json') ||
                             targetFile.path.endsWith('.base.md');
          
          if (isBaseFile && options) {
            // Render as base embed
            await this.basesParser.renderBaseEmbed(targetFile.path, embedContainer, options);
          } else if (isBaseFile) {
            // Render base without options
            await this.basesParser.renderBaseEmbed(targetFile.path, embedContainer);
          } else {
            // Regular file embed
            const content = await this.plugin.app.vault.read(targetFile);
            await this.renderMarkdown(content, embedContainer, targetFile.path);
          }
        } else {
          embedContainer.textContent = `[[${file}]] (not found)`;
        }
      } catch (error) {
        embedContainer.textContent = `Error loading [[${file}]]: ${error}`;
      }
    } else {
      embedContainer.textContent = `[[${file}]]`;
    }
  }

  /**
   * Render base embed with syntax: ![[base-file.base|filters|sort|limit]]
   */
  async renderBaseEmbed(basePath: string, container: HTMLElement, options?: BaseEmbedOptions): Promise<void> {
    await this.basesParser.renderBaseEmbed(basePath, container, options);
  }

  /**
   * Render callout > [!note]
   */
  renderCallout(
    type: string,
    content: string,
    container: HTMLElement
  ): HTMLElement {
    const calloutEl = container.createEl('div', {
      cls: `callout callout-${type.toLowerCase()}`
    });

    const calloutTitle = calloutEl.createEl('div', {
      cls: 'callout-title',
      text: type
    });

    const calloutContent = calloutEl.createEl('div', {
      cls: 'callout-content'
    });

    // Render content as markdown
    this.renderMarkdown(content, calloutContent);

    return calloutEl;
  }

  /**
   * Render tag #tag
   */
  renderTag(tag: string, container: HTMLElement): HTMLElement {
    const tagEl = container.createEl('span', {
      text: `#${tag}`,
      cls: 'tag'
    });

    // Add click handler to search for tag
    tagEl.onclick = () => {
      if (this.plugin.app && this.plugin.app.internalPlugins) {
        // Trigger tag search in Obsidian
        this.plugin.app.commands.executeCommandById('editor:open-search');
      }
    };

    return tagEl;
  }

  /**
   * Render block reference ^block-ref
   */
  renderBlockReference(ref: string, container: HTMLElement): HTMLElement {
    const refEl = container.createEl('span', {
      text: `^${ref}`,
      cls: 'block-ref'
    });

    // Add click handler to navigate to block
    refEl.onclick = () => {
      // Navigate to block reference
      console.log(`Navigate to block: ${ref}`);
    };

    return refEl;
  }

  /**
   * Render math formula $formula$ or $$formula$$
   */
  renderMath(formula: string, display: boolean = false, container: HTMLElement): HTMLElement {
    const mathEl = container.createEl('span', {
      cls: display ? 'math math-display' : 'math math-inline',
      text: formula
    });

    // In a full implementation, would use a math renderer like KaTeX
    mathEl.setAttribute('data-math', formula);

    return mathEl;
  }

  /**
   * Render code block with syntax highlighting
   */
  renderCodeBlock(
    code: string,
    language: string = '',
    container: HTMLElement
  ): HTMLElement {
    const codeBlockEl = container.createEl('pre', {
      cls: `language-${language}`
    });

    const codeEl = codeBlockEl.createEl('code', {
      text: code,
      cls: language ? `language-${language}` : ''
    });

    return codeBlockEl;
  }

  /**
   * Render task list item
   */
  renderTaskItem(
    text: string,
    checked: boolean,
    container: HTMLElement
  ): HTMLElement {
    const taskEl = container.createEl('div', {
      cls: 'task-list-item'
    });

    const checkboxAttrs: Record<string, string> = {};
    if (checked) {
      checkboxAttrs.checked = '';
    }
    const checkbox = taskEl.createEl('input', {
      type: 'checkbox',
      attr: checkboxAttrs
    });

    const label = taskEl.createEl('label', {
      text: text
    });

    return taskEl;
  }

  /**
   * Parse and render Obsidian markdown syntax
   * Supports base embeds: ![[base-file.base|filters|sort|limit]]
   */
  async parseAndRender(
    content: string,
    container: HTMLElement,
    sourcePath?: string
  ): Promise<void> {
    // Parse base embeds first
    const baseEmbedRegex = /!\[\[([^\]]+\.base(?:\.[^\]]+)?)(?:\|([^\]]+))?\]\]/g;
    let processedContent = content;
    const baseEmbeds: Array<{ match: string; path: string; options?: string }> = [];

    let match;
    while ((match = baseEmbedRegex.exec(content)) !== null) {
      baseEmbeds.push({
        match: match[0],
        path: match[1],
        options: match[2]
      });
    }

    // Replace base embeds with placeholders
    for (let i = 0; i < baseEmbeds.length; i++) {
      processedContent = processedContent.replace(
        baseEmbeds[i].match,
        `<!--BASE_EMBED_${i}-->`
      );
    }

    // Render markdown with placeholders
    await this.renderMarkdown(processedContent, container, sourcePath);

    // Replace placeholders with actual base embeds
    for (let i = 0; i < baseEmbeds.length; i++) {
      // Find placeholder in rendered content
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let textNode: Node | null = null;
      while ((textNode = walker.nextNode())) {
        if (textNode.textContent?.includes(`<!--BASE_EMBED_${i}-->`)) {
          const parent = textNode.parentElement;
          if (parent) {
            // Replace text node with embed container
            const embedContainer = document.createElement('div');
            embedContainer.className = 'base-embed-container';
            
            // Parse options from embed syntax
            const options = this.parseBaseEmbedOptions(baseEmbeds[i].options);
            
            try {
              await this.basesParser.renderBaseEmbed(baseEmbeds[i].path, embedContainer, options);
            } catch (error) {
              embedContainer.textContent = `Error loading base: ${error}`;
            }
            
            // Replace placeholder text with embed
            const newText = textNode.textContent.replace(`<!--BASE_EMBED_${i}-->`, '');
            if (newText) {
              const newTextNode = document.createTextNode(newText);
              parent.insertBefore(newTextNode, textNode);
            }
            parent.insertBefore(embedContainer, textNode);
            parent.removeChild(textNode);
          }
          break;
        }
      }
    }
  }

  /**
   * Parse base embed options from syntax: field=value,field2=value2
   */
  private parseBaseEmbedOptions(optionsString?: string): BaseEmbedOptions | undefined {
    if (!optionsString) return undefined;

    const options: BaseEmbedOptions = {};
    const parts = optionsString.split(',');

    for (const part of parts) {
      const [key, value] = part.split('=').map(s => s.trim());
      
      switch (key) {
        case 'limit':
          options.limit = parseInt(value);
          break;
        case 'fields':
          options.fields = value.split('|').map(f => f.trim());
          break;
        case 'filter':
          // Parse filter syntax: field:operator:value
          const filterParts = value.split(':');
          if (filterParts.length === 3) {
            if (!options.filters) options.filters = [];
            options.filters.push({
              field: filterParts[0],
              operator: filterParts[1] as any,
              value: filterParts[2]
            });
          }
          break;
        case 'sort':
          // Parse sort syntax: field:direction
          const sortParts = value.split(':');
          if (sortParts.length === 2) {
            if (!options.sort) options.sort = [];
            options.sort.push({
              field: sortParts[0],
              direction: sortParts[1] as 'asc' | 'desc'
            });
          }
          break;
      }
    }

    return options;
  }

  /**
   * Escape HTML for safe rendering
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
