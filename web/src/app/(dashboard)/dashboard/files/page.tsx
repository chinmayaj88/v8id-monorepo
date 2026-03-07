'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchSyncData,
  createFolder,
  bulkDeleteItems,
  moveItems,
  copyItems,
  setCurrentFolderId,
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
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import UniversalFileView from '@/components/dashboard/UniversalFileView';
import MoveCopyModal from '@/components/dashboard/MoveCopyModal';
import { useModal } from '@/components/ui/ModalProvider';
import UploadModal from '@/components/dashboard/UploadModal';
import CreateNoteModal from '@/components/dashboard/CreateNoteModal';
import { HiOutlineFolderAdd, HiOutlineDocumentAdd } from 'react-icons/hi';
import ShareModal from '@/components/dashboard/ShareModal';

export default function FilesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const folderIdFromUrl = searchParams.get('folderId');
  const { files, folders, isLoading, searchQuery } = useAppSelector(state => state.files);
  const { user } = useAppSelector(state => state.auth);
  const { showConfirmation, showNotification } = useModal();

  const [currentFolderId, setCurrentFolderIdLocal] = useState<string | null>(folderIdFromUrl);

  // Sync state with URL folderId
  useEffect(() => {
    setCurrentFolderIdLocal(folderIdFromUrl);
  }, [folderIdFromUrl]);

  // Sync with global store
  useEffect(() => {
    dispatch(setCurrentFolderId(currentFolderId));
  }, [currentFolderId, dispatch]);

  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('folders');

  // Auto-switch to files tab if previewId is present
  useEffect(() => {
    if (searchParams.get('previewId')) {
      setActiveTab('files');
    }
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy'>('move');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<any>(null);

  // Global Drag and Drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingOverPage(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set to false if we're leaving the window
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDraggingOverPage(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOverPage(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        setPendingFiles(Array.from(e.dataTransfer.files));
        setIsUploadModalOpen(true);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

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

    let message = `Are you sure you want to move ${ids.size} items to trash?`;
    if (ids.size === 1) {
      const id = Array.from(ids)[0];
      const item = [...files, ...folders].find(i => i.id === id);
      if (item) {
        message = `Are you sure you want to move "${item.name}" to trash?`;
      }
    }

    showConfirmation({
      title: 'Move to Trash',
      message,
      confirmText: 'Move to Trash',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const fileIds = files.filter(f => ids.has(f.id)).map(f => f.id);
        const folderIds = folders.filter(f => ids.has(f.id)).map(f => f.id);

        try {
          await dispatch(bulkDeleteItems({ fileIds, folderIds, permanent: false })).unwrap();
          setSelectedIds(new Set());
          showNotification({
            title: 'Success',
            message: ids.size === 1 ? 'Item moved to trash' : 'Items moved to trash',
            type: 'success',
          });
        } catch (err: any) {
          showNotification({
            title: 'Error',
            message: err.message || 'Failed to move items to trash',
            type: 'error',
          });
        }
      },
    });
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
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setPendingFiles([]);
        }}
        folderId={currentFolderId}
        initialFiles={pendingFiles}
      />

      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        folderId={currentFolderId}
      />

      {/* Global Drag Overlay */}
      {isDraggingOverPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-v8-primary/10 backdrop-blur-md border-4 border-dashed border-v8-primary m-4 rounded-[40px] pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[48px] shadow-2xl flex flex-col items-center gap-6 scale-110">
            <div className="w-24 h-24 rounded-[32px] bg-v8-primary text-white flex items-center justify-center shadow-2xl shadow-v8-primary/40 animate-bounce">
              <HiOutlineCloudUpload className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h2
                className="text-3xl font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Drop to Upload
              </h2>
              <p
                className="text-sm font-bold opacity-40 mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your files will be uploaded to {currentFolder ? currentFolder.name : 'All Files'}
              </p>
            </div>
          </div>
        </div>
      )}

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
          handleClose={() => setIsMoveCopyModalOpen(false)}
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
              onClick={() => setCurrentFolderIdLocal(crumb.id)}
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
                  router.push(parent ? `/dashboard/files?folderId=${parent}` : '/dashboard/files');
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
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              className="gap-2 rounded-full px-5 font-bold h-10 shadow-lg shadow-v8-primary/20"
              style={{ backgroundColor: '#8b5cf6', color: 'white' }}
              icon={
                <HiPlus
                  className={`w-4 h-4 transition-transform ${isCreateDropdownOpen ? 'rotate-45' : ''}`}
                />
              }
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
            >
              Create
            </Button>

            {isCreateDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCreateDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] shadow-2xl z-50 overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsCreateDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HiOutlineFolderAdd className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider">New Folder</p>
                      <p className="text-[9px] font-bold opacity-40">Create a directory</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUploadModalOpen(true);
                      setIsCreateDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HiOutlineCloudUpload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider">
                        Upload Files
                      </p>
                      <p className="text-[9px] font-bold opacity-40">Add files or folders</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNoteModalOpen(true);
                      setIsCreateDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HiOutlineDocumentAdd className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider">New Note</p>
                      <p className="text-[9px] font-bold opacity-40">Create a text file</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSharingItem(null);
        }}
        item={sharingItem || {}}
      />

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
          <div className="space-y-8">
            <UniversalFileView
              items={filteredFolders}
              viewMode={viewMode}
              user={user}
              onItemClick={item => {
                if ('parentId' in item || 'fileCount' in item) {
                  router.push(`/dashboard/files?folderId=${item.id}`);
                }
              }}
              enableSelection={true}
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
              onShare={item => {
                setSharingItem(item);
                setIsShareModalOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <UniversalFileView
              items={filteredFiles}
              viewMode={viewMode}
              user={user}
              onItemClick={item => {
                // Files handled by preview in UniversalFileView
              }}
              enableSelection={true}
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
              onShare={item => {
                setSharingItem(item);
                setIsShareModalOpen(true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
