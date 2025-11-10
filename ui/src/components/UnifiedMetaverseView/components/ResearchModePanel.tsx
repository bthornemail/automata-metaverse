/**
 * Research Mode Panel
 * UI for exploring agent provenance chains, history, and knowledge
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Code, FileText, GitBranch, Users, Calendar, Database } from 'lucide-react';
import { ProvenanceOffscreenCanvas, ProvenanceNode, ProvenanceEdge } from './ProvenanceOffscreenCanvas';
import { agentProvenanceQueryService, QueryTemplate } from '@/services/agent-provenance-query-service';
import { agentHistoryLoggingService } from '@/services/agent-history-logging-service';

interface ResearchModePanelProps {
  agentId: string;
  onClose: () => void;
}

export const ResearchModePanel: React.FC<ResearchModePanelProps> = ({
  agentId,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<[number, number] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [queryType, setQueryType] = useState<'prolog' | 'datalog' | 'sparql'>('prolog');
  const [customQuery, setCustomQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null);
  const [selectedNode, setSelectedNode] = useState<ProvenanceNode | null>(null);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  const queryTemplates = agentProvenanceQueryService.getQueryTemplates();

  // Execute query
  const handleExecuteQuery = async () => {
    if (!customQuery.trim()) return;

    setIsExecutingQuery(true);
    try {
      let results;
      switch (queryType) {
        case 'prolog':
          results = await agentProvenanceQueryService.queryProlog(agentId, customQuery);
          break;
        case 'datalog':
          results = await agentProvenanceQueryService.queryDatalog(agentId, customQuery);
          break;
        case 'sparql':
          results = await agentProvenanceQueryService.querySparql(agentId, customQuery);
          break;
      }
      setQueryResults(results);
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsExecutingQuery(false);
    }
  };

  // Use template
  const handleUseTemplate = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    setQueryType(template.type);
    const query = agentProvenanceQueryService.buildQuery(template, { agentId });
    setCustomQuery(query);
  };

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="absolute inset-0 bg-gray-900/95 z-50 flex">
      {/* Left Panel: Search & Filters */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Research Mode</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          Agent: <span className="text-white font-semibold">{agentId}</span>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </label>
          <input
            type="text"
            placeholder="Search agent history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
          />
        </div>

        {/* Time Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Time Range
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="flex-1 px-2 py-1 bg-gray-700 rounded text-white text-xs"
              onChange={(e) => {
                const start = e.target.valueAsNumber;
                setTimeRange(prev => prev ? [start, prev[1]] : [start, Date.now()]);
              }}
            />
            <input
              type="datetime-local"
              className="flex-1 px-2 py-1 bg-gray-700 rounded text-white text-xs"
              onChange={(e) => {
                const end = e.target.valueAsNumber;
                setTimeRange(prev => prev ? [prev[0], end] : [0, end]);
              }}
            />
          </div>
          {timeRange && (
            <button
              onClick={() => setTimeRange(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300"
            >
              Clear time range
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Filter by Type
          </label>
          <div className="flex flex-wrap gap-2">
            {['document', 'code', 'evolution', 'interaction'].map(type => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  selectedTypes.includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type === 'document' && <FileText className="w-3 h-3 inline mr-1" />}
                {type === 'code' && <Code className="w-3 h-3 inline mr-1" />}
                {type === 'evolution' && <GitBranch className="w-3 h-3 inline mr-1" />}
                {type === 'interaction' && <Users className="w-3 h-3 inline mr-1" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Query Templates */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Database className="w-4 h-4 inline mr-1" />
            Query Templates
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {queryTemplates.map(template => (
              <button
                key={template.name}
                onClick={() => handleUseTemplate(template)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                  selectedTemplate?.name === template.name
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={template.description}
              >
                <div className="font-semibold">{template.name}</div>
                <div className="text-gray-400 text-[10px] mt-1">{template.type.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Builder */}
        <div className="mb-4 flex-1 flex flex-col">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Query Type
          </label>
          <div className="flex gap-2 mb-2">
            {(['prolog', 'datalog', 'sparql'] as const).map(type => (
              <button
                key={type}
                onClick={() => setQueryType(type)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  queryType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder={`Enter ${queryType.toUpperCase()} query...`}
            className="flex-1 w-full px-3 py-2 bg-gray-700 rounded text-white text-xs font-mono resize-none"
          />
          <button
            onClick={handleExecuteQuery}
            disabled={!customQuery.trim() || isExecutingQuery}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm"
          >
            {isExecutingQuery ? 'Executing...' : 'Execute Query'}
          </button>
        </div>

        {/* Query Results */}
        {queryResults && (
          <div className="mt-4 p-3 bg-gray-700 rounded text-xs">
            <div className="font-semibold text-white mb-2">Query Results</div>
            <pre className="text-gray-300 overflow-auto max-h-32">
              {JSON.stringify(queryResults, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Right Panel: Provenance Visualization */}
      <div className="flex-1 relative" style={{ minHeight: '600px' }}>
        <ProvenanceOffscreenCanvas
          agentId={agentId}
          canvasLFile={`logs/agents/${agentId}/history.canvasl`}
          query={customQuery ? { type: queryType, query: customQuery } : undefined}
          filters={{
            timeRange,
            documentTypes: selectedTypes.includes('document') ? ['*'] : [],
            codeTypes: selectedTypes.includes('code') ? ['*'] : [],
            interactionTypes: selectedTypes.includes('interaction') ? ['*'] : []
          }}
          onNodeSelect={setSelectedNode}
          onEdgeSelect={(edge) => console.log('Edge selected:', edge)}
        />

        {/* Detail View Overlay */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-gray-800/95 p-4 rounded-lg border border-gray-700 max-h-64 overflow-y-auto">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-white">{selectedNode.type}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <div><span className="font-semibold">ID:</span> {selectedNode.id}</div>
              <div><span className="font-semibold">File:</span> {selectedNode.metadata.file}</div>
              <div><span className="font-semibold">Line:</span> {selectedNode.metadata.line}</div>
              <div><span className="font-semibold">Timestamp:</span> {new Date(selectedNode.metadata.timestamp).toLocaleString()}</div>
              {selectedNode.metadata.dimension && (
                <div><span className="font-semibold">Dimension:</span> {selectedNode.metadata.dimension}</div>
              )}
              {selectedNode.metadata.churchEncoding && (
                <div><span className="font-semibold">Church Encoding:</span> {selectedNode.metadata.churchEncoding}</div>
              )}
            </div>
            {selectedNode.data && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <pre className="text-xs text-gray-400 overflow-auto">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
