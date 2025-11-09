/**
 * Hybrid View Component
 * Split view with code editor on left and canvas on right
 */

import React, { useState } from 'react';
import { CodeEditorPanel } from './CodeEditorPanel';
import { CanvasEditorPanel } from './CanvasEditorPanel';
import { HybridViewProps } from '../types';
import { syncCodeToCanvas, syncCanvasToCode } from '../utils/data-sync';
import { Split } from 'lucide-react';

export const HybridView: React.FC<HybridViewProps> = ({
  codeContent,
  graph,
  onCodeChange,
  onGraphChange,
  language,
  autoSync,
  onAutoSyncChange,
  readOnly = false
}) => {
  const [splitPosition, setSplitPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);

  const handleCodeChange = (newCode: string) => {
    onCodeChange(newCode);
    
    if (autoSync) {
      try {
        const newGraph = syncCodeToCanvas(newCode);
        onGraphChange(newGraph);
      } catch (error) {
        console.error('Failed to sync code to canvas:', error);
      }
    }
  };

  const handleGraphChange = (newGraph: typeof graph) => {
    onGraphChange(newGraph);
    
    if (autoSync) {
      try {
        const newCode = syncCanvasToCode(newGraph, language === 'canvasl' ? 'canvasl' : 'jsonl');
        onCodeChange(newCode);
      } catch (error) {
        console.error('Failed to sync canvas to code:', error);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const container = e.currentTarget.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrained = Math.max(20, Math.min(80, percentage));
    setSplitPosition(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Sync Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Split className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Hybrid View</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => onAutoSyncChange(e.target.checked)}
              disabled={readOnly}
              className="rounded"
            />
            Auto-sync
          </label>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Code Editor Panel */}
        <div 
          className="overflow-hidden border-r border-gray-700"
          style={{ width: `${splitPosition}%` }}
        >
          <CodeEditorPanel
            content={codeContent}
            language={language}
            onContentChange={handleCodeChange}
            readOnly={readOnly}
            height="100%"
          />
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors relative z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500"></div>
          </div>
        </div>

        {/* Canvas Panel */}
        <div 
          className="overflow-hidden"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <CanvasEditorPanel
            graph={graph}
            onGraphChange={handleGraphChange}
            filename="hybrid.canvasl"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
