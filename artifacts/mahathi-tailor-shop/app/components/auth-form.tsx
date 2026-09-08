'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProfile,
  getInsforgeErrorMessage,
  isInsforgeConfigured,
  loginUser,
  logoutUser,
  registerUser,
  resendUserVerificationEmail,
  verifyUserEmail,
} from '../../lib/insforge';

type AuthMode = 'login' | 'register';
type RegisterStep = 'details' | 'verification';
type PendingAction = 'create' | 'verify' | 'resend' | null;

type FormValues = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

type FormStatus = {
  tone: 'error' | 'success';
  message: string;
};

const emptyValues: FormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [values, setValues] = useState(emptyValues);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const verificationStep = isRegister && registerStep === 'verification';
  const pending = pendingAction !== null;

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (status) {
      setStatus(null);
    }
  };

  const verifyRegistration = async () => {
    const email = values.email.trim().toLowerCase();
    const otp = verificationCode.trim();

    if (!isInsforgeConfigured()) {
      setStatus({
        tone: 'error',
        message:
          'InsForge is not configured for this app. Please add the required environment variables.',
      });
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setStatus({
        tone: 'error',
        message: 'Please enter the 6-digit verification code from your email.',
      });
      return;
    }

    setPendingAction('verify');
    try {
      const result = await verifyUserEmail({ email, otp });

      if (result.error) {
        setStatus({
          tone: 'error',
          message: getInsforgeErrorMessage(
            result.error,
            'That verification code is invalid or expired. Request a new code and try again.',
          ),
        });
        return;
      }

      const userId = result.data?.user?.id;
      if (!userId) {
        setStatus({
          tone: 'error',
          message:
            'Your email could not be verified yet. Please check the code and try again.',
        });
        return;
      }

      const profileResult = await createProfile({
        id: userId,
        name: values.name.trim(),
        email,
        phone: values.phone.trim(),
      });

      if (profileResult.error) {
        void logoutUser().catch(() => undefined);
        setStatus({
          tone: 'error',
          message:
            "Your email was verified, but we couldn't finish setting up your profile. Please try again.",
        });
        return;
      }

      setVerificationCode('');
      setRegistrationComplete(true);
      setStatus({
        tone: 'success',
        message:
          'Account creation successful. Your email has been verified and your profile is ready.',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: getInsforgeErrorMessage(
          error,
          'We could not finish creating your account. Please try again.',
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const resendVerificationCode = async () => {
    const email = values.email.trim().toLowerCase();

    if (!isInsforgeConfigured()) {
      setStatus({
        tone: 'error',
        message:
          'InsForge is not configured for this app. Please add the required environment variables.',
      });
      return;
    }
    if (!email) {
      setStatus({ tone: 'error', message: 'Please enter your email address.' });
      return;
    }

    setPendingAction('resend');
    try {
      const result = await resendUserVerificationEmail({ email });

      if (result.error) {
        setStatus({
          tone: 'error',
          message: getInsforgeErrorMessage(
            result.error,
            'We could not send a new verification code. Please try again.',
          ),
        });
        return;
      }

      setStatus({
        tone: 'success',
        message: 'A new verification code has been sent to your email.',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: getInsforgeErrorMessage(
          error,
          'We could not send a new verification code. Please try again.',
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (verificationStep) {
      await verifyRegistration();
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const phone = values.phone.trim();

    if (!isInsforgeConfigured()) {
      setStatus({
        tone: 'error',
        message:
          'InsForge is not configured for this app. Please add the required environment variables.',
      });
      return;
    }
    if (isRegister && name.length < 2) {
      setStatus({ tone: 'error', message: 'Please enter your name.' });
      return;
    }
    if (!email) {
      setStatus({ tone: 'error', message: 'Please enter your email address.' });
      return;
    }
    if (values.password.length < 8) {
      setStatus({
        tone: 'error',
        message: 'Your password must be at least 8 characters.',
      });
      return;
    }
    if (isRegister && !phone) {
      setStatus({ tone: 'error', message: 'Please enter your phone number.' });
      return;
    }

    setPendingAction(isRegister ? 'create' : 'verify');
    try {
      if (isRegister) {
        const result = await registerUser({
          email,
          password: values.password,
          name,
        });

        if (result.error) {
          setStatus({
            tone: 'error',
            message: getInsforgeErrorMessage(
              result.error,
              "We couldn't create your account. Please try again.",
            ),
          });
          return;
        }

        setRegisterStep('verification');
        setVerificationCode('');
        setStatus({
          tone: 'success',
          message:
            'Account created successfully. Enter the 6-digit verification code sent to your email to finish setup.',
        });
        return;
      }

      const result = await loginUser({
        email,
        password: values.password,
      });

      if (result.error) {
        setStatus({
          tone: 'error',
          message: getInsforgeErrorMessage(
            result.error,
            "We couldn't log you in. Please check your details and try again.",
          ),
        });
        return;
      }

      router.replace('/account');
      router.refresh();
    } catch (error) {
      setStatus({
        tone: 'error',
        message: getInsforgeErrorMessage(
          error,
          isRegister
            ? "We couldn't create your account. Please try again."
            : "We couldn't log you in. Please try again.",
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const continueToAccount = () => {
    router.replace('/account');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {status && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[11px] leading-5 ${
            status.tone === 'error'
              ? 'border-[#f1c9c9] bg-[#fff5f5] text-[#a64242]'
              : 'border-[#c9e6d2] bg-[#f3fbf5] text-[#347148]'
          }`}
        >
          {status.tone === 'success' && (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {registrationComplete ? (
        <button
          type="button"
          onClick={continueToAccount}
          className="gradient-ink inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Continue to your account
          <ArrowRight size={14} />
        </button>
      ) : verificationStep ? (
        <>
          <div className="rounded-lg border border-[#e5ded6] bg-[#fffaf6] px-4 py-3 text-[11px] leading-5 text-[#696663]">
            Verification code sent to{' '}
            <strong className="text-[#292725]">{values.email}</strong>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
              Verification code
            </span>
            <input
              inputMode="numeric"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(
                  event.target.value.replace(/\D/g, '').slice(0, 6),
                )
              }
              className="h-12 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-center text-lg font-bold tracking-[.35em] outline-none transition-colors placeholder:text-[#aaa5a0] focus:border-[#4f6bff]"
              placeholder="000000"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              disabled={pending}
              required
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="gradient-ink inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {pendingAction === 'verify' ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Verifying email...
              </>
            ) : (
              <>
                Finish account creation
                <CheckCircle2 size={14} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resendVerificationCode}
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#ddd8d1] text-[11px] font-bold text-[#494643] transition-colors hover:border-[#4f6bff] hover:text-[#4f6bff] disabled:cursor-wait disabled:opacity-60"
          >
            {pendingAction === 'resend' ? (
              <>
                <LoaderCircle size={14} className="mr-2 animate-spin" />
                Sending new code...
              </>
            ) : (
              'Resend verification code'
            )}
          </button>
        </>
      ) : (
        <>
          {isRegister && (
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                Name
              </span>
              <input
                value={values.name}
                onChange={(event) => updateValue('name', event.target.value)}
                className="h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none transition-colors placeholder:text-[#aaa5a0] focus:border-[#4f6bff]"
                placeholder="Your full name"
                autoComplete="name"
                disabled={pending}
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
              Email
            </span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
              className="h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none transition-colors placeholder:text-[#aaa5a0] focus:border-[#4f6bff]"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={pending}
              required
            />
          </label>

          {isRegister && (
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                Phone
              </span>
              <input
                type="tel"
                value={values.phone}
                onChange={(event) => updateValue('phone', event.target.value)}
                className="h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none transition-colors placeholder:text-[#aaa5a0] focus:border-[#4f6bff]"
                placeholder="+91 90000 1998"
                autoComplete="tel"
                disabled={pending}
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
              Password
            </span>
            <input
              type="password"
              value={values.password}
              onChange={(event) => updateValue('password', event.target.value)}
              className="h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none transition-colors placeholder:text-[#aaa5a0] focus:border-[#4f6bff]"
              placeholder="At least 8 characters"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              disabled={pending}
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="gradient-ink inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                {isRegister ? 'Creating account...' : 'Logging in...'}
              </>
            ) : (
              <>
                {isRegister ? 'Create account' : 'Log in'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </>
      )}

      {!registrationComplete && (
        <p className="pt-1 text-center text-[11px] text-[#77736f]">
          {isRegister ? 'Already have an account?' : 'New to Mahathi?'}{' '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-bold text-[#4f6bff] hover:text-[#d600c7]"
          >
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      )}
    </form>
  );
}