import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, MessageSquare, History, Zap, Sparkles, Cog, Brain, Code, Layers } from 'lucide-react';
import { AutomatonProvider } from '@/contexts/AutomatonContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ToastContainer } from '@/components/shared/Toast';
import { useAutomatonStore } from '@/store/automatonStore';
import Dashboard from '@/components/Dashboard/Dashboard';
import ControlPanel from '@/components/ControlPanel/ControlPanel';
import SelfReferenceAnalyzer from '@/components/SelfReferenceAnalyzer/SelfReferenceAnalyzer';
import AIPortal from '@/components/AIPortal/AIPortal';
import MetaverseInterface from '@/components/AdvancedAnimations/MetaverseInterface';
import Configuration from '@/components/Configuration/Configuration';
import UnifiedEditor from './components/UnifiedEditor';

const AppContent: React.FC = () => {
  const activeTab = useAutomatonStore((state) => state.activeTab);
  const setActiveTab = useAutomatonStore((state) => state.setActiveTab);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analysis', label: 'Self-Reference', icon: Eye },
    { id: 'ai-portal', label: 'AI Portal', icon: Brain },
    { id: 'canvas-editor', label: 'Canvas Editor', icon: Layers },
    { id: 'code-editor', label: 'Code Editor', icon: Code },
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
      <nav className="bg-gray-800/50 border-b border-gray-700" aria-label="Main navigation">
        <div className="container mx-auto px-6">
          <div className="flex gap-2" role="tablist" aria-label="Application tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                       ? 'border-[#6366f1] text-white bg-[#6366f1]/10'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            id="tabpanel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard />
            </motion.div>

            {/* Bottom Row - Control Panel (Dimensional Canvas merged into WebGL) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ControlPanel />
            </motion.div>
          </motion.div>
        )}

        {/* Self-Reference Analysis Tab */}
        {activeTab === 'analysis' && (
          <motion.div
            id="tabpanel-analysis"
            role="tabpanel"
            aria-labelledby="tab-analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <SelfReferenceAnalyzer />
          </motion.div>
        )}

        {/* AI Portal Tab - Unified Agent Communication & Evolution */}
        {activeTab === 'ai-portal' && (
          <motion.div
            id="tabpanel-ai-portal"
            role="tabpanel"
            aria-labelledby="tab-ai-portal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-280px)] max-w-7xl mx-auto"
          >
            <AIPortal />
          </motion.div>
        )}

        {/* Canvas Editor Tab - Dedicated Canvas Editor */}
        {activeTab === 'canvas-editor' && (
          <motion.div
            id="tabpanel-canvas-editor"
            role="tabpanel"
            aria-labelledby="tab-canvas-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-200px)] rounded-xl overflow-hidden shadow-xl"
          >
            <UnifiedEditor
              filename="automaton.canvasl"
              initialMode="canvas"
              height="100%"
            />
          </motion.div>
        )}

        {/* Code Editor Tab - Unified Editor (Code + Canvas) */}
        {activeTab === 'code-editor' && (
          <motion.div
            id="tabpanel-code-editor"
            role="tabpanel"
            aria-labelledby="tab-code-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-200px)] rounded-xl overflow-hidden shadow-xl"
          >
            <UnifiedEditor
              filename="editor.code"
              initialMode="auto"
              height="100%"
            />
          </motion.div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <motion.div
            id="tabpanel-config"
            role="tabpanel"
            aria-labelledby="tab-config"
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