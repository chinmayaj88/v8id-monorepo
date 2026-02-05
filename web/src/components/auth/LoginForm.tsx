'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

import AuthHeader from './AuthHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyCredentials, clearError } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, requiresTotp } = useAppSelector(state => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState('jenachinmaya51@gmail.com');
  const [password, setPassword] = useState('Chinmaya@6370');

  // Handle redirects on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else if (requiresTotp) {
      router.push('/verify-2fa');
    }
  }, [isAuthenticated, requiresTotp, router]);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    await dispatch(verifyCredentials({ email, password }));
  };

  return (
    <>
      <AuthHeader title="Welcome Back!" subtitle="Sign in to manage your files and folders." />

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div className="animate-item rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-3 shadow-sm shadow-red-500/5">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Email Input */}
        <div className="animate-item space-y-2.5">
          <label htmlFor="email" className="block text-sm font-bold text-slate-800 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              className={clsx(
                'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all duration-300',
                'focus:border-v8-primary focus:bg-white focus:ring-4 focus:ring-v8-primary/10',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              placeholder="name@example.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="animate-item space-y-2.5">
          <label htmlFor="password" className="block text-sm font-bold text-slate-800 ml-1">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              className={clsx(
                'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all duration-300',
                'focus:border-v8-primary focus:bg-white focus:ring-4 focus:ring-v8-primary/10',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-v8-primary hover:text-v8-indigo focus:outline-none bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="animate-item flex items-center justify-between px-1">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setRememberMe(!rememberMe)}
          >
            <div
              className={clsx(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                rememberMe ? 'bg-v8-primary' : 'bg-slate-200'
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                  rememberMe ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
              Remember me
            </span>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-bold text-v8-primary hover:text-v8-indigo transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="animate-item pt-4">
          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="w-full py-4.5 text-base font-black shadow-xl shadow-v8-primary/25 hover:shadow-v8-primary/40 translate-y-0 hover:-translate-y-1 active:translate-y-0"
          >
            Sign In to Dashboard
          </Button>
        </div>
      </form>

      {/* Footer Text */}
      <div className="animate-item mt-10 text-center lg:text-left">
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          By logging in, you agree to our{' '}
          <a href="#" className="font-bold text-v8-primary hover:underline underline-offset-4">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-bold text-v8-primary hover:underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </>
  );
}
