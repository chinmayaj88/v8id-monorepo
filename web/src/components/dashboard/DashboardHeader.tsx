'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineBell,
  HiPlus,
  HiOutlineFolderAdd,
  HiOutlineCloudUpload,
  HiOutlineDocumentAdd,
  HiOutlineFolder,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { setSearchQuery, createFolder } from '@/store/slices/fileSlice';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadModal from '@/components/dashboard/UploadModal';
import CreateNoteModal from '@/components/dashboard/CreateNoteModal';

export default function DashboardHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const { searchQuery, currentFolderId, files, folders } = useAppSelector(state => state.files);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ files: File[]; paths?: string[] } | null>(
    null
  );

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allSearchableItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f => ({ ...f, type: 'file' })),
  ];

  const searchResults = searchQuery.trim()
    ? allSearchableItems
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)
    : [];

  const handleResultClick = (item: any) => {
    setIsSearchFocused(false);
    dispatch(setSearchQuery(''));
    if (item.type === 'folder') {
      router.push(`/dashboard/files?folderId=${item.id}`);
    } else {
      const folderParam = item.folderId ? `folderId=${item.folderId}&` : '';
      router.push(`/dashboard/files?${folderParam}previewId=${item.id}`);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed', error);
      dispatch(logout());
    }
  };

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

  if (!mounted) return null;

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center gap-4 flex-1 max-w-2xl relative" ref={searchContainerRef}>
        <Input
          placeholder="Search files, folders, and more..."
          value={searchQuery}
          onChange={e => {
            dispatch(setSearchQuery(e.target.value));
            setIsSearchFocused(true);
          }}
          onFocus={() => setIsSearchFocused(true)}
          icon={<HiOutlineSearch className="h-5 w-5" />}
          containerClassName="max-w-md w-full"
          className="border-0 ring-1 ring-inset ring-(--border-primary) focus:ring-2 focus:ring-v8-primary/20 py-2"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
        />

        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Search Results
              </p>
            </div>
            {searchResults.map(item => (
              <button
                key={item.id}
                onClick={() => handleResultClick(item)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.type === 'folder' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'}`}
                >
                  {item.type === 'folder' ? (
                    <HiOutlineFolder className="w-5 h-5" />
                  ) : (
                    <HiOutlineDocumentText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-60">
                    {item.type === 'folder' ? 'Folder' : (item as any).extension || 'File'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
        >
          <HiOutlineBell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <button
          // onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
        >
          {theme === 'light' ? (
            <HiOutlineMoon className="h-5 w-5" />
          ) : (
            <HiOutlineSun className="h-5 w-5" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 shadow-lg shadow-v8-primary/20 ${
              isCreateDropdownOpen
                ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 rotate-45 scale-90'
                : 'bg-v8-primary text-white hover:scale-110 active:scale-95'
            }`}
          >
            <HiPlus className="w-5 h-5 font-black" />
          </button>

          {isCreateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCreateDropdownOpen(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] shadow-2xl z-50 overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                <div className="px-4 py-2 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Add Component
                  </p>
                </div>

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
                    <p className="text-[9px] font-bold opacity-40 text-zinc-500">
                      Create an empty directory
                    </p>
                  </div>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1 mx-2" />

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsCreateDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiOutlineCloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider">Upload Files</p>
                    <p className="text-[9px] font-bold opacity-40 text-zinc-500">
                      Directly from your PC
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    folderInputRef.current?.click();
                    setIsCreateDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiOutlineFolderAdd className="w-5 h-5 rotate-12 shadow-sm" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider">Upload Folder</p>
                    <p className="text-[9px] font-bold opacity-40 text-zinc-500">
                      Selective directory upload
                    </p>
                  </div>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1 mx-2" />

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
                    <p className="text-[9px] font-bold opacity-40 text-zinc-500">
                      Standard text document
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={e => {
            if (e.target.files?.length) {
              setSelectedFiles({ files: Array.from(e.target.files) });
              setIsUploadModalOpen(true);
            }
          }}
        />
        <input
          type="file"
          ref={folderInputRef}
          className="hidden"
          // @ts-ignore
          webkitdirectory=""
          // @ts-ignore
          directory=""
          multiple
          onChange={e => {
            if (e.target.files?.length) {
              const filesArray = Array.from(e.target.files);
              const paths = filesArray.map(f => {
                const parts = f.webkitRelativePath.split('/');
                parts.pop();
                return parts.join('/');
              });
              setSelectedFiles({ files: filesArray, paths });
              setIsUploadModalOpen(true);
            }
          }}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedFiles(null);
          }}
          folderId={currentFolderId}
          initialFiles={selectedFiles?.files}
          initialPaths={selectedFiles?.paths}
          autoStart={true}
        />

        <CreateNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          folderId={currentFolderId}
        />

        {/* Create Folder Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border shadow-2xl w-full max-w-sm"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <h2
                className="text-xl font-black mb-6 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Create New Folder
              </h2>
              <form onSubmit={handleCreateFolder}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Folder Name"
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-v8-primary transition-all mb-6 font-bold"
                  style={{ color: 'var(--text-primary)' }}
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

        <div className="h-8 w-px bg-(--border-primary) mx-2"></div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-v8-primary/20"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: `1px solid var(--border-primary)`,
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-black"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-white text-xs font-black"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                        >
                          {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName || ''}`
                          : user?.email?.split('@')[0]}
                      </p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-tighter"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-zinc-500/10"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <HiOutlineUser className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-colors text-red-500 hover:bg-red-500/10"
                  >
                    <HiOutlineLogout className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
