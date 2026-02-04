'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import AuthHeader from './AuthHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { forgotPassword, clearError } from '@/store/slices/authSlice';

export default function ForgotPasswordForm() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: any) => state.auth);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <AuthHeader
          title="Check your email"
          subtitle={`We sent a password reset link to ${email}`}
        />
        <div className="animate-item flex flex-col items-center space-y-8 text-center bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-green-50 text-green-600 shadow-lg shadow-green-500/10 border border-green-100 transform hover:rotate-12 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Didn't receive the email? Check your{' '}
            <span className="text-slate-900 font-bold">spam folder</span> or try another address.
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full rounded-2xl border-2 border-slate-200 py-4 text-base font-bold text-slate-700 transition-all hover:bg-white hover:border-v8-primary hover:text-v8-primary active:scale-[0.98]"
            >
              Try different email
            </button>

            <Link
              href="/login"
              className="block text-sm font-bold text-v8-primary hover:text-v8-indigo transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeader
        title="Forgot Password?"
        subtitle="Don't worry, it happens. Enter your email and we'll send you reset instructions."
      />

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div className="animate-item rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
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
              required
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

        {/* Submit Button */}
        <div className="animate-item pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              'w-full rounded-2xl bg-v8-primary py-[1.125rem] text-base font-black text-white shadow-xl shadow-v8-primary/25 transition-all duration-300',
              'hover:bg-v8-indigo hover:shadow-v8-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]',
              'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending Link...
              </span>
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </div>

        <div className="animate-item text-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-v8-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 transition-transform group-hover:-translate-x-1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Login Screen
          </Link>
        </div>
      </form>
    </>
  );
}
