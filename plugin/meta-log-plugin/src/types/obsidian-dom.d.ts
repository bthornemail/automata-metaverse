/**
 * Obsidian DOM extensions type definitions
 * Obsidian extends HTMLElement with custom methods
 */

interface HTMLElement {
  /**
   * Create a child element
   */
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: {
      cls?: string;
      text?: string;
      attr?: Record<string, string>;
      title?: string;
      [key: string]: any;
    }
  ): HTMLElementTagNameMap[K];
  
  /**
   * Create a child element (generic)
   */
  createEl(
    tag: string,
    options?: {
      cls?: string;
      text?: string;
      attr?: Record<string, string>;
      title?: string;
      [key: string]: any;
    }
  ): HTMLElement;
  
  /**
   * Empty the element (remove all children)
   */
  empty(): HTMLElement;
  
  /**
   * Add CSS class
   */
  addClass(cls: string): HTMLElement;
  
  /**
   * Remove CSS class
   */
  removeClass(cls: string): HTMLElement;
  
  /**
   * Toggle CSS class
   */
  toggleClass(cls: string, condition?: boolean): HTMLElement;
}

interface HTMLInputElement {
  empty(): HTMLInputElement;
  addClass(cls: string): HTMLInputElement;
  removeClass(cls: string): HTMLInputElement;
}
