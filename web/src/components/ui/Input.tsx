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
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 ml-1 opacity-70">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-v8-primary transition-colors">
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })
                : icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl bg-gray-50/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50
              focus:border-v8-primary/50 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-v8-primary/5
              transition-all outline-none text-gray-900 dark:text-gray-100 
              ${icon ? 'pl-10' : 'px-3.5'} 
              ${suffix ? 'pr-20' : 'pr-3.5'}
              py-2.5 text-sm font-semibold
              placeholder:text-gray-400/70 dark:placeholder:text-zinc-600
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/5' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-[10px] font-black text-red-500 uppercase tracking-wider ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
