import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-b-2 border-[#6366f1] border-t-transparent',
          sizes[size]
        )}
      />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
};
