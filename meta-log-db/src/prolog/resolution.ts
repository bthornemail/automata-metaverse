import { Fact, PrologRule } from '../types/index.js';
import { Unification } from './unification.js';

/**
 * SLD Resolution for ProLog
 */
export class Resolution {
  /**
   * Resolve a goal against facts and rules
   */
  static resolve(
    goal: string,
    facts: Fact[],
    rules: PrologRule[],
    bindings: Map<string, any> = new Map()
  ): Map<string, any>[] {
    const results: Map<string, any>[] = [];

    // Parse goal
    const goalTerm = this.parseTerm(goal);

    // Try to match against facts
    for (const fact of facts) {
      const factTerm = { predicate: fact.predicate, args: fact.args };
      const unified = Unification.unify(goalTerm, factTerm, new Map(bindings));
      if (unified !== null) {
        results.push(unified);
      }
    }

    // Try to match against rules
    for (const rule of rules) {
      const ruleHead = this.parseTerm(rule.head);
      const unified = Unification.unify(goalTerm, ruleHead, new Map(bindings));
      if (unified !== null) {
        // Resolve body goals
        const bodyResults = this.resolveBody(rule.body, facts, rules, unified);
        results.push(...bodyResults);
      }
    }

    return results;
  }

  /**
   * Resolve body goals
   */
  private static resolveBody(
    body: string[],
    facts: Fact[],
    rules: PrologRule[],
    bindings: Map<string, any>
  ): Map<string, any>[] {
    if (body.length === 0) {
      return [bindings];
    }

    const [firstGoal, ...restGoals] = body;
    const firstResults = this.resolve(firstGoal, facts, rules, bindings);
    const allResults: Map<string, any>[] = [];

    for (const result of firstResults) {
      const restResults = this.resolveBody(restGoals, facts, rules, result);
      allResults.push(...restResults);
    }

    return allResults;
  }

  /**
   * Parse a ProLog term string into structured format
   */
  static parseTerm(termStr: string): any {
    const trimmed = termStr.trim();
    
    // Simple predicate(args) format
    const match = trimmed.match(/^(\w+)\((.*)\)$/);
    if (match) {
      const predicate = match[1];
      const argsStr = match[2];
      const args = this.parseArgs(argsStr);
      return { predicate, args };
    }

    // Simple predicate format
    if (/^\w+$/.test(trimmed)) {
      return { predicate: trimmed, args: [] };
    }

    // Variable
    if (trimmed.startsWith('?')) {
      return trimmed;
    }

    // Fallback: treat as string
    return { predicate: trimmed, args: [] };
  }

  /**
   * Parse arguments from string
   */
  private static parseArgs(argsStr: string): any[] {
    if (!argsStr.trim()) {
      return [];
    }

    const args: any[] = [];
    let current = '';
    let depth = 0;

    for (const char of argsStr) {
      if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(this.parseArg(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(this.parseArg(current.trim()));
    }

    return args;
  }

  /**
   * Parse a single argument
   */
  private static parseArg(argStr: string): any {
    const trimmed = argStr.trim();

    // Variable
    if (trimmed.startsWith('?')) {
      return trimmed;
    }

    // Number
    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // String (quoted)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Compound term
    if (trimmed.includes('(')) {
      return this.parseTerm(trimmed);
    }

    // Atom
    return trimmed;
  }
}
