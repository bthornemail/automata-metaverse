#!/usr/bin/env node
/**
 * Merkle-Trie Publishing MCP Server with Ethers HD Addresses
 *
 * This service provides tools for creating, managing, and publishing
 * Merkle-trie manifests from Obsidian vault content with ethers-based
 * deterministic addressing and ECDH shared secrets.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Import our new modules
import { ManifestGenerator } from './manifest-generator.js';
import { SharedSecretManager } from './shared-secrets.js';
import { ObsidianPluginIntegration } from './obsidian-plugin-integration.js';
import { MetadataTracker } from './metadata-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MerkleTrieConfig {
  vaultPath: string;
  mnemonic: string;
  defaultDerivationPath: string;
}

class MerkleTrieMCPServer {
  private server: Server;
  private manifestGenerator?: ManifestGenerator;
  private sharedSecretManager?: SharedSecretManager;
  private obsidianIntegration?: ObsidianPluginIntegration;
  private metadataTracker?: MetadataTracker;
  private config?: MerkleTrieConfig;

  constructor() {
    this.server = new Server({
      name: 'merkle-trie-mcp',
      version: '1.0.0',
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
            name: 'initialize_merkle_trie',
            description: 'Initialize the Merkle-Trie system with vault path and mnemonic',
            inputSchema: {
              type: 'object',
              properties: {
                vaultPath: { type: 'string', description: 'Path to the Obsidian vault' },
                mnemonic: { type: 'string', description: 'BIP39 mnemonic for HD derivation' },
                derivationPath: { type: 'string', description: 'HD derivation path (default: m/1\'/0\'/0\')' }
              },
              required: ['vaultPath', 'mnemonic']
            }
          },
          {
            name: 'generate_manifest',
            description: 'Generate a Merkle-trie manifest from vault content',
            inputSchema: {
              type: 'object',
              properties: {
                subgraphPath: { type: 'string', description: 'Optional path to specific subgraph/canvas' },
                derivationPath: { type: 'string', description: 'Custom HD derivation path' },
                notes: { type: 'string', description: 'Additional notes for the manifest' }
              }
            }
          },
          {
            name: 'export_canvas_subgraph',
            description: 'Export a canvas subgraph as a manifest with all referenced files',
            inputSchema: {
              type: 'object',
              properties: {
                canvasPath: { type: 'string', description: 'Path to the canvas file' },
                derivationPath: { type: 'string', description: 'Custom HD derivation path' },
                notes: { type: 'string', description: 'Additional notes for the manifest' },
                peerPublicKeys: { type: 'array', items: { type: 'string' }, description: 'Peer public keys for private sharing' }
              },
              required: ['canvasPath']
            }
          },
          {
            name: 'encrypt_manifest',
            description: 'Encrypt a manifest for private sharing using ECDH',
            inputSchema: {
              type: 'object',
              properties: {
                manifestStr: { type: 'string', description: 'JSON manifest string to encrypt' },
                peerPublicKey: { type: 'string', description: 'Peer\'s public key for ECDH' },
                derivationPath: { type: 'string', description: 'Author\'s derivation path for encryption' }
              },
              required: ['manifestStr', 'peerPublicKey']
            }
          },
          {
            name: 'decrypt_manifest',
            description: 'Decrypt a private manifest using ECDH',
            inputSchema: {
              type: 'object',
              properties: {
                encryptedManifest: { type: 'object', description: 'Encrypted manifest object' },
                peerPrivateKey: { type: 'string', description: 'Peer\'s private key for decryption' }
              },
              required: ['encryptedManifest', 'peerPrivateKey']
            }
          },
          {
            name: 'create_shared_context',
            description: 'Create a shared context for collaborative editing',
            inputSchema: {
              type: 'object',
              properties: {
                peers: { type: 'array', items: { type: 'string' }, description: 'Array of peer public keys' },
                contextId: { type: 'string', description: 'Unique context identifier' },
                derivationPath: { type: 'string', description: 'Derivation path for context keys' }
              },
              required: ['peers', 'contextId']
            }
          },
          {
            name: 'process_rumsfeld_interaction',
            description: 'Process a Rumsfeld square (KK/KU/UK/UU) interaction on a node',
            inputSchema: {
              type: 'object',
              properties: {
                nodeId: { type: 'string', description: 'Node ID to interact with' },
                interaction: {
                  type: 'string',
                  enum: ['agree', 'disagree', 'question', 'reference', 'hide'],
                  description: 'Type of interaction'
                },
                userId: { type: 'string', description: 'User ID performing the interaction' },
                comment: { type: 'string', description: 'Optional comment for the interaction' }
              },
              required: ['nodeId', 'interaction']
            }
          },
          {
            name: 'get_canvas_heatmap',
            description: 'Generate heatmap data for canvas visualization based on Rumsfeld scores',
            inputSchema: {
              type: 'object',
              properties: {
                canvasPath: { type: 'string', description: 'Path to the canvas file' }
              },
              required: ['canvasPath']
            }
          },
          {
            name: 'search_nodes',
            description: 'Search nodes by various criteria',
            inputSchema: {
              type: 'object',
              properties: {
                author: { type: 'string', description: 'Filter by author' },
                status: { type: 'string', enum: ['draft', 'published', 'archived'], description: 'Filter by status' },
                visibility: { type: 'string', enum: ['visible', 'hidden', 'private'], description: 'Filter by visibility' },
                minTotalScore: { type: 'number', description: 'Minimum total Rumsfeld score' },
                hasReferences: { type: 'boolean', description: 'Filter nodes with/without references' },
                contentPattern: { type: 'string', description: 'Regex pattern to match content' }
              }
            }
          },
          {
            name: 'generate_analytics_report',
            description: 'Generate analytics report on vault metadata and interactions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'verify_manifest',
            description: 'Verify a manifest signature and integrity',
            inputSchema: {
              type: 'object',
              properties: {
                manifestStr: { type: 'string', description: 'JSON manifest string to verify' },
                signature: { type: 'string', description: 'Manifest signature' },
                authorAddress: { type: 'string', description: 'Expected author address' }
              },
              required: ['manifestStr', 'signature', 'authorAddress']
            }
          },
          {
            name: 'get_derivation_paths',
            description: 'Get standard HD derivation paths for different purposes',
            inputSchema: {
              type: 'object',
              properties: {}
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
          case 'initialize_merkle_trie':
            return await this.handleInitialize(args);
          case 'generate_manifest':
            return await this.handleGenerateManifest(args);
          case 'export_canvas_subgraph':
            return await this.handleExportCanvas(args);
          case 'encrypt_manifest':
            return await this.handleEncryptManifest(args);
          case 'decrypt_manifest':
            return await this.handleDecryptManifest(args);
          case 'create_shared_context':
            return await this.handleCreateSharedContext(args);
          case 'process_rumsfeld_interaction':
            return await this.handleRumsfeldInteraction(args);
          case 'get_canvas_heatmap':
            return await this.handleGetCanvasHeatmap(args);
          case 'search_nodes':
            return await this.handleSearchNodes(args);
          case 'generate_analytics_report':
            return await this.handleAnalyticsReport(args);
          case 'verify_manifest':
            return await this.handleVerifyManifest(args);
          case 'get_derivation_paths':
            return await this.handleGetDerivationPaths(args);
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

  private async handleInitialize(args: any): Promise<any> {
    const { vaultPath, mnemonic, derivationPath = "m/1'/0'/0'" } = args;

    this.config = {
      vaultPath,
      mnemonic,
      defaultDerivationPath: derivationPath
    };

    this.manifestGenerator = new ManifestGenerator(vaultPath, mnemonic, derivationPath);
    this.sharedSecretManager = new SharedSecretManager(mnemonic);
    this.obsidianIntegration = new ObsidianPluginIntegration(vaultPath, mnemonic);
    this.metadataTracker = new MetadataTracker(vaultPath);

    return {
      content: [{
        type: 'text',
        text: `Merkle-Trie system initialized for vault: ${vaultPath}\nDefault derivation path: ${derivationPath}`
      }]
    };
  }

  private async handleGenerateManifest(args: any): Promise<any> {
    this.ensureInitialized();

    const { subgraphPath, derivationPath, notes } = args;
    const generator = derivationPath
      ? new ManifestGenerator(this.config!.vaultPath, this.config!.mnemonic, derivationPath)
      : this.manifestGenerator!;

    const result = await generator.buildManifest(subgraphPath, notes);

    return {
      content: [{
        type: 'text',
        text: `Manifest generated successfully!\n\nRoot Hash: ${result.manifest.rootHash}\nAuthor Address: ${result.manifest.authorAddress}\nFiles: ${Object.keys(result.manifest.catalog).length}\n\nManifest JSON:\n${result.manifestStr}`
      }]
    };
  }

  private async handleExportCanvas(args: any): Promise<any> {
    this.ensureInitialized();

    const { canvasPath, derivationPath, notes, peerPublicKeys } = args;

    const result = await this.obsidianIntegration!.exportCanvasSubgraph(canvasPath, {
      derivationPath,
      notes,
      peerPublicKeys
    });

    let response = `Canvas subgraph exported successfully!\n\nRoot Hash: ${result.manifest.rootHash}\nAuthor Address: ${result.manifest.authorAddress}\nFiles: ${Object.keys(result.manifest.catalog).length}\nNodes: ${result.canvasData.nodes.length}\nEdges: ${result.canvasData.edges.length}`;

    if (result.encryptedManifests) {
      response += `\n\nEncrypted for ${Object.keys(result.encryptedManifests).length} peer(s)`;
    }

    response += `\n\nManifest JSON:\n${JSON.stringify(result.manifest, null, 2)}`;

    return {
      content: [{ type: 'text', text: response }]
    };
  }

  private async handleEncryptManifest(args: any): Promise<any> {
    this.ensureInitialized();

    const { manifestStr, peerPublicKey, derivationPath } = args;

    const encryptedManifest = this.sharedSecretManager!.encryptManifest(
      manifestStr,
      peerPublicKey,
      derivationPath
    );

    return {
      content: [{
        type: 'text',
        text: `Manifest encrypted successfully!\n\nEncrypted Manifest:\n${JSON.stringify(encryptedManifest, null, 2)}`
      }]
    };
  }

  private async handleDecryptManifest(args: any): Promise<any> {
    const { encryptedManifest, peerPrivateKey } = args;

    const decryptedManifest = SharedSecretManager.decryptManifest(
      encryptedManifest,
      peerPrivateKey
    );

    return {
      content: [{
        type: 'text',
        text: `Manifest decrypted successfully!\n\nDecrypted Manifest:\n${decryptedManifest}`
      }]
    };
  }

  private async handleCreateSharedContext(args: any): Promise<any> {
    this.ensureInitialized();

    const { peers, contextId, derivationPath } = args;

    const sharedContext = this.sharedSecretManager!.createSharedContext(
      peers,
      contextId,
      derivationPath
    );

    return {
      content: [{
        type: 'text',
        text: `Shared context created successfully!\n\nContext Address: ${sharedContext.contextAddress}\nAuthor Public Key: ${sharedContext.authorPublicKey}\nEncrypted Keys: ${Object.keys(sharedContext.encryptedKeys).length} peer(s)\n\nShared Context:\n${JSON.stringify(sharedContext, null, 2)}`
      }]
    };
  }

  private async handleRumsfeldInteraction(args: any): Promise<any> {
    this.ensureInitialized();

    const { nodeId, interaction, userId, comment } = args;

    const result = this.obsidianIntegration!.processRumsfeldInteraction({
      type: interaction,
      nodeId,
      userId,
      comment,
      timestamp: new Date().toISOString()
    });

    if (!result) {
      return {
        content: [{ type: 'text', text: `No metadata found for node: ${nodeId}` }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Rumsfeld interaction processed successfully!\n\nNode: ${nodeId}\nInteraction: ${interaction}\nUpdated Scores: KK=${result.rumsfeldScores.kk}, KU=${result.rumsfeldScores.ku}, UK=${result.rumsfeldScores.uk}, UU=${result.rumsfeldScores.uu}\n\nUpdated Metadata:\n${JSON.stringify(result, null, 2)}`
      }]
    };
  }

  private async handleGetCanvasHeatmap(args: any): Promise<any> {
    this.ensureInitialized();

    const { canvasPath } = args;

    const heatmapData = this.obsidianIntegration!.generateCanvasHeatmapData(canvasPath);

    return {
      content: [{
        type: 'text',
        text: `Canvas heatmap data generated!\n\nNodes: ${heatmapData.nodes.length}\nMax Score: ${heatmapData.maxScore}\n\nHeatmap Data:\n${JSON.stringify(heatmapData, null, 2)}`
      }]
    };
  }

  private async handleSearchNodes(args: any): Promise<any> {
    this.ensureInitialized();

    const { author, status, visibility, minTotalScore, hasReferences, contentPattern } = args;

    const criteria = {
      author,
      status,
      visibility,
      minTotalScore,
      hasReferences,
      contentPattern: contentPattern ? new RegExp(contentPattern, 'i') : undefined
    };

    const results = this.metadataTracker!.searchNodes(criteria);

    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} matching nodes:\n\n${results.map(node =>
          `- ${node.title} (${node.id}): KK=${node.rumsfeldScores.kk}, KU=${node.rumsfeldScores.ku}, UK=${node.rumsfeldScores.uk}, UU=${node.rumsfeldScores.uu}`
        ).join('\n')}\n\nDetailed Results:\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }

  private async handleAnalyticsReport(args: any): Promise<any> {
    this.ensureInitialized();

    const report = this.metadataTracker!.generateAnalyticsReport();

    return {
      content: [{
        type: 'text',
        text: `Analytics Report Generated!\n\nTotal Nodes: ${report.totalNodes}\n\nScore Distribution:\n- High KK (>5): ${report.scoreDistribution.highKK}\n- High KU (>5): ${report.scoreDistribution.highKU}\n- High UK (>5): ${report.scoreDistribution.highUK}\n- High UU (>5): ${report.scoreDistribution.highUU}\n\nStatus Breakdown:\n${Object.entries(report.statusBreakdown).map(([status, count]) => `- ${status}: ${count}`).join('\n')}\n\nAuthor Contributions:\n${Object.entries(report.authorContributions).map(([author, count]) => `- ${author}: ${count}`).join('\n')}\n\nFull Report:\n${JSON.stringify(report, null, 2)}`
      }]
    };
  }

  private async handleVerifyManifest(args: any): Promise<any> {
    const { manifestStr, signature, authorAddress } = args;

    const isValid = await ManifestGenerator.verifyManifest(
      manifestStr,
      signature,
      authorAddress
    );

    return {
      content: [{
        type: 'text',
        text: `Manifest verification result: ${isValid ? 'VALID' : 'INVALID'}\n\nAuthor Address: ${authorAddress}\nSignature: ${signature.substring(0, 20)}...`
      }]
    };
  }

  private async handleGetDerivationPaths(args: any): Promise<any> {
    const paths = SharedSecretManager.getStandardPaths();

    return {
      content: [{
        type: 'text',
        text: `Standard HD Derivation Paths:\n\n${Object.entries(paths).map(([key, value]) =>
          typeof value === 'function' ? `${key}: Function` : `${key}: ${value}`
        ).join('\n')}\n\nFull Paths Object:\n${JSON.stringify(paths, null, 2)}`
      }]
    };
  }

  private ensureInitialized(): void {
    if (!this.config || !this.manifestGenerator) {
      throw new Error('Merkle-Trie system not initialized. Call initialize_merkle_trie first.');
    }
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Merkle-Trie MCP server running on stdio');
  }
}

// Run the server
async function main() {
  const server = new MerkleTrieMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Merkle-Trie MCP Server failed:', error);
  process.exit(1);
});

export { MerkleTrieMCPServer };