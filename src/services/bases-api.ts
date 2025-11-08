/**
 * Bases API Service
 * 
 * Provides bases parsing and conversion functionality for backend API
 * Works with file system (doesn't require Obsidian vault)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Types from bases-parser.ts
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

export interface BaseRow {
  id: string;
  [fieldName: string]: any;
}

export interface BaseEmbedOptions {
  viewId?: string;
  filters?: BaseFilter[];
  sort?: BaseSort[];
  limit?: number;
  fields?: string[];
}

export interface BaseFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'before' | 'after' | 'onOrBefore' | 'onOrAfter';
  value: any;
}

export interface BaseSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ConversionOptions {
  fields?: BaseField[];
  delimiter?: string;
  includeMetadata?: boolean;
  format?: 'jsonl' | 'canvasl';
}

export interface RoundTripResult {
  original: string;
  base: BaseFile;
  converted: string;
  lossless: boolean;
}

/**
 * Bases API Service
 * File-system based implementation (doesn't require Obsidian)
 */
export class BasesApiService {
  private basePath: string;

  constructor(basePath: string = './') {
    this.basePath = basePath;
  }

  /**
   * Parse a base file
   */
  async parseBase(filePath: string): Promise<BaseFile> {
    const fullPath = path.resolve(this.basePath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(content);
      
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
   * Parse markdown file as base
   */
  private parseMarkdownBase(content: string, filePath: string): BaseFile {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      throw new Error(`File does not contain valid base structure: ${filePath}`);
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    const fields = this.parseYamlFields(frontmatter);
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

        if (value.includes('|')) {
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

      if (line.includes('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        fields.forEach((field, index) => {
          if (cells[index]) {
            row[field.name] = this.parseCellValue(cells[index], field.type);
          }
        });
      } else {
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
   * Convert file to base format
   */
  async convertToBase(filePath: string, options: ConversionOptions = {}): Promise<BaseFile> {
    const fullPath = path.resolve(this.basePath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const extension = filePath.split('.').pop()?.toLowerCase();
    const isCanvasL = filePath.endsWith('.canvasl');

    switch (extension) {
      case 'jsonl':
      case 'canvasl':
        return this.parseJSONL(content, { isCanvasL, ...options });
      case 'csv':
        return this.parseCSV(content, options);
      case 'json':
        return this.parseJSON(content, options);
      case 'md':
        return this.parseMarkdown(content, options);
      case 'tsv':
        return this.parseTSV(content, options);
      case 'base':
        return this.parseBase(filePath);
      default:
        throw new Error(`Unsupported file type for base conversion: ${extension}`);
    }
  }

  /**
   * Parse JSONL/CanvasL to base
   */
  private parseJSONL(content: string, options: { isCanvasL?: boolean; includeMetadata?: boolean } = {}): BaseFile {
    const lines = content.split('\n').filter(line => line.trim());
    const directives: string[] = [];
    const nodes: any[] = [];
    const edges: any[] = [];
    const other: any[] = [];

    // Extract CanvasL directives
    if (options.isCanvasL) {
      for (const line of lines) {
        if (line.startsWith('@')) {
          directives.push(line);
          continue;
        }
      }
    }

    // Parse JSONL entries
    for (const line of lines) {
      if (line.startsWith('@')) continue;
      
      try {
        const entry = JSON.parse(line);
        
        if (entry.type === 'node' || entry.id && (entry.x !== undefined || entry.y !== undefined)) {
          nodes.push(entry);
        } else if (entry.type === 'edge' || entry.fromNode || entry.toNode) {
          edges.push(entry);
        } else {
          other.push(entry);
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    // Create fields from all unique keys
    const allEntries = [...nodes, ...edges, ...other];
    const fieldSet = new Set<string>();
    allEntries.forEach(entry => {
      Object.keys(entry).forEach(key => fieldSet.add(key));
    });

    const fields: BaseField[] = Array.from(fieldSet).map(key => ({
      name: key,
      type: this.inferFieldTypeFromValue(allEntries.find(e => e[key] !== undefined)?.[key])
    }));

    // Convert entries to rows
    const rows: BaseRow[] = allEntries.map((entry, index) => ({
      id: entry.id || `row-${index + 1}`,
      ...entry
    }));

    const base: BaseFile = {
      type: 'base',
      version: '1.0',
      schema: {
        version: '1.0',
        fields: fields
      },
      data: rows,
      _metadata: options.includeMetadata ? {
        sourceFormat: options.isCanvasL ? 'canvasl' : 'jsonl',
        nodeCount: nodes.length,
        edgeCount: edges.length,
        otherCount: other.length,
        directives: options.isCanvasL ? directives : undefined
      } : undefined
    };

    return base;
  }

  /**
   * Infer field type from actual value
   */
  private inferFieldTypeFromValue(value: any): BaseField['type'] {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      if (this.isDate(value)) return 'date';
      if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
      if (value.includes('@') && value.includes('.')) return 'email';
    }
    return 'text';
  }

  /**
   * Parse CSV to base
   */
  private parseCSV(content: string, options: ConversionOptions): BaseFile {
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
  private parseJSON(content: string, options: ConversionOptions): BaseFile {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('JSON array is empty');
      }

      const firstItem = data[0];
      const fields: BaseField[] = Object.keys(firstItem).map(key => ({
        name: key,
        type: this.inferFieldTypeFromValue(firstItem[key])
      }));

      const rows: BaseRow[] = data.map((item, index) => ({
        id: item.id || `row-${index + 1}`,
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
    } else {
      // Single object
      const fields: BaseField[] = Object.keys(data).map(key => ({
        name: key,
        type: this.inferFieldTypeFromValue(data[key])
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
  }

  /**
   * Parse Markdown table to base
   */
  private parseMarkdown(content: string, options: ConversionOptions): BaseFile {
    const lines = content.split('\n').filter(line => line.trim());
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 2) {
      throw new Error('Markdown file does not contain a valid table');
    }

    // Parse header
    const headerLine = tableLines[0];
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h && !h.match(/^[-:]+$/));
    
    const fields: BaseField[] = headers.map(header => ({
      name: header,
      type: 'text'
    }));

    // Parse rows (skip header and separator)
    const rows: BaseRow[] = tableLines.slice(2).map((line, index) => {
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
  private parseTSV(content: string, options: ConversionOptions): BaseFile {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('TSV file is empty');
    }

    const headers = lines[0].split('\t').map(h => h.trim());
    
    const fields: BaseField[] = headers.map(header => ({
      name: header,
      type: 'text'
    }));

    const rows: BaseRow[] = lines.slice(1).map((line, index) => {
      const values = line.split('\t').map(v => v.trim());
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
   * Convert base to JSONL/CanvasL
   */
  async convertBaseToJSONL(base: BaseFile, options: ConversionOptions = {}): Promise<string> {
    const format = options.format || 'jsonl';
    const lines: string[] = [];

    // Add CanvasL directives if converting to CanvasL
    if (format === 'canvasl' && base._metadata?.directives) {
      base._metadata.directives.forEach(directive => lines.push(directive));
    }

    // Convert rows to JSONL entries
    base.data.forEach(row => {
      const entry: any = { ...row };
      delete entry.id; // Remove id if it was auto-generated
      lines.push(JSON.stringify(entry));
    });

    return lines.join('\n');
  }

  /**
   * Round-trip test: JSONL → Base → JSONL
   */
  async roundTripJSONL(filePath: string): Promise<RoundTripResult> {
    const fullPath = path.resolve(this.basePath, filePath);
    const original = await fs.readFile(fullPath, 'utf-8');
    
    const base = await this.convertToBase(filePath, { includeMetadata: true });
    const converted = await this.convertBaseToJSONL(base, { 
      format: filePath.endsWith('.canvasl') ? 'canvasl' : 'jsonl'
    });

    // Compare original and converted (normalize whitespace)
    const originalLines = original.split('\n').filter(l => l.trim()).map(l => l.trim());
    const convertedLines = converted.split('\n').filter(l => l.trim()).map(l => l.trim());
    
    const lossless = originalLines.length === convertedLines.length &&
      originalLines.every((line, i) => {
        try {
          const origObj = JSON.parse(line);
          const convObj = JSON.parse(convertedLines[i]);
          return JSON.stringify(origObj) === JSON.stringify(convObj);
        } catch {
          return line === convertedLines[i];
        }
      });

    return {
      original,
      base,
      converted,
      lossless
    };
  }

  /**
   * Create base embed HTML
   */
  async createBaseEmbed(basePath: string, options: BaseEmbedOptions = {}): Promise<string> {
    const base = await this.parseBase(basePath);
    
    let filteredRows = base.data;
    if (options.filters && options.filters.length > 0) {
      filteredRows = this.applyFilters(filteredRows, options.filters);
    }

    if (options.sort && options.sort.length > 0) {
      filteredRows = this.applySort(filteredRows, options.sort);
    }

    if (options.limit) {
      filteredRows = filteredRows.slice(0, options.limit);
    }

    const fieldsToShow = options.fields || base.schema.fields.map(f => f.name);

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
    
    html += '<thead><tr>';
    for (const fieldName of fields) {
      const field = base.schema.fields.find(f => f.name === fieldName);
      html += `<th>${this.escapeHtml(field?.name || fieldName)}</th>`;
    }
    html += '</tr></thead>';
    
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const fieldName of fields) {
        const value = row[fieldName];
        html += `<td>${this.escapeHtml(this.formatCellValue(value))}</td>`;
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
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML || text.replace(/[&<>"']/g, (m) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return map[m];
    });
  }

  /**
   * List base files in directory
   */
  async listBaseFiles(directory: string = '.'): Promise<string[]> {
    const fullPath = path.resolve(this.basePath, directory);
    const files = await fs.readdir(fullPath);
    return files.filter(file => 
      file.endsWith('.base') || file.endsWith('.base.json')
    );
  }

  /**
   * Save base file
   */
  async saveBase(base: BaseFile, filePath: string): Promise<void> {
    const fullPath = path.resolve(this.basePath, filePath);
    const content = JSON.stringify(base, null, 2);
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}
