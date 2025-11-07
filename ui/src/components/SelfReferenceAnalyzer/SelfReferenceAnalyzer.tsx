import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, AlertCircle, CheckCircle, Clock, Zap, Eye } from 'lucide-react';
import { SelfReferenceData } from '@/types';
import { apiService } from '@/services/api';

const SelfReferenceAnalyzer: React.FC = () => {
  const [data, setData] = useState<SelfReferenceData>({
    selfRefObjects: [],
    automata: [],
    modifications: [],
    integrity: { valid: true, issues: [] },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSelfReferenceAnalysis();
      
      if (response.success && response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load self-reference analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const filteredSelfRefs = data.selfRefObjects.filter(ref =>
    ref.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDimensionColor = (dimension: number): string => {
    const colors = [
      'bg-dimension-0d', 'bg-dimension-1d', 'bg-dimension-2d', 'bg-dimension-3d',
      'bg-dimension-4d', 'bg-dimension-5d', 'bg-dimension-6d', 'bg-dimension-7d'
    ];
    return colors[dimension] || 'bg-gray-500';
  };

  const getDimensionName = (dimension: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[dimension] || 'Unknown';
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Eye className="w-6 h-6" />
          Self-Reference Analyzer
        </h3>
        
        <button
          onClick={loadAnalysis}
          disabled={loading}
          className="control-button bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm"
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {/* Integrity Status */}
      <div className="mb-6 p-4 bg-gray-700/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-white">Integrity Status</h4>
          <div className="flex items-center gap-2">
            {data.integrity.valid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-400">Valid</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400">Issues Found</span>
              </>
            )}
          </div>
        </div>
        
        {!data.integrity.valid && data.integrity.issues.length > 0 && (
          <div className="space-y-2">
            {data.integrity.issues.map((issue, index) => (
              <div key={index} className="text-sm text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Self-Reference Objects</div>
          <div className="text-2xl font-bold text-white">{data.selfRefObjects.length}</div>
          <div className="text-xs text-gray-500">Total references</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Automata</div>
          <div className="text-2xl font-bold text-white">{data.automata.length}</div>
          <div className="text-xs text-gray-500">Dimensional states</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Modifications</div>
          <div className="text-2xl font-bold text-white">{data.modifications.length}</div>
          <div className="text-xs text-gray-500">Dynamic changes</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search self-references..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#6366f1]"
          />
        </div>
      </div>

      {/* Self-Reference Objects */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Self-Reference Objects
        </h4>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {filteredSelfRefs.map((ref, index) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 bg-gray-700/50 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedLine === ref.line
                    ? 'border-[#6366f1] bg-[#6366f1]/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedLine(selectedLine === ref.line ? null : ref.line)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {ref.line}
                    </div>
                    <div>
                      <div className="text-white font-medium">{ref.id}</div>
                      <div className="text-xs text-gray-400">Line {ref.line}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded">
                  {ref.text.length > 100 ? `${ref.text.substring(0, 100)}...` : ref.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Dimensional Automata */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Dimensional Automata</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.automata.map((automaton) => (
            <motion.div
              key={automaton.id}
              whileHover={{ scale: 1.05 }}
              className={`p-3 rounded-lg border-2 ${getDimensionColor(automaton.dimension)} border-opacity-50`}
            >
              <div className="text-white font-bold text-center">
                {automaton.dimension}D
              </div>
              <div className="text-xs text-white text-center opacity-75">
                {getDimensionName(automaton.dimension)}
              </div>
              <div className="text-xs text-white text-center mt-1 font-mono">
                {automaton.pattern}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Modifications */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Modifications
        </h4>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.modifications.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No modifications recorded yet
            </div>
          ) : (
            data.modifications.slice(-10).reverse().map((mod, index) => (
              <motion.div
                key={mod.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-gray-700/30 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-medium">{mod.type}</div>
                  <div className="text-xs text-gray-400">{mod.details}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(mod.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfReferenceAnalyzer;