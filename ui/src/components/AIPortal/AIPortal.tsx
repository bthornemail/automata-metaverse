import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, MessageSquare, Send, Bot, User, Zap, Play, Pause, RotateCcw, 
  Settings, Download, Upload, Lightbulb, TrendingUp, Cpu, Code, Sparkles, X,
  Sliders, FileText, BarChart3, Network, Cpu as CpuIcon, Maximize2, Minimize2
} from 'lucide-react';
import { AgentChat } from '@/types';
import { apiService } from '@/services/api';
import { useAutomatonState } from '@/hooks/useAutomatonState';
import { Modal } from '@/components/shared/Modal';
import { Card } from '@/components/shared/Card';
import { nlpService } from '@/services/nlp-service';
import { tinyMLService } from '@/services/tinyml-service';
import WebGLMetaverseEvolution from '@/components/AdvancedAnimations/WebGLMetaverseEvolution';

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

interface BridgeStatus {
  nlp: boolean;
  metaverse: boolean;
  webllm: boolean;
  tinyml: boolean;
}

const AIPortal: React.FC = () => {
  // Automaton Metaverse State
  const { state: automatonState, actions: automatonActions } = useAutomatonState();
  
  // Agent Interface State
  const [chat, setChat] = useState<AgentChat>({
    messages: [],
    availableAgents: [
      'automaton-interface',
      'automaton-control',
      'automaton-analyzer',
      'dimensional-guide',
      'church-encoding-expert',
      'automaton-visualizer'
    ],
    activeAgent: 'automaton-interface',
    suggestions: [
      'Start the automaton with 2 second intervals',
      'Analyze the self-modification patterns',
      'Show me the current dimensional state',
      'Explain 6D intelligence systems',
      'Create a visualization of the topology'
    ]
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebLLM Evolution State
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
  const [evolutionLog, setEvolutionLog] = useState<string[]>([]);
  const webLLMRef = useRef<any>(null);

  // Bridge Status
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({
    nlp: false,
    metaverse: false,
    webllm: false,
    tinyml: false
  });

  // TinyML State
  const [tinyMLModels, setTinyMLModels] = useState<any[]>([]);
  const [patternPrediction, setPatternPrediction] = useState<any>(null);

  // Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showAgentSelectModal, setShowAgentSelectModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  
  // Chat Panel State
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Initialize all bridges
  useEffect(() => {
    initializeBridges();
    loadAvailableAgents();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // Update bridge status when automaton state changes
  useEffect(() => {
    setBridgeStatus(prev => ({
      ...prev,
      metaverse: automatonState.isRunning || automatonState.currentDimension > 0
    }));
  }, [automatonState]);

  const initializeBridges = async () => {
    // Initialize NLP Service
    setBridgeStatus(prev => ({ ...prev, nlp: true }));
    
    // Initialize TinyML Service
    try {
      await tinyMLService.initialize();
      setTinyMLModels(tinyMLService.getModels());
      setBridgeStatus(prev => ({ ...prev, tinyml: true }));
    } catch (error) {
      console.error('Failed to initialize TinyML:', error);
    }

    // Initialize WebLLM
    await initializeWebLLM();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableAgents = async () => {
    try {
      const response = await apiService.getAvailableAgents();
      if (response.success && response.data) {
        setChat(prev => ({ ...prev, availableAgents: response.data }));
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const initializeWebLLM = async () => {
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      const initProgressCallback = (progress: any) => {
        addEvolutionLog(`Loading WebLLM: ${Math.round(progress.progress * 100)}%`);
      };
      
      const engine = await CreateMLCEngine(config.model, { initProgressCallback });
      webLLMRef.current = engine;
      setIsWebLLMLoaded(true);
      setBridgeStatus(prev => ({ ...prev, webllm: true }));
      addEvolutionLog('WebLLM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      await initializeMockWebLLM();
    }
  };

  const initializeMockWebLLM = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    webLLMRef.current = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{
              message: { content: JSON.stringify({ description: 'Mock mutation', code: '', confidence: 0.7, impact: 'medium' }) }
            }]
          })
        }
      }
    };
    setIsWebLLMLoaded(true);
    setBridgeStatus(prev => ({ ...prev, webllm: true }));
    addEvolutionLog('Using mock WebLLM implementation');
  };

  const addEvolutionLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvolutionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Enhanced sendMessage with NLP processing and bridge integration
  const sendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: Date.now()
    };

    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputMessage('');
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      // Step 1: NLP Processing
      const nlpAnalysis = await nlpService.parseInput(message);
      addEvolutionLog(`NLP Analysis: ${nlpAnalysis.intent} (${(nlpAnalysis.confidence * 100).toFixed(0)}% confidence)`);

      // Step 2: TinyML Pattern Recognition & Prediction
      const tinyMLPrediction = tinyMLService.predictNextDimension(
        automatonState.currentDimension,
        [] // Would use actual history in production
      );
      addEvolutionLog(`TinyML Prediction: Next dimension ${tinyMLPrediction.nextDimension}D (${(tinyMLPrediction.confidence * 100).toFixed(0)}% confidence)`);
      setPatternPrediction(tinyMLPrediction);

      // Step 3: Execute automaton command if detected
      if (nlpAnalysis.automatonCommand) {
        if (nlpAnalysis.intent === 'start') {
          await automatonActions.startAutomaton(nlpAnalysis.parameters);
          addEvolutionLog(`Automaton Metaverse: Started with parameters ${JSON.stringify(nlpAnalysis.parameters)}`);
        } else if (nlpAnalysis.intent === 'stop') {
          await automatonActions.stopAutomaton();
          addEvolutionLog(`Automaton Metaverse: Stopped`);
        } else if (nlpAnalysis.intent === 'evolve' && nlpAnalysis.dimension !== undefined) {
          await automatonActions.setDimension(nlpAnalysis.dimension);
          addEvolutionLog(`Automaton Metaverse: Evolved to ${nlpAnalysis.dimension}D`);
        }
      }

      // Step 4: Generate WebLLM response with context
      const contextPrompt = `
Context:
- Current Dimension: ${automatonState.currentDimension}D
- Automaton Status: ${automatonState.isRunning ? 'Running' : 'Idle'}
- NLP Intent: ${nlpAnalysis.intent}
- TinyML Prediction: ${tinyMLPrediction.nextDimension}D (${(tinyMLPrediction.confidence * 100).toFixed(0)}% confidence)

User Message: ${message}

Generate a helpful response that bridges human NLP understanding, automaton metaverse state, and AI evolution capabilities.
`;

      let agentResponse: string;
      
      if (isWebLLMLoaded && webLLMRef.current) {
        try {
          const webllmResponse = await webLLMRef.current.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an AI assistant bridging human communication, automaton metaverse, and AI evolution.' },
              { role: 'user', content: contextPrompt }
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens
          });
          agentResponse = webllmResponse.choices[0].message.content;
          addEvolutionLog(`WebLLM: Generated response`);
        } catch (error) {
          // Fallback to API agent
          const response = await apiService.sendAgentMessage(chat.activeAgent, message);
          agentResponse = response.success && response.data 
            ? response.data 
            : `I understand you want to ${nlpAnalysis.intent}. ${nlpService.formatStateToNL(automatonState)}`;
        }
      } else {
        // Fallback to API agent
        const response = await apiService.sendAgentMessage(chat.activeAgent, message);
        agentResponse = response.success && response.data 
          ? response.data 
          : `I understand you want to ${nlpAnalysis.intent}. ${nlpService.formatStateToNL(automatonState)}`;
      }

      const agentMessage = {
        role: 'agent' as const,
        content: agentResponse,
        timestamp: Date.now()
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, agentMessage]
      }));

    } catch (error) {
      const errorMessage = {
        role: 'agent' as const,
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
  };

  const getAgentDescription = (agent: string): string => {
    const descriptions: Record<string, string> = {
      'automaton-interface': 'Main coordinator for all automaton operations',
      'automaton-control': 'Direct control and execution commands',
      'automaton-analyzer': 'Pattern analysis and behavioral insights',
      'dimensional-guide': '0D-7D dimensional progression expertise',
      'church-encoding-expert': 'Lambda calculus and Church encoding explanations',
      'automaton-visualizer': 'Visual representations and diagrams'
    };
    return descriptions[agent] || 'Specialized automaton agent';
  };

  // WebLLM Evolution Functions
  const generateMutation = async (type: AIMutation['type']) => {
    if (!webLLMRef.current || !isWebLLMLoaded) {
      addEvolutionLog('WebLLM not loaded yet');
      return;
    }

    setIsGenerating(true);
    addEvolutionLog(`Generating ${type} mutation...`);

    try {
      const prompts = {
        'church-encoding': `Generate a sophisticated Church encoding mutation for the automaton system. Current dimension: ${automatonState.currentDimension}D. Return JSON: {description, code, confidence, impact}`,
        'dimensional': `Create a dimensional evolution mutation. Current dimension: ${automatonState.currentDimension}D. Return JSON: {description, code, confidence, impact}`,
        'topological': `Generate a topological mutation. Current dimension: ${automatonState.currentDimension}D. Return JSON: {description, code, confidence, impact}`,
        'self-reference': `Design a self-reference mutation. Current dimension: ${automatonState.currentDimension}D. Return JSON: {description, code, confidence, impact}`
      };

      const response = await webLLMRef.current.chat.completions.create({
        messages: [{ role: 'user', content: prompts[type] }],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      });

      const aiResponse = JSON.parse(response.choices[0].message.content);

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
      addEvolutionLog(`Generated ${type} mutation`);
    } catch (error) {
      console.error('Failed to generate mutation:', error);
      addEvolutionLog('Failed to generate mutation');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyMutation = async (mutation: AIMutation) => {
    addEvolutionLog(`Applying mutation: ${mutation.description}`);
    
    setMutations(prev => 
      prev.map(m => m.id === mutation.id ? { ...m, applied: true } : m)
    );

    setEvolutionMetrics(prev => ({
      totalMutations: prev.totalMutations + 1,
      successfulMutations: prev.successfulMutations + 1,
      averageConfidence: (prev.averageConfidence * prev.totalMutations + mutation.confidence) / (prev.totalMutations + 1),
      complexityScore: Math.min(100, prev.complexityScore + 10),
      noveltyScore: Math.min(100, prev.noveltyScore + Math.random() * 10),
      churchEncodingAccuracy: Math.min(100, prev.churchEncodingAccuracy + 5)
    }));

    addEvolutionLog(`Successfully applied ${mutation.type} mutation`);
    setShowMutationModal(false);
  };

  const startEvolution = async () => {
    setIsEvolutionActive(true);
    addEvolutionLog('Starting autonomous evolution cycle');
  };

  const stopEvolution = () => {
    setIsEvolutionActive(false);
    addEvolutionLog('Stopped autonomous evolution');
  };

  return (
    <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Portal</h2>
              <p className="text-xs text-gray-400">3D Metaverse Portal - Bridging Human NLP ↔ Automaton Metaverse ↔ WebLLM ↔ TinyML</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Changes / Chat Toggle */}
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title={showChatPanel ? "Hide Chat" : "View Chat"}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{showChatPanel ? 'Hide Chat' : 'View Chat'}</span>
            </button>
            
            {/* Bridge Status Indicators */}
            <button
              onClick={() => setShowBridgeModal(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Bridge Status"
            >
              <Network className="w-4 h-4 text-gray-300" />
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`} title="NLP"></div>
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`} title="Metaverse"></div>
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`} title="WebLLM"></div>
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`} title="TinyML"></div>
              </div>
            </button>
            
            <div className={`px-2 py-1 rounded text-xs ${
              isWebLLMLoaded ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'
            }`}>
              {isWebLLMLoaded ? 'WebLLM Ready' : 'Loading...'}
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: 3D Metaverse Portal with Chat Overlay */}
      <div className="flex-1 overflow-hidden relative">
        {/* 3D Metaverse Portal - Main Interface */}
        <div className="w-full h-full">
          <WebGLMetaverseEvolution />
        </div>

        {/* Chat Panel Overlay - Toggleable */}
        <AnimatePresence>
          {showChatPanel && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-full md:w-96 h-full bg-gray-900/95 backdrop-blur-lg border-l border-gray-700 shadow-2xl z-50 flex flex-col"
            >
              {/* Chat Panel Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Agent Communication</h3>
                </div>
                <button
                  onClick={() => setShowChatPanel(false)}
                  className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Close Chat"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden flex flex-col p-4">
                {/* Agent Selector */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAgentSelectModal(true)}
                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium text-sm">{chat.activeAgent.replace('-', ' ')}</div>
                        <div className="text-xs text-gray-400">{getAgentDescription(chat.activeAgent)}</div>
                      </div>
                      <Bot className="w-5 h-5 text-[#6366f1]" />
                    </div>
                  </button>
                </div>

                {/* Metaverse State Display */}
                <div className="mb-4 p-2 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Metaverse State</div>
                  <div className="text-sm text-white">
                    {automatonState.currentDimension}D - {automatonState.isRunning ? 'Running' : 'Idle'}
                  </div>
                  {patternPrediction && (
                    <div className="text-xs text-green-400 mt-1">
                      TinyML: Next → {patternPrediction.nextDimension}D ({(patternPrediction.confidence * 100).toFixed(0)}%)
                    </div>
                  )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto min-h-0 border border-gray-700">
                  {chat.messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <div className="text-sm">Start a conversation with {chat.activeAgent.replace('-', ' ')}</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chat.messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'agent' && (
                            <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                          
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-100'
                          }`}>
                            {message.content}
                          </div>
                          
                          {message.role === 'user' && (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-700 rounded-lg p-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {showSuggestions && chat.messages.length === 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                      <Lightbulb className="w-4 h-4" />
                      Suggested questions:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {chat.suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-xs text-gray-300 transition-colors border border-gray-700"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputMessage)}
                    placeholder={`Message ${chat.activeAgent.replace('-', ' ')}...`}
                    disabled={isTyping}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#6366f1] disabled:opacity-50"
                  />
                  
                  <button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4 py-2 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evolution Controls - Floating Panel */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-lg rounded-lg p-4 border border-gray-700 shadow-xl z-40 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">AI Evolution Engine</h4>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-1 rounded hover:bg-gray-800 transition-colors"
              title="Configuration"
            >
              <Sliders className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => isEvolutionActive ? stopEvolution() : startEvolution()}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                isEvolutionActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isEvolutionActive ? <><Pause className="w-3 h-3 inline mr-1" />Stop</> : <><Play className="w-3 h-3 inline mr-1" />Start</>}
            </button>
          </div>

          {/* Mutation Generation Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['church-encoding', 'dimensional', 'topological', 'self-reference'] as AIMutation['type'][]).map((type) => (
              <button
                key={type}
                onClick={() => generateMutation(type)}
                disabled={isGenerating || !isWebLLMLoaded}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50"
              >
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Mutations</div>
              <div className="text-white font-bold">{mutations.length}</div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Confidence</div>
              <div className="text-green-400 font-bold">
                {evolutionMetrics.averageConfidence.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Recent Mutations */}
          {mutations.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
              {mutations.slice(0, 3).map((mutation) => (
                <div
                  key={mutation.id}
                  className="bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-700 transition-colors text-xs"
                  onClick={() => {
                    setSelectedMutation(mutation);
                    setShowMutationModal(true);
                  }}
                >
                  <div className="text-white font-medium truncate">{mutation.type}</div>
                  <div className="text-gray-400 truncate">{mutation.description}</div>
                  <div className="text-green-400 mt-1">
                    {(mutation.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics & Logs - Floating Panel */}
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-lg rounded-lg p-4 border border-gray-700 shadow-xl z-40 max-w-xs">
          <h4 className="text-sm font-bold text-white mb-3">Metrics & Logs</h4>
          
          {/* Bridge Status */}
          <div className="mb-3 p-2 bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-400 mb-2">Bridge Status</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">NLP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">Metaverse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">WebLLM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">TinyML</span>
              </div>
            </div>
          </div>

          {/* Evolution Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Total</div>
              <div className="text-white font-bold">{evolutionMetrics.totalMutations}</div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Success</div>
              <div className="text-green-400 font-bold">
                {evolutionMetrics.totalMutations > 0 
                  ? ((evolutionMetrics.successfulMutations / evolutionMetrics.totalMutations) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Evolution Log */}
          <div className="bg-gray-800 rounded-lg p-2 max-h-32 overflow-y-auto">
            <div className="text-xs font-bold text-white mb-2">Evolution Log</div>
            <div className="space-y-1">
              {evolutionLog.slice(0, 5).map((log, index) => (
                <div key={index} className="text-xs text-gray-400 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Layout - Hidden (kept for reference but not rendered) */}
      <div className="hidden">
        {/* Left Column: Agent Communication */}
        <Card className="flex flex-col" title="Agent Communication">
          {/* Agent Selector */}
          <div className="mb-4">
            <button
              onClick={() => setShowAgentSelectModal(true)}
              className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{chat.activeAgent.replace('-', ' ')}</div>
                  <div className="text-xs text-gray-400">{getAgentDescription(chat.activeAgent)}</div>
                </div>
                <Bot className="w-5 h-5 text-[#6366f1]" />
              </div>
            </button>
          </div>

          {/* Metaverse State Display */}
          <div className="mb-4 p-2 bg-gray-900 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Metaverse State</div>
            <div className="text-sm text-white">
              {automatonState.currentDimension}D - {automatonState.isRunning ? 'Running' : 'Idle'}
            </div>
            {patternPrediction && (
              <div className="text-xs text-green-400 mt-1">
                TinyML: Next → {patternPrediction.nextDimension}D ({(patternPrediction.confidence * 100).toFixed(0)}%)
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto min-h-0">
            {chat.messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>Start a conversation with {chat.activeAgent.replace('-', ' ')}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {chat.messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'agent' && (
                      <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      {message.content}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && chat.messages.length === 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <Lightbulb className="w-4 h-4" />
                Suggested questions:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {chat.suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-xs text-gray-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputMessage)}
              placeholder={`Message ${chat.activeAgent.replace('-', ' ')}...`}
              disabled={isTyping}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#6366f1] disabled:opacity-50"
            />
            
            <button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Middle Column: Evolution Engine */}
        <Card className="flex flex-col" title="AI Evolution Engine">
          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => isEvolutionActive ? stopEvolution() : startEvolution()}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                isEvolutionActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isEvolutionActive ? <><Pause className="w-4 h-4 inline mr-1" />Stop</> : <><Play className="w-4 h-4 inline mr-1" />Start</>}
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              title="Configuration"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Mutation Generation Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['church-encoding', 'dimensional', 'topological', 'self-reference'] as AIMutation['type'][]).map((type) => (
              <button
                key={type}
                onClick={() => generateMutation(type)}
                disabled={isGenerating || !isWebLLMLoaded}
                className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs disabled:opacity-50"
              >
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Mutations</div>
              <div className="text-lg font-bold text-white">{mutations.length}</div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Confidence</div>
              <div className="text-lg font-bold text-green-400">
                {evolutionMetrics.averageConfidence.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Recent Mutations */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {mutations.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                No mutations generated yet
              </div>
            ) : (
              mutations.slice(0, 5).map((mutation) => (
                <div
                  key={mutation.id}
                  className="bg-gray-900 rounded p-2 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    setSelectedMutation(mutation);
                    setShowMutationModal(true);
                  }}
                >
                  <div className="text-xs text-white font-medium">{mutation.type}</div>
                  <div className="text-xs text-gray-400 truncate">{mutation.description}</div>
                  <div className="text-xs text-green-400 mt-1">
                    {(mutation.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Metrics & Logs */}
        <Card className="flex flex-col" title="Metrics & Logs">
          {/* Bridge Status */}
          <div className="mb-4 p-2 bg-gray-900 rounded-lg">
            <div className="text-xs text-gray-400 mb-2">Bridge Status</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">NLP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">Metaverse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">WebLLM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300">TinyML</span>
              </div>
            </div>
          </div>

          {/* Evolution Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-lg font-bold text-white">{evolutionMetrics.totalMutations}</div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Success</div>
              <div className="text-lg font-bold text-green-400">
                {evolutionMetrics.totalMutations > 0 
                  ? ((evolutionMetrics.successfulMutations / evolutionMetrics.totalMutations) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Complexity</div>
              <div className="text-lg font-bold text-purple-400">
                {evolutionMetrics.complexityScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Novelty</div>
              <div className="text-lg font-bold text-pink-400">
                {evolutionMetrics.noveltyScore.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Evolution Log */}
          <div className="flex-1 bg-gray-900 rounded-lg p-3 overflow-y-auto">
            <div className="text-xs font-bold text-white mb-2">Evolution Log</div>
            <div className="space-y-1">
              {evolutionLog.slice(0, 10).map((log, index) => (
                <div key={index} className="text-xs text-gray-400 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Bridge Status Modal */}
      <Modal
        isOpen={showBridgeModal}
        onClose={() => setShowBridgeModal(false)}
        title="Bridge Status & Integration"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-3">System Bridges</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="text-white font-medium">Human NLP</div>
                    <div className="text-xs text-gray-400">Natural language processing for human input</div>
                  </div>
                </div>
                <span className={`text-xs ${bridgeStatus.nlp ? 'text-green-400' : 'text-gray-500'}`}>
                  {bridgeStatus.nlp ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="text-white font-medium">Automaton Metaverse</div>
                    <div className="text-xs text-gray-400">0D-7D dimensional topology state</div>
                  </div>
                </div>
                <span className={`text-xs ${bridgeStatus.metaverse ? 'text-green-400' : 'text-gray-500'}`}>
                  {bridgeStatus.metaverse ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="text-white font-medium">WebLLM</div>
                    <div className="text-xs text-gray-400">Browser-based LLM for AI evolution</div>
                  </div>
                </div>
                <span className={`text-xs ${bridgeStatus.webllm ? 'text-green-400' : 'text-gray-500'}`}>
                  {bridgeStatus.webllm ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="text-white font-medium">TinyML</div>
                    <div className="text-xs text-gray-400">Lightweight ML for pattern recognition</div>
                  </div>
                </div>
                <span className={`text-xs ${bridgeStatus.tinyml ? 'text-green-400' : 'text-gray-500'}`}>
                  {bridgeStatus.tinyml ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {tinyMLModels.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3">TinyML Models</h3>
              <div className="space-y-2">
                {tinyMLModels.map((model) => (
                  <div key={model.id} className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-gray-400">{model.type} • {(model.size / 1024).toFixed(1)}KB</div>
                      </div>
                      <div className="text-xs text-green-400">
                        {(model.accuracy * 100).toFixed(0)}% accuracy
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {patternPrediction && (
            <div className="p-3 bg-gray-900 rounded-lg">
              <h3 className="text-white font-medium mb-2 text-sm">TinyML Prediction</h3>
              <div className="text-sm text-gray-300">
                Next Dimension: <span className="text-green-400 font-bold">{patternPrediction.nextDimension}D</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Confidence: {(patternPrediction.confidence * 100).toFixed(0)}% • {patternPrediction.reasoning}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Agent Selection Modal */}
      <Modal
        isOpen={showAgentSelectModal}
        onClose={() => setShowAgentSelectModal(false)}
        title="Select Agent"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {chat.availableAgents.map((agent) => (
            <button
              key={agent}
              onClick={() => {
                setChat(prev => ({ ...prev, activeAgent: agent }));
                setShowAgentSelectModal(false);
              }}
              className={`p-4 rounded-lg text-left transition-all ${
                chat.activeAgent === agent
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium mb-1">{agent.replace('-', ' ')}</div>
              <div className="text-xs opacity-75">{getAgentDescription(agent)}</div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Mutation Details Modal */}
      <Modal
        isOpen={showMutationModal && selectedMutation !== null}
        onClose={() => {
          setShowMutationModal(false);
          setSelectedMutation(null);
        }}
        title={`Mutation: ${selectedMutation?.type}`}
        size="lg"
      >
        {selectedMutation && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Description</div>
              <div className="text-white">{selectedMutation.description}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Code</div>
              <pre className="bg-gray-900 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                {selectedMutation.code}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Confidence</div>
                <div className="text-lg font-bold text-green-400">
                  {(selectedMutation.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Impact</div>
                <div className={`text-lg font-bold ${
                  selectedMutation.impact === 'critical' ? 'text-red-400' :
                  selectedMutation.impact === 'high' ? 'text-orange-400' :
                  selectedMutation.impact === 'medium' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {selectedMutation.impact}
                </div>
              </div>
            </div>

            {!selectedMutation.applied && (
              <button
                onClick={() => applyMutation(selectedMutation)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Apply Mutation
              </button>
            )}
            {selectedMutation.applied && (
              <div className="w-full px-4 py-2 bg-green-600/20 text-green-300 rounded-lg text-center font-medium">
                Mutation Applied
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="WebLLM Configuration"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="llama-2-7b-chat">Llama 2 7B Chat</option>
              <option value="llama-2-13b-chat">Llama 2 13B Chat</option>
              <option value="codellama-7b">CodeLlama 7B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Tokens: {config.maxTokens}
            </label>
            <input
              type="range"
              min="512"
              max="4096"
              step="256"
              value={config.maxTokens}
              onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Top P: {config.topP}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.topP}
              onChange={(e) => setConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          <button
            onClick={() => {
              initializeWebLLM();
              setShowConfigModal(false);
            }}
            className="w-full px-4 py-2 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg font-medium"
          >
            Apply Configuration
          </button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Portal Settings"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">Agent Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSuggestions}
                  onChange={(e) => setShowSuggestions(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Show suggestions</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Evolution Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isEvolutionActive}
                  onChange={(e) => e.target.checked ? startEvolution() : stopEvolution()}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Auto-evolution enabled</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => {
                setMutations([]);
                setEvolutionLog([]);
                setShowSettingsModal(false);
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIPortal;
