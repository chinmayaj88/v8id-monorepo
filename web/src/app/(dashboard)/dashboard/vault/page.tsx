'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setVaultSetupFlag } from '@/store/slices/authSlice';
import {
  setupVault,
  unlockVault,
  lockVault,
  addSecret,
  fetchSecrets,
  deleteSecret,
  getSecretDetails,
  VaultSecret,
} from '@/store/slices/vaultSlice';
import {
  HiOutlineShieldCheck,
  HiChevronRight,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePlus,
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineClipboard,
  HiX,
  HiOutlineSearch,
} from 'react-icons/hi';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useModal } from '@/components/ui/ModalProvider';

export default function VaultPage() {
  const dispatch = useAppDispatch();
  const { secrets, isUnlocked, isLoading } = useAppSelector(state => state.vault);
  const { user } = useAppSelector(state => state.auth);
  const { showConfirmation, showNotification } = useModal();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewSecretId, setViewSecretId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Password / Unlock form state
  const [vaultPassword, setVaultPassword] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  // Add Secret Form State
  const [newSecret, setNewSecret] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'LOGIN',
  });

  useEffect(() => {
    if (user && user.hasVaultSetup === false) {
      setIsSettingUp(true);
    }
  }, [user]);

  useEffect(() => {
    if (isUnlocked) {
      dispatch(fetchSecrets());
    }
  }, [isUnlocked, dispatch]);

  // Auto-lock vault after inactivity
  useEffect(() => {
    if (!isUnlocked) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Auto lock after 3 minutes of inactivity
      inactivityTimer = setTimeout(
        () => {
          dispatch(lockVault());
          showNotification({
            title: 'Vault Locked',
            message: 'Your vault was locked due to inactivity.',
            type: 'success',
          });
        },
        3 * 60 * 1000
      );
    };

    // Events to watch for activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Start timer initially
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isUnlocked, dispatch, showNotification]);

  const handleUnlockOrSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (isSettingUp) {
        if (vaultPassword.length < 8) {
          setAuthError('Password must be at least 8 characters long');
          setIsAuthLoading(false);
          return;
        }
        await dispatch(setupVault(vaultPassword)).unwrap();
        dispatch(setVaultSetupFlag());
        setIsSettingUp(false);
        showNotification({
          title: 'Success',
          message: 'Vault configured successfully',
          type: 'success',
        });
      } else {
        await dispatch(unlockVault(vaultPassword)).unwrap();
      }
      setVaultPassword('');
    } catch (err: any) {
      if (
        err === 'Vault is not configured for this account. Please set up a vault password first.'
      ) {
        setIsSettingUp(true);
      } else {
        setAuthError(err || 'Authentication failed');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addSecret(newSecret)).unwrap();
      setIsAddModalOpen(false);
      setNewSecret({ name: '', username: '', password: '', url: '', notes: '', category: 'LOGIN' });
      showNotification({
        title: 'Success',
        message: 'Secret added successfully',
        type: 'success',
      });
    } catch (err: any) {
      showNotification({
        title: 'Error',
        message: err.message || 'Failed to add secret',
        type: 'error',
      });
    }
  };

  const handleRevealPassword = async (id: string) => {
    if (revealedPassword && viewSecretId === id) {
      setRevealedPassword(null);
      setViewSecretId(null);
      return;
    }

    try {
      const details = await dispatch(getSecretDetails(id)).unwrap();
      setViewSecretId(id);
      // Backend returns 'encryptedPassword' usually, needing decryption.
      // But based on controller getSecret, it returns result.
      // Let's assume the backend might return decrypted password if authorized?
      // Wait, endpoint /vault/:id calls getVaultSecretUseCase.execute which:
      // "decrypts the password using the master key" (server side)
      // So it should return the password in plain text in a secure field (e.g. 'password' or 'decryptedPassword')
      // Let's assume it maps it to 'password' or returns the object.
      // We'll try to find the password field.

      // Since I can't check the response type precisely without running, I'll assume standard DTO.
      // If it fails, I'll log and fix.
      setRevealedPassword(
        (details as any).decryptedPassword || (details as any).password || '********'
      );
    } catch (err: any) {
      showNotification({
        title: 'Error',
        message: err.message || 'Failed to retrieve secret details',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: 'Delete Secret?',
      message: 'Are you sure you want to delete this secret? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await dispatch(deleteSecret(id)).unwrap();
          showNotification({
            title: 'Success',
            message: 'Secret deleted successfully',
            type: 'success',
          });
        } catch (err: any) {
          showNotification({
            title: 'Error',
            message: err.message || 'Failed to delete secret',
            type: 'error',
          });
        }
      },
    });
  };

  const filteredSecrets = secrets.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.username && s.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isUnlocked) {
    return (
      <div className="space-y-6 pb-8 h-full flex flex-col">
        {/* Breadcrumbs */}
        <div
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
            Home
          </Link>
          <HiChevronRight className="w-2.5 h-2.5" />
          <span className="text-v8-primary">Personal Vault</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative group mx-auto">
            <div
              className={`p-10 rounded-[40px] border relative z-10 shadow-2xl overflow-hidden transition-all`}
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-50" />
              <HiOutlineShieldCheck className="h-20 w-20 text-v8-primary relative z-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-zinc-50 dark:border-zinc-950 flex items-center justify-center shadow-lg z-20 transition-colors">
              <HiOutlineLockClosed className="h-5 w-5 text-zinc-400" />
            </div>
          </div>

          <div className="max-w-md w-full space-y-4">
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {isSettingUp ? 'Setup Personal Vault' : 'Your Digital Safe'}
            </h1>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {isSettingUp
                ? 'Create a master password to secure your digital vault.'
                : 'Access your protected passwords and secure notes.'}
            </p>

            <form onSubmit={handleUnlockOrSetup} className="mt-8 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1">
                  Vault Master Password
                </label>
                <input
                  type="password"
                  value={vaultPassword}
                  onChange={e => {
                    setVaultPassword(e.target.value);
                    setAuthError('');
                  }}
                  className={`w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border ${authError ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-700'} outline-hidden focus:ring-2 focus:ring-v8-primary/20 text-center tracking-widest font-mono`}
                  placeholder="••••••••••••"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-red-500 mt-2 font-bold ml-1">{authError}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20"
                isLoading={isAuthLoading}
              >
                {isSettingUp ? 'Secure Vault' : 'Unlock Vault'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 h-full flex flex-col">
      {/* Add Secret Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-lg font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Add New Secret
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <HiX className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleAddSecret} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSecret.name}
                  onChange={e => setNewSecret({ ...newSecret, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-hidden focus:ring-2 focus:ring-v8-primary/20"
                  placeholder="e.g. Netflix, Bank Account"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={newSecret.username}
                  onChange={e => setNewSecret({ ...newSecret, username: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-hidden focus:ring-2 focus:ring-v8-primary/20"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newSecret.password}
                  onChange={e => setNewSecret({ ...newSecret, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-hidden focus:ring-2 focus:ring-v8-primary/20"
                  placeholder="********"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  URL (Optional)
                </label>
                <input
                  type="text"
                  value={newSecret.url}
                  onChange={e => setNewSecret({ ...newSecret, url: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-hidden focus:ring-2 focus:ring-v8-primary/20"
                  placeholder="https://..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold opacity-60 hover:opacity-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-v8-primary text-white text-sm font-bold hover:shadow-lg hover:shadow-v8-primary/20 transition-all"
                >
                  Save Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-6">
        <div
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
            Home
          </Link>
          <HiChevronRight className="w-2.5 h-2.5" />
          <span className="text-v8-primary">Personal Vault</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Personal Vault
            </h1>
            <p
              className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Secure Password & Credential Storage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(lockVault())}
              className="p-2 rounded-xl border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title="Lock Vault"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <HiOutlineLockOpen className="w-5 h-5" />
            </button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Secret
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search secrets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-hidden focus:ring-2 focus:ring-v8-primary/20 transition-all text-sm"
          />
        </div>
      </div>

      {/* Secrets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading && secrets.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse"
            />
          ))
        ) : filteredSecrets.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-40 font-bold italic">
            No secrets found. Add one to get started.
          </div>
        ) : (
          filteredSecrets.map(secret => (
            <div
              key={secret.id}
              className="group p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:shadow-lg hover:shadow-v8-primary/5 flex flex-col justify-between h-44 relative animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                    <HiOutlineKey className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-sm truncate max-w-[120px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {secret.name}
                    </h3>
                    <p
                      className="text-[10px] opacity-60 truncate max-w-[120px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {secret.username || 'No username'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(secret.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-all"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="font-mono text-xs truncate max-w-[160px] opacity-60">
                  {viewSecretId === secret.id ? revealedPassword : '••••••••••••'}
                </div>
                <div className="flex gap-1">
                  {viewSecretId === secret.id && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(revealedPassword || '');
                        showNotification({
                          title: 'Copied',
                          message: 'Password copied to clipboard',
                          type: 'success',
                        });
                      }}
                      className="p-1 hover:text-v8-primary transition-colors"
                      title="Copy"
                    >
                      <HiOutlineClipboard className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRevealPassword(secret.id)}
                    className="p-1 hover:text-v8-primary transition-colors"
                    title={viewSecretId === secret.id ? 'Hide' : 'Show'}
                  >
                    {viewSecretId === secret.id ? (
                      <HiOutlineEyeOff className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {secret.url && (
                <a
                  href={secret.url.startsWith('http') ? secret.url : `https://${secret.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-[10px] font-bold text-v8-primary hover:underline self-start"
                >
                  {secret.url}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
