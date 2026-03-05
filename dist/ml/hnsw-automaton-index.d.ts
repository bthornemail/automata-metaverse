/**
 * HNSW Automaton Index (Stub)
 *
 * Placeholder for HNSW indexing functionality
 * This will be implemented in a future version
 */
export interface HNSWAutomatonIndex {
    add(id: string, vector: number[]): void;
    search(query: number[], k: number): string[];
    remove(id: string): void;
}
export declare class HNSWAutomatonIndexImpl implements HNSWAutomatonIndex {
    add(id: string, vector: number[]): void;
    search(query: number[], k: number): string[];
    remove(id: string): void;
}
//# sourceMappingURL=hnsw-automaton-index.d.ts.map