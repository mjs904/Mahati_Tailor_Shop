'use client';

import { LogOut, LoaderCircle, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentSession,
  getInsforgeErrorMessage,
  isInsforgeConfigured,
  logoutUser,
  onAuthStateChange,
} from '../../lib/insforge';

type CurrentUser = Awaited<ReturnType<typeof getCurrentSession>>['user'];

export default function AccountContent() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!isInsforgeConfigured()) {
        if (mounted) {
          setError(
            'InsForge is not configured for this app. Please add the required environment variables.',
          );
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getCurrentSession();
        if (!mounted) return;
        if (result.error) {
          setError(
            getInsforgeErrorMessage(
              result.error,
              "We couldn't verify your session. Please try again.",
            ),
          );
          setLoading(false);
          return;
        }
        if (!result.user) {
          router.replace('/login');
          return;
        }
        setUser(result.user);
        setError('');
        setLoading(false);
      } catch (sessionError) {
        if (!mounted) return;
        setError(
          getInsforgeErrorMessage(
            sessionError,
            "We couldn't verify your session. Please try again.",
          ),
        );
        setLoading(false);
      }
    };

    void loadUser();
    const unsubscribe = isInsforgeConfigured()
      ? onAuthStateChange(() => {
          void loadUser();
        })
      : undefined;

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [router]);

  const logout = async () => {
    setPending(true);
    setError('');
    try {
      const result = await logoutUser();
      if (result.error) {
        setError(
          getInsforgeErrorMessage(
            result.error,
            "We couldn't log you out. Please try again.",
          ),
        );
        return;
      }
      router.replace('/login');
      router.refresh();
    } catch (logoutError) {
      setError(
        getInsforgeErrorMessage(
          logoutError,
          "We couldn't log you out. Please try again.",
        ),
      );
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoaderCircle size={22} className="animate-spin text-[#4f6bff]" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-2xl border border-[#f1c9c9] bg-[#fff5f5] p-6 text-center">
        <p role="alert" className="text-[12px] leading-5 text-[#a64242]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="mt-4 text-[11px] font-bold text-[#4f6bff]"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_14px_40px_rgba(23,23,23,.06)] sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#171717] text-[#d4af37]">
          <UserRound size={20} />
        </span>
        <div>
          <p className="font-label text-[9px] uppercase tracking-[.16em] text-[#4f6bff]">
            Your Mahathi account
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">
            Welcome{user?.profile?.name ? `, ${user.profile.name}` : ' back'}
          </h1>
          <p className="mt-2 text-[12px] text-[#696663]">{user?.email}</p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-[#f1c9c9] bg-[#fff5f5] px-3.5 py-3 text-[11px] leading-5 text-[#a64242]"
        >
          {error}
        </p>
      )}

      <div className="mt-8 border-t border-[#e8e4df] pt-5">
        <p className="text-[12px] leading-5 text-[#77736f]">
          Your account is ready. Saved wishlist, orders, measurements, and
          tailoring details will appear here as those Mahathi features are
          connected.
        </p>
        <button
          type="button"
          onClick={logout}
          disabled={pending}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-[#ddd8d1] px-4 text-[11px] font-bold text-[#494643] transition-colors hover:border-[#4f6bff] hover:text-[#4f6bff] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <LogOut size={14} />
          )}
          {pending ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </div>
  );
}