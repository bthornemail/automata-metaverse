/**
 * Unified Editor Component
 * Combines CodeEditor and JSONLCanvasEditor functionality
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UnifiedEditorProps, UnifiedEditorState } from './types';
import { detectFileMode, detectFileType, getLanguageFromFilename, getFileExtension } from './utils/mode-detector';
import { syncCodeToCanvas, syncCanvasToCode, validateSync } from './utils/data-sync';
import { exportToFormat } from './utils/export-import';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { CanvasEditorPanel } from './components/CanvasEditorPanel';
import { HybridView } from './components/HybridView';
import { BaseViewPanel } from './components/BaseViewPanel';
import { databaseService } from '../../services/database-service';
import { CanvasGraph } from '../../services/jsonl-canvas-service';
import { jsonlCanvasService } from '../../services/jsonl-canvas-service';
import { EditorMode } from './utils/mode-detector';

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  filename,
  initialMode = 'auto',
  onSave,
  onClose,
  height = '100%',
  readOnly = false,
  initialContent
}) => {
  const fileType = detectFileType(filename);
  const detectedMode = detectFileMode(filename);
  const language = getLanguageFromFilename(filename);
  const fileExtension = getFileExtension(filename);

  const [state, setState] = useState<UnifiedEditorState>({
    mode: initialMode === 'auto' ? detectedMode : (initialMode as EditorMode),
    content: initialContent || '',
    graph: undefined,
    language,
    fileExtension,
    isDirty: false,
    autoSync: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load file content
  useEffect(() => {
    loadFile();
  }, [filename]);

  const loadFile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (fileType === 'jsonl' || fileType === 'canvasl') {
        // Load JSONL/CanvasL file
        const entries = await databaseService.readJSONL(filename);
        const jsonlContent = entries.map(entry => JSON.stringify(entry)).join('\n');
        const graph = jsonlCanvasService.parseJSONL(jsonlContent);
        
        setState(prev => ({
          ...prev,
          content: jsonlContent,
          graph
        }));
      } else if (fileType === 'base') {
        // Base files are handled by BaseViewPanel
        setState(prev => ({
          ...prev,
          content: ''
        }));
      } else {
        // Code file - try to load from database or use initial content
        try {
          const entries = await databaseService.readJSONL(filename);
          const content = entries.map(entry => JSON.stringify(entry)).join('\n');
          setState(prev => ({ ...prev, content }));
        } catch {
          // File doesn't exist, use initial content or empty
          setState(prev => ({ ...prev, content: initialContent || '' }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      console.error('Failed to load file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (readOnly) return;

    setIsSaving(true);
    setError(null);

    try {
      let contentToSave = state.content;
      let format: 'code' | 'jsonl' | 'canvasl' = 'code';

      // Determine format based on mode and file type
      if (state.mode === 'canvas' || state.mode === 'hybrid') {
        if (state.graph) {
          format = fileType === 'canvasl' ? 'canvasl' : 'jsonl';
          contentToSave = syncCanvasToCode(state.graph, format);
        }
      }

      // Save via database service
      if (fileType === 'jsonl' || fileType === 'canvasl') {
        const lines = contentToSave.split('\n').filter(l => l.trim());
        const entries = lines.map(line => JSON.parse(line));
        await databaseService.writeJSONL(filename, entries);
      } else {
        // For code files, save as JSONL entries
        const entries = [{ id: 'content', type: 'code', content: contentToSave }];
        await databaseService.writeJSONL(filename, entries);
      }

      setState(prev => ({ ...prev, isDirty: false }));

      if (onSave) {
        onSave(contentToSave, format);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    // Sync data when switching modes
    if (state.mode === 'code' && (newMode === 'canvas' || newMode === 'hybrid')) {
      // Convert code to graph
      try {
        const graph = syncCodeToCanvas(state.content);
        setState(prev => ({ ...prev, mode: newMode, graph }));
      } catch (err) {
        console.error('Failed to convert code to canvas:', err);
        setState(prev => ({ ...prev, mode: newMode }));
      }
    } else if ((state.mode === 'canvas' || state.mode === 'hybrid') && newMode === 'code') {
      // Convert graph to code
      if (state.graph) {
        try {
          const code = syncCanvasToCode(state.graph, fileType === 'canvasl' ? 'canvasl' : 'jsonl');
          setState(prev => ({ ...prev, mode: newMode, content: code }));
        } catch (err) {
          console.error('Failed to convert canvas to code:', err);
          setState(prev => ({ ...prev, mode: newMode }));
        }
      }
    } else {
      setState(prev => ({ ...prev, mode: newMode }));
    }
  };

  const handleContentChange = (newContent: string) => {
    setState(prev => ({ ...prev, content: newContent, isDirty: true }));
  };

  const handleGraphChange = (newGraph: CanvasGraph) => {
    setState(prev => ({ ...prev, graph: newGraph, isDirty: true }));
  };

  const handleLanguageChange = (newLanguage: string) => {
    setState(prev => ({ ...prev, language: newLanguage }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white" style={{ height }}>
      {/* Toolbar */}
      <UnifiedToolbar
        mode={state.mode}
        onModeChange={handleModeChange}
        language={state.language}
        onLanguageChange={handleLanguageChange}
        filename={filename}
        onSave={handleSave}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        isSaving={isSaving}
        readOnly={readOnly}
      />

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {state.mode === 'code' && (
          <CodeEditorPanel
            content={state.content}
            language={state.language}
            onContentChange={handleContentChange}
            readOnly={readOnly}
            height="100%"
          />
        )}

        {state.mode === 'canvas' && state.graph && (
          <CanvasEditorPanel
            graph={state.graph}
            onGraphChange={handleGraphChange}
            filename={filename}
            readOnly={readOnly}
          />
        )}

        {state.mode === 'hybrid' && (
          state.graph ? (
            <HybridView
              codeContent={state.content}
              graph={state.graph}
              onCodeChange={handleContentChange}
              onGraphChange={handleGraphChange}
              language={state.language}
              autoSync={state.autoSync}
              onAutoSyncChange={(enabled) => setState(prev => ({ ...prev, autoSync: enabled }))}
              readOnly={readOnly}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <p>Initializing hybrid view...</p>
                <p className="text-sm mt-2">Please wait while we load the canvas data</p>
              </div>
            </div>
          )
        )}

        {state.mode === 'base' && (
          <BaseViewPanel
            filename={filename}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
};

export default UnifiedEditor;
