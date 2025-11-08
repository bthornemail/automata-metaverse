#!/usr/bin/env node
/**
 * Identity MCP Server (bip32)
 *
 * A dedicated service for managing wallets and generating deterministic addresses
 * using bip32 for custom derivation paths.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { BIP32Factory, BIP32Interface } from 'bip32';

import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';
import crypto from 'crypto';

const bip32 = BIP32Factory(ecc);

class IdentityBip32MCPServer {
    private server: Server;

    constructor() {
        this.server = new Server({
            name: 'identity-bip32-mcp',
            version: '1.0.0',
        }, {
            capabilities: { tools: {} },
        });
        this.setupToolHandlers();
    }

    private normalizeVectorToPath(harmonicVector: number[], childIndex: number): number[] {
        const pathIntegers = harmonicVector.map(n => {
            return Math.floor(Math.abs(n * 1000000)) % 2**31;
        });
        pathIntegers.push(childIndex);
        return pathIntegers;
    }

    private setupToolHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'create_master_seed',
                        description: 'Generates a new random seed for a master wallet.',
                        inputSchema: { type: 'object', properties: {} }
                    },
                    {
                        name: 'get_deterministic_address_from_vector',
                        description: 'Generates a deterministic EVM address from a seed and a harmonic vector.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                seed: { type: 'string', description: 'The master seed (hex encoded)' },
                                harmonicVector: { type: 'array', items: { type: 'number' }, description: 'The harmonic vector for derivation' },
                                childIndex: { type: 'number', description: 'The child index for derivation' }
                            },
                            required: ['seed', 'harmonicVector', 'childIndex']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            if (!args) {
                throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
            }
            try {
                switch (name) {
                    case 'create_master_seed':
                        const seed = crypto.randomBytes(64).toString('hex');
                        return { content: [{ type: 'text', text: JSON.stringify({ seed }) }] };
                    case 'get_deterministic_address_from_vector':
                        const root: BIP32Interface = bip32.fromSeed(Buffer.from(args.seed as string, 'hex'));
                        const derivationPath = this.normalizeVectorToPath(args.harmonicVector as number[], args.childIndex as number);
                        let childNode: BIP32Interface = root;
                        for (const index of derivationPath) {
                            childNode = childNode.derive(index);
                        }
                        if (!childNode.privateKey) {
                            throw new Error("Could not derive private key");
                        }
                        const privateKey = '0x' + childNode.privateKey.toString();
                        const wallet = new ethers.Wallet(privateKey);
                        return { content: [{ type: 'text', text: JSON.stringify({ address: wallet.address, privateKey }) }] };
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            } catch (error) {
                if (error instanceof Error) {
                    throw new McpError(ErrorCode.InternalError, error.message);
                }
                throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
            }
        });
    }

    public async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Identity (bip32) MCP server running on stdio');
    }
}

const server = new IdentityBip32MCPServer();
server.run().catch(console.error);

