/**
 * Obsidian Bases Parser
 * 
 * Provides parsing and embedding support for Obsidian Bases
 * 
 * Reference: https://help.obsidian.md/bases/create-base
 * Reference: https://help.obsidian.md/bases
 */

import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';

/**
 * Base file structure
 */
export interface BaseFile {
  type: 'base';
  version: string;
  schema: {
    version: string;
    fields: BaseField[];
  };
  data: BaseRow[];
  _metadata?: {
    sourceFormat?: 'jsonl' | 'canvasl' | 'csv' | 'json' | 'md' | 'tsv';
    nodeCount?: number;
    edgeCount?: number;
    otherCount?: number;
    directives?: string[];
    [key: string]: any;
  };
}

/**
 * Base field definition
 */
export interface BaseField {
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'multiselect' | 'file' | 'url' | 'email' | 'phone' | 'formula' | 'rollup' | 'relation' | 'created' | 'updated' | 'button';
  options?: any;
  formula?: string;
  relation?: {
    baseId: string;
    fieldId: string;
  };
  rollup?: {
    relationFieldId: string;
    targetFieldId: string;
    function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'checked' | 'unchecked' | 'percentChecked' | 'earliestDate' | 'latestDate' | 'dateRange' | 'dateRangeDays' | 'dateRangeWeeks' | 'dateRangeMonths' | 'dateRangeYears';
  };
}

/**
 * Base row data
 */
export interface BaseRow {
  id: string;
  [fieldName: string]: any;
}

/**
 * Base embed options
 */
export interface BaseEmbedOptions {
  viewId?: string;
  filters?: BaseFilter[];
  sort?: BaseSort[];
  limit?: number;
  fields?: string[];
}

/**
 * Base filter
 */
export interface BaseFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'before' | 'after' | 'onOrBefore' | 'onOrAfter';
  value: any;
}

/**
 * Base sort
 */
export interface BaseSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Obsidian Bases Parser
 * 
 * Provides functionality to parse, embed, and manipulate Obsidian bases
 */
export class ObsidianBasesParser {
  private plugin: ObsidianMetaLogPlugin;

  constructor(plugin: ObsidianMetaLogPlugin) {
    this.plugin = plugin;
  }

  /**
   * Parse a base file
   */
  async parseBase(filePath: string): Promise<BaseFile> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }

    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`Base file not found: ${filePath}`);
    }

    const content = await this.plugin.app.vault.read(file as any);
    
    try {
      // Try parsing as JSON first (base files are JSON)
      const parsed = JSON.parse(content);
      
      // Validate base structure
      if (parsed.type !== 'base') {
        throw new Error(`File is not a base: ${filePath}`);
      }

      return parsed as BaseFile;
    } catch (error) {
      // If not JSON, try parsing as markdown with frontmatter
      return this.parseMarkdownBase(content, filePath);
    }
  }

  /**
   * Parse markdown file as base (with frontmatter)
   */
  private parseMarkdownBase(content: string, filePath: string): BaseFile {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      throw new Error(`File does not contain valid base structure: ${filePath}`);
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    // Parse frontmatter as YAML
    const fields = this.parseYamlFields(frontmatter);
    
    // Parse body as rows (each line is a row)
    const rows = this.parseRows(body, fields);

    return {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: fields
      },
      data: rows
    };
  }

  /**
   * Parse YAML fields from frontmatter
   */
  private parseYamlFields(frontmatter: string): BaseField[] {
    const fields: BaseField[] = [];
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, name, value] = match;
        const field: BaseField = {
          name: name.trim(),
          type: this.inferFieldType(value)
        };

        // Handle special field types
        if (value.includes('|')) {
          // Select or multiselect
          const options = value.split('|').map(o => o.trim());
          if (options.length > 1) {
            field.type = 'select';
            field.options = options;
          }
        }

        fields.push(field);
      }
    }

    return fields;
  }

  /**
   * Infer field type from value
   */
  private inferFieldType(value: string): BaseField['type'] {
    if (value === 'true' || value === 'false') return 'checkbox';
    if (!isNaN(Number(value))) return 'number';
    if (this.isDate(value)) return 'date';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
    if (value.includes('@') && value.includes('.')) return 'email';
    return 'text';
  }

  /**
   * Check if string is a date
   */
  private isDate(value: string): boolean {
    return !isNaN(Date.parse(value));
  }

  /**
   * Parse rows from body
   */
  private parseRows(body: string, fields: BaseField[]): BaseRow[] {
    const rows: BaseRow[] = [];
    const lines = body.split('\n').filter(line => line.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const row: BaseRow = {
        id: `row-${i + 1}`
      };

      // Parse line based on field structure
      // Simple CSV-like parsing or markdown table parsing
      if (line.includes('|')) {
        // Markdown table row
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        fields.forEach((field, index) => {
          if (cells[index]) {
            row[field.name] = this.parseCellValue(cells[index], field.type);
          }
        });
      } else {
        // Simple line parsing (first field is usually the identifier)
        const parts = line.split(/\s+/);
        fields.forEach((field, index) => {
          if (parts[index]) {
            row[field.name] = this.parseCellValue(parts[index], field.type);
          }
        });
      }

      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse cell value based on field type
   */
  private parseCellValue(value: string, type: BaseField['type']): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'checkbox':
        return value === 'true' || value === 'x' || value === '✓';
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  /**
   * Create base embed HTML
   */
  async createBaseEmbed(basePath: string, options: BaseEmbedOptions = {}): Promise<string> {
    const base = await this.parseBase(basePath);
    
    // Filter rows
    let filteredRows = base.data;
    if (options.filters && options.filters.length > 0) {
      filteredRows = this.applyFilters(filteredRows, options.filters);
    }

    // Sort rows
    if (options.sort && options.sort.length > 0) {
      filteredRows = this.applySort(filteredRows, options.sort);
    }

    // Limit rows
    if (options.limit) {
      filteredRows = filteredRows.slice(0, options.limit);
    }

    // Select fields
    const fieldsToShow = options.fields || base.schema.fields.map(f => f.name);

    // Generate HTML table
    return this.generateBaseTable(base, filteredRows, fieldsToShow);
  }

  /**
   * Apply filters to rows
   */
  private applyFilters(rows: BaseRow[], filters: BaseFilter[]): BaseRow[] {
    return rows.filter(row => {
      return filters.every(filter => {
        const value = row[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'notEquals':
            return value !== filter.value;
          case 'contains':
            return String(value).includes(String(filter.value));
          case 'notContains':
            return !String(value).includes(String(filter.value));
          case 'isEmpty':
            return value === null || value === undefined || value === '';
          case 'isNotEmpty':
            return value !== null && value !== undefined && value !== '';
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'greaterThanOrEqual':
            return Number(value) >= Number(filter.value);
          case 'lessThanOrEqual':
            return Number(value) <= Number(filter.value);
          case 'before':
            return new Date(value) < new Date(filter.value);
          case 'after':
            return new Date(value) > new Date(filter.value);
          case 'onOrBefore':
            return new Date(value) <= new Date(filter.value);
          case 'onOrAfter':
            return new Date(value) >= new Date(filter.value);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Apply sort to rows
   */
  private applySort(rows: BaseRow[], sorts: BaseSort[]): BaseRow[] {
    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Generate HTML table from base
   */
  private generateBaseTable(base: BaseFile, rows: BaseRow[], fields: string[]): string {
    let html = '<div class="obsidian-base-embed">';
    html += '<table class="base-table">';
    
    // Header
    html += '<thead><tr>';
    for (const fieldName of fields) {
      const field = base.schema.fields.find(f => f.name === fieldName);
      html += `<th>${field?.name || fieldName}</th>`;
    }
    html += '</tr></thead>';
    
    // Body
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const fieldName of fields) {
        const value = row[fieldName];
        html += `<td>${this.formatCellValue(value)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
    html += '</div>';
    
    return html;
  }

  /**
   * Format cell value for display
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? '✓' : '';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  }

  /**
   * Convert file to base format
   * 
   * Supports converting various file types to base format
   * Now includes JSONL and CanvasL support
   */
  async convertToBase(filePath: string, options: {
    fields?: BaseField[];
    delimiter?: string;
  } = {}): Promise<BaseFile> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }

    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await this.plugin.app.vault.read(file as any);
    const extension = filePath.split('.').pop()?.toLowerCase();
    const isCanvasL = filePath.endsWith('.canvasl');

    switch (extension) {
      case 'jsonl':
      case 'canvasl':
        return this.parseJSONL(content, { isCanvasL });
      case 'csv':
        return this.parseCSV(content, options);
      case 'json':
        return this.parseJSON(content, options);
      case 'md':
        return this.parseMarkdown(content, options);
      case 'tsv':
        return this.parseTSV(content, options);
      default:
        throw new Error(`Unsupported file type for base conversion: ${extension}`);
    }
  }

  /**
   * Parse CSV to base
   */
  private parseCSV(content: string, options: any): BaseFile {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const delimiter = options.delimiter || ',';
    const headers = lines[0].split(delimiter).map(h => h.trim());
    
    const fields: BaseField[] = headers.map(header => ({
      name: header,
      type: 'text'
    }));

    const rows: BaseRow[] = lines.slice(1).map((line, index) => {
      const values = line.split(delimiter).map(v => v.trim());
      const row: BaseRow = {
        id: `row-${index + 1}`
      };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: fields
      },
      data: rows
    };
  }

  /**
   * Parse JSON to base
   */
  private parseJSON(content: string, options: any): BaseFile {
    const data = JSON.parse(content);
    
    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('JSON array is empty');
      }

      const firstItem = data[0];
      const fields: BaseField[] = Object.keys(firstItem).map(key => ({
        name: key,
        type: this.inferFieldType(String(firstItem[key]))
      }));

      const rows: BaseRow[] = data.map((item, index) => ({
        id: `row-${index + 1}`,
        ...item
      }));

      return {
        type: 'base',
        version: '1.0',
        schema: {
          version: '1.0',
          fields: fields
        },
        data: rows
      };
    }

    // Handle single object
    const fields: BaseField[] = Object.keys(data).map(key => ({
      name: key,
      type: this.inferFieldType(String(data[key]))
    }));

    return {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: fields
      },
      data: [{
        id: 'row-1',
        ...data
      }]
    };
  }

  /**
   * Parse Markdown table to base
   */
  private parseMarkdown(content: string, options: any): BaseFile {
    // Extract markdown table
    const tableMatch = content.match(/\|(.+)\|\n\|[-\s\|]+\|\n((?:\|.+\|\n?)+)/);
    
    if (!tableMatch) {
      throw new Error('Markdown file does not contain a table');
    }

    const headerLine = tableMatch[1];
    const bodyLines = tableMatch[2].split('\n').filter(line => line.trim());

    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    
    const fields: BaseField[] = headers.map(header => ({
      name: header,
      type: 'text'
    }));

    const rows: BaseRow[] = bodyLines.map((line, index) => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      const row: BaseRow = {
        id: `row-${index + 1}`
      };
      headers.forEach((header, i) => {
        row[header] = cells[i] || '';
      });
      return row;
    });

    return {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: fields
      },
      data: rows
    };
  }

  /**
   * Parse TSV to base
   */
  private parseTSV(content: string, options: any): BaseFile {
    return this.parseCSV(content, { ...options, delimiter: '\t' });
  }

  /**
   * Parse JSONL/CanvasL to base format
   * 
   * Converts JSONL/CanvasL canvas structure to base format
   * Nodes and edges become rows, preserving all metadata
   */
  private parseJSONL(content: string, options: { isCanvasL?: boolean } = {}): BaseFile {
    const lines = content.split('\n').filter(line => line.trim());
    const objects: any[] = [];
    const directives: string[] = [];
    let currentDirective: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Handle CanvasL directives
      if (options.isCanvasL && trimmed.startsWith('@')) {
        const match = trimmed.match(/^@(\w+)\s*(.*)$/);
        if (match) {
          currentDirective = match[1];
          directives.push(trimmed);
          if (match[2]) {
            objects.push({ 
              _type: 'directive',
              _directive: `@${currentDirective}`,
              _value: match[2]
            });
          }
        }
        continue;
      }

      // Parse JSONL lines
      if (trimmed && trimmed.startsWith('{')) {
        try {
          const obj = JSON.parse(trimmed);
          if (currentDirective) {
            obj._directive = `@${currentDirective}`;
          }
          objects.push(obj);
        } catch (error) {
          console.warn(`Failed to parse JSONL line: ${trimmed.substring(0, 100)}`);
        }
      }
    }

    // Organize into base structure
    const nodes: any[] = [];
    const edges: any[] = [];
    const other: any[] = [];

    for (const obj of objects) {
      if (obj.type === 'node' || (obj.id && (obj.x !== undefined || obj.y !== undefined))) {
        nodes.push(obj);
      } else if (obj.type === 'edge' || obj.fromNode || obj.toNode || obj.from || obj.to) {
        edges.push(obj);
      } else {
        other.push(obj);
      }
    }

    // Create fields for nodes
    const nodeFields: BaseField[] = [
      { name: 'id', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'x', type: 'number' },
      { name: 'y', type: 'number' },
      { name: 'text', type: 'text' }
    ];

    // Collect all unique keys from nodes for dynamic fields
    const nodeKeys = new Set<string>();
    nodes.forEach(node => {
      Object.keys(node).forEach(key => {
        if (!['id', 'type', 'x', 'y', 'text'].includes(key)) {
          nodeKeys.add(key);
        }
      });
    });

    // Add dynamic fields
    nodeKeys.forEach(key => {
      const sampleValue = nodes.find(n => n[key] !== undefined)?.[key];
      nodeFields.push({
        name: key,
        type: this.inferFieldType(String(sampleValue))
      });
    });

    // Create fields for edges
    const edgeFields: BaseField[] = [
      { name: 'id', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'fromNode', type: 'text' },
      { name: 'toNode', type: 'text' }
    ];

    // Collect all unique keys from edges
    const edgeKeys = new Set<string>();
    edges.forEach(edge => {
      Object.keys(edge).forEach(key => {
        if (!['id', 'type', 'fromNode', 'toNode', 'from', 'to'].includes(key)) {
          edgeKeys.add(key);
        }
      });
    });

    edgeKeys.forEach(key => {
      const sampleValue = edges.find(e => e[key] !== undefined)?.[key];
      edgeFields.push({
        name: key,
        type: this.inferFieldType(String(sampleValue))
      });
    });

    // Convert nodes to rows
    const nodeRows: BaseRow[] = nodes.map((node, index) => {
      const row: BaseRow = {
        id: node.id || `node-${index + 1}`,
        type: node.type || 'node',
        x: node.x || 0,
        y: node.y || 0,
        text: node.text || ''
      };
      
      // Add dynamic fields
      nodeKeys.forEach(key => {
        row[key] = node[key];
      });
      
      return row;
    });

    // Convert edges to rows
    const edgeRows: BaseRow[] = edges.map((edge, index) => {
      const row: BaseRow = {
        id: edge.id || `edge-${index + 1}`,
        type: edge.type || 'edge',
        fromNode: edge.fromNode || edge.from || '',
        toNode: edge.toNode || edge.to || ''
      };
      
      // Add dynamic fields
      edgeKeys.forEach(key => {
        row[key] = edge[key];
      });
      
      return row;
    });

    // Combine all rows
    const allRows = [...nodeRows, ...edgeRows];

    // If we have directives, add them as metadata
    if (directives.length > 0) {
      allRows.unshift({
        id: '_directives',
        type: 'directive',
        _directives: directives.join('\n')
      });
    }

    // Use node fields as primary schema (most common)
    const primaryFields = nodeRows.length > 0 ? nodeFields : edgeFields;

    return {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: primaryFields
      },
      data: allRows,
      _metadata: {
        sourceFormat: options.isCanvasL ? 'canvasl' : 'jsonl',
        nodeCount: nodes.length,
        edgeCount: edges.length,
        otherCount: other.length,
        directives: directives
      }
    } as any;
  }

  /**
   * Convert base format back to JSONL
   * 
   * Converts base rows back to JSONL canvas format
   */
  async convertBaseToJSONL(base: BaseFile, options: {
    format?: 'jsonl' | 'canvasl';
    includeMetadata?: boolean;
  } = {}): Promise<string> {
    const format = options.format || 'jsonl';
    const lines: string[] = [];

    // Add CanvasL directives if present
    if (format === 'canvasl' && (base as any)._metadata?.directives) {
      (base as any)._metadata.directives.forEach((dir: string) => {
        lines.push(dir);
      });
    }

    // Convert rows back to JSONL objects
    for (const row of base.data) {
      // Skip directive rows
      if (row.id === '_directives' || row.type === 'directive') {
        continue;
      }

      const obj: any = { ...row };
      delete obj.id; // Remove base row ID if it's not the original ID

      // Restore node structure
      if (row.type === 'node' || (row.x !== undefined && row.y !== undefined)) {
        obj.type = 'node';
        if (!obj.id && row.id) {
          obj.id = row.id;
        }
      }

      // Restore edge structure
      if (row.type === 'edge' || row.fromNode || row.toNode) {
        obj.type = 'edge';
        if (row.fromNode) obj.fromNode = row.fromNode;
        if (row.toNode) obj.toNode = row.toNode;
        // Handle 'from'/'to' aliases
        if (row.from && !row.fromNode) obj.fromNode = row.from;
        if (row.to && !row.toNode) obj.toNode = row.to;
      }

      // Remove base-specific metadata
      delete obj._directive;
      delete obj._directives;

      // Preserve all other fields
      const jsonLine = JSON.stringify(obj);
      lines.push(jsonLine);
    }

    return lines.join('\n');
  }

  /**
   * Convert base format back to CanvasL
   * 
   * Converts base rows back to CanvasL format with directives
   */
  async convertBaseToCanvasL(base: BaseFile, options: {
    includeMetadata?: boolean;
  } = {}): Promise<string> {
    return this.convertBaseToJSONL(base, { format: 'canvasl', ...options });
  }

  /**
   * Round-trip conversion: JSONL → Base → JSONL
   * 
   * Ensures data integrity through conversion cycle
   */
  async roundTripJSONL(filePath: string): Promise<{
    original: string;
    base: BaseFile;
    converted: string;
    lossless: boolean;
  }> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }

    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const original = await this.plugin.app.vault.read(file as any);
    const isCanvasL = filePath.endsWith('.canvasl');
    
    // Convert to base
    const base = await this.convertToBase(filePath);
    
    // Convert back to JSONL
    const converted = await this.convertBaseToJSONL(base, { 
      format: isCanvasL ? 'canvasl' : 'jsonl' 
    });

    // Check for data loss (simplified check)
    const originalLines = original.split('\n').filter((l: string) => l.trim() && l.trim().startsWith('{'));
    const convertedLines = converted.split('\n').filter((l: string) => l.trim() && l.trim().startsWith('{'));
    
    const lossless = originalLines.length === convertedLines.length;

    return {
      original,
      base,
      converted,
      lossless
    };
  }

  /**
   * Render base embed in container
   */
  async renderBaseEmbed(
    basePath: string,
    container: HTMLElement,
    options: BaseEmbedOptions = {}
  ): Promise<void> {
    const html = await this.createBaseEmbed(basePath, options);
    container.innerHTML = html;
    
    // Add CSS styling
    this.addBaseStyles(container);
  }

  /**
   * Add CSS styles for base embeds
   */
  private addBaseStyles(container: HTMLElement): void {
    if (!container.querySelector('style[data-base-styles]')) {
      const style = container.createEl('style', { attr: { 'data-base-styles': 'true' } });
      style.textContent = `
        .obsidian-base-embed {
          width: 100%;
          overflow-x: auto;
        }
        .obsidian-base-embed .base-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--background-modifier-border);
        }
        .obsidian-base-embed .base-table th,
        .obsidian-base-embed .base-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--background-modifier-border);
        }
        .obsidian-base-embed .base-table th {
          background-color: var(--background-secondary);
          font-weight: 600;
        }
        .obsidian-base-embed .base-table tr:hover {
          background-color: var(--background-modifier-hover);
        }
      `;
    }
  }
}
