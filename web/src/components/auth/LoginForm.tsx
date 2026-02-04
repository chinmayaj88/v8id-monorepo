'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Link from 'next/link';
import clsx from 'clsx';

export default function LoginForm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState('jenachinmaya51@gmail.com'); // Pre-filled from image
  const [password, setPassword] = useState('Chinmaya@6370');

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial timeline
      const tl = gsap.timeline();

      // 1. Logo fades in and moves down
      tl.from(logoRef.current, {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // 2. Card slides up from bottom (or fades in scale)
      tl.from(
        cardRef.current,
        {
          y: 100,
          opacity: 0,
          duration: 0.8,
          ease: 'back.out(1.2)',
        },
        '-=0.5'
      );

      // 3. Stagger children of card
      if (cardRef.current) {
        const elements = cardRef.current.querySelectorAll('.animate-item');
        tl.from(
          elements,
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '-=0.4'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden font-sans text-slate-900"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/bg1.jpg" alt="Background" fill priority className="object-cover" />
        {/* Overlay for better readability if needed, though image seems dark/vibrant */}
        {/* <div className="absolute inset-0 bg-black/20" /> */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Logo Section */}
        <div ref={logoRef} className="mb-8 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md shadow-lg border border-white/30">
            {/* Cloud Icon Placeholder - Replacing with simple SVG or Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-10 w-10 text-white"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1">V8id Cloud</h1>
          <p className="text-white/80 text-sm font-medium">Secure Cloud Storage Platform</p>
        </div>

        {/* Login Card */}
        <div
          ref={cardRef}
          className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl sm:p-10"
        >
          <div className="animate-item mb-8">
            <h2 className="text-3xl font-semibold text-slate-800">Welcome back</h2>
            <p className="mt-2 text-slate-500 font-medium">Sign in to continue to your account</p>
          </div>

          <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            {/* Email Input */}
            <div className="animate-item space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-purple-900">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={clsx(
                  'w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all',
                  'focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10'
                )}
                placeholder="name@example.com"
              />
            </div>

            {/* Password Input */}
            <div className="animate-item space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-purple-900">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={clsx(
                    'w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all',
                    'focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10'
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-600 hover:text-purple-700 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="animate-item flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={clsx(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                    rememberMe ? 'bg-purple-600' : 'bg-slate-200'
                  )}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      rememberMe ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
                <span
                  className="text-sm font-medium text-purple-900 cursor-pointer"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me
                </span>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="animate-item pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-purple-600 py-4 text-lg font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-700 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Log in
              </button>
            </div>
          </form>

          {/* Footer Text */}
          <div className="animate-item mt-8 text-center">
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              By logging in, you agree to our updated{' '}
              <a href="#" className="text-purple-600 hover:underline">
                terms and service
              </a>{' '}
              and{' '}
              <a href="#" className="text-purple-600 hover:underline">
                privacy policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
