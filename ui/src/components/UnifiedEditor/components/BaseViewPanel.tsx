/**
 * Base View Panel
 * Integrates BasesManager component for base file viewing and conversion
 */

import React from 'react';
import { BasesManager } from '../../BasesManager/BasesManager';

interface BaseViewPanelProps {
  filename: string;
  onFileSelect?: (file: string) => void;
  onConvert?: (from: string, to: string) => void;
  readOnly?: boolean;
}

export const BaseViewPanel: React.FC<BaseViewPanelProps> = ({
  filename,
  onFileSelect,
  onConvert,
  readOnly = false
}) => {
  const baseFilename = filename.replace(/\.(jsonl|canvasl)$/, '.base');

  return (
    <div className="flex-1 overflow-hidden">
      <BasesManager
        initialFile={baseFilename}
        showEmbedPreview={true}
        onFileSelect={onFileSelect}
        onConvert={onConvert}
      />
    </div>
  );
};
