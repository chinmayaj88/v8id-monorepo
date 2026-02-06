'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize } from '@/utils/format';
import { API_BASE_URL } from '@/lib/constants';
import { HiOutlineDocumentText, HiOutlineDotsVertical, HiChevronRight } from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
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

export default function RecentPage() {
  const dispatch = useAppDispatch();
  const { files, isLoading, searchQuery } = useAppSelector(state => state.files);

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

  const sortedFiles = [...files]
    .filter(filterBySearch)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 50);

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span style={{ color: 'var(--text-secondary)' }}>Recent Activity</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h1>
        <p
          className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Files you've worked on recently
        </p>
      </div>

      {/* Files Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
      >
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--card-bg)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <th
                className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-60"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Document Name
              </th>
              <th
                className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 hidden md:table-cell"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Last Edit
              </th>
              <th
                className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 hidden lg:table-cell"
                style={{ color: 'var(--text-tertiary)' }}
              >
                File Size
              </th>
              <th
                className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 hidden xl:table-cell"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Member
              </th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
            {sortedFiles.map(file => {
              const thumb = getThumbnailUrl(file.thumbnailUrl);
              const iconStyle = getFileIconStyle(file.mimeType);
              return (
                <tr
                  key={file.id}
                  className="group border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-secondary)' }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${thumb ? '' : iconStyle}`}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <HiOutlineDocumentText className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className="font-medium text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 text-sm hidden md:table-cell"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {new Date(file.updatedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    className="px-5 py-4 text-sm font-medium hidden lg:table-cell"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell">
                    <div className="flex items-center -space-x-2">
                      {file.owner && (
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                          {file.owner.firstName?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100">
                      <HiOutlineDotsVertical
                        className="h-5 w-5"
                        style={{ color: 'var(--text-tertiary)' }}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
            {sortedFiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <HiOutlineDocumentText className="h-12 w-12 opacity-20" />
                    <p className="font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      No recent activity
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
