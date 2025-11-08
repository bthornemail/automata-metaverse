#!/usr/bin/env node
/**
 * Axiom Canvas MCP Server (Upgraded with Hypergraph Engine)
 *
 * This service provides tools for creating, managing, and visualizing
 * axiomatic and geometric programming constructs on a JSON-compliant canvas.
 * It is aligned with the Axiomatic Prime Directive.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { HDNodeWallet } from 'ethers';
import { ManifestGenerator } from './manifest-generator.js';
import { SharedSecretManager } from './shared-secrets.js';




// --- Type Definitions ---
interface Canvas {
    nodes: any[];
    edges: any[];
    metadata?: any;
}

interface AxiomNode {
    id: string;
    type: 'axiom';
    x: number;
    y: number;
    width: number;
    height: number;
    ethAddress: string;
    harmonicVector: number[];
    axiomFunction: [string, string, string[]];
    text: string;
    color: string;
}

// --- Integrated Hypergraph Canvas Builder ---
class HypergraphCanvasBuilder {
    public canvas: Canvas;

    constructor() {
        this.canvas = {
            nodes: [],
            edges: [],
            metadata: {
                title: "Hypergraph Visual Program",
                description: "Axiomatic programming using geometric principles"
            }
        };
    }

    createVectorNode(id: string, type: string, data: any, position: { x: number, y: number }): any {
        const nodeStyles: any = {
            vec1: { color: "#ff4444", shape: "circle" },
            vec3: { color: "#44ff44", shape: "triangle" },
            vec5: { color: "#4444ff", shape: "pentagon" },
            vec7: { color: "#ff44ff", shape: "heptagon" },
            vec21: { color: "#ffff44", shape: "complex" },
            axiom: { color: "#44ffff", shape: "diamond" },
            broker: { color: "#ff8844", shape: "star" }
        };
        const style = nodeStyles[type] || nodeStyles.vec1;
        return {
            id, 
            type: "text",
            x: position.x,
            y: position.y,
            width: type === "vec21" ? 200 : 100,
            height: type === "vec21" ? 150 : 80,
            color: style.color,
            text: `**${type.toUpperCase()}**\n\n${data.description || JSON.stringify(data)}`,
            metadata: {
                vectorType: type,
                data: data,
                geometricShape: style.shape
            }
        };
    }

    createAxiomaticEdge(fromId: string, toId: string, axiomName: string, validation: any): any {
        return {
            id: `${fromId}-${toId}-${axiomName}`,
            fromNode: fromId,
            toNode: toId,
            label: axiomName,
            color: validation.valid ? "#00ff00" : "#ff0000",
            metadata: {
                axiom: axiomName,
                validation: validation,
                type: "axiomatic-connection"
            }
        };
    }

    buildP2PCanvas(): Canvas {
        const alice = this.createVectorNode("alice", "vec21", { peerId: "alice", description: "Alice's Private\nDodecahedron\n(25+ vertices)" }, { x: 50, y: 100 });
        const alicePublic = this.createVectorNode("alice-public", "vec5", { description: "Alice's Public\nTetrahedron\nHandshake" }, { x: 250, y: 100 });
        const bob = this.createVectorNode("bob", "vec21", { peerId: "bob", description: "Bob's Private\nDodecahedron\n(25+ vertices)" }, { x: 750, y: 100 });
        const bobPublic = this.createVectorNode("bob-public", "vec5", { description: "Bob's Public\nTetrahedron\nHandshake" }, { x: 550, y: 100 });
        const broker = this.createVectorNode("broker", "broker", { description: "Merkaba Broker\nStateless Logic Gate\n21 Hilbert Axioms" }, { x: 400, y: 300 });
        const connection = this.createVectorNode("connection", "vec7", { description: "Shared Connection\nVec7 Space\nPeer Intersection" }, { x: 400, y: 150 });
        const message = this.createVectorNode("message", "vec3", { description: "Quantum Message\nVec1 Payload:\n'entanglement-alpha'" }, { x: 400, y: 50 });
        
        [alice, alicePublic, bob, bobPublic, broker, connection, message].forEach(node => this.canvas.nodes.push(node));

        this.canvas.edges.push(
            this.createAxiomaticEdge("alice", "alice-public", "I.1", { valid: true }),
            this.createAxiomaticEdge("bob", "bob-public", "I.1", { valid: true }),
            this.createAxiomaticEdge("alice-public", "connection", "I.4", { valid: true }),
            this.createAxiomaticEdge("bob-public", "connection", "I.4", { valid: true }),
            this.createAxiomaticEdge("connection", "broker", "II.3", { valid: true }),
            this.createAxiomaticEdge("message", "broker", "III.2", { valid: true }),
            this.createAxiomaticEdge("broker", "alice", "V.1", { valid: true }),
            this.createAxiomaticEdge("broker", "bob", "V.1", { valid: true })
        );
        return this.canvas;
    }

    buildAxiomCanvas(): Canvas {
        const axiomGroups = [
            { name: "Incidence", count: 8, color: "#ff6b6b", position: { x: 100, y: 100 } },
            { name: "Order", count: 4, color: "#4ecdc4", position: { x: 300, y: 100 } },
            { name: "Congruence", count: 5, color: "#45b7d1", position: { x: 500, y: 100 } },
            { name: "Parallel", count: 1, color: "#96ceb4", position: { x: 700, y: 100 } },
            { name: "Continuity", count: 3, color: "#feca57", position: { x: 400, y: 300 } }
        ];
        axiomGroups.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                const axiom = this.createVectorNode(`${group.name}-${i+1}`, "axiom", { description: `${group.name}\nAxiom ${i+1}`, group: group.name }, { x: group.position.x + (i % 3) * 60, y: group.position.y + Math.floor(i / 3) * 80 });
                axiom.color = group.color;
                this.canvas.nodes.push(axiom);
            }
        });
        return this.canvas;
    }
}

// --- Core Logic (Patricia Trie, CQE, etc.) ---
class AxiomCanvasCore {
    private PHI: number = (1 + Math.sqrt(5)) / 2;
    private cqe: ComputationalQuantumEngine = new ComputationalQuantumEngine();
    public patricia: SimplePatriciaTrie = new SimplePatriciaTrie();

    private toBytes(data: any): Uint8Array {
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (data instanceof Uint8Array) return data;
        if (typeof data === 'string') return new TextEncoder().encode(data);
        if (typeof data === 'object') return new TextEncoder().encode(JSON.stringify(data));
        if (typeof data === 'number') {
            return new Uint8Array([data & 0xFF, (data >> 8) & 0xFF, (data >> 16) & 0xFF, (data >> 24) & 0xFF]);
        }
        return new TextEncoder().encode(String(data));
    }

    public generateHarmonicVector(data: any): number[] {
        const bytes = this.toBytes(data);
        const h = Math.hypot(...Array.from(bytes));
        const sin = Math.sin(h / Math.PI);
        const cos = Math.cos(h / this.PHI);
        const tan = Math.tan(Math.PI / (h || 1e-10));
        return [h, sin, cos, tan, bytes.length];
    }

    public harmonize(input: any): number {
        const s = JSON.stringify(input);
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return h;
    }

    private normalizeVectorToPath(harmonicVector: number[], childIndex: number): number[] {
        const pathIntegers = harmonicVector.map(n => {
            return Math.floor(Math.abs(n * 1000000)) % 2**31;
        });
        pathIntegers.push(childIndex);
        return pathIntegers;
    }

    public generateDeterministicAddress(harmonicVector: number[], mnemonic?: string, derivationPath?: string): string {
        if (mnemonic && derivationPath) {
            // Use proper BIP32 HD derivation if mnemonic is provided
            const hdNode = HDNodeWallet.fromMnemonic(mnemonic, undefined, derivationPath);
            return hdNode.address;
        } else {
            // Fallback to hash-based address for backward compatibility
            const vectorString = harmonicVector.join(',');
            const hash = crypto.createHash('sha256').update(vectorString).digest('hex');
            return '0x' + hash.substring(0, 40);
        }
    }
}

class ComputationalQuantumEngine {
    bind(a: number[], b: number[]): { bound: number[] } {
        const maxLength = Math.max(a.length, b.length);
        const bound: number[] = [];
        for (let i = 0; i < maxLength; i++) {
            bound.push((a[i] || 0) + (b[i] || 0));
        }
        return { bound };
    }
}

class SimplePatriciaTrie {
    private root: any = { children: {} };

    public insert(path: string, axiomNode: any): void {
        const parts = path.split('/');
        let current = this.root;
        for (const part of parts) {
            if (!current.children[part]) {
                current.children[part] = { children: {} };
            }
            current = current.children[part];
        }
        current.axiomNode = axiomNode;
    }

    public findByLanguage(language: string): any[] {
        const results: any[] = [];
        this._findByPrefix([language], this.root.children[language] || { children: {} }, results);
        return results;
    }

    private _findByPrefix(pathParts: string[], node: any, results: any[]): void {
        if (node.axiomNode) {
            results.push({ path: pathParts.join('/'), axiomNode: node.axiomNode });
        }
        for (const [key, child] of Object.entries(node.children)) {
            this._findByPrefix([...pathParts, key], child as any, results);
        }
    }
}

// --- Upgraded Axiom Canvas Manager ---
class AxiomCanvasManager {
    public core: AxiomCanvasCore = new AxiomCanvasCore();
    private canvases: Map<string, Canvas> = new Map();
    private canvasDir: string = './axiom-canvases';
    private mnemonic?: string;
    private manifestGenerator?: ManifestGenerator;
    private sharedSecretManager?: SharedSecretManager;

    public initializeMerkleTrie(vaultPath: string, mnemonic: string): void {
        this.mnemonic = mnemonic;
        this.manifestGenerator = new ManifestGenerator(vaultPath, mnemonic);
        this.sharedSecretManager = new SharedSecretManager(mnemonic);
    }

    public getOrCreateCanvas(canvasId: string): Canvas {
        if (!this.canvases.has(canvasId)) {
            this.canvases.set(canvasId, { nodes: [], edges: [] });
        }
        return this.canvases.get(canvasId)!;
    }

    public createAxiom(canvasId: string, x: number, y: number, language: string, sexp: string, args: string[] = [], ethAddress?: string): AxiomNode {
        const canvas = this.getOrCreateCanvas(canvasId);
        const id = `axiom-${Date.now()}`;
        const harmonicVector = this.core.generateHarmonicVector({ language, sexp, args });

        // Use provided ethAddress or generate deterministically
        let finalEthAddress: string;
        if (ethAddress) {
            finalEthAddress = ethAddress;
        } else if (this.mnemonic) {
            // Generate deterministic address using HD derivation
            const derivationPath = SharedSecretManager.getStandardPaths().publishedManifest(0, canvas.nodes.length);
            finalEthAddress = this.core.generateDeterministicAddress(harmonicVector, this.mnemonic, derivationPath);
        } else {
            // Fallback to hash-based address
            finalEthAddress = this.core.generateDeterministicAddress(harmonicVector);
        }

        const nodeData = {
            description: `${language.toUpperCase()}: ${sexp}`,
            ethAddress: finalEthAddress,
            harmonicVector: harmonicVector,
            axiomFunction: [language, sexp, args]
        };
        const axiomNode = new HypergraphCanvasBuilder().createVectorNode(id, 'axiom', nodeData, { x, y });
        canvas.nodes.push(axiomNode);
        this.core.patricia.insert(`${language}/${sexp.split('(')[0] || 'lambda'}/${id}`, axiomNode);
        return axiomNode;
    }

    public connectAxioms(canvasId: string, fromNodeId: string, toNodeId: string, axiomName: string = "I.1"): any {
        const canvas = this.getOrCreateCanvas(canvasId);
        const edge = new HypergraphCanvasBuilder().createAxiomaticEdge(fromNodeId, toNodeId, axiomName, { valid: true });
        canvas.edges.push(edge);
        return edge;
    }
    
    public generateP2PCanvas(canvasId: string): Canvas {
        const builder = new HypergraphCanvasBuilder();
        const p2pCanvas = builder.buildP2PCanvas();
        this.canvases.set(canvasId, p2pCanvas);
        return p2pCanvas;
    }

    public generateAxiomCanvas(canvasId: string): Canvas {
        const builder = new HypergraphCanvasBuilder();
        const axiomCanvas = builder.buildAxiomCanvas();
        this.canvases.set(canvasId, axiomCanvas);
        return axiomCanvas;
    }

    public async executeAxiom(canvasId: string, nodeId: string, inputData: any): Promise<any> {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) throw new Error('Canvas not found');
        const node = canvas.nodes.find((n) => n.id === nodeId);
        if (!node) throw new Error('Node not found');
        const [language, sexp] = node.metadata.data.axiomFunction;
        let result;
        if (language === 'js') {
            const func = eval(sexp);
            result = func(inputData);
        } else {
            result = { error: `Language ${language} not implemented` };
        }
        const proofHash = crypto.createHash('sha256').update(JSON.stringify({ nodeId, inputData, result })).digest('hex');
        return { result, proof: proofHash, traversalPath: [nodeId] };
    }

    public async saveCanvas(canvasId: string): Promise<string> {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) throw new Error('Canvas not found');
        await fs.mkdir(this.canvasDir, { recursive: true });
        const filePath = path.join(this.canvasDir, `${canvasId}.canvas`);
        await fs.writeFile(filePath, JSON.stringify(canvas, null, 2));
        return filePath;
    }

    public async loadCanvas(canvasId: string): Promise<Canvas> {
        const filePath = path.join(this.canvasDir, `${canvasId}.canvas`);
        const data = await fs.readFile(filePath, 'utf8');
        const canvas: Canvas = JSON.parse(data);
        this.canvases.set(canvasId, canvas);
        return canvas;
    }

    public async generateCanvasManifest(canvasId: string, derivationPath?: string, notes?: string): Promise<any> {
        if (!this.manifestGenerator) {
            throw new Error('Merkle-Trie not initialized. Call initializeMerkleTrie first.');
        }

        // Save canvas first to ensure it exists as a file
        const canvasPath = await this.saveCanvas(canvasId);

        // Generate manifest using the saved canvas file
        const generator = derivationPath
            ? new ManifestGenerator(this.canvasDir, this.mnemonic!, derivationPath)
            : this.manifestGenerator;

        const result = await generator.buildManifest(undefined, notes);
        return result;
    }

    public encryptCanvasForPeers(canvasId: string, peerPublicKeys: string[]): any {
        if (!this.sharedSecretManager) {
            throw new Error('Merkle-Trie not initialized. Call initializeMerkleTrie first.');
        }

        const canvas = this.canvases.get(canvasId);
        if (!canvas) {
            throw new Error('Canvas not found');
        }

        const canvasStr = JSON.stringify(canvas);
        const encryptedVersions: Record<string, any> = {};

        for (const peerKey of peerPublicKeys) {
            encryptedVersions[peerKey] = this.sharedSecretManager.encryptManifest(canvasStr, peerKey);
        }

        return encryptedVersions;
    }
}

// --- MCP Server Setup ---
const server = new Server({
    name: 'axiom-canvas-mcp',
    version: '2.0.0',
}, {
    capabilities: { tools: {} },
});

const canvasManager = new AxiomCanvasManager();

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            { name: 'initialize_merkle_trie', description: 'Initialize Merkle-Trie functionality with vault path and mnemonic', inputSchema: { type: 'object', properties: { vaultPath: { type: 'string' }, mnemonic: { type: 'string' } }, required: ['vaultPath', 'mnemonic'] } },
            { name: 'create_axiom', description: 'Create a new axiom node in a canvas', inputSchema: { type: 'object', properties: { canvasId: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, language: { type: 'string' }, sexp: { type: 'string' }, args: { type: 'array', items: { type: 'string' } }, ethAddress: { type: 'string' } }, required: ['canvasId', 'x', 'y', 'language', 'sexp'] } },
            { name: 'connect_axioms', description: 'Connect two axiom nodes with an edge' },
            { name: 'execute_axiom', description: 'Execute an axiom with input data' },
            { name: 'save_canvas', description: 'Save canvas to file' },
            { name: 'load_canvas', description: 'Load canvas from file' },
            { name: 'find_axioms_by_language', description: 'Find all axioms for a specific language' },
            { name: 'generate_p2p_canvas', description: 'Generate a P2P communication canvas' },
            { name: 'generate_axiom_canvas', description: 'Generate a canvas visualizing Hilbert\'s axioms' },
            { name: 'generate_canvas_manifest', description: 'Generate Merkle-trie manifest from canvas', inputSchema: { type: 'object', properties: { canvasId: { type: 'string' }, derivationPath: { type: 'string' }, notes: { type: 'string' } }, required: ['canvasId'] } },
            { name: 'encrypt_canvas_for_peers', description: 'Encrypt canvas for private sharing with peers', inputSchema: { type: 'object', properties: { canvasId: { type: 'string' }, peerPublicKeys: { type: 'array', items: { type: 'string' } } }, required: ['canvasId', 'peerPublicKeys'] } }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
    }
    try {
        switch (name) {
            case 'initialize_merkle_trie':
                canvasManager.initializeMerkleTrie(args.vaultPath as string, args.mnemonic as string);
                return { content: [{ type: 'text', text: `Merkle-Trie initialized for vault: ${args.vaultPath}` }] };
            case 'create_axiom':
                const axiom = canvasManager.createAxiom(args.canvasId as string, args.x as number, args.y as number, args.language as string, args.sexp as string, args.args as string[], args.ethAddress as string);
                return { content: [{ type: 'text', text: `Created axiom: ${axiom.id} with address: ${axiom.metadata.data.ethAddress}` }] };
            case 'connect_axioms':
                const edge = canvasManager.connectAxioms(args.canvasId as string, args.fromNodeId as string, args.toNodeId as string);
                return { content: [{ type: 'text', text: `Connected nodes with edge: ${edge.id}` }] };
            case 'execute_axiom':
                const result = await canvasManager.executeAxiom(args.canvasId as string, args.nodeId as string, args.inputData);
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            case 'save_canvas':
                const filePath = await canvasManager.saveCanvas(args.canvasId as string);
                return { content: [{ type: 'text', text: `Canvas saved to: ${filePath}` }] };
            case 'load_canvas':
                const canvas = await canvasManager.loadCanvas(args.canvasId as string);
                return { content: [{ type: 'text', text: `Canvas loaded with ${canvas.nodes.length} nodes.` }] };
            case 'find_axioms_by_language':
                const axioms = canvasManager.core.patricia.findByLanguage(args.language as string);
                return { content: [{ type: 'text', text: JSON.stringify(axioms) }] };
            case 'generate_p2p_canvas':
                const p2pCanvas = canvasManager.generateP2PCanvas(args.canvasId as string);
                return { content: [{ type: 'text', text: JSON.stringify(p2pCanvas, null, 2) }] };
            case 'generate_axiom_canvas':
                const axiomCanvas = canvasManager.generateAxiomCanvas(args.canvasId as string);
                return { content: [{ type: 'text', text: JSON.stringify(axiomCanvas, null, 2) }] };
            case 'generate_canvas_manifest':
                const manifestResult = await canvasManager.generateCanvasManifest(args.canvasId as string, args.derivationPath as string, args.notes as string);
                return { content: [{ type: 'text', text: `Canvas manifest generated!\nRoot Hash: ${manifestResult.manifest.rootHash}\nAuthor: ${manifestResult.manifest.authorAddress}\n\n${manifestResult.manifestStr}` }] };
            case 'encrypt_canvas_for_peers':
                const encryptedVersions = canvasManager.encryptCanvasForPeers(args.canvasId as string, args.peerPublicKeys as string[]);
                return { content: [{ type: 'text', text: `Canvas encrypted for ${Object.keys(encryptedVersions).length} peers:\n\n${JSON.stringify(encryptedVersions, null, 2)}` }] };
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('Server failed:', error);
    process.exit(1);
});

export { AxiomCanvasCore, ComputationalQuantumEngine, SimplePatriciaTrie, AxiomCanvasManager };
