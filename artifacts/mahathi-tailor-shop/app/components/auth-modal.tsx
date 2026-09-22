'use client';

import React from 'react';
import Link from 'next/link';
import { X, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { isInsforgeConfigured, signInWithGoogle } from '../../lib/insforge';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectPath?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = 'Sign in required',
  message = 'Please sign in or create an account to perform this action.',
  redirectPath = '/account',
}: AuthModalProps) {
  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (!isInsforgeConfigured()) {
      alert('InsForge is not configured for this app.');
      return;
    }
    try {
      const target = typeof window !== 'undefined' ? `${window.location.origin}${redirectPath}` : undefined;
      await signInWithGoogle(target);
    } catch (err: any) {
      alert(`Could not start Google sign in: ${err?.message || 'Error'}`);
    }
  };

  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#faf8f5] p-6 shadow-2xl border border-[#e8e4df] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#77736f] transition-colors hover:bg-[#eae5dd] hover:text-[#171717]"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eee5d7] text-[#806728]">
            <Lock size={22} />
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-[#171717]">
            {title}
          </h3>
          <p className="mt-2 text-[12px] leading-5 text-[#696663]">
            {message}
          </p>

          <div className="mt-6 w-full space-y-3">
            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#ddd8d1] bg-white text-[12px] font-bold text-[#2d2b29] shadow-xs transition-colors hover:border-[#b8b3ac] hover:bg-[#f7f5f2]"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-2 flex items-center justify-center">
              <div className="w-full border-t border-[#e8e4df]" />
              <span className="absolute bg-[#faf8f5] px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8c8883]">
                or email
              </span>
            </div>

            {/* Email Log in */}
            <Link
              href={loginUrl}
              onClick={onClose}
              className="gradient-ink flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-bold text-white shadow-xs transition-opacity hover:opacity-95"
            >
              <LogIn size={15} />
              Sign in with Email
            </Link>

            {/* Register */}
            <Link
              href={registerUrl}
              onClick={onClose}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#ddd8d1] bg-transparent text-[11px] font-bold text-[#494643] transition-colors hover:border-[#4f6bff] hover:text-[#4f6bff]"
            >
              <UserPlus size={14} />
              Create a new account
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 text-[11px] font-medium text-[#8a8580] hover:underline"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
}
