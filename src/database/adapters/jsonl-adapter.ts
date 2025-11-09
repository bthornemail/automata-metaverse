/**
 * JSONL Database Adapter
 * 
 * Implements database interface using JSONL files
 * Optimized for R5RS function storage and automaton data
 */

import { DatabaseAdapter, QueryOptions, Transaction } from '../interface';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'path';

export class JSONLAdapter implements DatabaseAdapter {
  private basePath: string;
  private connected: boolean = false;
  private transactions: Map<string, Transaction> = new Map();
  private r5rsFunctions: Map<string, any> = new Map();

  constructor(basePath: string = './data') {
    this.basePath = basePath;
    // Ensure base directory exists
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
    // Load R5RS function registry
    this.loadR5RSFunctions();
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async readJSONL(filePath: string): Promise<any[]> {
    const fullPath = join(this.basePath, filePath);
    if (!existsSync(fullPath)) {
      return [];
    }
    
    const content = readFileSync(fullPath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim().startsWith('{'))
      .map(line => JSON.parse(line));
  }

  async writeJSONL(filePath: string, data: any[]): Promise<void> {
    const fullPath = join(this.basePath, filePath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    const content = data.map(item => JSON.stringify(item)).join('\n') + '\n';
    writeFileSync(fullPath, content, 'utf-8');
  }

  async appendJSONL(filePath: string, data: any): Promise<void> {
    const fullPath = join(this.basePath, filePath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    appendFileSync(fullPath, JSON.stringify(data) + '\n', 'utf-8');
  }

  async queryJSONL(filePath: string, predicate: (item: any) => boolean): Promise<any[]> {
    const data = await this.readJSONL(filePath);
    return data.filter(predicate);
  }

  async getR5RSFunction(functionName: string): Promise<any> {
    // Check in-memory cache first
    if (this.r5rsFunctions.has(functionName)) {
      return this.r5rsFunctions.get(functionName);
    }
    
    // Load from JSONL registry
    const registry = await this.readJSONL('r5rs-functions-trie.jsonl');
    const func = registry.find((item: any) => 
      item.id === functionName || 
      item.function === functionName ||
      item.id?.endsWith(`-${functionName}`)
    );
    
    if (func) {
      this.r5rsFunctions.set(functionName, func);
    }
    
    return func || null;
  }

  async listR5RSFunctions(pattern?: string): Promise<string[]> {
    const registry = await this.readJSONL('r5rs-functions-trie.jsonl');
    let functions = registry
      .filter((item: any) => item.type === 'node' && item.function)
      .map((item: any) => item.function || item.id);
    
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      functions = functions.filter((name: string) => regex.test(name));
    }
    
    return [...new Set(functions)];
  }

  async registerR5RSFunction(functionName: string, definition: any): Promise<void> {
    this.r5rsFunctions.set(functionName, definition);
    
    // Persist to JSONL registry
    const registryPath = join(this.basePath, 'r5rs-functions-trie.jsonl');
    await this.appendJSONL('r5rs-functions-trie.jsonl', {
      id: `r5rs-${functionName}`,
      type: 'function',
      function: functionName,
      definition,
      registeredAt: new Date().toISOString()
    });
  }

  async invokeR5RSFunction(functionName: string, args: any[], context?: any): Promise<any> {
    const func = await this.getR5RSFunction(functionName);
    if (!func) {
      throw new Error(`R5RS function not found: ${functionName}`);
    }
    
    // In a real implementation, this would invoke the Scheme function
    // For now, return the function definition with args
    return {
      function: functionName,
      args,
      context,
      definition: func
    };
  }

  async create(collection: string, data: any): Promise<string> {
    const id = data.id || `${collection}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    
    await this.appendJSONL(`${collection}.jsonl`, item);
    return id;
  }

  async read(collection: string, id: string): Promise<any | null> {
    const items = await this.readJSONL(`${collection}.jsonl`);
    return items.find((item: any) => item.id === id) || null;
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    const items = await this.readJSONL(`${collection}.jsonl`);
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item not found: ${id} in ${collection}`);
    }
    
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    await this.writeJSONL(`${collection}.jsonl`, items);
  }

  async delete(collection: string, id: string): Promise<void> {
    const items = await this.readJSONL(`${collection}.jsonl`);
    const filtered = items.filter((item: any) => item.id !== id);
    await this.writeJSONL(`${collection}.jsonl`, filtered);
  }

  async query(collection: string, filter: any, options?: QueryOptions): Promise<any[]> {
    let items = await this.readJSONL(`${collection}.jsonl`);
    
    // Apply filter
    if (filter) {
      items = items.filter((item: any) => {
        return Object.keys(filter).every(key => {
          const filterValue = filter[key];
          const itemValue = item[key];
          
          if (typeof filterValue === 'object' && filterValue !== null) {
            // Support operators like { $gt: 10 }, { $regex: 'pattern' }
            if ('$gt' in filterValue) return itemValue > filterValue.$gt;
            if ('$lt' in filterValue) return itemValue < filterValue.$lt;
            if ('$regex' in filterValue) {
              const regex = new RegExp(filterValue.$regex, 'i');
              return regex.test(String(itemValue));
            }
            if ('$in' in filterValue) return filterValue.$in.includes(itemValue);
          }
          
          return itemValue === filterValue;
        });
      });
    }
    
    // Apply sorting
    if (options?.sort) {
      items.sort((a, b) => {
        for (const sort of options.sort!) {
          const aVal = a[sort.field];
          const bVal = b[sort.field];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }
    
    // Apply pagination
    if (options?.offset) {
      items = items.slice(options.offset);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    
    // Apply projection
    if (options?.projection) {
      items = items.map(item => {
        const projected: any = {};
        options.projection!.forEach(field => {
          projected[field] = item[field];
        });
        return projected;
      });
    }
    
    return items;
  }

  async batchCreate(collection: string, items: any[]): Promise<string[]> {
    const ids: string[] = [];
    for (const item of items) {
      const id = await this.create(collection, item);
      ids.push(id);
    }
    return ids;
  }

  async batchUpdate(collection: string, updates: { id: string; data: any }[]): Promise<void> {
    for (const update of updates) {
      await this.update(collection, update.id, update.data);
    }
  }

  async batchDelete(collection: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(collection, id);
    }
  }

  async beginTransaction(): Promise<Transaction> {
    const transaction: Transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startedAt: new Date()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async commitTransaction(transaction: Transaction): Promise<void> {
    this.transactions.delete(transaction.id);
  }

  async rollbackTransaction(transaction: Transaction): Promise<void> {
    this.transactions.delete(transaction.id);
  }

  async createCollection(collection: string, schema?: any): Promise<void> {
    const filePath = join(this.basePath, `${collection}.jsonl`);
    if (!existsSync(filePath)) {
      writeFileSync(filePath, '', 'utf-8');
    }
  }

  async dropCollection(collection: string): Promise<void> {
    const filePath = join(this.basePath, `${collection}.jsonl`);
    if (existsSync(filePath)) {
      const { unlinkSync } = require('fs');
      unlinkSync(filePath);
    }
  }

  async listCollections(): Promise<string[]> {
    const { readdirSync } = require('fs');
    const files = readdirSync(this.basePath);
    return files
      .filter((file: string) => file.endsWith('.jsonl'))
      .map((file: string) => file.replace('.jsonl', ''));
  }

  async createIndex(collection: string, fields: string[]): Promise<void> {
    // JSONL doesn't support indexes, but we can track them for query optimization
    const indexPath = join(this.basePath, `${collection}.index.json`);
    const indexes = existsSync(indexPath) 
      ? JSON.parse(readFileSync(indexPath, 'utf-8'))
      : {};
    
    indexes[fields.join('-')] = { fields, createdAt: new Date().toISOString() };
    writeFileSync(indexPath, JSON.stringify(indexes, null, 2), 'utf-8');
  }

  async dropIndex(collection: string, indexName: string): Promise<void> {
    const indexPath = join(this.basePath, `${collection}.index.json`);
    if (existsSync(indexPath)) {
      const indexes = JSON.parse(readFileSync(indexPath, 'utf-8'));
      delete indexes[indexName];
      writeFileSync(indexPath, JSON.stringify(indexes, null, 2), 'utf-8');
    }
  }

  private loadR5RSFunctions(): void {
    // Load R5RS functions from r5rs-functions-trie.jsonl if it exists
    const registryPath = join(this.basePath, 'r5rs-functions-trie.jsonl');
    if (existsSync(registryPath)) {
      try {
        const registry = this.readJSONL('r5rs-functions-trie.jsonl');
        registry.forEach((item: any) => {
          if (item.function) {
            this.r5rsFunctions.set(item.function, item);
          }
        });
      } catch (error) {
        console.warn('Failed to load R5RS function registry:', error);
      }
    }
  }
}
