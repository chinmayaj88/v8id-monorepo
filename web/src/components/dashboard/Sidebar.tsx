'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineFolder,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: HiOutlineHome },
  { name: 'All files', href: '/dashboard/files', icon: HiOutlineFolder },
  { name: 'Shared', href: '/dashboard/shared', icon: HiOutlineUserGroup },
  { name: 'Vault', href: '/dashboard/vault', icon: HiOutlineShieldCheck },
  { name: 'Recent', href: '/dashboard/recent', icon: HiOutlineClock },
  { name: 'Trash', href: '/dashboard/trash', icon: HiOutlineTrash },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed', error);
      dispatch(logout());
    }
  };

  if (!mounted) return null;

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r transition-colors duration-300"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className="flex h-16 items-center gap-3 px-6 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="relative h-8 w-8 min-w-[32px]">
            <img
              src="/images/v8id-logo.png"
              alt="V8id Logo"
              className="h-full w-full object-contain brightness-110"
              onError={e => {
                (e.target as HTMLImageElement).src = '/images/v8id-logo-2.png';
              }}
            />
          </div>
          <span
            className="text-xl font-bold tracking-tighter uppercase italic"
            style={{ color: 'var(--text-primary)' }}
          >
            V8id Cloud
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  color: isActive ? 'var(--sidebar-text-active)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Storage Info */}
        <div className="px-6 py-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span style={{ color: 'var(--text-tertiary)' }}>Storage Usage</span>
              <span style={{ color: 'var(--brand-primary)' }}>
                {user?.storageUsedFormatted || '0 B'} / {user?.storageQuotaFormatted || '5 GB'}
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${user?.storagePercentage || 0}%`,
                  background: 'linear-gradient(to right, #7c3aed, #a78bfa)',
                }}
              />
            </div>
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="border-t pb-2" style={{ borderColor: 'var(--border-primary)' }}>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-6 py-4 transition-all duration-200"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="relative">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-black shadow-lg shadow-[#7c3aed]/20"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-green-500"
                style={{ borderColor: 'var(--sidebar-bg)' }}
              ></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ''}`.trim()
                  : user?.email?.split('@')[0]}
              </p>
              <p
                className="text-[10px] font-bold truncate uppercase tracking-tighter"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {user?.role || 'Basic Plan'}
              </p>
            </div>
            <HiOutlineCog className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
          </Link>

          <div className="px-3 pb-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 rounded-xl border group"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <HiOutlineLogout className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
