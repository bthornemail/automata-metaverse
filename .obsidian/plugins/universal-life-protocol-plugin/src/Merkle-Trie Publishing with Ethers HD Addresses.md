Project Manifest — Obsidian Canvas → Merkle-Trie Publishing with Ethers HD Addresses

Project name (working): CanvasTrie
Goal (one sentence): Build a deterministic, verifiable publishing layer that treats an Obsidian vault (Markdown + Canvas JSON + optional metadata JSON) as a content-addressed Merkle trie, uses ethers/BIP32 HD derivation for deterministic addressing and signing, and supports selective local → remote publishing, private shared subgraphs, and provenance-preserving sync.

This is the complete project manifest: purpose, architecture, data model, formats, algorithms, APIs, plugin hooks, security, deployment, and an initial roadmap + runnable examples you can drop into a prototype.

1. Purpose & Value Proposition

Preserve the Obsidian vault as the canonical source of truth while enabling: 

portable, content-addressed publishing (Merkle root manifests),

cryptographically verifiable provenance (ethers signatures),

deterministic addressing and partitioning (BIP32/HD paths),

private/shared subgraphs (ECDH-derived symmetric keys),

selective sync / minimal diff transfer (Merkle proofs).

Result: authors keep sovereignty of content; peers can verify authenticity and integrity; publishing is efficient and auditable.

2. Core Concepts & Design Principles

Vault as canonical graph: .md files + *.canvas JSON + optional <slug>.json metadata make the workspace graph.

Content addressing: every file/object hashed (Keccak-256) → leaf IDs (CIDs/hex).

Merkle trie: build Merkle tree across the workspace or selected subgraph; root summarizes snapshot.

HD deterministic addressing: use ethers/HDNode to derive deterministic per-subgraph and per-node addresses (paths encode purpose).

Signed manifests: manifest.json contains root, catalog, metadata and is signed by a derived key (wallet) for provenance.

Bridging / Shared secrets: use computeSharedSecret (ECDH) to derive symmetric keys to encrypt private subgraphs or derive bridge addresses.

Interactive scoring: rumsfeld KK/KU/UK/UU scoring lives in node metadata and is aggregated by parent nodes.

Selective publishing/sync: publish entire manifest or partial subtree; peers pull only needed leaves and verify via Merkle proofs.

3. High-Level Architecture

Clients:

Author desktop: Obsidian vault, plugin that exposes canvas/subgraph export & triggers manifest generator.

Express prototype server: optional staging/publish endpoint (serves manifests, leaves, proofs).

Subscriber client: verifies manifest signature, fetches missing leaves, verifies Merkle proofs, imports.

Storage:

Local filesystem (vault).

Optional remote stores: HTTP server, S3, IPFS, or P2P nodes (content location independent; manifest proves integrity).

Crypto:

Keccak-256 for hashes.

Ethers HD/BIP32 for derivation and signing (secp256k1).

ECDH (computeSharedSecret) for symmetric keys/HKDF for encrypted sharing.

4. Data Model & File Layout

Vault (example):

vault/ canvas/ freedom.canvas notes/ freedom-seed.md reciprocity-essay.md metadata/ freedom-seed.json reciprocity-essay.json manifest-output/ manifest-2025-09-14.json 

Per-Note Metadata (slug.json)

Each markdown file slug.md can have an accompanying slug.json for structured metadata (if you prefer JSON over frontmatter exports).

{ "id": "<derived-id-or-hash>", "title": "Freedom and Reciprocity", "author": "Brian Thorne", "createdAt": "2025-09-14T20:00:00Z", "updatedAt": "2025-09-14T20:30:00Z", "rumsfeldScores": { "kk": 3, "ku": 1, "uk": 0, "uu": 2 }, "references": ["<node-id-1>", "<node-id-2>"], "subcomponents": ["<comment-id-1>", "<block-id-1>"], "visibility": "visible", "status": "published", "canonical_path": "notes/freedom-seed.md" } 

Canvas JSON

Obsidian Canvas file is the topology: nodes, positions, edges, and references to slug.md or slug.json. Use it as the trie topology.

Manifest (manifest.json)

Single signed object describing a published snapshot (example below). It’s the data you publish/POST/pin:

{ "manifestVersion": "1.0", "rootHash": "<keccak-hex-root>", "timestamp": "2025-09-14T20:45:00Z", "authorAddress": "0x1234...abcd", "derivationPath": "m/1'/0'/42'", "subgraphPath": "canvas/freedom.canvas", "catalog": { "<nodeId>": { "hash": "<keccak-hex-leaf>", "path": "notes/freedom-seed.md" }, "<metadataId>": { "hash": "<keccak-...>", "path": "metadata/freedom-seed.json" } }, "proofsSupported": true, "signature": "<ethers-signature-hex>" } 

5. Hashing, Merkle & ID Rules

Hash algorithm: Keccak-256 (ethers-friendly). Use keccak256(bytes) and present hex without 0x.

Leaf hash: For file bytes, leafHash = keccak(fileBytes).

Node id: You may choose nodeId = keccak(filename + ":" + leafHash) — deterministic ID tied to filename & content.

Internal nodes: nodeHash = keccak(left || right) where left/right are raw bytes of child hashes. Duplicate last if odd count.

Merkle root: computed over the set of leaf hashes for the subgraph (deterministic order — sort by path or nodeId to get consistent roots).

Deterministic ordering: always order leaves lexicographically by their canonical path (e.g., canvas/node/path) when building Merkle tree.

6. HD Path Scheme (suggested)

Use BIP32-style paths with ethers HDNode.

Suggested partition:

m/0' — local/private workspace keys (not published).

m/1' — published content root keys (manifests).

m/1'/topicIndex'/nodeIndex' — topic + node indexing for deterministic node addresses.

m/2' — contributor signing keys.

m/3' — ephemeral sharing keys (per-subgraph ephemeral derivations).

Example derivation for a canvas subgraph:

root manifest key: m/1'/0'/42' → derive wallet and sign manifest.

Mapping path → ID:

derivedPubKey = HDNode.fromMnemonic(m).derivePath(path).publicKey

address = keccak(derivedPubKey).slice(-20) (or use standard HDNode.address)

Use address or keccak(address) as a deterministic node identifier.

Important hygiene: use separate purpose paths for identity, publishing, and sharing to avoid correlation leakage.

7. Signing & Verification

Signing: sign the canonical manifest JSON (or its keccak digest) with the derived wallet (wallet.signMessage(digest) or wallet._signTypedData for EIP-712 if you prefer structured signing).

Verification: subscribers compute the same keccak digest of manifest content and use ethers.utils.recoverAddress(digest, signature) to verify authorAddress.

Signature placement: include signature hex in the manifest object under signature.

8. ECDH Bridging & Private Subgraphs

Use computeSharedSecret (ECDH on secp256k1) between author-derived subgraph key and peer key: 

shared = computeSharedSecret(authorPrivateKey, peerPublicKey)

Run HKDF or keccak(shared || info) to derive a symmetric key.

Use symmetric key to: 

Encrypt manifest + leaf payloads (AES-GCM).

Or deterministically derive a bridging path/address for shared nodes.

This allows private sharing without exposing master keys.

9. Sync Protocol (minimal)

Publisher generates manifest.json (root + catalog + signature) and publishes it (HTTP endpoint / IPFS / S3).

Subscriber pulls manifest, verifies signature.

Subscriber requests catalog or specific leaf hashes it needs.

Publisher responds with leaves or proofs (or remote store provides files).

Subscriber verifies each leaf hash matches manifest catalog and optionally verifies Merkle proofs to the root.

Subscriber imports files into local vault or stores in local cache.

Optimizations:

Support range requests for large subgraphs.

Use Merkle proofs to fetch only missing leaves.

Use content-addressed storage: store leaves by their hash (CID) enabling reuse.

10. Obsidian Integration: Plugin Responsibilities

Plugin goals:

Export Canvas subgraph selection → produce list of referenced resources (md + json).

Call local manifest-generator script to compute hashes + root + signature (or implement in-plugin).

UI: “Publish subgraph” button on canvas; show manifest preview + derived address.

Hook into metadata cache: update <slug>.json on interactions (agree/disagree/question/flag), recalc rumsfeldScores.

Provide visual overlays on Canvas nodes: show KK/KU/UK/UU aggregated scores and change history.

Allow selective hide/ignore per-user (updates visibility state in metadata).

Offer “share privately” option that computes shared secret for chosen peers and encrypts manifest + content.

Event model:

On note update → plugin updates slug.json and optionally triggers rehash + manifest refresh for modified subgraphs.

11. Backend (Express) Endpoints (prototype)

GET /manifest/:manifestId → returns manifest JSON (signed).

GET /catalog/:manifestId/:nodeId → returns metadata entry or leaf hash and path.

GET /leaf/:leafHash → returns file bytes (md/json).

POST /publish → accept manifest + files, verify signature, and store.

POST /request-proofs → ask for Merkle proofs for a set of leaves.

Security:

Optional access control for private manifests (token-based).

Use TLS everywhere.

12. Node & Scoring Algorithms

Subcomponent contribution model

Each comment/block has a small NodeScore contribution vector {kk, ku, uk, uu}.

Interactions map to contributions: 

agree → +KK weight (e.g., +1 KK)

disagree → +KU weight and record dispute

question → +KU weight

reference/link → +UU weight (if linking to an unexpected source) or +UK if surfacing implicit knowledge

hide/ignore → zeroes its contribution to parent

Parent node aggregates by weighted sum or normalized average: 

node.rumsfeld = normalize(sum(children.rumsfeld * weight) + base)

Versioning

On each edit, create NodeHistory entry snapshotting rumsfeldScores, timestamp, and change description. These are persisted in slug.json.history.

Conflict resolution

Keep full history and allow authors or moderators to mark resolutions (move KU→KK if resolved).

13. Security & Privacy Considerations

Key hygiene: separate derivation paths for identity vs publishing vs sharing. Avoid reuse that enables correlation.

Seed safety: local mnemonic should be protected (never send raw seed).

Signing transparency: signatures allow others to verify provenance; associate author identity meaningfully.

Private sharing: use ephemeral or per-share symmetric keys from ECDH HKDF; do not share private keys.

Content leaks: when publishing subgraph, ensure no private file paths or secrets are embedded in exported JSON.

Auditability: manifests are immutable snapshots; deleting local files doesn’t erase published proofs—be mindful of permanence.

Legal/ethical: user consent for comments / privacy of contributors; moderation flows.

14. Storage & Deployment Options

Local only (prototype): filesystem + local Express server invoked by plugin.

Centralized remote: Express server hosted on VPS, exposes manifests and leaf retrieval; use standard hosting (Docker + NGINX).

Decentralized: IPFS / Filecoin for content; manifest pointers stored on HTTP gateway or ENS name records.

Hybrid: push manifest to HTTP server + pin files to IPFS; subscribers fetch via IPFS/CID.

15. Developer Roadmap (staged)

Phase 0 — Prototype (week 0–2)

manifest-generator.ts: walk vault, compute keccak leaf hashes, build Merkle root, derive wallet from mnemonic, sign manifest, output manifest.json.

Simple Express server: serve manifests + leaves.

CLI client to verify manifest + download content.

Phase 1 — Obsidian plugin (week 2–4)

Export selected canvas nodes/subgraphs.

Trigger manifest generator; show signer address and signature.

UI for KK/KU/UK/UU scores display & simple interactions.

Phase 2 — Sync & private sharing (week 4–6)

Implement computeSharedSecret flow; encrypt manifests for peers.

Implement Merkle proofs endpoint and proof verifier.

Phase 3 — UX & analytics (week 6–10)

Graph visualizations (KK/KU/UK/UU heatmaps).

Topic subscription & RSS/JSON feeds for published subgraphs.

Integration with IPFS pinning & optional ENS publishing.

Phase 4 — Hardening (week 10–14)

Tests, security audit, performance tune, edge cases.

16. Example: Full Manifest (Concrete)

{ "manifestVersion": "1.0", "rootHash": "d4b0f9b2d8a1e1f3c4f7a2b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e5f6a7b8", "timestamp": "2025-09-14T21:30:00Z", "authorAddress": "0xAbC1234567890defABC1234567890Defabc12345", "derivationPath": "m/1'/0'/42'", "subgraphPath": "canvas/freedom.canvas", "catalog": { "a1b2c3...": { "hash": "f6a7b8...", "path": "notes/freedom-seed.md" }, "e3d4f5...": { "hash": "9c8b7a...", "path": "metadata/freedom-seed.json" } }, "proofsSupported": true, "notes": "Export of canvas/freedom.canvas including referenced notes and metadata", "signature": "0x5c6191... (ethers signature hex)" } 

17. Minimal Working Example (TypeScript) — manifest-generator

This is a runnable conceptual script you can adapt. It expects Node with ethers installed.

// manifest-generator.ts (complete conceptual example) // npm i ethers import fs from "fs"; import path from "path"; import { keccak256, toUtf8Bytes } from "ethers/lib/utils"; import { HDNode, Wallet } from "ethers"; // simple keccak helper function keccakHex(input: Buffer | string) { if (typeof input === "string") input = Buffer.from(input, "utf8"); const hex = keccak256(input); return hex.replace(/^0x/, ""); } function readFilesSync(folder: string, exts = [".md", ".json", ".canvas"]) { return fs.readdirSync(folder).filter(f => exts.includes(path.extname(f))); } function hashFile(filePath: string) { const buf = fs.readFileSync(filePath); return keccakHex(buf); } function merkleRootFromHexLeaves(hexLeaves: string[]) { if (hexLeaves.length === 0) return ""; let layer = hexLeaves.map(h => Buffer.from(h, "hex")); while (layer.length > 1) { const next: Buffer[] = []; for (let i = 0; i < layer.length; i += 2) { const left = layer[i]; const right = i + 1 < layer.length ? layer[i + 1] : left; const combined = Buffer.concat([left, right]); next.push(Buffer.from(keccakHex(combined), "hex")); } layer = next; } return layer[0].toString("hex"); } // Usage: // node manifest-generator.js /path/to/vault "your mnemonic here" "m/1'/0'/42'" async function buildManifest(vaultPath: string, mnemonic: string, derivationPath = "m/1'") { const files = readFilesSync(vaultPath); const catalog: Record<string, { hash: string; path: string }> = {}; const leaves: string[] = []; const sorted = files.sort(); // deterministic order for (const f of sorted) { const full = path.join(vaultPath, f); const h = hashFile(full); const nodeId = keccakHex(f + ":" + h); catalog[nodeId] = { hash: h, path: f }; leaves.push(h); } const root = merkleRootFromHexLeaves(leaves); const hd = HDNode.fromMnemonic(mnemonic).derivePath(derivationPath); const wallet = new Wallet(hd.privateKey); const manifest = { manifestVersion: "1.0", rootHash: root, timestamp: new Date().toISOString(), authorAddress: wallet.address, derivationPath, catalog }; const manifestStr = JSON.stringify(manifest, null, 2); const manifestDigest = keccakHex(Buffer.from(manifestStr, "utf8")); const sig = await wallet.signMessage(Buffer.from(manifestDigest, "hex")); manifest["signature"] = sig; return { manifest, manifestStr, signature: sig }; } // Example call (uncomment to run) // const [vault, mnemonic, derivPath] = process.argv.slice(2); // buildManifest(vault, mnemonic, derivPath || "m/1'") // .then(r => { // fs.writeFileSync(path.join(vault, "manifest.json"), r.manifestStr); // console.log("Manifest written with signature:", r.signature); // }) // .catch(console.error); 

18. Tests & Verification

Unit tests: 

Hashing determinism tests (same content -> same hash).

Merkle proof generation & verification.

Manifest signature/verification.

Integration tests: 

Roundtrip publish → subscribe → verify manifest + leaf integrity.

ECDH shared-secret encryption/decryption test between two derived keys.

19. UX Notes (Author + Reader)

Author experience: 

Export subgraph via Obsidian UI, preview manifest, sign with derived wallet, choose public or private share, push to remote.

Visualize node KK/KU/UK/UU heatmap on Canvas.

Reader experience: 

Subscribe to manifests/feeds of subgraphs or topics.

See provenance (author address + manifest timestamp + signature).

Optionally request Merkle proofs or fetch full content.

Interact with blocks: agree/disagree/question/flag — interactions update metadata and contribution weights in subsequent versions.

20. Operational Considerations

Backup: manifest + signatures are append-only proofs—store them offsite (IPFS/Git).

Revocation: manifests are immutable — to "unpublish" generate a new manifest that marks previous one deprecated. Keep history.

Key rotation: if an author must rotate keys, publish a key-rotation manifest signed by both old and new keys (dual-signed) to prove continuity.

21. Roadmap: First Deliverable I Can Produce Right Now

I can produce a fully runnable artifact next:

Option A (recommended): manifest-generator.ts — complete script that: 

takes vault path + mnemonic + derivation path,

computes keccak leaf hashes,

builds merkle root,

signs manifest,

writes manifest.json (and sample catalog).

Option B: Minimal Express server scaffold that serves manifests/leaves and supports a simple /publish.

Option C: Obsidian plugin skeleton that exports canvas and invokes local generator.

Pick A, B, or C and I will produce the full runnable code + README for that option.

22. Final Notes (philosophy + fit)

This design keeps your Obsidian vault as the authoritative working space (sovereignty), uses well-known crypto tooling (ethers) for practical signing/addressing, and adds content-addressing + merkle proofs for verifiable publishing. The canvas → trie mapping mirrors your idea of a deterministic document graph, and ECDH bridging gives you secure private collaboration for shared spiritual/intellectual work.

If you want me to produce the runnable manifest-generator.ts (Option A), I will include:

instructions to run,

sample vault layout,

example manifest output,

and a verification script to confirm signature + root.

