/**
 * Local File Service
 * 
 * Handles loading JSONL files directly from the browser
 * Supports both public directory files and file picker
 */

export interface LocalFileService {
  /**
   * Load JSONL file from public directory
   */
  loadFromPublic(file: string): Promise<any[]>;
  
  /**
   * Load JSONL file from user-selected file
   */
  loadFromFilePicker(): Promise<{ data: any[]; filename: string } | null>;
  
  /**
   * Parse JSONL text content
   */
  parseJSONL(text: string): any[];
}

class LocalFileServiceImpl implements LocalFileService {
  async loadFromPublic(file: string): Promise<any[]> {
    try {
      // Browser-side folder: ui/public/jsonl/ → /jsonl/{file}
      // Vite serves files from public/ directory at root
      const response = await fetch(`/jsonl/${file}`, {
        cache: 'no-cache', // Ensure fresh data
        headers: {
          'Accept': 'text/plain, application/json, */*'
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        
        // If it's JSON (from API proxy), parse as JSON
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`✓ Loaded ${data.length} items from browser-side JSON: /jsonl/${file}`);
            return data;
          }
          // API response wrapper
          if (data && typeof data === 'object' && 'success' in data && 'data' in data && Array.isArray(data.data)) {
            console.log(`✓ Loaded ${data.data.length} items from browser-side API response: /jsonl/${file}`);
            return data.data;
          }
          console.warn(`Unexpected JSON response format for ${file}`);
          return [];
        }
        
        // Otherwise, treat as text/JSONL and parse line by line
        const text = await response.text();
        if (typeof text !== 'string' || !text.trim()) {
          console.warn(`Empty or invalid response for ${file}`);
          return [];
        }
        
        const data = this.parseJSONL(text);
        console.log(`✓ Loaded ${data.length} items from browser-side JSONL file: /jsonl/${file}`);
        return data;
      }
      
      // Fallback: Try root public directory
      const rootResponse = await fetch(`/${file}`, {
        cache: 'no-cache',
        headers: {
          'Accept': 'text/plain, application/json, */*'
        }
      });
      
      if (rootResponse.ok) {
        const text = await rootResponse.text();
        if (typeof text === 'string' && text.trim()) {
          const data = this.parseJSONL(text);
          console.log(`✓ Loaded ${data.length} items from browser-side root file: /${file}`);
          return data;
        }
      }
      
      throw new Error(`File not found in browser-side folder: ${file} (tried /jsonl/${file} and /${file})`);
    } catch (error: any) {
      console.warn(`Failed to load browser-side file ${file}:`, error.message);
      throw error;
    }
  }

  async loadFromFilePicker(): Promise<{ data: any[]; filename: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.jsonl,.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = this.parseJSONL(text);
          resolve({ data, filename: file.name });
        } catch (error) {
          console.error('Failed to read file:', error);
          resolve(null);
        }
      };
      input.click();
    });
  }

  parseJSONL(text: string): any[] {
    // Guard against non-string input
    if (typeof text !== 'string') {
      console.warn('parseJSONL received non-string input:', typeof text);
      return Array.isArray(text) ? text : [];
    }
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    const data = lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.warn(`Failed to parse JSONL line ${index + 1}:`, line.substring(0, 100));
        return null;
      }
    }).filter(Boolean);
    return data;
  }
}

export const localFileService = new LocalFileServiceImpl();
