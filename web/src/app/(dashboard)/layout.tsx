'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

import PremiumLoader from '@/components/ui/PremiumLoader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <PremiumLoader />;
  }

  if (!isAuthenticated) return null;

  return (
    <div
      style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}
      className="transition-colors duration-300"
    >
      <Sidebar />
      <div className="lg:ml-64 transition-all min-h-screen">
        <DashboardHeader />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
