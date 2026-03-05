/**
 * TURN Server Configuration
 *
 * Loads TURN server configuration from environment variables
 * Supports coturn integration
 */
export interface TURNConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}
export interface ICEConfig {
    iceServers: RTCIceServer[];
}
/**
 * Load TURN configuration from environment variables
 */
export declare function loadTURNConfig(): TURNConfig | null;
/**
 * Build ICE servers configuration
 * Includes STUN fallback and TURN server if configured
 */
export declare function buildICEServers(): RTCIceServer[];
/**
 * Build ICE configuration for RTCPeerConnection
 */
export declare function buildICEConfig(): ICEConfig;
//# sourceMappingURL=turn-config.d.ts.map