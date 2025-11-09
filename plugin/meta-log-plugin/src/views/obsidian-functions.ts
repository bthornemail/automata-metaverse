/**
 * Obsidian Functions Interface
 * 
 * Provides integration with Obsidian's function system
 * Supports Obsidian functions: dataview, file operations, date/time, etc.
 * 
 * Reference: https://help.obsidian.md/bases/functions
 */

import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';

/**
 * Obsidian Functions Interface
 * 
 * Provides access to Obsidian's function system for use in Meta-Log views
 */
export class ObsidianFunctions {
  private plugin: ObsidianMetaLogPlugin;

  constructor(plugin: ObsidianMetaLogPlugin) {
    this.plugin = plugin;
  }

  /**
   * Execute an Obsidian function
   * 
   * @param functionName - Name of the function to execute
   * @param args - Arguments to pass to the function
   * @returns Result of the function execution
   */
  async execute(functionName: string, ...args: any[]): Promise<any> {
    if (!this.plugin.app) {
      throw new Error('Obsidian app not available');
    }

    // Try to access Obsidian's function system
    try {
      // Check if Dataview API is available
      if (this.plugin.app.plugins?.plugins?.['dataview']) {
        const dataview = this.plugin.app.plugins.plugins['dataview'];
        if (dataview.api && typeof dataview.api[functionName] === 'function') {
          return await dataview.api[functionName](...args);
        }
      }

      // Fallback: use app's internal functions if available
      if (this.plugin.app[functionName] && typeof this.plugin.app[functionName] === 'function') {
        return await this.plugin.app[functionName](...args);
      }

      throw new Error(`Function ${functionName} not found`);
    } catch (error) {
      console.warn(`Error executing function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * File System Functions
   */

  /**
   * Get file by path
   */
  async getFile(path: string): Promise<any> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }
    return this.plugin.app.vault.getAbstractFileByPath(path);
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<string> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!file || file.extension !== 'md') {
      throw new Error(`File not found or not a markdown file: ${path}`);
    }
    return await this.plugin.app.vault.read(file as any);
  }

  /**
   * Write file content
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (file) {
      await this.plugin.app.vault.modify(file as any, content);
    } else {
      await this.plugin.app.vault.create(path, content);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(path: string): Promise<string[]> {
    if (!this.plugin.app || !this.plugin.app.vault) {
      throw new Error('Obsidian vault not available');
    }
    const folder = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      return [];
    }
    const files: string[] = [];
    // Recursively collect files
    this.collectFiles(folder as any, files);
    return files;
  }

  private collectFiles(folder: any, files: string[]): void {
    if (folder.children) {
      for (const child of folder.children) {
        if (child.extension === 'md') {
          files.push(child.path);
        } else if (child.children) {
          this.collectFiles(child, files);
        }
      }
    }
  }

  /**
   * Date/Time Functions
   */

  /**
   * Get current date
   */
  now(): Date {
    return new Date();
  }

  /**
   * Format date
   */
  formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    // Simple date formatting (full implementation would use a date library)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', String(date.getHours()).padStart(2, '0'))
      .replace('mm', String(date.getMinutes()).padStart(2, '0'))
      .replace('ss', String(date.getSeconds()).padStart(2, '0'));
  }

  /**
   * Parse date string
   */
  parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * String Functions
   */

  /**
   * Join array with separator
   */
  join(array: any[], separator: string = ', '): string {
    return array.join(separator);
  }

  /**
   * Split string into array
   */
  split(str: string, separator: string): string[] {
    return str.split(separator);
  }

  /**
   * Replace text in string
   */
  replace(str: string, search: string, replace: string): string {
    return str.replace(new RegExp(search, 'g'), replace);
  }

  /**
   * Get substring
   */
  substring(str: string, start: number, end?: number): string {
    return str.substring(start, end);
  }

  /**
   * Array Functions
   */

  /**
   * Map array
   */
  map<T, U>(array: T[], fn: (item: T, index: number) => U): U[] {
    return array.map(fn);
  }

  /**
   * Filter array
   */
  filter<T>(array: T[], fn: (item: T, index: number) => boolean): T[] {
    return array.filter(fn);
  }

  /**
   * Reduce array
   */
  reduce<T, U>(array: T[], fn: (acc: U, item: T, index: number) => U, initial: U): U {
    return array.reduce(fn, initial);
  }

  /**
   * Sort array
   */
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...array].sort(compareFn);
  }

  /**
   * Object Functions
   */

  /**
   * Get object keys
   */
  keys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }

  /**
   * Get object values
   */
  values(obj: Record<string, any>): any[] {
    return Object.values(obj);
  }

  /**
   * Get object entries
   */
  entries(obj: Record<string, any>): [string, any][] {
    return Object.entries(obj);
  }

  /**
   * Math Functions
   */

  /**
   * Sum array of numbers
   */
  sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  /**
   * Average of numbers
   */
  average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return this.sum(numbers) / numbers.length;
  }

  /**
   * Min value
   */
  min(numbers: number[]): number {
    return Math.min(...numbers);
  }

  /**
   * Max value
   */
  max(numbers: number[]): number {
    return Math.max(...numbers);
  }

  /**
   * Round number
   */
  round(num: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }

  /**
   * Meta-Log Specific Functions
   */

  /**
   * Query Meta-Log database
   */
  async queryMetaLog(query: string, queryType: 'prolog' | 'datalog' | 'sparql' = 'prolog'): Promise<any> {
    const db = this.plugin.getDb();
    
    switch (queryType) {
      case 'prolog':
        return await db.prologQuery(query);
      case 'datalog':
        return await db.datalogQuery(query);
      case 'sparql':
        return await db.sparqlQuery(query);
      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  /**
   * Extract facts from canvas
   */
  extractFacts(): any[] {
    return this.plugin.getDb().extractFacts();
  }

  /**
   * Load canvas file
   */
  async loadCanvas(path: string): Promise<void> {
    await this.plugin.loadCanvas(path);
  }

  /**
   * Get canvas facts count
   */
  getFactsCount(): number {
    return this.plugin.getDb().extractFacts().length;
  }

  /**
   * Register custom function
   */
  registerFunction(name: string, fn: (...args: any[]) => any): void {
    (this as any)[name] = fn;
  }

  /**
   * Call registered function
   */
  callFunction(name: string, ...args: any[]): any {
    if (typeof (this as any)[name] === 'function') {
      return (this as any)[name](...args);
    }
    throw new Error(`Function ${name} not registered`);
  }
}
