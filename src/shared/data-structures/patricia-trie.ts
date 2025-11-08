/**
 * Simple Patricia Trie
 * 
 * A basic Patricia trie implementation for efficient axiom/function storage
 * and language-based lookup in the R5RS canvas engine.
 * 
 * Integration with automaton system:
 * - R5RS function storage and lookup
 * - Axiom organization by language
 * - Efficient path-based retrieval
 */

export class SimplePatriciaTrie {
  private root: any = { children: {} };

  /**
   * Insert a node at the given path
   */
  public insert(path: string, axiomNode: any): void {
    const parts = path.split('/');
    let current = this.root;
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { children: {} };
      }
      current = current.children[part];
    }
    current.axiomNode = axiomNode;
  }

  /**
   * Find all axioms for a specific language
   */
  public findByLanguage(language: string): any[] {
    const results: any[] = [];
    this._findByPrefix([language], this.root.children[language] || { children: {} }, results);
    return results;
  }

  /**
   * Find nodes by prefix path
   */
  private _findByPrefix(pathParts: string[], node: any, results: any[]): void {
    if (node.axiomNode) {
      results.push({ path: pathParts.join('/'), axiomNode: node.axiomNode });
    }
    for (const [key, child] of Object.entries(node.children)) {
      this._findByPrefix([...pathParts, key], child as any, results);
    }
  }

  /**
   * Get node at specific path
   */
  public get(path: string): any | null {
    const parts = path.split('/');
    let current = this.root;
    for (const part of parts) {
      if (!current.children[part]) {
        return null;
      }
      current = current.children[part];
    }
    return current.axiomNode || null;
  }

  /**
   * Check if path exists
   */
  public has(path: string): boolean {
    return this.get(path) !== null;
  }

  /**
   * Remove node at path
   */
  public remove(path: string): boolean {
    const parts = path.split('/');
    let current = this.root;
    const pathStack: any[] = [this.root];
    
    for (const part of parts) {
      if (!current.children[part]) {
        return false;
      }
      current = current.children[part];
      pathStack.push(current);
    }

    if (current.axiomNode) {
      delete current.axiomNode;
      // Clean up empty branches
      for (let i = pathStack.length - 1; i > 0; i--) {
        const node = pathStack[i];
        if (Object.keys(node.children).length === 0 && !node.axiomNode) {
          const parent = pathStack[i - 1];
          const key = parts[i - 1];
          delete parent.children[key];
        }
      }
      return true;
    }
    return false;
  }
}
