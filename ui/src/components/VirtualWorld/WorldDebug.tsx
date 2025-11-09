/**
 * World Debug Tools
 * Debug visualization and tools
 */

import React, { useState, useEffect } from 'react';
import { Bug, Activity, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { worldService } from '../../services/world-service';
import { WorldMetrics } from '../../services/world-service';
import { GlassCard, ModernButton, ModernBadge } from './ModernUI';

export interface WorldDebugProps {
  enabled?: boolean;
}

export const WorldDebug: React.FC<WorldDebugProps> = ({
  enabled = false
}) => {
  const { gl } = useThree();
  const [metrics, setMetrics] = useState<WorldMetrics>(worldService.getMetrics());
  const [showStats, setShowStats] = useState(false);
  const [showWireframes, setShowWireframes] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleMetricsUpdate = (newMetrics: WorldMetrics) => {
      setMetrics(newMetrics);
    };

    worldService.on('world:metrics-update', handleMetricsUpdate);
    worldService.startMetricsCollection();

    return () => {
      worldService.off('world:metrics-update', handleMetricsUpdate);
      worldService.stopMetricsCollection();
    };
  }, [enabled]);

  useEffect(() => {
    if (showWireframes) {
      gl.setClearColor(0x000000, 0);
      // Enable wireframe mode (would need to traverse scene)
    } else {
      gl.setClearColor(0x87ceeb, 1);
    }
  }, [showWireframes, gl]);

  if (!enabled) return null;

  // WorldDebug must render HTML, so we use Html component from drei
  // But we need to render it outside the Canvas, so we'll create a portal
  return null; // Temporarily disabled - will be rendered outside Canvas
};

// Stat row component
const StatRow: React.FC<{
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}> = ({ label, value, variant = 'default' }) => {
  const colors = {
    default: 'text-white',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-white/70 text-xs">{label}:</span>
      <span className={`${colors[variant]} font-mono font-semibold text-xs`}>{value}</span>
    </div>
  );
};
