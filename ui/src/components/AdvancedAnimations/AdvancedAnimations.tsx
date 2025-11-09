import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Layers, Eye, Settings, Play, Pause } from 'lucide-react';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface DimensionalTransition {
  from: number;
  to: number;
  progress: number;
  duration: number;
}

interface AdvancedAnimationsProps {
  className?: string;
}

const AdvancedAnimations: React.FC<AdvancedAnimationsProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showTransitions, setShowTransitions] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [currentDimension, setCurrentDimension] = useState(0);
  const [targetDimension, setTargetDimension] = useState(0);
  const [transition, setTransition] = useState<DimensionalTransition | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [particleCount, setParticleCount] = useState(50);

  const dimensionColors = [
    '#6366f1', // 0D - Indigo
    '#8b5cf6', // 1D - Purple
    '#ec4899', // 2D - Pink
    '#f43f5e', // 3D - Red
    '#f97316', // 4D - Orange
    '#eab308', // 5D - Yellow
    '#22c55e', // 6D - Green
    '#06b6d4'  // 7D - Cyan
  ];

  const dimensionNames = [
    'Identity', 'Successor', 'Pair', 'Addition',
    'Network', 'Consensus', 'Intelligence', 'Quantum'
  ];

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle());
    }
    setParticles(newParticles);
  }, [particleCount]);

  const createParticle = (): Particle => {
    const dimension = Math.floor(Math.random() * 8);
    return {
      id: `particle-${Date.now()}-${Math.random()}`,
      x: Math.random() * (canvasRef.current?.width || 800),
      y: Math.random() * (canvasRef.current?.height || 400),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      color: dimensionColors[dimension],
      life: 0,
      maxLife: Math.random() * 100 + 100
    };
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      if (showParticles) {
        setParticles(prevParticles => {
          const updatedParticles = prevParticles.map(particle => {
            const updated = { ...particle };
            updated.x += updated.vx * animationSpeed;
            updated.y += updated.vy * animationSpeed;
            updated.life += animationSpeed;

            // Bounce off walls
            if (updated.x <= 0 || updated.x >= canvas.width) {
              updated.vx *= -1;
            }
            if (updated.y <= 0 || updated.y >= canvas.height) {
              updated.vy *= -1;
            }

            // Respawn dead particles
            if (updated.life >= updated.maxLife) {
              return createParticle();
            }

            return updated;
          });

          // Draw particles
          updatedParticles.forEach(particle => {
            const opacity = 1 - (particle.life / particle.maxLife);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw connections between nearby particles
            updatedParticles.forEach(other => {
              if (particle.id !== other.id) {
                const distance = Math.sqrt(
                  Math.pow(particle.x - other.x, 2) + 
                  Math.pow(particle.y - other.y, 2)
                );
                if (distance < 100) {
                  ctx.globalAlpha = (1 - distance / 100) * opacity * 0.5;
                  ctx.strokeStyle = particle.color;
                  ctx.lineWidth = 0.5;
                  ctx.beginPath();
                  ctx.moveTo(particle.x, particle.y);
                  ctx.lineTo(other.x, other.y);
                  ctx.stroke();
                }
              }
            });
          });

          return updatedParticles;
        });
      }

      // Draw dimensional transition
      if (showTransitions && transition) {
        drawDimensionalTransition(ctx, canvas);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, showParticles, showTransitions, transition, animationSpeed]);

  const drawDimensionalTransition = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!transition) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Draw transition circle
    const progress = transition.progress / 100;
    
    // From dimension (fading out)
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = dimensionColors[transition.from];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // To dimension (fading in)
    ctx.globalAlpha = progress;
    ctx.strokeStyle = dimensionColors[transition.to];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * (0.5 + progress * 0.5), 0, Math.PI * 2);
    ctx.stroke();

    // Transition particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + progress * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius * progress;
      const y = centerY + Math.sin(angle) * radius * progress;
      
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = dimensionColors[transition.from];
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  // Start dimensional transition
  const startTransition = (from: number, to: number) => {
    setTransition({
      from,
      to,
      progress: 0,
      duration: 2000
    });

    // Animate transition
    const startTime = Date.now();
    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      
      setTransition(prev => prev ? { ...prev, progress } : null);
      
      if (progress < 100) {
        requestAnimationFrame(animateTransition);
      } else {
        setCurrentDimension(to);
        setTransition(null);
      }
    };
    
    animateTransition();
  };

  // Auto-transition through dimensions
  useEffect(() => {
    if (!showTransitions) return;

    const interval = setInterval(() => {
      const nextDimension = (currentDimension + 1) % 8;
      setTargetDimension(nextDimension);
      startTransition(currentDimension, nextDimension);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentDimension, showTransitions]);

  const triggerDimensionalBurst = () => {
    const newParticles: Particle[] = [];
    const centerX = canvasRef.current?.width ? canvasRef.current.width / 2 : 400;
    const centerY = canvasRef.current?.height ? canvasRef.current.height / 2 : 200;

    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const dimension = currentDimension;
      
      newParticles.push({
        id: `burst-${Date.now()}-${i}`,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: dimensionColors[dimension],
        life: 0,
        maxLife: 50
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  };

  return (
    <div className={`p-6 bg-gray-800 rounded-xl shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          Advanced Animations
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="control-button bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={triggerDimensionalBurst}
            className="control-button bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Zap className="w-4 h-4" />
          </button>
          
          <button className="control-button bg-gray-600 hover:bg-gray-700 text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Animation Canvas */}
        <div className="lg:col-span-3">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-96"
              style={{ background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)' }}
            />
            
            {/* Dimension Indicator */}
            <div className="absolute top-4 left-4 bg-gray-800/80 rounded-lg p-3">
              <div className="text-white font-bold mb-1">
                {currentDimension}D: {dimensionNames[currentDimension]}
              </div>
              <div 
                className="w-16 h-2 rounded-full"
                style={{ backgroundColor: dimensionColors[currentDimension] }}
              />
            </div>

            {/* Transition Indicator */}
            {transition && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 bg-gray-800/80 rounded-lg p-3"
              >
                <div className="text-white text-sm">
                  Transitioning: {transition.from}D → {transition.to}D
                </div>
                <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${transition.progress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Animation Controls */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Controls</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                  className="rounded"
                />
                Show Particles
              </label>
              
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={showTransitions}
                  onChange={(e) => setShowTransitions(e.target.checked)}
                  className="rounded"
                />
                Show Transitions
              </label>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Animation Speed</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-white text-sm">{animationSpeed.toFixed(1)}x</div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Particles</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={particleCount}
                  onChange={(e) => setParticleCount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-white text-sm">{particleCount}</div>
              </div>
            </div>
          </div>

          {/* Dimension Selector */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Jump to Dimension</h4>
            <div className="grid grid-cols-2 gap-2">
              {dimensionNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => startTransition(currentDimension, index)}
                  className="p-2 rounded-lg text-xs transition-all duration-200 text-white"
                  style={{ 
                    backgroundColor: dimensionColors[index],
                    opacity: currentDimension === index ? 1 : 0.7
                  }}
                >
                  {index}D
                </button>
              ))}
            </div>
          </div>

          {/* Effects */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Effects</h4>
            <div className="space-y-2">
              <button
                onClick={triggerDimensionalBurst}
                className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                Dimensional Burst
              </button>
              
              <button
                onClick={() => {
                  setParticles(prev => prev.slice(0, -20));
                }}
                className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Remove Particles
              </button>
              
              <button
                onClick={() => {
                  const newParticles: Particle[] = [];
                  for (let i = 0; i < 50; i++) {
                    newParticles.push(createParticle());
                  }
                  setParticles(newParticles);
                }}
                className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                Reset Particles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnimations;