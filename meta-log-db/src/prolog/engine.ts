import { Fact, PrologQueryResult, PrologRule } from '../types/index.js';
import { Resolution } from './resolution.js';
import { Unification } from './unification.js';

/**
 * ProLog Engine for Meta-Log Database
 */
export class PrologEngine {
  private facts: Fact[] = [];
  private rules: PrologRule[] = [];

  /**
   * Add facts to the database
   */
  addFacts(facts: Fact[]): void {
    this.facts.push(...facts);
  }

  /**
   * Add a rule to the database
   */
  addRule(rule: PrologRule): void {
    this.rules.push(rule);
  }

  /**
   * Build database from facts
   */
  buildDb(facts: Fact[]): void {
    this.facts = [...facts];
  }

  /**
   * Query the database
   */
  async query(goal: string): Promise<PrologQueryResult> {
    const results = Resolution.resolve(goal, this.facts, this.rules);
    
    // Convert results to bindings format
    const bindings: Record<string, any>[] = [];
    
    for (const resultBindings of results) {
      const binding: Record<string, any> = {};
      for (const [key, value] of resultBindings) {
        binding[key] = value;
      }
      bindings.push(binding);
    }

    return { bindings };
  }

  /**
   * Get all facts
   */
  getFacts(): Fact[] {
    return [...this.facts];
  }

  /**
   * Get all rules
   */
  getRules(): PrologRule[] {
    return [...this.rules];
  }

  /**
   * Clear database
   */
  clear(): void {
    this.facts = [];
    this.rules = [];
  }
}
