#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import our modules
let ManifestGenerator, SharedSecretManager;

async function loadModules() {
  try {
    const manifestModule = await import('../dist/src/manifest-generator.js');
    const sharedSecretsModule = await import('../dist/src/shared-secrets.js');
    ManifestGenerator = manifestModule.ManifestGenerator;
    SharedSecretManager = sharedSecretsModule.SharedSecretManager;
  } catch (error) {
    console.log('Using TypeScript modules directly...');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    require('tsx/esm');

    const manifestModule = await import('../src/manifest-generator.ts');
    const sharedSecretsModule = await import('../src/shared-secrets.ts');
    ManifestGenerator = manifestModule.ManifestGenerator;
    SharedSecretManager = sharedSecretsModule.SharedSecretManager;
  }
}

class ManifestServer {
  constructor(options = {}) {
    this.app = express();
    this.port = options.port || 3000;
    this.storageDir = options.storageDir || path.join(__dirname, '../storage');
    this.manifestsDir = path.join(this.storageDir, 'manifests');
    this.leavesDir = path.join(this.storageDir, 'leaves');
    this.encryptedDir = path.join(this.storageDir, 'encrypted');

    this.setupDirectories();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupDirectories() {
    for (const dir of [this.storageDir, this.manifestsDir, this.leavesDir, this.encryptedDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Get manifest by ID
    this.app.get('/manifest/:manifestId', this.getManifest.bind(this));

    // Get catalog entry
    this.app.get('/catalog/:manifestId/:nodeId', this.getCatalogEntry.bind(this));

    // Get leaf by hash
    this.app.get('/leaf/:leafHash', this.getLeaf.bind(this));

    // Publish manifest and files
    this.app.post('/publish', this.publishManifest.bind(this));

    // Request Merkle proofs
    this.app.post('/request-proofs', this.requestProofs.bind(this));

    // Get encrypted manifest (for private sharing)
    this.app.get('/encrypted/:encryptedId', this.getEncryptedManifest.bind(this));

    // Publish encrypted manifest
    this.app.post('/publish-encrypted', this.publishEncryptedManifest.bind(this));

    // List available manifests
    this.app.get('/manifests', this.listManifests.bind(this));

    // Search manifests
    this.app.post('/search', this.searchManifests.bind(this));

    // Verify manifest
    this.app.post('/verify', this.verifyManifest.bind(this));
  }

  async getManifest(req, res) {
    try {
      const { manifestId } = req.params;
      const manifestPath = path.join(this.manifestsDir, `${manifestId}.json`);

      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({ error: 'Manifest not found' });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      res.json(manifest);
    } catch (error) {
      console.error('Error getting manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCatalogEntry(req, res) {
    try {
      const { manifestId, nodeId } = req.params;
      const manifestPath = path.join(this.manifestsDir, `${manifestId}.json`);

      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({ error: 'Manifest not found' });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const catalogEntry = manifest.catalog[nodeId];

      if (!catalogEntry) {
        return res.status(404).json({ error: 'Node not found in catalog' });
      }

      res.json(catalogEntry);
    } catch (error) {
      console.error('Error getting catalog entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLeaf(req, res) {
    try {
      const { leafHash } = req.params;
      const leafPath = path.join(this.leavesDir, `${leafHash}.bin`);

      if (!fs.existsSync(leafPath)) {
        return res.status(404).json({ error: 'Leaf not found' });
      }

      const leafData = fs.readFileSync(leafPath);

      // Set appropriate content type based on file extension stored in metadata
      const metadataPath = path.join(this.leavesDir, `${leafHash}.meta.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        if (metadata.originalPath) {
          const ext = path.extname(metadata.originalPath);
          if (ext === '.md') {
            res.setHeader('Content-Type', 'text/markdown');
          } else if (ext === '.json' || ext === '.canvas') {
            res.setHeader('Content-Type', 'application/json');
          }
        }
      }

      res.send(leafData);
    } catch (error) {
      console.error('Error getting leaf:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async publishManifest(req, res) {
    try {
      const { manifest, files } = req.body;

      if (!manifest || !manifest.signature) {
        return res.status(400).json({ error: 'Invalid manifest or missing signature' });
      }

      // Verify manifest signature
      const isValid = await ManifestGenerator.verifyManifest(
        JSON.stringify(manifest),
        manifest.signature,
        manifest.authorAddress
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid manifest signature' });
      }

      // Generate manifest ID from root hash and author address
      const manifestId = this.generateId(manifest.rootHash + manifest.authorAddress);

      // Store manifest
      const manifestPath = path.join(this.manifestsDir, `${manifestId}.json`);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // Store leaf files
      const storedLeaves = {};
      if (files) {
        for (const [nodeId, fileData] of Object.entries(files)) {
          const catalogEntry = manifest.catalog[nodeId];
          if (catalogEntry) {
            const leafPath = path.join(this.leavesDir, `${catalogEntry.hash}.bin`);
            const metadataPath = path.join(this.leavesDir, `${catalogEntry.hash}.meta.json`);

            // Store file data
            const fileBuffer = Buffer.from(fileData.content, fileData.encoding || 'base64');
            fs.writeFileSync(leafPath, fileBuffer);

            // Store metadata
            fs.writeFileSync(metadataPath, JSON.stringify({
              nodeId,
              originalPath: catalogEntry.path,
              storedAt: new Date().toISOString(),
              manifestId
            }, null, 2));

            storedLeaves[nodeId] = {
              hash: catalogEntry.hash,
              path: catalogEntry.path,
              stored: true
            };
          }
        }
      }

      res.json({
        manifestId,
        rootHash: manifest.rootHash,
        authorAddress: manifest.authorAddress,
        storedLeaves,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error publishing manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async requestProofs(req, res) {
    try {
      const { manifestId, leafHashes } = req.body;

      if (!manifestId || !Array.isArray(leafHashes)) {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }

      const manifestPath = path.join(this.manifestsDir, `${manifestId}.json`);
      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({ error: 'Manifest not found' });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Generate Merkle proofs for requested leaves
      const proofs = {};
      const allHashes = Object.values(manifest.catalog).map(entry => entry.hash);

      for (const leafHash of leafHashes) {
        const proof = this.generateMerkleProof(allHashes, leafHash);
        if (proof) {
          proofs[leafHash] = proof;
        }
      }

      res.json({
        manifestId,
        rootHash: manifest.rootHash,
        proofs
      });

    } catch (error) {
      console.error('Error generating proofs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEncryptedManifest(req, res) {
    try {
      const { encryptedId } = req.params;
      const encryptedPath = path.join(this.encryptedDir, `${encryptedId}.json`);

      if (!fs.existsSync(encryptedPath)) {
        return res.status(404).json({ error: 'Encrypted manifest not found' });
      }

      const encryptedData = JSON.parse(fs.readFileSync(encryptedPath, 'utf-8'));
      res.json(encryptedData);
    } catch (error) {
      console.error('Error getting encrypted manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async publishEncryptedManifest(req, res) {
    try {
      const { encryptedManifest, peerPublicKey } = req.body;

      if (!encryptedManifest || !peerPublicKey) {
        return res.status(400).json({ error: 'Missing encrypted manifest or peer public key' });
      }

      const encryptedId = this.generateId(encryptedManifest.encryptedData + peerPublicKey);
      const encryptedPath = path.join(this.encryptedDir, `${encryptedId}.json`);

      fs.writeFileSync(encryptedPath, JSON.stringify({
        ...encryptedManifest,
        peerPublicKey,
        publishedAt: new Date().toISOString()
      }, null, 2));

      res.json({
        encryptedId,
        publishedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error publishing encrypted manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async listManifests(req, res) {
    try {
      const { limit = 50, offset = 0, authorAddress } = req.query;

      const manifestFiles = fs.readdirSync(this.manifestsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const manifestPath = path.join(this.manifestsDir, f);
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            return {
              manifestId: path.basename(f, '.json'),
              rootHash: manifest.rootHash,
              authorAddress: manifest.authorAddress,
              timestamp: manifest.timestamp,
              subgraphPath: manifest.subgraphPath,
              derivationPath: manifest.derivationPath,
              catalogSize: Object.keys(manifest.catalog).length
            };
          } catch (error) {
            console.warn(`Failed to parse manifest ${f}:`, error);
            return null;
          }
        })
        .filter(Boolean);

      let filteredManifests = manifestFiles;
      if (authorAddress) {
        filteredManifests = manifestFiles.filter(m => m.authorAddress === authorAddress);
      }

      // Sort by timestamp (newest first)
      filteredManifests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const paginatedManifests = filteredManifests.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      res.json({
        manifests: paginatedManifests,
        total: filteredManifests.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('Error listing manifests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async searchManifests(req, res) {
    try {
      const { query, authorAddress, dateRange, subgraphPath } = req.body;

      const manifestFiles = fs.readdirSync(this.manifestsDir)
        .filter(f => f.endsWith('.json'));

      const results = [];

      for (const file of manifestFiles) {
        const manifestPath = path.join(this.manifestsDir, file);
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

          // Apply filters
          if (authorAddress && manifest.authorAddress !== authorAddress) continue;
          if (subgraphPath && manifest.subgraphPath !== subgraphPath) continue;
          if (dateRange) {
            const timestamp = new Date(manifest.timestamp);
            if (dateRange.from && timestamp < new Date(dateRange.from)) continue;
            if (dateRange.to && timestamp > new Date(dateRange.to)) continue;
          }

          // Search in notes and catalog paths
          if (query) {
            const searchText = (manifest.notes || '').toLowerCase();
            const catalogPaths = Object.values(manifest.catalog)
              .map(entry => entry.path)
              .join(' ')
              .toLowerCase();

            if (!searchText.includes(query.toLowerCase()) &&
                !catalogPaths.includes(query.toLowerCase())) {
              continue;
            }
          }

          results.push({
            manifestId: path.basename(file, '.json'),
            rootHash: manifest.rootHash,
            authorAddress: manifest.authorAddress,
            timestamp: manifest.timestamp,
            subgraphPath: manifest.subgraphPath,
            notes: manifest.notes,
            catalogSize: Object.keys(manifest.catalog).length
          });

        } catch (error) {
          console.warn(`Failed to search manifest ${file}:`, error);
        }
      }

      // Sort by relevance/timestamp
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        results,
        query,
        total: results.length
      });

    } catch (error) {
      console.error('Error searching manifests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyManifest(req, res) {
    try {
      const { manifestData, signature, authorAddress } = req.body;

      if (!manifestData || !signature || !authorAddress) {
        return res.status(400).json({ error: 'Missing required verification parameters' });
      }

      const isValid = await ManifestGenerator.verifyManifest(
        JSON.stringify(manifestData),
        signature,
        authorAddress
      );

      res.json({
        valid: isValid,
        authorAddress,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error verifying manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  generateId(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Simple Merkle proof generation (for demonstration)
  generateMerkleProof(allHashes, targetHash) {
    const index = allHashes.indexOf(targetHash);
    if (index === -1) return null;

    const proof = [];
    let layer = allHashes.map(h => Buffer.from(h, 'hex'));
    let currentIndex = index;

    while (layer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : left;

        if (i === currentIndex || i + 1 === currentIndex) {
          // This is our target node, add sibling to proof
          const sibling = i === currentIndex ? right : left;
          proof.push({
            hash: sibling.toString('hex'),
            position: i === currentIndex ? 'right' : 'left'
          });
        }

        const combined = Buffer.concat([left, right]);
        nextLayer.push(Buffer.from(crypto.createHash('sha256').update(combined).digest('hex'), 'hex'));
      }

      layer = nextLayer;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Manifest server running on port ${this.port}`);
      console.log(`📁 Storage directory: ${this.storageDir}`);
      console.log(`🌐 API endpoints:`);
      console.log(`   GET  /health                    - Health check`);
      console.log(`   GET  /manifest/:id              - Get manifest`);
      console.log(`   GET  /leaf/:hash                - Get leaf content`);
      console.log(`   POST /publish                   - Publish manifest`);
      console.log(`   POST /request-proofs            - Request Merkle proofs`);
      console.log(`   GET  /manifests                 - List manifests`);
      console.log(`   POST /search                    - Search manifests`);
    });
  }
}

// CLI interface
async function main() {
  await loadModules();

  const args = process.argv.slice(2);
  const options = {
    port: 3000,
    storageDir: path.join(__dirname, '../storage')
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        options.port = parseInt(args[++i]);
        break;
      case '--storage':
        options.storageDir = args[++i];
        break;
      case '--help':
        console.log(`
Usage: manifest-server [options]

Options:
  --port <number>     Server port (default: 3000)
  --storage <path>    Storage directory (default: ../storage)
  --help             Show this help message

Environment Variables:
  PORT               Server port (overrides --port)
  STORAGE_DIR        Storage directory (overrides --storage)
`);
        process.exit(0);
    }
  }

  // Override with environment variables
  if (process.env.PORT) {
    options.port = parseInt(process.env.PORT);
  }
  if (process.env.STORAGE_DIR) {
    options.storageDir = process.env.STORAGE_DIR;
  }

  const server = new ManifestServer(options);
  server.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down manifest server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down manifest server...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ManifestServer };