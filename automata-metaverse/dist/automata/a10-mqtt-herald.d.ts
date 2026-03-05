/**
 * A₁₀: MQTT Herald Automaton
 *
 * Role: Peer Discovery via MQTT
 * Uses MQTTClient for discovery and announcements
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import { type MQTTClientConfig } from '../network/mqtt-client.js';
export interface A10MQTTHeraldState {
    discoveredPeers: Map<string, any>;
    announced: boolean;
    initialized: boolean;
}
/**
 * A₁₀: MQTT Herald Automaton
 *
 * Manages peer discovery via MQTT
 */
export declare class A10_MQTTHerald extends BaseAutomaton {
    readonly id: 10;
    readonly name = "A\u2081\u2080 MQTT Herald";
    readonly role = "Peer Discovery via MQTT";
    state: A10MQTTHeraldState;
    private mqttClient?;
    private discoveryTopic;
    private announcementTopic;
    private localPeerId;
    constructor(config?: MQTTClientConfig);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    /**
     * Announce presence to MQTT broker
     */
    announcePresence(): Promise<void>;
    /**
     * Handle MQTT message
     */
    private handleMQTTMessage;
    /**
     * Handle MQTT connect
     */
    private handleMQTTConnect;
    /**
     * Handle MQTT disconnect
     */
    private handleMQTTDisconnect;
    /**
     * Publish discovery request
     */
    requestDiscovery(): Promise<void>;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get discovered peers
     */
    getDiscoveredPeers(): Map<string, any>;
}
//# sourceMappingURL=a10-mqtt-herald.d.ts.map