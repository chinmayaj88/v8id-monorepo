'use client';

import React from 'react';
import { HiOutlineShieldCheck } from 'react-icons/hi';

export default function VaultPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div
        className="p-8 rounded-3xl border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
      >
        <HiOutlineShieldCheck className="h-16 w-16 text-[#7c3aed]" />
      </div>
      <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Personal Vault
      </h1>
      <p className="max-w-md text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Protect your most sensitive documents with end-to-end encryption and two-factor
        authentication.
      </p>
      <button className="px-8 py-3 rounded-2xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7c3aed]/20">
        Unlock Vault
      </button>
    </div>
  );
}
