/**
 * WASM ML Engine (Stub)
 *
 * Placeholder for WASM ML engine functionality
 * This will be implemented in a future version
 */
export interface WASMMLEngine {
    initialize(): Promise<void>;
    embed(text: string): Promise<number[]>;
    similarity(a: number[], b: number[]): number;
}
export declare class WASMMLEngineImpl implements WASMMLEngine {
    initialize(): Promise<void>;
    embed(text: string): Promise<number[]>;
    similarity(a: number[], b: number[]): number;
}
//# sourceMappingURL=wasm-ml-engine.d.ts.map