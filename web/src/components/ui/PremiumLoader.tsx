'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function PremiumLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
      <div className="relative w-64 h-64">
        <DotLottieReact
          src="https://lottie.host/801e855d-6c7c-4740-9a28-56f8496860d5/A1tL5vJpE3.lottie"
          loop
          autoplay
        />

        {/* Subtle branding below the loader */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <h2 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white animate-pulse">
            V8id <span className="text-v8-primary">Cloud</span>
          </h2>
          <div className="flex gap-1.5">
            <div className="h-1 w-1 rounded-full bg-v8-primary animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1 w-1 rounded-full bg-v8-primary animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1 w-1 rounded-full bg-v8-primary animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
