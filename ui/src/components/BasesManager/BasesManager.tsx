/**
 * BasesManager Component
 * 
 * Main component for managing bases: file selection, conversion, viewing
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, RefreshCw, AlertCircle, CheckCircle,
  FileJson, FileCode, Database, Filter as FilterIcon, Settings
} from 'lucide-react';
import { basesService, BaseFile, BaseFilter, BaseSort, ConversionOptions } from '../../services/bases-service';
import { BaseTable } from './BaseTable';
import { ConversionWizard } from './ConversionWizard';

export interface BasesManagerProps {
  initialFile?: string;
  onFileSelect?: (file: string) => void;
  onConvert?: (from: string, to: string) => void;
  showEmbedPreview?: boolean;
}

export const BasesManager: React.FC<BasesManagerProps> = ({
  initialFile,
  onFileSelect,
  onConvert,
  showEmbedPreview = false
}) => {
  const [currentFile, setCurrentFile] = useState<string>(initialFile || '');
  const [base, setBase] = useState<BaseFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConversionWizard, setShowConversionWizard] = useState(false);
  const [filters, setFilters] = useState<BaseFilter[]>([]);
  const [sort, setSort] = useState<BaseSort[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'metadata'>('table');

  // Load base file
  useEffect(() => {
    if (currentFile) {
      loadBase();
    }
  }, [currentFile]);

  const loadBase = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loadedBase = await basesService.parseBase(currentFile);
      setBase(loadedBase);
      setSuccess(`Loaded base: ${currentFile}`);
      onFileSelect?.(currentFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load base file');
      setBase(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert file to base
  const handleConvertToBase = async (filePath: string, options?: ConversionOptions) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const convertedBase = await basesService.convertToBase(filePath, options);
      setBase(convertedBase);
      setCurrentFile(filePath.replace(/\.[^.]+$/, '.base'));
      setSuccess(`Converted ${filePath} to base format`);
      onConvert?.(filePath, currentFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert file');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert base back to JSONL/CanvasL
  const handleConvertBack = async (format: 'jsonl' | 'canvasl') => {
    if (!base) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const converted = format === 'canvasl'
        ? await basesService.convertBaseToCanvasL(base)
        : await basesService.convertBaseToJSONL(base);

      // Download as file
      const blob = new Blob([converted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.replace(/\.base$/, `.${format}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Converted base to ${format.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert base');
    } finally {
      setIsLoading(false);
    }
  };

  // Round-trip test
  const handleRoundTrip = async () => {
    if (!currentFile) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await basesService.roundTripJSONL(currentFile);
      if (result.lossless) {
        setSuccess('Round-trip test passed: conversion is lossless ✓');
      } else {
        setError('Round-trip test failed: data loss detected');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform round-trip test');
    } finally {
      setIsLoading(false);
    }
  };

  // Save base
  const handleSave = async () => {
    if (!base || !currentFile) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await basesService.saveBase(base, currentFile);
      setSuccess('Base file saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save base file');
    } finally {
      setIsLoading(false);
    }
  };

  // Export table data
  const handleExport = async (format: 'csv' | 'json' | 'jsonl') => {
    if (!base) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'csv':
        // CSV export
        const headers = base.schema.fields.map(f => f.name).join(',');
        const rows = base.data.map(row => 
          base.schema.fields.map(f => {
            const value = row[f.name] ?? '';
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;

      case 'json':
        content = JSON.stringify(base.data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;

      case 'jsonl':
        content = base.data.map(row => JSON.stringify(row)).join('\n');
        mimeType = 'text/plain';
        extension = 'jsonl';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.replace(/\.base$/, `.${extension}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Bases Manager</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConversionWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Convert File
            </button>
            {base && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
            )}
          </div>
        </div>

        {/* File Selector */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={currentFile}
              onChange={(e) => setCurrentFile(e.target.value)}
              placeholder="Enter file path (e.g., data/base.base)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadBase}
            disabled={isLoading || !currentFile}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && !base ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading base...</p>
          </div>
        </div>
      ) : base ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 flex items-center gap-2 p-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('metadata')}
              className={`px-4 py-2 rounded ${viewMode === 'metadata' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
            >
              Metadata
            </button>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <BaseTable
              base={base}
              filters={filters}
              sort={sort}
              onExport={handleExport}
            />
          )}

          {/* Metadata View */}
          {viewMode === 'metadata' && (
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Schema</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">
                      Version: {base.schema.version}
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      Fields: {base.schema.fields.length}
                    </p>
                    <div className="space-y-2">
                      {base.schema.fields.map(field => (
                        <div key={field.name} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-blue-400">{field.name}</span>
                          <span className="text-gray-400">({field.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {base._metadata && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Metadata</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        {base._metadata.sourceFormat && (
                          <p>
                            <span className="text-gray-400">Source Format:</span>{' '}
                            <span className="text-blue-400">{base._metadata.sourceFormat}</span>
                          </p>
                        )}
                        {base._metadata.nodeCount !== undefined && (
                          <p>
                            <span className="text-gray-400">Nodes:</span>{' '}
                            <span className="text-blue-400">{base._metadata.nodeCount}</span>
                          </p>
                        )}
                        {base._metadata.edgeCount !== undefined && (
                          <p>
                            <span className="text-gray-400">Edges:</span>{' '}
                            <span className="text-blue-400">{base._metadata.edgeCount}</span>
                          </p>
                        )}
                        {base._metadata.directives && base._metadata.directives.length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Directives:</p>
                            <ul className="list-disc list-inside ml-4">
                              {base._metadata.directives.map((dir, i) => (
                                <li key={i} className="font-mono text-blue-400">{dir}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversion Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Actions</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleConvertBack('jsonl')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Export as JSONL
                      </button>
                      <button
                        onClick={() => handleConvertBack('canvasl')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                      >
                        Export as CanvasL
                      </button>
                      {currentFile.endsWith('.jsonl') && (
                        <button
                          onClick={handleRoundTrip}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                        >
                          Round-Trip Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No base file loaded</p>
            <p className="text-sm mt-2">Enter a file path above or use "Convert File" to create a base</p>
          </div>
        </div>
      )}

      {/* Conversion Wizard Modal */}
      {showConversionWizard && (
        <ConversionWizard
          onClose={() => setShowConversionWizard(false)}
          onConvert={handleConvertToBase}
        />
      )}
    </div>
  );
};
