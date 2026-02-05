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
    <div className="space-y-6 bg-black min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">All files</h1>
          <p className="text-sm mt-0.5 text-zinc-500">
            {user?.storageUsedFormatted || '0 B'} of {user?.storageQuotaFormatted || '5 GB'} used
          </p>
        </div>
      </div>

      {/* Suggested for you */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-zinc-400">Suggested for you</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recentFiles.slice(0, 4).map(file => (
            <button
              key={file.name}
              className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-800 p-4 transition-all duration-150 bg-zinc-950 hover:bg-zinc-900"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-900 group-hover:bg-zinc-800 transition-colors"
                style={{ color: file.type === 'Folder' ? '#7c3aed' : '#94a3b8' }}
              >
                {file.type === 'Folder' ? (
                  <HiOutlineFolderOpen className="h-8 w-8" />
                ) : (
                  <HiOutlineDocumentText className="h-8 w-8" />
                )}
              </div>
              <div className="w-full text-center">
                <p className="text-xs font-medium truncate text-zinc-200">{file.name}</p>
                <p className="text-[10px] mt-0.5 text-zinc-500">{file.size}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Folders */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-zinc-400">Folders</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {folderItems.map(folder => (
            <button
              key={folder.name}
              className="group flex items-center gap-4 rounded-xl border border-zinc-800 p-4 transition-all duration-150 bg-zinc-950 hover:bg-zinc-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                <HiOutlineFolder className="h-6 w-6 text-[#7c3aed]" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate text-zinc-200">{folder.name}</p>
                <p className="text-xs mt-0.5 text-zinc-500">
                  {folder.items} items · {folder.modified}
                </p>
              </div>
              <HiOutlineDotsVertical className="h-5 w-5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-zinc-400">Name</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-900 text-left text-xs font-semibold text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Modified</th>
                <th className="px-4 py-3 hidden lg:table-cell">Size</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {recentFiles.map(file => (
                <tr
                  key={file.name}
                  className="group transition-colors duration-150 cursor-pointer hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900">
                        {file.type === 'Folder' ? (
                          <HiOutlineFolder className="h-5 w-5 text-[#7c3aed]" />
                        ) : (
                          <HiOutlineDocumentText className="h-5 w-5 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate text-zinc-200">
                          {file.name}
                        </span>
                        {file.starred && (
                          <HiOutlineStar className="h-4 w-4 fill-yellow-500/50 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell text-zinc-500">
                    {file.modified}
                  </td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell text-zinc-500">
                    {file.size}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <HiOutlineShare className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <HiOutlineDownload className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <HiOutlineTrash className="h-4 w-4 text-red-500/70 hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
