'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline';
  noPadding?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  noPadding = false,
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-[32px] overflow-hidden transition-all duration-300';

  const variants = {
    default: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-bg shadow-sm',
    elevated: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-bg shadow-xl',
    outline: 'border-2 border-zinc-200 dark:border-zinc-800 bg-transparent',
  };

  const padding = noPadding ? '' : 'p-8';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: variant !== 'outline' ? 'var(--card-bg)' : 'transparent',
        borderColor: 'var(--border-primary)',
      }}
    >
      {children}
    </div>
  );
}
