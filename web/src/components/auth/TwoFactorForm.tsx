'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AuthHeader from './AuthHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyTotp, clearError } from '@/store/slices/authSlice';

export default function TwoFactorForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, tempToken } = useAppSelector(
    (state: any) => state.auth
  );

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else if (!tempToken) {
      router.push('/login');
    }
  }, [isAuthenticated, tempToken, router]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6 || !tempToken) return;
    await dispatch(verifyTotp({ totpCode: code, tempToken }));
  };

  return (
    <>
      <AuthHeader
        title="Verify Identity"
        subtitle="Almost there! Enter the 6-digit verification code from your authenticator app to continue."
      />

      <form className="space-y-10" onSubmit={handleSubmit}>
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

        {/* OTP Inputs */}
        <div className="animate-item flex justify-between gap-3">
          {otp.map((data, index) => {
            return (
              <input
                className={clsx(
                  'h-16 w-full rounded-2xl border-2 text-center text-2xl font-black bg-slate-50 outline-none transition-all duration-300',
                  'focus:border-v8-primary focus:bg-white focus:ring-4 focus:ring-v8-primary/10',
                  data
                    ? 'border-v8-primary bg-purple-50/50 text-v8-primary'
                    : 'border-slate-200 text-slate-900',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                type="text"
                name="otp"
                maxLength={1}
                key={index}
                disabled={isLoading}
                value={data}
                ref={el => {
                  inputRefs.current[index] = el;
                }}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onFocus={e => e.target.select()}
              />
            );
          })}
        </div>

        {/* Verify Button */}
        <div className="animate-item">
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
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
                Verifying Access...
              </span>
            ) : (
              'Securely Sign In'
            )}
          </button>
        </div>

        <div className="animate-item space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">
              Problems with the code?{' '}
              <button
                type="button"
                className="font-bold text-v8-primary hover:text-v8-indigo hover:underline underline-offset-4"
              >
                Try an alternative method
              </button>
            </p>
          </div>

          <div className="text-center">
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
              Go Back to Login
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
