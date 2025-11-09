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
   * Read JSONL or CanvasL file - tries local browser first, then falls back to API
   * Supports both .jsonl and .canvasl extensions
   */
  async readJSONL(file: string): Promise<any[]> {
    // Normalize file extension - support both .jsonl and .canvasl
    const normalizedFile = file.endsWith('.canvasl') ? file : file;
    // Try local file first (from public/jsonl/ directory)
    try {
      const data = await localFileService.loadFromPublic(file);
      // Ensure we always return an array of objects
      if (Array.isArray(data)) {
        // Validate all entries are objects
        const validated = data.filter((item): item is any => {
          if (item === null || item === undefined) return false;
          // If it's a string, it needs parsing (shouldn't happen, but handle it)
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              return typeof parsed === 'object' && parsed !== null;
            } catch {
              return false;
            }
          }
          return typeof item === 'object';
        }).map(item => {
          // Parse string entries
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          }
          return item;
        }).filter((item): item is any => item !== null);
        
        if (validated.length > 0) {
          console.log(`✓ Loaded ${validated.length} items from local file: ${file}`);
          return validated;
        }
        console.log(`✓ Loaded empty array from local file: ${file}`);
        return [];
      }
    } catch (localError) {
      console.log(`Local file not found (${file}), trying API...`);
    }

    // Fallback to API (only if local fails)
    try {
      const response = await apiService.getJsonlFile(file);
      if (response.success && response.data) {
        // Handle case where API returns a string (JSONL content)
        if (typeof response.data === 'string') {
          const parsed = localFileService.parseJSONL(response.data);
          console.log(`✓ Parsed ${parsed.length} items from API JSONL string: ${file}`);
          return parsed;
        }
        // Handle case where API returns an array
        if (Array.isArray(response.data)) {
          // Validate array entries
          const validated = response.data.filter((item): item is any => {
            if (item === null || item === undefined) return false;
            if (typeof item === 'string') {
              try {
                const parsed = JSON.parse(item);
                return typeof parsed === 'object' && parsed !== null;
              } catch {
                return false;
              }
            }
            return typeof item === 'object';
          }).map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch {
                return null;
              }
            }
            return item;
          }).filter((item): item is any => item !== null);
          console.log(`✓ Loaded ${validated.length} items from API array: ${file}`);
          return validated;
        }
        // Handle case where API returns wrapped data
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          const wrappedData = (response.data as any).data;
          if (Array.isArray(wrappedData)) {
            const validated = wrappedData.filter((item): item is any => {
              if (item === null || item === undefined) return false;
              if (typeof item === 'string') {
                try {
                  const parsed = JSON.parse(item);
                  return typeof parsed === 'object' && parsed !== null;
                } catch {
                  return false;
                }
              }
              return typeof item === 'object';
            }).map(item => {
              if (typeof item === 'string') {
                try {
                  return JSON.parse(item);
                } catch {
                  return null;
                }
              }
              return item;
            }).filter((item): item is any => item !== null);
            console.log(`✓ Loaded ${validated.length} items from API wrapped response: ${file}`);
            return validated;
          }
        }
      }
    } catch (apiError) {
      console.warn(`Failed to load from API: ${file}`, apiError);
    }

    // If both fail, return empty array
    console.warn(`⚠ Could not load JSONL file: ${file} (tried local and API)`);
    return [];
  }

  async writeJSONL(file: string, data: any[]): Promise<void> {
    // Support both .jsonl and .canvasl files
    await apiService.appendToJsonlFile(file, { data });
  }

  async appendJSONL(file: string, data: any): Promise<void> {
    // Support both .jsonl and .canvasl files
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
