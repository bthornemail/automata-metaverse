/**
 * State manager for plugin state
 */
export class StateManager {
  private state: Map<string, any> = new Map();

  /**
   * Get state value
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.state.get(key) as T) ?? defaultValue;
  }

  /**
   * Set state value
   */
  set<T>(key: string, value: T): void {
    this.state.set(key, value);
  }

  /**
   * Check if state key exists
   */
  has(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Delete state key
   */
  delete(key: string): boolean {
    return this.state.delete(key);
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.state.clear();
  }

  /**
   * Get all state keys
   */
  keys(): string[] {
    return Array.from(this.state.keys());
  }

  /**
   * Get all state entries
   */
  entries(): [string, any][] {
    return Array.from(this.state.entries());
  }
}
