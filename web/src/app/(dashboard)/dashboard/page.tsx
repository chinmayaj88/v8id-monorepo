'use client';

import UniversalFileView from '@/components/dashboard/UniversalFileView';
import Button from '@/components/ui/Button';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  HiChevronRight,
  HiOutlineAdjustments,
  HiOutlineDeviceMobile,
  HiOutlineFolder,
  HiOutlineUserAdd,
  HiOutlineViewGrid,
  HiOutlineViewList,
} from 'react-icons/hi';

const dummyPinnedFolders = [
  {
    id: 'p1',
    name: 'Brand Identity',
    updatedAt: new Date().toISOString(),
    fileCount: 12,
    size: '2.4 GB',
    color: 'from-orange-400 to-rose-500',
  },
  {
    id: 'p2',
    name: 'Q1 Analytics',
    updatedAt: new Date().toISOString(),
    fileCount: 8,
    size: '1.1 GB',
    color: 'from-blue-400 to-indigo-600',
  },
  {
    id: 'p3',
    name: 'Legal Documents',
    updatedAt: new Date().toISOString(),
    fileCount: 5,
    size: '850 MB',
    color: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'p4',
    name: 'Website Assets',
    updatedAt: new Date().toISOString(),
    fileCount: 24,
    size: '4.2 GB',
    color: 'from-purple-400 to-fuchsia-600',
  },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);

  useEffect(() => {
    dispatch(fetchSyncData());
  }, [dispatch]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterBySearch = (item: { name: string; mimeType?: string; extension?: string }) => {
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    const mime = item.mimeType?.toLowerCase() || '';

    if (filterType === 'images') return mime.includes('image');
    if (filterType === 'documents')
      return (
        mime.includes('document') ||
        mime.includes('word') ||
        mime.includes('pdf') ||
        mime.includes('text')
      );
    if (filterType === 'spreadsheets')
      return mime.includes('sheet') || mime.includes('excel') || mime.includes('csv');
    if (filterType === 'videos') return mime.includes('video');
    if (filterType === 'archives')
      return mime.includes('zip') || mime.includes('compressed') || mime.includes('tar');

    return true;
  };

  const filteredFiles = files.filter(filterBySearch);
  const filteredFolders = folders.filter(filterBySearch);

  const recentItems = [...filteredFiles, ...filteredFolders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-3 h-3" />
        <span style={{ color: 'var(--text-secondary)' }}>Dashboard</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Button
              variant="primary"
              size="md"
              className="gap-2 rounded-full px-6 font-bold"
              style={{ backgroundColor: '#8b5cf6', color: 'white' }}
              icon={<HiOutlineUserAdd className="w-5 h-5" />}
            >
              Add User
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            className="gap-2 rounded-full px-6 font-bold border"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            icon={<HiOutlineDeviceMobile className="w-5 h-5" />}
          >
            Get the App
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Folders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Pinned Folders
            </h2>
            <Link
              href="/dashboard/files"
              className="text-xs font-black uppercase tracking-widest text-v8-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dummyPinnedFolders.map(folder => {
              return (
                <div
                  key={folder.id}
                  className="p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border group relative bg-card-bg"
                  style={{
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <div
                    className={`absolute top-0 right-0 h-32 w-32 bg-linear-to-br ${folder.color} opacity-20 blur-3xl -mr-12 -mt-12 group-hover:opacity-60 transition-opacity`}
                  />

                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center bg-linear-to-br ${folder.color} shadow-xl shadow-black/10 group-hover:scale-110 transition-transform duration-500`}
                    >
                      <HiOutlineFolder className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3
                      className="text-lg font-black tracking-tight mb-2 truncate group-hover:text-v8-primary transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {folder.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-[9px] font-black uppercase tracking-widest text-v8-primary">
                        Pinned
                      </div>
                      <span className="h-1 w-1 rounded-full bg-zinc-300" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {folder.fileCount} items
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-300" />
                      <span className="text-[10px] font-black text-v8-primary uppercase tracking-tighter">
                        {folder.size}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between text-[11px] pt-4 border-t"
                      style={{
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div className="flex -space-x-2.5">
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-black/5">
                          {user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
                          +
                        </div>
                      </div>
                      <span className="font-black uppercase tracking-tighter opacity-40">
                        {new Date(folder.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Files Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Recents
            </h2>
            <div
              className="flex items-center gap-2 p-1 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-800/20 shadow-xs relative"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400 hover:text-v8-primary'}`}
              >
                <HiOutlineViewList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400 hover:text-v8-primary'}`}
              >
                <HiOutlineViewGrid className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType !== 'all' ? 'text-v8-primary bg-purple-50 dark:bg-purple-900/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <HiOutlineAdjustments className="w-4 h-4" />
                {filterType === 'all'
                  ? 'Filter'
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                  <div
                    className="absolute top-full right-0 mt-2 w-48 rounded-2xl border shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    {[
                      { id: 'all', label: 'All Files' },
                      { id: 'images', label: 'Images' },
                      { id: 'documents', label: 'Documents & PDFs' },
                      { id: 'spreadsheets', label: 'Spreadsheets' },
                      { id: 'videos', label: 'Videos' },
                      { id: 'archives', label: 'Archives' },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setFilterType(type.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${filterType === type.id ? 'text-v8-primary bg-purple-50 dark:bg-purple-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        style={{
                          color:
                            filterType === type.id
                              ? 'var(--brand-primary)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <UniversalFileView items={recentItems} viewMode={viewMode} user={user} />
          </div>
          {/* Creative Pagination */}
          <div className="flex items-center justify-between pt-6 px-2">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Showing <span className="text-v8-primary">1-{recentItems.length}</span> of{' '}
              {recentItems.length} items
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="h-9 w-9 rounded-xl border flex items-center justify-center text-zinc-400 hover:text-v8-primary hover:border-v8-primary transition-all disabled:opacity-30"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <HiChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {[1, 2, 3].map(page => (
                  <button
                    key={page}
                    className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${page === 1 ? 'bg-v8-primary text-white shadow-lg shadow-purple-500/20 scale-110' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    {page}
                  </button>
                ))}
                <span className="text-zinc-400 px-1">...</span>
              </div>
              <button
                className="h-9 w-9 rounded-xl border flex items-center justify-center text-zinc-400 hover:text-v8-primary hover:border-v8-primary transition-all"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
