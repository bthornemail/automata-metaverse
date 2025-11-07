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
      // Try /jsonl/ path first (public directory)
      const response = await fetch(`/jsonl/${file}`);
      if (response.ok) {
        const text = await response.text();
        return this.parseJSONL(text);
      }
      
      // Try root public directory
      const rootResponse = await fetch(`/${file}`);
      if (rootResponse.ok) {
        const text = await rootResponse.text();
        return this.parseJSONL(text);
      }
      
      throw new Error(`File not found: ${file}`);
    } catch (error) {
      console.warn(`Failed to load local file ${file}:`, error);
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
