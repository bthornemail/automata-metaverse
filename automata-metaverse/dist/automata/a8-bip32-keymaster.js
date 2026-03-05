/**
 * A₈: BIP-32 Keymaster Automaton
 *
 * Role: HD Wallet Management
 * Uses BIP32Wallet for key derivation and signing
 */
import { BaseAutomaton } from './types.js';
import { BIP32Wallet } from '../identity/bip32-wallet.js';
/**
 * A₈: BIP-32 Keymaster Automaton
 *
 * Manages hierarchical deterministic wallet operations
 */
export class A8_BIP32Keymaster extends BaseAutomaton {
    constructor(config) {
        super();
        this.id = 8;
        this.name = 'A₈ BIP-32 Keymaster';
        this.role = 'HD Wallet Management';
        this.state = {
            addresses: new Map(),
            defaultPath: "m/44'/60'/0'/0/0",
            initialized: false
        };
        this.wallet = new BIP32Wallet(config);
        if (config?.path) {
            this.state.defaultPath = config.path;
        }
    }
    async tick(swarm) {
        if (!this.state.initialized) {
            await this.initialize(swarm);
        }
        // Wallet operations are request-driven, no ongoing tick operations
    }
    async initialize(swarm) {
        try {
            await this.wallet?.initialize();
            // Derive default address
            if (this.wallet) {
                const address = await this.wallet.deriveAddress(this.state.defaultPath);
                this.state.addresses.set(this.state.defaultPath, address);
            }
            this.state.initialized = true;
            console.log('A₈: BIP-32 Keymaster initialized');
        }
        catch (error) {
            console.error('A₈: Error initializing wallet:', error);
            // Continue without wallet if ethers not available
            this.state.initialized = true;
        }
    }
    /**
     * Derive address from BIP-32 path
     */
    async deriveAddress(path) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        const derivePath = path || this.state.defaultPath;
        const address = await this.wallet.deriveAddress(derivePath);
        this.state.addresses.set(derivePath, address);
        return address;
    }
    /**
     * Sign message/data
     */
    async signMessage(message, path) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        return await this.wallet.signMessage(message, path || this.state.defaultPath);
    }
    /**
     * Sign data for MetaLogNode
     */
    async signData(data, path) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        return await this.wallet.signData(data, path || this.state.defaultPath);
    }
    /**
     * Get mnemonic (for backup)
     */
    getMnemonic() {
        return this.wallet?.getMnemonic();
    }
    /**
     * Get default path
     */
    getDefaultPath() {
        return this.state.defaultPath;
    }
    /**
     * Set default path
     */
    setDefaultPath(path) {
        this.state.defaultPath = path;
        this.wallet?.setDefaultPath(path);
    }
    async receive(from, message) {
        if (message.type === 'derive-address') {
            const { path } = message.payload || {};
            await this.deriveAddress(path);
        }
        else if (message.type === 'sign-message') {
            const { message: msg, path } = message.payload || {};
            if (msg) {
                await this.signMessage(msg, path);
            }
        }
        else if (message.type === 'sign-data') {
            const { data, path } = message.payload || {};
            if (data) {
                await this.signData(data, path);
            }
        }
    }
    /**
     * Get all addresses
     */
    getAddresses() {
        return this.state.addresses;
    }
}
//# sourceMappingURL=a8-bip32-keymaster.js.map