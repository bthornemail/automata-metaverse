/**
 * ConversionWizard Component
 * 
 * Step-by-step wizard for converting files to base format
 */

import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, CheckCircle } from 'lucide-react';
import { ConversionOptions } from '../../services/bases-service';

export interface ConversionWizardProps {
  onClose: () => void;
  onConvert: (filePath: string, options?: ConversionOptions) => void;
}

type ConversionStep = 'select' | 'format' | 'options' | 'preview' | 'complete';

export const ConversionWizard: React.FC<ConversionWizardProps> = ({
  onClose,
  onConvert
}) => {
  const [step, setStep] = useState<ConversionStep>('select');
  const [filePath, setFilePath] = useState('');
  const [targetFormat, setTargetFormat] = useState<'jsonl' | 'canvasl' | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);

  const steps = [
    { id: 'select', label: 'Select File' },
    { id: 'format', label: 'Choose Format' },
    { id: 'options', label: 'Options' },
    { id: 'preview', label: 'Preview' },
    { id: 'complete', label: 'Complete' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleNext = () => {
    if (step === 'select') {
      if (!filePath) {
        alert('Please enter a file path');
        return;
      }
      setStep('format');
    } else if (step === 'format') {
      if (!targetFormat) {
        alert('Please select a target format');
        return;
      }
      setStep('options');
    } else if (step === 'options') {
      // Generate preview
      setPreviewData({
        filePath,
        format: targetFormat,
        includeMetadata
      });
      setStep('preview');
    } else if (step === 'preview') {
      // Perform conversion
      onConvert(filePath, {
        format: targetFormat!,
        includeMetadata
      });
      setStep('complete');
    }
  };

  const handleBack = () => {
    if (step === 'format') {
      setStep('select');
    } else if (step === 'options') {
      setStep('format');
    } else if (step === 'preview') {
      setStep('options');
    }
  };

  const handleClose = () => {
    if (step === 'complete') {
      onClose();
    } else {
      if (confirm('Are you sure you want to cancel? Progress will be lost.')) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Convert File to Base</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-400">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Source File Path
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g., automaton-kernel.jsonl or data/export.csv"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Supported formats: JSONL, CanvasL, CSV, JSON, Markdown tables, TSV
                </p>
              </div>
            </div>
          )}

          {step === 'format' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-4">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTargetFormat('jsonl')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      targetFormat === 'jsonl'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">JSONL</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Standard JSONL format
                    </div>
                  </button>
                  <button
                    onClick={() => setTargetFormat('canvasl')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      targetFormat === 'canvasl'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">CanvasL</div>
                    <div className="text-xs text-gray-400 mt-1">
                      CanvasL with directives
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'options' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Include metadata (source format, counts, directives)</span>
                </label>
                <p className="text-xs text-gray-400 mt-2 ml-6">
                  Preserves information about the original file format and structure
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Conversion Preview</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Source:</span>{' '}
                    <span className="text-blue-400">{previewData.filePath}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Target Format:</span>{' '}
                    <span className="text-blue-400">{previewData.format?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Include Metadata:</span>{' '}
                    <span className="text-blue-400">
                      {previewData.includeMetadata ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  Ready to convert. Click "Next" to proceed.
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conversion Complete!</h3>
              <p className="text-gray-400">
                The file has been converted to base format.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleBack}
            disabled={step === 'select' || step === 'complete'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step !== 'complete' ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              {step === 'preview' ? 'Convert' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
