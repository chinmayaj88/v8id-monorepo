'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

export default function DynamicHeader() {
  const pathname = usePathname();

  // Hide header on auth pages
  const authRoutes = ['/login', '/', '/forgot-password', '/verify-2fa'];
  if (authRoutes.includes(pathname)) return null;

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/files')) return 'My Files';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/shared')) return 'Shared With Me';
    return 'V8id Cloud';
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
          {/* Placeholder for User Profile / Actions */}
          <div className="h-8 w-8 rounded-full bg-purple-100 border border-purple-200"></div>
        </div>
      </div>
    </header>
  );
}
