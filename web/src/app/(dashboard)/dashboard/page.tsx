'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiOutlineDotsVertical,
  HiOutlineDownload,
  HiOutlineShare,
  HiOutlineTrash,
} from 'react-icons/hi';

const recentFiles = [
  {
    name: 'Product_Requirements_V3.pdf',
    type: 'PDF',
    size: '2.4 MB',
    modified: '2 hours ago',
    starred: false,
  },
  {
    name: 'Team_Architecture_Diagram.drawio',
    type: 'Diagram',
    size: '1.1 MB',
    modified: '5 hours ago',
    starred: true,
  },
  {
    name: 'Q4_Financial_Report.xlsx',
    type: 'Spreadsheet',
    size: '856 KB',
    modified: 'Yesterday',
    starred: false,
  },
  {
    name: 'Marketing_Assets_2024',
    type: 'Folder',
    size: '12 items',
    modified: 'Feb 4, 2024',
    starred: false,
  },
];

const folderItems = [
  { name: 'Work Documents', items: 124, modified: '3 days ago' },
  { name: 'Personal', items: 89, modified: '1 week ago' },
  { name: 'Projects', items: 45, modified: '2 days ago' },
];

export default function DashboardPage() {
  const user = useAppSelector(state => state.auth.user);

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Home
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Welcome back, {user?.firstName || 'User'}! You've used {user?.storagePercentage || 0}%
            of your storage.
          </p>
        </div>
      </div>

      <section>
        <h2
          className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Suggested for you
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentFiles.map(file => (
            <button
              key={file.name}
              className="group flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.backgroundColor = 'var(--card-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--card-border)';
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: file.type === 'Folder' ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                }}
              >
                {file.type === 'Folder' ? (
                  <HiOutlineFolderOpen className="h-7 w-7" />
                ) : (
                  <HiOutlineDocumentText className="h-7 w-7" />
                )}
              </div>
              <div className="w-full text-center">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p
                  className="text-[10px] mt-1 font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {file.size}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Folders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folderItems.map(folder => (
            <button
              key={folder.name}
              className="group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:scale-[1.01]"
              style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.backgroundColor = 'var(--card-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--card-border)';
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--brand-primary)' }}
              >
                <HiOutlineFolder className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {folder.name}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {folder.items} items · {folder.modified}
                </p>
              </div>
              <HiOutlineDotsVertical
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="text-[10px] font-black mb-4 uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Recent Files
        </h2>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10px] font-black uppercase tracking-widest"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}
              >
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3 hidden md:table-cell">Modified</th>
                <th className="px-5 py-3 hidden lg:table-cell">Size</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map(file => (
                <tr
                  key={file.name}
                  className="group transition-colors duration-200 cursor-pointer border-b last:border-0"
                  style={{ borderColor: 'var(--border-secondary)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--card-hover)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color:
                            file.type === 'Folder'
                              ? 'var(--brand-primary)'
                              : 'var(--text-tertiary)',
                        }}
                      >
                        {file.type === 'Folder' ? (
                          <HiOutlineFolder className="h-4 w-4" />
                        ) : (
                          <HiOutlineDocumentText className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className="text-sm font-bold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-5 py-2 text-xs font-medium hidden md:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {file.modified}
                  </td>
                  <td
                    className="px-5 py-2 text-xs font-medium hidden lg:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {file.size}
                  </td>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 rounded-xl transition-colors hover:bg-zinc-500/10"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <HiOutlineShare className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 rounded-xl transition-colors hover:bg-zinc-500/10"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <HiOutlineDownload className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
