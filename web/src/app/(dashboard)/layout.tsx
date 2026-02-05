'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Redirect if not authenticated and not loading anymore
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-brand-primary"
            style={{ borderColor: '#111111', borderTopColor: 'var(--brand-primary)' }}
          ></div>
          <p className="text-sm font-bold animate-pulse" style={{ color: '#a1a1aa' }}>
            Initializing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Still show auth check result visually while redirecting
  if (!isAuthenticated) return null;

  return (
    <div
      style={{ backgroundColor: '#000000', minHeight: '100vh' }}
      className="transition-colors duration-300"
    >
      <Sidebar />
      <div className="lg:ml-64 transition-all bg-black min-h-screen">
        <DashboardHeader />
        <main className="p-6 bg-black">{children}</main>
      </div>
    </div>
  );
}
