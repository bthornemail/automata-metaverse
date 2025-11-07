import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Mic, MicOff, Video, VideoOff, Settings, UserPlus, Globe } from 'lucide-react';

interface Avatar {
  id: string;
  userId: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: string;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  currentDimension: number;
}

interface VoiceChannel {
  id: string;
  name: string;
  participants: string[];
  dimension: number;
  isPrivate: boolean;
}

const MultiplayerMetaverse: React.FC = () => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [currentAvatar, setCurrentAvatar] = useState<Avatar | null>(null);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [worldState, setWorldState] = useState({
    currentDimension: 0,
    time: Date.now(),
    activeUsers: 0,
    totalMutations: 0
  });

  // Initialize multiplayer system
  useEffect(() => {
    // Initialize WebRTC and Networked-Aframe integration
    initializeMultiplayer();
    
    // Create default voice channels for each dimension
    const channels: VoiceChannel[] = [
      { id: '0d-lobby', name: '0D Identity Lobby', participants: [], dimension: 0, isPrivate: false },
      { id: '1d-temporal', name: '1D Temporal Hall', participants: [], dimension: 1, isPrivate: false },
      { id: '2d-structural', name: '2D Structural Space', participants: [], dimension: 2, isPrivate: false },
      { id: '3d-algebra', name: '3D Algebra Room', participants: [], dimension: 3, isPrivate: false },
      { id: '4d-network', name: '4D Network Hub', participants: [], dimension: 4, isPrivate: false },
      { id: '5d-consensus', name: '5D Consensus Chamber', participants: [], dimension: 5, isPrivate: false },
      { id: '6d-intelligence', name: '6D AI Lab', participants: [], dimension: 6, isPrivate: false },
      { id: '7d-quantum', name: '7D Quantum Realm', participants: [], dimension: 7, isPrivate: false },
    ];
    setVoiceChannels(channels);

    return () => {
      // Cleanup WebRTC connections
      cleanupMultiplayer();
    };
  }, []);

  const initializeMultiplayer = async () => {
    try {
      // Initialize WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Get user media for voice/video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Create current user's avatar
      const avatar: Avatar = {
        id: `avatar-${Date.now()}`,
        userId: 'current-user',
        name: 'You',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#3b82f6',
        isSpeaking: false,
        isVideoEnabled: false,
        currentDimension: 0
      };

      setCurrentAvatar(avatar);
      setIsConnected(true);

    } catch (error) {
      console.error('Failed to initialize multiplayer:', error);
      setIsConnected(false);
    }
  };

  const cleanupMultiplayer = () => {
    // Stop all media tracks
    if (currentAvatar) {
      // Cleanup WebRTC connections
    }
    setIsConnected(false);
  };

  const joinVoiceChannel = (channelId: string) => {
    setSelectedChannel(channelId);
    
    // Update avatar position to channel's dimension
    const channel = voiceChannels.find(ch => ch.id === channelId);
    if (channel && currentAvatar) {
      const updatedAvatar = {
        ...currentAvatar,
        currentDimension: channel.dimension,
        position: {
          x: channel.dimension * 2,
          y: 0,
          z: 0
        }
      };
      setCurrentAvatar(updatedAvatar);
      
      // Update world state
      setWorldState(prev => ({
        ...prev,
        currentDimension: channel.dimension
      }));
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (isMicEnabled) {
        // Disable microphone
        setIsMicEnabled(false);
      } else {
        // Enable microphone
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Disable video
        setIsVideoEnabled(false);
      } else {
        // Enable video
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsVideoEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const spawnOtherAvatars = () => {
    // Simulate other users in the metaverse
    const otherAvatars: Avatar[] = [
      {
        id: 'avatar-1',
        userId: 'user-1',
        name: 'Alice',
        position: { x: 1, y: 0, z: 1 },
        rotation: { x: 0, y: 45, z: 0 },
        color: '#ec4899',
        isSpeaking: false,
        isVideoEnabled: false,
        currentDimension: 1
      },
      {
        id: 'avatar-2',
        userId: 'user-2',
        name: 'Bob',
        position: { x: -1, y: 0, z: 1 },
        rotation: { x: 0, y: -45, z: 0 },
        color: '#10b981',
        isSpeaking: true,
        isVideoEnabled: false,
        currentDimension: 2
      },
      {
        id: 'avatar-3',
        userId: 'user-3',
        name: 'Carol',
        position: { x: 0, y: 0, z: -1 },
        rotation: { x: 0, y: 180, z: 0 },
        color: '#f59e0b',
        isSpeaking: false,
        isVideoEnabled: true,
        currentDimension: 3
      }
    ];
    
    setAvatars(otherAvatars);
    setWorldState(prev => ({
      ...prev,
      activeUsers: otherAvatars.length + 1
    }));
  };

  useEffect(() => {
    // Spawn other avatars after connection
    if (isConnected) {
      setTimeout(spawnOtherAvatars, 2000);
    }
  }, [isConnected]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Multiplayer Metaverse</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {worldState.activeUsers} users online
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)]">
        {/* Main 3D Viewport */}
        <div className="flex-1 relative bg-gray-950">
          {/* A-Frame Scene would go here */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-pulse"></div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Dimension {worldState.currentDimension}
              </h4>
              <p className="text-sm text-gray-400">
                {currentAvatar ? `Avatar: ${currentAvatar.name}` : 'Connecting...'}
              </p>
            </div>
          </div>

          {/* Avatar representations */}
          {currentAvatar && (
            <div 
              className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg"
              style={{
                backgroundColor: currentAvatar.color,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-white whitespace-nowrap">
                {currentAvatar.name}
              </div>
            </div>
          )}

          {/* Other avatars */}
          {avatars.map(avatar => (
            <div
              key={avatar.id}
              className="absolute w-6 h-6 rounded-full border border-gray-300 shadow-lg"
              style={{
                backgroundColor: avatar.color,
                left: `${50 + avatar.position.x * 10}%`,
                top: `${50 + avatar.position.z * 10}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 whitespace-nowrap">
                {avatar.name}
              </div>
              {avatar.isSpeaking && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
              {avatar.isVideoEnabled && (
                <div className="absolute -top-8 -right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          ))}

          {/* Voice/Video Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
            <button
              onClick={toggleMicrophone}
              className={`p-2 rounded-lg transition-colors ${
                isMicEnabled 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isMicEnabled ? (
                <Mic className="w-4 h-4 text-white" />
              ) : (
                <MicOff className="w-4 h-4 text-gray-300" />
              )}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-lg transition-colors ${
                isVideoEnabled 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <VideoOff className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Voice Channels Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Voice Channels</h4>
            <button className="p-1 rounded hover:bg-gray-700 transition-colors">
              <UserPlus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-2">
            {voiceChannels.map(channel => (
              <motion.div
                key={channel.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => joinVoiceChannel(channel.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedChannel === channel.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs opacity-75">
                        {channel.participants.length} participants • {channel.dimension}D
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">{channel.participants.length}</span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* World State */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h5 className="text-sm font-semibold text-white mb-2">World State</h5>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Current Dimension:</span>
                <span className="font-mono">{worldState.currentDimension}D</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-mono">{worldState.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Mutations:</span>
                <span className="font-mono">{worldState.totalMutations}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className={`font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-white mb-4">Multiplayer Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar Name
                </label>
                <input
                  type="text"
                  defaultValue={currentAvatar?.name || 'You'}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar Color
                </label>
                <input
                  type="color"
                  defaultValue={currentAvatar?.color || '#3b82f6'}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voice Sensitivity
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default MultiplayerMetaverse;