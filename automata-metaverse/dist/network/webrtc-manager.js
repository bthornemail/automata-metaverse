/**
 * WebRTC Manager
 *
 * Manages WebRTC peer connections for P2P communication
 * Supports coturn TURN server integration
 */
/**
 * WebRTC Manager
 *
 * Manages multiple WebRTC peer connections with data channels
 */
export class WebRTCManager {
    constructor(config = {}) {
        this.peers = new Map();
        this.localPeerId = config.localPeerId || this.generatePeerId();
        this.iceServers = config.iceServers || this.buildDefaultIceServers();
        this.onMessage = config.onMessage;
        this.onConnectionChange = config.onConnectionChange;
    }
    /**
     * Build default ICE servers (STUN + TURN from environment)
     */
    buildDefaultIceServers() {
        const servers = [];
        // Always include Google STUN server as fallback
        servers.push({ urls: 'stun:stun.l.google.com:19302' });
        // Add TURN server if configured via environment variables
        // In browser: import.meta.env.VITE_TURN_SERVER_URL
        // In Node.js: process.env.TURN_SERVER_URL
        const turnUrl = typeof window !== 'undefined'
            ? import.meta.env?.VITE_TURN_SERVER_URL
            : process.env.TURN_SERVER_URL;
        const turnUsername = typeof window !== 'undefined'
            ? import.meta.env?.VITE_TURN_USERNAME
            : process.env.TURN_USERNAME;
        const turnPassword = typeof window !== 'undefined'
            ? import.meta.env?.VITE_TURN_PASSWORD
            : process.env.TURN_PASSWORD;
        if (turnUrl) {
            const turnServer = {
                urls: turnUrl
            };
            if (turnUsername && turnPassword) {
                turnServer.username = turnUsername;
                turnServer.credential = turnPassword;
            }
            servers.push(turnServer);
            console.log('WebRTC: TURN server configured:', turnUrl);
        }
        else {
            console.log('WebRTC: TURN server not configured, using STUN only');
        }
        return servers;
    }
    /**
     * Generate unique peer ID
     */
    generatePeerId() {
        return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create a new peer connection
     */
    async createPeerConnection(peerId) {
        if (this.peers.has(peerId)) {
            throw new Error(`Peer ${peerId} already exists`);
        }
        const connection = new RTCPeerConnection({
            iceServers: this.iceServers
        });
        const peer = {
            peerId,
            connection,
            state: connection.connectionState
        };
        // Set up event handlers
        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.handleICECandidate(peerId, event.candidate);
            }
        };
        connection.ondatachannel = (event) => {
            this.handleDataChannel(peerId, event.channel);
        };
        connection.onconnectionstatechange = () => {
            peer.state = connection.connectionState;
            if (this.onConnectionChange) {
                this.onConnectionChange(peerId, connection.connectionState);
            }
        };
        this.peers.set(peerId, peer);
        return connection;
    }
    /**
     * Create data channel for a peer
     */
    createDataChannel(peerId, channelName = 'data') {
        const peer = this.peers.get(peerId);
        if (!peer) {
            throw new Error(`Peer ${peerId} not found`);
        }
        const channel = peer.connection.createDataChannel(channelName, {
            ordered: true,
            maxRetransmits: 3
        });
        this.handleDataChannel(peerId, channel);
        peer.dataChannel = channel;
        return channel;
    }
    /**
     * Handle incoming data channel
     */
    handleDataChannel(peerId, channel) {
        const peer = this.peers.get(peerId);
        if (!peer) {
            return;
        }
        channel.onopen = () => {
            console.log(`WebRTC: Data channel opened for peer ${peerId}`);
            peer.dataChannel = channel;
        };
        channel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (this.onMessage) {
                    this.onMessage(message, peerId);
                }
            }
            catch (error) {
                console.error(`WebRTC: Failed to parse message from ${peerId}:`, error);
            }
        };
        channel.onerror = (error) => {
            console.error(`WebRTC: Data channel error for peer ${peerId}:`, error);
        };
        channel.onclose = () => {
            console.log(`WebRTC: Data channel closed for peer ${peerId}`);
            if (peer.dataChannel === channel) {
                peer.dataChannel = undefined;
            }
        };
    }
    /**
     * Create offer for peer connection
     */
    async createOffer(peerId) {
        const connection = await this.createPeerConnection(peerId);
        this.createDataChannel(peerId);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        // Wait for ICE gathering
        await new Promise((resolve) => {
            if (connection.iceGatheringState === 'complete') {
                resolve();
            }
            else {
                const checkState = () => {
                    if (connection.iceGatheringState === 'complete') {
                        connection.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                };
                connection.addEventListener('icegatheringstatechange', checkState);
            }
        });
        return connection.localDescription;
    }
    /**
     * Accept offer and create answer
     */
    async acceptOffer(peerId, offer) {
        const connection = await this.createPeerConnection(peerId);
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        return connection.localDescription;
    }
    /**
     * Accept answer
     */
    async acceptAnswer(peerId, answer) {
        const peer = this.peers.get(peerId);
        if (!peer) {
            throw new Error(`Peer ${peerId} not found`);
        }
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
    /**
     * Handle ICE candidate
     */
    handleICECandidate(peerId, candidate) {
        // In a real implementation, you'd send this to the signaling server
        console.log(`WebRTC: ICE candidate for peer ${peerId}:`, candidate);
    }
    /**
     * Add ICE candidate
     */
    async addICECandidate(peerId, candidate) {
        const peer = this.peers.get(peerId);
        if (!peer) {
            throw new Error(`Peer ${peerId} not found`);
        }
        try {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        catch (error) {
            console.error(`WebRTC: Failed to add ICE candidate for peer ${peerId}:`, error);
        }
    }
    /**
     * Send message to peer
     */
    sendMessage(peerId, message) {
        const peer = this.peers.get(peerId);
        if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== 'open') {
            throw new Error(`Cannot send message to peer ${peerId}: channel not open`);
        }
        try {
            peer.dataChannel.send(JSON.stringify(message));
        }
        catch (error) {
            console.error(`WebRTC: Failed to send message to peer ${peerId}:`, error);
            throw error;
        }
    }
    /**
     * Broadcast message to all connected peers
     */
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        for (const [peerId, peer] of this.peers.entries()) {
            if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
                try {
                    peer.dataChannel.send(messageStr);
                }
                catch (error) {
                    console.error(`WebRTC: Failed to broadcast to peer ${peerId}:`, error);
                }
            }
        }
    }
    /**
     * Disconnect from peer
     */
    disconnect(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            if (peer.dataChannel) {
                peer.dataChannel.close();
            }
            peer.connection.close();
            this.peers.delete(peerId);
        }
    }
    /**
     * Disconnect from all peers
     */
    disconnectAll() {
        for (const peerId of this.peers.keys()) {
            this.disconnect(peerId);
        }
    }
    /**
     * Get peer connection
     */
    getPeer(peerId) {
        return this.peers.get(peerId);
    }
    /**
     * Get all peers
     */
    getAllPeers() {
        return Array.from(this.peers.values());
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            localPeerId: this.localPeerId,
            peerCount: this.peers.size,
            peers: Array.from(this.peers.values()).map(peer => ({
                peerId: peer.peerId,
                state: peer.state,
                channelOpen: peer.dataChannel?.readyState === 'open'
            }))
        };
    }
}
//# sourceMappingURL=webrtc-manager.js.map