/**
 * Type definitions for Meta-Log Plugin
 */

export interface PluginConfig {
  db?: any; // MetaLogDb
  canvasPath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
  configPath?: string;
}

export interface PluginLifecycle {
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
}

export interface PluginHooks {
  beforeQuery(query: string): Promise<string>;
  afterQuery(query: string, results: any): Promise<any>;
  onCanvasUpdate(canvasPath: string): Promise<void>;
  onFactExtraction(facts: any[]): Promise<void>;
}

export interface PrologQueryResult {
  bindings: Record<string, any>[];
}

export interface DatalogQueryResult {
  facts: any[];
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
}
