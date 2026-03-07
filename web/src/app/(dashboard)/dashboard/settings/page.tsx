'use client';

import React, { FormEvent, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setVaultSetupFlag } from '@/store/slices/authSlice';
import { setupVault, changeVaultPassword } from '@/store/slices/vaultSlice';
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
  HiChevronRight,
  HiOutlineCamera,
  HiOutlinePencil,
  HiOutlineGlobe,
} from 'react-icons/hi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PremiumLoader from '@/components/ui/PremiumLoader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/ui/ModalProvider';

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

type SettingsTab = 'profile' | 'security' | 'sessions' | 'plan';

const navItems: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <HiOutlineUser className="w-5 h-5" />,
    description: 'Identity & preferences',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <HiOutlineShieldCheck className="w-5 h-5" />,
    description: 'Password & 2FA',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: <HiOutlineClock className="w-5 h-5" />,
    description: 'Active devices',
  },
  {
    id: 'plan',
    label: 'Plan & Storage',
    icon: <HiOutlineCloud className="w-5 h-5" />,
    description: 'Quota & billing',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [show2FARequiredModal, setShow2FARequiredModal] = useState(false);
  const [showVaultSetupModal, setShowVaultSetupModal] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [isSettingUpVault, setIsSettingUpVault] = useState(false);

  // Change Vault Password
  const [showChangeVaultModal, setShowChangeVaultModal] = useState(false);
  const [changeVaultForm, setChangeVaultForm] = useState({ current: '', next: '', confirm: '' });
  const [isChangingVault, setIsChangingVault] = useState(false);

  const { showNotification, showConfirmation } = useModal();

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    totpCode: '',
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

  useEffect(() => {
    fetchSessions();
  }, []);

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
      showNotification({
        title: 'Error',
        message: (error as any).response?.data?.message || 'Failed to fetch backup codes',
        type: 'error',
      });
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleOpenBackupCodes = async () => {
    setShowBackupCodesModal(true);
    await fetchBackupCodes();
  };

  const regenerateBackupCodes = async () => {
    showConfirmation({
      title: 'Regenerate Backup Codes?',
      message:
        'Are you sure? Old codes will stop working immediately. This action cannot be undone.',
      confirmText: 'Regenerate',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setLoadingCodes(true);
        try {
          const response = await apiClient.post(ENDPOINTS.AUTH.REGENERATE_BACKUP_CODES);
          setBackupCodes(response.data?.data?.codes || []);
          showNotification({
            title: 'Success',
            message: 'Backup codes regenerated successfully',
            type: 'success',
          });
        } catch (error) {
          showNotification({
            title: 'Error',
            message: 'Failed to regenerate backup codes',
            type: 'error',
          });
        } finally {
          setLoadingCodes(false);
        }
      },
    });
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    const confirmMessage = isCurrent
      ? 'This is your current session. Revoking it will log you out immediately. Are you sure?'
      : 'Are you sure you want to revoke this session? The device will be logged out immediately.';

    showConfirmation({
      title: isCurrent ? 'Log Out Device?' : 'Revoke Session?',
      message: confirmMessage,
      confirmText: isCurrent ? 'Log Out' : 'Revoke',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setRevokingId(sessionId);
        try {
          // @ts-ignore
          await apiClient.delete(ENDPOINTS.USER.REVOKE_SESSION(sessionId));
          if (isCurrent) {
            handleLogout(false);
            return;
          }
          setSessions(prev => prev.filter(s => s.id !== sessionId));
          showNotification({
            title: 'Success',
            message: 'Session revoked successfully',
            type: 'success',
          });
        } catch (error) {
          showNotification({ title: 'Error', message: 'Failed to revoke session', type: 'error' });
        } finally {
          setRevokingId(null);
        }
      },
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification({
        title: 'Validation Error',
        message: 'New passwords do not match',
        type: 'error',
      });
      return;
    }
    setPasswordLoading(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        totpCode: passwordForm.totpCode || undefined,
      });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', totpCode: '' });
      showNotification({
        title: 'Success',
        message: 'Password changed successfully',
        type: 'success',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as any).response?.data?.message || 'Failed to change password',
        type: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vaultPassword.length < 8) {
      showNotification({
        title: 'Validation Error',
        message: 'Master password must be at least 8 characters',
        type: 'error',
      });
      return;
    }
    setIsSettingUpVault(true);
    try {
      await dispatch(setupVault(vaultPassword)).unwrap();
      dispatch(setVaultSetupFlag());
      setShowVaultSetupModal(false);
      setVaultPassword('');
      showNotification({
        title: 'Success',
        message: 'Personal Vault configured successfully',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error || 'Failed to configure Vault',
        type: 'error',
      });
    } finally {
      setIsSettingUpVault(false);
    }
  };

  const handleChangeVaultPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeVaultForm.next !== changeVaultForm.confirm) {
      showNotification({
        title: 'Validation Error',
        message: 'New passwords do not match',
        type: 'error',
      });
      return;
    }
    if (changeVaultForm.next.length < 8) {
      showNotification({
        title: 'Validation Error',
        message: 'New password must be at least 8 characters',
        type: 'error',
      });
      return;
    }
    setIsChangingVault(true);
    try {
      await dispatch(
        changeVaultPassword({
          currentVaultPassword: changeVaultForm.current,
          newVaultPassword: changeVaultForm.next,
        })
      ).unwrap();
      setShowChangeVaultModal(false);
      setChangeVaultForm({ current: '', next: '', confirm: '' });
      showNotification({
        title: 'Success',
        message: 'Vault password changed successfully',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error || 'Failed to change vault password',
        type: 'error',
      });
    } finally {
      setIsChangingVault(false);
    }
  };

  const handleLogout = (withConfirmation = true) => {
    if (withConfirmation) {
      showConfirmation({
        title: 'Sign Out?',
        message: 'Are you sure you want to sign out of your account?',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        onConfirm: () => {
          dispatch(logout());
          router.push('/login');
        },
      });
    } else {
      dispatch(logout());
      router.push('/login');
    }
  };

  if (!user) return <PremiumLoader />;

  const storagePercent = user.storagePercentage ?? 0;

  return (
    <div className="min-h-screen pb-12 relative">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 mb-8"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span style={{ color: 'var(--text-secondary)' }}>Settings</span>
      </div>

      {/* Hero Header */}
      <div
        className="relative mb-10 overflow-hidden rounded-[32px] border p-8 md:p-10"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-indigo-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{initials}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <HiOutlineCamera className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center">
                <HiCheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.firstName} {user.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                  {user.role}
                </span>
              </div>
              <p
                className="text-sm font-medium opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user.email}
              </p>
              <div className="flex items-center gap-4 mt-3">
                {user.totpEnabled && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    2FA Active
                  </div>
                )}
                {user.hasVaultSetup && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                    Vault Secured
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleLogout()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200/50 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shrink-0"
          >
            <HiOutlineLogout className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="lg:w-56 shrink-0">
          <nav
            className="sticky top-6 rounded-[24px] border p-2 space-y-1"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
          >
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-left transition-all duration-200 group relative overflow-hidden ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-v8-primary'
                    : 'hover:bg-zinc-500/5'
                }`}
                style={{ color: activeTab === item.id ? undefined : 'var(--text-secondary)' }}
              >
                {activeTab === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-purple-500 to-indigo-500" />
                )}
                <div
                  className={`shrink-0 transition-all ${activeTab === item.id ? 'text-v8-primary' : 'opacity-50 group-hover:opacity-80'}`}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    className={`text-sm font-black leading-none ${activeTab === item.id ? 'text-v8-primary' : ''}`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] font-medium opacity-50 mt-0.5 hidden lg:block">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                title="Profile Information"
                subtitle="Manage your personal details and public identity"
              />

              <div
                className="rounded-[28px] border overflow-hidden"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
              >
                {/* Profile banner */}
                <div className="h-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)',
                      backgroundSize: '30px 30px',
                    }}
                  />
                </div>

                <div className="p-6 -mt-10">
                  <div className="flex items-end gap-4 mb-8">
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-2xl border-4 overflow-hidden shadow-xl"
                        style={{ borderColor: 'var(--card-bg)' }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-2xl font-black text-white">{initials}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pb-1">
                      <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                        {user.firstName} {user.lastName}
                      </h2>
                      <p
                        className="text-xs font-medium opacity-60"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        @{user.firstName?.toLowerCase()}
                        {user.lastName?.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow
                      icon={<HiOutlineUser className="w-4 h-4" />}
                      label="Full Name"
                      value={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not set'}
                      color="purple"
                    />
                    <InfoRow
                      icon={<HiOutlineMail className="w-4 h-4" />}
                      label="Email Address"
                      value={user.email}
                      color="indigo"
                    />
                    <InfoRow
                      icon={<HiOutlineGlobe className="w-4 h-4" />}
                      label="Role"
                      value={user.role}
                      color="violet"
                    />
                    <InfoRow
                      icon={<HiOutlineCheckCircle className="w-4 h-4" />}
                      label="Account Status"
                      value="Active & Verified"
                      color="emerald"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                title="Security Center"
                subtitle="Protect your account with advanced security features"
              />

              {/* Security Score */}
              <div
                className="rounded-[28px] border p-6 relative overflow-hidden"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl rounded-full" />
                <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      Security Score
                    </p>
                    <h3
                      className="text-4xl font-black tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {[user.totpEnabled, user.hasVaultSetup].filter(Boolean).length * 40 + 20}
                      <span className="text-xl text-zinc-400">/100</span>
                    </h3>
                    <p className="text-xs font-bold text-zinc-400 mt-1">
                      {user.totpEnabled && user.hasVaultSetup
                        ? 'Maximum Protection'
                        : 'Enable features below to improve'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <SecurityBadge
                      active={!!user.totpEnabled}
                      label="2FA"
                      icon={<HiOutlineFingerPrint className="w-4 h-4" />}
                    />
                    <SecurityBadge
                      active={!!user.hasVaultSetup}
                      label="Vault"
                      icon={<HiOutlineShieldCheck className="w-4 h-4" />}
                    />
                    <SecurityBadge
                      active={!!user.totpEnabled}
                      label="Password"
                      icon={<HiOutlineLockClosed className="w-4 h-4" />}
                    />
                  </div>
                </div>
                <div className="mt-6 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                    style={{
                      width: `${[user.totpEnabled, user.hasVaultSetup].filter(Boolean).length * 40 + 20}%`,
                    }}
                  />
                </div>
              </div>

              {/* Security Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SecurityCard
                  icon={<HiOutlineLockClosed className="w-6 h-6" />}
                  title="Change Password"
                  description={
                    user.totpEnabled
                      ? 'Update your account master password'
                      : 'Requires 2FA to be enabled first'
                  }
                  color="purple"
                  locked={!user.totpEnabled}
                  lockReason="Enable 2FA first"
                  onClick={() => {
                    if (!user.totpEnabled) {
                      setShow2FARequiredModal(true);
                      return;
                    }
                    setShowPasswordModal(true);
                  }}
                />
                <SecurityCard
                  icon={<HiOutlineKey className="w-6 h-6" />}
                  title="Backup Codes"
                  description="Emergency access codes for account recovery"
                  color="indigo"
                  onClick={handleOpenBackupCodes}
                />
                <SecurityCard
                  icon={<HiOutlineShieldCheck className="w-6 h-6" />}
                  title="Personal Vault"
                  description={
                    user.hasVaultSetup
                      ? 'Vault is secured and ready'
                      : 'Setup encrypted password vault'
                  }
                  color={user.hasVaultSetup ? 'emerald' : 'orange'}
                  locked={false}
                  active={!!user.hasVaultSetup}
                  onClick={() => {
                    if (!user.hasVaultSetup) setShowVaultSetupModal(true);
                  }}
                />
                <SecurityCard
                  icon={<HiOutlineKey className="w-6 h-6" />}
                  title="Change Vault Password"
                  description={
                    user.hasVaultSetup ? 'Update your vault master password' : 'Setup a vault first'
                  }
                  color="violet"
                  locked={!user.hasVaultSetup}
                  lockReason="Setup a vault password first"
                  onClick={() => {
                    if (user.hasVaultSetup) setShowChangeVaultModal(true);
                  }}
                />
                <div
                  className="p-5 rounded-[20px] border flex items-center justify-between gap-4"
                  style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.totpEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                    >
                      <HiOutlineFingerPrint className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                        Two-Factor Auth
                      </h4>
                      <p className="text-xs font-medium text-zinc-400">
                        {user.totpEnabled ? 'TOTP authenticator active' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.totpEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}
                  >
                    {user.totpEnabled ? 'Active' : 'Off'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SESSIONS TAB ─── */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <SectionHeader
                  title="Active Sessions"
                  subtitle="Manage devices that are logged in to your account"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<HiOutlineRefresh className="w-4 h-4" />}
                  onClick={fetchSessions}
                >
                  Refresh
                </Button>
              </div>

              {loadingSessions ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-v8-primary border-t-transparent animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Loading sessions…
                    </p>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div
                  className="text-center py-24 rounded-[28px] border border-dashed"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <HiOutlineClock
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <p className="text-sm font-bold text-zinc-400">No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className={`relative flex items-center justify-between p-5 rounded-[20px] border transition-all duration-200 hover:shadow-lg group ${session.isCurrent ? 'border-v8-primary/30 bg-purple-500/5' : ''}`}
                      style={{
                        borderColor: session.isCurrent ? undefined : 'var(--border-primary)',
                        background: session.isCurrent ? undefined : 'var(--card-bg)',
                        animationDelay: `${idx * 50}ms`,
                      }}
                    >
                      {session.isCurrent && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                            This Device
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${session.isCurrent ? 'bg-purple-100 dark:bg-purple-900/30 text-v8-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                        >
                          {session.deviceType === 'MOBILE' ? (
                            <HiOutlineDeviceMobile className="w-6 h-6" />
                          ) : (
                            <HiOutlineDesktopComputer className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h4
                            className="font-black text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {session.deviceName || 'Unknown Device'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mt-0.5 flex-wrap">
                            <span>{session.location || session.ipAddress}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
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
                        className={`shrink-0 text-xs font-bold transition-all ${session.isCurrent ? 'text-purple-600' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
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
          )}

          {/* ─── PLAN TAB ─── */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                title="Plan & Storage"
                subtitle="Manage your subscription and monitor storage usage"
              />

              {/* Storage Hero */}
              <div
                className="rounded-[28px] border p-8 relative overflow-hidden"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                        Storage Used
                      </p>
                      <div className="flex items-end gap-2">
                        <span
                          className="text-4xl font-black tracking-tight"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {user.storageUsedFormatted ?? '0 B'}
                        </span>
                        <span className="text-xl font-bold text-zinc-400 mb-1">
                          / {user.storageQuotaFormatted ?? '5 GB'}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-2xl border bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-0.5">
                        Plan
                      </p>
                      <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                        Premium
                      </p>
                    </div>
                  </div>

                  {/* Storage bar */}
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${storagePercent > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' : storagePercent > 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-purple-500 to-indigo-600'} shadow-lg`}
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span>0 B</span>
                      <span className={storagePercent > 80 ? 'text-red-500' : 'text-zinc-400'}>
                        {storagePercent}% used
                      </span>
                      <span>{user.storageQuotaFormatted ?? '5 GB'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Cloud Storage',
                    value: user.storageQuotaFormatted ?? '5 GB',
                    icon: <HiOutlineCloud className="w-5 h-5" />,
                    color: 'indigo',
                  },
                  {
                    label: 'Vault Secrets',
                    value: '∞ Secrets',
                    icon: <HiOutlineShieldCheck className="w-5 h-5" />,
                    color: 'purple',
                  },
                  {
                    label: 'Device Sessions',
                    value: '3 Devices',
                    icon: <HiOutlineDeviceMobile className="w-5 h-5" />,
                    color: 'violet',
                  },
                ].map(feat => (
                  <div
                    key={feat.label}
                    className="p-5 rounded-[20px] border text-center"
                    style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${feat.color}-100 dark:bg-${feat.color}-900/30 text-${feat.color}-500`}
                    >
                      {feat.icon}
                    </div>
                    <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                      {feat.value}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                      {feat.label}
                    </p>
                  </div>
                ))}
              </div>

              <button className="w-full p-5 rounded-[20px] border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-3 group">
                <HiOutlineCreditCard className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-black text-purple-500">
                  Upgrade to Unlock More Storage
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {/* Change Password */}
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
          {user.totpEnabled && (
            <Input
              label="TOTP Code (2FA)"
              placeholder="000000"
              required
              maxLength={6}
              value={passwordForm.totpCode}
              onChange={e => setPasswordForm({ ...passwordForm, totpCode: e.target.value })}
            />
          )}
        </form>
      </Modal>

      {/* Backup Codes */}
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
              Save these codes in a secure place. Each code can only be used once to access your
              account.
            </p>
          </div>
          {loadingCodes ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <PremiumLoader />
              <p className="text-xs font-black uppercase tracking-widest text-v8-primary animate-pulse">
                Generating…
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.length > 0 ? (
                backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center font-mono font-bold tracking-wider border-2 border-transparent hover:border-v8-primary transition-all cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    {code}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-zinc-400 py-8 text-sm">
                  No codes yet. Click Regenerate to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 2FA Required */}
      <Modal
        isOpen={show2FARequiredModal}
        onClose={() => setShow2FARequiredModal(false)}
        title="Security Requirement"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={() => setShow2FARequiredModal(false)}>
              Understood
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 flex gap-4 text-red-700 dark:text-red-400">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm mb-1">Two-Factor Authentication Required</h4>
              <p className="text-xs font-medium leading-relaxed opacity-90">
                Please enable 2FA before changing your password for account security.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Vault Setup */}
      <Modal
        isOpen={showVaultSetupModal}
        onClose={() => setShowVaultSetupModal(false)}
        title="Setup Personal Vault"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowVaultSetupModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSettingUpVault}
              onClick={handleSetupVault}
            >
              Configure Vault
            </Button>
          </>
        }
      >
        <form onSubmit={handleSetupVault} className="space-y-4">
          <Input
            label="Master Password"
            type="password"
            required
            minLength={8}
            value={vaultPassword}
            onChange={e => setVaultPassword(e.target.value)}
            placeholder="••••••••••••"
          />
          <p className="text-xs text-zinc-500 font-medium">
            Remember this password — it encrypts all your vault secrets and cannot be recovered if
            lost.
          </p>
        </form>
      </Modal>

      {/* Change Vault Password Modal */}
      <Modal
        isOpen={showChangeVaultModal}
        onClose={() => {
          setShowChangeVaultModal(false);
          setChangeVaultForm({ current: '', next: '', confirm: '' });
        }}
        title="Change Vault Password"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowChangeVaultModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isChangingVault}
              onClick={handleChangeVaultPassword}
            >
              Update Vault Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleChangeVaultPassword} className="space-y-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex gap-3 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <HiOutlineExclamation className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              All active vault sessions will be invalidated. You'll need to unlock the vault again
              after changing the master password.
            </p>
          </div>
          <Input
            label="Current Vault Password"
            type="password"
            required
            value={changeVaultForm.current}
            onChange={e => setChangeVaultForm({ ...changeVaultForm, current: e.target.value })}
            placeholder="••••••••••••"
          />
          <Input
            label="New Vault Password"
            type="password"
            required
            minLength={8}
            value={changeVaultForm.next}
            onChange={e => setChangeVaultForm({ ...changeVaultForm, next: e.target.value })}
            placeholder="••••••••••••"
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            value={changeVaultForm.confirm}
            onChange={e => setChangeVaultForm({ ...changeVaultForm, confirm: e.target.value })}
            placeholder="••••••••••••"
          />
        </form>
      </Modal>
    </div>
  );
}

// ─── Helper Components ───

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>
        {subtitle}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-500/5 transition-colors">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30 text-${color}-500 shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="font-bold text-sm truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SecurityBadge({
  active,
  label,
  icon,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function SecurityCard({
  icon,
  title,
  description,
  color,
  locked,
  active,
  lockReason,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  locked?: boolean;
  active?: boolean;
  lockReason?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`group w-full text-left p-5 rounded-[20px] border flex flex-col justify-between min-h-[140px] transition-all duration-200 relative overflow-hidden ${
        active
          ? `border-${color}-300/50 dark:border-${color}-700/50 bg-${color}-50/50 dark:bg-${color}-900/10`
          : locked
            ? 'border-red-200/50 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/5 cursor-not-allowed'
            : 'hover:shadow-lg hover:-translate-y-0.5'
      }`}
      style={
        !active && !locked
          ? { borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }
          : undefined
      }
    >
      {!locked && !active && (
        <div
          className={`absolute inset-0 bg-gradient-to-br from-${color}-500/0 to-${color}-500/0 group-hover:from-${color}-500/5 group-hover:to-${color}-500/0 transition-all duration-300`}
        />
      )}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform ${
          active
            ? `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-500`
            : locked
              ? 'bg-red-100 dark:bg-red-900/30 text-red-400'
              : `bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500 group-hover:scale-110`
        }`}
      >
        {locked ? <HiOutlineLockClosed className="w-5 h-5" /> : icon}
      </div>
      <div>
        <h4
          className={`font-black text-sm mb-1 ${active ? `text-${color}-700 dark:text-${color}-400` : locked ? 'text-red-400' : ''}`}
          style={!active && !locked ? { color: 'var(--text-primary)' } : undefined}
        >
          {title}
        </h4>
        <p
          className={`text-xs font-medium ${active ? `text-${color}-600/70 dark:text-${color}-400/70` : locked ? 'text-red-400' : 'text-zinc-400'}`}
        >
          {locked ? lockReason : description}
        </p>
      </div>
      {active && (
        <div
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-${color}-100 dark:bg-${color}-900/40 text-${color}-600 dark:text-${color}-300 text-[10px] font-black uppercase tracking-wider`}
        >
          Active
        </div>
      )}
    </button>
  );
}
