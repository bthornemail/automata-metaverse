/**
 * Identity Service
 * 
 * Unified identity management service integrating HD wallets, deterministic addressing,
 * and harmonic vector generation for the automaton system.
 * 
 * Integration with automaton system:
 * - Deterministic addressing for R5RS functions
 * - Consistent node addressing in JSONL canvas
 * - Harmonic vector-based addressing for computational topology
 */

import { HDNodeWallet, Wallet } from "ethers";
import { deriveWallet, StandardDerivationPaths } from "../shared/crypto/hd-wallet.js";
import { generateHarmonicVector, harmonize } from "../shared/math/harmonic-vectors.js";
import { normalizeVectorToPath, generateDeterministicAddress } from "../shared/crypto/deterministic-address.js";

export interface IdentityConfig {
  mnemonic: string;
  defaultDerivationPath?: string;
}

export class IdentityService {
  private mnemonic: string;
  private defaultDerivationPath: string;

  constructor(config: IdentityConfig) {
    this.mnemonic = config.mnemonic;
    this.defaultDerivationPath = config.defaultDerivationPath || StandardDerivationPaths.LOCAL_PRIVATE;
  }

  /**
   * Derive wallet for specific purpose
   */
  public deriveWallet(derivationPath?: string): HDNodeWallet {
    return deriveWallet(this.mnemonic, derivationPath || this.defaultDerivationPath);
  }

  /**
   * Generate deterministic address from harmonic vector
   */
  public getDeterministicAddressFromVector(
    harmonicVector: number[],
    childIndex: number,
    derivationPath?: string
  ): { address: string; privateKey: string } {
    // Use harmonic vector to create deterministic derivation
    const normalizedPath = normalizeVectorToPath(harmonicVector, childIndex);
    
    // Create custom derivation path from normalized vector
    const customPath = normalizedPath.map(idx => idx.toString()).join('/');
    const fullPath = derivationPath 
      ? `${derivationPath}/${customPath}`
      : `${this.defaultDerivationPath}/${customPath}`;
    
    const wallet = this.deriveWallet(fullPath);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  /**
   * Generate deterministic address from data
   */
  public generateAddressFromData(
    data: any,
    childIndex: number = 0,
    derivationPath?: string
  ): string {
    const harmonicVector = generateHarmonicVector(data);
    return generateDeterministicAddress(
      harmonicVector,
      this.mnemonic,
      derivationPath || this.defaultDerivationPath
    );
  }

  /**
   * Get standard derivation paths
   */
  public static getStandardPaths() {
    return StandardDerivationPaths;
  }
}
