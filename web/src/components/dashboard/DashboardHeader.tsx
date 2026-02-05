'use client';

import React, { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineFilter,
} from 'react-icons/hi';

export default function DashboardHeader() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) return null;

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center gap-4 flex-1 max-w-2xl px-6">
        <div className="relative w-full max-w-md">
          <HiOutlineSearch
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search files, folders, and more..."
            className="w-full rounded-xl border py-2 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-150 focus:ring-2 focus:ring-[#7c3aed]/20"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-6">
        <div
          className="flex items-center rounded-lg border p-0.5"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}
        >
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition-all duration-150 ${viewMode === 'grid' ? 'bg-[#7c3aed] text-white shadow-sm' : ''}`}
            style={{ color: viewMode !== 'grid' ? 'var(--text-tertiary)' : undefined }}
          >
            <HiOutlineViewGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-all duration-150 ${viewMode === 'list' ? 'bg-[#7c3aed] text-white shadow-sm' : ''}`}
            style={{ color: viewMode !== 'list' ? 'var(--text-tertiary)' : undefined }}
          >
            <HiOutlineViewList className="h-4 w-4" />
          </button>
        </div>

        <button
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all duration-200"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
        >
          <HiOutlineFilter className="h-4 w-4" />
          <span>Filter</span>
        </button>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
        >
          {theme === 'light' ? (
            <HiOutlineMoon className="h-5 w-5" />
          ) : (
            <HiOutlineSun className="h-5 w-5" />
          )}
        </button>

        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-150 hover:bg-[#6d28d9] active:scale-95 shadow-lg shadow-[#7c3aed]/20"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <HiOutlinePlus className="h-5 w-5" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
