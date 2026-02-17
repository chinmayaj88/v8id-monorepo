'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineDotsVertical,
  HiOutlineTrash,
  HiChevronRight,
  HiOutlineMail,
  HiOutlineDatabase,
  HiOutlineUser,
} from 'react-icons/hi';
import Card from '@/components/ui/Card';

interface UserItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  storageQuota: string | number;
  storageUsed: string | number;
  isActive: boolean;
  createdAt: string;
  [key: string]: any;
}

interface UniversalUserViewProps {
  users: UserItem[];
  viewMode: 'list' | 'grid';
  onUserClick?: (user: UserItem) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDelete?: (user: UserItem) => void;
  onEdit?: (user: UserItem) => void;
}

const formatSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Checkbox = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onChange}
    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
      checked
        ? 'bg-v8-primary border-v8-primary'
        : 'border-zinc-300 dark:border-zinc-600 hover:border-v8-primary'
    }`}
  >
    {checked && (
      <svg
        className="w-3.5 h-3.5 text-white stroke-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
);

export default function UniversalUserView({
  users,
  viewMode,
  onUserClick,
  enableSelection,
  selectedIds,
  onSelectionChange,
  onDelete,
  onEdit,
}: UniversalUserViewProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };

    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeMenuId]);

  // Update menu position when activeMenuId changes
  useEffect(() => {
    if (activeMenuId && buttonRefs.current[activeMenuId]) {
      const button = buttonRefs.current[activeMenuId];
      const rect = button!.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX,
      });
    } else {
      setMenuPosition(null);
    }
  }, [activeMenuId]);

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onSelectionChange || !selectedIds) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds?.size === users.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(users.map(u => u.id)));
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const setButtonRef = (id: string) => (ref: HTMLButtonElement | null) => {
    buttonRefs.current[id] = ref;
  };

  const renderActionMenu = (user: UserItem) => {
    if (!menuPosition) return null;

    return (
      <div
        ref={menuRef}
        className="fixed w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl z-9999 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
        style={{
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {onDelete && (
          <button
            onClick={() => {
              onDelete(user);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-extrabold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineTrash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            Delete User
          </button>
        )}
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
        {users.map(user => {
          const storageUsed = parseInt(String(user.storageUsed));
          const storageQuota = parseInt(String(user.storageQuota));
          const usagePercent = Math.min(100, (storageUsed / storageQuota) * 100);

          return (
            <Card
              key={user.id}
              onClick={() => onUserClick?.(user)}
              className="cursor-pointer group relative bg-card-bg hover:shadow-2xl hover:-translate-y-2 p-6 rounded-[32px] overflow-visible"
            >
              {/* Top Section: Icon/Avatar */}
              <div className="relative mb-8 z-10">
                {enableSelection && (
                  <div className="absolute top-[-10px] left-[-10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedIds?.has(user.id) || false}
                      onChange={e => handleToggle(e, user.id)}
                    />
                  </div>
                )}

                <div
                  className={`h-24 w-full rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 relative overflow-hidden group-hover:scale-105 transition-all duration-500 shadow-xl shadow-black/5 ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600'
                      : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                  }`}
                >
                  <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl font-black text-4xl">
                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                  </div>
                </div>

                <div className="absolute top-0 right-0 z-30">
                  <button
                    ref={setButtonRef(user.id)}
                    onClick={e => toggleMenu(e, user.id)}
                    className="p-1.5 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:text-v8-primary shadow-lg"
                  >
                    <HiOutlineDotsVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Middle Section: Name and Meta */}
              <div className="relative z-10">
                <h3
                  className="text-base font-black tracking-tight mb-1 truncate group-hover:text-v8-primary transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.firstName} {user.lastName}
                </h3>

                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-v8-primary">
                    {user.role}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter truncate">
                    {user.email}
                  </span>
                </div>

                {/* Bottom Section: Progress and Date */}
                <div
                  className="flex flex-col gap-3 pt-4 border-t"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="opacity-40">Storage</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {usagePercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-v8-primary transition-all duration-1000"
                        style={{ width: `${usagePercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-v8-primary">{formatSize(storageUsed)}</span>
                    <span className="font-black uppercase tracking-tighter opacity-40">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {activeMenuId && renderActionMenu(users.find(u => u.id === activeMenuId)!)}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div
        className={`grid ${
          enableSelection
            ? 'grid-cols-[40px_1fr_40px] md:grid-cols-[40px_1fr_180px_40px] lg:grid-cols-[40px_1fr_180px_120px_40px] xl:grid-cols-[40px_1fr_180px_120px_120px_40px]'
            : 'grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px]'
        } items-center px-4 py-2 text-[13px] font-medium`}
        style={{ color: 'var(--text-tertiary)' }}
      >
        {enableSelection && (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds?.size === users.length && users.length > 0}
              onChange={handleSelectAll}
            />
          </div>
        )}
        <div className="flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
          User <HiChevronRight className="w-3 h-3 rotate-90" />
        </div>
        <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
          Joined <HiChevronRight className="w-3 h-3 rotate-90" />
        </div>
        <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
          Storage <HiChevronRight className="w-3 h-3 rotate-90" />
        </div>
        <div className="hidden xl:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
          Role <HiChevronRight className="w-3 h-3 rotate-90" />
        </div>
        <div></div>
      </div>

      {users.map(user => {
        const storageUsed = parseInt(String(user.storageUsed));
        const storageQuota = parseInt(String(user.storageQuota));
        const usagePercent = Math.min(100, (storageUsed / storageQuota) * 100);

        return (
          <div
            key={user.id}
            onClick={() => onUserClick?.(user)}
            className={`grid ${
              enableSelection
                ? 'grid-cols-[40px_1fr_40px] md:grid-cols-[40px_1fr_180px_40px] lg:grid-cols-[40px_1fr_180px_120px_40px] xl:grid-cols-[40px_1fr_180px_120px_120px_40px]'
                : 'grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px]'
            } items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.002] transition-all cursor-pointer group bg-card-bg relative`}
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {enableSelection && (
              <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds?.has(user.id) || false}
                  onChange={e => handleToggle(e, user.id)}
                />
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 transition-transform group-hover:scale-110 duration-500 ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600'
                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                }`}
              >
                <div className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg font-black text-[11px]">
                  {user.firstName?.[0] || user.email[0].toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className="font-bold text-[14px] truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Joined */}
            <div className="hidden md:block text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>

            {/* Storage */}
            <div
              className="hidden lg:flex flex-col gap-1 pr-8"
              style={{ color: 'var(--text-primary)' }}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{formatSize(storageUsed)}</span>
                <span className="opacity-30 text-[9px] uppercase tracking-widest">
                  {usagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-v8-primary transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            {/* Role */}
            <div className="hidden xl:flex items-center">
              <span
                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}
              >
                {user.role}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end relative">
              <button
                ref={setButtonRef(user.id)}
                onClick={e => toggleMenu(e, user.id)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
              >
                <HiOutlineDotsVertical
                  className="h-4 w-4"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </button>
            </div>
          </div>
        );
      })}
      {/* Render active menu outside of rows to avoid z-index issues */}
      {activeMenuId && renderActionMenu(users.find(u => u.id === activeMenuId)!)}
    </div>
  );
}
