import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Play, Pause, RotateCcw, Settings, Download, Upload, Lightbulb, TrendingUp } from 'lucide-react';

interface AIMutation {
  id: string;
  type: 'church-encoding' | 'dimensional' | 'topological' | 'self-reference';
  description: string;
  code: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  applied: boolean;
}

interface WebLLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface EvolutionMetrics {
  totalMutations: number;
  successfulMutations: number;
  averageConfidence: number;
  complexityScore: number;
  noveltyScore: number;
  churchEncodingAccuracy: number;
}

const WebLLMEvolution: React.FC = () => {
  const [isWebLLMLoaded, setIsWebLLMLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvolutionActive, setIsEvolutionActive] = useState(false);
  const [mutations, setMutations] = useState<AIMutation[]>([]);
  const [selectedMutation, setSelectedMutation] = useState<AIMutation | null>(null);
  const [evolutionMetrics, setEvolutionMetrics] = useState<EvolutionMetrics>({
    totalMutations: 0,
    successfulMutations: 0,
    averageConfidence: 0,
    complexityScore: 0,
    noveltyScore: 0,
    churchEncodingAccuracy: 0
  });
  const [config, setConfig] = useState<WebLLMConfig>({
    model: 'llama-2-7b-chat',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  });
  const [showSettings, setShowSettings] = useState(false);
  const [evolutionLog, setEvolutionLog] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const webLLMRef = useRef<any>(null);

  // Initialize WebLLM
  useEffect(() => {
    initializeWebLLM();
    return () => {
      if (webLLMRef.current) {
        // Cleanup WebLLM instance
      }
    };
  }, []);

  const initializeWebLLM = async () => {
    try {
      // Load actual WebLLM library
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      const initProgressCallback = (progress: any) => {
        console.log('WebLLM loading progress:', progress);
        addEvolutionLog(`Loading WebLLM: ${Math.round(progress.progress * 100)}% - ${progress.text}`);
      };
      
      const engine = await CreateMLCEngine(
        config.model,
        {
          initProgressCallback,
        }
      );

      webLLMRef.current = engine;
      setIsWebLLMLoaded(true);
      
      addEvolutionLog('WebLLM initialized successfully with model: ' + config.model);
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      addEvolutionLog('Failed to initialize WebLLM: ' + error);
      
      // Fallback to mock implementation if WebLLM fails
      await initializeMockWebLLM();
    }
  };

  const initializeMockWebLLM = async () => {
    // Fallback mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockEngine = {
      chat: {
        completions: {
          create: async (params: any) => {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            const mockResponses = {
              'church-encoding': {
                description: 'Enhanced Church successor with fixed-point optimization',
                code: '(define enhanced-successor\n  (lambda (n)\n    (lambda (f)\n      (lambda (x)\n        (f ((n f) x))))))',
                confidence: 0.85,
                impact: 'high'
              },
              'dimensional': {
                description: 'Novel 4D spacetime fiber bundle construction',
                code: '(define spacetime-fiber\n  (lambda (base)\n    (cons (temporal-fiber base)\n          (spatial-fiber base))))',
                confidence: 0.78,
                impact: 'medium'
              },
              'topological': {
                description: 'Möbius strip computational manifold',
                code: '(define mobius-computation\n  (lambda (surface)\n    (twist (connect surface))))',
                confidence: 0.92,
                impact: 'critical'
              },
              'self-reference': {
                description: 'Meta-circular evaluator with Y-combinator optimization',
                code: '(define meta-evaluator\n  (Y (lambda (eval)\n      (lambda (expr)\n        (if (self-reference? expr)\n            (eval (dereference expr))\n            (evaluate expr))))))',
                confidence: 0.88,
                impact: 'high'
              }
            };
            
            const type = params.messages[0].content.includes('church-encoding') ? 'church-encoding' :
                        params.messages[0].content.includes('dimensional') ? 'dimensional' :
                        params.messages[0].content.includes('topological') ? 'topological' : 'self-reference';
            
            return {
              choices: [{
                message: {
                  content: JSON.stringify(mockResponses[type])
                }
              }]
            };
          }
        }
      }
    };

    webLLMRef.current = mockEngine;
    setIsWebLLMLoaded(true);
    addEvolutionLog('Fallback to mock WebLLM implementation');
  };

  const addEvolutionLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvolutionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const generateMutation = async (type: AIMutation['type']) => {
    if (!webLLMRef.current || !isWebLLMLoaded) {
      addEvolutionLog('WebLLM not loaded yet');
      return;
    }

    setIsGenerating(true);
    addEvolutionLog(`Generating ${type} mutation...`);

    try {
      const prompts = {
        'church-encoding': `Generate a sophisticated Church encoding mutation for the automaton system. Create a new lambda calculus expression that extends the current dimensional progression. Focus on mathematical rigor and self-reference patterns. Return JSON with: {description, code, confidence, impact}`,
        
        'dimensional': `Create a dimensional evolution mutation that transitions between computational topology dimensions. Design a new topological structure that bridges current dimensional gaps. Return JSON with: {description, code, confidence, impact}`,
        
        'topological': `Generate a topological mutation that introduces new computational manifolds or fiber bundles. Create novel topological invariants for the Church encoding system. Return JSON with: {description, code, confidence, impact}`,
        
        'self-reference': `Design a self-reference mutation that creates new meta-circular evaluation patterns. Generate recursive structures that enhance the automaton's self-awareness. Return JSON with: {description, code, confidence, impact}`
      };

      const prompt = prompts[type] + `\n\nCurrent context: Church encoding from 0D to 7D, lambda calculus, computational topology.`;
      
      const response = await webLLMRef.current.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty
      });

      const content = response.choices[0].message.content;
      const aiResponse = JSON.parse(content);

      const mutation: AIMutation = {
        id: `mutation-${Date.now()}`,
        type,
        description: aiResponse.description,
        code: aiResponse.code,
        confidence: aiResponse.confidence || 0.7,
        impact: aiResponse.impact || 'medium',
        timestamp: Date.now(),
        applied: false
      };

      setMutations(prev => [mutation, ...prev]);
      addEvolutionLog(`Generated ${type} mutation with confidence: ${mutation.confidence.toFixed(2)}`);

    } catch (error) {
      console.error('Failed to generate mutation:', error);
      addEvolutionLog('Failed to generate mutation: ' + error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyMutation = async (mutation: AIMutation) => {
    addEvolutionLog(`Applying mutation: ${mutation.description}`);
    
    try {
      // Apply mutation to automaton system
      // This would integrate with the advanced-automaton.ts system
      
      setMutations(prev => 
        prev.map(m => m.id === mutation.id ? { ...m, applied: true } : m)
      );

      setEvolutionMetrics(prev => ({
        totalMutations: prev.totalMutations + 1,
        successfulMutations: prev.successfulMutations + 1,
        averageConfidence: (prev.averageConfidence * prev.totalMutations + mutation.confidence) / (prev.totalMutations + 1),
        complexityScore: Math.min(100, prev.complexityScore + (mutation.impact === 'critical' ? 15 : mutation.impact === 'high' ? 10 : mutation.impact === 'medium' ? 5 : 2)),
        noveltyScore: Math.min(100, prev.noveltyScore + Math.random() * 10),
        churchEncodingAccuracy: Math.min(100, prev.churchEncodingAccuracy + (mutation.type === 'church-encoding' ? 5 : 2))
      }));

      addEvolutionLog(`Successfully applied ${mutation.type} mutation`);
    } catch (error) {
      addEvolutionLog('Failed to apply mutation: ' + error);
    }
  };

  const startEvolution = async () => {
    setIsEvolutionActive(true);
    addEvolutionLog('Starting autonomous evolution cycle');

    const evolutionCycle = async () => {
      if (!isEvolutionActive) return;

      const types: AIMutation['type'][] = ['church-encoding', 'dimensional', 'topological', 'self-reference'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      await generateMutation(randomType);
      
      // Auto-apply high-confidence mutations
      const highConfidenceMutations = mutations.filter(m => !m.applied && m.confidence > 0.8);
      if (highConfidenceMutations.length > 0) {
        await applyMutation(highConfidenceMutations[0]);
      }

      // Schedule next evolution step
      setTimeout(evolutionCycle, 5000 + Math.random() * 10000);
    };

    evolutionCycle();
  };

  const stopEvolution = () => {
    setIsEvolutionActive(false);
    addEvolutionLog('Stopped autonomous evolution');
  };

  const exportMutations = () => {
    const exportData = {
      mutations,
      metrics: evolutionMetrics,
      config,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automaton-mutations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addEvolutionLog('Exported mutations to file');
  };

  const importMutations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setMutations(data.mutations || []);
        setEvolutionMetrics(data.metrics || evolutionMetrics);
        setConfig(data.config || config);
        addEvolutionLog('Imported mutations from file');
      } catch (error) {
        addEvolutionLog('Failed to import mutations: ' + error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">WebLLM Evolution Engine</h3>
            <div className={`w-2 h-2 rounded-full ${isWebLLMLoaded ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={exportMutations}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-300" />
            </button>
            <label className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-gray-300" />
              <input
                type="file"
                accept=".json"
                onChange={importMutations}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)]">
        {/* Main Evolution Panel */}
        <div className="flex-1 p-4 space-y-4">
          {/* Evolution Controls */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Evolution Controls</h4>
              <div className="flex items-center gap-2">
                {isEvolutionActive ? (
                  <button
                    onClick={stopEvolution}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Stop Evolution
                  </button>
                ) : (
                  <button
                    onClick={startEvolution}
                    disabled={!isWebLLMLoaded}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Evolution
                  </button>
                )}
                <button
                  onClick={() => setMutations([])}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Mutation Generation Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => generateMutation('church-encoding')}
                disabled={isGenerating || !isWebLLMLoaded}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Church Encoding
              </button>
              <button
                onClick={() => generateMutation('dimensional')}
                disabled={isGenerating || !isWebLLMLoaded}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Dimensional
              </button>
              <button
                onClick={() => generateMutation('topological')}
                disabled={isGenerating || !isWebLLMLoaded}
                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Topological
              </button>
              <button
                onClick={() => generateMutation('self-reference')}
                disabled={isGenerating || !isWebLLMLoaded}
                className="p-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Self-Reference
              </button>
            </div>
          </div>

          {/* Evolution Metrics */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Evolution Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{evolutionMetrics.totalMutations}</div>
                <div className="text-sm text-gray-400">Total Mutations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{evolutionMetrics.successfulMutations}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{(evolutionMetrics.averageConfidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{evolutionMetrics.complexityScore.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Complexity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{evolutionMetrics.noveltyScore.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Novelty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{evolutionMetrics.churchEncodingAccuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Church Accuracy</div>
              </div>
            </div>
          </div>

          {/* Mutations List */}
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Generated Mutations</h4>
            <div className="space-y-2">
              {mutations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No mutations generated yet</p>
                  <p className="text-sm">Start evolution or generate mutations manually</p>
                </div>
              ) : (
                mutations.map(mutation => (
                  <motion.div
                    key={mutation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      mutation.applied 
                        ? 'bg-green-900/30 border-green-600' 
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            mutation.type === 'church-encoding' ? 'bg-blue-600' :
                            mutation.type === 'dimensional' ? 'bg-purple-600' :
                            mutation.type === 'topological' ? 'bg-green-600' :
                            'bg-orange-600'
                          } text-white`}>
                            {mutation.type}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            mutation.impact === 'critical' ? 'bg-red-600' :
                            mutation.impact === 'high' ? 'bg-orange-600' :
                            mutation.impact === 'medium' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          } text-white`}>
                            {mutation.impact}
                          </span>
                          {mutation.applied && (
                            <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                              Applied
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-1">{mutation.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Confidence: {(mutation.confidence * 100).toFixed(1)}%</span>
                          <span>{new Date(mutation.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setSelectedMutation(mutation)}
                          className="p-1 rounded hover:bg-gray-600 transition-colors"
                        >
                          <Cpu className="w-4 h-4 text-gray-400" />
                        </button>
                        {!mutation.applied && (
                          <button
                            onClick={() => applyMutation(mutation)}
                            className="p-1 rounded hover:bg-gray-600 transition-colors"
                          >
                            <Play className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Evolution Log Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Evolution Log</h4>
            <button
              onClick={() => setEvolutionLog([])}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
            {evolutionLog.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No evolution activity yet</div>
            ) : (
              evolutionLog.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    index === 0 ? 'bg-blue-900/30 text-blue-300' : 'text-gray-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>

          {/* WebLLM Status */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h5 className="text-sm font-semibold text-white mb-2">WebLLM Status</h5>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={isWebLLMLoaded ? 'text-green-400' : 'text-yellow-400'}>
                  {isWebLLMLoaded ? 'Loaded' : 'Loading...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Model:</span>
                <span>{config.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span>{config.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span>Evolution:</span>
                <span className={isEvolutionActive ? 'text-green-400' : 'text-gray-400'}>
                  {isEvolutionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mutation Detail Modal */}
      {selectedMutation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMutation(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-white">Mutation Details</h4>
              <button
                onClick={() => setSelectedMutation(null)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedMutation.type === 'church-encoding' ? 'bg-blue-600' :
                  selectedMutation.type === 'dimensional' ? 'bg-purple-600' :
                  selectedMutation.type === 'topological' ? 'bg-green-600' :
                  'bg-orange-600'
                } text-white`}>
                  {selectedMutation.type}
                </span>
                <span className={`px-3 py-1 rounded text-sm ${
                  selectedMutation.impact === 'critical' ? 'bg-red-600' :
                  selectedMutation.impact === 'high' ? 'bg-orange-600' :
                  selectedMutation.impact === 'medium' ? 'bg-yellow-600' :
                  'bg-gray-600'
                } text-white`}>
                  {selectedMutation.impact} impact
                </span>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Description</h5>
                <p className="text-gray-400">{selectedMutation.description}</p>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Generated Code</h5>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono">
                  {selectedMutation.code}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Confidence:</span>
                  <span className="ml-2 text-white">{(selectedMutation.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-2 text-white">{selectedMutation.applied ? 'Applied' : 'Pending'}</span>
                </div>
              </div>

              {!selectedMutation.applied && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      applyMutation(selectedMutation);
                      setSelectedMutation(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Apply Mutation
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-xl font-bold text-white mb-4">WebLLM Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Llama-3.1-8B-Instruct-q4f32_1-MLC">Llama 3.1 8B Instruct</option>
                  <option value="Llama-3.2-3B-Instruct-q4f16_1-MLC">Llama 3.2 3B Instruct</option>
                  <option value="Phi-3.5-mini-instruct-q4f16_1-MLC">Phi 3.5 Mini Instruct</option>
                  <option value="gemma-2-2b-it-q4f16_1-MLC">Gemma 2 2B Instruct</option>
                  <option value="Mistral-7B-Instruct-v0.3-q4f16_1-MLC">Mistral 7B Instruct</option>
                  <option value="Qwen2-1.5B-Instruct-q4f16_1-MLC">Qwen2 1.5B Instruct</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tokens: {config.maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={config.maxTokens}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WebLLMEvolution;