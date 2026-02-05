'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';

export default function DynamicHeader() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  // Hide header on auth and dashboard pages (dashboard has its own header)
  const isAuthPage = ['/login', '/', '/forgot-password', '/verify-2fa'].includes(pathname);
  const isDashboardPage = pathname.startsWith('/dashboard');

  if (isAuthPage || isDashboardPage) return null;

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/files')) return 'My Files';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/shared')) return 'Shared With Me';
    return 'V8id Cloud';
  };

  const handleLogout = async () => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed', error);
      dispatch(logout());
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </div>
            {/* Only show V8id Cloud on smaller screens if needed, otherwise Page Title takes precedence */}
            <span className="hidden font-bold text-slate-900 dark:text-white sm:inline-block">
              V8id Cloud
            </span>
          </Link>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block"></div>

          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {getPageTitle(pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:ring-2 hover:ring-[#7c3aed]/20"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid var(--border-primary)`,
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName || ''}`
                          : user?.email?.split('@')[0]}
                      </p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-tighter mt-0.5"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/dashboard/settings"
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-zinc-500/10 text-slate-700 dark:text-slate-300"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <HiOutlineUser className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-colors text-red-500 hover:bg-red-500/10"
                      >
                        <HiOutlineLogout className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-purple-700"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
