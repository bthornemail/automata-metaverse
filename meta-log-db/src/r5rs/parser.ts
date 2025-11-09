/**
 * R5RS Scheme Parser
 * Parses Scheme files and extracts function definitions
 */

export interface SchemeExpression {
  type: 'atom' | 'list' | 'lambda' | 'define' | 'if' | 'quote' | 'call';
  value?: any;
  children?: SchemeExpression[];
  name?: string;
  params?: string[];
  body?: SchemeExpression;
}

/**
 * R5RS Scheme Parser
 */
export class R5RSParser {
  /**
   * Parse Scheme file content
   */
  static parse(content: string): SchemeExpression[] {
    const expressions: SchemeExpression[] = [];
    const tokens = this.tokenize(content);
    let index = 0;

    while (index < tokens.length) {
      const expr = this.parseExpression(tokens, index);
      expressions.push(expr.expression);
      index = expr.nextIndex;
    }

    return expressions;
  }

  /**
   * Tokenize Scheme code
   */
  private static tokenize(content: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let inComment = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = i < content.length - 1 ? content[i + 1] : '';

      // Handle comments
      if (char === ';' && !inString) {
        inComment = true;
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        continue;
      }
      if (inComment && char === '\n') {
        inComment = false;
        continue;
      }
      if (inComment) {
        continue;
      }

      // Handle strings
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = '';
        current += char;
      } else if (inString) {
        current += char;
      } else {
        // Handle whitespace and delimiters
        if (char === '(' || char === ')') {
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
          tokens.push(char);
        } else if (char === ' ' || char === '\n' || char === '\t') {
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
        } else {
          current += char;
        }
      }
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens.filter(t => t);
  }

  /**
   * Parse a single expression
   */
  private static parseExpression(tokens: string[], startIndex: number): { expression: SchemeExpression; nextIndex: number } {
    if (startIndex >= tokens.length) {
      throw new Error('Unexpected end of input');
    }

    const token = tokens[startIndex];

    // Handle list
    if (token === '(') {
      return this.parseList(tokens, startIndex + 1);
    }

    // Handle atom
    return {
      expression: this.parseAtom(token),
      nextIndex: startIndex + 1
    };
  }

  /**
   * Parse a list expression
   */
  private static parseList(tokens: string[], startIndex: number): { expression: SchemeExpression; nextIndex: number } {
    const children: SchemeExpression[] = [];
    let index = startIndex;

    while (index < tokens.length && tokens[index] !== ')') {
      if (tokens[index] === '(') {
        const result = this.parseList(tokens, index + 1);
        children.push(result.expression);
        index = result.nextIndex;
      } else {
        const result = this.parseExpression(tokens, index);
        children.push(result.expression);
        index = result.nextIndex;
      }
    }

    if (index >= tokens.length) {
      throw new Error('Unclosed parenthesis');
    }

    // Determine expression type
    let expression: SchemeExpression;
    if (children.length === 0) {
      expression = { type: 'list' as const, children: [] };
    } else {
      const first = children[0];
      
      // Check for special forms
      if (first.type === 'atom' && first.value === 'define') {
        expression = this.parseDefine(children.slice(1));
      } else if (first.type === 'atom' && first.value === 'lambda') {
        expression = this.parseLambda(children.slice(1));
      } else if (first.type === 'atom' && first.value === 'if') {
        expression = { type: 'if' as const, children: children.slice(1) };
      } else if (first.type === 'atom' && first.value === 'quote') {
        expression = { type: 'quote' as const, children: children.slice(1) };
      } else {
        // Function call
        expression = { type: 'call' as const, children };
      }
    }

    return {
      expression,
      nextIndex: index + 1
    };
  }

  /**
   * Parse define expression
   */
  private static parseDefine(rest: SchemeExpression[]): SchemeExpression {
    if (rest.length < 2) {
      throw new Error('Invalid define expression');
    }

    const nameExpr = rest[0];
    const body = rest.length === 2 ? rest[1] : { type: 'list' as const, children: rest.slice(1) };

    if (nameExpr.type === 'atom') {
      // Simple define: (define name value)
      return {
        type: 'define' as const,
        name: nameExpr.value,
        body
      };
    } else if (nameExpr.type === 'list' && nameExpr.children && nameExpr.children.length > 0) {
      // Function define: (define (name params...) body...)
      const nameAtom = nameExpr.children[0];
      const params = nameExpr.children.slice(1).map(c => 
        c.type === 'atom' ? c.value : ''
      ).filter(p => p);

      return {
        type: 'define' as const,
        name: nameAtom.type === 'atom' ? nameAtom.value : '',
        params,
        body: rest.length > 1 ? rest[1] : { type: 'list' as const, children: [] }
      };
    }

    throw new Error('Invalid define expression');
  }

  /**
   * Parse lambda expression
   */
  private static parseLambda(rest: SchemeExpression[]): SchemeExpression {
    if (rest.length < 2) {
      throw new Error('Invalid lambda expression');
    }

    const paramsExpr = rest[0];
    const params: string[] = [];

    if (paramsExpr.type === 'list' && paramsExpr.children) {
      params.push(...paramsExpr.children
        .filter(c => c.type === 'atom')
        .map(c => c.value as string)
      );
    } else if (paramsExpr.type === 'atom') {
      params.push(paramsExpr.value);
    }

    const body = rest.length === 2 ? rest[1] : { type: 'list' as const, children: rest.slice(1) };

    return {
      type: 'lambda' as const,
      params,
      body
    };
  }

  /**
   * Parse atom
   */
  private static parseAtom(token: string): SchemeExpression {
    // Number
    if (/^-?\d+$/.test(token)) {
      return { type: 'atom' as const, value: parseInt(token, 10) };
    }
    if (/^-?\d+\.\d+$/.test(token)) {
      return { type: 'atom' as const, value: parseFloat(token) };
    }

    // String
    if ((token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))) {
      return { type: 'atom' as const, value: token.slice(1, -1) };
    }

    // Boolean
    if (token === '#t' || token === '#true') {
      return { type: 'atom' as const, value: true };
    }
    if (token === '#f' || token === '#false') {
      return { type: 'atom' as const, value: false };
    }

    // Symbol
    return { type: 'atom' as const, value: token };
  }

  /**
   * Extract function definitions from parsed expressions
   */
  static extractFunctions(expressions: SchemeExpression[]): Map<string, SchemeExpression> {
    const functions = new Map<string, SchemeExpression>();

    for (const expr of expressions) {
      if (expr.type === 'define' && expr.name) {
        functions.set(expr.name, expr);
      }
    }

    return functions;
  }

  /**
   * Extract lambda expressions
   */
  static extractLambdas(expressions: SchemeExpression[]): SchemeExpression[] {
    const lambdas: SchemeExpression[] = [];

    const traverse = (expr: SchemeExpression) => {
      if (expr.type === 'lambda') {
        lambdas.push(expr);
      }
      if (expr.children) {
        for (const child of expr.children) {
          traverse(child);
        }
      }
    };

    for (const expr of expressions) {
      traverse(expr);
    }

    return lambdas;
  }
}
