/**
 * World Persistence
 * Save and load world state
 */

import React, { useState, useCallback } from 'react';
import { Save, Upload, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { worldService, WorldState } from '../../services/world-service';
import { ModernButton, GlassCard, ModernBadge, ModernTooltip } from './ModernUI';

export interface WorldPersistenceProps {
  onSave?: (state: WorldState) => void;
  onLoad?: (state: WorldState) => void;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export const WorldPersistence: React.FC<WorldPersistenceProps> = ({
  onSave,
  onLoad,
  autoSave = false,
  autoSaveInterval = 60000 // 1 minute
}) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Save world state
  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      const json = worldService.save();
      const state = worldService.getState();
      
      // Save to localStorage
      localStorage.setItem('virtual-world-state', json);
      localStorage.setItem('virtual-world-timestamp', Date.now().toString());
      
      setLastSaved(new Date());
      onSave?.(state);
    } catch (error) {
      console.error('Failed to save world:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  // Load world state
  const handleLoad = useCallback(() => {
    setLoading(true);
    try {
      const json = localStorage.getItem('virtual-world-state');
      if (json) {
        worldService.load(json);
        const state = worldService.getState();
        onLoad?.(state);
      }
    } catch (error) {
      console.error('Failed to load world:', error);
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  // Download world state as file
  const handleDownload = useCallback(() => {
    try {
      const json = worldService.save();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `virtual-world-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download world:', error);
    }
  }, []);

  // Upload world state from file
  const handleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        worldService.load(json);
        const state = worldService.getState();
        onLoad?.(state);
      } catch (error) {
        console.error('Failed to upload world:', error);
      }
    };
    reader.readAsText(file);
  }, [onLoad]);

  // Clear world state
  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the world state?')) {
      localStorage.removeItem('virtual-world-state');
      localStorage.removeItem('virtual-world-timestamp');
    }
  }, []);

  // Auto-save
  React.useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      handleSave();
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, handleSave]);

  return (
    <GlassCard className="absolute bottom-4 right-4 p-3">
      <div className="flex gap-2 flex-wrap">
        <ModernTooltip content="Save to localStorage" position="top">
          <ModernButton
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            aria-label="Save to localStorage"
          >
            {/* Icon-only button */}
          </ModernButton>
        </ModernTooltip>

        <ModernTooltip content="Load from localStorage" position="top">
          <ModernButton
            onClick={handleLoad}
            disabled={loading}
            variant="secondary"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            aria-label="Load from localStorage"
          >
            {/* Icon-only button */}
          </ModernButton>
        </ModernTooltip>

        <ModernTooltip content="Download as file" position="top">
          <ModernButton
            onClick={handleDownload}
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            aria-label="Download as file"
          >
            {/* Icon-only button */}
          </ModernButton>
        </ModernTooltip>

        <ModernTooltip content="Upload from file" position="top">
          <label>
            <input
              type="file"
              accept=".json"
              onChange={handleUpload}
              className="hidden"
              aria-label="Upload from file"
            />
            <ModernButton
              variant="secondary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              aria-label="Upload from file"
            >
              {/* Icon-only button */}
            </ModernButton>
          </label>
        </ModernTooltip>

        <ModernTooltip content="Clear world state" position="top">
          <ModernButton
            onClick={handleClear}
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            aria-label="Clear world state"
          >
            {/* Icon-only button */}
          </ModernButton>
        </ModernTooltip>
      </div>

      {lastSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-white/60 text-center flex items-center justify-center gap-2"
        >
          <ModernBadge variant="success" className="text-xs">
            Saved
          </ModernBadge>
          <span>{lastSaved.toLocaleTimeString()}</span>
        </motion.div>
      )}
    </GlassCard>
  );
};
