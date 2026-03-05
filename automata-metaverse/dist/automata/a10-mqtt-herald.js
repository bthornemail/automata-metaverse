/**
 * A₁₀: MQTT Herald Automaton
 *
 * Role: Peer Discovery via MQTT
 * Uses MQTTClient for discovery and announcements
 */
import { BaseAutomaton } from './types.js';
import { MQTTClient } from '../network/mqtt-client.js';
/**
 * A₁₀: MQTT Herald Automaton
 *
 * Manages peer discovery via MQTT
 */
export class A10_MQTTHerald extends BaseAutomaton {
    constructor(config) {
        super();
        this.id = 10;
        this.name = 'A₁₀ MQTT Herald';
        this.role = 'Peer Discovery via MQTT';
        this.state = {
            discoveredPeers: new Map(),
            announced: false,
            initialized: false
        };
        this.discoveryTopic = 'automata/discovery';
        this.announcementTopic = 'automata/announcements';
        this.localPeerId = config?.clientId || `peer-${Date.now()}`;
        this.mqttClient = new MQTTClient({
            ...config,
            onMessage: (topic, message) => {
                this.handleMQTTMessage(topic, message);
            },
            onConnect: () => {
                this.handleMQTTConnect();
            },
            onDisconnect: () => {
                this.handleMQTTDisconnect();
            }
        });
    }
    async tick(swarm) {
        if (!this.state.initialized) {
            await this.initialize(swarm);
        }
        // Re-announce presence periodically
        if (this.mqttClient?.isConnected() && !this.state.announced) {
            await this.announcePresence();
        }
    }
    async initialize(swarm) {
        try {
            // Connect to MQTT broker
            await this.mqttClient?.connect();
            // Subscribe to discovery topics
            if (this.mqttClient?.isConnected()) {
                await this.mqttClient.subscribe(this.discoveryTopic);
                await this.mqttClient.subscribe(this.announcementTopic);
            }
            this.state.initialized = true;
            console.log('A₁₀: MQTT Herald initialized');
        }
        catch (error) {
            console.error('A₁₀: Error initializing MQTT client:', error);
            // Continue without MQTT if not available
            this.state.initialized = true;
        }
    }
    /**
     * Announce presence to MQTT broker
     */
    async announcePresence() {
        if (!this.mqttClient?.isConnected()) {
            return;
        }
        try {
            const announcement = {
                peerId: this.localPeerId,
                timestamp: Date.now(),
                type: 'presence'
            };
            await this.mqttClient.publish(this.announcementTopic, JSON.stringify(announcement));
            this.state.announced = true;
            console.log('A₁₀: Announced presence');
        }
        catch (error) {
            console.error('A₁₀: Error announcing presence:', error);
        }
    }
    /**
     * Handle MQTT message
     */
    handleMQTTMessage(topic, message) {
        try {
            const data = JSON.parse(message.toString());
            if (topic === this.discoveryTopic || topic === this.announcementTopic) {
                if (data.peerId && data.peerId !== this.localPeerId) {
                    // Discovered a new peer
                    this.state.discoveredPeers.set(data.peerId, {
                        peerId: data.peerId,
                        timestamp: data.timestamp || Date.now(),
                        ...data
                    });
                    console.log(`A₁₀: Discovered peer: ${data.peerId}`);
                    // Notify swarm about discovered peer
                    // In a real implementation, this would trigger WebRTC connection via A₉
                }
            }
        }
        catch (error) {
            console.error('A₁₀: Error handling MQTT message:', error);
        }
    }
    /**
     * Handle MQTT connect
     */
    handleMQTTConnect() {
        console.log('A₁₀: Connected to MQTT broker');
        // Subscribe to topics on connect
        if (this.mqttClient) {
            this.mqttClient.subscribe(this.discoveryTopic).catch(console.error);
            this.mqttClient.subscribe(this.announcementTopic).catch(console.error);
        }
    }
    /**
     * Handle MQTT disconnect
     */
    handleMQTTDisconnect() {
        console.log('A₁₀: Disconnected from MQTT broker');
        this.state.announced = false;
    }
    /**
     * Publish discovery request
     */
    async requestDiscovery() {
        if (!this.mqttClient?.isConnected()) {
            return;
        }
        try {
            const request = {
                peerId: this.localPeerId,
                timestamp: Date.now(),
                type: 'discovery-request'
            };
            await this.mqttClient.publish(this.discoveryTopic, JSON.stringify(request));
        }
        catch (error) {
            console.error('A₁₀: Error requesting discovery:', error);
        }
    }
    async receive(from, message) {
        if (message.type === 'request-discovery') {
            await this.requestDiscovery();
        }
        else if (message.type === 'announce-presence') {
            await this.announcePresence();
        }
    }
    /**
     * Get discovered peers
     */
    getDiscoveredPeers() {
        return this.state.discoveredPeers;
    }
}
//# sourceMappingURL=a10-mqtt-herald.js.map