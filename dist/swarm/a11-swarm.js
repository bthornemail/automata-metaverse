/**
 * A₁₁ Swarm Coordinator
 *
 * Coordinates all 11 automata (A₀-A₁₁) in the A₁₁ system
 */
/**
 * A₁₁ Swarm Coordinator
 *
 * Manages all 11 automata, coordinates message passing, and executes tick-based updates
 */
export class A11Swarm {
    constructor(config = {}) {
        this.automata = new Map();
        this.messageQueue = [];
        this.running = false;
        this.tickInterval = config.tickInterval || 100;
        this.autoStart = config.autoStart ?? false;
    }
    /**
     * Bootstrap the swarm by initializing all 11 automata
     */
    async bootstrap() {
        // Clear any existing automata
        this.automata.clear();
        this.messageQueue = [];
        // Note: Automata will be registered by their constructors or via register()
        // This method is called after all automata are instantiated
        // Initialize each automaton
        for (const automaton of this.automata.values()) {
            try {
                await automaton.tick(this);
            }
            catch (error) {
                console.error(`Error initializing ${automaton.name}:`, error);
            }
        }
        // Elect master (A₁₁) if not already registered
        if (!this.automata.has(11)) {
            await this.electMaster();
        }
        // Auto-start if configured
        if (this.autoStart) {
            this.start();
        }
    }
    /**
     * Register an automaton with the swarm
     */
    register(automaton) {
        this.automata.set(automaton.id, automaton);
    }
    /**
     * Elect master coordinator (A₁₁)
     *
     * In a full implementation, this would involve consensus voting.
     * For now, A₁₁ is created separately and registered.
     */
    async electMaster() {
        // A₁₁ master should be registered separately
        // This is a placeholder for master election logic
        console.log('A₁₁: Master election (A₁₁ should be registered separately)');
    }
    /**
     * Start the swarm tick loop
     */
    start() {
        if (this.running) {
            console.warn('Swarm is already running');
            return;
        }
        this.running = true;
        console.log('A₁₁ Swarm: Starting tick loop');
        this.tick();
    }
    /**
     * Stop the swarm tick loop
     */
    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = undefined;
        }
        console.log('A₁₁ Swarm: Stopped');
    }
    /**
     * Execute one tick: update all automata and process messages
     */
    async tick() {
        if (!this.running) {
            return;
        }
        try {
            // Tick all automata
            for (const automaton of this.automata.values()) {
                try {
                    await automaton.tick(this);
                }
                catch (error) {
                    console.error(`Error in ${automaton.name} (A${automaton.id}):`, error);
                }
            }
            // Process message queue
            while (this.messageQueue.length > 0) {
                const { from, to, msg } = this.messageQueue.shift();
                const automaton = this.automata.get(to);
                if (automaton) {
                    try {
                        await automaton.receive(from, msg);
                    }
                    catch (error) {
                        console.error(`Error processing message from A${from} to A${to}:`, error);
                    }
                }
                else {
                    console.warn(`Message to A${to} dropped: automaton not found`);
                }
            }
        }
        catch (error) {
            console.error('Error in swarm tick:', error);
        }
        // Schedule next tick
        this.tickTimer = setTimeout(() => this.tick(), this.tickInterval);
    }
    /**
     * Send message between automata
     * Messages are queued and processed during the next tick
     */
    sendMessage(from, to, message) {
        const enrichedMessage = {
            ...message,
            from,
            to,
            timestamp: message.timestamp || Date.now()
        };
        this.messageQueue.push({ from, to, msg: enrichedMessage });
    }
    /**
     * Get automaton by ID
     */
    get(id) {
        return this.automata.get(id);
    }
    /**
     * Get all automata
     */
    getAll() {
        return Array.from(this.automata.values());
    }
    /**
     * Get state of all automata
     */
    getState() {
        const state = new Map();
        for (const [id, automaton] of this.automata.entries()) {
            state.set(id, automaton.state);
        }
        return state;
    }
    /**
     * Get swarm statistics
     */
    getStats() {
        return {
            automataCount: this.automata.size,
            messageQueueLength: this.messageQueue.length,
            running: this.running,
            tickInterval: this.tickInterval
        };
    }
}
//# sourceMappingURL=a11-swarm.js.map