'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HiOutlineFolder,
  HiOutlineDocument,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineShare,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineLink,
  HiCheck,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
  HiChevronRight,
  HiOutlineFolderOpen,
  HiOutlineRefresh,
  HiOutlineArchive,
} from 'react-icons/hi';
import { formatFileSize } from '@/utils/format';
import FilePreviewModal from './FilePreviewModal';

import { API_BASE_URL } from '@/lib/constants';
import Card from '@/components/ui/Card';
import { useAppSelector } from '@/store/hooks';

const getFileIconStyle = (mimeType: string) => {
  const mt = (mimeType || '').toLowerCase();
  if (mt.includes('pdf')) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-500';
  if (mt.includes('word') || mt.includes('document'))
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
  if (mt.includes('sheet') || mt.includes('excel'))
    return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
  if (mt.includes('image') || mt.includes('svg'))
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-500';
  if (
    mt.includes('zip') ||
    mt.includes('archive') ||
    mt.includes('compressed') ||
    mt.includes('tar')
  )
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-500';
  return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600';
};

const getThumbnailUrl = (item: any) => {
  if (!item || (!item.thumbnailUrl && !item.thumbnailKey)) return null;

  // Use thumbnailUrl if available (path from backend), fallback to constructing from id if it's an image
  let path = item.thumbnailUrl || (item.thumbnailKey ? `api/files/${item.id}/thumbnail` : null);
  if (!path) return null;

  // Cleanup path: remove leading /api/ or api/ to avoid double prefixing
  let cleanPath = path;
  if (cleanPath.startsWith('/api/')) cleanPath = cleanPath.substring(5);
  else if (cleanPath.startsWith('api/')) cleanPath = cleanPath.substring(4);
  else if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

  // Use API_BASE_URL to construct the full URL
  const baseUrl = API_BASE_URL.endsWith('/api')
    ? API_BASE_URL.substring(0, API_BASE_URL.length - 4)
    : API_BASE_URL;

  return `${baseUrl}/api/${cleanPath}`;
};

const isImageFile = (item: any) => {
  const mime = (item.mimeType || '').toLowerCase();
  const ext = (item.extension || '').toLowerCase();
  return (
    mime.includes('image') ||
    mime.includes('svg') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
  );
};

interface FileIconProps {
  item: any;
  isFolder: boolean;
  thumbUrl: string | null;
  iconStyle: string;
  viewMode: 'list' | 'grid';
}

const isArchiveFile = (item: any) => {
  const mime = (item.mimeType || '').toLowerCase();
  const ext = (item.extension || '').toLowerCase();
  return (
    mime.includes('zip') ||
    mime.includes('archive') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  );
};

const FileIcon = ({ item, isFolder, thumbUrl, iconStyle, viewMode }: FileIconProps) => {
  const [imgError, setImgError] = useState(false);
  const showImage = thumbUrl && !imgError && !isFolder;

  const gridContainerClass = `h-24 w-full rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 relative overflow-hidden group-hover:scale-105 transition-all duration-500 shadow-xl shadow-black/5 ${showImage ? '' : iconStyle}`;
  const listContainerClass = `h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${showImage ? '' : iconStyle}`;

  const containerClass = viewMode === 'grid' ? gridContainerClass : listContainerClass;
  const imgClass =
    viewMode === 'grid' ? 'h-full w-full object-cover' : 'h-full w-full object-cover rounded-xl';
  const iconSize = viewMode === 'grid' ? 'h-10 w-10' : 'h-5 w-5';

  return (
    <div className={containerClass}>
      {showImage ? (
        <img
          src={thumbUrl!}
          alt={item.name}
          className={imgClass}
          crossOrigin="use-credentials"
          onError={() => {
            console.warn(`Failed to load thumbnail for ${item.name}: ${thumbUrl}`);
            setImgError(true);
          }}
          loading="lazy"
        />
      ) : isFolder ? (
        <HiOutlineFolder
          className={`${iconSize} ${viewMode === 'grid' ? 'text-emerald-600' : ''}`}
        />
      ) : isImageFile(item) ? (
        <HiOutlinePhotograph className={`${iconSize} text-orange-500`} />
      ) : isArchiveFile(item) ? (
        <HiOutlineArchive className={`${iconSize} text-amber-500`} />
      ) : (
        <HiOutlineDocumentText
          className={`${iconSize} ${viewMode === 'grid' ? 'opacity-40' : ''}`}
        />
      )}
    </div>
  );
};

interface UniversalFileViewProps {
  items: any[];
  viewMode: 'list' | 'grid';
  user?: any;
  onItemClick?: (item: any) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onMove?: (item: any) => void;
  onCopy?: (item: any) => void;
  onDelete?: (item: any) => void;
  onDownload?: (item: any) => void;
  onShare?: (item: any) => void;
  onRestore?: (item: any) => void;
  isTrash?: boolean;
}

const Checkbox = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onChange}
    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
      checked
        ? 'bg-v8-primary border-v8-primary'
        : 'border-zinc-300 dark:border-zinc-600 hover:border-v8-primary'
    }`}
  >
    {checked && <HiCheck className="w-3.5 h-3.5 text-white stroke-2" />}
  </div>
);

export default function UniversalFileView({
  items,
  viewMode,
  user,
  onItemClick,
  enableSelection,
  selectedIds,
  onSelectionChange,
  onMove,
  onCopy,
  onDelete,
  onDownload,
  onShare,
  onRestore,
  isTrash,
}: UniversalFileViewProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const searchParams = useSearchParams();
  const previewId = searchParams.get('previewId');

  const isItemAFolder = (item: any) =>
    !item || 'fileCount' in item || !item.mimeType || 'parentId' in item;

  // Recalculated only when items change
  const filteredPreviewItems = items.filter(item => !isItemAFolder(item));

  // Handle URL-based preview
  useEffect(() => {
    if (previewId && filteredPreviewItems.length > 0) {
      const idx = filteredPreviewItems.findIndex(i => i.id === previewId);
      if (idx !== -1) {
        setPreviewIndex(idx);
        setIsPreviewOpen(true);
      }
    }
  }, [previewId, filteredPreviewItems.map(i => i.id).join(',')]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };

    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeMenuId]);

  // Update menu position when activeMenuId changes
  useEffect(() => {
    if (activeMenuId && buttonRefs.current[activeMenuId]) {
      const button = buttonRefs.current[activeMenuId];
      const rect = button!.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX,
      });
    } else {
      setMenuPosition(null);
    }
  }, [activeMenuId]);

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onSelectionChange || !selectedIds) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds?.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(i => i.id)));
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const setButtonRef = (id: string) => (ref: HTMLButtonElement | null) => {
    buttonRefs.current[id] = ref;
  };

  const handleItemClickInternal = (item: any, e?: React.MouseEvent) => {
    if (!isItemAFolder(item)) {
      const idx = filteredPreviewItems.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        setPreviewIndex(idx);
        setIsPreviewOpen(true);
        return;
      }
    }

    // For folders or if preview fails, use parent's handler
    onItemClick?.(item);
  };

  const renderActionMenu = (item: any) => {
    const isFolder = 'fileCount' in item || !('mimeType' in item);

    if (!menuPosition) return null;

    const handleKeyDown = (e: React.KeyboardEvent, item: any) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleItemClickInternal(item);
      }
    };

    return (
      <div
        ref={menuRef}
        className="fixed w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl z-9999 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
        style={{
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {!isFolder && onDownload && (
          <button
            onClick={() => {
              onDownload(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineDownload className="w-4 h-4 text-zinc-400 group-hover/btn:text-v8-primary transition-colors" />
            Download
          </button>
        )}
        {onShare && (
          <button
            onClick={() => {
              onShare(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineShare className="w-4 h-4 text-zinc-400 group-hover/btn:text-v8-primary transition-colors" />
            Share
          </button>
        )}
        {onCopy && (
          <button
            onClick={() => {
              onCopy(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineDuplicate className="w-4 h-4 text-zinc-400 group-hover/btn:text-v8-primary transition-colors" />
            Copy to...
          </button>
        )}
        {onMove && (
          <button
            onClick={() => {
              onMove(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineFolderOpen className="w-4 h-4 text-zinc-400 group-hover/btn:text-v8-primary transition-colors" />
            Move to...
          </button>
        )}
        {onRestore && (
          <button
            onClick={() => {
              onRestore(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineRefresh className="w-4 h-4 group-hover/btn:rotate-180 transition-transform" />
            Restore
          </button>
        )}
        <div className="h-px bg-black/5 dark:bg-white/5 my-1.5 mx-2" />
        {onDelete && (
          <button
            onClick={() => {
              onDelete(item);
              setActiveMenuId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-extrabold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all hover:pl-5 group/btn"
          >
            <HiOutlineTrash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            {isTrash ? 'Delete Forever' : 'Delete'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
          {items.map(item => {
            const isFolder = 'fileCount' in item || !('mimeType' in item);
            const thumb = !isFolder ? getThumbnailUrl(item) : null;
            const iconStyle = !isFolder
              ? getFileIconStyle((item as any).mimeType)
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
            const itemsCount = isFolder ? (item as any).fileCount || 0 : null;
            const folderSize = isFolder ? (item as any).size || '0 B' : null;

            return (
              <Card
                key={item.id}
                onClick={() => handleItemClickInternal(item)}
                tabIndex={0}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClickInternal(item);
                  }
                }}
                className="cursor-pointer group relative bg-card-bg hover:shadow-2xl hover:-translate-y-2 p-6 rounded-[32px] overflow-visible focus:ring-4 focus:ring-v8-primary/20 outline-hidden"
              >
                {/* Top Section: Icon/Thumbnail */}
                <div className="relative mb-8 z-10">
                  {enableSelection && (
                    <div className="absolute top-[-10px] left-[-10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Checkbox
                        checked={selectedIds?.has(item.id) || false}
                        onChange={e => handleToggle(e, item.id)}
                      />
                    </div>
                  )}

                  <FileIcon
                    item={item}
                    isFolder={isFolder}
                    thumbUrl={thumb}
                    iconStyle={iconStyle}
                    viewMode="grid"
                  />

                  <div className="absolute top-0 right-0 z-30">
                    <button
                      ref={setButtonRef(item.id)}
                      onClick={e => toggleMenu(e, item.id)}
                      className="p-1.5 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:text-v8-primary shadow-lg"
                    >
                      <HiOutlineDotsVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Middle Section: Name and Meta */}
                <div className="relative z-10">
                  <h3
                    className="text-base font-black tracking-tight mb-1 truncate group-hover:text-v8-primary transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v8-primary">
                      {isFolder ? 'Folder' : (item as any).extension?.toUpperCase() || 'File'}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {isFolder ? `${itemsCount} items` : formatFileSize((item as any).size)}
                    </span>
                    {isFolder && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-zinc-300" />
                        <span className="text-[10px] font-black text-v8-primary uppercase tracking-tighter">
                          {folderSize}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bottom Section: Members and Date/Size */}
                  <div
                    className="flex items-center justify-between text-[11px] pt-4 border-t"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    <div className="flex -space-x-2.5">
                      {item.owner ? (
                        <div
                          className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-black/5 overflow-hidden"
                          title={`${item.owner.firstName} ${item.owner.lastName || ''} (${item.owner.email})`}
                        >
                          {item.owner.avatarUrl ? (
                            <img
                              src={item.owner.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{item.owner.firstName?.[0] || 'O'}</span>
                          )}
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-black/5">
                          {user?.firstName?.[0] || 'U'}
                        </div>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onShare?.(item);
                        }}
                        className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5 hover:bg-v8-primary hover:text-white hover:border-v8-primary transition-all active:scale-90"
                        title="Share with others"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      {!isFolder && (
                        <span className="font-bold text-v8-primary mb-0.5">
                          {formatFileSize((item as any).size)}
                        </span>
                      )}
                      <span className="font-black uppercase tracking-tighter opacity-40">
                        {new Date(item.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div
            className={`grid ${
              enableSelection
                ? 'grid-cols-[40px_1fr_40px] md:grid-cols-[40px_1fr_180px_40px] lg:grid-cols-[40px_1fr_180px_120px_40px] xl:grid-cols-[40px_1fr_180px_120px_120px_40px]'
                : 'grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px]'
            } items-center px-4 py-2 text-[13px] font-medium`}
            style={{ color: 'var(--text-tertiary)' }}
          >
            {enableSelection && (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={selectedIds?.size === items.length && items.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
            )}
            <div className="flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
              Document Name <HiChevronRight className="w-3 h-3 rotate-90" />
            </div>
            <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
              Last Edit <HiChevronRight className="w-3 h-3 rotate-90" />
            </div>
            <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
              File Size <HiChevronRight className="w-3 h-3 rotate-90" />
            </div>
            <div className="hidden xl:flex items-center gap-1 cursor-pointer hover:text-v8-primary transition-colors">
              Member <HiChevronRight className="w-3 h-3 rotate-90" />
            </div>
            <div></div>
          </div>

          {items.map(item => {
            const isFolder = 'fileCount' in item || !('mimeType' in item);
            const thumb = !isFolder ? getThumbnailUrl(item) : null;
            const iconStyle = !isFolder
              ? getFileIconStyle((item as any).mimeType)
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClickInternal(item)}
                tabIndex={0}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClickInternal(item);
                  }
                }}
                className={`grid ${
                  enableSelection
                    ? 'grid-cols-[40px_1fr_40px] md:grid-cols-[40px_1fr_180px_40px] lg:grid-cols-[40px_1fr_180px_120px_40px] xl:grid-cols-[40px_1fr_180px_120px_120px_40px]'
                    : 'grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px]'
                } items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.002] transition-all cursor-pointer group bg-card-bg relative focus:ring-2 focus:ring-v8-primary/20 outline-hidden`}
                style={{ borderColor: 'var(--border-primary)' }}
              >
                {enableSelection && (
                  <div
                    className="flex items-center justify-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds?.has(item.id) || false}
                      onChange={e => handleToggle(e, item.id)}
                    />
                  </div>
                )}
                {/* Document Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon
                    item={item}
                    isFolder={isFolder}
                    thumbUrl={thumb}
                    iconStyle={iconStyle}
                    viewMode="list"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className="font-bold text-[14px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.name}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-v8-primary lg:hidden">
                      {isFolder ? 'Folder' : (item as any).extension?.toUpperCase() || 'File'}
                    </span>
                  </div>
                </div>

                {/* Last Edit */}
                <div
                  className="hidden md:block text-[13px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {new Date(item.updatedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>

                {/* File Size */}
                <div
                  className="hidden lg:block text-[13px] font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isFolder ? '--' : formatFileSize((item as any).size)}
                </div>

                {/* Member */}
                <div className="hidden xl:flex items-center -space-x-2.5">
                  {item.owner ? (
                    <div
                      className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm ring-1 ring-black/5 overflow-hidden"
                      title={`${item.owner.firstName} ${item.owner.lastName || ''} (${item.owner.email})`}
                    >
                      {item.owner.avatarUrl ? (
                        <img
                          src={item.owner.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{item.owner.firstName?.[0] || 'O'}</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm ring-1 ring-black/5">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onShare?.(item);
                    }}
                    className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 text-[10px] font-black shadow-sm ring-1 ring-black/5 hover:bg-v8-primary hover:text-white hover:border-v8-primary transition-all active:scale-90"
                    title="Share with others"
                  >
                    +
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end relative">
                  <button
                    ref={setButtonRef(item.id)}
                    onClick={e => toggleMenu(e, item.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <HiOutlineDotsVertical
                      className="h-4 w-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render active menu outside of cards/rows to avoid z-index issues */}
      {activeMenuId && renderActionMenu(items.find(item => item.id === activeMenuId))}

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={filteredPreviewItems}
        initialIndex={previewIndex}
      />
    </div>
  );
}
