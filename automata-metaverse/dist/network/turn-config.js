/**
 * TURN Server Configuration
 *
 * Loads TURN server configuration from environment variables
 * Supports coturn integration
 */
/**
 * Load TURN configuration from environment variables
 */
export function loadTURNConfig() {
    // Browser environment: import.meta.env.VITE_*
    // Node.js environment: process.env.*
    const turnUrl = typeof window !== 'undefined'
        ? import.meta.env?.VITE_TURN_SERVER_URL
        : process.env.TURN_SERVER_URL;
    const turnUsername = typeof window !== 'undefined'
        ? import.meta.env?.VITE_TURN_USERNAME
        : process.env.TURN_USERNAME;
    const turnPassword = typeof window !== 'undefined'
        ? import.meta.env?.VITE_TURN_PASSWORD
        : process.env.TURN_PASSWORD;
    if (!turnUrl) {
        return null;
    }
    const config = {
        urls: turnUrl
    };
    if (turnUsername && turnPassword) {
        config.username = turnUsername;
        config.credential = turnPassword;
    }
    return config;
}
/**
 * Build ICE servers configuration
 * Includes STUN fallback and TURN server if configured
 */
export function buildICEServers() {
    const servers = [];
    // Always include Google STUN server as fallback
    servers.push({ urls: 'stun:stun.l.google.com:19302' });
    // Add TURN server if configured
    const turnConfig = loadTURNConfig();
    if (turnConfig) {
        servers.push(turnConfig);
    }
    return servers;
}
/**
 * Build ICE configuration for RTCPeerConnection
 */
export function buildICEConfig() {
    return {
        iceServers: buildICEServers()
    };
}
//# sourceMappingURL=turn-config.js.map