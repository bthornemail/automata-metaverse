/**
 * Database Service - Frontend
 * 
 * Database-agnostic service layer for frontend
 * Works with any backend database adapter
 */

import { apiService } from './api';
import { localFileService } from './local-file-service';

export interface DatabaseService {
  // JSONL operations
  readJSONL(file: string): Promise<any[]>;
  writeJSONL(file: string, data: any[]): Promise<void>;
  appendJSONL(file: string, data: any): Promise<void>;
  queryJSONL(file: string, predicate: (item: any) => boolean): Promise<any[]>;

  // R5RS Function operations
  getR5RSFunction(name: string): Promise<any>;
  listR5RSFunctions(pattern?: string): Promise<string[]>;
  invokeR5RSFunction(name: string, args: any[], context?: any): Promise<any>;
  registerR5RSFunction(name: string, definition: any): Promise<void>;

  // Generic CRUD operations
  create(collection: string, data: any): Promise<string>;
  read(collection: string, id: string): Promise<any>;
  update(collection: string, id: string, data: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, filter?: any, options?: QueryOptions): Promise<any[]>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  projection?: string[];
}

class DatabaseServiceImpl implements DatabaseService {
  /**
   * Read JSONL file - tries local browser first, then falls back to API
   */
  async readJSONL(file: string): Promise<any[]> {
    // Try local file first (from public/jsonl/ directory)
    try {
      const data = await localFileService.loadFromPublic(file);
      if (data.length > 0) {
        console.log(`✓ Loaded ${data.length} items from local file: ${file}`);
        return data;
      }
    } catch (localError) {
      console.log(`Local file not found (${file}), trying API...`);
    }

    // Fallback to API (only if local fails)
    try {
      const response = await apiService.getJsonlFile(file);
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log(`✓ Loaded ${response.data.length} items from API: ${file}`);
        return response.data;
      }
    } catch (apiError) {
      console.warn(`Failed to load from API: ${file}`, apiError);
    }

    // If both fail, return empty array
    console.warn(`⚠ Could not load JSONL file: ${file} (tried local and API)`);
    return [];
  }

  async writeJSONL(file: string, data: any[]): Promise<void> {
    await apiService.appendToJsonlFile(file, { data });
  }

  async appendJSONL(file: string, data: any): Promise<void> {
    await apiService.appendToJsonlFile(file, data);
  }

  async queryJSONL(file: string, predicate: (item: any) => boolean): Promise<any[]> {
    const data = await this.readJSONL(file);
    return data.filter(predicate);
  }

  async getR5RSFunction(name: string): Promise<any> {
    const response = await apiService.request(`/r5rs/functions/${name}`);
    return response.success ? response.data : null;
  }

  async listR5RSFunctions(pattern?: string): Promise<string[]> {
    const url = pattern 
      ? `/r5rs/functions?pattern=${encodeURIComponent(pattern)}`
      : '/r5rs/functions';
    const response = await apiService.request<string[]>(url);
    return response.success && Array.isArray(response.data) ? response.data : [];
  }

  async invokeR5RSFunction(name: string, args: any[], context?: any): Promise<any> {
    const response = await apiService.request(`/r5rs/functions/${name}/invoke`, {
      method: 'POST',
      body: JSON.stringify({ args, context })
    });
    return response.success ? response.data : null;
  }

  async registerR5RSFunction(name: string, definition: any): Promise<void> {
    await apiService.request(`/r5rs/functions/${name}/register`, {
      method: 'POST',
      body: JSON.stringify(definition)
    });
  }

  async create(collection: string, data: any): Promise<string> {
    const response = await apiService.request<{ id: string }>(`/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.success && response.data ? response.data.id : '';
  }

  async read(collection: string, id: string): Promise<any> {
    const response = await apiService.request(`/${collection}/${id}`);
    return response.success ? response.data : null;
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    await apiService.request(`/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await apiService.request(`/${collection}/${id}`, {
      method: 'DELETE'
    });
  }

  async query(collection: string, filter?: any, options?: QueryOptions): Promise<any[]> {
    const params = new URLSearchParams();
    if (filter) params.append('filter', JSON.stringify(filter));
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sort) params.append('sort', JSON.stringify(options.sort));
    if (options?.projection) params.append('projection', options.projection.join(','));

    const url = `/${collection}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiService.request<any[]>(url);
    return response.success && Array.isArray(response.data) ? response.data : [];
  }
}

export const databaseService: DatabaseService = new DatabaseServiceImpl();
