'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60';

  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full mb-2',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={`${baseClass} ${variantClasses[variant]} ${className}`} style={style} />;
}
