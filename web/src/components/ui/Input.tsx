'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-v8-primary transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent 
              focus:border-v8-primary focus:bg-white dark:focus:bg-zinc-950 
              transition-all outline-none text-gray-900 dark:text-white 
              ${icon ? 'pl-11' : 'px-4'} 
              ${suffix ? 'pr-20' : 'pr-4'}
              py-3 text-sm font-medium
              placeholder:text-gray-400 dark:placeholder:text-zinc-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
