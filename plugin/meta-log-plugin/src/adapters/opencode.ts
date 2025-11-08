import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';

/**
 * OpenCode adapter for Meta-Log plugin
 */
export class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  private tools: any[] = [];

  constructor(config: PluginConfig) {
    super(config);
  }

  /**
   * Load plugin - register OpenCode tools
   */
  async onLoad(): Promise<void> {
    this.setEnabled(false);
    
    // Load canvas if path provided
    if (this.config.canvasPath) {
      await this.loadCanvas(this.config.canvasPath);
    }

    // Register OpenCode tools if available
    try {
      const { tool } = await import('@opencode-ai/plugin');
      
      // ProLog query tool
      this.tools.push(
        tool({
          description: "Query Meta-Log database with ProLog",
          args: {
            query: tool.schema.string().describe("ProLog query string")
          },
          async execute(args: any, context: any) {
            const query = await this.beforeQuery(args.query);
            const results = await this.db.prologQuery(query);
            return await this.afterQuery(query, results);
          }.bind(this)
        })
      );

      // DataLog query tool
      this.tools.push(
        tool({
          description: "Query Meta-Log database with DataLog",
          args: {
            query: tool.schema.string().describe("DataLog query string"),
            program: tool.schema.string().optional().describe("DataLog program (optional)")
          },
          async execute(args: any, context: any) {
            const query = await this.beforeQuery(args.query);
            const program = args.program ? JSON.parse(args.program) : undefined;
            const results = await this.db.datalogQuery(query, program);
            return await this.afterQuery(query, results);
          }.bind(this)
        })
      );

      // SPARQL query tool
      this.tools.push(
        tool({
          description: "Query Meta-Log database with SPARQL",
          args: {
            query: tool.schema.string().describe("SPARQL query string")
          },
          async execute(args: any, context: any) {
            const query = await this.beforeQuery(args.query);
            const results = await this.db.sparqlQuery(query);
            return await this.afterQuery(query, results);
          }.bind(this)
        })
      );

      // Load canvas tool
      this.tools.push(
        tool({
          description: "Load JSONL/CanvasL canvas file",
          args: {
            path: tool.schema.string().describe("Path to canvas file")
          },
          async execute(args: any, context: any) {
            await this.loadCanvas(args.path);
            return { success: true, path: args.path };
          }.bind(this)
        })
      );
    } catch (error) {
      // OpenCode plugin API not available, continue without tools
      console.warn('OpenCode plugin API not available:', error);
    }
  }

  /**
   * Unload plugin - cleanup tools
   */
  async onUnload(): Promise<void> {
    this.tools = [];
    this.setEnabled(false);
  }

  /**
   * Enable plugin functionality
   */
  async onEnable(): Promise<void> {
    this.setEnabled(true);
    this.emit('enabled');
  }

  /**
   * Disable plugin functionality
   */
  async onDisable(): Promise<void> {
    this.setEnabled(false);
    this.emit('disabled');
  }

  /**
   * Get registered tools
   */
  getTools(): any[] {
    return this.tools;
  }
}
