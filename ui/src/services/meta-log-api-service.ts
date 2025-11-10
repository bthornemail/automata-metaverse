/**
 * Meta-Log API Service
 * Provides API-based access to Meta-Log database functionality
 * Falls back to basic implementation if API is not available
 */

import { apiService } from './api';

export interface MetaLogApiService {
  prologQuery(query: string, canvasFile?: string): Promise<any>;
  datalogQuery(query: string, program?: any, canvasFile?: string): Promise<any>;
  sparqlQuery(query: string, canvasFile?: string): Promise<any>;
  loadCanvas(canvasFile: string): Promise<void>;
  isAvailable(): boolean;
}

class MetaLogApiServiceImpl implements MetaLogApiService {
  private available: boolean = false;

  constructor() {
    // Check if Meta-Log API is available
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Try to ping the API endpoint
      const response = await fetch('/api/meta-log/health', { method: 'HEAD' });
      this.available = response.ok;
    } catch {
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async loadCanvas(canvasFile: string): Promise<void> {
    if (!this.available) {
      return;
    }

    try {
      await apiService.post('/api/meta-log/load', { canvasFile });
    } catch (error) {
      console.warn('Failed to load canvas via Meta-Log API:', error);
    }
  }

  async prologQuery(query: string, canvasFile?: string): Promise<any> {
    if (!this.available) {
      throw new Error('Meta-Log API not available');
    }

    try {
      const response = await apiService.post('/api/meta-log/prolog', {
        query,
        canvasFile
      });
      return response.data;
    } catch (error) {
      console.error('Meta-Log Prolog query failed:', error);
      throw error;
    }
  }

  async datalogQuery(query: string, program?: any, canvasFile?: string): Promise<any> {
    if (!this.available) {
      throw new Error('Meta-Log API not available');
    }

    try {
      const response = await apiService.post('/api/meta-log/datalog', {
        query,
        program,
        canvasFile
      });
      return response.data;
    } catch (error) {
      console.error('Meta-Log DataLog query failed:', error);
      throw error;
    }
  }

  async sparqlQuery(query: string, canvasFile?: string): Promise<any> {
    if (!this.available) {
      throw new Error('Meta-Log API not available');
    }

    try {
      const response = await apiService.post('/api/meta-log/sparql', {
        query,
        canvasFile
      });
      return response.data;
    } catch (error) {
      console.error('Meta-Log SPARQL query failed:', error);
      throw error;
    }
  }
}

export const metaLogApiService: MetaLogApiService = new MetaLogApiServiceImpl();
