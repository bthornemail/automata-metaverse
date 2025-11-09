/**
 * Bases Service - Frontend API Client
 * 
 * Provides bases parsing, conversion, and embedding functionality
 */

import { apiService } from './api';

// Re-export types for frontend use
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
  format?: 'jsonl' | 'canvasl';
  includeMetadata?: boolean;
}

export interface RoundTripResult {
  original: string;
  base: BaseFile;
  converted: string;
  lossless: boolean;
}

/**
 * Bases Service Class
 */
class BasesService {
  /**
   * Parse a base file
   */
  async parseBase(filePath: string): Promise<BaseFile> {
    const response = await apiService.request<BaseFile>('/bases/parse', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to parse base file');
    }
    
    return response.data;
  }

  /**
   * Convert file to base format
   */
  async convertToBase(filePath: string, options?: ConversionOptions): Promise<BaseFile> {
    const response = await apiService.request<BaseFile>('/bases/convert', {
      method: 'POST',
      body: JSON.stringify({ filePath, options }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to convert file to base');
    }
    
    return response.data;
  }

  /**
   * Convert base to JSONL/CanvasL
   */
  async convertBaseToJSONL(base: BaseFile, options?: ConversionOptions): Promise<string> {
    const response = await apiService.request<string>('/bases/convert-back', {
      method: 'POST',
      body: JSON.stringify({ base, options: { ...options, format: 'jsonl' } }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to convert base to JSONL');
    }
    
    return response.data;
  }

  /**
   * Convert base to CanvasL
   */
  async convertBaseToCanvasL(base: BaseFile, options?: ConversionOptions): Promise<string> {
    const response = await apiService.request<string>('/bases/convert-back', {
      method: 'POST',
      body: JSON.stringify({ base, options: { ...options, format: 'canvasl' } }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to convert base to CanvasL');
    }
    
    return response.data;
  }

  /**
   * Round-trip test: JSONL → Base → JSONL
   */
  async roundTripJSONL(filePath: string): Promise<RoundTripResult> {
    const response = await apiService.request<RoundTripResult>('/bases/roundtrip', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to perform round-trip test');
    }
    
    return response.data;
  }

  /**
   * Get base embed HTML
   */
  async getBaseEmbed(basePath: string, options?: BaseEmbedOptions): Promise<string> {
    const response = await apiService.request<string>('/bases/embed', {
      method: 'POST',
      body: JSON.stringify({ filePath: basePath, options }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get base embed');
    }
    
    return response.data;
  }

  /**
   * List available base files
   */
  async listBaseFiles(dirPath: string = '.'): Promise<string[]> {
    const response = await apiService.request<string[]>('/bases/list', {
      method: 'GET',
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list base files');
    }
    
    return response.data;
  }

  /**
   * Save base file
   */
  async saveBase(base: BaseFile, filePath: string): Promise<void> {
    const response = await apiService.request('/bases/save', {
      method: 'POST',
      body: JSON.stringify({ base, filePath }),
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save base file');
    }
  }
}

export const basesService = new BasesService();
