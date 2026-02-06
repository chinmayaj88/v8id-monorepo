'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
} from 'react-icons/hi';
import Button from '@/components/ui/Button';
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
          <div
            className="p-8 rounded-[32px] border relative overflow-hidden group shadow-sm transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

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
                <button
                  className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg border transition-all hover:scale-110"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <HiOutlineCog className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </h2>
              <div
                className="flex items-center gap-2 mt-1 mb-6 text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                <HiOutlineMail className="w-4 h-4" />
                {user.email}
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                <div
                  className="p-4 rounded-2xl flex flex-col items-center gap-1 transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Role
                  </span>
                  <span className="font-black text-v8-primary">{user.role}</span>
                </div>
                <div
                  className="p-4 rounded-2xl flex flex-col items-center gap-1 transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Status
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-500">
                    <HiCheckCircle className="w-4 h-4" /> Active
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-center rounded-xl border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-300"
                onClick={handleLogout}
                icon={<HiOutlineLogout className="w-4 h-4" />}
              >
                Log Out
              </Button>
            </div>
          </div>

          {/* Plan Card */}
          <div
            className="p-8 rounded-[32px] border relative overflow-hidden shadow-sm transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-v8-primary">
                <HiOutlineCloud className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Free Plan
              </span>
            </div>

            <h3 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              V8id Cloud Basic
            </h3>
            <p className="text-xs font-medium mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Your current storage plan details.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Storage Used</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {user.storageUsedFormatted} / {user.storageQuotaFormatted}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-v8-primary rounded-full transition-all duration-500"
                    style={{ width: `${user.storagePercentage}%` }}
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
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="space-y-8 lg:col-span-2">
          {/* Security Settings - Change Password & Backup Codes */}
          <div
            className="p-8 rounded-[32px] border shadow-sm transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                <HiOutlineLockClosed className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  Security Settings
                </h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Manage your password and 2FA recovery codes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-between p-4 rounded-2xl border transition-all text-left group hover:shadow-lg"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-v8-primary transition-colors">
                    <HiOutlineKey className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Change Password
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Update your login password
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowBackupCodesModal(true)}
                className="flex items-center justify-between p-4 rounded-2xl border transition-all text-left group hover:shadow-lg"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-v8-primary transition-colors">
                    <HiOutlineShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Backup Codes
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      View your 2FA recovery codes
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div
            className="p-8 rounded-[32px] border shadow-sm transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                <HiOutlineShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  Active Sessions
                </h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Manage devices logged into your account.
                </p>
              </div>
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
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          ></div>
          <div
            className="rounded-[32px] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-v8-primary focus:bg-white dark:focus:bg-zinc-950 transition-all outline-none text-gray-900 dark:text-white"
                  value={passwordForm.currentPassword}
                  onChange={e =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-v8-primary focus:bg-white dark:focus:bg-zinc-950 transition-all outline-none text-gray-900 dark:text-white"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-v8-primary focus:bg-white dark:focus:bg-zinc-950 transition-all outline-none text-gray-900 dark:text-white"
                  value={passwordForm.confirmPassword}
                  onChange={e =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={passwordLoading}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBackupCodesModal(false)}
          ></div>
          <div
            className="rounded-[32px] w-full max-w-lg p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Backup Codes</h3>
              <button
                onClick={() => setShowBackupCodesModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <HiOutlineExclamation className="w-6 h-6 shrink-0" />
              <p>
                Save these codes in a secure place. You can use each code only once to access your
                account if you lose your device.
              </p>
            </div>

            {loadingCodes ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-v8-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {backupCodes.length > 0 ? (
                  backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-center font-mono font-bold tracking-wider text-gray-700 dark:text-gray-300"
                    >
                      {code}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-4">
                    No codes generated yet.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowBackupCodesModal(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 dark:border-zinc-700"
                onClick={regenerateBackupCodes}
                isLoading={loadingCodes}
                icon={<HiOutlineRefresh className="w-4 h-4" />}
              >
                Regenerate Codes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
