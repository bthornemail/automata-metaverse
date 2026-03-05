/**
 * A₂: Face Binder Automaton
 *
 * Role: C₂ document/face management (GeoJSON format)
 * Uses meta-log-db: r5rs:export-2d
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A2FaceBinderState {
    faces: Array<{
        id: string;
        edges: string[];
        data?: any;
    }>;
    initialized: boolean;
}
/**
 * A₂: Face Binder Automaton
 *
 * Manages C₂ documents/faces (2-cells) and binds faces from edges
 */
export declare class A2_FaceBinder extends BaseAutomaton {
    private db?;
    readonly id: 2;
    readonly name = "A\u2082 Face Binder";
    readonly role = "C\u2082 document/face management (GeoJSON format)";
    state: A2FaceBinderState;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    private bindFaces;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get all faces
     */
    getFaces(): Array<{
        id: string;
        edges: string[];
        data?: any;
    }>;
}
//# sourceMappingURL=a2-face-binder.d.ts.map