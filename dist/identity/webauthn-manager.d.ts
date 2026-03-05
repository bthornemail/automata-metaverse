/**
 * WebAuthn Manager
 *
 * Manages WebAuthn credential creation and verification
 * Browser-only API
 */
export interface WebAuthnCredential {
    id: string;
    rawId: ArrayBuffer;
    response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
    type: string;
}
export interface WebAuthnManagerConfig {
    rpId?: string;
    rpName?: string;
    userDisplayName?: string;
}
/**
 * WebAuthn Manager
 *
 * Handles WebAuthn credential creation and verification
 */
export declare class WebAuthnManager {
    private rpId;
    private rpName;
    private userDisplayName;
    constructor(config?: WebAuthnManagerConfig);
    /**
     * Check if WebAuthn is supported
     */
    isSupported(): boolean;
    /**
     * Create a new WebAuthn credential
     */
    createCredential(userId: string, userName: string): Promise<WebAuthnCredential>;
    /**
     * Verify WebAuthn assertion
     */
    verifyAssertion(credentialId: string, challenge: ArrayBuffer, allowCredentials?: PublicKeyCredentialDescriptor[]): Promise<AuthenticatorAssertionResponse>;
    /**
     * Generate random challenge
     */
    private generateChallenge;
    /**
     * Convert base64 to ArrayBuffer
     */
    private base64ToArrayBuffer;
    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64;
}
//# sourceMappingURL=webauthn-manager.d.ts.map