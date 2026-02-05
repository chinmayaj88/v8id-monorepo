'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'slate';
  className?: string;
}

export default function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
}: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
    xl: 'h-12 w-12 border-[4px]',
  };

  const variantClasses = {
    primary: 'border-v8-primary/20 border-t-v8-primary',
    white: 'border-white/20 border-t-white',
    slate: 'border-slate-200 dark:border-slate-800 border-t-slate-500',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
