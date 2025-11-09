import { Fact, DatalogQueryResult, DatalogRule, DatalogProgram } from '../types/index.js';
import { FixedPoint } from './fixed-point.js';
import { FactExtraction } from './fact-extraction.js';

/**
 * DataLog Engine for Meta-Log Database
 */
export class DatalogEngine {
  private facts: Fact[] = [];
  private rules: DatalogRule[] = [];

  /**
   * Add facts to the database
   */
  addFacts(facts: Fact[]): void {
    this.facts.push(...facts);
  }

  /**
   * Add a rule to the database
   */
  addRule(rule: DatalogRule): void {
    this.rules.push(rule);
  }

  /**
   * Build DataLog program from rules
   */
  buildProgram(rules: DatalogRule[]): DatalogProgram {
    return {
      rules: [...rules],
      facts: [...this.facts]
    };
  }

  /**
   * Query the database
   */
  async query(goal: string, program?: DatalogProgram): Promise<DatalogQueryResult> {
    const targetProgram = program || this.buildProgram(this.rules);
    
    // Compute fixed point
    const allFacts = FixedPoint.compute(targetProgram);
    
    // Match goal against facts
    const parsedGoal = this.parseGoal(goal);
    const matchingFacts = allFacts.filter(fact => {
      if (fact.predicate !== parsedGoal.predicate) {
        return false;
      }
      if (fact.args.length !== parsedGoal.args.length) {
        return false;
      }
      // Match arguments (variables match anything)
      for (let i = 0; i < fact.args.length; i++) {
        const goalArg = parsedGoal.args[i];
        if (!goalArg.startsWith('?') && goalArg !== fact.args[i].toString()) {
          return false;
        }
      }
      return true;
    });

    return { facts: matchingFacts };
  }

  /**
   * Compute fixed point
   */
  fixedPoint(program: DatalogProgram): Fact[] {
    return FixedPoint.compute(program);
  }

  /**
   * Extract facts from canvas objects
   */
  extractFacts(objects: any[]): Fact[] {
    return FactExtraction.extractFromCanvas(objects);
  }

  /**
   * Parse goal string
   */
  private parseGoal(goal: string): { predicate: string; args: string[] } {
    const match = goal.match(/^(\w+)\((.*)\)$/);
    if (match) {
      const predicate = match[1];
      const argsStr = match[2];
      const args = argsStr ? argsStr.split(',').map(s => s.trim()) : [];
      return { predicate, args };
    }
    return { predicate: goal, args: [] };
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
  getRules(): DatalogRule[] {
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
