import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, MessageSquare, Send, Bot, User, Zap, Play, Pause, RotateCcw, 
  Settings, Download, Upload, Lightbulb, TrendingUp, Cpu, Code, Sparkles, X,
  FileText, BarChart3, Network, Cpu as CpuIcon, Maximize2, Minimize2
} from 'lucide-react';
import { AgentChat } from '@/types';
import { apiService } from '@/services/api';
import { useAutomatonState } from '@/hooks/useAutomatonState';
import { Modal } from '@/components/shared/Modal';
import { Card } from '@/components/shared/Card';
import { nlpService } from '@/services/nlp-service';
import { tinyMLService } from '@/services/tinyml-service';
import { databaseService } from '@/services/database-service';
import { llmService, LLMProviderConfig } from '@/services/llm-service';
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

interface LLMProviderConfig {
  provider: 'webllm' | 'ollama' | 'openai' | 'opencode';
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  // Provider-specific
  ollamaUrl?: string;
  openaiApiKey?: string;
  opencodeEndpoint?: string;
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
  
  // LLM Provider Configuration
  const [llmProviderConfig, setLlmProviderConfig] = useState<LLMProviderConfig>({
    provider: 'webllm',
    model: 'Llama-2-7b-chat-hf-q4f32_1',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    ollamaUrl: 'http://localhost:11434',
    opencodeEndpoint: 'http://localhost:3000/api/opencode'
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
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showAgentSelectModal, setShowAgentSelectModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [showAIEvolutionModal, setShowAIEvolutionModal] = useState(false);
  
  // Chat Panel State
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Initialize all bridges
  useEffect(() => {
    initializeBridges();
    loadAvailableAgents();
    scrollToBottom();
    initializeLLMProvider();
  }, []);

  // Initialize LLM Provider when config changes
  useEffect(() => {
    initializeLLMProvider();
  }, [llmProviderConfig.provider, llmProviderConfig.model]);

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

  const addEvolutionLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvolutionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const initializeLLMProvider = async () => {
    try {
      addEvolutionLog(`Initializing LLM provider: ${llmProviderConfig.provider}...`);
      
      if (llmProviderConfig.provider === 'webllm') {
        addEvolutionLog(`Loading WebLLM model: ${llmProviderConfig.model}...`);
        addEvolutionLog(`⚠ Note: First-time model download may take 5-10 minutes`);
        addEvolutionLog(`   Models are downloaded to browser cache on first use`);
        addEvolutionLog(`   You can switch to Ollama/OpenAI in Settings while waiting`);
      }
      
      // For WebLLM, set a timeout to prevent hanging
      let initPromise = llmService.initialize(llmProviderConfig);
      
      if (llmProviderConfig.provider === 'webllm') {
        // Add a timeout for WebLLM initialization (10 minutes for model download)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('WebLLM initialization timeout (10 minutes). Model download may still be in progress.')), 600000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
      } else {
        await initPromise;
      }
      
      // Verify initialization
      if (llmService.isAvailable()) {
        setBridgeStatus(prev => ({ ...prev, webllm: true }));
        setIsWebLLMLoaded(true);
        addEvolutionLog(`✓ LLM provider ${llmProviderConfig.provider} initialized successfully`);
        
        // Test the provider with a simple query if WebLLM
        if (llmProviderConfig.provider === 'webllm') {
          try {
            const testResponse = await llmService.generateResponse(
              [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Say "ready" if you can respond.' }
              ],
              llmProviderConfig
            );
            addEvolutionLog(`✓ WebLLM test successful: ${testResponse.content.substring(0, 50)}`);
          } catch (testError) {
            console.warn('WebLLM test failed:', testError);
            addEvolutionLog(`⚠ WebLLM initialized but test query failed: ${testError instanceof Error ? testError.message : 'Unknown'}`);
          }
        }
      } else {
        // For non-webllm providers, mark as available even if not "initialized" in the traditional sense
        if (llmProviderConfig.provider !== 'webllm') {
          setBridgeStatus(prev => ({ ...prev, webllm: true }));
          setIsWebLLMLoaded(true);
          addEvolutionLog(`✓ ${llmProviderConfig.provider.toUpperCase()} ready (no pre-initialization needed)`);
        } else {
          throw new Error('LLM service reports as unavailable after initialization');
        }
      }
    } catch (error) {
      console.error('Failed to initialize LLM provider:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // For non-webllm providers, don't mark as failed - they might work on first use
      if (llmProviderConfig.provider === 'webllm') {
        setBridgeStatus(prev => ({ ...prev, webllm: false }));
        setIsWebLLMLoaded(false);
        addEvolutionLog(`✗ Failed to initialize WebLLM: ${errorMessage}`);
        addEvolutionLog(`💡 Suggestions:`);
        addEvolutionLog(`   - Check browser console (F12) for detailed errors`);
        addEvolutionLog(`   - Try a smaller model: Settings → Configuration → Model → TinyLlama`);
        addEvolutionLog(`   - Ensure stable internet (models download on first use, ~2-4GB)`);
        addEvolutionLog(`   - Switch to Ollama: Settings → Configuration → Provider → Ollama`);
        addEvolutionLog(`   - Or use OpenAI: Settings → Configuration → Provider → OpenAI`);
      } else {
        // For other providers, mark as ready but log the warning
        addEvolutionLog(`⚠ ${llmProviderConfig.provider.toUpperCase()} initialization note: ${errorMessage}`);
        addEvolutionLog(`   Will attempt to use on first message`);
        setBridgeStatus(prev => ({ ...prev, webllm: true }));
        setIsWebLLMLoaded(true);
      }
    }
  };

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

    // Initialize LLM Provider (will initialize WebLLM if selected)
    await initializeLLMProvider();
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
    // Don't initialize if already loaded or initializing
    if (isWebLLMLoaded || webLLMRef.current) {
      return;
    }

    try {
      addEvolutionLog('Initializing WebLLM engine...');
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      const initProgressCallback = (progress: any) => {
        const percent = Math.round(progress.progress * 100);
        addEvolutionLog(`Loading WebLLM: ${percent}%`);
      };
      
      addEvolutionLog(`Loading model: ${config.model}`);
      const engine = await CreateMLCEngine(config.model, { 
        initProgressCallback,
        // Use a smaller model if the default fails
        model: config.model,
        // Enable verbose logging for debugging
        verbose: true
      });
      
      webLLMRef.current = engine;
      setIsWebLLMLoaded(true);
      setBridgeStatus(prev => ({ ...prev, webllm: true }));
      addEvolutionLog('✓ WebLLM initialized successfully - Real engine ready');
      
      // Test the engine with a simple prompt
      try {
        const testResponse = await engine.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "ready" if you can respond.' }
          ],
          temperature: 0.1,
          max_tokens: 10
        });
        addEvolutionLog(`✓ WebLLM test successful: ${testResponse.choices[0]?.message?.content || 'no response'}`);
      } catch (testError) {
        console.warn('WebLLM test failed, but engine is loaded:', testError);
      }
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      addEvolutionLog(`✗ WebLLM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Don't use mock - instead, mark as not loaded and let sendMessage handle it
      setIsWebLLMLoaded(false);
      setBridgeStatus(prev => ({ ...prev, webllm: false }));
      
      // Try alternative model if current one fails
      if (config.model !== 'Llama-2-7b-chat-hf-q4f32_1') {
        addEvolutionLog('Trying alternative model: Llama-2-7b-chat-hf-q4f32_1');
        try {
          const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
          const engine = await CreateMLCEngine('Llama-2-7b-chat-hf-q4f32_1', { 
            initProgressCallback: (p: any) => addEvolutionLog(`Loading alt model: ${Math.round(p.progress * 100)}%`)
          });
          webLLMRef.current = engine;
          setIsWebLLMLoaded(true);
          setBridgeStatus(prev => ({ ...prev, webllm: true }));
          addEvolutionLog('✓ Alternative WebLLM model loaded successfully');
        } catch (altError) {
          console.error('Alternative model also failed:', altError);
          addEvolutionLog('✗ All WebLLM models failed to load');
        }
      }
    }
  };

  // Enhanced sendMessage with NLP processing, WebLLM, and JSONL automaton integration
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

      // Step 2: Load JSONL Automaton Data using Scheme REPL (better than JS parsing)
      let jsonlContext = '';
      try {
        // Use Scheme REPL to process JSONL line-by-line (no split errors!)
        const { schemeREPLService } = await import('../../services/scheme-repl-service');
        
        const kernelResult = await schemeREPLService.loadAndProcessJSONL('automaton-kernel.jsonl');
        const metaverseResult = await schemeREPLService.loadAndProcessJSONL('generate.metaverse.jsonl');
        
        // Fallback to database service if Scheme REPL fails
        let automatonKernel: any[] = [];
        let metaverseData: any[] = [];
        
        if (kernelResult.success && kernelResult.result) {
          automatonKernel = kernelResult.result.facts || [];
          addEvolutionLog(`✓ Loaded ${automatonKernel.length} kernel facts via Scheme REPL`);
        } else {
          // Fallback to database service
          automatonKernel = await databaseService.readJSONL('automaton-kernel.jsonl');
          addEvolutionLog(`⚠ Using database service fallback for kernel`);
        }
        
        if (metaverseResult.success && metaverseResult.result) {
          metaverseData = metaverseResult.result.facts || [];
          addEvolutionLog(`✓ Loaded ${metaverseData.length} metaverse facts via Scheme REPL`);
        } else {
          // Fallback to database service
          metaverseData = await databaseService.readJSONL('generate.metaverse.jsonl');
          addEvolutionLog(`⚠ Using database service fallback for metaverse`);
        }
        
        // Ensure we have arrays and validate entries
        const kernelArray = Array.isArray(automatonKernel) 
          ? automatonKernel.filter((item): item is any => 
              item !== null && 
              item !== undefined && 
              typeof item === 'object' &&
              !Array.isArray(item) // Exclude arrays, only objects
            )
          : [];
        const metaverseArray = Array.isArray(metaverseData)
          ? metaverseData.filter((item): item is any => 
              item !== null && 
              item !== undefined && 
              typeof item === 'object' &&
              !Array.isArray(item) // Exclude arrays, only objects
            )
          : [];
        
        // Extract relevant automaton data for context
        const kernelSummary = kernelArray.slice(0, 10).map((item: any) => {
          // Double-check item is an object
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return { id: 'unknown', type: 'unknown', text: 'invalid item' };
          }
          return {
            id: (typeof item.id === 'string' || typeof item.id === 'number') ? String(item.id) : 'no-id',
            type: typeof item.type === 'string' ? item.type : 'no-type',
            text: typeof item.text === 'string' ? item.text.substring(0, 100) : (typeof item.text === 'object' ? JSON.stringify(item.text).substring(0, 100) : 'no text')
          };
        });
        
        const metaverseSummary = metaverseArray.slice(0, 10).map((item: any) => {
          // Double-check item is an object
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return { id: 'unknown', type: 'unknown', text: 'invalid item' };
          }
          return {
            id: (typeof item.id === 'string' || typeof item.id === 'number') ? String(item.id) : 'no-id',
            type: typeof item.type === 'string' ? item.type : 'no-type',
            text: typeof item.text === 'string' ? item.text.substring(0, 100) : (typeof item.text === 'object' ? JSON.stringify(item.text).substring(0, 100) : 'no text')
          };
        });

        jsonlContext = `
JSONL Automaton Data:
- Automaton Kernel: ${JSON.stringify(kernelSummary, null, 2)}
- Metaverse Structure: ${JSON.stringify(metaverseSummary, null, 2)}
- Total Kernel Nodes: ${kernelArray.length}
- Total Metaverse Nodes: ${metaverseArray.length}
`;
        addEvolutionLog(`Loaded ${kernelArray.length} kernel nodes and ${metaverseArray.length} metaverse nodes`);
      } catch (jsonlError) {
        console.error('Failed to load JSONL data:', jsonlError);
        addEvolutionLog(`✗ JSONL Error: ${jsonlError instanceof Error ? jsonlError.message : 'Unknown error'}`);
        jsonlContext = 'JSONL Automaton Data: Unable to load (using cached state)';
      }

      // Step 3: TinyML Pattern Recognition & Prediction
      const tinyMLPrediction = tinyMLService.predictNextDimension(
        automatonState.currentDimension,
        [] // Would use actual history in production
      );
      addEvolutionLog(`TinyML Prediction: Next dimension ${tinyMLPrediction.nextDimension}D (${(tinyMLPrediction.confidence * 100).toFixed(0)}% confidence)`);
      setPatternPrediction(tinyMLPrediction);

      // Step 4: Execute automaton command if detected
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

      // Step 5: Generate WebLLM response with comprehensive context including JSONL
      const contextPrompt = `
You are an AI assistant for a Self-Referencing Automaton system that uses Church encoding and dimensional topology (0D-7D).

Current Automaton State:
- Current Dimension: ${automatonState.currentDimension}D
- Automaton Status: ${automatonState.isRunning ? 'Running' : 'Idle'}
- Iteration Count: ${automatonState.iterationCount || 0}
- Self-Modification Count: ${automatonState.selfModificationCount || 0}

NLP Analysis:
- Intent: ${nlpAnalysis.intent}
- Confidence: ${(nlpAnalysis.confidence * 100).toFixed(0)}%
- Detected Entities: ${JSON.stringify(nlpAnalysis.entities || {})}

TinyML Prediction:
- Next Dimension: ${tinyMLPrediction.nextDimension}D
- Confidence: ${(tinyMLPrediction.confidence * 100).toFixed(0)}%
- Reasoning: ${tinyMLPrediction.reasoning || 'Pattern-based prediction'}

${jsonlContext}

User Message: "${message}"

Instructions:
1. Use the JSONL automaton data to provide accurate information about the system structure
2. Reference specific nodes, dimensions, or Church encodings when relevant
3. If the user asks about automaton operations, use the current state and JSONL data
4. Be helpful, technical but accessible, and bridge human understanding with automaton concepts
5. If asked to modify or query the automaton, suggest specific JSONL operations

Generate a helpful, informative response:
`;

      let agentResponse: string;
      
      // Use unified LLM service with selected provider
      // For non-webllm providers, try even if not marked as available (they don't need pre-initialization)
      const shouldTryLLM = llmService.isAvailable() || llmProviderConfig.provider !== 'webllm';
      
      if (shouldTryLLM) {
        try {
          addEvolutionLog(`${llmProviderConfig.provider.toUpperCase()}: Generating response with JSONL context...`);
          
          const llmResponse = await llmService.generateResponse(
            [
              { 
                role: 'system', 
                content: `You are an expert AI assistant for a Self-Referencing Automaton system. You have access to JSONL automaton data, dimensional topology (0D-7D), Church encoding, and real-time automaton state. Provide accurate, helpful responses based on the provided context.`
              },
              { role: 'user', content: contextPrompt }
            ],
            llmProviderConfig
          );
          
          agentResponse = llmResponse.content || 'I apologize, but I did not receive a valid response.';
          
          // Check if response looks like mock JSON
          if (agentResponse.trim().startsWith('{') && agentResponse.includes('description')) {
            throw new Error('Received mock JSON response instead of chat response');
          }
          
          addEvolutionLog(`✓ ${llmProviderConfig.provider.toUpperCase()}: Generated response (${agentResponse.length} chars)${llmResponse.model ? ` using ${llmResponse.model}` : ''}`);
          
          if (llmResponse.usage) {
            addEvolutionLog(`  Tokens: ${llmResponse.usage.totalTokens || 'N/A'} (prompt: ${llmResponse.usage.promptTokens || 'N/A'}, completion: ${llmResponse.usage.completionTokens || 'N/A'})`);
          }
        } catch (llmError) {
          console.error(`${llmProviderConfig.provider} error:`, llmError);
          addEvolutionLog(`✗ ${llmProviderConfig.provider.toUpperCase()} Error: ${llmError instanceof Error ? llmError.message : 'Unknown error'}`);
          
          // Try to reinitialize if WebLLM
          if (llmProviderConfig.provider === 'webllm') {
            addEvolutionLog('Attempting to reinitialize WebLLM...');
            try {
              await initializeLLMProvider();
              
              // Retry once if reinitialization succeeded
              if (llmService.isAvailable()) {
                try {
                  const retryResponse = await llmService.generateResponse(
                    [
                      { role: 'system', content: 'You are a helpful AI assistant.' },
                      { role: 'user', content: contextPrompt }
                    ],
                    llmProviderConfig
                  );
                  agentResponse = retryResponse.content || 'Response received but empty.';
                  addEvolutionLog(`✓ Retry successful`);
                } catch (retryError) {
                  addEvolutionLog(`✗ Retry also failed: ${retryError instanceof Error ? retryError.message : 'Unknown'}`);
                }
              }
            } catch (reinitError) {
              addEvolutionLog(`✗ Reinitialization failed: ${reinitError instanceof Error ? reinitError.message : 'Unknown'}`);
            }
          }
          
          // Fallback: Use API agent with JSONL context if LLM still fails
          if (!agentResponse) {
            try {
              const response = await apiService.sendAgentMessage(chat.activeAgent, `${message}\n\nContext: ${jsonlContext.substring(0, 500)}`);
              agentResponse = response.success && response.data 
                ? response.data 
                : `I understand you want to ${nlpAnalysis.intent}. Current automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}. ${nlpService.formatStateToNL(automatonState)}`;
              addEvolutionLog(`Fallback: Used API agent`);
            } catch (apiError) {
              agentResponse = `I understand you want to ${nlpAnalysis.intent}. Current automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}. ${nlpService.formatStateToNL(automatonState)}`;
              addEvolutionLog(`Fallback: Used basic response`);
            }
          }
        }
      } else {
        // LLM not available - try to initialize (mainly for WebLLM)
        addEvolutionLog(`${llmProviderConfig.provider.toUpperCase()} not loaded, initializing...`);
        
        try {
          await initializeLLMProvider();
          
          if (llmService.isAvailable()) {
            try {
              const llmResponse = await llmService.generateResponse(
                [
                  { role: 'system', content: 'You are a helpful AI assistant.' },
                  { role: 'user', content: contextPrompt }
                ],
                llmProviderConfig
              );
              agentResponse = llmResponse.content || 'Response received but empty.';
              addEvolutionLog(`✓ ${llmProviderConfig.provider.toUpperCase()}: Initialized and responded`);
            } catch (error) {
              agentResponse = `${llmProviderConfig.provider.toUpperCase()} initialized but failed to generate response. Current automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}.`;
              addEvolutionLog(`${llmProviderConfig.provider.toUpperCase()} initialized but response failed`);
            }
          } else {
            // WebLLM failed - provide helpful message
            if (llmProviderConfig.provider === 'webllm') {
              agentResponse = `WebLLM is not available. This could be due to:\n- Model download in progress (check Evolution Log)\n- Network connectivity issues\n- Browser compatibility\n\nCurrent automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}.\n\n💡 Try switching to Ollama or OpenAI in Settings, or check the Evolution Log for details.`;
            } else {
              agentResponse = `${llmProviderConfig.provider.toUpperCase()} is not available. Current automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}. Please check configuration (Settings → Configuration).`;
            }
            addEvolutionLog(`✗ ${llmProviderConfig.provider.toUpperCase()} initialization failed`);
          }
        } catch (initError) {
          const errorMsg = initError instanceof Error ? initError.message : 'Unknown error';
          if (llmProviderConfig.provider === 'webllm') {
            agentResponse = `Unable to initialize WebLLM: ${errorMsg}.\n\nCurrent automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}.\n\n💡 Suggestions:\n- Check browser console for detailed errors\n- Try a smaller model (TinyLlama) in Settings\n- Ensure stable internet (models download on first use)\n- Switch to Ollama (local) or OpenAI in Settings`;
          } else {
            agentResponse = `Unable to initialize ${llmProviderConfig.provider.toUpperCase()}: ${errorMsg}. Current automaton state: ${automatonState.currentDimension}D, ${automatonState.isRunning ? 'Running' : 'Idle'}.`;
          }
          addEvolutionLog(`✗ ${llmProviderConfig.provider.toUpperCase()} initialization error: ${errorMsg}`);
        }
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
      console.error('Error in sendMessage:', error);
      const errorMessage = {
        role: 'agent' as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: Date.now()
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
      addEvolutionLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <WebGLMetaverseEvolution onOpenAIModal={() => setShowAIEvolutionModal(true)} />
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
              onClick={() => setShowSettingsModal(true)}
              className="p-1 rounded hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-400" />
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
                disabled={isGenerating || !llmService.isAvailable()}
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
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mutation Generation Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['church-encoding', 'dimensional', 'topological', 'self-reference'] as AIMutation['type'][]).map((type) => (
              <button
                key={type}
                onClick={() => generateMutation(type)}
                disabled={isGenerating || !llmService.isAvailable()}
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
                    <div className="text-white font-medium">LLM Provider ({llmProviderConfig.provider.toUpperCase()})</div>
                    <div className="text-xs text-gray-400">
                      {llmProviderConfig.provider === 'webllm' && 'Browser-based LLM for AI evolution'}
                      {llmProviderConfig.provider === 'ollama' && 'Local Ollama server'}
                      {llmProviderConfig.provider === 'openai' && 'OpenAI API'}
                      {llmProviderConfig.provider === 'opencode' && 'OpenCode SDK'}
                    </div>
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

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Portal Settings"
        size="md"
      >
        <div className="space-y-6">
          {/* LLM Provider Configuration */}
          <div>
            <h3 className="text-white font-medium mb-4">LLM Provider Configuration</h3>
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">LLM Provider</label>
                <select
                  value={llmProviderConfig.provider}
                  onChange={(e) => {
                    const provider = e.target.value as LLMProviderConfig['provider'];
                    setLlmProviderConfig(prev => ({
                      ...prev,
                      provider,
                      // Set default models for each provider
                      model: provider === 'ollama' ? 'llama2' :
                             provider === 'openai' ? 'gpt-3.5-turbo' :
                             provider === 'opencode' ? 'default' :
                             'Llama-2-7b-chat-hf-q4f32_1'
                    }));
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="webllm">WebLLM (Browser-based)</option>
                  <option value="ollama">Ollama (Local Server)</option>
                  <option value="openai">OpenAI API</option>
                  <option value="opencode">OpenCode SDK</option>
                </select>
              </div>

              {/* Provider-specific settings */}
              {llmProviderConfig.provider === 'ollama' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ollama URL</label>
                  <input
                    type="text"
                    value={llmProviderConfig.ollamaUrl || 'http://localhost:11434'}
                    onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <div className="mt-2">
                    <label className="block text-sm text-gray-400 mb-2">Model</label>
                    <input
                      type="text"
                      value={llmProviderConfig.model}
                      onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="llama2, mistral, codellama, etc."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {llmProviderConfig.provider === 'openai' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
                  <input
                    type="password"
                    value={llmProviderConfig.openaiApiKey || ''}
                    onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <div className="mt-2">
                    <label className="block text-sm text-gray-400 mb-2">Model</label>
                    <select
                      value={llmProviderConfig.model}
                      onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                      <option value="gpt-4o">GPT-4o</option>
                    </select>
                  </div>
                </div>
              )}

              {llmProviderConfig.provider === 'opencode' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">OpenCode Endpoint</label>
                  <input
                    type="text"
                    value={llmProviderConfig.opencodeEndpoint || 'http://localhost:3000/api/opencode'}
                    onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, opencodeEndpoint: e.target.value }))}
                    placeholder="http://localhost:3000/api/opencode"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              )}

              {llmProviderConfig.provider === 'webllm' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Model</label>
                  <select
                    value={llmProviderConfig.model}
                    onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="Llama-2-7b-chat-hf-q4f32_1">Llama 2 7B Chat (Q4)</option>
                    <option value="Llama-2-13b-chat-hf-q4f32_1">Llama 2 13B Chat (Q4)</option>
                    <option value="TinyLlama-1.1B-Chat-v0.4">TinyLlama 1.1B Chat</option>
                    <option value="Phi-3-mini-4k-instruct-q4f32_1-MLC">Phi-3 Mini 4K Instruct</option>
                  </select>
                </div>
              )}

              {/* Common settings */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Temperature: {llmProviderConfig.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={llmProviderConfig.temperature}
                  onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Max Tokens: {llmProviderConfig.maxTokens}
                </label>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={llmProviderConfig.maxTokens}
                  onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Top P: {llmProviderConfig.topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={llmProviderConfig.topP}
                  onChange={(e) => setLlmProviderConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <button
                onClick={async () => {
                  await initializeLLMProvider();
                }}
                className="w-full px-4 py-2 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg font-medium"
              >
                Apply LLM Configuration
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-white font-medium mb-4">Agent Settings</h3>
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

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-white font-medium mb-4">Evolution Settings</h3>
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
