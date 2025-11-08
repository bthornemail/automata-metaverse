/**
 * Shared Secret Management
 * 
 * Provides ECDH-based shared secret computation and AES-GCM encryption
 * for secure peer-to-peer manifest sharing and collaborative editing.
 * 
 * Integration with automaton system:
 * - Used for encrypted automaton state sharing
 * - Supports deterministic bridge addresses for subgraph sharing
 * - Enables collaborative editing contexts
 */

import { keccak256, HDNodeWallet, Wallet, SigningKey } from "ethers";
import crypto from "crypto";

export interface EncryptedManifest {
  encryptedData: string;
  iv: string;
  authTag: string;
  derivationPath: string;
  authorPublicKey: string;
  ephemeralPublicKey?: string;
}

export interface SharedSecretConfig {
  authorPrivateKey: string;
  peerPublicKey: string;
  context?: string;
}

export class SharedSecretManager {
  private mnemonic: string;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
  }

  /**
   * Derive a wallet for a specific purpose using HD derivation
   */
  public deriveWallet(derivationPath: string): HDNodeWallet {
    return HDNodeWallet.fromMnemonic(this.mnemonic, undefined, derivationPath);
  }

  /**
   * Generate ECDH shared secret between author and peer
   */
  public static computeSharedSecret(
    authorPrivateKey: string,
    peerPublicKey: string,
    context = "canvas-bridge"
  ): Buffer {
    const signingKey = new SigningKey(authorPrivateKey);
    const sharedPoint = signingKey.computeSharedSecret(peerPublicKey);

    // Use HKDF to derive a proper symmetric key from the shared secret
    return crypto.hkdfSync(
      "sha256",
      Buffer.from(sharedPoint.slice(2), "hex"), // Remove 0x prefix
      Buffer.from("universal-life-vault-salt"),
      Buffer.from(context),
      32 // 256-bit key
    );
  }

  /**
   * Encrypt manifest data using AES-GCM with ECDH-derived key
   */
  public encryptManifest(
    manifestStr: string,
    peerPublicKey: string,
    authorDerivationPath = "m/3'/0'/0'" // Ephemeral sharing key path
  ): EncryptedManifest {
    const authorWallet = this.deriveWallet(authorDerivationPath);
    const sharedSecret = SharedSecretManager.computeSharedSecret(
      authorWallet.privateKey,
      peerPublicKey
    );

    // Generate random IV for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipherGCM("aes-256-gcm", sharedSecret);
    cipher.setAAD(Buffer.from(authorWallet.publicKey)); // Use author public key as additional auth data

    let encrypted = cipher.update(manifestStr, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      derivationPath: authorDerivationPath,
      authorPublicKey: authorWallet.publicKey
    };
  }

  /**
   * Decrypt manifest data using ECDH-derived key
   */
  public static decryptManifest(
    encryptedManifest: EncryptedManifest,
    peerPrivateKey: string
  ): string {
    const sharedSecret = this.computeSharedSecret(
      peerPrivateKey,
      encryptedManifest.authorPublicKey
    );

    const decipher = crypto.createDecipherGCM("aes-256-gcm", sharedSecret);
    decipher.setAuthTag(Buffer.from(encryptedManifest.authTag, "hex"));
    decipher.setAAD(Buffer.from(encryptedManifest.authorPublicKey)); // Match AAD used during encryption

    let decrypted = decipher.update(encryptedManifest.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Generate deterministic bridge address for shared subgraph
   */
  public generateBridgeAddress(
    peerPublicKey: string,
    subgraphId: string,
    authorDerivationPath = "m/2'/0'/0'" // Bridge derivation path
  ): string {
    const authorWallet = this.deriveWallet(authorDerivationPath);
    const sharedSecret = SharedSecretManager.computeSharedSecret(
      authorWallet.privateKey,
      peerPublicKey,
      `bridge-${subgraphId}`
    );

    // Derive deterministic address from shared secret
    const addressHash = keccak256(Buffer.concat([
      sharedSecret,
      Buffer.from(subgraphId),
      Buffer.from(authorWallet.publicKey.slice(2), "hex")
    ]));

    // Take last 20 bytes as address
    return "0x" + addressHash.slice(-40);
  }

  /**
   * Create a shared context for collaborative editing
   */
  public createSharedContext(
    peers: string[], // Array of peer public keys
    contextId: string,
    authorDerivationPath = "m/3'/1'/0'"
  ): {
    contextAddress: string;
    encryptedKeys: Record<string, EncryptedManifest>;
    authorPublicKey: string;
  } {
    const authorWallet = this.deriveWallet(authorDerivationPath);
    const contextKey = crypto.randomBytes(32);

    // Create deterministic context address
    const contextAddress = "0x" + keccak256(Buffer.concat([
      contextKey,
      Buffer.from(contextId),
      Buffer.from(authorWallet.publicKey.slice(2), "hex")
    ])).slice(-40);

    const encryptedKeys: Record<string, EncryptedManifest> = {};

    // Encrypt context key for each peer
    for (const peerPublicKey of peers) {
      const sharedSecret = SharedSecretManager.computeSharedSecret(
        authorWallet.privateKey,
        peerPublicKey,
        `context-${contextId}`
      );

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipherGCM("aes-256-gcm", sharedSecret);
      cipher.setAAD(Buffer.from(contextId));

      let encrypted = cipher.update(contextKey, null, "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      encryptedKeys[peerPublicKey] = {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        derivationPath: authorDerivationPath,
        authorPublicKey: authorWallet.publicKey
      };
    }

    return {
      contextAddress,
      encryptedKeys,
      authorPublicKey: authorWallet.publicKey
    };
  }

  /**
   * Decrypt context key for collaborative editing
   */
  public static decryptContextKey(
    encryptedKey: EncryptedManifest,
    contextId: string,
    peerPrivateKey: string
  ): Buffer {
    const sharedSecret = this.computeSharedSecret(
      peerPrivateKey,
      encryptedKey.authorPublicKey,
      `context-${contextId}`
    );

    const decipher = crypto.createDecipherGCM("aes-256-gcm", sharedSecret);
    decipher.setAuthTag(Buffer.from(encryptedKey.authTag, "hex"));
    decipher.setAAD(Buffer.from(contextId));

    const decrypted = decipher.update(encryptedKey.encryptedData, "hex");
    const final = decipher.final();

    return Buffer.concat([decrypted, final]);
  }

  /**
   * Generate key derivation paths for different purposes
   * 
   * Standard paths:
   * - m/0' - Local/private workspace keys
   * - m/1' - Published content root keys
   * - m/2' - Contributor signing keys
   * - m/3' - Ephemeral sharing keys
   */
  public static getStandardPaths() {
    return {
      LOCAL_PRIVATE: "m/0'", // Local/private workspace keys
      PUBLISHED_ROOT: "m/1'", // Published content root keys
      CONTRIBUTOR_SIGNING: "m/2'", // Contributor signing keys
      EPHEMERAL_SHARING: "m/3'", // Ephemeral sharing keys

      // Specific use cases
      publishedManifest: (topicIndex: number, nodeIndex: number) => `m/1'/${topicIndex}'/${nodeIndex}'`,
      contributorKey: (contributorIndex: number) => `m/2'/${contributorIndex}'`,
      sharingKey: (shareIndex: number, sessionIndex: number) => `m/3'/${shareIndex}'/${sessionIndex}'`
    };
  }
}
