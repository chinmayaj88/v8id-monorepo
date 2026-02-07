'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import {
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineExclamationCircle,
  HiOutlineEye,
} from 'react-icons/hi';
import { formatFileSize } from '@/utils/format';

interface SharedFile {
  name: string;
  size: string; // comes as string from backend
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

interface SharedFolder {
  id: string;
  name: string;
  createdAt: string;
}

interface SharedData {
  type: 'FILE' | 'FOLDER';
  file?: SharedFile;
  folder?: SharedFolder;
  permission: 'VIEW' | 'EDIT';
  expiresAt?: string;
}

export default function SharedPage() {
  const { token } = useParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Handle potential array from useParams
      const tokenStr = Array.isArray(token) ? token[0] : token;

      if (!tokenStr) return;
      try {
        const response = await apiClient.get(`/share/${tokenStr}`);
        if (response.data?.data) {
          setData(response.data.data);
        } else {
          setError('Invalid share link format');
        }
      } catch (err: any) {
        if (err.response?.status === 410) {
          setError('This link has expired');
        } else if (err.response?.status === 404) {
          setError('Shared item not found');
        } else {
          setError('Failed to load shared item');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center animate-pulse">
        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-panel-bg rounded-[32px] border border-panel-border shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <HiOutlineExclamationCircle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-black mb-2 tracking-tight">Access Denied</h1>
        <p className="text-sm font-medium text-zinc-500 mb-8">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="rounded-xl px-6 font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  if (data.type === 'FILE' && data.file) {
    const isImage = data.file.mimeType.startsWith('image/');
    const isPDF = data.file.mimeType === 'application/pdf';

    return (
      <div className="flex flex-col w-full max-w-5xl gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <HiOutlineDocumentText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight truncate max-w-md">
                {data.file.name}
              </h1>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
              {formatFileSize(parseInt(data.file.size))} • {data.permission} Access
            </p>
          </div>
          <a
            href={data.file.downloadUrl}
            download={data.file.name} // Hint to browser to download
            target="_blank" // Often safer for presigned URLs to trigger download
            rel="noopener noreferrer"
          >
            <Button
              variant="primary"
              className="px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
              icon={<HiOutlineDownload className="w-4 h-4" />}
            >
              Download File
            </Button>
          </a>
        </div>

        {/* Preview Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center relative group">
          {isImage ? (
            <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-checkered-pattern">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.file.downloadUrl}
                alt={data.file.name}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={data.file.downloadUrl}
              className="w-full h-[80vh]"
              title={data.file.name}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 px-4 text-center">
              <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-[32px] flex items-center justify-center text-zinc-400 mb-2">
                <HiOutlineDocumentText className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
                Preview not available
              </h3>
              <p className="text-xs text-zinc-400 max-w-[200px]">
                This file type cannot be previewed directly in the browser. Please download it to
                view.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.type === 'FOLDER' && data.folder) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl w-full text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-[32px] flex items-center justify-center mb-6 shadow-lg shadow-orange-500/10">
          <HiOutlineFolder className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">{data.folder.name}</h1>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">
          Shared Folder • {data.permission} Access
        </p>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl w-full max-w-md border border-zinc-100 dark:border-zinc-800 mb-8">
          <p className="text-xs font-medium text-zinc-500">
            Folder contents are not visible in public preview yet.
            <br /> Please contact the owner for direct access.
          </p>
        </div>

        <Button
          variant="outline"
          className="px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest"
          disabled
        >
          Download Folder (Soon)
        </Button>
      </div>
    );
  }

  return <div className="text-center text-zinc-500">Invalid share data type</div>;
}
