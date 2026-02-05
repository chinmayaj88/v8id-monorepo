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
import { clsx } from 'clsx';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: HiOutlineHome },
  { name: 'All files', href: '/dashboard/files', icon: HiOutlineFolder },
  { name: 'Shared', href: '/dashboard/shared', icon: HiOutlineUserGroup },
  { name: 'Vault', href: '/dashboard/vault', icon: HiOutlineShieldCheck },
  { name: 'Recent', href: '/dashboard/recent', icon: HiOutlineClock },
  { name: 'Deleted', href: '/dashboard/trash', icon: HiOutlineTrash },
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
      await apiClient.post('/auth/logout');
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed', error);
      dispatch(logout());
    }
  };

  if (!mounted) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 transition-colors duration-300 bg-black">
      <div className="flex h-full flex-col bg-black">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-zinc-800 bg-black">
          <div className="relative h-8 w-8 min-w-[32px]">
            <img
              src="/images/v8id-logo.png"
              alt="V8id Logo"
              className="h-full w-full object-contain brightness-110 shadow-sm"
              onError={e => {
                // Fallback to logo-2 if logo fails
                (e.target as HTMLImageElement).src = '/images/v8id-logo-2.png';
              }}
            />
          </div>
          <span className="text-xl font-bold text-white tracking-tighter uppercase italic">
            V8id Cloud
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6 bg-black">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )}
              >
                <item.icon
                  className={clsx(
                    'h-5 w-5',
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Storage Info */}
        <div className="px-6 py-6 border-t border-zinc-800 bg-black">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span className="text-zinc-500">Storage Usage</span>
              <span className="text-[#a78bfa]">
                {user?.storageUsedFormatted || '0 B'} / {user?.storageQuotaFormatted || '5 GB'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden bg-zinc-900 border border-zinc-800/50">
              <div
                className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-[#7c3aed] to-[#a78bfa]"
                style={{ width: `${user?.storagePercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="border-t border-zinc-800 bg-black pb-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-6 py-4 transition-all duration-200 hover:bg-zinc-900"
          >
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#7c3aed] to-[#6d28d9] text-white text-sm font-black shadow-lg shadow-[#7c3aed]/20">
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black bg-green-500"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ''}`.trim()
                  : user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] font-bold truncate text-zinc-500 uppercase tracking-tighter">
                {user?.role || 'Basic Plan'}
              </p>
            </div>
            <HiOutlineCog className="h-5 w-5 text-zinc-600 hover:text-white transition-colors" />
          </Link>

          <div className="px-3 pb-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 rounded-xl border border-zinc-800 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 group"
            >
              <HiOutlineLogout className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
