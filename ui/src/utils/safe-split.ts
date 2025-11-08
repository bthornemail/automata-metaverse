/**
 * Safe Split Utility
 * Prevents "split is not a function" errors by ensuring input is a string
 */

/**
 * Safely split a string by delimiter
 * Returns empty array if input is not a string
 */
export function safeSplit(input: any, delimiter: string): string[] {
  if (typeof input !== 'string') {
    console.warn('safeSplit: Input is not a string:', typeof input, input);
    return [];
  }
  if (!input || !input.trim()) {
    return [];
  }
  try {
    return input.split(delimiter);
  } catch (error) {
    console.error('safeSplit: Error splitting string:', error);
    return [];
  }
}

/**
 * Safely split and map a string
 */
export function safeSplitMap<T>(
  input: any,
  delimiter: string,
  mapper: (s: string) => T
): T[] {
  const parts = safeSplit(input, delimiter);
  return parts.map(mapper).filter((item): item is T => item !== null && item !== undefined);
}
