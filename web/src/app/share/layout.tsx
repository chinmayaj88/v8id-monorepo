import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shared File - V8id',
  description: 'View and download shared files securely.',
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.className} min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col`}
    >
      <header className="h-16 px-6 flex items-center justify-between border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-black text-xs">
            V8
          </div>
          <span className="font-black tracking-tight text-lg">v8id</span>
        </div>
      </header>
      <main className="flex-1 w-full bg-zinc-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto p-6 md:p-12 w-full h-full flex items-center justify-center min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
