/**
 * World Settings Component
 * Configuration UI for world settings
 */

import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { worldService, WorldSettings as WorldSettingsType } from '../../services/world-service';
import { ModernPanel, ModernInput, ModernToggle } from './ModernUI';

export interface WorldSettingsProps {
  visible?: boolean;
  onClose?: () => void;
}

export const WorldSettings: React.FC<WorldSettingsProps> = ({
  visible = false,
  onClose
}) => {
  const [settings, setSettings] = useState<WorldSettingsType>(worldService.getSettings());
  const [activeTab, setActiveTab] = useState<'performance' | 'rendering' | 'world' | 'multiplayer' | 'debug'>('performance');

  useEffect(() => {
    setSettings(worldService.getSettings());
  }, [visible]);

  const updateSetting = <K extends keyof WorldSettingsType>(key: K, value: WorldSettingsType[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    worldService.setSettings({ [key]: value });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
          >
            <ModernPanel
              title="World Settings"
              icon={<Settings className="w-5 h-5" />}
              onClose={onClose}
              className="flex flex-col h-full"
            >
              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-white/10">
                {(['performance', 'rendering', 'world', 'multiplayer', 'debug'] as const).map(tab => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                        layoutId="activeTab"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {activeTab === 'performance' && (
                      <>
                        <ModernInput
                          label="Max Avatars"
                          value={settings.maxAvatars ?? 50}
                          onChange={(v) => updateSetting('maxAvatars', v)}
                          type="number"
                          min={1}
                          max={200}
                        />
                        <ModernInput
                          label="Max Buildings"
                          value={settings.maxBuildings ?? 100}
                          onChange={(v) => updateSetting('maxBuildings', v)}
                          type="number"
                          min={1}
                          max={500}
                        />
                        <ModernToggle
                          label="Enable LOD"
                          checked={settings.enableLOD ?? true}
                          onChange={(v) => updateSetting('enableLOD', v)}
                          description="Level-of-Detail optimization for distant objects"
                        />
                        <ModernToggle
                          label="Enable Frustum Culling"
                          checked={settings.enableFrustumCulling ?? true}
                          onChange={(v) => updateSetting('enableFrustumCulling', v)}
                          description="Hide objects outside camera view"
                        />
                        <ModernToggle
                          label="Enable Object Pooling"
                          checked={settings.enableObjectPooling ?? true}
                          onChange={(v) => updateSetting('enableObjectPooling', v)}
                          description="Reuse objects to reduce allocations"
                        />
                      </>
                    )}

                    {activeTab === 'rendering' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-1.5">
                            Shadow Quality
                          </label>
                          <select
                            value={settings.shadowQuality ?? 'medium'}
                            onChange={(e) => updateSetting('shadowQuality', e.target.value as any)}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            {['low', 'medium', 'high'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <ModernInput
                          label="Particle Count"
                          value={settings.particleCount ?? 1000}
                          onChange={(v) => updateSetting('particleCount', v)}
                          type="range"
                          min={0}
                          max={10000}
                          step={100}
                        />
                        <ModernToggle
                          label="Enable Post-Processing"
                          checked={settings.enablePostProcessing ?? false}
                          onChange={(v) => updateSetting('enablePostProcessing', v)}
                          description="Advanced visual effects"
                        />
                      </>
                    )}

                    {activeTab === 'world' && (
                      <>
                        <ModernInput
                          label="World Size"
                          value={settings.worldSize ?? 200}
                          onChange={(v) => updateSetting('worldSize', v)}
                          type="range"
                          min={50}
                          max={1000}
                          step={50}
                        />
                        <ModernInput
                          label="Zone Count"
                          value={settings.zoneCount ?? 5}
                          onChange={(v) => updateSetting('zoneCount', v)}
                          type="number"
                          min={1}
                          max={20}
                        />
                        <ModernToggle
                          label="Enable Weather"
                          checked={settings.enableWeather ?? true}
                          onChange={(v) => updateSetting('enableWeather', v)}
                          description="Dynamic weather effects"
                        />
                        <ModernToggle
                          label="Enable Day/Night Cycle"
                          checked={settings.enableDayNightCycle ?? true}
                          onChange={(v) => updateSetting('enableDayNightCycle', v)}
                          description="Automatic day and night transitions"
                        />
                      </>
                    )}

                    {activeTab === 'multiplayer' && (
                      <>
                        <ModernToggle
                          label="Enable Multiplayer"
                          checked={settings.enableMultiplayer ?? false}
                          onChange={(v) => updateSetting('enableMultiplayer', v)}
                          description="Synchronize with other players"
                        />
                        <ModernInput
                          label="Sync Interval (ms)"
                          value={settings.syncInterval ?? 100}
                          onChange={(v) => updateSetting('syncInterval', v)}
                          type="range"
                          min={10}
                          max={1000}
                          step={10}
                        />
                      </>
                    )}

                    {activeTab === 'debug' && (
                      <>
                        <ModernToggle
                          label="Enable Debug"
                          checked={settings.enableDebug ?? false}
                          onChange={(v) => updateSetting('enableDebug', v)}
                          description="Show debug information"
                        />
                        <ModernToggle
                          label="Show Stats"
                          checked={settings.showStats ?? false}
                          onChange={(v) => updateSetting('showStats', v)}
                          description="Display performance statistics"
                        />
                        <ModernToggle
                          label="Show Wireframes"
                          checked={settings.showWireframes ?? false}
                          onChange={(v) => updateSetting('showWireframes', v)}
                          description="Render objects as wireframes"
                        />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ModernPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

