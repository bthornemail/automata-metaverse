/**
 * WebRTC Manager
 *
 * Manages WebRTC peer connections for P2P communication
 * Supports coturn TURN server integration
 */
export interface WebRTCManagerConfig {
    iceServers?: RTCIceServer[];
    localPeerId?: string;
    onMessage?: (message: any, peerId: string) => void;
    onConnectionChange?: (peerId: string, state: RTCPeerConnectionState) => void;
}
export interface PeerConnection {
    peerId: string;
    connection: RTCPeerConnection;
    dataChannel?: RTCDataChannel;
    state: RTCPeerConnectionState;
}
/**
 * WebRTC Manager
 *
 * Manages multiple WebRTC peer connections with data channels
 */
export declare class WebRTCManager {
    private peers;
    private localPeerId;
    private iceServers;
    private onMessage?;
    private onConnectionChange?;
    constructor(config?: WebRTCManagerConfig);
    /**
     * Build default ICE servers (STUN + TURN from environment)
     */
    private buildDefaultIceServers;
    /**
     * Generate unique peer ID
     */
    private generatePeerId;
    /**
     * Create a new peer connection
     */
    createPeerConnection(peerId: string): Promise<RTCPeerConnection>;
    /**
     * Create data channel for a peer
     */
    createDataChannel(peerId: string, channelName?: string): RTCDataChannel;
    /**
     * Handle incoming data channel
     */
    private handleDataChannel;
    /**
     * Create offer for peer connection
     */
    createOffer(peerId: string): Promise<RTCSessionDescriptionInit>;
    /**
     * Accept offer and create answer
     */
    acceptOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Accept answer
     */
    acceptAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Handle ICE candidate
     */
    private handleICECandidate;
    /**
     * Add ICE candidate
     */
    addICECandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;
    /**
     * Send message to peer
     */
    sendMessage(peerId: string, message: any): void;
    /**
     * Broadcast message to all connected peers
     */
    broadcast(message: any): void;
    /**
     * Disconnect from peer
     */
    disconnect(peerId: string): void;
    /**
     * Disconnect from all peers
     */
    disconnectAll(): void;
    /**
     * Get peer connection
     */
    getPeer(peerId: string): PeerConnection | undefined;
    /**
     * Get all peers
     */
    getAllPeers(): PeerConnection[];
    /**
     * Get connection status
     */
    getConnectionStatus(): {
        localPeerId: string;
        peerCount: number;
        peers: Array<{
            peerId: string;
            state: RTCPeerConnectionState;
            channelOpen: boolean;
        }>;
    };
}
//# sourceMappingURL=webrtc-manager.d.ts.map