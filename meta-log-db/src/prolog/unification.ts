import { Fact } from '../types/index.js';

/**
 * Unification algorithm for ProLog
 */
export class Unification {
  /**
   * Unify two terms
   */
  static unify(term1: any, term2: any, bindings: Map<string, any> = new Map()): Map<string, any> | null {
    // If terms are identical
    if (term1 === term2) {
      return bindings;
    }

    // If term1 is a variable
    if (this.isVariable(term1)) {
      const value = bindings.get(term1);
      if (value !== undefined) {
        return this.unify(value, term2, bindings);
      }
      bindings.set(term1, term2);
      return bindings;
    }

    // If term2 is a variable
    if (this.isVariable(term2)) {
      const value = bindings.get(term2);
      if (value !== undefined) {
        return this.unify(term1, value, bindings);
      }
      bindings.set(term2, term1);
      return bindings;
    }

    // If both are arrays (compound terms)
    if (Array.isArray(term1) && Array.isArray(term2)) {
      if (term1.length !== term2.length) {
        return null;
      }
      for (let i = 0; i < term1.length; i++) {
        const result = this.unify(term1[i], term2[i], bindings);
        if (result === null) {
          return null;
        }
        bindings = result;
      }
      return bindings;
    }

    // If both are objects
    if (typeof term1 === 'object' && typeof term2 === 'object' && term1 !== null && term2 !== null) {
      const keys1 = Object.keys(term1);
      const keys2 = Object.keys(term2);
      if (keys1.length !== keys2.length) {
        return null;
      }
      for (const key of keys1) {
        if (!keys2.includes(key)) {
          return null;
        }
        const result = this.unify(term1[key], term2[key], bindings);
        if (result === null) {
          return null;
        }
        bindings = result;
      }
      return bindings;
    }

    // Terms don't unify
    return null;
  }

  /**
   * Check if term is a variable (starts with ?)
   */
  static isVariable(term: any): boolean {
    return typeof term === 'string' && term.startsWith('?');
  }

  /**
   * Apply bindings to a term
   */
  static applyBindings(term: any, bindings: Map<string, any>): any {
    if (this.isVariable(term)) {
      return bindings.get(term) || term;
    }

    if (Array.isArray(term)) {
      return term.map(t => this.applyBindings(t, bindings));
    }

    if (typeof term === 'object' && term !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(term)) {
        result[key] = this.applyBindings(value, bindings);
      }
      return result;
    }

    return term;
  }

  /**
   * Merge bindings
   */
  static mergeBindings(bindings1: Map<string, any>, bindings2: Map<string, any>): Map<string, any> | null {
    const merged = new Map(bindings1);
    
    for (const [key, value] of bindings2) {
      const existing = merged.get(key);
      if (existing !== undefined) {
        const unified = this.unify(existing, value, new Map(merged));
        if (unified === null) {
          return null;
        }
        merged.set(key, unified.get(key) || value);
      } else {
        merged.set(key, value);
      }
    }

    return merged;
  }
}
