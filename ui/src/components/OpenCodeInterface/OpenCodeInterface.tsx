import React, { useState, useEffect, useRef } from 'react';
import { Code, Search, Play, Settings, Loader2, CheckCircle, AlertCircle, X, Bot, Cpu, Database, MessageSquare, Sliders, Zap } from 'lucide-react';
import { opencodeApi } from '../../services/api';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

interface AnalysisResult {
  patterns: string[];
  suggestions: string[];
  codeQuality: number;
  complexity: number;
  recommendations: string[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  capabilities: string[];
  category: 'analysis' | 'advisory' | 'expert';
  status: 'active' | 'idle' | 'busy';
}

interface AgentTask {
  id: string;
  agent: string;
  task: string;
  response: string;
  timestamp: number;
  model?: string;
  fallback?: boolean;
  duration?: number;
  confidence?: number;
}

interface OpenCodeConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  autoAnalyze: boolean;
  showLineNumbers: boolean;
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
}

interface AgentConversation {
  id: string;
  agentId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  lastActivity: number;
}

const OpenCodeInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [code, setCode] = useState(`// Welcome to OpenCode Editor with AI Agents
// Start typing your code here...

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentTask, setAgentTask] = useState<string>('');
  const [agentResponses, setAgentResponses] = useState<AgentTask[]>([]);
  const [isExecutingAgent, setIsExecutingAgent] = useState(false);
  const [isGeneratingMetaverse, setIsGeneratingMetaverse] = useState(false);
  const [metaverseResult, setMetaverseResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'agents' | 'config'>('analysis');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [config, setConfig] = useState<OpenCodeConfig>({
    model: 'llama2',
    temperature: 0.7,
    maxTokens: 2048,
    autoAnalyze: true,
    showLineNumbers: true,
    theme: 'dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: true
  });
  const [currentModel, setCurrentModel] = useState('llama2');
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    checkStatus();
    loadAgents();
    loadModels();
  }, []);

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const startState = EditorState.create({
        doc: code,
        extensions: [
          javascript(),
          oneDark,
          keymap.of(defaultKeymap),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setCode(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '14px'
            },
            '.cm-scroller': {
              overflow: 'auto'
            },
            '.cm-content': {
              padding: '12px'
            }
          })
        ]
      });

      viewRef.current = new EditorView({
        state: startState,
        parent: editorRef.current
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  const checkStatus = async () => {
    try {
      const response = await opencodeApi.getStatus();
      setIsConnected(response.data.connected);
      setAvailableAgents(response.data.availableAgents || []);
      setAvailableModels(response.data.availableModels || []);
    } catch (error) {
      console.error('Failed to check status:', error);
      setIsConnected(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await opencodeApi.getAgents();
      const baseAgents = response.data as any[] || [];
      
      // Enhanced agents with icons and capabilities
      const enhancedAgents: Agent[] = baseAgents.map((agent, index) => ({
        id: `agent-${index}`,
        name: agent.name,
        description: agent.description,
        endpoint: agent.endpoint,
        icon: getAgentIcon(agent.name),
        capabilities: getAgentCapabilities(agent.name),
        category: getAgentCategory(agent.name),
        status: 'idle' as const
      }));
      
      setAvailableAgents(enhancedAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      // Fallback agents
      setAvailableAgents([
        {
          id: 'code-analyzer',
          name: 'Code Analyzer',
          description: 'Analyzes code quality and patterns',
          endpoint: '/agent/code-analyzer',
          icon: <Code className="w-4 h-4" />,
          capabilities: ['Code Analysis', 'Pattern Detection', 'Quality Metrics'],
          category: 'analysis',
          status: 'idle'
        },
        {
          id: 'automaton-advisor',
          name: 'Automaton Advisor',
          description: 'Provides dimensional progression advice',
          endpoint: '/agent/automaton-advisor',
          icon: <Cpu className="w-4 h-4" />,
          capabilities: ['Dimensional Analysis', 'Progression Planning', 'Topology Optimization'],
          category: 'advisory',
          status: 'idle'
        },
        {
          id: 'church-encoding-expert',
          name: 'Church Encoding Expert',
          description: 'Specializes in lambda calculus patterns',
          endpoint: '/agent/church-encoding',
          icon: <Database className="w-4 h-4" />,
          capabilities: ['Lambda Calculus', 'Church Encoding', 'Functional Patterns'],
          category: 'expert',
          status: 'idle'
        }
      ]);
    }
  };

  const loadModels = async () => {
    try {
      const response = await opencodeApi.getModels();
      setAvailableModels(response.data as string[] || []);
    } catch (error) {
      console.error('Failed to load models:', error);
      setAvailableModels(['llama2', 'codellama', 'mistral', 'vicuna']);
    }
  };

  const getAgentIcon = (name: string): React.ReactNode => {
    if (name.includes('Code')) return <Code className="w-4 h-4" />;
    if (name.includes('Automaton')) return <Cpu className="w-4 h-4" />;
    if (name.includes('Church')) return <Database className="w-4 h-4" />;
    return <Bot className="w-4 h-4" />;
  };

  const getAgentCapabilities = (name: string): string[] => {
    if (name.includes('Code')) return ['Code Analysis', 'Pattern Detection', 'Quality Metrics'];
    if (name.includes('Automaton')) return ['Dimensional Analysis', 'Progression Planning', 'Topology Optimization'];
    if (name.includes('Church')) return ['Lambda Calculus', 'Church Encoding', 'Functional Patterns'];
    return ['General Analysis', 'Pattern Recognition'];
  };

  const getAgentCategory = (name: string): 'analysis' | 'advisory' | 'expert' => {
    if (name.includes('Code')) return 'analysis';
    if (name.includes('Automaton')) return 'advisory';
    if (name.includes('Church')) return 'expert';
    return 'analysis';
  };

  const analyzeCode = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await opencodeApi.analyzeCode(code);
      setAnalysis(response.data as AnalysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runCode = () => {
    console.log('Running code:', code);
  };

  const executeAgentTask = async () => {
    if (!selectedAgent || !agentTask.trim()) return;
    
    setIsExecutingAgent(true);
    const startTime = Date.now();
    
    try {
      const response = await opencodeApi.executeAgent(selectedAgent.name, agentTask);
      const responseData = response.data as any;
      const duration = Date.now() - startTime;
      
      const agentResponse: AgentTask = {
        id: `task-${Date.now()}`,
        agent: selectedAgent.name,
        task: agentTask,
        response: responseData.response || 'No response',
        timestamp: responseData.timestamp || Date.now(),
        model: responseData.model,
        fallback: responseData.fallback,
        duration,
        confidence: responseData.fallback ? 0.5 : 0.8
      };
      
      setAgentResponses(prev => [agentResponse, ...prev.slice(0, 9)]); // Keep last 10 responses
      
      // Update agent status
      setAvailableAgents(prev => prev.map(agent => 
        agent.id === selectedAgent.id 
          ? { ...agent, status: 'idle' as const }
          : agent
      ));
      
      // Add to conversation if exists
      if (activeConversation) {
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation 
            ? {
                ...conv,
                messages: [...conv.messages, {
                  id: `msg-${Date.now()}`,
                  role: 'agent' as const,
                  content: responseData.response || 'No response',
                  timestamp: Date.now()
                }],
                lastActivity: Date.now()
              }
            : conv
        ));
      }
      
    } catch (error) {
      console.error('Agent execution failed:', error);
    } finally {
      setIsExecutingAgent(false);
    }
  };

  const switchModel = async (model: string) => {
    try {
      await opencodeApi.setModel(model);
      setConfig(prev => ({ ...prev, model }));
      setCurrentModel(model);
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  };

  const generateMetaverse = async (outputPath?: string) => {
    setIsGeneratingMetaverse(true);
    setMetaverseResult(null);
    
    try {
      const response = await opencodeApi.generateMetaverse(outputPath);
      const result = response.data as any;
      
      if (result.success) {
        setMetaverseResult(`Successfully generated ${result.outputPath || './generate.metaverse.jsonl'} (${result.lines || 0} lines)`);
      } else {
        setMetaverseResult(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMetaverseResult(`Error: ${error.message || 'Failed to generate metaverse'}`);
    } finally {
      setIsGeneratingMetaverse(false);
    }
  };

  const updateConfig = (newConfig: Partial<OpenCodeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // Apply editor settings
    if (viewRef.current && newConfig.fontSize) {
      // Note: Theme changes require editor re-initialization in CodeMirror 6
      // For now, we'll just update the config state
    }
  };

  const startConversation = (agent: Agent) => {
    const conversationId = `conv-${Date.now()}`;
    const newConversation: AgentConversation = {
      id: conversationId,
      agentId: agent.id,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(conversationId);
    setSelectedAgent(agent);
    setShowAgentModal(true);
  };

  const sendMessage = (message: string) => {
    if (!activeConversation || !selectedAgent) return;
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: Date.now()
    };
    
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { ...conv, messages: [...conv.messages, userMessage], lastActivity: Date.now() }
        : conv
    ));
    
    setAgentTask(message);
    executeAgentTask();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Code className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">OpenCode Editor</h2>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {isConnected ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>Disconnected</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing || !code.trim()}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Analyze</span>
          </button>
          
          <button
            onClick={runCode}
            className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm text-gray-400">JavaScript Editor</span>
            <span className="text-xs text-gray-500">CodeMirror 6</span>
          </div>
          <div className="flex-1 overflow-hidden" ref={editorRef} />
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analysis' 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'agents' 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              AI Agents
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'config' 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Analysis Panel */}
          {activeTab === 'analysis' && analysis && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Analysis Results</h3>
              
              {/* Code Quality */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Code Quality</span>
                  <span className="text-sm text-gray-400">{analysis.codeQuality}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      analysis.codeQuality >= 80 ? 'bg-green-500' :
                      analysis.codeQuality >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.codeQuality}%` }}
                  />
                </div>
              </div>

              {/* Complexity */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Complexity</span>
                  <span className="text-sm text-gray-400">{analysis.complexity}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      analysis.complexity <= 3 ? 'bg-green-500' :
                      analysis.complexity <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(analysis.complexity * 10, 100)}%` }}
                  />
                </div>
              </div>

              {/* Patterns */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2 text-green-400">Detected Patterns</h4>
                <ul className="space-y-1">
                  {analysis.patterns.map((pattern, index) => (
                    <li key={index} className="text-xs text-gray-300 flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2 text-yellow-400">Suggestions</h4>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-300 flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-400">Recommendations</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-xs text-gray-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Agents Panel */}
          {activeTab === 'agents' && (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Quick Actions */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAgentModal(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Agent Chat</span>
                  </button>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              {/* Agent Grid */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 text-purple-400">Available Agents</h4>
                <div className="grid grid-cols-1 gap-3">
                  {availableAgents.map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => startConversation(agent)}
                      className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                        selectedAgent?.id === agent.id
                          ? 'bg-blue-600 border border-blue-500 shadow-lg'
                          : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          agent.category === 'analysis' ? 'bg-green-900' :
                          agent.category === 'advisory' ? 'bg-blue-900' : 'bg-purple-900'
                        }`}>
                          {agent.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white flex items-center">
                            {agent.name}
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              agent.status === 'active' ? 'bg-green-600' :
                              agent.status === 'busy' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300 mt-1">{agent.description}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agent.capabilities.slice(0, 2).map((cap, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-600 rounded-full">
                                {cap}
                              </span>
                            ))}
                            {agent.capabilities.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-600 rounded-full">
                                +{agent.capabilities.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {agentResponses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-cyan-400">Recent Activity</h4>
                  <div className="space-y-2">
                    {agentResponses.slice(0, 5).map((response) => (
                      <div key={response.id} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-300">{response.agent}</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            {response.duration && <span>{response.duration}ms</span>}
                            {response.confidence && <span>{Math.round(response.confidence * 100)}%</span>}
                            <span>{new Date(response.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-300 mb-1 truncate">{response.task}</div>
                        <div className="text-sm text-white bg-gray-800 p-2 rounded border border-gray-600 max-h-20 overflow-y-auto">
                          {response.response}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">OpenCode Configuration</h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* AI Model Settings */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-blue-400" />
                  AI Model Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                    <select
                      value={config.model}
                      onChange={(e) => updateConfig({ model: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">{config.temperature}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Auto Analyze</label>
                    <button
                      onClick={() => updateConfig({ autoAnalyze: !config.autoAnalyze })}
                      className={`w-full px-3 py-2 rounded-lg transition-colors ${
                        config.autoAnalyze 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {config.autoAnalyze ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor Settings */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-green-400" />
                  Editor Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={config.fontSize}
                      onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tab Size</label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={config.tabSize}
                      onChange={(e) => updateConfig({ tabSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Show Line Numbers</label>
                    <button
                      onClick={() => updateConfig({ showLineNumbers: !config.showLineNumbers })}
                      className={`w-full px-3 py-2 rounded-lg transition-colors ${
                        config.showLineNumbers 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {config.showLineNumbers ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Word Wrap</label>
                    <button
                      onClick={() => updateConfig({ wordWrap: !config.wordWrap })}
                      className={`w-full px-3 py-2 rounded-lg transition-colors ${
                        config.wordWrap 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {config.wordWrap ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Connection Status
                </h3>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">OpenCode Service</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isConnected ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-300">Active Model</span>
                    <span className="text-sm text-white">{config.model}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-300">Available Agents</span>
                    <span className="text-sm text-white">{availableAgents.length}</span>
                  </div>
                </div>
              </div>

              {/* System Operations */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-purple-400" />
                  System Operations
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => generateMetaverse()}
                    disabled={isGeneratingMetaverse}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      isGeneratingMetaverse
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isGeneratingMetaverse ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-5 h-5" />
                        <span>Generate Metaverse JSONL</span>
                      </>
                    )}
                  </button>
                  {metaverseResult && (
                    <div className={`p-3 rounded-lg text-sm ${
                      metaverseResult.startsWith('Successfully')
                        ? 'bg-green-900/30 text-green-400 border border-green-700'
                        : 'bg-red-900/30 text-red-400 border border-red-700'
                    }`}>
                      {metaverseResult}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Chat Modal */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedAgent.category === 'analysis' ? 'bg-green-900' :
                  selectedAgent.category === 'advisory' ? 'bg-blue-900' : 'bg-purple-900'
                }`}>
                  {selectedAgent.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedAgent.name}</h2>
                  <p className="text-sm text-gray-400">{selectedAgent.description}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAgentModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Conversation Messages */}
              <div className="space-y-4 mb-4">
                {conversations
                  .find(conv => conv.id === activeConversation)
                  ?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with {selectedAgent.name}</p>
                      <p className="text-sm mt-2">{selectedAgent.description}</p>
                    </div>
                  )}
              </div>

              {/* Task Input */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex space-x-2">
                  <textarea
                    value={agentTask}
                    onChange={(e) => setAgentTask(e.target.value)}
                    placeholder={`Ask ${selectedAgent.name} something...`}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => sendMessage(agentTask)}
                    disabled={!agentTask.trim() || isExecutingAgent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    aria-label={isExecutingAgent ? "Sending message" : "Send message"}
                  >
                    {isExecutingAgent ? (
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenCodeInterface;