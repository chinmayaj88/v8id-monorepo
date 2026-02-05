'use client';

import React from 'react';
import { HiOutlineClock } from 'react-icons/hi';

export default function RecentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div
        className="p-8 rounded-3xl border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
      >
        <HiOutlineClock className="h-16 w-16 text-[#7c3aed]" />
      </div>
      <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Recent
      </h1>
      <p className="max-w-md text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Quickly access the files you've recently opened or worked on.
      </p>
    </div>
  );
}
