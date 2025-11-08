/**
 * Lifecycle management utilities
 */
export enum LifecycleState {
  UNLOADED = 'unloaded',
  LOADED = 'loaded',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export class LifecycleManager {
  private state: LifecycleState = LifecycleState.UNLOADED;

  getState(): LifecycleState {
    return this.state;
  }

  setState(state: LifecycleState): void {
    this.state = state;
  }

  isLoaded(): boolean {
    return this.state !== LifecycleState.UNLOADED;
  }

  isEnabled(): boolean {
    return this.state === LifecycleState.ENABLED;
  }
}
