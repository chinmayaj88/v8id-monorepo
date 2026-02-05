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
    // Load theme from localStorage
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 transition-colors duration-300 bg-black">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl px-6">
        <div className="relative w-full max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search files, folders, and more..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-10 pr-4 text-sm font-medium text-white outline-none transition-all duration-150 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-6">
        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-zinc-800 p-0.5 bg-black">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'rounded-md p-1.5 transition-colors duration-150',
              viewMode === 'grid' ? 'bg-[#7c3aed] text-white' : 'text-zinc-500 hover:text-white'
            )}
          >
            <HiOutlineViewGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'rounded-md p-1.5 transition-colors duration-150',
              viewMode === 'list' ? 'bg-[#7c3aed] text-white' : 'text-zinc-500 hover:text-white'
            )}
          >
            <HiOutlineViewList className="h-4 w-4" />
          </button>
        </div>

        {/* Filter */}
        <button className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm font-medium transition-colors duration-150 text-zinc-400 hover:bg-zinc-900 hover:text-white">
          <HiOutlineFilter className="h-4 w-4" />
          <span>Filter</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors duration-150 hover:bg-zinc-900 hover:text-white"
        >
          {theme === 'light' ? (
            <HiOutlineMoon className="h-5 w-5" />
          ) : (
            <HiOutlineSun className="h-5 w-5" />
          )}
        </button>

        {/* Upload Button */}
        <button className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#6d28d9] active:scale-95 shadow-lg shadow-[#7c3aed]/20">
          <HiOutlinePlus className="h-5 w-5" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}

function clsx(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
