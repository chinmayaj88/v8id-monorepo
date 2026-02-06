'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchSyncData,
  createFolder,
  bulkDeleteItems,
  moveItems,
  copyItems,
} from '@/store/slices/fileSlice';
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
import MoveCopyModal from '@/components/dashboard/MoveCopyModal';

export default function FilesPage() {
  const dispatch = useAppDispatch();
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);
  const { user } = useAppSelector(state => state.auth);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('folders');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy'>('move');

  // Clear selection when changing folders or tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentFolderId, activeTab]);

  useEffect(() => {
    dispatch(fetchSyncData());
  }, [dispatch]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await dispatch(createFolder({ name: newFolderName, parentId: currentFolderId })).unwrap();
      setNewFolderName('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async (targetIds?: Set<string>) => {
    const ids = targetIds || selectedIds;
    if (ids.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.size} items?`)) return;

    const fileIds = files.filter(f => ids.has(f.id)).map(f => f.id);
    const folderIds = folders.filter(f => ids.has(f.id)).map(f => f.id);

    try {
      await dispatch(bulkDeleteItems({ fileIds, folderIds })).unwrap();
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveCopyConfirm = async (targetId: string | null) => {
    const fileIds = files.filter(f => selectedIds.has(f.id)).map(f => f.id);
    const folderIds = folders.filter(f => selectedIds.has(f.id)).map(f => f.id);

    try {
      if (moveCopyMode === 'move') {
        await dispatch(moveItems({ fileIds, folderIds, targetFolderId: targetId })).unwrap();
      } else {
        await dispatch(copyItems({ fileIds, folderIds, targetFolderId: targetId })).unwrap();
      }
      setSelectedIds(new Set());
      setIsMoveCopyModalOpen(false);
    } catch (err: any) {
      alert(err || 'Failed to complete operation');
    }
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);

  const filterBySearch = (item: {
    name: string;
    folderId?: string | null;
    parentId?: string | null;
  }) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if ('folderId' in item) {
      return item.folderId === currentFolderId;
    } else {
      return (item as any).parentId === currentFolderId;
    }
  };

  const filteredFiles = files.filter(filterBySearch);
  const filteredFolders = folders.filter(filterBySearch);

  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'All Files' }];
    if (!currentFolderId) return crumbs;

    // Recursive breadcrumbs
    const buildPath = (folderId: string): { id: string; name: string }[] => {
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return [];
      const parentCrumbs = folder.parentId ? buildPath(folder.parentId) : [];
      return [...parentCrumbs, { id: folder.id, name: folder.name }];
    };

    return [{ id: null, name: 'All Files' }, ...buildPath(currentFolderId)];
  };

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  const isEmpty = filteredFiles.length === 0 && filteredFolders.length === 0;

  return (
    <div className="space-y-6 pb-8 relative min-h-[600px]">
      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border shadow-2xl w-full max-w-sm"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <h2 className="text-xl font-black mb-6 tracking-tight">Create New Folder</h2>
            <form onSubmit={handleCreateFolder}>
              <input
                autoFocus
                type="text"
                placeholder="Folder Name"
                className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-v8-primary transition-all mb-6 font-bold"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl h-12 font-black"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 rounded-2xl h-12 font-black"
                  style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMoveCopyModalOpen && (
        <MoveCopyModal
          isOpen={isMoveCopyModalOpen}
          onClose={() => setIsMoveCopyModalOpen(false)}
          onConfirm={handleMoveCopyConfirm}
          folders={folders}
          title={moveCopyMode === 'move' ? 'Move to Folder' : 'Copy to Folder'}
        />
      )}

      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
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
                onClick={() => {
                  const parent = folders.find(f => f.id === currentFolderId)?.parentId;
                  setCurrentFolderId(parent || null);
                }}
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
              <div className="flex items-center gap-1 pr-2 border-r border-zinc-200 dark:border-zinc-700 mr-2 animate-in fade-in slide-in-from-right-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mx-2">
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
                  onClick={() => {
                    setMoveCopyMode('move');
                    setIsMoveCopyModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-v8-primary transition-colors"
                  title="Move"
                >
                  <HiOutlineFolderOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setMoveCopyMode('copy');
                    setIsMoveCopyModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-v8-primary transition-colors"
                  title="Copy"
                >
                  <HiOutlineDuplicate className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteSelected()}
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
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-v8-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-v8-primary/10">
              <HiOutlineFolder className="w-10 h-10 text-v8-primary animate-pulse" />
            </div>
            <h3
              className="text-xl font-black mb-2 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              This folder is empty
            </h3>
            <p
              className="text-[13px] font-bold opacity-40 max-w-[280px] text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              Get started by creating a new folder or uploading your files here.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-8 gap-2 rounded-2xl px-6 font-black h-12 border-2"
              icon={<HiPlus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Folder
            </Button>
          </div>
        ) : activeTab === 'folders' ? (
          <UniversalFileView
            items={filteredFolders}
            viewMode={viewMode}
            user={user}
            onItemClick={folder => setCurrentFolderId(folder.id)}
            enableSelection={true} // Enable selection for folders
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={item => {
              handleDeleteSelected(new Set([item.id]));
            }}
            onMove={item => {
              setSelectedIds(new Set([item.id]));
              setMoveCopyMode('move');
              setIsMoveCopyModalOpen(true);
            }}
            onCopy={item => {
              setSelectedIds(new Set([item.id]));
              setMoveCopyMode('copy');
              setIsMoveCopyModalOpen(true);
            }}
          />
        ) : (
          <UniversalFileView
            items={filteredFiles}
            viewMode={viewMode}
            user={user}
            enableSelection={true} // Enable selection for files
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={item => {
              handleDeleteSelected(new Set([item.id]));
            }}
            onMove={item => {
              setSelectedIds(new Set([item.id]));
              setMoveCopyMode('move');
              setIsMoveCopyModalOpen(true);
            }}
            onCopy={item => {
              setSelectedIds(new Set([item.id]));
              setMoveCopyMode('copy');
              setIsMoveCopyModalOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
