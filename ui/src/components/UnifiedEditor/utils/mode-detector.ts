/**
 * Mode Detection Utilities
 * Detects file type and appropriate editor mode based on filename and content
 */

export type EditorMode = 'code' | 'canvas' | 'hybrid' | 'base';
export type FileType = 'jsonl' | 'canvasl' | 'base' | 'code';

/**
 * Detect file type from filename
 */
export function detectFileType(filename: string): FileType {
  const lower = filename.toLowerCase();
  
  if (lower.endsWith('.base')) {
    return 'base';
  }
  if (lower.endsWith('.canvasl')) {
    return 'canvasl';
  }
  if (lower.endsWith('.jsonl')) {
    return 'jsonl';
  }
  
  return 'code';
}

/**
 * Check if file is JSONL format
 */
export function isJSONLFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.jsonl');
}

/**
 * Check if file is CanvasL format
 */
export function isCanvasLFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.canvasl');
}

/**
 * Check if file is Base format
 */
export function isBaseFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.base');
}

/**
 * Check if file is a code file (not JSONL/CanvasL/Base)
 */
export function isCodeFile(filename: string): boolean {
  const fileType = detectFileType(filename);
  return fileType === 'code';
}

/**
 * Detect appropriate editor mode from filename
 */
export function detectFileMode(filename: string): EditorMode {
  const fileType = detectFileType(filename);
  
  switch (fileType) {
    case 'base':
      return 'base';
    case 'jsonl':
    case 'canvasl':
      return 'canvas';
    case 'code':
      return 'code';
    default:
      return 'code';
  }
}

/**
 * Detect mode from content (for auto-detection)
 */
export function detectModeFromContent(content: string): EditorMode {
  if (!content.trim()) {
    return 'code';
  }
  
  // Try to parse as JSONL
  try {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = JSON.parse(lines[0]);
      if (firstLine.id && (firstLine.type === 'text' || firstLine.type === 'file' || 
          firstLine.type === 'node' || firstLine.type === 'vertical' || 
          firstLine.type === 'horizontal')) {
        return 'canvas';
      }
    }
  } catch {
    // Not JSONL, continue
  }
  
  return 'code';
}

/**
 * Get language from filename
 */
export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'md': 'markdown',
    'pl': 'prolog',
    'prolog': 'prolog',
    'dl': 'datalog',
    'datalog': 'datalog',
    'canvasl': 'canvasl',
    'jsonl': 'jsonl'
  };
  
  return languageMap[ext || ''] || 'javascript';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return '.' + parts[parts.length - 1];
  }
  return '';
}
