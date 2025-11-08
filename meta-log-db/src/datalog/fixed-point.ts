import { Fact, DatalogRule, DatalogProgram } from '../types/index.js';

/**
 * Fixed-point computation for DataLog
 */
export class FixedPoint {
  /**
   * Compute fixed point of a DataLog program
   */
  static compute(program: DatalogProgram): Fact[] {
    let facts = new Set<string>(this.factsToStrings(program.facts));
    let previousSize = 0;
    let iterations = 0;
    const maxIterations = 1000;

    while (facts.size !== previousSize && iterations < maxIterations) {
      previousSize = facts.size;
      
      // Apply all rules
      for (const rule of program.rules) {
        const newFacts = this.applyRule(rule, Array.from(facts).map(s => this.stringToFact(s)));
        for (const fact of newFacts) {
          facts.add(this.factToString(fact));
        }
      }

      iterations++;
    }

    return Array.from(facts).map(s => this.stringToFact(s));
  }

  /**
   * Apply a rule to generate new facts
   */
  private static applyRule(rule: DatalogRule, facts: Fact[]): Fact[] {
    const newFacts: Fact[] = [];
    
    // Match body predicates against facts
    const bodyMatches = this.matchBody(rule.body, facts);
    
    // Generate head facts for each match
    for (const match of bodyMatches) {
      const headFact = this.instantiateHead(rule.head, match);
      if (headFact) {
        newFacts.push(headFact);
      }
    }

    return newFacts;
  }

  /**
   * Match body predicates against facts
   */
  private static matchBody(body: string[], facts: Fact[]): Map<string, any>[] {
    if (body.length === 0) {
      return [new Map()];
    }

    const [firstPred, ...restPreds] = body;
    const firstMatches = this.matchPredicate(firstPred, facts);
    const allMatches: Map<string, any>[] = [];

    for (const match of firstMatches) {
      const restMatches = this.matchBody(restPreds, facts);
      for (const restMatch of restMatches) {
        const merged = this.mergeMatches(match, restMatch);
        if (merged) {
          allMatches.push(merged);
        }
      }
    }

    return allMatches;
  }

  /**
   * Match a predicate against facts
   */
  private static matchPredicate(predicate: string, facts: Fact[]): Map<string, any>[] {
    const matches: Map<string, any>[] = [];
    const parsed = this.parsePredicate(predicate);

    for (const fact of facts) {
      if (fact.predicate === parsed.predicate) {
        const match = this.matchArgs(parsed.args, fact.args);
        if (match) {
          matches.push(match);
        }
      }
    }

    return matches;
  }

  /**
   * Match arguments (with variable binding)
   */
  private static matchArgs(patternArgs: string[], factArgs: any[]): Map<string, any> | null {
    if (patternArgs.length !== factArgs.length) {
      return null;
    }

    const bindings = new Map<string, any>();

    for (let i = 0; i < patternArgs.length; i++) {
      const pattern = patternArgs[i];
      const fact = factArgs[i];

      if (pattern.startsWith('?')) {
        // Variable
        const existing = bindings.get(pattern);
        if (existing !== undefined && existing !== fact) {
          return null;
        }
        bindings.set(pattern, fact);
      } else if (pattern !== fact.toString()) {
        // Constant doesn't match
        return null;
      }
    }

    return bindings;
  }

  /**
   * Instantiate head with bindings
   */
  private static instantiateHead(head: string, bindings: Map<string, any>): Fact | null {
    const parsed = this.parsePredicate(head);
    const args: any[] = [];

    for (const arg of parsed.args) {
      if (arg.startsWith('?')) {
        const value = bindings.get(arg);
        if (value === undefined) {
          return null;
        }
        args.push(value);
      } else {
        args.push(arg);
      }
    }

    return { predicate: parsed.predicate, args };
  }

  /**
   * Parse predicate string
   */
  private static parsePredicate(predStr: string): { predicate: string; args: string[] } {
    const match = predStr.match(/^(\w+)\((.*)\)$/);
    if (match) {
      const predicate = match[1];
      const argsStr = match[2];
      const args = argsStr ? argsStr.split(',').map(s => s.trim()) : [];
      return { predicate, args };
    }
    return { predicate: predStr, args: [] };
  }

  /**
   * Merge two match bindings
   */
  private static mergeMatches(match1: Map<string, any>, match2: Map<string, any>): Map<string, any> | null {
    const merged = new Map(match1);
    
    for (const [key, value] of match2) {
      const existing = merged.get(key);
      if (existing !== undefined && existing !== value) {
        return null;
      }
      merged.set(key, value);
    }

    return merged;
  }

  /**
   * Convert fact to string for set operations
   */
  private static factToString(fact: Fact): string {
    return `${fact.predicate}(${fact.args.join(',')})`;
  }

  /**
   * Convert facts to strings
   */
  private static factsToStrings(facts: Fact[]): string[] {
    return facts.map(f => this.factToString(f));
  }

  /**
   * Convert string back to fact
   */
  private static stringToFact(str: string): Fact {
    const match = str.match(/^(\w+)\((.*)\)$/);
    if (match) {
      const predicate = match[1];
      const args = match[2] ? match[2].split(',').map(s => s.trim()) : [];
      return { predicate, args };
    }
    return { predicate: str, args: [] };
  }
}
