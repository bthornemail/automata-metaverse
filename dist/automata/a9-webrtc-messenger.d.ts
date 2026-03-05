/**
 * A₉: WebRTC Messenger Automaton
 *
 * Role: P2P Transport via WebRTC
 * Uses WebRTCManager for peer connections
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import { type WebRTCManagerConfig } from '../network/webrtc-manager.js';
export interface A9WebRTCMessengerState {
    peers: Map<string, any>;
    initialized: boolean;
}
/**
 * A₉: WebRTC Messenger Automaton
 *
 * Manages WebRTC peer connections for P2P messaging
 */
export declare class A9_WebRTCMessenger extends BaseAutomaton {
    readonly id: 9;
    readonly name = "A\u2089 WebRTC Messenger";
    readonly role = "P2P Transport via WebRTC";
    state: A9WebRTCMessengerState;
    private webrtcManager?;
    constructor(config?: WebRTCManagerConfig);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    /**
     * Handle message from peer
     */
    private handlePeerMessage;
    /**
     * Handle connection state change
     */
    private handleConnectionChange;
    /**
     * Connect to peer
     */
    connectToPeer(peerId: string, offer?: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Accept answer from peer
     */
    acceptAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Send message to peer
     */
    sendToPeer(peerId: string, message: any): void;
    /**
     * Broadcast message to all peers
     */
    broadcast(message: any): void;
    /**
     * Disconnect from peer
     */
    disconnectPeer(peerId: string): void;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get connection status
     */
    getConnectionStatus(): any;
}
//# sourceMappingURL=a9-webrtc-messenger.d.ts.map