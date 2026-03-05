/**
 * BIP-32 HD Wallet Manager
 *
 * Manages BIP-32/39/44 hierarchical deterministic wallets
 * Uses ethers.js (peer dependency)
 */
export interface BIP32WalletConfig {
    mnemonic?: string;
    path?: string;
}
export interface WalletAddress {
    address: string;
    path: string;
    publicKey: string;
}
/**
 * BIP-32 HD Wallet Manager
 *
 * Handles HD wallet operations using BIP-32/39/44
 */
export declare class BIP32Wallet {
    private mnemonic?;
    private defaultPath;
    private wallet?;
    constructor(config?: BIP32WalletConfig);
    /**
     * Initialize wallet from mnemonic or generate new one
     */
    initialize(): Promise<void>;
    /**
     * Derive address from BIP-32 path
     */
    deriveAddress(path?: string): Promise<WalletAddress>;
    /**
     * Sign message with private key
     */
    signMessage(message: string | Uint8Array, path?: string): Promise<string>;
    /**
     * Sign data (for MetaLogNode signing)
     */
    signData(data: string | Uint8Array, path?: string): Promise<string>;
    /**
     * Get mnemonic (for backup)
     */
    getMnemonic(): string | undefined;
    /**
     * Get default path
     */
    getDefaultPath(): string;
    /**
     * Set default path
     */
    setDefaultPath(path: string): void;
}
//# sourceMappingURL=bip32-wallet.d.ts.map