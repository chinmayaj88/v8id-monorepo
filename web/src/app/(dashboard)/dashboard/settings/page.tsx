'use client';

import React from 'react';
import { HiOutlineCog } from 'react-icons/hi';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div
        className="p-8 rounded-3xl border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
      >
        <HiOutlineCog className="h-16 w-16 text-[#7c3aed]" />
      </div>
      <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>
      <p className="max-w-md text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Manage your account, storage preferences, and security settings.
      </p>
    </div>
  );
}
