'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';
import { formatFileSize } from '@/utils/format';
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
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineFolderOpen,
  HiX,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import UniversalFileView from '@/components/dashboard/UniversalFileView';

export default function FilesPage() {
  const dispatch = useAppDispatch();
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);
  const { user } = useAppSelector(state => state.auth); // Assuming user is available in auth slice

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('folders');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when changing folders or tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentFolderId, activeTab]);

  useEffect(() => {
    dispatch(fetchSyncData());
  }, [dispatch]);

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
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <HiChevronRight className="w-2.5 h-2.5 mx-1" />}
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
            className="text-2xl font-black tracking-tight"
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
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'folders' ? 'bg-white dark:bg-zinc-700 shadow-xs text-v8-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-60'}`}
              >
                Folders ({filteredFolders.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'files' ? 'bg-white dark:bg-zinc-700 shadow-xs text-v8-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-60'}`}
              >
                Files ({filteredFiles.length})
              </button>
            </div>
            {currentFolderId && (
              <button
                onClick={() => setCurrentFolderId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-60 hover:opacity-100"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 p-1 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-800/20 shadow-xs"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {/* Bulk Actions Toolbar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1 pr-2 border-r border-zinc-200 dark:border-zinc-700 mr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mr-2">
                  {selectedIds.size} selected
                </span>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-600 transition-colors"
                  title="Clear Selection"
                >
                  <HiX className="w-3.5 h-3.5" />
                </button>

                <button
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-v8-primary transition-colors"
                  title="Move"
                >
                  <HiOutlineFolderOpen className="w-4 h-4" />
                </button>

                <button
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-v8-primary transition-colors"
                  title="Copy"
                >
                  <HiOutlineDuplicate className="w-4 h-4" />
                </button>

                <button
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Delete"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            )}

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
            size="sm"
            className="gap-2 rounded-full px-5 font-bold h-10"
            style={{ backgroundColor: '#8b5cf6', color: 'white' }}
            icon={<HiPlus className="w-4 h-4" />}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'folders' ? (
          <UniversalFileView
            items={filteredFolders}
            viewMode={viewMode}
            user={user}
            onItemClick={folder => setCurrentFolderId(folder.id)}
            enableSelection={true} // Enable selection for folders
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        ) : (
          <UniversalFileView
            items={filteredFiles}
            viewMode={viewMode}
            user={user}
            enableSelection={true} // Enable selection for files
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>
    </div>
  );
}
