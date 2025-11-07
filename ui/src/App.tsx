import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, MessageSquare, History, Zap, Sparkles, Cog, Brain } from 'lucide-react';
import { AutomatonProvider } from '@/contexts/AutomatonContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ToastContainer } from '@/components/shared/Toast';
import { useAutomatonStore } from '@/store/automatonStore';
import Dashboard from '@/components/Dashboard/Dashboard';
import DimensionalCanvas from '@/components/DimensionalCanvas/DimensionalCanvas';
import ControlPanel from '@/components/ControlPanel/ControlPanel';
import SelfReferenceAnalyzer from '@/components/SelfReferenceAnalyzer/SelfReferenceAnalyzer';
import ExecutionHistory from '@/components/ExecutionHistory/ExecutionHistory';
import AgentInterface from '@/components/AgentInterface/AgentInterface';
import QuantumVisualization from '@/components/QuantumVisualization/QuantumVisualization';
import CircuitBuilder from '@/components/QuantumVisualization/CircuitBuilder';
import AdvancedAnimations from '@/components/AdvancedAnimations/AdvancedAnimations';
import WebGLDimensionalVisualization from '@/components/AdvancedAnimations/WebGLDimensionalVisualization';
import MultiplayerMetaverse from '@/components/AdvancedAnimations/MultiplayerMetaverse';
import WebLLMEvolution from '@/components/AdvancedAnimations/WebLLMEvolution';
import MetaverseInterface from '@/components/AdvancedAnimations/MetaverseInterface';
import Configuration from '@/components/Configuration/Configuration';
import OpenCodeInterface from './components/OpenCodeInterface/OpenCodeInterface';

console.log('App.tsx: OpenCodeInterface imported:', OpenCodeInterface);

const AppContent: React.FC = () => {
  const activeTab = useAutomatonStore((state) => state.activeTab);
  const setActiveTab = useAutomatonStore((state) => state.setActiveTab);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analysis', label: 'Self-Reference', icon: Eye },
    { id: 'history', label: 'History', icon: History },
    { id: 'agents', label: 'Agents', icon: MessageSquare },
    { id: 'quantum', label: 'Quantum', icon: Zap },
    { id: 'animations', label: 'Animations', icon: Sparkles },
    { id: 'webgl', label: 'WebGL 3D', icon: Brain },
    { id: 'multiplayer', label: 'Multiplayer', icon: Brain },
    { id: 'evolution', label: 'AI Evolution', icon: Brain },
    { id: 'metaverse', label: 'Metaverse', icon: Brain },
    { id: 'opencode', label: 'OpenCode', icon: Brain },
    { id: 'config', label: 'Config', icon: Cog }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-lg"></div>
              Self-Referencing Automaton Interface
            </h1>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Phase 3: Quantum Visualization</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="container mx-auto px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                       ? 'border-[#6366f1] text-white bg-[#6366f1]/10'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Dashboard */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Dashboard />
              </motion.div>
            </div>

            {/* Right Column - Canvas and Controls */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <DimensionalCanvas />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ControlPanel />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Self-Reference Analysis Tab */}
        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <SelfReferenceAnalyzer />
          </motion.div>
        )}

        {/* Execution History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <ExecutionHistory />
          </motion.div>
        )}

        {/* Agent Interface Tab */}
        {activeTab === 'agents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-280px)] max-w-6xl mx-auto"
          >
            <AgentInterface />
          </motion.div>
        )}

        {/* Quantum Visualization Tab */}
        {activeTab === 'quantum' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            <QuantumVisualization />
            <CircuitBuilder />
          </motion.div>
        )}

        {/* Advanced Animations Tab */}
        {activeTab === 'animations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <AdvancedAnimations />
          </motion.div>
        )}

        {/* WebGL 3D Visualization Tab */}
        {activeTab === 'webgl' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <WebGLDimensionalVisualization />
          </motion.div>
        )}

        {/* Multiplayer Metaverse Tab */}
        {activeTab === 'multiplayer' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <MultiplayerMetaverse />
          </motion.div>
        )}

        {/* AI Evolution Tab */}
        {activeTab === 'evolution' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <WebLLMEvolution />
          </motion.div>
        )}

        {/* Metaverse Interface Tab */}
        {activeTab === 'metaverse' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <MetaverseInterface />
          </motion.div>
        )}

        {/* OpenCode Tab */}
        {activeTab === 'opencode' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <OpenCodeInterface />
          </motion.div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <Configuration />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Self-Referencing JSONL Automaton • 8-Dimensional Church Encoding
            </div>
            <div>
              Meta-Circular Evaluator • Quantum Visualization & Advanced Analytics
            </div>
          </div>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  // Test connections on mount
  React.useEffect(() => {
    import('./utils/connection-test').then(({ testConnections, logConnectionStatus }) => {
      testConnections().then(logConnectionStatus);
    });
  }, []);

  return (
    <ErrorBoundary>
      <AutomatonProvider>
        <AppContent />
      </AutomatonProvider>
    </ErrorBoundary>
  );
};

export default App;