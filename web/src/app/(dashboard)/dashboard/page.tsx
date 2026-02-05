'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize, formatRelativeDate } from '@/utils/format';
import { API_BASE_URL } from '@/lib/constants';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiChevronRight,
  HiPlus,
  HiOutlineShare,
  HiOutlineDeviceMobile,
  HiOutlineUserAdd,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineAdjustments,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const getFileIconStyle = (mimeType: string) => {
  if (mimeType?.includes('pdf')) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-500';
  if (mimeType?.includes('word') || mimeType?.includes('document'))
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel'))
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-500';
  if (mimeType?.includes('image') || mimeType?.includes('svg'))
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-500';
  return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600';
};

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

  const getThumbnailUrl = (path: string | null | undefined) => {
    if (!path) return null;
    const cleanPath = path.startsWith('api/') ? path.substring(4) : path;
    const baseUrl = API_BASE_URL.endsWith('/api')
      ? API_BASE_URL.substring(0, API_BASE_URL.length - 4)
      : API_BASE_URL;
    return `${baseUrl}/api/${cleanPath}`;
  };

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
                  className="p-5 rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border group relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <div
                    className={`absolute top-0 right-0 h-24 w-24 bg-linear-to-br ${folder.color} opacity-5 blur-3xl -mr-8 -mt-8`}
                  />

                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-linear-to-br ${folder.color} shadow-lg shadow-black/10`}
                    >
                      <HiOutlineFolder className="h-6 w-6 text-white" />
                    </div>
                    <button className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <HiOutlineDotsVertical className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>

                  <h3
                    className="text-base font-black mb-1 truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {folder.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v8-primary">
                      Folder
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      {folder.fileCount} Files
                    </span>
                  </div>

                  <div
                    className="flex items-center justify-between text-[11px] pt-4 border-t"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {folder.size}
                    </span>
                    <span className="font-black uppercase tracking-tighter opacity-40">
                      {new Date(folder.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
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
            {viewMode === 'list' ? (
              <>
                {/* Table Header */}
                <div
                  className="grid grid-cols-[1fr_200px_150px_150px_40px] px-6 py-2 text-[13px] font-medium"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
                    Document Name <HiChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                  <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
                    Last Edit <HiChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                  <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
                    File Size <HiChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                  <div className="hidden xl:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
                    Member <HiChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                  <div></div>
                </div>
              </>
            ) : null}

            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4'
                  : 'space-y-3'
              }
            >
              {recentItems.map(item => {
                const isFolder = 'fileCount' in item || !('mimeType' in item);
                const thumb = !isFolder ? getThumbnailUrl((item as any).thumbnailUrl) : null;
                const iconStyle = !isFolder
                  ? getFileIconStyle((item as any).mimeType)
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';

                if (viewMode === 'grid') {
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border flex flex-col items-center gap-3 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <div
                        className={`h-24 w-full rounded-xl flex items-center justify-center border border-black/5 dark:border-white/5 relative overflow-hidden ${thumb ? '' : iconStyle}`}
                      >
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : isFolder ? (
                          <HiOutlineFolder className="h-10 w-10 opacity-30" />
                        ) : (
                          <HiOutlineDocumentText className="h-10 w-10 opacity-30" />
                        )}
                        <div className="absolute top-2 right-2">
                          <button className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                            <HiOutlineDotsVertical className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 w-full px-1">
                        <span
                          className="font-bold text-xs truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.name}
                        </span>
                        <span
                          className="text-[10px] uppercase font-bold tracking-tighter"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {isFolder ? 'Folder' : formatFileSize((item as any).size)}
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px] items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.002] transition-all cursor-pointer group"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      {/* Document Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${thumb ? '' : iconStyle}`}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : isFolder ? (
                            <HiOutlineFolder className="h-5 w-5" />
                          ) : (
                            <HiOutlineDocumentText className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-bold text-[14px] truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.name}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-v8-primary lg:hidden">
                            {isFolder ? 'Folder' : 'File'}
                          </span>
                        </div>
                      </div>

                      {/* Last Edit */}
                      <div
                        className="hidden md:block text-[13px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {new Date(item.updatedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>

                      {/* File Size */}
                      <div
                        className="hidden lg:block text-[13px] font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {isFolder ? '--' : formatFileSize((item as any).size)}
                      </div>

                      {/* Member */}
                      <div className="hidden xl:flex items-center -space-x-2.5">
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm ring-1 ring-black/5">
                          {user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 text-[10px] font-black shadow-sm ring-1 ring-black/5">
                          +1
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                          <HiOutlineDotsVertical
                            className="h-4 w-4"
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
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
          </div>
        </section>
      </div>
    </div>
  );
}
