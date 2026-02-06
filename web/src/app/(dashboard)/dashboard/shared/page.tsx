'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchSharedData,
  fetchSharedFolderContents,
  bulkDeleteItems,
  copyItems,
} from '@/store/slices/fileSlice';
import {
  HiOutlineUserGroup,
  HiChevronRight,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiOutlineFolderOpen,
  HiOutlineDuplicate,
  HiOutlineTrash,
  HiX,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Link from 'next/link';
import UniversalFileView from '@/components/dashboard/UniversalFileView';
import MoveCopyModal from '@/components/dashboard/MoveCopyModal';
import { useModal } from '@/components/ui/ModalProvider';

export default function SharedPage() {
  const dispatch = useAppDispatch();
  const {
    sharedFiles = [],
    sharedFolders = [],
    sharedBreadcrumbs = [],
    isLoading,
    searchQuery,
  } = useAppSelector(state => state.files);
  const { user } = useAppSelector(state => state.auth);
  const { showConfirmation, showNotification } = useModal();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [activeTab, setActiveTab] = useState<'folders' | 'files'>('folders');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy'>('move');

  useEffect(() => {
    if (currentFolderId) {
      dispatch(fetchSharedFolderContents(currentFolderId));
    } else {
      dispatch(fetchSharedData());
    }
    // Clear selection on folder change
    setSelectedIds(new Set());
  }, [dispatch, currentFolderId]);

  const handleDeleteSelected = async (targetIds?: Set<string>) => {
    const ids = targetIds || selectedIds;
    if (ids.size === 0) return;

    showConfirmation({
      title: 'Remove Shared Items?',
      message: `Are you sure you want to remove ${ids.size} shared items?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const fileIds = sharedFiles.filter(f => ids.has(f.id)).map(f => f.id);
        const folderIds = sharedFolders.filter(f => ids.has(f.id)).map(f => f.id);

        try {
          // NOTE: For shared items, delete usually means "remove shortcut" or "unshare" from self
          await dispatch(bulkDeleteItems({ fileIds, folderIds })).unwrap();
          setSelectedIds(new Set());
          // Refresh current view
          if (currentFolderId) {
            dispatch(fetchSharedFolderContents(currentFolderId));
          } else {
            dispatch(fetchSharedData());
          }
          showNotification({
            title: 'Success',
            message: 'Shared items removed successfully',
            type: 'success',
          });
        } catch (err: any) {
          console.error(err);
          showNotification({
            title: 'Error',
            message: err.message || 'Failed to remove shared items',
            type: 'error',
          });
        }
      },
    });
  };

  const filterBySearch = (item: { name: string }) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleMoveCopyConfirm = async (targetId: string | null) => {
    const fileIds = sharedFiles.filter(f => selectedIds.has(f.id)).map(f => f.id);
    const folderIds = sharedFolders.filter(f => selectedIds.has(f.id)).map(f => f.id);

    try {
      // NOTE: Moving a shared item to your own files is usually a COPY
      await dispatch(copyItems({ fileIds, folderIds, targetFolderId: targetId })).unwrap();
      setSelectedIds(new Set());
      setIsMoveCopyModalOpen(false);
      showNotification({
        title: 'Success',
        message: 'Items copied to your files successfully',
        type: 'success',
      });
    } catch (err: any) {
      showNotification({
        title: 'Error',
        message: err.message || 'Failed to complete operation',
        type: 'error',
      });
    }
  };

  const filteredFiles = sharedFiles.filter(filterBySearch);
  const filteredFolders = sharedFolders.filter(filterBySearch);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setActiveTab('folders'); // Reset tab to folders usually, or keep current? Folders usually contain more folders.
  };

  if (isLoading && sharedFiles.length === 0 && sharedFolders.length === 0) {
    return <DashboardSkeleton />;
  }

  const isEmpty = filteredFiles.length === 0 && filteredFolders.length === 0;

  return (
    <div className="space-y-6 pb-8">
      {isMoveCopyModalOpen && (
        <MoveCopyModal
          isOpen={isMoveCopyModalOpen}
          onClose={() => setIsMoveCopyModalOpen(false)}
          onConfirm={handleMoveCopyConfirm}
          folders={useAppSelector(state => state.files.folders)} // User's own folders for destination
          title="Copy to My Files"
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
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`hover:text-v8-primary transition-colors ${!currentFolderId ? 'text-v8-primary' : ''}`}
        >
          Shared With Me
        </button>

        {sharedBreadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <HiChevronRight className="w-2.5 h-2.5" />
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className={`hover:text-v8-primary transition-colors ${
                currentFolderId === crumb.id ? 'text-v8-primary' : ''
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentFolderId && sharedBreadcrumbs.length > 0
              ? sharedBreadcrumbs[sharedBreadcrumbs.length - 1].name
              : 'Shared With Me'}
          </h1>
          <p
            className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Collaborative documents & folders
          </p>

          <div className="flex items-center gap-4 mt-4">
            <div
              className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <button
                onClick={() => setActiveTab('folders')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'folders'
                    ? 'bg-white dark:bg-zinc-700 shadow-xs text-v8-primary'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-60'
                }`}
              >
                Folders ({filteredFolders.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'files'
                    ? 'bg-white dark:bg-zinc-700 shadow-xs text-v8-primary'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-60'
                }`}
              >
                Files ({filteredFiles.length})
              </button>
            </div>
            {currentFolderId && (
              <button
                onClick={() => {
                  // Go to parent
                  const parentId =
                    sharedBreadcrumbs.length > 1
                      ? sharedBreadcrumbs[sharedBreadcrumbs.length - 2].id
                      : null;
                  setCurrentFolderId(parentId);
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
                    setMoveCopyMode('copy');
                    setIsMoveCopyModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-v8-primary transition-colors"
                  title="Copy to My Files"
                >
                  <HiOutlineDuplicate className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteSelected()}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Remove from Shared"
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
        </div>
      </div>

      <div className="mt-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-500/20 to-v8-primary/20 flex items-center justify-center mb-6 shadow-2xl shadow-v8-primary/10">
              <HiOutlineUserGroup className="w-10 h-10 text-v8-primary animate-pulse" />
            </div>
            <h3
              className="text-xl font-black mb-2 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {searchQuery ? 'No matching items' : 'No shared content'}
            </h3>
            <p
              className="text-[13px] font-bold opacity-40 max-w-[280px] text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              {searchQuery
                ? `We couldn't find any shared items matching "${searchQuery}"`
                : 'Items shared with you by other users will appear here for collaboration.'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {activeTab === 'folders' && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <UniversalFileView
                  items={filteredFolders}
                  viewMode={viewMode}
                  user={user}
                  enableSelection={true}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onDelete={item => handleDeleteSelected(new Set([item.id]))}
                  onItemClick={item => handleFolderClick(item.id)}
                />
                {filteredFolders.length === 0 && (
                  <div className="py-20 text-center opacity-40 font-bold italic text-sm">
                    No shared folders found
                  </div>
                )}
              </section>
            )}

            {activeTab === 'files' && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <UniversalFileView
                  items={filteredFiles}
                  viewMode={viewMode}
                  user={user}
                  enableSelection={true}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onDelete={item => handleDeleteSelected(new Set([item.id]))}
                />
                {filteredFiles.length === 0 && (
                  <div className="py-20 text-center opacity-40 font-bold italic text-sm">
                    No shared files found
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
