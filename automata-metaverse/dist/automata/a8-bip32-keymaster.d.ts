/**
 * A₈: BIP-32 Keymaster Automaton
 *
 * Role: HD Wallet Management
 * Uses BIP32Wallet for key derivation and signing
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import { type BIP32WalletConfig } from '../identity/bip32-wallet.js';
export interface A8BIP32KeymasterState {
    addresses: Map<string, any>;
    defaultPath: string;
    initialized: boolean;
}
/**
 * A₈: BIP-32 Keymaster Automaton
 *
 * Manages hierarchical deterministic wallet operations
 */
export declare class A8_BIP32Keymaster extends BaseAutomaton {
    readonly id: 8;
    readonly name = "A\u2088 BIP-32 Keymaster";
    readonly role = "HD Wallet Management";
    state: A8BIP32KeymasterState;
    private wallet?;
    constructor(config?: BIP32WalletConfig);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    /**
     * Derive address from BIP-32 path
     */
    deriveAddress(path?: string): Promise<any>;
    /**
     * Sign message/data
     */
    signMessage(message: string | Uint8Array, path?: string): Promise<string>;
    /**
     * Sign data for MetaLogNode
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
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get all addresses
     */
    getAddresses(): Map<string, any>;
}
//# sourceMappingURL=a8-bip32-keymaster.d.ts.map