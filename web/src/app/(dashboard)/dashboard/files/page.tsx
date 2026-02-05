'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize, formatRelativeDate } from '@/utils/format';
import { API_BASE_URL } from '@/lib/constants';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineDownload,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

export default function FilesPage() {
  const dispatch = useAppDispatch();
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

  const filterBySearch = (item: { name: string }) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredFiles = files.filter(filterBySearch);
  const filteredFolders = folders.filter(filterBySearch);

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            All Files
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {searchQuery
              ? `Found ${filteredFiles.length} files and ${filteredFolders.length} folders`
              : 'Browse and manage your entire cloud storage collection'}
          </p>
        </div>
      </div>

      {/* Folders Section */}
      {filteredFolders.length > 0 && (
        <section>
          <h2
            className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Folders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFolders.map(folder => (
              <button
                key={folder.id}
                className="group flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-v8-primary/10 text-v8-primary">
                  <HiOutlineFolder className="h-6 w-6" />
                </div>
                <div className="text-left overflow-hidden">
                  <p
                    className="truncate text-sm font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {folder.name}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Modified {formatRelativeDate(folder.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Files Table Section */}
      <section>
        <h2
          className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Files
        </h2>
        <div
          className="rounded-3xl border overflow-hidden shadow-sm"
          style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-[10px] font-black uppercase tracking-widest"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}
              >
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Size</th>
                <th className="px-6 py-4 hidden lg:table-cell">Modified</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => {
                const thumb = getThumbnailUrl(file.thumbnailUrl);
                return (
                  <tr
                    key={file.id}
                    className="group border-b last:border-0 transition-colors hover:bg-zinc-500/5"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <HiOutlineDocumentText className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <span
                          className="truncate text-sm font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatFileSize(Number(file.size))}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatRelativeDate(file.updatedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-v8-primary/10 text-zinc-400 hover:text-v8-primary transition-colors">
                          <HiOutlineDownload className="h-5 w-5" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                          <HiOutlineDotsVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HiOutlineDocumentText className="h-10 w-10 text-zinc-300" />
                      <p className="text-sm font-medium text-zinc-400">No files found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
