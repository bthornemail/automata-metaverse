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
            // Validate all entries are objects, not strings
            const validated = data.filter((item): item is any => {
              if (item === null || item === undefined) return false;
              if (typeof item === 'string') {
                // If it's a string, try to parse it
                try {
                  const parsed = JSON.parse(item);
                  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
                } catch {
                  return false;
                }
              }
              return typeof item === 'object' && !Array.isArray(item);
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
            console.log(`✓ Loaded ${validated.length} items from browser-side JSON: /jsonl/${file}`);
            return validated;
          }
          // API response wrapper
          if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
            if (Array.isArray(data.data)) {
              // Validate array entries
              const validated = data.data.filter((item): item is any => {
                if (item === null || item === undefined) return false;
                if (typeof item === 'string') {
                  try {
                    const parsed = JSON.parse(item);
                    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
                  } catch {
                    return false;
                  }
                }
                return typeof item === 'object' && !Array.isArray(item);
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
              console.log(`✓ Loaded ${validated.length} items from browser-side API response: /jsonl/${file}`);
              return validated;
            } else if (typeof data.data === 'string') {
              // If data.data is a string (JSONL), parse it
              const parsed = this.parseJSONL(data.data);
              console.log(`✓ Parsed ${parsed.length} items from API JSONL string: /jsonl/${file}`);
              return parsed;
            }
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

  parseJSONL(text: string | any[]): any[] {
    // If already an array, validate and return it
    if (Array.isArray(text)) {
      // Validate array entries are objects (not strings that need parsing)
      return text.filter((item): item is any => {
        if (item === null || item === undefined) {
          return false;
        }
        // If it's a string, try to parse it as JSON
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item);
            return typeof parsed === 'object' && parsed !== null;
          } catch {
            return false;
          }
        }
        // Otherwise, ensure it's an object
        return typeof item === 'object';
      }).map(item => {
        // If item is a string, parse it
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }
        return item;
      }).filter((item): item is any => item !== null);
    }
    
    // Guard against non-string input
    if (typeof text !== 'string') {
      console.warn('parseJSONL received non-string, non-array input:', typeof text, text);
      return [];
    }
    
    // Handle empty or whitespace-only strings
    if (!text || !text.trim()) {
      return [];
    }
    
    try {
      // Ensure text is a string before splitting
      if (typeof text !== 'string') {
        console.error('parseJSONL: Cannot split non-string:', typeof text);
        return [];
      }
      
      // Split by newlines and filter empty lines
      const lines = text.trim().split('\n').filter((line: string) => line && line.trim());
      const data = lines.map((line: string, index: number) => {
        try {
          // Skip empty lines
          if (!line || typeof line !== 'string' || !line.trim()) {
            return null;
          }
          const parsed = JSON.parse(line.trim());
          // Ensure parsed result is an object
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed;
          }
          console.warn(`Line ${index + 1} parsed to non-object:`, typeof parsed);
          return null;
        } catch (e) {
          console.warn(`Failed to parse JSONL line ${index + 1}:`, line.substring(0, 100), e);
          return null;
        }
      }).filter((item): item is any => item !== null && typeof item === 'object');
      return data;
    } catch (error) {
      console.error('Error parsing JSONL:', error);
      return [];
    }
  }
}

export const localFileService = new LocalFileServiceImpl();
