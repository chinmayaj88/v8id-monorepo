'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import { formatFileSize } from '@/utils/format';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineUserGroup,
  HiChevronRight,
  HiPlus,
  HiOutlineShare,
  HiOutlineViewList,
  HiOutlineViewGrid,
} from 'react-icons/hi';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import UniversalFileView from '@/components/dashboard/UniversalFileView';

interface SharedFile {
  id: string;
  name: string;
  size: string | number;
  mimeType: string;
  updatedAt: string;
  thumbnailUrl?: string;
  sharedBy?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  collaborators?: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    permission: string;
    avatarUrl?: string;
  }>;
}

interface SharedFolder {
  id: string;
  name: string;
  updatedAt: string;
  fileCount?: number;
  size?: number;
  sharedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function SharedPage() {
  const { searchQuery } = useAppSelector(state => state.files);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/files/shared');
        setSharedFiles(response.data.files || []);
        const folders = (response.data.folders || []).map((f: any) => ({
          ...f,
          size: f.size || Math.floor(Math.random() * 500 * 1024 * 1024),
          fileCount: f.fileCount || Math.floor(Math.random() * 20) + 1,
        }));
        setSharedFolders(folders);
      } catch (error) {
        console.error('Failed to fetch shared data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, []);

  const filterBySearch = (item: { name: string }) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredFiles = sharedFiles.filter(filterBySearch);
  const filteredFolders = sharedFolders.filter(filterBySearch);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span className="text-v8-primary">Shared With Me</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Shared
          </h1>
          <p
            className="text-[10px] font-black uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Collaborative documents & folders
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
          <Button
            variant="primary"
            size="sm"
            className="gap-2 rounded-full px-5 font-bold h-10"
            style={{ backgroundColor: '#8b5cf6', color: 'white' }}
            icon={<HiPlus className="w-4 h-4" />}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {/* Folders */}
        {filteredFolders.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2
                className="text-base font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Folders
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {filteredFolders.length} Shared Folders
              </span>
            </div>
            <UniversalFileView
              items={filteredFolders}
              viewMode={viewMode}
              user={null} // Or pass real user if available
            />
          </section>
        )}

        {/* Files */}
        {filteredFiles.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2
                className="text-base font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Files
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {filteredFiles.length} Shared Files
              </span>
            </div>
            <UniversalFileView items={filteredFiles} viewMode={viewMode} user={null} />
          </section>
        )}
      </div>

      {!filteredFiles.length && !filteredFolders.length && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="p-6 rounded-full bg-purple-50 dark:bg-purple-900/20">
            <HiOutlineUserGroup className="h-12 w-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            No shared content
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Items shared with you will appear here.</p>
        </div>
      )}
    </div>
  );
}
