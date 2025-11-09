/**
 * JSONL Loader Utility
 * 
 * Browser-side JSONL file loader that works with files in public/jsonl/
 */

export interface JSONLLoaderOptions {
  /** File name to load */
  filename: string;
  /** Base path for JSONL files (default: /jsonl/) */
  basePath?: string;
  /** Fallback to API if local file fails */
  fallbackToAPI?: boolean;
}

export interface JSONLLoadResult {
  data: any[];
  source: 'local' | 'api' | 'error';
  filename: string;
  itemCount: number;
}

/**
 * Load JSONL file from browser-side folder
 */
export async function loadJSONLFromBrowser(
  filename: string,
  options: Partial<JSONLLoaderOptions> = {}
): Promise<JSONLLoadResult> {
  const {
    basePath = '/jsonl/',
    fallbackToAPI = true
  } = options;

  const filePath = `${basePath}${filename}`;

  // Try local file first
  try {
    console.log(`[JSONL Loader] Attempting to load: ${filePath}`);
    const response = await fetch(filePath);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // Check if response is JSON (from API) or text (from static file)
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return {
            data,
            source: 'local',
            filename,
            itemCount: data.length
          };
        }
        // If it's an API response wrapper
        if (data.success && Array.isArray(data.data)) {
          return {
            data: data.data,
            source: 'local',
            filename,
            itemCount: data.data.length
          };
        }
      }
      
      // Otherwise, treat as text and parse JSONL
      const text = await response.text();
      if (typeof text !== 'string') {
        console.warn(`[JSONL Loader] Unexpected response type for ${filename}, expected string`);
        return {
          data: [],
          source: 'error',
          filename,
          itemCount: 0
        };
      }
      
      // Ensure text is a string before splitting
      if (typeof text !== 'string') {
        console.warn(`[JSONL Loader] Expected string, got ${typeof text}`);
        return {
          data: [],
          source: 'error',
          filename,
          itemCount: 0
        };
      }
      
      const lines = text.trim().split('\n').filter((line: string) => line && line.trim());
      const data = lines.map((line: string, index: number) => {
        try {
          if (!line || typeof line !== 'string' || !line.trim()) {
            return null;
          }
          const parsed = JSON.parse(line.trim());
          // Ensure parsed result is an object
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
          }
          console.warn(`[JSONL Loader] Line ${index + 1} parsed to non-object:`, typeof parsed);
          return null;
        } catch (e) {
          console.warn(`[JSONL Loader] Failed to parse line ${index + 1}:`, e);
          return null;
        }
      }).filter((item): item is any => item !== null && typeof item === 'object');

      console.log(`[JSONL Loader] ✓ Loaded ${data.length} items from local file: ${filename}`);
      return {
        data,
        source: 'local',
        filename,
        itemCount: data.length
      };
    } else {
      console.warn(`[JSONL Loader] Local file not found (${response.status}): ${filePath}`);
    }
  } catch (error) {
    console.warn(`[JSONL Loader] Local file load failed:`, error);
  }

  // Fallback to API if enabled
  if (fallbackToAPI) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const apiResponse = await fetch(`${apiUrl}/jsonl/${filename}`);
      
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        if (result.success && result.data) {
          console.log(`[JSONL Loader] ✓ Loaded ${result.data.length} items from API: ${filename}`);
          return {
            data: result.data,
            source: 'api',
            filename,
            itemCount: result.data.length
          };
        }
      }
    } catch (error) {
      console.warn(`[JSONL Loader] API fallback failed:`, error);
    }
  }

  // Return empty result if both fail
  console.error(`[JSONL Loader] ✗ Failed to load ${filename} from both local and API`);
  return {
    data: [],
    source: 'error',
    filename,
    itemCount: 0
  };
}

/**
 * Load multiple JSONL files from browser-side folder
 */
export async function loadMultipleJSONLFromBrowser(
  filenames: string[],
  options: Partial<JSONLLoaderOptions> = {}
): Promise<Record<string, JSONLLoadResult>> {
  const results: Record<string, JSONLLoadResult> = {};
  
  await Promise.all(
    filenames.map(async (filename) => {
      results[filename] = await loadJSONLFromBrowser(filename, options);
    })
  );

  return results;
}

/**
 * List available JSONL files in browser-side folder
 */
export async function listAvailableJSONLFiles(
  basePath: string = '/jsonl/'
): Promise<string[]> {
  // Since we can't list directory contents from browser,
  // we'll try to fetch common filenames
  const commonFiles = [
    'generate.metaverse.jsonl',
    'automaton-kernel.jsonl',
    'automaton.jsonl',
    'r5rs-functions-trie.jsonl',
    'automaton.canvas.space.jsonl',
    'automaton-kernel.seed.jsonl'
  ];

  const available: string[] = [];
  
  await Promise.all(
    commonFiles.map(async (filename) => {
      try {
        const response = await fetch(`${basePath}${filename}`, { method: 'HEAD' });
        if (response.ok) {
          available.push(filename);
        }
      } catch {
        // File not available
      }
    })
  );

  return available;
}
