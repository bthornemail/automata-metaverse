/**
 * Harmonic Vector Generation
 * 
 * Generates harmonic vectors from data for deterministic addressing and
 * geometric computations in the computational topology canvas.
 * 
 * Integration with automaton system:
 * - Deterministic addressing for R5RS functions
 * - Vector-based node identification
 * - Geometric computations for canvas visualization
 */

/**
 * Convert data to bytes for vector computation
 */
function toBytes(data: any): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Uint8Array) return data;
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (typeof data === 'object') return new TextEncoder().encode(JSON.stringify(data));
  if (typeof data === 'number') {
    return new Uint8Array([data & 0xFF, (data >> 8) & 0xFF, (data >> 16) & 0xFF, (data >> 24) & 0xFF]);
  }
  return new TextEncoder().encode(String(data));
}

/**
 * Generate harmonic vector from data
 * 
 * Returns [hypotenuse, sin, cos, tan, length] vector
 */
export function generateHarmonicVector(data: any): number[] {
  const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const bytes = toBytes(data);
  const h = Math.hypot(...Array.from(bytes));
  const sin = Math.sin(h / Math.PI);
  const cos = Math.cos(h / PHI);
  const tan = Math.tan(Math.PI / (h || 1e-10));
  return [h, sin, cos, tan, bytes.length];
}

/**
 * Harmonize input to a single hash value
 */
export function harmonize(input: any): number {
  const s = JSON.stringify(input);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/**
 * Computational Quantum Engine for vector binding
 */
export class ComputationalQuantumEngine {
  /**
   * Bind two vectors together
   */
  bind(a: number[], b: number[]): { bound: number[] } {
    const maxLength = Math.max(a.length, b.length);
    const bound: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      bound.push((a[i] || 0) + (b[i] || 0));
    }
    return { bound };
  }
}
