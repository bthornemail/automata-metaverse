/**
 * Modern UI Components
 * Enhanced UI components with modern design, animations, and glassmorphism
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// Glassmorphism card component
export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({ children, className, onClick, hover = true }) => {
  return (
    <motion.div
      className={clsx(
        'bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl',
        hover && 'hover:bg-white/15 hover:border-white/30 transition-all duration-300',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Modern button component
export const ModernButton: React.FC<{
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ 
  children = null, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  icon,
  disabled = false,
  className 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/50',
    ghost: 'bg-transparent hover:bg-white/10 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-2 rounded-lg font-medium transition-all duration-200',
        'backdrop-blur-sm border border-white/10',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.05, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
};

// Modern panel component
export const ModernPanel: React.FC<{
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  visible?: boolean;
}> = ({ children, title, icon, onClose, className, visible = true }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={clsx(
            'bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl',
            'border border-white/10 rounded-2xl shadow-2xl',
            'overflow-hidden',
            className
          )}
        >
          {(title || onClose) && (
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              {title && (
                <div className="flex items-center gap-2">
                  {icon && <span className="text-white/80">{icon}</span>}
                  <h3 className="text-white font-semibold text-lg">{title}</h3>
                </div>
              )}
              {onClose && (
                <motion.button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </div>
          )}
          <div className="p-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Modern input component
export const ModernInput: React.FC<{
  label?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'range';
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', min, max, step, className, placeholder }) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          {label}
        </label>
      )}
      {type === 'range' ? (
        <div className="space-y-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-white/60">
            <span>{min}</span>
            <span className="text-white font-medium">{value}</span>
            <span>{max}</span>
          </div>
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      )}
    </div>
  );
};

// Modern toggle/switch component
export const ModernToggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ label, checked, onChange, description }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex-1">
        <label className="text-white font-medium cursor-pointer">{label}</label>
        {description && (
          <p className="text-xs text-white/60 mt-0.5">{description}</p>
        )}
      </div>
      <motion.button
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20'
        )}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
};

// Modern badge component
export const ModernBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-white/10 text-white border-white/20',
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Modern tooltip component
export const ModernTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, content, position = 'top' }) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative group">
      {children}
      <div className={clsx(
        'absolute z-50 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg',
        'border border-white/20 shadow-xl',
        'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200',
        'whitespace-nowrap',
        positions[position]
      )}>
        {content}
        <div className={clsx(
          'absolute w-2 h-2 bg-gray-900 border border-white/20 rotate-45',
          position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
          position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
          position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
          position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
        )} />
      </div>
    </div>
  );
};
