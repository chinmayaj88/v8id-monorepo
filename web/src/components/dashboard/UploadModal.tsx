'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineCloudUpload,
  HiX,
  HiOutlineDocument,
  HiCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineFolderAdd,
} from 'react-icons/hi';
import { useAppDispatch } from '@/store/hooks';
import { uploadFiles } from '@/store/slices/fileSlice';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatFileSize } from '@/utils/format';
import gsap from 'gsap';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  initialFiles?: File[];
  initialPaths?: string[];
  mode?: 'file' | 'folder' | null;
  autoStart?: boolean;
}

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UploadModal({
  isOpen,
  onClose,
  folderId,
  initialFiles,
  initialPaths,
  mode,
  autoStart,
}: UploadModalProps) {
  const dispatch = useAppDispatch();
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploadPaths, setUploadPaths] = useState<string[]>([]);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setUploadPaths([]);
      triggeredRef.current = false;
    } else {
      // Entrance animation
      gsap.fromTo(
        '.modal-content',
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );

      if (initialFiles && initialFiles.length > 0) {
        addFiles(initialFiles, initialPaths);
        if (autoStart) {
          // Delay slightly to ensure state is settled
          setTimeout(() => startUpload(), 100);
        }
      }

      // Handle direct triggers from header - only once per open
      if (!triggeredRef.current) {
        if (mode === 'file') {
          fileInputRef.current?.click();
          triggeredRef.current = true;
        } else if (mode === 'folder') {
          folderInputRef.current?.click();
          triggeredRef.current = true;
        }
      }
    }
  }, [isOpen, initialFiles, mode, autoStart, initialPaths]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const paths = filesArray.map(f => {
        const parts = f.webkitRelativePath.split('/');
        parts.pop(); // Remove filename, keep only directory path
        return parts.join('/');
      });
      addFiles(filesArray, paths);
    }
  };

  const addFiles = (newFiles: File[], paths?: string[]) => {
    const formattedFiles: FileUploadProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...formattedFiles]);

    if (paths) {
      setUploadPaths(prev => [...prev, ...paths]);
    } else {
      setUploadPaths(prev => [...prev, ...new Array(newFiles.length).fill('')]);
    }

    // Animate new files entering
    setTimeout(() => {
      gsap.from('.file-item-new', {
        x: -20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: 'power2.out',
      });
    }, 0);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    const files: File[] = [];
    const paths: string[] = [];

    const traverseEntry = async (entry: any, currentPath: string = '') => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file(resolve, reject);
        });
        files.push(file);
        paths.push(currentPath); // Path is the parent directory
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readAllEntries = async (): Promise<any[]> => {
          let allEntries: any[] = [];
          const read = async (): Promise<any[]> => {
            return new Promise((resolve, reject) => {
              reader.readEntries(resolve, reject);
            });
          };
          let results = await read();
          while (results.length > 0) {
            allEntries = allEntries.concat(results);
            results = await read();
          }
          return allEntries;
        };

        const entries = await readAllEntries();
        for (const childEntry of entries) {
          await traverseEntry(
            childEntry,
            currentPath ? `${currentPath}/${entry.name}` : entry.name
          );
        }
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        promises.push(traverseEntry(entry));
      }
    }

    await Promise.all(promises);
    if (files.length > 0) {
      addFiles(files, paths);
    }
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    const filesToUpload = files.filter(f => f.status === 'pending' || f.status === 'error');
    const indicesToUpload = files
      .map((f, i) => (f.status === 'pending' || f.status === 'error' ? i : -1))
      .filter(i => i !== -1);
    const pathsToUpload = indicesToUpload.map(i => uploadPaths[i]);

    setFiles(prev =>
      prev.map(f =>
        f.status === 'pending' || f.status === 'error'
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    // Animate button pulse during upload
    gsap.to('.upload-btn', {
      scale: 1.05,
      repeat: -1,
      yoyo: true,
      duration: 0.8,
    });

    try {
      await dispatch(
        uploadFiles({
          files: filesToUpload.map(f => f.file),
          folderId,
          paths: pathsToUpload.some(p => p) ? pathsToUpload : undefined,
          onProgress: percent => {
            setFiles(prev =>
              prev.map(f => (f.status === 'uploading' ? { ...f, progress: percent } : f))
            );
          },
        })
      ).unwrap();

      setFiles(prev =>
        prev.map(f => (f.status === 'uploading' ? { ...f, status: 'completed', progress: 100 } : f))
      );

      // Success animation
      gsap.killTweensOf('.upload-btn');
      gsap.to('.upload-btn', { scale: 1, duration: 0.3 });

      // Floating success particles simulation
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'fixed pointer-events-none z-[100] w-2 h-2 rounded-full bg-v8-primary';
        document.body.appendChild(p);
        const rect = dropZoneRef.current?.getBoundingClientRect();
        if (rect) {
          gsap.set(p, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          gsap.to(p, {
            x: '+= ' + (Math.random() * 400 - 200),
            y: '+= ' + (Math.random() * 400 - 200),
            opacity: 0,
            scale: 0,
            duration: 1 + Math.random(),
            onComplete: () => p.remove(),
          });
        }
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      gsap.killTweensOf('.upload-btn');
      gsap.to('.upload-btn', {
        x: -10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
      });
      setFiles(prev =>
        prev.map(f =>
          f.status === 'uploading' ? { ...f, status: 'error', error: error.message } : f
        )
      );
    }
  };

  const isUploading = files.some(f => f.status === 'uploading');
  const allCompleted = files.length > 0 && files.every(f => f.status === 'completed');

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title={isUploading ? 'Uploading Items...' : allCompleted ? 'Upload Complete' : 'Upload Files'}
      maxWidth="md"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 rounded-xl h-10 font-bold text-[11px] uppercase tracking-wider"
          >
            {allCompleted ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={startUpload}
            disabled={files.length === 0 || isUploading || allCompleted}
            style={{ backgroundColor: allCompleted ? '#10b981' : '#8b5cf6', color: 'white' }}
            className={`upload-btn flex-1 rounded-xl h-10 font-bold text-[11px] uppercase tracking-wider gap-2 shadow-lg ${isUploading ? 'animate-pulse opacity-90' : 'shadow-v8-primary/20'}`}
            icon={
              isUploading ? null : allCompleted ? (
                <HiCheckCircle className="w-4 h-4" />
              ) : (
                <HiOutlineCloudUpload className="w-4 h-4" />
              )
            }
          >
            {isUploading
              ? `Uploading ${Math.round(files.reduce((acc, f) => acc + f.progress, 0) / (files.length || 1))}%`
              : allCompleted
                ? 'Success!'
                : `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 modal-content">
        {/* Drop Zone */}
        {files.length === 0 && (
          <div
            ref={dropZoneRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => {
              // Only trigger file select if no specific mode is active or user clicks outside icons
              if (!mode && !isUploading) fileInputRef.current?.click();
            }}
            onMouseEnter={() =>
              !isUploading &&
              gsap.to('.upload-icon-container', { scale: 1.1, rotate: 5, duration: 0.3 })
            }
            onMouseLeave={() =>
              !isUploading &&
              gsap.to('.upload-icon-container', { scale: 1, rotate: 0, duration: 0.3 })
            }
            className={`
            relative cursor-pointer rounded-[32px] border-2 border-dashed p-6 
            transition-all duration-500 ease-out flex flex-col items-center justify-center gap-3
            ${
              isDragging
                ? 'border-v8-primary bg-v8-primary/5 scale-[0.98]'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-v8-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderSelect}
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
              // @ts-ignore
              directory=""
              multiple
            />

            {!mode && (
              <div className="flex gap-6 mb-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="group/btn flex flex-col items-center gap-3"
                >
                  <div
                    className={`
                  upload-icon-container w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500
                  ${isDragging ? 'bg-v8-primary text-white rotate-12' : 'bg-v8-primary/10 text-v8-primary group-hover/btn:bg-v8-primary group-hover/btn:text-white group-hover/btn:scale-110 group-hover/btn:rotate-6'}
                `}
                  >
                    <HiOutlineCloudUpload
                      className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`}
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover/btn:opacity-100 transition-opacity">
                    Upload Files
                  </span>
                </button>

                <div className="w-px h-16 bg-zinc-200 dark:bg-zinc-800 my-auto" />

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  className="group/btn flex flex-col items-center gap-3"
                >
                  <div
                    className={`
                  w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500
                  bg-emerald-500/10 text-emerald-600 group-hover/btn:bg-emerald-500 group-hover/btn:text-white group-hover/btn:scale-110 group-hover/btn:-rotate-6
                `}
                  >
                    <HiOutlineFolderAdd className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover/btn:opacity-100 transition-opacity">
                    Upload Folder
                  </span>
                </button>
              </div>
            )}

            <div className="text-center mt-2">
              <h4
                className="text-lg font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {isDragging
                  ? 'Drop items here'
                  : mode === 'folder'
                    ? 'Select folder to upload'
                    : mode === 'file'
                      ? 'Select files to upload'
                      : 'Drop files or folders'}
              </h4>
              <p
                className="text-[11px] font-bold opacity-40 mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {mode === 'folder'
                  ? 'only folders will be accepted'
                  : mode === 'file'
                    ? 'multiple files supported'
                    : 'recursive folder upload supported'}
              </p>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div
            className="relative"
            style={{
              maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
            }}
          >
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar pb-12">
              {files.map((fileProgress, index) => (
                <div
                  key={index}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-300 ${fileProgress.status === 'pending' ? 'file-item-new' : ''}`}
                >
                  <div
                    className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                  ${
                    fileProgress.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100'
                      : fileProgress.status === 'error'
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 border-rose-100'
                        : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-100 dark:border-zinc-800'
                  }
                `}
                  >
                    {fileProgress.status === 'completed' ? (
                      <HiCheckCircle className="w-6 h-6" />
                    ) : fileProgress.status === 'error' ? (
                      <HiOutlineExclamationCircle className="w-6 h-6" />
                    ) : (
                      <HiOutlineDocument className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <p
                        className="text-[13px] font-bold truncate pr-3"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {fileProgress.file.name}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 shrink-0">
                        {formatFileSize(fileProgress.file.size)}
                      </span>
                    </div>

                    <div className="relative h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full ${
                          fileProgress.status === 'error'
                            ? 'bg-rose-500'
                            : fileProgress.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-v8-primary'
                        }`}
                        style={{ width: `${fileProgress.progress}%` }}
                      />
                    </div>

                    {fileProgress.status === 'error' && (
                      <p className="text-[9px] font-extrabold text-rose-500 mt-1 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-2.5 h-2.5" />
                        {fileProgress.error || 'Upload failed'}
                      </p>
                    )}
                  </div>

                  {!isUploading && fileProgress.status !== 'completed' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <HiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
