'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineCloudUpload,
  HiX,
  HiOutlineDocument,
  HiCheckCircle,
  HiOutlineExclamationCircle,
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
}

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UploadModal({ isOpen, onClose, folderId, initialFiles }: UploadModalProps) {
  const dispatch = useAppDispatch();
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
    } else {
      // Entrance animation
      gsap.fromTo(
        '.modal-content',
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );

      if (initialFiles && initialFiles.length > 0) {
        addFiles(initialFiles);
      }
    }
  }, [isOpen, initialFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const formattedFiles: FileUploadProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...formattedFiles]);

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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    const filesToUpload = files.filter(f => f.status === 'pending' || f.status === 'error');

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
      title="Upload Files"
      maxWidth="lg"
    >
      <div className="space-y-6 modal-content">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onMouseEnter={() =>
            !isUploading &&
            gsap.to('.upload-icon-container', { scale: 1.1, rotate: 5, duration: 0.3 })
          }
          onMouseLeave={() =>
            !isUploading &&
            gsap.to('.upload-icon-container', { scale: 1, rotate: 0, duration: 0.3 })
          }
          className={`
            relative cursor-pointer rounded-[40px] border-2 border-dashed p-10 
            transition-all duration-500 ease-out flex flex-col items-center justify-center gap-4
            ${
              isDragging
                ? 'border-v8-primary bg-v8-primary/5 scale-[0.98] shadow-2xl shadow-v8-primary/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-v8-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
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

          <div
            className={`
            upload-icon-container w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-500
            ${isDragging ? 'bg-v8-primary text-white rotate-12' : 'bg-v8-primary/10 text-v8-primary'}
          `}
          >
            <HiOutlineCloudUpload className={`w-12 h-12 ${isDragging ? 'animate-bounce' : ''}`} />
          </div>

          <div className="text-center">
            <h4
              className="text-xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {isDragging ? 'Drop to upload' : 'Select files to upload'}
            </h4>
            <p
              className="text-sm font-bold opacity-40 mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              or drag and drop them here
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {files.map((fileProgress, index) => (
              <div
                key={index}
                className={`group relative flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-300 ${fileProgress.status === 'pending' ? 'file-item-new' : ''}`}
              >
                <div
                  className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border
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
                    <HiCheckCircle className="w-7 h-7" />
                  ) : fileProgress.status === 'error' ? (
                    <HiOutlineExclamationCircle className="w-7 h-7" />
                  ) : (
                    <HiOutlineDocument className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <p
                      className="text-[14px] font-bold truncate pr-4"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fileProgress.file.name}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 shrink-0">
                      {formatFileSize(fileProgress.file.size)}
                    </span>
                  </div>

                  <div className="relative h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full ${
                        fileProgress.status === 'error'
                          ? 'bg-rose-500'
                          : fileProgress.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-v8-primary shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                      }`}
                      style={{ width: `${fileProgress.progress}%` }}
                    />
                  </div>

                  {fileProgress.status === 'error' && (
                    <p className="text-[10px] font-extrabold text-rose-500 mt-1.5 flex items-center gap-1">
                      <HiOutlineExclamationCircle className="w-3 h-3" />
                      {fileProgress.error || 'Upload failed'}
                    </p>
                  )}
                </div>

                {!isUploading && fileProgress.status !== 'completed' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 rounded-[24px] h-14 font-black text-xs uppercase tracking-widest"
          >
            {allCompleted ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={startUpload}
            disabled={files.length === 0 || isUploading || allCompleted}
            style={{ backgroundColor: allCompleted ? '#10b981' : '#8b5cf6', color: 'white' }}
            className={`upload-btn flex-1 rounded-[24px] h-14 font-black text-xs uppercase tracking-widest gap-2 shadow-xl ${isUploading ? 'animate-pulse opacity-90' : 'shadow-v8-primary/25'}`}
            icon={
              isUploading ? null : allCompleted ? (
                <HiCheckCircle className="w-5 h-5" />
              ) : (
                <HiOutlineCloudUpload className="w-5 h-5" />
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
      </div>
    </Modal>
  );
}
