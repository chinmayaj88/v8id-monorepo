'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Initial mount animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Left Panel Animation (Fade in)
      tl.from(leftPanelRef.current, {
        opacity: 0,
        x: -20,
        duration: 1.2,
        ease: 'power3.out',
      });

      // Initial Right Panel Animation
      tl.from(
        rightPanelRef.current,
        {
          opacity: 0,
          x: 40,
          duration: 1,
          ease: 'power3.out',
        },
        '-=0.8'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate content on route change
  useEffect(() => {
    if (!rightPanelRef.current) return;

    const ctx = gsap.context(() => {
      // Content Entry Animation
      const animateItems = rightPanelRef.current?.querySelectorAll('.animate-item');
      if (animateItems?.length) {
        gsap.fromTo(
          animateItems,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.2)',
            clearProps: 'all',
          }
        );
      }
    }, rightPanelRef);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen w-full overflow-hidden bg-white font-sans text-slate-900"
    >
      {/* LEFT SIDE: Visual Branding - Persistent */}
      <div
        ref={leftPanelRef}
        className="hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden lg:bg-v8-deep lg:text-white"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/bg1.jpg"
            alt="V8id Cloud Background"
            fill
            priority
            className="object-cover brightness-75 transition-transform duration-[20s] hover:scale-110"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-br from-v8-deep/40 to-black/60 z-1" /> */}
        </div>

        <div className="relative z-10 flex flex-col items-center px-12 text-center drop-shadow-2xl">
          <div className="mb-10 flex flex-col items-center">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/10 backdrop-blur-2xl shadow-2xl border border-white/20 transform hover:rotate-6 transition-transform duration-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-14 w-14 text-white drop-shadow-glow"
              >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-6">
              V8id <span className="text-v8-primary">Cloud</span>
            </h1>
            <div className="h-1.5 w-24 bg-v8-primary rounded-full mb-8 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
            <p className="text-zinc-200 text-xl font-medium max-w-md leading-relaxed">
              Experience the next generation of{' '}
              <span className="text-white font-bold">secure file storage</span> with lightning-fast
              sync.
            </p>
          </div>

          <div className="flex gap-4 mt-8 opacity-70">
            <div className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-xs font-semibold backdrop-blur-sm">
              End-to-End Encrypted
            </div>
            <div className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-xs font-semibold backdrop-blur-sm">
              Multi-Device Sync
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Content Form - Animates on transition */}
      <main
        ref={rightPanelRef}
        className="flex w-full items-center justify-center bg-white p-6 md:p-12 lg:w-1/2"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
