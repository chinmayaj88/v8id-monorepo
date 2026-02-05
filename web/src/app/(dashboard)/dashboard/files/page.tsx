'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize } from '@/utils/format';
import { API_BASE_URL } from '@/lib/constants';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiChevronRight,
  HiPlus,
  HiOutlineShare,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiOutlineAdjustments,
  HiOutlineArrowLeft,
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

export default function FilesPage() {
  const dispatch = useAppDispatch();
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('folders');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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

  const currentFolder = folders.find(f => f.id === currentFolderId);

  const filterBySearch = (item: {
    name: string;
    folderId?: string | null;
    parentId?: string | null;
  }) => {
    // Search override: if searching, show all matches regardless of folder
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Default root/folder view: show only direct children
    if ('folderId' in item) {
      // FileItem
      return item.folderId === currentFolderId;
    } else {
      // FolderItem
      return (item as any).parentId === currentFolderId;
    }
  };

  const filteredFiles = files.filter(filterBySearch);
  const filteredFolders = folders.filter(filterBySearch);

  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'All Files' }];
    if (!currentFolderId) return crumbs;

    // Simplified path: for now just root -> current
    // In a real app we'd recurse up parentId
    if (currentFolder) {
      crumbs.push({ id: currentFolder.id, name: currentFolder.name });
    }
    return crumbs;
  };

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <HiChevronRight className="w-3 h-3 mx-1" />}
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className={`hover:text-v8-primary transition-colors ${idx === getBreadcrumbs().length - 1 ? 'text-v8-primary' : ''}`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1
            className="text-5xl font-black tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentFolder ? currentFolder.name : 'All Files'}
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <div
              className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <button
                onClick={() => setActiveTab('folders')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'folders' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Folders ({filteredFolders.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'files' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Files ({filteredFiles.length})
              </button>
            </div>
            {currentFolderId && (
              <button
                onClick={() => setCurrentFolderId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>
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

      <div className="mt-8">
        {activeTab === 'folders' ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'space-y-3'
            }
          >
            {filteredFolders.map(folder => {
              const fileCount = files.filter(f => f.folderId === folder.id).length;
              if (viewMode === 'grid') {
                return (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="p-5 rounded-3xl border shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-linear-to-br from-purple-500 to-indigo-600 shadow-inner">
                        <HiOutlineFolder className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-6 w-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-black">
                          +
                        </div>
                      </div>
                    </div>
                    <h3
                      className="text-base font-black truncate mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {folder.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {fileCount} Files
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {new Date(folder.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="flex items-center justify-between p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
                      <HiOutlineFolder className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {folder.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {fileCount} Files
                    </span>
                    <HiOutlineDotsVertical className="h-5 w-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              );
            })}
            {filteredFolders.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-40">
                <HiOutlineFolder className="w-12 h-12 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">No folders here</p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                : 'space-y-3'
            }
          >
            {filteredFiles.map(file => {
              const thumb = getThumbnailUrl(file.thumbnailUrl);
              const iconStyle = getFileIconStyle(file.mimeType);
              if (viewMode === 'grid') {
                return (
                  <div
                    key={file.id}
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
                      ) : (
                        <HiOutlineDocumentText className="h-10 w-10 opacity-30" />
                      )}
                    </div>
                    <span
                      className="font-bold text-xs truncate w-full px-1"
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
                  className="grid grid-cols-[1fr_150px_100px_40px] items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer group"
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
                        <img src={thumb} alt="" className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <HiOutlineDocumentText className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className="font-bold text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">
                    {new Date(file.updatedAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-xs font-black text-zinc-400">
                    {formatFileSize(file.size)}
                  </span>
                  <div className="flex justify-end">
                    <HiOutlineDotsVertical className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              );
            })}
            {filteredFiles.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-40">
                <HiOutlineDocumentText className="w-12 h-12 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">No files here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
