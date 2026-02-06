'use client';

import React, { FormEvent, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCloud,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineTrash,
  HiOutlineLogout,
  HiCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiX,
  HiOutlineRefresh,
  HiOutlineFingerPrint,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PremiumLoader from '@/components/ui/PremiumLoader';
import { useRouter } from 'next/navigation';

// Types
interface DeviceSession {
  id: string;
  userId: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
  deviceName: string;
  os?: string;
  browser?: string;
  ipAddress: string;
  location?: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // Initials logic
  const initials = useMemo(() => {
    if (!user) return 'U';
    const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;

    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  // Fetch Sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch Backup Codes when modal opens
  useEffect(() => {
    if (showBackupCodesModal) {
      fetchBackupCodes();
    }
  }, [showBackupCodesModal]);

  const fetchSessions = async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.USER.SESSIONS);
      setSessions(response.data?.data?.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchBackupCodes = async () => {
    setLoadingCodes(true);
    try {
      const response = await apiClient.get(ENDPOINTS.AUTH.BACKUP_CODES);
      setBackupCodes(response.data?.data?.codes || []);
    } catch (error) {
      console.error('Failed to fetch backup codes', error);
      // @ts-ignore
      alert(error.response?.data?.message || 'Failed to fetch backup codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleOpenBackupCodes = async () => {
    setShowBackupCodesModal(true);
    await fetchBackupCodes();
  };

  const regenerateBackupCodes = async () => {
    if (!confirm('Are you sure? Old codes will stop working immediately.')) return;
    setLoadingCodes(true);
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGENERATE_BACKUP_CODES);
      setBackupCodes(response.data?.data?.codes || []);
    } catch (error) {
      console.error('Failed to regenerate codes', error);
      alert('Failed to regenerate codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      if (
        !confirm(
          'This is your current session. Revoking it will log you out immediately. Continue?'
        )
      )
        return;
    }

    setRevokingId(sessionId);
    try {
      // @ts-ignore
      await apiClient.delete(ENDPOINTS.USER.REVOKE_SESSION(sessionId));

      if (isCurrent) {
        handleLogout();
        return;
      }

      // Optimistic update
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session', error);
      alert('Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      alert('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password', error);
      // @ts-ignore
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  if (!user) return <PremiumLoader />;

  return (
    <div className=" mx-auto space-y-8 pb-12 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1
            className="text-4xl font-black tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            Account Settings
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Manage your profile, security, and connected devices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Plan */}
        <div className="space-y-8 lg:col-span-1">
          {/* Profile Card */}
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-linear-to-br from-purple-500 to-indigo-500 opacity-5 blur-3xl -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 bg-linear-to-tr from-purple-500 to-indigo-500 rounded-full blur-lg opacity-20"></div>
                <div
                  className="relative w-full h-full rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--card-bg)' }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-v8-primary">{initials}</span>
                  )}
                </div>
              </div>

              <h2
                className="text-2xl font-black tracking-tight mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.firstName} {user.lastName}
              </h2>
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-linear-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20 mb-6">
                Premium Member
              </div>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-4 p-3 rounded-2xl transition-colors hover:bg-zinc-500/5">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <HiOutlineUser className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Username
                    </label>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      @{user.firstName?.toLowerCase()}
                      {user.lastName?.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-2xl transition-colors hover:bg-zinc-500/5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <HiOutlineMail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Email Address
                    </label>
                    <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-(--border-primary) my-6"></div>

              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Active Status
                  </span>
                </div>
                <HiCheckCircle className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="w-full mt-8">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center group"
                  onClick={handleLogout}
                >
                  <HiOutlineLogout className="w-4 h-4 mr-2 group-hover:text-red-500 transition-colors" />
                  Sign Out of All Devices
                </Button>
              </div>
            </div>
          </Card>

          {/* Plan Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-linear-to-br from-indigo-500 to-purple-600 opacity-5 blur-3xl -mr-12 -mt-12"></div>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <HiOutlineCloud className="w-8 h-8 font-black" />
              </div>
              <div>
                <h3
                  className="text-xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Cloud Plan
                </h3>
                <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  Manage your subscription
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Storage Used
                  </span>
                  <span
                    className="text-sm font-black tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.storageUsedFormatted ?? '0 B'} / {user.storageQuotaFormatted ?? '5 GB'}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 shadow-inner overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20 transition-all duration-1000 ease-out"
                    style={{ width: `${user.storagePercentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full justify-center rounded-xl font-bold bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
              icon={<HiOutlineCreditCard className="w-4 h-4" />}
            >
              Upgrade Plan
            </Button>
          </Card>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="space-y-8 lg:col-span-2">
          {/* Security Settings - Change Password & Backup Codes */}
          <Card>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <HiOutlineShieldCheck className="w-8 h-8 font-black" />
                </div>
                <div>
                  <h3
                    className="text-xl font-black tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Security Settings
                  </h3>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                    Protect your account
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="p-6 rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all group lg:aspect-square flex flex-col justify-between"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineLockClosed className="w-6 h-6" />
                </div>
                <div>
                  <h4
                    className="text-base font-black tracking-tight mb-2 group-hover:text-v8-primary transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Change Password
                  </h4>
                  <p className="text-xs font-bold text-zinc-400">
                    Update your account password regularly for better security
                  </p>
                </div>
              </button>

              <button
                onClick={handleOpenBackupCodes}
                className="p-6 rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all group lg:aspect-square flex flex-col justify-between"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineKey className="w-6 h-6" />
                </div>
                <div>
                  <h4
                    className="text-base font-black tracking-tight mb-2 group-hover:text-v8-primary transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Backup Codes
                  </h4>
                  <p className="text-xs font-bold text-zinc-400">
                    Generate temporary access codes if 2FA is unavailable
                  </p>
                </div>
              </button>

              <div className="p-6 rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-purple-500/5 to-indigo-500/5 md:col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <HiOutlineFingerPrint className="w-6 h-6 font-black" />
                  </div>
                  <div>
                    <h4
                      className="text-base font-black tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Two-Factor Auth
                    </h4>
                    <p className="text-xs font-bold text-zinc-400">Enabled since Oct 12, 2025</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  Active
                </div>
              </div>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                  <HiOutlineClock className="w-8 h-8 font-black" />
                </div>
                <div>
                  <h3
                    className="text-xl font-black tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Active Sessions
                  </h3>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                    Devices currently logged in
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold"
                icon={<HiOutlineRefresh className="w-4 h-4" />}
                onClick={fetchSessions}
              >
                Refresh
              </Button>
            </div>
            {loadingSessions ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-v8-primary"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <HiOutlineDeviceMobile className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No active sessions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                    style={{
                      borderColor: session.isCurrent
                        ? 'var(--color-v8-primary)'
                        : 'var(--border-primary)',
                      backgroundColor: session.isCurrent ? 'var(--bg-tertiary)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: session.isCurrent
                            ? 'var(--color-v8-primary)'
                            : 'var(--text-tertiary)',
                        }}
                      >
                        {session.deviceType === 'DESKTOP' ? (
                          <HiOutlineDesktopComputer className="w-6 h-6" />
                        ) : (
                          <HiOutlineDeviceMobile className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4
                          className="font-bold text-sm flex items-center gap-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {session.deviceName || 'Unknown Device'}
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </h4>
                        <div
                          className="flex items-center gap-3 text-xs font-medium mt-1"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <span>{session.location || session.ipAddress}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span>
                            {session.isCurrent
                              ? 'Active now'
                              : new Date(session.lastActiveAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-xs font-bold ${session.isCurrent ? 'text-purple-600 hover:bg-purple-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                      onClick={() => handleRevokeSession(session.id, session.isCurrent)}
                      isLoading={revokingId === session.id}
                    >
                      {session.isCurrent ? 'Log Out' : 'Revoke'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={passwordLoading}
              onClick={handleChangePassword}
            >
              Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            required
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <Input
            label="New Password"
            type="password"
            required
            minLength={8}
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        isOpen={showBackupCodesModal}
        onClose={() => setShowBackupCodesModal(false)}
        title="Backup Codes"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setShowBackupCodesModal(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={regenerateBackupCodes}
              isLoading={loadingCodes}
              icon={<HiOutlineRefresh className="w-4 h-4" />}
            >
              Regenerate
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex gap-3 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <HiOutlineExclamation className="w-6 h-6 shrink-0" />
            <p>
              Save these codes in a secure place. You can use each code only once to access your
              account if you lose your device.
            </p>
          </div>

          {loadingCodes ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <PremiumLoader />
              <p className="text-xs font-black uppercase tracking-widest text-v8-primary animate-pulse">
                Generating...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.length > 0 ? (
                backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl text-center font-mono font-bold tracking-wider text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-v8-primary transition-all"
                  >
                    {code}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  No codes generated yet. Use the regenerate button to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
