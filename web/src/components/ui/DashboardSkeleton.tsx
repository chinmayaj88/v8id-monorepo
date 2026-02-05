'use client';

import React from 'react';
import Skeleton from './Skeleton';

export function SuggestedFilesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 rounded-2xl border p-4"
          style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
        >
          <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
          <Skeleton variant="text" width="80%" className="h-3 mt-2" />
          <Skeleton variant="text" width="40%" className="h-2" />
        </div>
      ))}
    </div>
  );
}

export function FoldersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border p-3"
          style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
        >
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" className="h-3" />
            <Skeleton variant="text" width="40%" className="h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
    >
      <div className="p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton variant="rectangular" width={32} height={32} className="rounded-lg" />
            <Skeleton variant="text" width="30%" className="h-4" />
            <Skeleton variant="text" width="20%" className="h-4 hidden md:block" />
            <Skeleton variant="text" width="10%" className="h-4 hidden lg:block" />
            <div className="flex-1"></div>
            <Skeleton variant="rectangular" width={24} height={24} className="rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <Skeleton variant="text" width={150} height={40} className="mb-2" />
        <Skeleton variant="text" width={300} height={20} />
      </div>

      <section>
        <Skeleton variant="text" width={120} height={14} className="mb-4" />
        <SuggestedFilesSkeleton />
      </section>

      <section>
        <Skeleton variant="text" width={80} height={14} className="mb-4" />
        <FoldersSkeleton />
      </section>

      <section>
        <Skeleton variant="text" width={100} height={14} className="mb-4" />
        <TableSkeleton />
      </section>
    </div>
  );
}
