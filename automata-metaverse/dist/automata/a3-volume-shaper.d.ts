/**
 * A₃: Volume Shaper Automaton
 *
 * Role: C₃ interface triple/volume management (TopoJSON format)
 * Uses meta-log-db: r5rs:export-3d, r5rs:topojson-to-geojson
 */
import { BaseAutomaton } from './types.js';
import type { AutomatonId, SwarmContext, AutomatonMessage } from './types.js';
import type { MetaLogDb } from 'meta-log-db';
export interface A3VolumeShaperState {
    volumes: Array<{
        id: string;
        faces: string[];
        data?: any;
    }>;
    initialized: boolean;
}
/**
 * A₃: Volume Shaper Automaton
 *
 * Manages C₃ interface triples/volumes (3-cells) and shapes volumes from faces
 */
export declare class A3_VolumeShaper extends BaseAutomaton {
    private db?;
    readonly id: 3;
    readonly name = "A\u2083 Volume Shaper";
    readonly role = "C\u2083 interface triple/volume management (TopoJSON format)";
    state: A3VolumeShaperState;
    constructor(db?: MetaLogDb | undefined);
    tick(swarm: SwarmContext): Promise<void>;
    private initialize;
    private shapeVolumes;
    receive(from: AutomatonId, message: AutomatonMessage): Promise<void>;
    /**
     * Get all volumes
     */
    getVolumes(): Array<{
        id: string;
        faces: string[];
        data?: any;
    }>;
}
//# sourceMappingURL=a3-volume-shaper.d.ts.map