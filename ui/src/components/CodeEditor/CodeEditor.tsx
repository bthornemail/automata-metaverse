import React, { useState, useEffect, useRef } from 'react';
import { Code, Zap, Terminal, Settings, Loader2, CheckCircle, AlertCircle, X, Bot, Cpu, Database, MessageSquare, Sliders, Play, Search, ChevronUp, ChevronDown, Send, Sparkles, Brain } from 'lucide-react';
import { schemeREPLService, SchemeREPLResult } from '../../services/scheme-repl-service';
import { opencodeApi } from '../../services/api';
import { unifiedCodeEditorService } from '../../services/unified-code-editor-service';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { motion, AnimatePresence } from 'framer-motion';
import { frontMatterParser } from '../../utils/front-matter-parser';
import { markdownService } from '../../services/markdown-service';
import { databaseService } from '../../services/database-service';
import { markdownWithFrontMatter } from '../../extensions/markdown-frontmatter';
import { canvaslLanguage } from '../../extensions/canvasl-language';
import { prologLanguage } from '../../extensions/prolog-language';
import { datalogLanguage } from '../../extensions/datalog-language';
import { createUnifiedExtensions } from '../../extensions/unified-codemirror-config';

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

const CodeEditor: React.FC = () => {
  // Console/REPL visibility
  const [showConsole, setShowConsole] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);
  
  // Scheme REPL State
  const [schemeHistory, setSchemeHistory] = useState<Array<{ input: string; result: SchemeREPLResult; timestamp: number; source?: 'editor' | 'repl' }>>([]);
  const [schemeInput, setSchemeInput] = useState('');
  const [isSchemeLoading, setIsSchemeLoading] = useState(false);
  const [schemeContext, setSchemeContext] = useState<any>({});
  const schemeInputRef = useRef<HTMLTextAreaElement>(null);
  const schemeHistoryEndRef = useRef<HTMLDivElement>(null);

  // OpenCode State
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
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentTask, setAgentTask] = useState<string>('');
  const [agentResponses, setAgentResponses] = useState<AgentTask[]>([]);
  const [isExecutingAgent, setIsExecutingAgent] = useState(false);
  const [isGeneratingMetaverse, setIsGeneratingMetaverse] = useState(false);
  const [metaverseResult, setMetaverseResult] = useState<string | null>(null);
  const [activeOpenCodeTab, setActiveOpenCodeTab] = useState<'analysis' | 'agents' | 'config' | 'webllm' | 'queries'>('analysis');
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
  const [fileLanguage, setFileLanguage] = useState<'javascript' | 'markdown' | 'canvasl' | 'prolog' | 'datalog'>('javascript');
  const [fileExtension, setFileExtension] = useState<string>('.js');
  const [frontMatter, setFrontMatter] = useState<any>({});
  const [jsonlReferences, setJsonlReferences] = useState<string[]>([]);
  
  // WebLLM Integration State
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string>('');
  const [codePrompt, setCodePrompt] = useState<string>('');
  
  // Prolog/Datalog Integration State
  const [queryType, setQueryType] = useState<'prolog' | 'datalog' | 'sparql'>('prolog');
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResults, setQueryResults] = useState<SchemeREPLResult | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize Scheme REPL
  useEffect(() => {
    schemeREPLService.loadR5RSFunctions();
    checkStatus();
    loadAgents();
    loadModels();
  }, []);

  useEffect(() => {
    schemeHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [schemeHistory]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Destroy existing editor if language changed
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Create new editor with appropriate language
    // Use Lezer-compatible markdown with front matter support
    // Support .canvasl extension as extended JSONL canvas format
    // Support Prolog and Datalog for query interface
    // Import extensions dynamically to ensure single CodeMirror instance
    let languageExtensions: Extension[];
    try {
      if (fileLanguage === 'markdown') {
        languageExtensions = markdownWithFrontMatter();
      } else if (fileLanguage === 'canvasl' || fileExtension === '.canvasl') {
        languageExtensions = canvaslLanguage();
      } else if (fileLanguage === 'prolog' || fileExtension === '.pl' || fileExtension === '.prolog') {
        languageExtensions = prologLanguage();
      } else if (fileLanguage === 'datalog' || fileExtension === '.dl' || fileExtension === '.datalog') {
        languageExtensions = datalogLanguage();
      } else {
        languageExtensions = [javascript()];
      }
    } catch (error) {
      console.error('Error loading language extensions:', error);
      // Fallback to JavaScript if extension loading fails
      languageExtensions = [javascript()];
    }
    
    // Build extensions array with OpenCode configuration integration
    // Ensure all extensions are valid Extension instances
    const baseExtensions: Extension[] = [
      ...languageExtensions,
      ...(config.showLineNumbers ? [lineNumbers()] : []),
      ...(config.theme === 'dark' ? [oneDark] : []),
      keymap.of(defaultKeymap as any[]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          setCode(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: `${config.fontSize}px`
        },
        '.cm-scroller': {
          overflow: 'auto'
        },
        '.cm-content': {
          padding: '12px'
        }
      })
    ];

    const startState = EditorState.create({
      doc: code,
      extensions: baseExtensions
    });

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [fileLanguage, fileExtension, config.theme, config.fontSize, config.showLineNumbers]);

  // Parse front matter when code changes (for markdown)
  useEffect(() => {
    if (fileLanguage === 'markdown' && code) {
      const parsed = frontMatterParser.parse(code);
      setFrontMatter(parsed.frontMatter);
      setJsonlReferences(frontMatterParser.extractJSONLReferences(parsed.frontMatter));
    }
  }, [code, fileLanguage]);

  // Evaluate selected code from editor in REPL
  const evaluateSelectedCode = async () => {
    if (!viewRef.current || isSchemeLoading) return;
    
    const selection = viewRef.current.state.selection.main;
    const selectedText = viewRef.current.state.doc.sliceString(selection.from, selection.to);
    
    if (!selectedText.trim()) {
      // If no selection, evaluate entire editor content
      const fullCode = viewRef.current.state.doc.toString();
      await evaluateCodeInREPL(fullCode, 'editor');
    } else {
      await evaluateCodeInREPL(selectedText, 'editor');
    }
  };

  // Evaluate code in REPL (from editor or REPL input)
  const evaluateCodeInREPL = async (codeToEvaluate: string, source: 'editor' | 'repl' = 'repl') => {
    if (!codeToEvaluate.trim() || isSchemeLoading) return;

    setIsSchemeLoading(true);

    try {
      // For markdown files, parse front matter and load JSONL references
      let enhancedContext = { ...schemeContext };
      
      if (fileLanguage === 'markdown' && source === 'editor') {
        const parsed = frontMatterParser.parse(codeToEvaluate);
        const jsonlRefs = frontMatterParser.extractJSONLReferences(parsed.frontMatter);
        
        // Load JSONL files into context
        for (const jsonlFile of jsonlRefs) {
          try {
            const entries = await databaseService.readJSONL(jsonlFile);
            enhancedContext[`jsonl:${jsonlFile}`] = entries;
            
            // Add helper functions to context
            enhancedContext[`load-jsonl-from-markdown`] = async (file: string) => {
              return await databaseService.readJSONL(file);
            };
            enhancedContext[`get-canvas-refs`] = () => {
              return frontMatterParser.extractJSONLReferences(parsed.frontMatter);
            };
            enhancedContext[`canvas-node`] = (nodeId: string) => {
              return entries.find((e: any) => e.id === nodeId);
            };
            enhancedContext[`update-canvas-node`] = async (nodeId: string, updates: any) => {
              const entry = entries.find((e: any) => e.id === nodeId);
              if (entry) {
                Object.assign(entry, updates);
                await databaseService.writeJSONL(jsonlFile, entries);
              }
            };
          } catch (err) {
            console.warn(`Failed to load JSONL file ${jsonlFile}:`, err);
          }
        }
        
        // Extract code blocks from markdown
        const codeBlockRegex = /```(?:scheme|javascript|js)?\n([\s\S]*?)```/g;
        const codeBlocks: string[] = [];
        let match;
        while ((match = codeBlockRegex.exec(parsed.content)) !== null) {
          codeBlocks.push(match[1]);
        }
        
        // Evaluate code blocks
        if (codeBlocks.length > 0) {
          codeToEvaluate = codeBlocks.join('\n');
        } else {
          codeToEvaluate = parsed.content;
        }
      }
      
      // Try to evaluate as JavaScript first, then Scheme
      let result: SchemeREPLResult;
      
      if (source === 'editor') {
        // For editor code, we might want to convert JS to Scheme or evaluate directly
        // For now, let's try evaluating as Scheme expression
        result = await schemeREPLService.evaluateLine(codeToEvaluate, enhancedContext);
      } else {
        result = await schemeREPLService.evaluateLine(codeToEvaluate, enhancedContext);
      }
      
      setSchemeHistory(prev => [...prev, {
        input: codeToEvaluate,
        result,
        timestamp: Date.now(),
        source
      }]);
      
      // Update context with new bindings
      if (result.success && result.result) {
        setSchemeContext(enhancedContext);
      }
    } catch (error) {
      setSchemeHistory(prev => [...prev, {
        input: codeToEvaluate,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now(),
        source
      }]);
    } finally {
      setIsSchemeLoading(false);
      if (source === 'repl') {
        setSchemeInput('');
        schemeInputRef.current?.focus();
      }
    }
  };

  // Scheme REPL Functions
  const handleSchemeEvaluate = async () => {
    if (!schemeInput.trim() || isSchemeLoading) return;
    await evaluateCodeInREPL(schemeInput.trim(), 'repl');
  };

  const handleSchemeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSchemeEvaluate();
    }
  };

  // OpenCode Functions
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
      // Use unified service for analysis
      const result = await unifiedCodeEditorService.analyzeCode(code);
      setAnalysis(result as AnalysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // WebLLM Code Generation
  const generateCodeWithAI = async () => {
    if (!codePrompt.trim()) return;
    
    setIsGeneratingCode(true);
    try {
      const generated = await unifiedCodeEditorService.generateCodeWithAI(codePrompt, code);
      setAiGeneratedCode(generated);
      
      // Optionally insert generated code at cursor
      if (viewRef.current && generated) {
        const state = viewRef.current.state;
        const selection = state.selection.main;
        const transaction = state.update({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: generated
          }
        });
        viewRef.current.dispatch(transaction);
      }
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const completeCode = async () => {
    if (!code.trim()) return;
    
    setIsGeneratingCode(true);
    try {
      const completion = await unifiedCodeEditorService.completeCode(code, fileLanguage);
      if (viewRef.current && completion) {
        const state = viewRef.current.state;
        const transaction = state.update({
          changes: {
            from: state.doc.length,
            insert: '\n' + completion
          }
        });
        viewRef.current.dispatch(transaction);
      }
    } catch (error) {
      console.error('Code completion failed:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Prolog/Datalog Query Execution
  const executeQuery = async () => {
    if (!queryInput.trim()) return;
    
    setIsExecutingQuery(true);
    setQueryResults(null);
    
    try {
      let result: SchemeREPLResult;
      
      if (queryType === 'prolog') {
        result = await unifiedCodeEditorService.executePrologQuery(queryInput);
      } else if (queryType === 'datalog') {
        result = await unifiedCodeEditorService.executeDatalogQuery(queryInput);
      } else {
        // SPARQL query
        const sparqlResult = await unifiedCodeEditorService.analyzeAndQuery(code, 'sparql', queryInput);
        result = sparqlResult as SchemeREPLResult;
      }
      
      setQueryResults(result);
    } catch (error) {
      setQueryResults({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setIsExecutingQuery(false);
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
      
      setAgentResponses(prev => [agentResponse, ...prev.slice(0, 9)]);
      
      setAvailableAgents(prev => prev.map(agent => 
        agent.id === selectedAgent.id 
          ? { ...agent, status: 'idle' as const }
          : agent
      ));
      
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
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Code Editor</h2>
            <div className="flex items-center gap-2">
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
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={evaluateSelectedCode}
              disabled={isSchemeLoading}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Evaluate selected code in REPL (or entire editor if nothing selected)"
            >
              <Terminal className="w-4 h-4" />
              <span>Eval in REPL</span>
            </button>
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
      </div>

      {/* Main Content - Editor with Console */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {fileLanguage === 'markdown' ? 'Markdown Editor' : 
                   fileLanguage === 'canvasl' ? 'CanvasL Editor' : 
                   fileLanguage === 'prolog' ? 'Prolog Editor' :
                   fileLanguage === 'datalog' ? 'Datalog Editor' :
                   'JavaScript Editor'}
                </span>
                <select
                  value={fileLanguage}
                  onChange={(e) => {
                    const lang = e.target.value as 'javascript' | 'markdown' | 'canvasl' | 'prolog' | 'datalog';
                    setFileLanguage(lang);
                    // Set extension based on language
                    if (lang === 'canvasl') {
                      setFileExtension('.canvasl');
                    } else if (lang === 'markdown') {
                      setFileExtension('.md');
                    } else if (lang === 'prolog') {
                      setFileExtension('.pl');
                    } else if (lang === 'datalog') {
                      setFileExtension('.dl');
                    } else {
                      setFileExtension('.js');
                    }
                  }}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="markdown">Markdown</option>
                  <option value="canvasl">CanvasL (.canvasl)</option>
                  <option value="prolog">Prolog (.pl)</option>
                  <option value="datalog">Datalog (.dl)</option>
                </select>
                {fileLanguage === 'markdown' && jsonlReferences.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-400">
                    <Database className="w-3 h-3" />
                    {jsonlReferences.length} JSONL ref{jsonlReferences.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">CodeMirror 6</span>
            </div>
            <div className="flex-1 overflow-hidden" ref={editorRef} />
          </div>

          {/* Right Panel */}
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveOpenCodeTab('analysis')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeOpenCodeTab === 'analysis' 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setActiveOpenCodeTab('agents')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeOpenCodeTab === 'agents' 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  AI Agents
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeOpenCodeTab === 'config' 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveOpenCodeTab('webllm')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeOpenCodeTab === 'webllm' 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title="WebLLM AI Code Generation"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveOpenCodeTab('queries')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeOpenCodeTab === 'queries' 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title="Prolog/Datalog Queries"
                >
                  <Brain className="w-4 h-4" />
                </button>
              </div>

              {/* Analysis Panel */}
              {activeOpenCodeTab === 'analysis' && analysis && (
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-400">Analysis Results</h3>
                  
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
              {activeOpenCodeTab === 'agents' && (
                <div className="flex-1 overflow-y-auto p-4">
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

              {activeOpenCodeTab === 'webllm' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold">WebLLM AI Code Generation</h3>
                  </div>
                  
                  {/* Code Generation Prompt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Generate Code</label>
                    <textarea
                      value={codePrompt}
                      onChange={(e) => setCodePrompt(e.target.value)}
                      placeholder="Describe what code you want to generate..."
                      className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={generateCodeWithAI}
                      disabled={isGeneratingCode || !codePrompt.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isGeneratingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Completion */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Code Completion</label>
                    <button
                      onClick={completeCode}
                      disabled={isGeneratingCode || !code.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isGeneratingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Completing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Complete Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generated Code Display */}
                  {aiGeneratedCode && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Generated Code</label>
                      <div className="p-3 bg-gray-700 border border-gray-600 rounded text-sm font-mono text-green-400 max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{aiGeneratedCode}</pre>
                      </div>
                      <button
                        onClick={() => setAiGeneratedCode('')}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeOpenCodeTab === 'queries' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Prolog/Datalog Queries</h3>
                  </div>
                  
                  {/* Query Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Query Type</label>
                    <select
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value as 'prolog' | 'datalog' | 'sparql')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="prolog">Prolog</option>
                      <option value="datalog">Datalog</option>
                      <option value="sparql">SPARQL</option>
                    </select>
                  </div>

                  {/* Query Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      {queryType === 'prolog' ? 'Prolog Query' : 
                       queryType === 'datalog' ? 'Datalog Query' : 
                       'SPARQL Query'}
                    </label>
                    <textarea
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder={
                        queryType === 'prolog' ? 'e.g., inherits(?x, "canvas:0D-topology")' :
                        queryType === 'datalog' ? 'e.g., (inherits ?x "canvas:0D-topology")' :
                        'SELECT ?x WHERE { ?x rdf:type canvas:Node }'
                      }
                      className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={executeQuery}
                      disabled={isExecutingQuery || !queryInput.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isExecutingQuery ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Execute Query</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Query Results */}
                  {queryResults && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Results</label>
                      <div className={`p-3 border rounded text-sm font-mono max-h-64 overflow-y-auto ${
                        queryResults.success 
                          ? 'bg-gray-700 border-green-600 text-green-400' 
                          : 'bg-gray-700 border-red-600 text-red-400'
                      }`}>
                        {queryResults.success ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(queryResults.result || queryResults.output, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-red-400">
                            <strong>Error:</strong> {queryResults.error || 'Unknown error'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setQueryResults(null)}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                      >
                        Clear Results
                      </button>
                    </div>
                  )}

                  {/* Example Queries */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Example Queries</label>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                           onClick={() => setQueryInput('inherits(?x, "canvas:0D-topology")')}>
                        <strong>Prolog:</strong> Find all nodes inheriting from 0D-topology
                      </div>
                      <div className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                           onClick={() => setQueryInput('(shacl-violation ?node)')}>
                        <strong>Datalog:</strong> Find SHACL violations
                      </div>
                      <div className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                           onClick={() => setQueryInput('SELECT ?x WHERE { ?x rdf:type canvas:Node }')}>
                        <strong>SPARQL:</strong> Find all canvas nodes
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Scheme REPL Console - Resizable */}
        <AnimatePresence>
          {showConsole && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: consoleHeight }}
              exit={{ height: 0 }}
              className="border-t border-gray-700 bg-gray-900 flex flex-col overflow-hidden"
            >
              {/* Console Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Scheme/R5RS REPL Console</span>
                  <span className="text-xs text-gray-400">(Explorer for Code Editor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newHeight = consoleHeight === 300 ? 500 : consoleHeight === 500 ? 300 : 300;
                      setConsoleHeight(newHeight);
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Resize console"
                  >
                    {consoleHeight >= 500 ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowConsole(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Hide console"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* REPL History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900 text-green-400 font-mono">
                {schemeHistory.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    <p>Welcome to the Scheme REPL Console!</p>
                    <p className="mt-2">Use this console to explore and evaluate code from the editor:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Select code in the editor and click "Eval in REPL"</li>
                      <li>Or type Scheme expressions directly here</li>
                      <li>Try: <code className="text-green-400">(r5rs:church-add 2 3)</code></li>
                    </ul>
                  </div>
                )}
                
                {schemeHistory.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <div className="text-blue-400">
                      <span className="text-gray-500">&gt;</span> {entry.input.length > 100 ? entry.input.substring(0, 100) + '...' : entry.input}
                      {entry.source === 'editor' && (
                        <span className="ml-2 text-xs text-purple-400">[from editor]</span>
                      )}
                    </div>
                    {entry.result.success ? (
                      <div className="text-green-300 ml-4">
                        {typeof entry.result.result === 'object' ? (
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(entry.result.result, null, 2)}
                          </pre>
                        ) : (
                          String(entry.result.result)
                        )}
                        {entry.result.output && entry.result.output.length > 0 && (
                          <div className="text-gray-400 text-xs mt-1">
                            {entry.result.output.map((out, i) => (
                              <div key={i}>{out}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-400 ml-4">
                        Error: {entry.result.error}
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={schemeHistoryEndRef} />
              </div>

              {/* REPL Input */}
              <div className="border-t border-gray-700 p-3 bg-gray-800">
                <div className="flex gap-2">
                  <textarea
                    ref={schemeInputRef}
                    value={schemeInput}
                    onChange={(e) => setSchemeInput(e.target.value)}
                    onKeyDown={handleSchemeKeyDown}
                    placeholder="Enter Scheme expression or select code in editor and click 'Eval in REPL'..."
                    className="flex-1 bg-gray-900 text-green-400 p-2 rounded border border-gray-700 focus:border-green-500 focus:outline-none font-mono text-sm resize-none"
                    rows={2}
                    disabled={isSchemeLoading}
                  />
                  <button
                    onClick={handleSchemeEvaluate}
                    disabled={isSchemeLoading || !schemeInput.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-mono text-sm transition-colors flex items-center gap-2"
                  >
                    {isSchemeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Eval</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>Pure Scheme/R5RS • Console Explorer • Select code in editor and click "Eval in REPL" to evaluate</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Console Button (when hidden) */}
        {!showConsole && (
          <div className="border-t border-gray-700 p-2 bg-gray-800">
            <button
              onClick={() => setShowConsole(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              <Terminal className="w-4 h-4 text-green-400" />
              <span>Show REPL Console</span>
            </button>
          </div>
        )}
      </div>

      {/* Configuration Modal - Same as OpenCode */}
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

      {/* Agent Chat Modal - Same as OpenCode */}
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
                  >
                    {isExecutingAgent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
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

export default CodeEditor;
