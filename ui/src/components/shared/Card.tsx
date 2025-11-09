import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  'data-testid': testId,
}) => {
  const variants = {
    default: 'bg-gray-800',
    elevated: 'bg-gray-800 shadow-xl',
    outlined: 'bg-gray-800 border border-gray-700',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={clsx('rounded-xl', variants[variant], className)} data-testid={testId}>
      {(title || header) && (
        <div className="border-b border-gray-700 px-6 py-4">
          {header || (title && <h3 className="text-xl font-bold text-white">{title}</h3>)}
        </div>
      )}
      <div className={clsx(paddings[padding])}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-700 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
};
