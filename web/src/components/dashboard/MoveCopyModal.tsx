'use client';

import React, { useState } from 'react';
import { HiOutlineFolder, HiX, HiCheck, HiChevronRight } from 'react-icons/hi';
import Button from '@/components/ui/Button';
import { FolderItem } from '@/store/slices/fileSlice';

interface MoveCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetId: string | null) => void;
  folders: FolderItem[];
  title: string;
}

export default function MoveCopyModal({
  isOpen,
  onClose,
  onConfirm,
  folders,
  title,
}: MoveCopyModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const rootFolders = folders.filter(f => !f.parentId);

  const renderFolder = (folder: FolderItem, depth = 0) => {
    const children = folders.filter(f => f.parentId === folder.id);
    const isSelected = selectedId === folder.id;

    return (
      <React.Fragment key={folder.id}>
        <div
          onClick={() => setSelectedId(folder.id)}
          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isSelected ? 'bg-v8-primary/10 border border-v8-primary' : 'border border-transparent'}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <HiOutlineFolder
            className={`w-5 h-5 ${isSelected ? 'text-v8-primary' : 'text-zinc-400'}`}
          />
          <span
            className={`text-[13px] font-bold ${isSelected ? 'text-v8-primary' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            {folder.name}
          </span>
          {isSelected && <HiCheck className="w-4 h-4 text-v8-primary ml-auto" />}
        </div>
        {children.map(child => renderFolder(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-zinc-900 rounded-[32px] border shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiX className="w-5 h-5 opacity-40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div
            onClick={() => setSelectedId(null)}
            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${selectedId === null ? 'bg-v8-primary/10 border border-v8-primary' : 'border border-transparent'}`}
          >
            <HiOutlineFolder
              className={`w-5 h-5 ${selectedId === null ? 'text-v8-primary' : 'text-zinc-400'}`}
            />
            <span
              className={`text-[13px] font-bold ${selectedId === null ? 'text-v8-primary' : 'text-zinc-600 dark:text-zinc-300'}`}
            >
              Back to Root (/)
            </span>
            {selectedId === null && <HiCheck className="w-4 h-4 text-v8-primary ml-auto" />}
          </div>

          <div
            className="pt-2 border-t mt-2 opacity-50"
            style={{ borderColor: 'var(--border-primary)' }}
          ></div>

          {rootFolders.map(folder => renderFolder(folder))}
        </div>

        <div
          className="p-6 border-t bg-zinc-50 dark:bg-zinc-800/20 flex gap-3"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-12 font-black"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 rounded-2xl h-12 font-black"
            style={{ backgroundColor: '#8b5cf6', color: 'white' }}
            onClick={() => onConfirm(selectedId)}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
