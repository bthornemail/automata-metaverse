/**
 * 3D Metaverse Portal
 * Bridging Human NLP ↔ Automaton Metaverse ↔ WebLLM ↔ TinyML
 */

import React, { useState, useEffect, useRef, useMemo, ErrorInfo, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, MessageSquare, Zap, Cpu, Network, Sparkles, 
  Send, Mic, Volume2, Settings, Maximize2, Minimize2,
  ArrowRight, ArrowLeft, Layers, Globe, AlertCircle
} from 'lucide-react';
import { EnhancedVirtualWorld } from '@/components/VirtualWorld';
import type { EnhancedVirtualWorldConfig } from '@/components/VirtualWorld';
import type { AvatarConfig } from '@/components/VirtualWorld/EnhancedGLTFAvatar';
import { nlpService } from '@/services/nlp-service';
import { llmService } from '@/services/llm-service';
import type { LLMProviderConfig } from '@/services/llm-service';
import { tinyMLService } from '@/services/tinyml-service';
import { worldService } from '@/services/world-service';
import { cameraService } from '@/services/camera-service';
import { useAgentAPI } from '@/hooks/useAgentAPI';
import type { Agent } from '@/services/agent-api/types';
import { GlassCard, ModernButton, ModernBadge, ModernTooltip } from '@/components/VirtualWorld/ModernUI';

export interface MetaversePortalProps {
  llmProviderConfig: LLMProviderConfig;
  onNLPMessage?: (message: string) => void;
  onMetaverseAction?: (action: string, params: any) => void;
  onBridgeStatusChange?: (status: BridgeStatus) => void;
}

export interface BridgeStatus {
  nlp: boolean;
  metaverse: boolean;
  webllm: boolean;
  tinyml: boolean;
}

export interface BridgeConnection {
  id: string;
  from: 'nlp' | 'metaverse' | 'webllm' | 'tinyml';
  to: 'nlp' | 'metaverse' | 'webllm' | 'tinyml';
  status: 'active' | 'idle' | 'error';
  data?: any;
  timestamp: number;
}

// Error Boundary Component
class MetaversePortalErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error (would normally go to console, but user doesn't have access)
    // Could send to error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Metaverse Portal</h2>
            <p className="text-gray-400 mb-4">{this.state.error?.message || 'Unknown error occurred'}</p>
            <ModernButton
              onClick={() => window.location.reload()}
              variant="primary"
            >
              Reload Page
            </ModernButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const MetaversePortal: React.FC<MetaversePortalProps> = ({
  llmProviderConfig,
  onNLPMessage,
  onMetaverseAction,
  onBridgeStatusChange
}) => {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({
    nlp: false,
    metaverse: false,
    webllm: false,
    tinyml: false
  });

  const [connections, setConnections] = useState<BridgeConnection[]>([]);
  const [nlpInput, setNlpInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBridgeVisualization, setShowBridgeVisualization] = useState(false); // Closed by default
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWorldReady, setIsWorldReady] = useState(false);
  const [worldConfig, setWorldConfig] = useState<EnhancedVirtualWorldConfig>({
    scene: { 
      terrain: { 
        size: 200,
        color: '#4a5568',
        roughness: 0.8,
        metalness: 0.1
      },
      skybox: { 
        type: 'procedural',
        skyColor: '#87CEEB',
        stars: true
      },
      enableControls: true,
      camera: {
        position: [0, 15, 25],
        fov: 75
      }
    },
    lighting: { 
      enableShadows: true,
      ambientIntensity: 0.6,
      directionalIntensity: 1
    },
    camera: { 
      mode: 'orbital', 
      target: [0, 0, 0], 
      distance: 25,
      fov: 75,
      enableControls: true
    },
    navigation: { 
      showWaypoints: true,
      enableTeleportation: true
    },
    minimap: { 
      enabled: true, 
      position: 'top-right',
      showZones: true,
      showBuildings: true,
      showWaypoints: true
    },
    performance: { 
      enableLOD: true, 
      enableFrustumCulling: true,
      enableObjectPooling: true
    },
    avatars: [],
    buildings: [],
    environmentalObjects: [],
    showBuildings: true,
    showPaths: true,
    showEnvironment: true,
    enablePersistence: true,
    enableSettings: true,
    enableDebug: false,
    worldSize: 200
  });

  // Initialize bridges
  useEffect(() => {
    initializeBridges();
    // Set world as ready after a short delay to ensure Canvas is mounted
    const timer = setTimeout(() => {
      setIsWorldReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update bridge status
  useEffect(() => {
    onBridgeStatusChange?.(bridgeStatus);
  }, [bridgeStatus, onBridgeStatusChange]);

  const initializeBridges = async () => {
    // Initialize NLP
    setBridgeStatus(prev => ({ ...prev, nlp: true }));
    addConnection('nlp', 'metaverse', 'active');

    // Initialize Metaverse
    setBridgeStatus(prev => ({ ...prev, metaverse: true }));
    addConnection('metaverse', 'nlp', 'active');

    // Initialize WebLLM
    if (llmService.isAvailable()) {
      setBridgeStatus(prev => ({ ...prev, webllm: true }));
      addConnection('webllm', 'nlp', 'active');
      addConnection('webllm', 'metaverse', 'active');
    }

    // Initialize TinyML
    try {
      await tinyMLService.initialize();
      setBridgeStatus(prev => ({ ...prev, tinyml: true }));
      addConnection('tinyml', 'metaverse', 'active');
      addConnection('nlp', 'tinyml', 'active');
    } catch (error) {
      console.error('TinyML initialization failed:', error);
    }
  };

  const addConnection = (
    from: BridgeConnection['from'],
    to: BridgeConnection['to'],
    status: BridgeConnection['status'] = 'active',
    data?: any
  ) => {
    const connection: BridgeConnection = {
      id: `conn-${Date.now()}-${Math.random()}`,
      from,
      to,
      status,
      data,
      timestamp: Date.now()
    };
    setConnections(prev => [connection, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Process NLP input through the bridge
  const processNLPInput = async (input: string) => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setNlpInput('');
    onNLPMessage?.(input);

    try {
      // Step 1: NLP Processing
      addConnection('nlp', 'webllm', 'active', { input });
      const nlpAnalysis = await nlpService.parseInput(input);
      addConnection('nlp', 'webllm', 'active', { analysis: nlpAnalysis });

      // Step 2: WebLLM Enhancement
      if (llmService.isAvailable() && bridgeStatus.webllm) {
        addConnection('webllm', 'metaverse', 'active');
        const llmResponse = await llmService.generateResponse(
          [
            {
              role: 'system',
              content: `You are an AI assistant for a 3D Metaverse Portal. Translate natural language commands into metaverse actions. Current world state: ${JSON.stringify(worldService.getState())}`
            },
            {
              role: 'user',
              content: `User said: "${input}". NLP Analysis: ${JSON.stringify(nlpAnalysis)}. Generate a metaverse action command.`
            }
          ],
          llmProviderConfig
        );
        addConnection('webllm', 'metaverse', 'active', { response: llmResponse });

        // Step 3: TinyML Pattern Prediction
        if (bridgeStatus.tinyml) {
          addConnection('tinyml', 'metaverse', 'active');
          const prediction = tinyMLService.predictNextDimension(
            worldService.getState().avatars.length || 0,
            []
          );
          addConnection('tinyml', 'metaverse', 'active', { prediction });
        }

        // Step 4: Execute Metaverse Action
        addConnection('metaverse', 'nlp', 'active', { action: 'executed' });
        onMetaverseAction?.(nlpAnalysis.intent, nlpAnalysis.parameters);

        // Step 5: Update camera/view based on action
        if (nlpAnalysis.intent === 'view' || nlpAnalysis.intent === 'look') {
          cameraService.applyPreset('overview');
        } else if (nlpAnalysis.intent === 'close') {
          cameraService.applyPreset('close');
        }
      }
    } catch (error) {
      console.error('Bridge processing error:', error);
      addConnection('nlp', 'metaverse', 'error', { error });
    } finally {
      setIsProcessing(false);
    }
  };

  const getBridgeColor = (status: BridgeConnection['status']) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'idle': return '#6b7280'; // gray
      case 'error': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getBridgeLabel = (type: BridgeConnection['from'] | BridgeConnection['to']) => {
    switch (type) {
      case 'nlp': return 'NLP';
      case 'metaverse': return 'Metaverse';
      case 'webllm': return 'WebLLM';
      case 'tinyml': return 'TinyML';
    }
  };

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Wrap in try-catch for initialization errors
  useEffect(() => {
    try {
      // Test if services are available
      if (!nlpService) {
        setError('NLP Service not available');
      }
      if (!llmService) {
        setError('LLM Service not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization error');
    }
  }, []);

  // Show error UI if there's an error
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Metaverse Portal</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <ModernButton
            onClick={() => setError(null)}
            variant="primary"
          >
            Retry
          </ModernButton>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full w-full'}`} 
      style={{ 
        minHeight: '600px', 
        height: '100%', 
        width: '100%',
        backgroundColor: '#1a1a1a',
        position: 'relative'
      }}
      data-testid="metaverse-portal"
    >
      {/* Test: Always visible background - should always show */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        style={{ zIndex: 0 }}
      />
      
      {/* Test text to verify component is rendering */}
      <div className="absolute top-2 left-2 z-50 bg-red-500 text-white px-2 py-1 text-xs">
        MetaversePortal Rendered
      </div>
      
      {/* Loading State */}
      <AnimatePresence>
        {!isWorldReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white text-lg">Loading 3D Metaverse Portal...</p>
              <p className="text-gray-400 text-sm mt-2">Initializing bridges: NLP ↔ WebLLM ↔ TinyML ↔ Metaverse</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Metaverse World - Always render, just control visibility */}
      <div className="absolute inset-0 w-full h-full" style={{ minHeight: '600px', height: '100%', position: 'relative', zIndex: 1 }}>
        <MetaversePortalErrorBoundary>
          <EnhancedVirtualWorld
            config={worldConfig}
            onWorldStateChange={(state) => {
              setIsWorldReady(true);
              // Update bridge status based on world state
              setBridgeStatus(prev => ({
                ...prev,
                metaverse: true // Always true when world is rendered
              }));
            }}
          />
        </MetaversePortalErrorBoundary>
      </div>

      {/* Status Indicator - Always visible */}
      <div className="absolute bottom-4 right-4 z-20 bg-black/80 text-white text-xs p-2 rounded font-mono">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isWorldReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span>{isWorldReady ? 'World Ready' : 'Loading...'}</span>
        </div>
      </div>

      {/* Bridge Visualization Overlay */}
      {showBridgeVisualization && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Bridge Connections</h3>
              </div>
              <div className="flex gap-2">
                <ModernButton
                  onClick={() => setShowBridgeVisualization(false)}
                  variant="ghost"
                  size="sm"
                  icon={<Minimize2 className="w-4 h-4" />}
                />
                <ModernButton
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="ghost"
                  size="sm"
                  icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Bridge Status Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['nlp', 'metaverse', 'webllm', 'tinyml'] as const).map((bridge) => (
                <motion.div
                  key={bridge}
                  className="p-3 bg-white/5 rounded-lg border border-white/10"
                  animate={{
                    borderColor: bridgeStatus[bridge] ? '#10b981' : '#6b7280',
                    backgroundColor: bridgeStatus[bridge] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${bridgeStatus[bridge] ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-white text-sm font-medium">{getBridgeLabel(bridge)}</span>
                  </div>
                  <div className="text-xs text-white/60">
                    {bridgeStatus[bridge] ? 'Connected' : 'Disconnected'}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Active Connections */}
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {connections.slice(0, 5).map((conn) => (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-white/60">{getBridgeLabel(conn.from)}</span>
                  <ArrowRight className="w-3 h-3" style={{ color: getBridgeColor(conn.status) }} />
                  <span className="text-white/60">{getBridgeLabel(conn.to)}</span>
                  <span className="text-white/40 ml-auto">
                    {new Date(conn.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* NLP Input Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Natural Language Interface</h3>
            <ModernBadge variant="info">NLP → WebLLM → Metaverse</ModernBadge>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && processNLPInput(nlpInput)}
              placeholder="Say something... (e.g., 'Show me the overview', 'Create an avatar', 'Move to 3D dimension')"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            />
            <ModernButton
              onClick={() => processNLPInput(nlpInput)}
              disabled={!nlpInput.trim() || isProcessing}
              variant="primary"
              size="md"
              icon={<Send className="w-4 h-4" />}
            >
              Send
            </ModernButton>
            <ModernTooltip content="Voice input (coming soon)" position="top">
              <ModernButton
                variant="secondary"
                size="md"
                icon={<Mic className="w-4 h-4" />}
                disabled
              />
            </ModernTooltip>
          </div>

          {/* Processing Indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </motion.div>
                  Processing through bridge: NLP → WebLLM → Metaverse...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Bridge Status Indicator (Minimized) */}
      {!showBridgeVisualization && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowBridgeVisualization(true)}
          className="absolute top-4 left-4 z-10 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-colors"
        >
          <Network className="w-5 h-5 text-blue-400" />
        </motion.button>
      )}
    </div>
  );
};
