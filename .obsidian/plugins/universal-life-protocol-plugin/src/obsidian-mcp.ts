#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import { platform } from 'os';

class ObsidianMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server({
            name: 'obsidian-mcp',
            version: '0.2.0',
        }, {
            capabilities: { tools: {} },
        });
        this.setupToolHandlers();
    }

    private setupToolHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'obsidian_open',
                        description: 'Open an Obsidian vault or file within a vault',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                vault: { type: 'string', description: 'Vault name or ID (optional, uses current/last focused vault if not provided)' },
                                file: { type: 'string', description: 'File name or path from vault root (optional)' },
                                path: { type: 'string', description: 'Globally absolute path (overrides vault and file)' }
                            }
                        }
                    },
                    {
                        name: 'obsidian_new',
                        description: 'Create a new note in Obsidian vault with optional content',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                vault: { type: 'string', description: 'Vault name or ID (optional)' },
                                name: { type: 'string', description: 'File name to be created' },
                                file: { type: 'string', description: 'Vault absolute path including name (overrides name if specified)' },
                                path: { type: 'string', description: 'Globally absolute path (overrides vault and file)' },
                                content: { type: 'string', description: 'Initial content for the new note (optional)' }
                            }
                        }
                    },
                    {
                        name: 'obsidian_search',
                        description: 'Open search in Obsidian and optionally perform a search',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                vault: { type: 'string', description: 'Vault name or ID (optional)' },
                                query: { type: 'string', description: 'Search term to execute (optional)' }
                            }
                        }
                    },
                    {
                        name: 'obsidian_hook',
                        description: 'Execute Obsidian Hook URL with advanced functionality',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                vault: { type: 'string', description: 'Vault name or ID' },
                                action: { type: 'string', description: 'Hook action to perform (e.g., append, prepend, replace)' },
                                file: { type: 'string', description: 'Target file path' },
                                content: { type: 'string', description: 'Content to add/modify' },
                                heading: { type: 'string', description: 'Target heading for content insertion (optional)' }
                            },
                            required: ['vault', 'action', 'file']
                        }
                    },
                    {
                        name: 'obsidian_render_canvas',
                        description: 'Render a JSON Canvas to a file in Obsidian',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                vault: { type: 'string', description: 'Vault name or ID' },
                                canvasId: { type: 'string', description: 'The ID that will be the file name for the canvas' },
                                canvasJson: { type: 'string', description: 'The JSON content of the canvas' }
                            },
                            required: ['vault', 'canvasId', 'canvasJson']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'obsidian_open':
                        return await this.handleOpen(args);
                    case 'obsidian_new':
                        return await this.handleNew(args);
                    case 'obsidian_search':
                        return await this.handleSearch(args);
                    case 'obsidian_hook':
                        return await this.handleHook(args);
                    case 'obsidian_render_canvas':
                        return await this.handleRenderCanvas(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                if (error instanceof Error) {
                    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
                }
                return { content: [{ type: 'text', text: `An unknown error occurred` }], isError: true };
            }
        });
    }

    private buildObsidianURI(action: string, params: any): string {
        const baseURI = `obsidian://${action}`;
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value as string);
            }
        }
        const queryString = queryParams.toString();
        return queryString ? `${baseURI}?${queryString}` : baseURI;
    }

    private async executeURI(uri: string): Promise<string> {
        try {
            const currentPlatform = platform();
            let command: string;
            switch (currentPlatform) {
                case 'darwin': command = `open "${uri}"`; break;
                case 'win32': command = `start "" "${uri}"`; break;
                default: command = `xdg-open "${uri}"`; break;
            }
            execSync(command, { stdio: 'pipe' });
            return `Successfully executed: ${uri}`;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to execute URI: ${error.message}`);
            }
            throw new Error("An unknown error occurred while executing URI");
        }
    }

    private async handleOpen(args: any): Promise<any> {
        const { vault, file, path } = args;
        const params = path ? { path } : { vault, file };
        const uri = this.buildObsidianURI('open', params);
        const result = await this.executeURI(uri);
        return { content: [{ type: 'text', text: result }] };
    }

    private async handleNew(args: any): Promise<any> {
        const { vault, name, file, path, content } = args;
        const params = path ? { path } : { vault, file: file || name, content };
        const uri = this.buildObsidianURI('new', params);
        const result = await this.executeURI(uri);
        return { content: [{ type: 'text', text: result }] };
    }

    private async handleSearch(args: any): Promise<any> {
        const { vault, query } = args;
        const uri = this.buildObsidianURI('search', { vault, query });
        const result = await this.executeURI(uri);
        return { content: [{ type: 'text', text: result }] };
    }

    private async handleHook(args: any): Promise<any> {
        const { vault, action, file, content, heading } = args;
        const params = { vault, filepath: file, data: content, mode: 'append' }; // Simplified
        const uri = this.buildObsidianURI('hook', params);
        const result = await this.executeURI(uri);
        return { content: [{ type: 'text', text: result }] };
    }

    private async handleRenderCanvas(args: any): Promise<any> {
        const { vault, canvasId, canvasJson } = args;
        const fileName = `${canvasId}.canvas`;
        return await this.handleNew({ vault, name: fileName, content: canvasJson });
    }

    public async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Obsidian MCP server running on stdio');
    }
}

const server = new ObsidianMCPServer();
server.run().catch(console.error);
