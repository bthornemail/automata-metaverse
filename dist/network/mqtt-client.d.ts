/**
 * MQTT Client Wrapper
 *
 * Wrapper for MQTT client for peer discovery and messaging
 * Uses mqtt package (peer dependency)
 */
export interface MQTTClientConfig {
    brokerUrl?: string;
    clientId?: string;
    username?: string;
    password?: string;
    onMessage?: (topic: string, message: Buffer) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}
/**
 * MQTT Client Wrapper
 *
 * Manages MQTT connection for peer discovery
 */
export declare class MQTTClient {
    private client;
    private config;
    private connected;
    private subscriptions;
    constructor(config?: MQTTClientConfig);
    /**
     * Connect to MQTT broker
     */
    connect(): Promise<void>;
    /**
     * Disconnect from MQTT broker
     */
    disconnect(): void;
    /**
     * Subscribe to topic
     */
    subscribe(topic: string): Promise<void>;
    /**
     * Unsubscribe from topic
     */
    unsubscribe(topic: string): Promise<void>;
    /**
     * Publish message to topic
     */
    publish(topic: string, message: string | Buffer, options?: any): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get subscriptions
     */
    getSubscriptions(): string[];
}
//# sourceMappingURL=mqtt-client.d.ts.map