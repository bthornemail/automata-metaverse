/**
 * A₇: WebAuthn Oracle Automaton
 *
 * Role: Biometric Authentication
 * Uses WebAuthnManager for credential management
 */
import { BaseAutomaton } from './types.js';
import { WebAuthnManager } from '../identity/webauthn-manager.js';
/**
 * A₇: WebAuthn Oracle Automaton
 *
 * Manages WebAuthn authentication
 */
export class A7_WebAuthnOracle extends BaseAutomaton {
    constructor(config) {
        super();
        this.id = 7;
        this.name = 'A₇ WebAuthn Oracle';
        this.role = 'Biometric Authentication';
        this.state = {
            credentials: new Map(),
            authenticated: false,
            initialized: false
        };
        // Only initialize in browser environment
        if (typeof window !== 'undefined') {
            this.webauthnManager = new WebAuthnManager(config);
        }
    }
    async tick(swarm) {
        if (!this.state.initialized) {
            await this.initialize(swarm);
        }
        // WebAuthn operations are user-initiated, no ongoing tick operations
    }
    async initialize(swarm) {
        if (!this.webauthnManager) {
            console.warn('A₇: WebAuthn not available (Node.js environment)');
            this.state.initialized = true;
            return;
        }
        if (!this.webauthnManager.isSupported()) {
            console.warn('A₇: WebAuthn not supported in this browser');
            this.state.initialized = true;
            return;
        }
        this.state.initialized = true;
        console.log('A₇: WebAuthn Oracle initialized');
    }
    /**
     * Create WebAuthn credential
     */
    async createCredential(userId, userName) {
        if (!this.webauthnManager) {
            throw new Error('WebAuthn not available');
        }
        try {
            const credential = await this.webauthnManager.createCredential(userId, userName);
            this.state.credentials.set(credential.id, {
                id: credential.id,
                userId,
                userName,
                createdAt: Date.now()
            });
            console.log('A₇: Created WebAuthn credential');
            return credential;
        }
        catch (error) {
            console.error('A₇: Error creating credential:', error);
            throw error;
        }
    }
    /**
     * Verify WebAuthn assertion
     */
    async verifyAssertion(credentialId, challenge) {
        if (!this.webauthnManager) {
            return false;
        }
        try {
            await this.webauthnManager.verifyAssertion(credentialId, challenge);
            this.state.authenticated = true;
            console.log('A₇: WebAuthn assertion verified');
            return true;
        }
        catch (error) {
            console.error('A₇: Error verifying assertion:', error);
            this.state.authenticated = false;
            return false;
        }
    }
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.state.authenticated;
    }
    /**
     * Get credentials
     */
    getCredentials() {
        return this.state.credentials;
    }
    async receive(from, message) {
        if (message.type === 'create-credential') {
            const { userId, userName } = message.payload || {};
            if (userId && userName) {
                await this.createCredential(userId, userName);
            }
        }
        else if (message.type === 'verify-assertion') {
            const { credentialId, challenge } = message.payload || {};
            if (credentialId && challenge) {
                await this.verifyAssertion(credentialId, challenge);
            }
        }
    }
}
//# sourceMappingURL=a7-webauthn-oracle.js.map