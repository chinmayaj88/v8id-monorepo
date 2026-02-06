'use client';

import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} rounded-[24px] p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300 border`}
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex justify-between items-center mb-5">
          {title && (
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        {footer && (
          <div
            className="pt-5 mt-5 border-t flex justify-end gap-3"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
