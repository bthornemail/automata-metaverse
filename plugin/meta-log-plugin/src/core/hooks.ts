/**
 * Plugin hooks interface
 */
export interface PluginHooks {
  beforeQuery(query: string): Promise<string>;
  afterQuery(query: string, results: any): Promise<any>;
  onCanvasUpdate(canvasPath: string): Promise<void>;
  onFactExtraction(facts: any[]): Promise<void>;
}

/**
 * Plugin lifecycle interface
 */
export interface PluginLifecycle {
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
}
