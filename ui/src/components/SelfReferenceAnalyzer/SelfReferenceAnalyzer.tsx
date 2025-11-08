import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle, Clock, Zap, Eye, History, TrendingUp } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SelfReferenceData } from '@/types';
import { apiService } from '@/services/api';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import { integrityService, IntegrityResult } from '@/services/integrity-service';
import { Card } from '@/components/shared/Card';
import { SelfReferenceObjects } from './SelfReferenceObjects';
import { DimensionalOverview } from './DimensionalOverview';

type AnalyzerTab = 'self-reference' | 'execution-history' | 'dimensional-overview';

const SelfReferenceAnalyzer: React.FC = () => {
  const [data, setData] = useState<SelfReferenceData>({
    selfRefObjects: [],
    automata: [],
    modifications: [],
    integrity: { valid: true, issues: [] },
  });
  
  const { data: executionData, loading: historyLoading, error: historyError, actions: historyActions } = useExecutionHistory();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AnalyzerTab>('self-reference');
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

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

  const validateIntegrity = async () => {
    try {
      setIntegrityLoading(true);
      const result = await integrityService.validateIntegrity();
      setIntegrityResult(result);
      
      // Update data with integrity result
      setData(prev => ({
        ...prev,
        integrity: {
          valid: result.valid,
          issues: result.issues,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate integrity');
    } finally {
      setIntegrityLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
    historyActions.loadHistory();
    validateIntegrity();
    
    // Re-validate integrity every 30 seconds
    const interval = setInterval(() => {
      validateIntegrity();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredSelfRefs = data.selfRefObjects.filter(ref =>
    ref.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDimensionColor = (dimension: number): string => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#06b6d4'
    ];
    return colors[dimension] || '#6b7280';
  };

  const getDimensionName = (dimension: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[dimension] || 'Unknown';
  };

  // Prepare execution history data for charts
  const actionFrequencyData = Array.from(executionData.actionFrequency.entries()).map(([action, count]) => ({
    action: action.replace('-', ' '),
    count,
    fill: '#6366f1'
  }));

  const dimensionalProgressionData = executionData.dimensionalProgression.map((prog) => ({
    dimension: `${prog.dimension}D`,
    duration: prog.duration,
    timestamp: prog.timestamp,
    fill: getDimensionColor(prog.dimension)
  }));

  const recentHistory = executionData.history.slice(-20).map((entry) => ({
    ...entry,
    displayTime: new Date(entry.timestamp).toLocaleTimeString(),
    actionDisplay: entry.action.replace('-', ' ')
  }));

  const tabs = [
    { id: 'self-reference' as AnalyzerTab, label: 'Self-Reference', icon: Eye },
    { id: 'execution-history' as AnalyzerTab, label: 'Execution History', icon: History },
    { id: 'dimensional-overview' as AnalyzerTab, label: 'Dimensional Overview', icon: TrendingUp },
  ];

  const handleActivityClose = (activity: any) => {
    console.log('Activity closed and converted to self-reference:', activity);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-xl" data-testid="self-reference-analyzer">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Eye className="w-6 h-6" />
          Self-Reference Analyzer & Execution History
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              loadAnalysis();
              validateIntegrity();
            }}
            disabled={loading || integrityLoading}
            className="control-button bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {loading || integrityLoading ? 'Analyzing...' : 'Refresh'}
          </button>
          
          {activeTab === 'execution-history' && (
            <button
              onClick={historyActions.clearHistory}
              className="control-button bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#6366f1] text-white border-b-2 border-[#6366f1]'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Display */}
      {(error || historyError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm"
        >
          <strong>Error:</strong> {error || historyError}
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Self-Reference Tab */}
        {activeTab === 'self-reference' && (
          <motion.div
            key="self-reference"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Integrity Status */}
            <Card title="Integrity Status">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {integrityLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6366f1]"></div>
                      <span className="text-gray-400 font-medium">Validating...</span>
                    </>
                  ) : (integrityResult?.valid ?? data.integrity.valid) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-400 font-medium">Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-400 font-medium">Issues Found</span>
                    </>
                  )}
                </div>
                <button
                  onClick={validateIntegrity}
                  disabled={integrityLoading}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 disabled:opacity-50"
                >
                  {integrityLoading ? 'Validating...' : 'Re-validate'}
                </button>
              </div>

              {/* Validation Checks */}
              {integrityResult && (
                <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className={`text-xs px-2 py-1 rounded ${integrityResult.checks.structure ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    Structure: {integrityResult.checks.structure ? '✓' : '✗'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${integrityResult.checks.selfReference ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    Self-Ref: {integrityResult.checks.selfReference ? '✓' : '✗'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${integrityResult.checks.rdf ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    RDF: {integrityResult.checks.rdf ? '✓' : '✗'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${integrityResult.checks.shacl ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    SHACL: {integrityResult.checks.shacl ? '✓' : '✗'}
                  </div>
                </div>
              )}
              
              {/* Issues List */}
              {(integrityResult?.details.length ?? data.integrity.issues.length) > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(integrityResult?.details || data.integrity.issues.map((msg, i) => ({ severity: 'error' as const, message: msg }))).map((issue, index) => (
                    <div 
                      key={index} 
                      className={`text-sm flex items-start gap-2 ${
                        issue.severity === 'error' ? 'text-red-300' : 
                        issue.severity === 'warning' ? 'text-yellow-300' : 
                        'text-blue-300'
                      }`}
                    >
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        issue.severity === 'error' ? 'text-red-500' : 
                        issue.severity === 'warning' ? 'text-yellow-500' : 
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div>{issue.message}</div>
                        {issue.component && (
                          <div className="text-xs opacity-75 mt-0.5">
                            Component: {issue.component}
                            {issue.line && ` • Line ${issue.line}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(!integrityResult || integrityResult.details.length === 0) && data.integrity.valid && (
                <div className="text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  All integrity checks passed
                </div>
              )}
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Self-Refs</div>
                <div className="text-2xl font-bold text-white">{data.selfRefObjects.length}</div>
              </Card>
              
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Automata</div>
                <div className="text-2xl font-bold text-white">{data.automata.length}</div>
              </Card>
              
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Modifications</div>
                <div className="text-2xl font-bold text-white">{data.modifications.length}</div>
              </Card>

              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Executions</div>
                <div className="text-2xl font-bold text-white">{executionData.history.length}</div>
              </Card>
            </div>

            {/* Search Bar */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search self-references and activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#6366f1]"
                />
              </div>
            </div>

            {/* Self-Reference Objects & Activity - Merged Component */}
            <SelfReferenceObjects
              selfRefObjects={data.selfRefObjects}
              modifications={data.modifications}
              executionHistory={recentHistory}
              loading={historyLoading}
              onActivityClose={handleActivityClose}
            />
          </motion.div>
        )}

        {/* Execution History Tab */}
        {activeTab === 'execution-history' && (
          <motion.div
            key="execution-history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Total Executions</div>
                <div className="text-2xl font-bold text-white">{executionData.history.length}</div>
              </Card>
              
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Unique Actions</div>
                <div className="text-2xl font-bold text-white">{executionData.actionFrequency.size}</div>
              </Card>
              
              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {executionData.performanceMetrics.successRate.toFixed(1)}%
                </div>
              </Card>

              <Card className="bg-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Avg Time</div>
                <div className="text-2xl font-bold text-blue-400">
                  {executionData.performanceMetrics.avgExecutionTime.toFixed(0)}ms
                </div>
              </Card>
            </div>

            {/* Recent Execution Timeline */}
            <Card title="Recent Execution Timeline">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No execution history available
                    </div>
                  ) : (
                    recentHistory.map((entry, index) => (
                      <motion.div
                        key={`${entry.timestamp}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-gray-700/30 rounded-lg border-l-4 border-[#6366f1]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium text-sm">{entry.actionDisplay}</div>
                            <div className="text-xs text-gray-400">
                              {entry.from} → {entry.to}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Iteration {entry.iteration}</div>
                            <div className="text-xs text-gray-500">{entry.displayTime}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </Card>

            {/* Action Frequency Chart */}
            <Card title="Action Frequency Distribution">
              {actionFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={actionFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="action" 
                      stroke="#9ca3af"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-8 text-sm">
                  No action frequency data available
                </div>
              )}
            </Card>

            {/* Performance Metrics */}
            <Card title="Performance Metrics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Executions</span>
                    <span className="text-lg font-bold text-white">{executionData.history.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Unique Actions</span>
                    <span className="text-lg font-bold text-white">{executionData.actionFrequency.size}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Success Rate</span>
                    <span className="text-lg font-bold text-green-400">
                      {executionData.performanceMetrics.successRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Execution Time</span>
                    <span className="text-lg font-bold text-blue-400">
                      {executionData.performanceMetrics.avgExecutionTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Dimensional Overview Tab */}
        {activeTab === 'dimensional-overview' && (
          <motion.div
            key="dimensional-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DimensionalOverview
              automata={data.automata}
              progression={executionData.dimensionalProgression}
              currentDimension={executionData.dimensionalProgression[executionData.dimensionalProgression.length - 1]?.dimension}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelfReferenceAnalyzer;
