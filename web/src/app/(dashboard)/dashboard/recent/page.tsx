'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchSyncData, bulkDeleteItems, copyItems, moveItems } from '@/store/slices/fileSlice';
import {
  HiOutlineClock,
  HiChevronRight,
  HiOutlineViewList,
  HiOutlineViewGrid,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Link from 'next/link';
import UniversalFileView from '@/components/dashboard/UniversalFileView';
import MoveCopyModal from '@/components/dashboard/MoveCopyModal';
import { useModal } from '@/components/ui/ModalProvider';

export default function RecentPage() {
  const dispatch = useAppDispatch();
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);
  const { user } = useAppSelector(state => state.auth);
  const { showConfirmation, showNotification } = useModal();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy'>('move');

  useEffect(() => {
    dispatch(fetchSyncData());
  }, [dispatch]);

  const handleDeleteSelected = async (targetIds?: Set<string>) => {
    const ids = targetIds || selectedIds;
    if (ids.size === 0) return;

    showConfirmation({
      title: 'Delete Items?',
      message: `Are you sure you want to delete ${ids.size} items? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const fileIds = files.filter(f => ids.has(f.id)).map(f => f.id);
        const folderIds = folders.filter(f => ids.has(f.id)).map(f => f.id);

        try {
          await dispatch(bulkDeleteItems({ fileIds, folderIds })).unwrap();
          setSelectedIds(new Set());
          showNotification({
            title: 'Success',
            message: 'Items deleted successfully',
            type: 'success',
          });
        } catch (err: any) {
          console.error(err);
          showNotification({
            title: 'Error',
            message: err.message || 'Failed to delete items',
            type: 'error',
          });
        }
      },
    });
  };

  const handleMoveCopyConfirm = async (targetId: string | null) => {
    const ids = selectedIds;
    const fileIds = files.filter(f => ids.has(f.id)).map(f => f.id);
    const folderIds = folders.filter(f => ids.has(f.id)).map(f => f.id);

    try {
      if (moveCopyMode === 'move') {
        await dispatch(moveItems({ fileIds, folderIds, targetFolderId: targetId })).unwrap();
      } else {
        await dispatch(copyItems({ fileIds, folderIds, targetFolderId: targetId })).unwrap();
      }
      setSelectedIds(new Set());
      setSelectedIds(new Set());
      setIsMoveCopyModalOpen(false);
      showNotification({
        title: 'Success',
        message: `Items ${moveCopyMode === 'move' ? 'moved' : 'copied'} successfully`,
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

  const filterBySearch = (item: { name: string }) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const recentFiles = [...files]
    .filter(filterBySearch)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 50);

  if (isLoading && files.length === 0) {
    return <DashboardSkeleton />;
  }

  const isEmpty = recentFiles.length === 0;

  return (
    <div className="space-y-6 pb-8">
      <MoveCopyModal
        isOpen={isMoveCopyModalOpen}
        onClose={() => setIsMoveCopyModalOpen(false)}
        onConfirm={handleMoveCopyConfirm}
        folders={folders}
        title={moveCopyMode === 'move' ? 'Move Items' : 'Copy Items'}
      />

      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span className="text-v8-primary">Recent Activity</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Recent Activity
          </h1>
          <p
            className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Your most recently interacted items
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
        </div>
      </div>

      <div className="mt-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500/20 to-v8-primary/20 flex items-center justify-center mb-6 shadow-2xl shadow-v8-primary/10">
              <HiOutlineClock className="w-10 h-10 text-v8-primary animate-pulse" />
            </div>
            <h3
              className="text-xl font-black mb-2 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              No recent activity
            </h3>
            <p
              className="text-[13px] font-bold opacity-40 max-w-[280px] text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              You haven't opened or modified any files recently.
            </p>
          </div>
        ) : (
          <UniversalFileView
            items={recentFiles}
            viewMode={viewMode}
            user={user}
            enableSelection={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={item => handleDeleteSelected(new Set([item.id]))}
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
