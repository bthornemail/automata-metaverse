/**
 * Peer Discovery Coordination
 *
 * Coordinates peer discovery via MQTT Herald (A₁₀) and WebRTC Messenger (A₉)
 */
/**
 * Peer Discovery Coordinator
 *
 * Coordinates discovery between MQTT Herald and WebRTC Messenger
 */
export class PeerDiscovery {
    constructor() {
        this.discoveredPeers = new Map();
    }
    /**
     * Discover peers via MQTT and establish WebRTC connections
     */
    async discoverPeers(swarm) {
        const a9 = swarm.get(9); // WebRTC Messenger
        const a10 = swarm.get(10); // MQTT Herald
        if (!a9 || !a10) {
            console.warn('PeerDiscovery: A₉ or A₁₀ not available');
            return [];
        }
        // Get discovered peers from MQTT Herald
        let mqttPeers = new Map();
        if ('getDiscoveredPeers' in a10 && typeof a10.getDiscoveredPeers === 'function') {
            mqttPeers = a10.getDiscoveredPeers();
        }
        // For each MQTT-discovered peer, establish WebRTC connection
        for (const [peerId, peerInfo] of mqttPeers.entries()) {
            if (!this.discoveredPeers.has(peerId)) {
                this.discoveredPeers.set(peerId, {
                    peerId,
                    timestamp: peerInfo.timestamp || Date.now(),
                    webrtcConnected: false,
                    mqttDiscovered: true
                });
                // Request WebRTC connection via A₉
                if ('connectToPeer' in a9 && typeof a9.connectToPeer === 'function') {
                    try {
                        await a9.connectToPeer(peerId);
                        const peer = this.discoveredPeers.get(peerId);
                        if (peer) {
                            peer.webrtcConnected = true;
                        }
                    }
                    catch (error) {
                        console.error(`PeerDiscovery: Failed to connect to peer ${peerId}:`, error);
                    }
                }
            }
        }
        return Array.from(this.discoveredPeers.values());
    }
    /**
     * Get discovered peers
     */
    getDiscoveredPeers() {
        return Array.from(this.discoveredPeers.values());
    }
    /**
     * Get peer by ID
     */
    getPeer(peerId) {
        return this.discoveredPeers.get(peerId);
    }
    /**
     * Update peer connection status
     */
    updatePeerConnection(peerId, connected) {
        const peer = this.discoveredPeers.get(peerId);
        if (peer) {
            peer.webrtcConnected = connected;
        }
    }
}
//# sourceMappingURL=peer-discovery.js.map