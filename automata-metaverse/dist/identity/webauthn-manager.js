/**
 * WebAuthn Manager
 *
 * Manages WebAuthn credential creation and verification
 * Browser-only API
 */
/**
 * WebAuthn Manager
 *
 * Handles WebAuthn credential creation and verification
 */
export class WebAuthnManager {
    constructor(config = {}) {
        this.rpId = config.rpId || window.location.hostname;
        this.rpName = config.rpName || 'Automata Metaverse';
        this.userDisplayName = config.userDisplayName || 'User';
    }
    /**
     * Check if WebAuthn is supported
     */
    isSupported() {
        return typeof window !== 'undefined' &&
            'PublicKeyCredential' in window &&
            typeof PublicKeyCredential !== 'undefined';
    }
    /**
     * Create a new WebAuthn credential
     */
    async createCredential(userId, userName) {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this environment');
        }
        const publicKeyCredentialCreationOptions = {
            challenge: this.generateChallenge(),
            rp: {
                name: this.rpName,
                id: this.rpId
            },
            user: {
                id: new TextEncoder().encode(userId),
                name: userName,
                displayName: this.userDisplayName
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'preferred'
            },
            timeout: 60000,
            attestation: 'direct'
        };
        try {
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });
            return {
                id: credential.id,
                rawId: credential.rawId,
                response: credential.response,
                type: credential.type
            };
        }
        catch (error) {
            console.error('WebAuthn: Error creating credential:', error);
            throw error;
        }
    }
    /**
     * Verify WebAuthn assertion
     */
    async verifyAssertion(credentialId, challenge, allowCredentials) {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this environment');
        }
        const publicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: allowCredentials || [{
                    id: this.base64ToArrayBuffer(credentialId),
                    type: 'public-key',
                    transports: ['internal', 'usb', 'nfc', 'ble']
                }],
            timeout: 60000,
            userVerification: 'preferred',
            rpId: this.rpId
        };
        try {
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });
            return assertion.response;
        }
        catch (error) {
            console.error('WebAuthn: Error verifying assertion:', error);
            throw error;
        }
    }
    /**
     * Generate random challenge
     */
    generateChallenge() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return array.buffer;
    }
    /**
     * Convert base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    /**
     * Convert ArrayBuffer to base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
//# sourceMappingURL=webauthn-manager.js.map