/**
 * Peer Discovery Coordination
 *
 * Coordinates peer discovery via MQTT Herald (A₁₀) and WebRTC Messenger (A₉)
 */
import type { SwarmContext } from '../automata/types.js';
export interface DiscoveredPeer {
    peerId: string;
    timestamp: number;
    webrtcConnected: boolean;
    mqttDiscovered: boolean;
}
/**
 * Peer Discovery Coordinator
 *
 * Coordinates discovery between MQTT Herald and WebRTC Messenger
 */
export declare class PeerDiscovery {
    private discoveredPeers;
    /**
     * Discover peers via MQTT and establish WebRTC connections
     */
    discoverPeers(swarm: SwarmContext): Promise<DiscoveredPeer[]>;
    /**
     * Get discovered peers
     */
    getDiscoveredPeers(): DiscoveredPeer[];
    /**
     * Get peer by ID
     */
    getPeer(peerId: string): DiscoveredPeer | undefined;
    /**
     * Update peer connection status
     */
    updatePeerConnection(peerId: string, connected: boolean): void;
}
//# sourceMappingURL=peer-discovery.d.ts.map