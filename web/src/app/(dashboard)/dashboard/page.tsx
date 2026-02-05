'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize, formatRelativeDate } from '@/utils/format';
import { API_BASE_URL } from '@/lib/constants';
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineDownload,
  HiOutlineShare,
} from 'react-icons/hi';

import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);

  useEffect(() => {
    dispatch(fetchSyncData());
  }, [dispatch]);

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  // Generic Search Filter
  const filterBySearch = (item: { name: string }) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredFiles = files.filter(filterBySearch);
  const filteredFolders = folders.filter(filterBySearch);

  // For "Suggested for you", we'll take the most recent 6 files
  const suggestedFiles = [...filteredFiles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // For "Folders", we'll take top-level folders or search results
  const foldersToShow = searchQuery
    ? filteredFolders.slice(0, 6)
    : filteredFolders.filter(f => !f.parentId).slice(0, 6);

  // For "Recent Files", we'll take all files sorted by updatedAt
  const sortedFiles = [...filteredFiles].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const getThumbnailUrl = (path: string | null | undefined) => {
    if (!path) return null;
    // The path comes as "api/files/..." or similar from backend
    // We need to ensure it's a valid URL. If it starts with "api/", we replace it or prepend
    const cleanPath = path.startsWith('api/') ? path.substring(4) : path;
    const baseUrl = API_BASE_URL.endsWith('/api')
      ? API_BASE_URL.substring(0, API_BASE_URL.length - 4)
      : API_BASE_URL;
    return `${baseUrl}/api/${cleanPath}`;
  };

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Home
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Welcome back, {user?.firstName || 'User'}! You've used{' '}
            {user?.storageUsedFormatted || '0 B'} of your {user?.storageQuotaFormatted || '0 B'} (
            {user?.storagePercentage || 0}%).
          </p>
        </div>
      </div>

      {suggestedFiles.length > 0 && (
        <section>
          <h2
            className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Suggested for you
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {suggestedFiles.map(file => {
              const thumb = getThumbnailUrl(file.thumbnailUrl);
              return (
                <button
                  key={file.id}
                  className="group flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]"
                  style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {thumb ? (
                      <img src={thumb} alt={file.name} className="h-full w-full object-cover" />
                    ) : (
                      <HiOutlineDocumentText className="h-7 w-7" />
                    )}
                  </div>
                  <div className="w-full text-center">
                    <p
                      className="text-xs font-bold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {file.name}
                    </p>
                    <p
                      className="text-[10px] mt-1 font-semibold"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {foldersToShow.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[10px] font-black uppercase tracking-[0.25em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Folders
            </h2>
            <button className="text-[10px] font-black uppercase text-v8-primary hover:underline">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {foldersToShow.map(folder => (
              <button
                key={folder.id}
                className="group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--brand-primary)' }}
                >
                  <HiOutlineFolder className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {folder.name}
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Updated {formatRelativeDate(folder.updatedAt)}
                  </p>
                </div>
                <HiOutlineDotsVertical
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {sortedFiles.length > 0 ? (
        <section>
          <h2
            className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Recent Files
          </h2>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
          >
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b text-[10px] font-black uppercase tracking-widest"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}
                >
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 hidden md:table-cell">Modified</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Size</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map(file => {
                  const thumb = getThumbnailUrl(file.thumbnailUrl);
                  return (
                    <tr
                      key={file.id}
                      className="group transition-colors duration-200 cursor-pointer border-b last:border-0 hover:bg-(--card-hover)"
                      style={{ borderColor: 'var(--border-secondary)' }}
                    >
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors overflow-hidden"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <HiOutlineDocumentText className="h-4 w-4" />
                            )}
                          </div>
                          <span
                            className="text-sm font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-5 py-2 text-xs font-medium hidden md:table-cell"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatRelativeDate(file.updatedAt)}
                      </td>
                      <td
                        className="px-5 py-2 text-xs font-medium hidden lg:table-cell"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 rounded-xl transition-colors hover:bg-zinc-500/10"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <HiOutlineShare className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 rounded-xl transition-colors hover:bg-zinc-500/10"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <HiOutlineDownload className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <HiOutlineFolderOpen className="w-8 h-8 text-(--text-tertiary)" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              No files yet
            </h3>
            <p className="text-sm max-w-xs mx-auto mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Upload your first file to get started with V8id Cloud.
            </p>
          </div>
        )
      )}
    </div>
  );
}
