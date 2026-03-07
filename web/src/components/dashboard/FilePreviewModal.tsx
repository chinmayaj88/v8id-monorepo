'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiX,
  HiOutlineDownload,
  HiOutlineShare,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineInformationCircle,
  HiZoomIn,
  HiZoomOut,
  HiOutlineRefresh,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { formatFileSize } from '@/utils/format';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import Spinner from '@/components/ui/Spinner';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  initialIndex: number;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  items,
  initialIndex,
}: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = items[currentIndex];

  const lastFetchedId = useRef<string | null>(null);

  const fetchPreviewUrl = useCallback(async (item: any) => {
    if (!item || 'fileCount' in item) return; // Skip folders

    const itemId = item.id;
    lastFetchedId.current = itemId;

    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    setTextPreview(null);
    setZoom(1);

    try {
      const response = await apiClient.post(`${ENDPOINTS.FILE.BASE}/download`, { id: item.id });
      const result = response.data?.data?.[0];

      // If ID has changed, this result is stale
      if (lastFetchedId.current !== itemId) return;

      if (result?.linkUrl) {
        setPreviewUrl(result.linkUrl);

        // If it's a text file or markdown, try to fetch the content
        const mt = (item.mimeType || '').toLowerCase();
        if (
          mt.includes('text') ||
          mt.includes('markdown') ||
          mt.includes('json') ||
          mt.includes('javascript') ||
          mt.includes('typescript')
        ) {
          const contentRes = await fetch(result.linkUrl);
          if (contentRes.ok) {
            const text = await contentRes.text();
            if (lastFetchedId.current === itemId) {
              setTextPreview(text);
            }
          }
        }
      } else {
        setError('Failed to generate preview link');
      }
    } catch (err: any) {
      if (lastFetchedId.current === itemId) {
        setError(err.message || 'Failed to load preview');
      }
    } finally {
      if (lastFetchedId.current === itemId) {
        setLoading(false);
      }
    }
  }, []);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    } else {
      // Clear data when closed
      setPreviewUrl(null);
      setTextPreview(null);
      setError(null);
      lastFetchedId.current = null;
    }
  }, [isOpen, initialIndex]);

  // Fetch when item changes
  useEffect(() => {
    if (isOpen && currentItem) {
      fetchPreviewUrl(currentItem);
    }
  }, [isOpen, currentItem, fetchPreviewUrl]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const isImage = (mimeType: string) => mimeType?.toLowerCase().includes('image');
  const isVideo = (mimeType: string) => mimeType?.toLowerCase().includes('video');
  const isPdf = (mimeType: string) => mimeType?.toLowerCase().includes('pdf');

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-4 text-white">
          <Spinner className="w-12 h-12 text-v8-primary animate-pulse" />
          <p className="text-zinc-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
            Securely initializing PAR...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-zinc-900 p-8 rounded-[32px] border border-white/5 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500">
            <HiX className="w-8 h-8" />
          </div>
          <h3 className="text-white font-black mb-1">Preview Error</h3>
          <p className="text-zinc-500 text-xs mb-6">{error}</p>
          <button
            onClick={() => fetchPreviewUrl(currentItem)}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            RetryPAR
          </button>
        </div>
      );
    }

    if (!previewUrl) return null;

    const mime = currentItem.mimeType || '';

    if (textPreview !== null) {
      return (
        <div className="w-full max-w-4xl h-full max-h-[80vh] bg-zinc-900 border border-white/5 rounded-[32px] p-8 overflow-auto CustomScrollbar">
          <pre className="text-zinc-300 text-[13px] font-mono leading-relaxed selection:bg-v8-primary/30">
            <code>{textPreview}</code>
          </pre>
        </div>
      );
    }

    if (isImage(mime)) {
      return (
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={previewUrl}
            alt={currentItem.name}
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl shadow-black/40"
          />
        </div>
      );
    }

    if (isVideo(mime)) {
      return (
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          autoPlay
          className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl ring-1 ring-white/10"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isPdf(mime)) {
      return (
        <iframe
          src={`${previewUrl}#toolbar=0`}
          className="w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl bg-zinc-900"
          title={currentItem.name}
        />
      );
    }

    // Default: Fallback info for unsupported types
    return (
      <div className="bg-zinc-900 p-12 rounded-[40px] border border-white/5 text-center max-w-md shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-32 w-32 bg-v8-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto mb-6 text-zinc-500 ring-1 ring-white/10">
          <HiOutlineExternalLink className="w-10 h-10" />
        </div>
        <h3 className="text-white text-xl font-black mb-2 tracking-tight">Unsupported Preview</h3>
        <p className="text-zinc-500 text-[13px] mb-8 leading-relaxed">
          Google-grade preview is not supported for{' '}
          <span className="text-white font-bold">{currentItem.extension?.toUpperCase()}</span> files
          yet. You can still download it securely.
        </p>
        <a
          href={previewUrl}
          download={currentItem.name}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-v8-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-v8-primary/20"
        >
          <HiOutlineDownload className="w-4 h-4" />
          Download To Local
        </a>
      </div>
    );
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500 select-none overflow-hidden"
      ref={containerRef}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 md:p-6 z-10 bg-linear-to-b from-black/50 to-transparent">
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <button
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all hover:rotate-90"
          >
            <HiX className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-white text-sm md:text-lg font-black tracking-tight truncate max-w-[200px] md:max-w-md">
              {currentItem.name}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-v8-primary">
              {currentItem.extension || 'FILE'}
            </p>
          </div>
          <HiOutlineInformationCircle
            className={`w-5 h-5 transition-colors ${showDetails ? 'text-v8-primary' : 'text-zinc-500 group-hover:text-white'}`}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isImage(currentItem.mimeType) && !loading && !error && (
            <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5 mr-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <HiZoomOut className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-black text-zinc-500 px-2 w-[55px] text-center">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <HiZoomIn className="w-5 h-5" />
              </button>
            </div>
          )}

          <a
            href={previewUrl || '#'}
            download={currentItem.name}
            className={`h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-v8-primary transition-all group ${!previewUrl ? 'pointer-events-none opacity-50' : ''}`}
            title="Secure Download"
          >
            <HiOutlineDownload className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </a>
          <button className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-indigo-600 transition-all group">
            <HiOutlineShare className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 z-20 h-12 w-12 md:h-16 md:w-16 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:shadow-2xl hover:shadow-v8-primary/20 transition-all border border-white/5"
          >
            <HiChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 z-20 h-12 w-12 md:h-16 md:w-16 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:shadow-2xl hover:shadow-v8-primary/20 transition-all border border-white/5"
          >
            <HiChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {/* Content Portal */}
        <div className="w-full h-full flex items-center justify-center max-h-screen">
          {renderContent()}
        </div>

        {/* Info Sidebar (Overlay) */}
        {showDetails && (
          <div className="absolute top-0 right-0 w-80 h-full bg-black/60 backdrop-blur-2xl border-l border-white/10 z-30 p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-white font-black uppercase tracking-widest text-xs">
                File Intelligence
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              <section>
                <p className="text-[10px] font-black text-v8-primary uppercase tracking-widest mb-3">
                  Identity
                </p>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-tighter mb-1">
                    Full Name
                  </p>
                  <p className="text-white text-sm font-bold truncate mb-3">{currentItem.name}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase mb-0.5">Size</p>
                      <p className="text-white text-xs font-bold">
                        {formatFileSize(currentItem.size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase mb-0.5">Type</p>
                      <p className="text-white text-xs font-bold">
                        {currentItem.extension?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-black text-v8-primary uppercase tracking-widest mb-3">
                  Timeline
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase">Created</p>
                      <p className="text-zinc-300 text-[11px] font-bold">
                        {new Date(currentItem.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase">Last Access</p>
                      <p className="text-zinc-300 text-[11px] font-bold">
                        {new Date().toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-black text-v8-primary uppercase tracking-widest mb-3">
                  Infrastructure
                </p>
                <div className="bg-linear-to-br from-white/5 to-transparent rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-[10px] font-bold">Storage Provider</span>
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-v8-primary/20 px-2 py-0.5 rounded">
                      Oracle Cloud
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[10px] font-bold">Tier</span>
                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                      Fast Access
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation (Small Thumbnails or Mini View) */}
      <div className="p-6 md:p-8 flex justify-center items-center gap-4 bg-linear-to-t from-black/50 to-transparent">
        <div className="flex items-center gap-2 max-w-full overflow-auto p-2 no-scrollbar">
          {items.map((item, idx) => {
            if ('fileCount' in item) return null; // Skip folders
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 w-10 md:h-12 md:w-12 rounded-xl border-2 transition-all shrink-0 relative overflow-hidden group ${idx === currentIndex ? 'border-v8-primary scale-110 shadow-lg shadow-v8-primary/20' : 'border-white/10 opacity-40 hover:opacity-80'}`}
              >
                <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[8px] font-black text-zinc-500 uppercase">
                  {item.extension || '..'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
