'use client';

import React, { useState } from 'react';
import { HiOutlineMail, HiOutlineDatabase } from 'react-icons/hi';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER' as 'USER' | 'ADMIN',
    storageQuota: 5368709120, // 5GB default
  });

  const [creationResult, setCreationResult] = useState<{
    email: string;
    tempPassword?: string;
    totpSetup: {
      qrCodeUrl: string;
      secret: string;
      backupCodes: string[];
    };
  } | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationResult) {
      handleClose();
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(ENDPOINTS.USER.CREATE, formData);
      const data = response.data?.data;

      setCreationResult({
        email: data.email,
        tempPassword: formData.password,
        totpSetup: data.totpSetup,
      });

      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'USER',
        storageQuota: 5368709120,
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Delay clearing result to avoid jump while closing
    setTimeout(() => {
      setCreationResult(null);
    }, 300);
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={creationResult ? 'Account Created' : 'Add New User'}
      footer={
        <>
          <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={handleClose}>
            {creationResult ? 'Close' : 'Cancel'}
          </Button>
          {!creationResult && (
            <Button
              variant="primary"
              size="sm"
              className="font-bold text-xs rounded-lg px-6"
              onClick={handleAddUser}
              isLoading={submitting}
            >
              Create Account
            </Button>
          )}
        </>
      }
    >
      {creationResult ? (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <HiOutlineMail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600">Email sent!</p>
              <p className="text-[11px] font-medium text-emerald-600/70">
                Credentials sent to {creationResult.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                Authenticator Setup
              </p>
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <img
                  src={creationResult.totpSetup.qrCodeUrl}
                  alt="QR Code"
                  className="w-40 h-40 rounded-xl shadow-lg mb-3 bg-white p-2"
                />
                <code className="text-[11px] font-black text-v8-primary tracking-widest bg-v8-primary/5 px-2.5 py-1 rounded-md">
                  {creationResult.totpSetup.secret}
                </code>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                Backup Codes
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {creationResult.totpSetup.backupCodes.slice(0, 6).map((code, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-500 border border-zinc-100 dark:border-zinc-800"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleAddUser}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
            icon={<HiOutlineMail />}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1 opacity-70">
              User Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border font-bold text-xs transition-all ${
                  formData.role === 'USER'
                    ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                    : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500'
                }`}
                onClick={() => setFormData({ ...formData, role: 'USER' })}
              >
                User
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border font-bold text-xs transition-all ${
                  formData.role === 'ADMIN'
                    ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                    : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500'
                }`}
                onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
              >
                Admin
              </button>
            </div>
          </div>
          <Input
            label="Quota"
            type="number"
            value={formData.storageQuota}
            onChange={e => setFormData({ ...formData, storageQuota: parseInt(e.target.value) })}
            icon={<HiOutlineDatabase />}
            suffix={
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pr-2">
                {formatSize(formData.storageQuota)}
              </span>
            }
          />
        </form>
      )}
    </Modal>
  );
}
