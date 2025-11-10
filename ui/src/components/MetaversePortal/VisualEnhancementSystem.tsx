/**
 * Visual Enhancement System
 * Particle effects, post-processing, and dynamic lighting for the metaverse
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
// Postprocessing imports commented out - packages not installed
// import { 
//   EffectComposer, 
//   Bloom, 
//   DepthOfField, 
//   Vignette, 
//   GodRays,
//   ChromaticAberration,
//   Noise
// } from '@react-three/postprocessing';
// import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { metaversePortalService, ParticleEffect, PostProcessingEffect, DynamicLighting } from '../../services/metaverse-portal-service';

interface VisualEnhancementSystemProps {
  onEffectChange?: (effects: any) => void;
  className?: string;
}

// Particle system component
const ParticleSystem: React.FC<{
  effects: ParticleEffect[];
}> = ({ effects }) => {
  const particlesRef = useRef<THREE.Points[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const particleSystems = useMemo(() => {
    return effects.map(effect => {
      const particleCount = effect.intensity * 100;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const velocities = new Float32Array(particleCount * 3);

      const color = new THREE.Color(effect.color);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Position
        positions[i3] = effect.position[0] + (Math.random() - 0.5) * 2;
        positions[i3 + 1] = effect.position[1] + (Math.random() - 0.5) * 2;
        positions[i3 + 2] = effect.position[2] + (Math.random() - 0.5) * 2;
        
        // Color
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        // Size
        sizes[i] = Math.random() * 0.1 + 0.05;
        
        // Velocity
        velocities[i3] = (Math.random() - 0.5) * 0.02;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

      const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      return {
        id: effect.id,
        geometry,
        material,
        effect,
        startTime: Date.now()
      };
    });
  }, [effects]);

  useFrame(() => {
    const delta = clockRef.current.getDelta();
    const currentTime = Date.now();

    particleSystems.forEach((system, systemIndex) => {
      const points = particlesRef.current[systemIndex];
      if (!points) return;

      const positions = points.geometry.attributes.position.array as Float32Array;
      const velocities = points.geometry.attributes.velocity.array as Float32Array;
      const particleCount = positions.length / 3;

      // Check if effect should be removed
      const age = currentTime - system.startTime;
      if (age > system.effect.duration) {
        return;
      }

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Update positions based on velocity
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        // Apply effect-specific behavior
        switch (system.effect.type) {
          case 'trail':
            // Follow a path
            positions[i3 + 1] += Math.sin(currentTime * 0.001 + i * 0.1) * 0.01;
            break;
          case 'aura':
            // Circular motion
            const angle = currentTime * 0.001 + i * 0.1;
            const radius = 1 + Math.sin(i * 0.1) * 0.5;
            positions[i3] = system.effect.position[0] + Math.cos(angle) * radius;
            positions[i3 + 2] = system.effect.position[2] + Math.sin(angle) * radius;
            break;
          case 'explosion':
            // Outward motion
            velocities[i3] *= 1.02;
            velocities[i3 + 1] *= 1.02;
            velocities[i3 + 2] *= 1.02;
            break;
          case 'sparkle':
            // Random twinkling
            if (Math.random() < 0.01) {
              positions[i3] += (Math.random() - 0.5) * 0.5;
              positions[i3 + 1] += (Math.random() - 0.5) * 0.5;
              positions[i3 + 2] += (Math.random() - 0.5) * 0.5;
            }
            break;
          case 'energy':
            // Pulsing energy
            const pulse = Math.sin(currentTime * 0.003) * 0.5 + 0.5;
            positions[i3] = system.effect.position[0] + (positions[i3] - system.effect.position[0]) * pulse;
            positions[i3 + 1] = system.effect.position[1] + (positions[i3 + 1] - system.effect.position[1]) * pulse;
            positions[i3 + 2] = system.effect.position[2] + (positions[i3 + 2] - system.effect.position[2]) * pulse;
            break;
        }
      }

      points.geometry.attributes.position.needsUpdate = true;
    });
  });

  return (
    <>
      {particleSystems.map((system, index) => {
        const opacity = 1 - (Date.now() - system.startTime) / system.effect.duration;
        
        return (
          <points
            key={system.id}
            ref={(el) => {
              if (el) (particlesRef.current[index] as any) = el;
            }}
            geometry={system.geometry}
            material={system.material.clone()}
          >
            <pointsMaterial
              transparent
              opacity={opacity * 0.8}
              blending={THREE.AdditiveBlending}
            />
          </points>
        );
      })}
    </>
  );
};

// Dynamic lighting component
const DynamicLightingSystem: React.FC<{
  lights: DynamicLighting[];
}> = ({ lights }) => {
  const lightRefs = useRef<THREE.Light[]>([]);

  useFrame((state) => {
    lights.forEach((light, index) => {
      const lightRef = lightRefs.current[index];
      if (!lightRef) return;

      if (light.animated) {
        const time = state.clock.elapsedTime;
        
        switch (light.type) {
          case 'point':
            const pointLight = lightRef as THREE.PointLight;
            if (light.position) {
              pointLight.position.x = light.position[0] + Math.sin(time) * 2;
              pointLight.position.y = light.position[1] + Math.cos(time * 0.7) * 1;
              pointLight.position.z = light.position[2] + Math.sin(time * 1.3) * 2;
            }
            pointLight.intensity = light.intensity * (Math.sin(time * 2) * 0.3 + 0.7);
            break;
          case 'directional':
            const directionalLight = lightRef as THREE.DirectionalLight;
            if (light.position) {
              directionalLight.position.x = light.position[0] + Math.sin(time * 0.5) * 5;
              directionalLight.position.z = light.position[2] + Math.cos(time * 0.5) * 5;
            }
            break;
          case 'spot':
            const spotLight = lightRef as THREE.SpotLight;
            if (light.position) {
              spotLight.position.x = light.position[0] + Math.sin(time) * 3;
              spotLight.position.z = light.position[2] + Math.cos(time) * 3;
            }
            spotLight.angle = Math.PI / 6 + Math.sin(time * 3) * 0.1;
            break;
        }
      }
    });
  });

  return (
    <>
      {lights.map((light, index) => {
        const color = new THREE.Color(light.color);
        
        switch (light.type) {
          case 'ambient':
            return (
              <ambientLight
                key={index}
                color={color}
                intensity={light.intensity}
              />
            );
          case 'directional':
            return (
              <directionalLight
                key={index}
                ref={(el) => {
                  if (el) lightRefs.current[index] = el;
                }}
                position={light.position || [0, 10, 0]}
                color={color}
                intensity={light.intensity}
                castShadow={light.castShadow}
              />
            );
          case 'point':
            return (
              <pointLight
                key={index}
                ref={(el) => {
                  if (el) lightRefs.current[index] = el;
                }}
                position={light.position || [0, 5, 0]}
                color={color}
                intensity={light.intensity}
                castShadow={light.castShadow}
              />
            );
          case 'spot':
            return (
              <spotLight
                key={index}
                ref={(el) => {
                  if (el) lightRefs.current[index] = el;
                }}
                position={light.position || [0, 10, 0]}
                color={color}
                intensity={light.intensity}
                castShadow={light.castShadow}
                angle={Math.PI / 6}
                penumbra={0.2}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

// Post-processing effects component
// PostProcessingEffects component commented out - postprocessing packages not installed
const PostProcessingEffects: React.FC<{
  effects: PostProcessingEffect[];
}> = ({ effects }) => {
  // Postprocessing disabled - install @react-three/postprocessing and postprocessing packages to enable
  return null;
  
  /* Original implementation commented out:
  const bloomEffect = effects.find(e => e.type === 'bloom');
  const dofEffect = effects.find(e => e.type === 'depth-of-field');
  const vignetteEffect = effects.find(e => e.type === 'vignette');
  const chromaticEffect = effects.find(e => e.type === 'chromatic-aberration');
  const noiseEffect = effects.find(e => e.type === 'noise');

  return (
    <EffectComposer>
      {bloomEffect && (
        <Bloom
          intensity={bloomEffect.intensity}
          luminanceThreshold={bloomEffect.parameters.threshold || 0.9}
          luminanceSmoothing={bloomEffect.parameters.smoothing || 0.025}
          height={300}
        />
      )}
      
      {dofEffect && (
        <DepthOfField
          focusDistance={dofEffect.parameters.focusDistance || 0}
          focalLength={dofEffect.parameters.focalLength || 0.02}
          bokehScale={dofEffect.intensity}
          height={480}
        />
      )}
      
      {vignetteEffect && (
        <Vignette
          eskil={false}
          offset={vignetteEffect.parameters.offset || 0.5}
          darkness={vignetteEffect.intensity}
        />
      )}
      
      {chromaticEffect && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[chromaticEffect.intensity * 0.001, 0]}
        />
      )}
      
      {noiseEffect && (
        <Noise
          blendFunction={BlendFunction.COLOR_DODGE}
          opacity={noiseEffect.intensity}
        />
      )}
    </EffectComposer>
  );
  */
};

// Control panel for visual effects
const VisualEffectsControlPanel: React.FC<{
  particleEffects: ParticleEffect[];
  postProcessingEffects: PostProcessingEffect[];
  dynamicLighting: DynamicLighting[];
  onAddParticleEffect: (effect: ParticleEffect) => void;
  onRemoveParticleEffect: (effectId: string) => void;
  onUpdatePostProcessing: (effects: PostProcessingEffect[]) => void;
  onUpdateLighting: (lights: DynamicLighting[]) => void;
}> = ({
  particleEffects,
  postProcessingEffects,
  dynamicLighting,
  onAddParticleEffect,
  onRemoveParticleEffect,
  onUpdatePostProcessing,
  onUpdateLighting
}) => {
  const [activeTab, setActiveTab] = useState<'particles' | 'post-processing' | 'lighting'>('particles');

  const addParticleEffect = (type: ParticleEffect['type']) => {
    const effect: ParticleEffect = {
      id: `particle-${Date.now()}`,
      type,
      position: [0, 2, 0],
      color: '#ffffff',
      intensity: 1.0,
      duration: 5000,
      parameters: {}
    };
    onAddParticleEffect(effect);
  };

  const updatePostProcessingEffect = (type: PostProcessingEffect['type'], intensity: number) => {
    const existing = postProcessingEffects.find(e => e.type === type);
    const updated = existing 
      ? postProcessingEffects.map(e => e.type === type ? { ...e, intensity } : e)
      : [...postProcessingEffects, { type, intensity, parameters: {} }];
    
    onUpdatePostProcessing(updated);
  };

  const addLight = (type: DynamicLighting['type']) => {
    const light: DynamicLighting = {
      type,
      position: type === 'ambient' ? undefined : [0, 5, 0],
      color: '#ffffff',
      intensity: 1.0,
      castShadow: type !== 'ambient',
      animated: false
    };
    onUpdateLighting([...dynamicLighting, light]);
  };

  const updateLight = (index: number, updates: Partial<DynamicLighting>) => {
    const updated = dynamicLighting.map((light, i) => 
      i === index ? { ...light, ...updates } : light
    );
    onUpdateLighting(updated);
  };

  const removeLight = (index: number) => {
    const updated = dynamicLighting.filter((_, i) => i !== index);
    onUpdateLighting(updated);
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
      <h3 className="text-white font-semibold mb-4">Visual Effects</h3>
      
      <div className="flex space-x-2 mb-4">
        {(['particles', 'post-processing', 'lighting'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'particles' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Add Particle Effect</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['trail', 'aura', 'explosion', 'sparkle', 'energy'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => addParticleEffect(type)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Active Effects</h4>
            <div className="space-y-2">
              {particleEffects.map(effect => (
                <div key={effect.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span className="text-white text-sm capitalize">{effect.type}</span>
                  <button
                    onClick={() => onRemoveParticleEffect(effect.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {particleEffects.length === 0 && (
                <p className="text-gray-400 text-sm">No particle effects active</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'post-processing' && (
        <div className="space-y-4">
          {[
            { type: 'bloom' as const, label: 'Bloom' },
            { type: 'depth-of-field' as const, label: 'Depth of Field' },
            { type: 'vignette' as const, label: 'Vignette' },
            { type: 'chromatic-aberration' as const, label: 'Chromatic Aberration' },
            { type: 'noise' as const, label: 'Noise' }
          ].map(({ type, label }) => {
            const effect = postProcessingEffects.find(e => e.type === type);
            return (
              <div key={type}>
                <label className="text-white text-sm">{label}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effect?.intensity || 0}
                  onChange={(e) => updatePostProcessingEffect(type as PostProcessingEffect['type'], parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'lighting' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Add Light</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['ambient', 'directional', 'point', 'spot'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => addLight(type)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Active Lights</h4>
            <div className="space-y-2">
              {dynamicLighting.map((light, index) => (
                <div key={index} className="bg-gray-700 p-2 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm capitalize">{light.type}</span>
                    <button
                      onClick={() => removeLight(index)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <label className="text-gray-300 text-xs">Color:</label>
                      <input
                        type="color"
                        value={light.color}
                        onChange={(e) => updateLight(index, { color: e.target.value })}
                        className="w-8 h-4 bg-gray-600 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-gray-300 text-xs">Intensity:</label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={light.intensity}
                        onChange={(e) => updateLight(index, { intensity: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={light.animated}
                        onChange={(e) => updateLight(index, { animated: e.target.checked })}
                        className="rounded bg-gray-600"
                      />
                      <label className="text-gray-300 text-xs">Animated</label>
                    </div>
                  </div>
                </div>
              ))}
              {dynamicLighting.length === 0 && (
                <p className="text-gray-400 text-sm">No lights active</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
export const VisualEnhancementSystem: React.FC<VisualEnhancementSystemProps> = ({
  onEffectChange,
  className = ''
}) => {
  const [particleEffects, setParticleEffects] = useState<ParticleEffect[]>([]);
  const [postProcessingEffects, setPostProcessingEffects] = useState<PostProcessingEffect[]>([]);
  const [dynamicLighting, setDynamicLighting] = useState<DynamicLighting[]>([
    {
      type: 'ambient',
      color: '#404040',
      intensity: 0.5,
      castShadow: false,
      animated: false
    },
    {
      type: 'directional',
      position: [5, 10, 5],
      color: '#ffffff',
      intensity: 1.0,
      castShadow: true,
      animated: false
    }
  ]);

  useEffect(() => {
    // Clean up expired particle effects
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setParticleEffects(prev => 
        prev.filter(effect => currentTime - effect.startTime < effect.duration)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAddParticleEffect = (effect: ParticleEffect) => {
    setParticleEffects(prev => [...prev, effect]);
    metaversePortalService.addParticleEffect(effect);
  };

  const handleRemoveParticleEffect = (effectId: string) => {
    setParticleEffects(prev => prev.filter(e => e.id !== effectId));
    metaversePortalService.removeParticleEffect(effectId);
  };

  const handleUpdatePostProcessing = (effects: PostProcessingEffect[]) => {
    setPostProcessingEffects(effects);
    metaversePortalService.setPostProcessingEffects(effects);
  };

  const handleUpdateLighting = (lights: DynamicLighting[]) => {
    setDynamicLighting(lights);
    metaversePortalService.updateDynamicLighting(lights);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <DynamicLightingSystem lights={dynamicLighting} />
        <ParticleSystem effects={particleEffects} />
        
        {/* Sample scene objects */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        <mesh position={[2, 1, 0]}>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
        
        <mesh position={[-2, 1, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
        
        <PostProcessingEffects effects={postProcessingEffects} />
      </Canvas>
      
      <VisualEffectsControlPanel
        particleEffects={particleEffects}
        postProcessingEffects={postProcessingEffects}
        dynamicLighting={dynamicLighting}
        onAddParticleEffect={handleAddParticleEffect}
        onRemoveParticleEffect={handleRemoveParticleEffect}
        onUpdatePostProcessing={handleUpdatePostProcessing}
        onUpdateLighting={handleUpdateLighting}
      />
    </div>
  );
};

export default VisualEnhancementSystem;