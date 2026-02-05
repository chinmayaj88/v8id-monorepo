'use client';

import React from 'react';
import { HiOutlineFolder } from 'react-icons/hi';

export default function FilesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div
        className="p-8 rounded-3xl border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
      >
        <HiOutlineFolder className="h-16 w-16 text-[#7c3aed]" />
      </div>
      <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        All Files
      </h1>
      <p className="max-w-md text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Manage all your uploaded files and folders in one place. Organize your digital life with
        ease.
      </p>
      <button className="px-8 py-3 rounded-2xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7c3aed]/20">
        Upload Files
      </button>
    </div>
  );
}
