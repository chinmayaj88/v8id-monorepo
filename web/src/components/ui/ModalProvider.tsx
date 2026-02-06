'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { HiCheckCircle, HiOutlineExclamation } from 'react-icons/hi';

interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showNotification: (options: NotificationOptions) => void;
  showConfirmation: (options: ConfirmationOptions) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationOptions & { isOpen: boolean }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const [confirmation, setConfirmation] = useState<
    ConfirmationOptions & { isOpen: boolean; isLoading: boolean }
  >({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showNotification = (options: NotificationOptions) => {
    setNotification({ ...options, isOpen: true });
  };

  const showConfirmation = (options: ConfirmationOptions) => {
    setConfirmation({ ...options, isOpen: true, isLoading: false });
  };

  const handleConfirm = async () => {
    try {
      setConfirmation(prev => ({ ...prev, isLoading: true }));
      await confirmation.onConfirm();
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setConfirmation(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <ModalContext.Provider value={{ showNotification, showConfirmation }}>
      {children}

      {/* Notification Modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        footer={
          <div className="flex justify-end w-full">
            <Button
              variant="primary"
              onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border flex gap-4 ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                notification.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}
            >
              {notification.type === 'success' ? (
                <HiCheckCircle className="w-5 h-5" />
              ) : (
                <HiOutlineExclamation className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="font-black text-sm mb-1">{notification.title}</h4>
              <p className="text-xs font-medium leading-relaxed opacity-90">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        title={confirmation.title}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
            >
              {confirmation.cancelText || 'Cancel'}
            </Button>
            <Button variant="primary" onClick={handleConfirm} isLoading={confirmation.isLoading}>
              {confirmation.confirmText || 'Confirm'}
            </Button>
          </div>
        }
      >
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {confirmation.message}
        </p>
      </Modal>
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
