/**
 * A₉: WebRTC Messenger Automaton
 *
 * Role: P2P Transport via WebRTC
 * Uses WebRTCManager for peer connections
 */
import { BaseAutomaton } from './types.js';
import { WebRTCManager } from '../network/webrtc-manager.js';
import { buildICEConfig } from '../network/turn-config.js';
/**
 * A₉: WebRTC Messenger Automaton
 *
 * Manages WebRTC peer connections for P2P messaging
 */
export class A9_WebRTCMessenger extends BaseAutomaton {
    constructor(config) {
        super();
        this.id = 9;
        this.name = 'A₉ WebRTC Messenger';
        this.role = 'P2P Transport via WebRTC';
        this.state = {
            peers: new Map(),
            initialized: false
        };
        // Initialize WebRTC manager with ICE config
        const iceConfig = buildICEConfig();
        this.webrtcManager = new WebRTCManager({
            ...config,
            iceServers: config?.iceServers || iceConfig.iceServers,
            onMessage: (message, peerId) => {
                this.handlePeerMessage(peerId, message);
            },
            onConnectionChange: (peerId, state) => {
                this.handleConnectionChange(peerId, state);
            }
        });
    }
    async tick(swarm) {
        if (!this.state.initialized) {
            await this.initialize(swarm);
        }
        // WebRTC operations are event-driven, no ongoing tick operations needed
    }
    async initialize(swarm) {
        this.state.initialized = true;
        console.log('A₉: WebRTC Messenger initialized');
    }
    /**
     * Handle message from peer
     */
    handlePeerMessage(peerId, message) {
        // Forward message to swarm for processing
        // In a real implementation, this would route to appropriate automata
        console.log(`A₉: Received message from peer ${peerId}:`, message);
    }
    /**
     * Handle connection state change
     */
    handleConnectionChange(peerId, state) {
        const peer = this.state.peers.get(peerId);
        if (peer) {
            peer.state = state;
        }
        console.log(`A₉: Peer ${peerId} connection state: ${state}`);
    }
    /**
     * Connect to peer
     */
    async connectToPeer(peerId, offer) {
        if (!this.webrtcManager) {
            throw new Error('WebRTC manager not initialized');
        }
        if (offer) {
            // Accept offer and create answer
            const answer = await this.webrtcManager.acceptOffer(peerId, offer);
            this.state.peers.set(peerId, { peerId, state: 'connecting' });
            return answer;
        }
        else {
            // Create offer
            const offer = await this.webrtcManager.createOffer(peerId);
            this.state.peers.set(peerId, { peerId, state: 'connecting' });
            return offer;
        }
    }
    /**
     * Accept answer from peer
     */
    async acceptAnswer(peerId, answer) {
        if (!this.webrtcManager) {
            throw new Error('WebRTC manager not initialized');
        }
        await this.webrtcManager.acceptAnswer(peerId, answer);
    }
    /**
     * Send message to peer
     */
    sendToPeer(peerId, message) {
        if (!this.webrtcManager) {
            throw new Error('WebRTC manager not initialized');
        }
        this.webrtcManager.sendMessage(peerId, message);
    }
    /**
     * Broadcast message to all peers
     */
    broadcast(message) {
        if (!this.webrtcManager) {
            throw new Error('WebRTC manager not initialized');
        }
        this.webrtcManager.broadcast(message);
    }
    /**
     * Disconnect from peer
     */
    disconnectPeer(peerId) {
        if (!this.webrtcManager) {
            return;
        }
        this.webrtcManager.disconnect(peerId);
        this.state.peers.delete(peerId);
    }
    async receive(from, message) {
        if (message.type === 'connect-peer') {
            const { peerId, offer } = message.payload || {};
            if (peerId) {
                await this.connectToPeer(peerId, offer);
            }
        }
        else if (message.type === 'send-message') {
            const { peerId, data } = message.payload || {};
            if (peerId && data) {
                this.sendToPeer(peerId, data);
            }
        }
        else if (message.type === 'broadcast') {
            const { data } = message.payload || {};
            if (data) {
                this.broadcast(data);
            }
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        if (!this.webrtcManager) {
            return { connected: false };
        }
        return this.webrtcManager.getConnectionStatus();
    }
}
//# sourceMappingURL=a9-webrtc-messenger.js.map