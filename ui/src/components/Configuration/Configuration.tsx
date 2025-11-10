import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, Upload, RotateCcw, Settings, Monitor, Zap, Database } from 'lucide-react';
import { apiService } from '@/services/api';

interface ConfigOption {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  value: any;
  options?: string[];
  description: string;
  category: 'general' | 'automaton' | 'visualization' | 'advanced';
}

interface ConfigurationProps {
  className?: string;
}

const Configuration: React.FC<ConfigurationProps> = ({ className = '' }) => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'automaton' | 'visualization' | 'advanced'>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const defaultConfig: Record<string, ConfigOption> = {
    // General
    'app.theme': {
      key: 'app.theme',
      label: 'Theme',
      type: 'select',
      value: 'dark',
      options: ['light', 'dark', 'auto'],
      description: 'Choose the application theme',
      category: 'general'
    },
    'app.language': {
      key: 'app.language',
      label: 'Language',
      type: 'select',
      value: 'en',
      options: ['en', 'es', 'fr', 'de', 'zh'],
      description: 'Interface language',
      category: 'general'
    },
    'app.autoSave': {
      key: 'app.autoSave',
      label: 'Auto Save',
      type: 'boolean',
      value: true,
      description: 'Automatically save configuration changes',
      category: 'general'
    },

    // Automaton
    'automaton.intervalMs': {
      key: 'automaton.intervalMs',
      label: 'Execution Interval (ms)',
      type: 'number',
      value: 2000,
      description: 'Time between automaton iterations',
      category: 'automaton'
    },
    'automaton.maxIterations': {
      key: 'automaton.maxIterations',
      label: 'Max Iterations',
      type: 'number',
      value: 1000,
      description: 'Maximum number of iterations (0 = unlimited)',
      category: 'automaton'
    },
    'automaton.useOllama': {
      key: 'automaton.useOllama',
      label: 'Use Ollama',
      type: 'boolean',
      value: false,
      description: 'Enable Ollama AI integration',
      category: 'automaton'
    },
    'automaton.model': {
      key: 'automaton.model',
      label: 'AI Model',
      type: 'select',
      value: 'llama2',
      options: ['llama2', 'codellama', 'mistral', 'vicuna'],
      description: 'AI model for intelligent operations',
      category: 'automaton'
    },
    'automaton.automatonFile': {
      key: 'automaton.automatonFile',
      label: 'Automaton File',
      type: 'string',
      value: './automaton.jsonl',
      description: 'Path to the automaton JSONL file',
      category: 'automaton'
    },

    // Visualization
    'viz.animationSpeed': {
      key: 'viz.animationSpeed',
      label: 'Animation Speed',
      type: 'number',
      value: 1.0,
      description: 'Multiplier for animation speeds',
      category: 'visualization'
    },
    'viz.particleCount': {
      key: 'viz.particleCount',
      label: 'Particle Count',
      type: 'number',
      value: 50,
      description: 'Number of particles in animations',
      category: 'visualization'
    },
    'viz.showTransitions': {
      key: 'viz.showTransitions',
      label: 'Show Transitions',
      type: 'boolean',
      value: true,
      description: 'Animate dimensional transitions',
      category: 'visualization'
    },
    'viz.quantumQuality': {
      key: 'viz.quantumQuality',
      label: 'Quantum Quality',
      type: 'select',
      value: 'high',
      options: ['low', 'medium', 'high', 'ultra'],
      description: 'Rendering quality for quantum visualizations',
      category: 'visualization'
    },

    // Advanced
    'advanced.debugMode': {
      key: 'advanced.debugMode',
      label: 'Debug Mode',
      type: 'boolean',
      value: false,
      description: 'Enable debug logging and features',
      category: 'advanced'
    },
    'advanced.experimentalFeatures': {
      key: 'advanced.experimentalFeatures',
      label: 'Experimental Features',
      type: 'boolean',
      value: false,
      description: 'Enable experimental and unstable features',
      category: 'advanced'
    },
    'advanced.maxHistory': {
      key: 'advanced.maxHistory',
      label: 'Max History Entries',
      type: 'number',
      value: 1000,
      description: 'Maximum number of history entries to keep',
      category: 'advanced'
    },
    'advanced.backupInterval': {
      key: 'advanced.backupInterval',
      label: 'Backup Interval (min)',
      type: 'number',
      value: 30,
      description: 'Automatic backup interval in minutes',
      category: 'advanced'
    }
  };

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConfig();
      
      if (response.success && response.data) {
        const loadedConfig = response.data;
        const mergedConfig = { ...defaultConfig };
        
        // Merge with loaded config
        Object.keys(loadedConfig).forEach(key => {
          if (mergedConfig[key]) {
            mergedConfig[key] = { ...mergedConfig[key], value: loadedConfig[key] };
          }
        });
        
        setConfig(mergedConfig);
      } else {
        // Use default config
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      // Extract values from config
      const configToSave: Record<string, any> = {};
      Object.values(config).forEach(option => {
        configToSave[option.key] = option.value;
      });
      
      const response = await apiService.updateConfig(configToSave);
      
      if (response.success) {
        setHasChanges(false);
        // Show success message
      } else {
        // Show error message
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetConfiguration = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const exportConfiguration = () => {
    const configToExport: Record<string, any> = {};
    Object.values(config).forEach(option => {
      configToExport[option.key] = option.value;
    });
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automaton-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        const mergedConfig = { ...defaultConfig };
        
        Object.keys(importedConfig).forEach(key => {
          if (mergedConfig[key]) {
            mergedConfig[key] = { ...mergedConfig[key], value: importedConfig[key] };
          }
        });
        
        setConfig(mergedConfig);
        setHasChanges(true);
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  };

  const updateConfigValue = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
    setHasChanges(true);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'automaton', label: 'Automaton', icon: Zap },
    { id: 'visualization', label: 'Visualization', icon: Monitor },
    { id: 'advanced', label: 'Advanced', icon: Database }
  ];

  const filteredOptions = Object.values(config).filter(option => option.category === activeTab);

  const renderConfigOption = (option: ConfigOption) => {
    const handleChange = (value: any) => {
      updateConfigValue(option.key, value);
    };

    switch (option.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2" htmlFor={`config-${option.key}`}>
            <input
              id={`config-${option.key}`}
              type="checkbox"
              checked={option.value}
              onChange={(e) => handleChange(e.target.checked)}
              className="rounded"
              aria-label={option.label}
            />
            <span className="text-gray-300">
              {option.value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'number':
        return (
          <input
            id={`config-${option.key}`}
            type="number"
            value={option.value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg"
            aria-label={option.label}
            aria-describedby={`config-${option.key}-desc`}
          />
        );

      case 'string':
        return (
          <input
            id={`config-${option.key}`}
            type="text"
            value={option.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg"
            aria-label={option.label}
            aria-describedby={`config-${option.key}-desc`}
          />
        );

      case 'select':
        return (
          <select
            id={`config-${option.key}`}
            value={option.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg"
            aria-label={option.label}
            aria-describedby={`config-${option.key}-desc`}
          >
            {option.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      default:
        return <div>Unknown option type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-800 rounded-xl shadow-xl ${className}`} data-testid="configuration">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-green-400" />
          Configuration Management
        </h3>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-yellow-400 text-sm mr-2">Unsaved changes</span>
          )}
          
          <button
            onClick={saveConfiguration}
            disabled={saving || !hasChanges}
            aria-label={saving ? 'Saving configuration' : 'Save configuration'}
            className="control-button bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
          
          <button
            onClick={resetConfiguration}
            className="control-button bg-gray-600 hover:bg-gray-700 text-white"
            aria-label="Reset configuration to defaults"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Reset</span>
          </button>
          
          <button
            onClick={exportConfiguration}
            className="control-button bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Export configuration"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Export</span>
          </button>
          
          <label className="control-button bg-purple-600 hover:bg-purple-700 text-white cursor-pointer" aria-label="Import configuration">
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importConfiguration}
              className="hidden"
              aria-label="Import configuration file"
            />
          </label>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Configuration categories">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`config-tabpanel-${tab.id}`}
              aria-label={`${tab.label} configuration settings`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Configuration Options */}
      <motion.div
        key={activeTab}
        id={`config-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`config-tab-${activeTab}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {filteredOptions.map((option) => (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <label className="block text-white font-medium mb-1" htmlFor={`config-${option.key}`}>
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-400 mb-3" id={`config-${option.key}-desc`}>
                    {option.description}
                  </p>
                </div>
                <div className="w-48 ml-4">
                  {renderConfigOption(option)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Status Bar */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            Configuration loaded successfully
          </div>
          <div>
            {Object.keys(config).length} options available
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;