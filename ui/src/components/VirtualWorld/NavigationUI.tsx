/**
 * Navigation UI Components
 * Compass, waypoint list, teleport menu, and navigation controls
 */

import React, { useState } from 'react';
import { Compass, MapPin, Navigation, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waypoint } from './VirtualWorldNavigation';
import { useWorldLayout } from './WorldLayoutManager';
import { GlassCard, ModernButton, ModernPanel, ModernBadge, ModernTooltip } from './ModernUI';

export interface NavigationUIProps {
  waypoints?: Waypoint[];
  currentPosition?: [number, number, number];
  currentRotation?: number; // Rotation in radians
  onWaypointClick?: (waypoint: Waypoint) => void;
  onTeleport?: (position: [number, number, number]) => void;
  showCompass?: boolean;
  showWaypointList?: boolean;
  showTeleportMenu?: boolean;
}

export const NavigationUI: React.FC<NavigationUIProps> = ({
  waypoints = [],
  currentPosition,
  currentRotation = 0,
  onWaypointClick,
  onTeleport,
  showCompass = true,
  showWaypointList = true,
  showTeleportMenu = true
}) => {
  const { layout } = useWorldLayout();
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showTeleport, setShowTeleport] = useState(false);

  const allWaypoints = [
    ...layout.landmarks.map(l => ({
      id: l.id,
      name: l.name,
      position: l.position,
      type: l.type,
      zoneId: l.zoneId
    })),
    ...waypoints
  ];

  return (
    <>
      {/* Compass */}
      {showCompass && (
        <CompassComponent
          rotation={currentRotation}
          position={currentPosition}
        />
      )}

      {/* Waypoint List */}
      {showWaypointList && (
        <WaypointList
          waypoints={allWaypoints}
          visible={showWaypoints}
          onToggle={() => setShowWaypoints(!showWaypoints)}
          onWaypointClick={onWaypointClick}
        />
      )}

      {/* Teleport Menu */}
      {showTeleportMenu && (
        <TeleportMenu
          waypoints={allWaypoints}
          visible={showTeleport}
          onToggle={() => setShowTeleport(!showTeleport)}
          onTeleport={onTeleport}
        />
      )}
    </>
  );
};

// Compass component
const CompassComponent: React.FC<{
  rotation: number;
  position?: [number, number, number];
}> = ({ rotation, position }) => {
  const compassRotation = -rotation * (180 / Math.PI);

  return (
    <GlassCard className="absolute top-4 left-4 p-4">
      <div className="relative w-24 h-24">
        {/* Compass ring with gradient */}
        <div className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-blue-500/50 to-purple-500/50 bg-gradient-to-br from-white/5 to-white/0">
          {/* Direction markers */}
          {['N', 'E', 'S', 'W'].map((dir, i) => {
            const angle = (i * 90 - 90) * (Math.PI / 180);
            const x = Math.cos(angle) * 38;
            const y = Math.sin(angle) * 38;
            return (
              <div
                key={dir}
                className="absolute text-white/60 font-bold text-xs"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%) rotate(${compassRotation}deg)`,
                  transformOrigin: 'center'
                }}
              >
                {dir}
              </div>
            );
          })}
          {/* Needle */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${compassRotation}deg)`,
              transformOrigin: 'center'
            }}
            animate={{ rotate: compassRotation }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-red-500 drop-shadow-lg"></div>
          </motion.div>
        </div>
        {/* Center dot with glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50"></div>
      </div>
      {/* Coordinates */}
      {position && (
        <motion.div
          className="mt-3 text-xs text-white/70 text-center font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {position[0].toFixed(1)}, {position[2].toFixed(1)}
        </motion.div>
      )}
    </GlassCard>
  );
};

// Waypoint list component
const WaypointList: React.FC<{
  waypoints: Waypoint[];
  visible: boolean;
  onToggle: () => void;
  onWaypointClick?: (waypoint: Waypoint) => void;
}> = ({ waypoints, visible, onToggle, onWaypointClick }) => {
  return (
    <div className="absolute top-4 right-4 z-10">
      <ModernTooltip content="Waypoints" position="left">
        <ModernButton
          onClick={onToggle}
          variant="secondary"
          size="md"
          icon={<MapPin className="w-4 h-4" />}
        >
          {waypoints.length > 0 && (
            <ModernBadge variant="info" className="ml-1">
              {waypoints.length}
            </ModernBadge>
          )}
        </ModernButton>
      </ModernTooltip>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            <ModernPanel
              title="Waypoints"
              icon={<MapPin className="w-5 h-5" />}
              onClose={onToggle}
              className="w-80 max-h-96"
            >
              <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                {waypoints.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No waypoints available</p>
                  </div>
                ) : (
                  waypoints.map(waypoint => {
                    const colorMap = {
                      spawn: 'success',
                      portal: 'info',
                      landmark: 'warning'
                    } as const;
                    const badgeVariant = colorMap[waypoint.type || 'landmark'] || 'default';

                    return (
                      <motion.button
                        key={waypoint.id}
                        onClick={() => {
                          onWaypointClick?.(waypoint);
                          onToggle();
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors group"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <ModernBadge variant={badgeVariant}>
                            {waypoint.type || 'landmark'}
                          </ModernBadge>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{waypoint.name}</div>
                            {waypoint.zoneId && (
                              <div className="text-xs text-white/50 mt-0.5">{waypoint.zoneId}</div>
                            )}
                          </div>
                          <Navigation className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </ModernPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Teleport menu component
const TeleportMenu: React.FC<{
  waypoints: Waypoint[];
  visible: boolean;
  onToggle: () => void;
  onTeleport?: (position: [number, number, number]) => void;
}> = ({ waypoints, visible, onToggle, onTeleport }) => {
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <ModernTooltip content="Teleport" position="right">
        <ModernButton
          onClick={onToggle}
          variant="secondary"
          size="md"
          icon={<Zap className="w-4 h-4" />}
        />
      </ModernTooltip>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            <ModernPanel
              title="Teleport"
              icon={<Zap className="w-5 h-5" />}
              onClose={onToggle}
              className="w-80"
            >
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {waypoints.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No teleport destinations</p>
                  </div>
                ) : (
                  waypoints.map(waypoint => (
                    <motion.button
                      key={waypoint.id}
                      onClick={() => {
                        onTeleport?.(waypoint.position);
                        onToggle();
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all group"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                          <Navigation className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{waypoint.name}</div>
                          <div className="text-xs text-white/50 font-mono mt-0.5">
                            {waypoint.position.map(p => p.toFixed(1)).join(', ')}
                          </div>
                        </div>
                        <Zap className="w-4 h-4 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </ModernPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
