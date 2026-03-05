export interface AutomatonState {
    id: string;
    type: string;
    currentState: string;
    dimensionalLevel: number;
    selfReference: {
        file: string;
        line: number;
        pattern: string;
    };
    provenanceHistory?: Array<{
        file: string;
        line: number;
        pattern?: string;
    }>;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    text?: string;
}
export interface Transition {
    id: string;
    type: string;
    from: string;
    to: string;
    condition: string;
    action: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    text?: string;
}
export interface VerticalTransition {
    id: string;
    type: string;
    fromNode: string;
    toNode: string;
    label: string;
}
export type CanvasObject = (AutomatonState | Transition | VerticalTransition) & {
    id?: string;
    selfReference?: {
        file: string;
        line: number;
        pattern?: string;
    };
    provenanceHistory?: Array<{
        file: string;
        line: number;
        pattern?: string;
    }>;
    [key: string]: any;
};
export interface ActionTypes {
    evolve: 'evolve';
    selfReference: 'self-reference';
    selfModify: 'self-modify';
    selfIO: 'self-io';
    validateSelf: 'validate-self';
    selfTrain: 'self-train';
    selfObserve: 'self-observe';
    compose: 'compose';
}
export interface DimensionalTypes {
    0: '0D';
    1: '1D';
    2: '2D';
    3: '3D';
    4: '4D';
    5: '5D';
    6: '6D';
    7: '7D';
}
//# sourceMappingURL=automaton-state.d.ts.map