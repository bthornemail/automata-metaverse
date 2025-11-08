import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, FileText, Database, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { bipartiteService, RelationshipGraph } from '../../services/bipartite-service';

interface BipartiteViewerProps {
  onSelectMarkdown?: (path: string) => void;
  onSelectJSONL?: (path: string) => void;
  onClose?: () => void;
}

const BipartiteViewer: React.FC<BipartiteViewerProps> = ({
  onSelectMarkdown,
  onSelectJSONL,
  onClose
}) => {
  const [graph, setGraph] = useState<RelationshipGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [selectedMarkdown, setSelectedMarkdown] = useState<string | null>(null);
  const [selectedJSONL, setSelectedJSONL] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    setIsLoading(true);
    try {
      const relationships = await bipartiteService.getRelationships();
      setGraph(relationships);
      
      // Validate structure
      const validationResult = await bipartiteService.validateBipartiteStructure();
      setValidation(validationResult);
    } catch (error) {
      console.error('Failed to load relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRelationships();
    setIsRefreshing(false);
  };

  const handleMarkdownClick = (path: string) => {
    setSelectedMarkdown(path);
    setSelectedJSONL(null);
    if (onSelectMarkdown) {
      onSelectMarkdown(path);
    }
  };

  const handleJSONLClick = (path: string) => {
    setSelectedJSONL(path);
    setSelectedMarkdown(null);
    if (onSelectJSONL) {
      onSelectJSONL(path);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading relationships...</p>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>No relationships found</p>
        </div>
      </div>
    );
  }

  const markdownFiles = Array.from(graph.markdownToJSONL.keys());
  const jsonlFiles = Array.from(graph.jsonlToMarkdown.keys());

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Bipartite Relationship Viewer</h2>
            {validation && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                validation.valid ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {validation.valid ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Valid
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">{markdownFiles.length} Markdown files</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">{jsonlFiles.length} JSONL files</span>
          </div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300">{graph.relationships.length} Relationships</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Bipartite Graph Visualization */}
        <div className="space-y-6">
          {/* Markdown Files */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Markdown Files
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markdownFiles.map(markdownPath => {
                const jsonlRefs = graph.markdownToJSONL.get(markdownPath) || new Set();
                const isSelected = selectedMarkdown === markdownPath;
                
                return (
                  <motion.div
                    key={markdownPath}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                    onClick={() => handleMarkdownClick(markdownPath)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="text-xs text-gray-400 truncate ml-2 flex-1">
                        {markdownPath}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-gray-400 mb-1">
                        References {jsonlRefs.size} JSONL file{jsonlRefs.size !== 1 ? 's' : ''}:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(jsonlRefs).map(jsonlPath => (
                          <span
                            key={jsonlPath}
                            className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-700"
                          >
                            {jsonlPath}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* JSONL Files */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-400" />
              JSONL Files
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jsonlFiles.map(jsonlPath => {
                const markdownRefs = graph.jsonlToMarkdown.get(jsonlPath) || new Set();
                const isSelected = selectedJSONL === jsonlPath;
                
                return (
                  <motion.div
                    key={jsonlPath}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                    onClick={() => handleJSONLClick(jsonlPath)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Database className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <div className="text-xs text-gray-400 truncate ml-2 flex-1">
                        {jsonlPath}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-gray-400 mb-1">
                        Referenced by {markdownRefs.size} Markdown file{markdownRefs.size !== 1 ? 's' : ''}:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(markdownRefs).map(markdownPath => (
                          <span
                            key={markdownPath}
                            className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-700"
                          >
                            {markdownPath}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validation && !validation.valid && validation.errors.length > 0 && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Validation Errors
            </h4>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-300">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BipartiteViewer;
