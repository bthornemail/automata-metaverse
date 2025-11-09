/**
 * Unified Metaverse View Types
 * Major/Minor mode system for environments and symbol selection
 */

export type EnvironmentType = 'abstract' | 'canvas-2d' | 'code-media' | '3d-gltf';

export type MajorMode = 'environment' | 'symbol';
export type MinorMode = EnvironmentType | string; // Minor mode can be environment or symbol ID

export interface Symbol {
  id: string;
  name: string;
  type: 'node' | 'edge' | 'avatar' | 'code' | 'media';
  environment: EnvironmentType;
  position?: [number, number, number];
  data: any;
  metadata?: {
    dimension?: number;
    churchEncoding?: string;
    gltfModel?: string;
    codeContent?: string;
    mediaUrl?: string;
  };
}

export interface UnifiedViewState {
  majorMode: MajorMode;
  minorMode: MinorMode;
  selectedSymbol: Symbol | null;
  selectedSymbols: Set<string>;
  activeEnvironments: Set<EnvironmentType>;
  environmentConfigs: Map<EnvironmentType, any>;
  viewportLayout: 'single' | 'split-horizontal' | 'split-vertical' | 'grid';
}

export interface UnifiedMetaverseViewProps {
  initialMajorMode?: MajorMode;
  initialMinorMode?: MinorMode;
  onModeChange?: (major: MajorMode, minor: MinorMode) => void;
  onSymbolSelect?: (symbol: Symbol | null) => void;
  height?: string;
}

export interface EnvironmentRendererProps {
  environment: EnvironmentType;
  selectedSymbol: Symbol | null;
  selectedSymbols: Set<string>;
  onSymbolSelect: (symbol: Symbol | null) => void;
  config?: any;
}
