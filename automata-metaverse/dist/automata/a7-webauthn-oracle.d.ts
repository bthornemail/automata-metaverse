/**
 * A₇: WebAuthn Oracle Automaton
 *
 * Role: Biometric Authentication
 * Uses WebAuthnManager for credential management
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import { type WebAuthnManagerConfig } from '../identity/webauthn-manager.js';
export interface A7WebAuthnOracleState {
    credentials: Map<string, any>;
    authenticated: boolean;
    initialized: boolean;
}
/**
 * A₇: WebAuthn Oracle Automaton
 *
 * Manages WebAuthn authentication
 */
export declare class A7_WebAuthnOracle extends BaseAutomaton {
    readonly id: 7;
    readonly name = "A\u2087 WebAuthn Oracle";
    readonly role = "Biometric Authentication";
    state: A7WebAuthnOracleState;
    private webauthnManager?;
    constructor(config?: WebAuthnManagerConfig);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    /**
     * Create WebAuthn credential
     */
    createCredential(userId: string, userName: string): Promise<any>;
    /**
     * Verify WebAuthn assertion
     */
    verifyAssertion(credentialId: string, challenge: ArrayBuffer): Promise<boolean>;
    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get credentials
     */
    getCredentials(): Map<string, any>;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
}
//# sourceMappingURL=a7-webauthn-oracle.d.ts.map