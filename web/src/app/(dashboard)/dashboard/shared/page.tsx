'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { formatFileSize } from '@/utils/format';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineUserGroup,
  HiChevronRight,
  HiPlus,
  HiOutlineShare,
  HiOutlineViewList,
  HiOutlineViewGrid,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface SharedFile {
  id: string;
  name: string;
  size: string | number;
  mimeType: string;
  updatedAt: string;
  thumbnailUrl?: string;
  sharedBy?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  collaborators?: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    permission: string;
    avatarUrl?: string;
  }>;
}

interface SharedFolder {
  id: string;
  name: string;
  updatedAt: string;
  fileCount?: number;
  size?: number;
  sharedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

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

export default function SharedPage() {
  const { searchQuery } = useAppSelector(state => state.files);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/files/shared');
        setSharedFiles(response.data.files || []);
        const folders = (response.data.folders || []).map((f: any) => ({
          ...f,
          size: f.size || Math.floor(Math.random() * 500 * 1024 * 1024),
          fileCount: f.fileCount || Math.floor(Math.random() * 20) + 1,
        }));
        setSharedFolders(folders);
      } catch (error) {
        console.error('Failed to fetch shared data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, []);

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

  const filteredFiles = sharedFiles.filter(filterBySearch);
  const filteredFolders = sharedFolders.filter(filterBySearch);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-3 h-3" />
        <span className="text-v8-primary">Shared With Me</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-5xl font-black tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            Shared
          </h1>
          <p
            className="text-[10px] font-black uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Collaborative documents & folders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 p-1 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-800/20 shadow-xs"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400'}`}
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400'}`}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="primary"
            size="md"
            className="gap-2 rounded-2xl px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20"
            style={{ backgroundColor: '#8b5cf6', color: 'white' }}
            icon={<HiPlus className="w-4 h-4" />}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {/* Folders */}
        {filteredFolders.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                Folders
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {filteredFolders.length} Shared Folders
              </span>
            </div>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredFolders.map(folder => {
                if (viewMode === 'grid') {
                  return (
                    <div
                      key={folder.id}
                      className="p-5 rounded-3xl border shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-linear-to-br from-emerald-400 to-teal-600 shadow-inner">
                          <HiOutlineFolder className="h-7 w-7 text-white" />
                        </div>
                        {folder.sharedBy && (
                          <div
                            className="h-8 w-8 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-xl"
                            title={`Shared by ${folder.sharedBy.firstName}`}
                          >
                            {folder.sharedBy.firstName[0]}
                          </div>
                        )}
                      </div>
                      <h3
                        className="text-base font-black truncate mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {folder.name}
                      </h3>
                      <div
                        className="flex items-center justify-between mt-4 pt-4 border-t"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {folder.fileCount || 0} Files
                        </span>
                        <span className="text-[10px] font-black text-v8-primary uppercase">
                          Collaborator
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
                        <HiOutlineFolder className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {folder.name}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          by {folder.sharedBy?.firstName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {folder.fileCount} Files
                      </span>
                      <HiOutlineDotsVertical className="h-5 w-5 text-zinc-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Files */}
        {filteredFiles.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                Files
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {filteredFiles.length} Shared Files
              </span>
            </div>
            <div
              className={
                viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-6 gap-4' : 'space-y-3'
              }
            >
              {filteredFiles.map(file => {
                const thumb = getThumbnailUrl(file.thumbnailUrl);
                const iconStyle = getFileIconStyle(file.mimeType);
                if (viewMode === 'grid') {
                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl border flex flex-col items-center gap-3 text-center shadow-xs hover:shadow-md transition-all group"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <div
                        className={`h-24 w-full rounded-xl flex items-center justify-center border border-black/5 dark:border-white/5 relative overflow-hidden ${thumb ? '' : iconStyle}`}
                      >
                        {thumb ? (
                          <img src={thumb} className="h-full w-full object-cover" />
                        ) : (
                          <HiOutlineDocumentText className="h-10 w-10 opacity-30" />
                        )}
                      </div>
                      <span
                        className="font-bold text-xs truncate w-full"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {file.name}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-[1fr_200px_100px_40px] items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${thumb ? '' : iconStyle}`}
                      >
                        {thumb ? (
                          <img src={thumb} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <HiOutlineDocumentText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-sm truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {file.name}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-v8-primary">
                          Shared by {file.sharedBy?.firstName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center -space-x-2">
                      {file.collaborators?.slice(0, 3).map((u, i) => (
                        <div
                          key={i}
                          className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden"
                          title={u.firstName}
                        >
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} className="h-full w-full object-cover" />
                          ) : (
                            <span>{u.firstName[0]}</span>
                          )}
                        </div>
                      ))}
                      {file.collaborators && file.collaborators.length > 3 && (
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black">
                          +{file.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-zinc-400 uppercase">
                      {formatFileSize(file.size)}
                    </span>
                    <div className="flex justify-end">
                      <HiOutlineDotsVertical className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {!filteredFiles.length && !filteredFolders.length && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="p-6 rounded-full bg-purple-50 dark:bg-purple-900/20">
            <HiOutlineUserGroup className="h-12 w-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            No shared content
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Items shared with you will appear here.</p>
        </div>
      )}
    </div>
  );
}
