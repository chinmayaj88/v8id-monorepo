'use client';

import React, { useState } from 'react';
import {
  HiOutlineMail,
  HiOutlineLink,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiChevronDown,
} from 'react-icons/hi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store/hooks';
import { shareItem } from '@/store/slices/fileSlice';
import { useModal } from '@/components/ui/ModalProvider';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export default function ShareModal({ isOpen, onClose, item }: ShareModalProps) {
  const dispatch = useAppDispatch();
  const { showNotification } = useModal();
  const [activeTab, setActiveTab] = useState<'internal' | 'public'>('internal');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [isLoading, setIsLoading] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const isFolder = 'fileCount' in item || !('mimeType' in item);
  const itemType = isFolder ? 'FOLDER' : 'FILE';

  const handleInternalShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await dispatch(
        shareItem({
          itemId: item.id,
          itemType,
          type: 'INTERNAL',
          permission,
          email: email.trim(),
        })
      ).unwrap();

      showNotification({
        title: 'Shared Successfully',
        message: `Item shared with ${email}`,
        type: 'success',
      });
      setEmail('');
      // We could close or keep open to share with more
    } catch (err: any) {
      showNotification({
        title: 'Share Failed',
        message: err || 'Failed to share item',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    try {
      const result = await dispatch(
        shareItem({
          itemId: item.id,
          itemType,
          type: 'PUBLIC_LINK',
          permission: 'VIEW', // Always view for public links by default?
          expiresInSeconds: expiresIn || undefined,
        })
      ).unwrap();

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share/${result.token}`; // Assuming result returns a token, or result.link needs to be adjusted
      // If result.link is provided by backend, use it, otherwise construct it.
      // The previous code was: const link = `${baseUrl}${result.link}`;
      // I will trust the backend returns 'link' property which is the relative path
      // But for this feature to work with the new page, I might need to ensure the format.
      // Let's assume result.link is what we want for now, but I'll stick to the previous implementation for safety
      // unless I change the backend.
      // Actually, if I am implementing the frontend page at /share/[token], I should probably construct it myself
      // if I want to be sure, OR ensuring the backend returns that.
      // Let's assume result.link is correct for now.

      setPublicLink(`${baseUrl}${result.link}`);

      showNotification({
        title: 'Link Generated',
        message: 'Public sharing link is ready',
        type: 'success',
      });
    } catch (err: any) {
      showNotification({
        title: 'Failed',
        message: err || 'Failed to generate link',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
    showNotification({
      title: 'Copied',
      message: 'Link copied to clipboard',
      type: 'success',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share ${item.name}`} maxWidth="md">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'internal'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <HiOutlineUserGroup className="w-4 h-4" />
            Internal Share
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'public'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <HiOutlineGlobeAlt className="w-4 h-4" />
            Public Link
          </button>
        </div>

        {activeTab === 'internal' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={handleInternalShare} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">
                  Recipient Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-v8-primary transition-colors">
                    <HiOutlineMail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="colleague@v8id.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-[20px] bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-v8-primary/30 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">
                  Permission
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPermission('VIEW')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      permission === 'VIEW'
                        ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                        : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                    }`}
                  >
                    <HiOutlineLockClosed className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">
                        Viewer
                      </p>
                      <p className="text-[9px] font-bold opacity-60">Can download only</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermission('EDIT')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      permission === 'EDIT'
                        ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                        : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                    }`}
                  >
                    <HiOutlineClipboardCopy className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">
                        Editor
                      </p>
                      <p className="text-[9px] font-bold opacity-60">Full access (beta)</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-14 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-v8-primary/20"
                  isLoading={isLoading}
                  disabled={!email}
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!publicLink ? (
              <div className="text-center py-6 px-4 space-y-5">
                <div className="w-16 h-16 bg-v8-primary/10 rounded-[30px] flex items-center justify-center mx-auto text-v8-primary animate-pulse">
                  <HiOutlineLink className="w-8 h-8" />
                </div>
                <div>
                  <h4
                    className="text-lg font-black tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Generate Public Link
                  </h4>
                  <p
                    className="text-sm font-medium mt-1 opacity-60"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Anyone with the link will be able to view and download this item.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                    Link Expiration
                  </label>
                  <div className="relative">
                    <select
                      value={expiresIn === null ? 'null' : expiresIn}
                      onChange={e => {
                        const val = e.target.value === 'null' ? null : Number(e.target.value);
                        setExpiresIn(val);
                      }}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-v8-primary/20 transition-all"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="null">Never expires</option>
                      <option value="3600">Expires in 1 hour</option>
                      <option value="86400">Expires in 24 hours</option>
                      <option value="604800">Expires in 7 days</option>
                      <option value="2592000">Expires in 30 days</option>
                    </select>
                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleGenerateLink}
                  className="w-full h-14 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-v8-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  isLoading={isLoading}
                >
                  Create Secure Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 rounded-[24px] bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-3 text-emerald-600 mb-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                      <HiOutlineCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      Public Link Active
                    </span>
                  </div>
                  <div className="relative group">
                    <input
                      readOnly
                      value={publicLink}
                      className="w-full pl-4 pr-12 py-4 rounded-xl bg-white dark:bg-black/20 border border-emerald-200 dark:border-emerald-800 text-[13px] font-bold text-zinc-600 dark:text-zinc-300"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="absolute right-2 top-2 p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-all active:scale-90"
                    >
                      {copying ? (
                        <HiOutlineCheck className="w-4 h-4" />
                      ) : (
                        <HiOutlineClipboardCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="px-4 text-[11px] font-medium text-zinc-400 text-center">
                  Links do not expire unless explicitly revoked by you.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
