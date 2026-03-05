/**
 * MQTT Client Wrapper
 *
 * Wrapper for MQTT client for peer discovery and messaging
 * Uses mqtt package (peer dependency)
 */
/**
 * MQTT Client Wrapper
 *
 * Manages MQTT connection for peer discovery
 */
export class MQTTClient {
    constructor(config = {}) {
        this.connected = false;
        this.subscriptions = new Set();
        this.config = config;
    }
    /**
     * Connect to MQTT broker
     */
    async connect() {
        // Dynamic import of mqtt package (peer dependency)
        let mqtt;
        try {
            // @ts-ignore - mqtt is a peer dependency, may not be installed
            mqtt = await import('mqtt');
        }
        catch (error) {
            throw new Error('MQTT package not installed. Install with: npm install mqtt');
        }
        const brokerUrl = this.config.brokerUrl || process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
        const clientId = this.config.clientId || `automata-${Date.now()}`;
        const options = {
            clientId,
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 30000
        };
        if (this.config.username) {
            options.username = this.config.username;
        }
        if (this.config.password) {
            options.password = this.config.password;
        }
        this.client = mqtt.connect(brokerUrl, options);
        // Set up event handlers
        this.client.on('connect', () => {
            this.connected = true;
            console.log('MQTT: Connected to broker');
            if (this.config.onConnect) {
                this.config.onConnect();
            }
        });
        this.client.on('message', (topic, message) => {
            if (this.config.onMessage) {
                this.config.onMessage(topic, message);
            }
        });
        this.client.on('error', (error) => {
            console.error('MQTT: Error:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        });
        this.client.on('close', () => {
            this.connected = false;
            console.log('MQTT: Disconnected from broker');
            if (this.config.onDisconnect) {
                this.config.onDisconnect();
            }
        });
        // Wait for connection
        return new Promise((resolve, reject) => {
            this.client.once('connect', () => {
                resolve();
            });
            this.client.once('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Disconnect from MQTT broker
     */
    disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
            this.connected = false;
            this.subscriptions.clear();
        }
    }
    /**
     * Subscribe to topic
     */
    subscribe(topic) {
        if (!this.client || !this.connected) {
            throw new Error('MQTT client not connected');
        }
        return new Promise((resolve, reject) => {
            this.client.subscribe(topic, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.subscriptions.add(topic);
                    console.log(`MQTT: Subscribed to topic: ${topic}`);
                    resolve();
                }
            });
        });
    }
    /**
     * Unsubscribe from topic
     */
    unsubscribe(topic) {
        if (!this.client || !this.connected) {
            throw new Error('MQTT client not connected');
        }
        return new Promise((resolve, reject) => {
            this.client.unsubscribe(topic, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.subscriptions.delete(topic);
                    console.log(`MQTT: Unsubscribed from topic: ${topic}`);
                    resolve();
                }
            });
        });
    }
    /**
     * Publish message to topic
     */
    publish(topic, message, options) {
        if (!this.client || !this.connected) {
            throw new Error('MQTT client not connected');
        }
        return new Promise((resolve, reject) => {
            this.client.publish(topic, message, options || {}, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.client?.connected === true;
    }
    /**
     * Get subscriptions
     */
    getSubscriptions() {
        return Array.from(this.subscriptions);
    }
}
//# sourceMappingURL=mqtt-client.js.map