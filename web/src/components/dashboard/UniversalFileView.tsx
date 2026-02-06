import React, { useState } from 'react';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiChevronRight,
  HiOutlinePhotograph,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiCheck,
} from 'react-icons/hi';
import { formatFileSize } from '@/utils/format';

import { API_BASE_URL } from '@/lib/constants';

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

const getThumbnailUrl = (path: string | null | undefined) => {
  if (!path) return null;
  const cleanPath = path.startsWith('api/') ? path.substring(4) : path;
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

const FileIcon = ({ item, isFolder, thumbUrl, iconStyle, viewMode }: FileIconProps) => {
  const [imgError, setImgError] = useState(false);
  const showImage = thumbUrl && !imgError;

  const gridContainerClass = `h-24 w-full rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 relative overflow-hidden group-hover:scale-105 transition-all duration-500 shadow-xl shadow-black/5 ${showImage ? '' : iconStyle}`;
  const listContainerClass = `h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${showImage ? '' : iconStyle}`;

  const containerClass = viewMode === 'grid' ? gridContainerClass : listContainerClass;
  const imgClass =
    viewMode === 'grid' ? 'h-full w-full object-contain' : 'h-full w-full object-cover rounded-xl';
  const iconSize = viewMode === 'grid' ? 'h-10 w-10' : 'h-5 w-5';

  return (
    <div className={containerClass}>
      {showImage ? (
        <img src={thumbUrl!} alt="" className={imgClass} onError={() => setImgError(true)} />
      ) : isFolder ? (
        <HiOutlineFolder
          className={`${iconSize} ${viewMode === 'grid' ? 'text-emerald-600' : ''}`}
        />
      ) : isImageFile(item) ? (
        <HiOutlinePhotograph className={`${iconSize} text-orange-500`} />
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
}: UniversalFileViewProps) {
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

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
        {items.map(item => {
          const isFolder = 'fileCount' in item || !('mimeType' in item);
          const thumb = !isFolder ? getThumbnailUrl((item as any).thumbnailUrl) : null;
          const iconStyle = !isFolder
            ? getFileIconStyle((item as any).mimeType)
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
          const itemsCount = isFolder ? (item as any).fileCount || 0 : null;
          const folderSize = isFolder ? (item as any).size || '0 B' : null;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border group relative bg-card-bg"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              {/* Top Section: Icon/Thumbnail */}
              <div className="flex items-start justify-between mb-8 relative z-10">
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
                    <div className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-black/5">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                    <div className="h-7 w-7 rounded-full border-2 border-white dark:border-black bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
                      +
                    </div>
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
                        year: 'numeric', // Added year for consistency
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // List View
  return (
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
        const thumb = !isFolder ? getThumbnailUrl((item as any).thumbnailUrl) : null;
        const iconStyle = !isFolder
          ? getFileIconStyle((item as any).mimeType)
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';

        return (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className={`grid ${
              enableSelection
                ? 'grid-cols-[40px_1fr_40px] md:grid-cols-[40px_1fr_180px_40px] lg:grid-cols-[40px_1fr_180px_120px_40px] xl:grid-cols-[40px_1fr_180px_120px_120px_40px]'
                : 'grid-cols-[1fr_40px] md:grid-cols-[1fr_180px_40px] lg:grid-cols-[1fr_180px_120px_40px] xl:grid-cols-[1fr_180px_120px_120px_40px]'
            } items-center px-4 py-3 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.002] transition-all cursor-pointer group bg-card-bg`}
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {enableSelection && (
              <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
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
            <div className="hidden md:block text-[13px]" style={{ color: 'var(--text-secondary)' }}>
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
              <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm ring-1 ring-black/5">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 text-[10px] font-black shadow-sm ring-1 ring-black/5">
                +
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
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
  );
}
