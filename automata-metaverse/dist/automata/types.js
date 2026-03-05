/**
 * Automaton Types
 *
 * Core types for the A₁₁ automaton system
 */
/**
 * Base automaton implementation with common functionality
 */
export class BaseAutomaton {
    constructor() {
        this.state = {};
    }
    async tick(swarm) {
        // Override in subclasses
    }
    async receive(from, message) {
        // Override in subclasses
    }
    async send(to, message) {
        // Messages are queued by the swarm, not sent directly
        // This is a placeholder - actual sending happens via swarm.sendMessage()
    }
}
//# sourceMappingURL=types.js.map