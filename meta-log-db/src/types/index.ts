/**
 * Type definitions for Meta-Log Database
 */

export interface MetaLogDbConfig {
  r5rsEnginePath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
}

export interface Fact {
  predicate: string;
  args: any[];
}

export interface PrologQueryResult {
  bindings: Record<string, any>[];
}

export interface DatalogQueryResult {
  facts: Fact[];
}

export interface SparqlQueryResult {
  results: {
    bindings: Record<string, { value: string; type: string }>[];
  };
}

export interface ShaclValidationReport {
  conforms: boolean;
  violations: ShaclViolation[];
}

export interface ShaclViolation {
  focusNode: string;
  resultPath: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface Canvas {
  nodes?: any[];
  edges?: any[];
  [key: string]: any;
}

export interface RdfTriple {
  subject: string;
  predicate: string;
  object: string | RdfLiteral;
}

export interface RdfLiteral {
  value: string;
  datatype?: string;
  language?: string;
}

export interface TriplePattern {
  subject?: string;
  predicate?: string;
  object?: string;
}

export interface PrologRule {
  head: string;
  body: string[];
}

export interface DatalogRule {
  head: string;
  body: string[];
}

export interface DatalogProgram {
  rules: DatalogRule[];
  facts: Fact[];
}

export interface ShaclShapes {
  [shapeId: string]: ShaclShape;
}

export interface ShaclShape {
  targetClass?: string;
  targetNode?: string;
  properties?: ShaclProperty[];
  constraints?: ShaclConstraint[];
}

export interface ShaclProperty {
  path: string;
  minCount?: number;
  maxCount?: number;
  datatype?: string;
  nodeKind?: string;
}

export interface ShaclConstraint {
  type: string;
  value?: any;
  message?: string;
}
