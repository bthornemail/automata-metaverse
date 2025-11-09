/**
 * Mode Manager
 * Manages major/minor mode transitions and symbol selection
 */

import { MajorMode, MinorMode, Symbol, EnvironmentType } from '../types';

export interface ModeTransition {
  from: { major: MajorMode; minor: MinorMode };
  to: { major: MajorMode; minor: MinorMode };
  condition?: () => boolean;
}

export class ModeManager {
  private currentMajor: MajorMode = 'environment';
  private currentMinor: MinorMode = 'abstract';
  private selectedSymbol: Symbol | null = null;
  private selectedSymbols: Set<string> = new Set();
  private listeners: Set<(major: MajorMode, minor: MinorMode) => void> = new Set();

  /**
   * Set major mode
   */
  setMajorMode(major: MajorMode, minor?: MinorMode) {
    const oldMajor = this.currentMajor;
    const oldMinor = this.currentMinor;

    this.currentMajor = major;
    if (minor !== undefined) {
      this.currentMinor = minor;
    } else if (major === 'environment') {
      // Default to abstract when switching to environment mode
      this.currentMinor = 'abstract';
    }

    this.notifyListeners();
    return { from: { major: oldMajor, minor: oldMinor }, to: { major: this.currentMajor, minor: this.currentMinor } };
  }

  /**
   * Set minor mode
   */
  setMinorMode(minor: MinorMode) {
    const oldMajor = this.currentMajor;
    const oldMinor = this.currentMinor;

    this.currentMinor = minor;

    // Auto-switch major mode based on minor mode
    if (this.isEnvironmentType(minor)) {
      this.currentMajor = 'environment';
    } else {
      this.currentMajor = 'symbol';
    }

    this.notifyListeners();
    return { from: { major: oldMajor, minor: oldMinor }, to: { major: this.currentMajor, minor: this.currentMinor } };
  }

  /**
   * Select a symbol (switches to symbol mode)
   */
  selectSymbol(symbol: Symbol | null) {
    this.selectedSymbol = symbol;
    
    if (symbol) {
      this.selectedSymbols.add(symbol.id);
      // Switch to symbol mode with symbol ID as minor mode
      this.setMajorMode('symbol', symbol.id);
    } else {
      // Deselect - switch back to environment mode
      this.setMajorMode('environment');
    }
  }

  /**
   * Toggle symbol selection
   */
  toggleSymbol(symbol: Symbol) {
    if (this.selectedSymbols.has(symbol.id)) {
      this.selectedSymbols.delete(symbol.id);
      if (this.selectedSymbol?.id === symbol.id) {
        this.selectSymbol(null);
      }
    } else {
      this.selectedSymbols.add(symbol.id);
      this.selectSymbol(symbol);
    }
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedSymbols.clear();
    this.selectedSymbol = null;
    this.setMajorMode('environment');
  }

  /**
   * Get current mode
   */
  getCurrentMode(): { major: MajorMode; minor: MinorMode } {
    return { major: this.currentMajor, minor: this.currentMinor };
  }

  /**
   * Get selected symbol
   */
  getSelectedSymbol(): Symbol | null {
    return this.selectedSymbol;
  }

  /**
   * Get selected symbols
   */
  getSelectedSymbols(): Set<string> {
    return new Set(this.selectedSymbols);
  }

  /**
   * Subscribe to mode changes
   */
  subscribe(listener: (major: MajorMode, minor: MinorMode) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.currentMajor, this.currentMinor);
    });
  }

  private isEnvironmentType(mode: MinorMode): mode is EnvironmentType {
    return ['abstract', 'canvas-2d', 'code-media', '3d-gltf'].includes(mode as string);
  }
}

export const modeManager = new ModeManager();
