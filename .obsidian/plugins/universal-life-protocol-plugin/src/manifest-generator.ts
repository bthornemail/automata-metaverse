import fs from "fs";
import path from "path";
import { keccak256 } from "ethers";
import { HDNodeWallet, Wallet } from "ethers";

export interface ManifestCatalogEntry {
  hash: string;
  path: string;
  type?: 'markdown' | 'canvas' | 'metadata';
}

export interface Manifest {
  manifestVersion: string;
  rootHash: string;
  timestamp: string;
  authorAddress: string;
  derivationPath: string;
  subgraphPath?: string;
  catalog: Record<string, ManifestCatalogEntry>;
  proofsSupported: boolean;
  notes?: string;
  signature?: string;
}

export interface RumsfeldScores {
  kk: number; // Known Knowns
  ku: number; // Known Unknowns
  uk: number; // Unknown Knowns
  uu: number; // Unknown Unknowns
}

export interface NodeMetadata {
  id: string;
  title?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  rumsfeldScores: RumsfeldScores;
  references: string[];
  subcomponents: string[];
  visibility: 'visible' | 'hidden' | 'private';
  status: 'draft' | 'published' | 'archived';
  canonical_path: string;
}

export class ManifestGenerator {
  private vaultPath: string;
  private mnemonic: string;
  private derivationPath: string;

  constructor(vaultPath: string, mnemonic: string, derivationPath = "m/1'/0'/0'") {
    this.vaultPath = vaultPath;
    this.mnemonic = mnemonic;
    this.derivationPath = derivationPath;
  }

  private keccakHex(input: Buffer | string): string {
    if (typeof input === "string") {
      input = Buffer.from(input, "utf8");
    }
    const hex = keccak256(input);
    return hex.replace(/^0x/, "");
  }

  private readFilesSync(
    folder: string,
    exts = [".md", ".json", ".canvas"],
    excludePatterns = [/^manifest-/, /^\./, /node_modules/]
  ): string[] {
    if (!fs.existsSync(folder)) {
      return [];
    }

    return fs.readdirSync(folder, { recursive: true })
      .filter((f): f is string => typeof f === 'string')
      .filter(f => {
        const ext = path.extname(f);
        const included = exts.includes(ext);
        const excluded = excludePatterns.some(pattern => pattern.test(f));
        return included && !excluded;
      });
  }

  private hashFile(filePath: string): string {
    const buf = fs.readFileSync(filePath);
    return this.keccakHex(buf);
  }

  private merkleRootFromHexLeaves(hexLeaves: string[]): string {
    if (hexLeaves.length === 0) return "";

    let layer = hexLeaves.map(h => Buffer.from(h, "hex"));

    while (layer.length > 1) {
      const next: Buffer[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : left;
        const combined = Buffer.concat([left, right]);
        next.push(Buffer.from(this.keccakHex(combined), "hex"));
      }
      layer = next;
    }

    return layer[0].toString("hex");
  }

  private getFileType(filePath: string): 'markdown' | 'canvas' | 'metadata' {
    const ext = path.extname(filePath);
    if (ext === '.md') return 'markdown';
    if (ext === '.canvas') return 'canvas';
    return 'metadata';
  }

  private generateNodeId(filePath: string, contentHash: string): string {
    return this.keccakHex(filePath + ":" + contentHash);
  }

  public async buildManifest(
    subgraphPath?: string,
    notes?: string
  ): Promise<{ manifest: Manifest; manifestStr: string; signature: string }> {
    const searchPath = subgraphPath
      ? path.join(this.vaultPath, subgraphPath)
      : this.vaultPath;

    const files = this.readFilesSync(searchPath);
    const catalog: Record<string, ManifestCatalogEntry> = {};
    const leaves: string[] = [];

    // Sort files deterministically for consistent root hash
    const sorted = files.sort();

    for (const f of sorted) {
      const fullPath = path.join(searchPath, f);
      const relativePath = path.relative(this.vaultPath, fullPath);

      if (!fs.existsSync(fullPath)) continue;

      const contentHash = this.hashFile(fullPath);
      const nodeId = this.generateNodeId(relativePath, contentHash);

      catalog[nodeId] = {
        hash: contentHash,
        path: relativePath,
        type: this.getFileType(f)
      };

      leaves.push(contentHash);
    }

    const rootHash = this.merkleRootFromHexLeaves(leaves);

    // Create HD wallet from mnemonic and derivation path
    const hdNode = HDNodeWallet.fromMnemonic(
      this.mnemonic,
      undefined, // password
      this.derivationPath
    );

    const wallet = new Wallet(hdNode.privateKey);

    const manifest: Manifest = {
      manifestVersion: "1.0",
      rootHash,
      timestamp: new Date().toISOString(),
      authorAddress: wallet.address,
      derivationPath: this.derivationPath,
      subgraphPath,
      catalog,
      proofsSupported: true,
      notes
    };

    const manifestStr = JSON.stringify(manifest, null, 2);
    const manifestDigest = this.keccakHex(Buffer.from(manifestStr, "utf8"));

    // Sign the manifest digest
    const signature = await wallet.signMessage(Buffer.from(manifestDigest, "hex"));

    manifest.signature = signature;

    return {
      manifest,
      manifestStr: JSON.stringify(manifest, null, 2),
      signature
    };
  }

  public static async verifyManifest(
    manifestStr: string,
    signature: string,
    expectedAuthorAddress: string
  ): Promise<boolean> {
    try {
      const manifest = JSON.parse(manifestStr);
      delete manifest.signature; // Remove signature for verification

      const cleanManifestStr = JSON.stringify(manifest, null, 2);
      const manifestDigest = keccak256(Buffer.from(cleanManifestStr, "utf8")).replace(/^0x/, "");

      const recoveredAddress = Wallet.recover(
        Buffer.from(manifestDigest, "hex"),
        signature
      );

      return recoveredAddress.toLowerCase() === expectedAuthorAddress.toLowerCase();
    } catch (error) {
      console.error("Manifest verification failed:", error);
      return false;
    }
  }

  public generateMetadataTemplate(
    filePath: string,
    title?: string,
    author?: string
  ): NodeMetadata {
    const now = new Date().toISOString();
    const nodeId = this.keccakHex(filePath + ":" + now);

    return {
      id: nodeId,
      title: title || path.basename(filePath, path.extname(filePath)),
      author: author || "Anonymous",
      createdAt: now,
      updatedAt: now,
      rumsfeldScores: { kk: 0, ku: 0, uk: 0, uu: 0 },
      references: [],
      subcomponents: [],
      visibility: 'visible',
      status: 'draft',
      canonical_path: filePath
    };
  }

  public updateRumsfeldScores(
    metadata: NodeMetadata,
    interaction: 'agree' | 'disagree' | 'question' | 'reference' | 'hide'
  ): NodeMetadata {
    const updated = { ...metadata };
    updated.updatedAt = new Date().toISOString();

    switch (interaction) {
      case 'agree':
        updated.rumsfeldScores.kk += 1;
        break;
      case 'disagree':
        updated.rumsfeldScores.ku += 1;
        break;
      case 'question':
        updated.rumsfeldScores.ku += 1;
        break;
      case 'reference':
        updated.rumsfeldScores.uu += 1;
        break;
      case 'hide':
        // Zero out contribution but keep record
        updated.visibility = 'hidden';
        break;
    }

    return updated;
  }
}