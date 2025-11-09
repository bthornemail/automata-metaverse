/**
 * Avatar Customization Panel
 * Advanced avatar customization with body types, appearance, accessories, and animations
 */

import React, { useState, useEffect } from 'react';
import { metaversePortalService, AvatarCustomization } from '../../services/metaverse-portal-service';

interface AvatarCustomizationPanelProps {
  userId: string;
  onSave?: (customization: AvatarCustomization) => void;
  onCancel?: () => void;
  className?: string;
}

export const AvatarCustomizationPanel: React.FC<AvatarCustomizationPanelProps> = ({
  userId,
  onSave,
  onCancel,
  className = ''
}) => {
  const [customization, setCustomization] = useState<Partial<AvatarCustomization>>({
    name: 'My Avatar',
    bodyType: 'humanoid',
    appearance: {
      skinColor: '#fdbcb4',
      hairColor: '#4a4a4a',
      eyeColor: '#4a90e2',
      clothing: {
        type: 'casual',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        pattern: 'solid'
      },
      accessories: []
    },
    animations: {
      idle: 'idle',
      walk: 'walk',
      run: 'run',
      jump: 'jump',
      gesture: ['wave', 'point', 'thumbs_up']
    },
    proportions: {
      height: 1.0,
      width: 1.0,
      headSize: 1.0
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'clothing' | 'accessories' | 'animations' | 'proportions'>('appearance');

  useEffect(() => {
    loadExistingCustomization();
  }, [userId]);

  const loadExistingCustomization = async () => {
    try {
      const existing = await metaversePortalService.getAvatarCustomization(userId);
      if (existing) {
        setCustomization(existing);
      }
    } catch (error) {
      console.error('Failed to load existing customization:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let saved: AvatarCustomization;
      
      if (customization.id) {
        saved = await metaversePortalService.updateAvatarCustomization(customization.id, customization);
      } else {
        saved = await metaversePortalService.createAvatarCustomization(userId, customization);
      }
      
      onSave?.(saved);
    } catch (error) {
      console.error('Failed to save customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomization = (updates: Partial<AvatarCustomization>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  };

  const updateAppearance = (updates: Partial<AvatarCustomization['appearance']>) => {
    setCustomization(prev => ({
      ...prev,
      appearance: { ...prev.appearance!, ...updates }
    }));
  };

  const updateClothing = (updates: Partial<AvatarCustomization['appearance']['clothing']>) => {
    setCustomization(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance!,
        clothing: { ...prev.appearance!.clothing, ...updates }
      }
    }));
  };

  const updateProportions = (updates: Partial<AvatarCustomization['proportions']>) => {
    setCustomization(prev => ({
      ...prev,
      proportions: { ...prev.proportions!, ...updates }
    }));
  };

  const addAccessory = (type: string, color: string = '#ffffff') => {
    const accessory = {
      type: type as any,
      color,
      position: [0, 0, 0] as [number, number, number]
    };
    
    setCustomization(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance!,
        accessories: [...(prev.appearance?.accessories || []), accessory]
      }
    }));
  };

  const removeAccessory = (index: number) => {
    setCustomization(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance!,
        accessories: prev.appearance?.accessories?.filter((_, i) => i !== index) || []
      }
    }));
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl mx-auto ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Avatar Customization</h2>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Avatar Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Avatar Name</label>
        <input
          type="text"
          value={customization.name || ''}
          onChange={(e) => updateCustomization({ name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Body Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Body Type</label>
        <select
          value={customization.bodyType || 'humanoid'}
          onChange={(e) => updateCustomization({ bodyType: e.target.value as any })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="humanoid">Humanoid</option>
          <option value="abstract">Abstract</option>
          <option value="geometric">Geometric</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-700">
        {(['appearance', 'clothing', 'accessories', 'animations', 'proportions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Skin Color</label>
              <input
                type="color"
                value={customization.appearance?.skinColor || '#fdbcb4'}
                onChange={(e) => updateAppearance({ skinColor: e.target.value })}
                className="w-full h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hair Color</label>
              <input
                type="color"
                value={customization.appearance?.hairColor || '#4a4a4a'}
                onChange={(e) => updateAppearance({ hairColor: e.target.value })}
                className="w-full h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Eye Color</label>
              <input
                type="color"
                value={customization.appearance?.eyeColor || '#4a90e2'}
                onChange={(e) => updateAppearance({ eyeColor: e.target.value })}
                className="w-full h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === 'clothing' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Clothing Type</label>
              <select
                value={customization.appearance?.clothing?.type || 'casual'}
                onChange={(e) => updateClothing({ type: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="futuristic">Futuristic</option>
                <option value="fantasy">Fantasy</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                <input
                  type="color"
                  value={customization.appearance?.clothing?.primaryColor || '#3b82f6'}
                  onChange={(e) => updateClothing({ primaryColor: e.target.value })}
                  className="w-full h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                <input
                  type="color"
                  value={customization.appearance?.clothing?.secondaryColor || '#1e40af'}
                  onChange={(e) => updateClothing({ secondaryColor: e.target.value })}
                  className="w-full h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pattern</label>
              <select
                value={customization.appearance?.clothing?.pattern || 'solid'}
                onChange={(e) => updateClothing({ pattern: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="solid">Solid</option>
                <option value="striped">Striped</option>
                <option value="checked">Checked</option>
                <option value="gradient">Gradient</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'accessories' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Add Accessory</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['hat', 'glasses', 'jewelry', 'tool', 'badge'].map(type => (
                  <button
                    key={type}
                    onClick={() => addAccessory(type)}
                    className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Add {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Accessories</label>
              <div className="space-y-2">
                {customization.appearance?.accessories?.map((accessory, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-white capitalize">{accessory.type}</span>
                      <input
                        type="color"
                        value={accessory.color}
                        onChange={(e) => {
                          const newAccessories = [...(customization.appearance?.accessories || [])];
                          newAccessories[index] = { ...accessory, color: e.target.value };
                          updateAppearance({ accessories: newAccessories });
                        }}
                        className="w-8 h-8 bg-gray-600 rounded border border-gray-500 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => removeAccessory(index)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(!customization.appearance?.accessories || customization.appearance.accessories.length === 0) && (
                  <p className="text-gray-400">No accessories added yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'animations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Idle Animation</label>
                <select
                  value={customization.animations?.idle || 'idle'}
                  onChange={(e) => updateCustomization({
                    animations: { ...customization.animations!, idle: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="idle">Idle</option>
                  <option value="idle_breathing">Breathing</option>
                  <option value="idle_look_around">Look Around</option>
                  <option value="idle_shift">Shift Weight</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Walk Animation</label>
                <select
                  value={customization.animations?.walk || 'walk'}
                  onChange={(e) => updateCustomization({
                    animations: { ...customization.animations!, walk: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="walk">Walk</option>
                  <option value="walk_casual">Casual Walk</option>
                  <option value="walk_confident">Confident Walk</option>
                  <option value="walk_stealth">Stealth Walk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Run Animation</label>
                <select
                  value={customization.animations?.run || 'run'}
                  onChange={(e) => updateCustomization({
                    animations: { ...customization.animations!, run: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="run">Run</option>
                  <option value="run_sprint">Sprint</option>
                  <option value="run_jog">Jog</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Jump Animation</label>
                <select
                  value={customization.animations?.jump || 'jump'}
                  onChange={(e) => updateCustomization({
                    animations: { ...customization.animations!, jump: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="jump">Jump</option>
                  <option value="jump_high">High Jump</option>
                  <option value="jump_flip">Flip Jump</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Available Gestures</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['wave', 'point', 'thumbs_up', 'nod', 'dance', 'clap', 'bow', 'salute'].map(gesture => (
                  <label key={gesture} className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={customization.animations?.gesture?.includes(gesture) || false}
                      onChange={(e) => {
                        const gestures = customization.animations?.gesture || [];
                        if (e.target.checked) {
                          updateCustomization({
                            animations: { ...customization.animations!, gesture: [...gestures, gesture] }
                          });
                        } else {
                          updateCustomization({
                            animations: { ...customization.animations!, gesture: gestures.filter(g => g !== gesture) }
                          });
                        }
                      }}
                      className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize">{gesture.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proportions' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Height: {customization.proportions?.height?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={customization.proportions?.height || 1.0}
                onChange={(e) => updateProportions({ height: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Width: {customization.proportions?.width?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={customization.proportions?.width || 1.0}
                onChange={(e) => updateProportions({ width: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Head Size: {customization.proportions?.headSize?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={customization.proportions?.headSize || 1.0}
                onChange={(e) => updateProportions({ headSize: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarCustomizationPanel;