/**
 * Unified Editor Types
 */

import { EditorMode } from './utils/mode-detector';
import { CanvasGraph } from '../../services/jsonl-canvas-service';

export interface UnifiedEditorProps {
  filename: string;
  initialMode?: EditorMode | 'auto';
  onSave?: (content: string, format: 'code' | 'jsonl' | 'canvasl') => void;
  onClose?: () => void;
  height?: string;
  readOnly?: boolean;
  initialContent?: string;
}

export interface UnifiedEditorState {
  mode: EditorMode;
  content: string;
  graph?: CanvasGraph;
  language: string;
  fileExtension: string;
  isDirty: boolean;
  autoSync: boolean;
}

export interface EditorPanelProps {
  content: string;
  language: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  height?: string;
}

export interface CanvasPanelProps {
  graph: CanvasGraph;
  onGraphChange: (graph: CanvasGraph) => void;
  filename: string;
  readOnly?: boolean;
}

export interface HybridViewProps {
  codeContent: string;
  graph: CanvasGraph;
  onCodeChange: (content: string) => void;
  onGraphChange: (graph: CanvasGraph) => void;
  language: string;
  autoSync: boolean;
  onAutoSyncChange: (enabled: boolean) => void;
  readOnly?: boolean;
}
