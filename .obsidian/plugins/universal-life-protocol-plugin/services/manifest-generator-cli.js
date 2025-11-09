#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the manifest generator (will be compiled TypeScript)
async function loadManifestGenerator() {
  try {
    // Try to import the compiled JavaScript version first
    const { ManifestGenerator } = await import("../dist/src/manifest-generator.js");
    return ManifestGenerator;
  } catch (error) {
    console.log("Compiled version not found, using ts-node...");
    // Fallback to ts-node for development
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    require("tsx/esm");
    const { ManifestGenerator } = await import("../src/manifest-generator.ts");
    return ManifestGenerator;
  }
}

function showUsage() {
  console.log(`
Usage: manifest-generator-cli <vault-path> <mnemonic> [options]

Options:
  --derivation-path <path>    HD derivation path (default: "m/1'/0'/0'")
  --subgraph-path <path>      Relative path to subgraph (optional)
  --notes <text>             Additional notes for the manifest
  --output <file>            Output file path (default: <vault>/manifest-<timestamp>.json)
  --verify                   Verify generated manifest signature

Examples:
  # Generate manifest for entire vault
  manifest-generator-cli ./Vault "your mnemonic words here"

  # Generate manifest for specific canvas subgraph
  manifest-generator-cli ./Vault "your mnemonic words here" --subgraph-path "canvas/freedom.canvas"

  # Custom derivation path and output
  manifest-generator-cli ./Vault "your mnemonic words here" --derivation-path "m/1'/1'/0'" --output "./my-manifest.json"
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const vaultPath = args[0];
  const mnemonic = args[1];

  // Parse additional options
  let derivationPath = "m/1'/0'/0'";
  let subgraphPath = undefined;
  let notes = undefined;
  let outputPath = undefined;
  let shouldVerify = false;

  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--derivation-path':
        derivationPath = args[++i];
        break;
      case '--subgraph-path':
        subgraphPath = args[++i];
        break;
      case '--notes':
        notes = args[++i];
        break;
      case '--output':
        outputPath = args[++i];
        break;
      case '--verify':
        shouldVerify = true;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault path does not exist: ${vaultPath}`);
    process.exit(1);
  }

  try {
    console.log("Loading manifest generator...");
    const ManifestGenerator = await loadManifestGenerator();

    console.log(`Generating manifest for vault: ${vaultPath}`);
    console.log(`Using derivation path: ${derivationPath}`);
    if (subgraphPath) {
      console.log(`Subgraph path: ${subgraphPath}`);
    }

    const generator = new ManifestGenerator(vaultPath, mnemonic, derivationPath);
    const result = await generator.buildManifest(subgraphPath, notes);

    // Determine output path
    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = path.join(vaultPath, `manifest-${timestamp}.json`);
    }

    // Write manifest to file
    fs.writeFileSync(outputPath, result.manifestStr);

    console.log(`\\n✅ Manifest generated successfully!`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`🏠 Author address: ${result.manifest.authorAddress}`);
    console.log(`🌳 Root hash: ${result.manifest.rootHash}`);
    console.log(`📝 Files cataloged: ${Object.keys(result.manifest.catalog).length}`);
    console.log(`✍️  Signature: ${result.signature.substring(0, 20)}...`);

    if (shouldVerify) {
      console.log(`\\n🔍 Verifying signature...`);
      const isValid = await ManifestGenerator.verifyManifest(
        result.manifestStr,
        result.signature,
        result.manifest.authorAddress
      );
      console.log(`✅ Signature valid: ${isValid}`);
    }

    console.log(`\\n📋 Catalog summary:`);
    Object.entries(result.manifest.catalog).forEach(([nodeId, entry]) => {
      console.log(`  ${entry.type?.padEnd(8)} ${entry.path} (${entry.hash.substring(0, 8)}...)`);
    });

  } catch (error) {
    console.error("❌ Error generating manifest:", error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);