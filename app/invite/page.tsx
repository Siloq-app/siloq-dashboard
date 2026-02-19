'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type InviteState =
  | { status: 'loading' }
  | { status: 'accepted'; siteName: string; role: string }
  | { status: 'already_member'; siteName: string }
  | { status: 'register'; email: string; token: string; siteName: string; invitedBy: string; role: string }
  | { status: 'error'; message: string };

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<InviteState>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Invalid invitation link — no token found.' });
      return;
    }

    const accept = async () => {
      try {
        const res = await fetch('/api/v1/team/invite/accept/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.status === 202 && data.action === 'register') {
          // User needs to create an account first
          setState({
            status: 'register',
            email: data.email,
            token,
            siteName: data.site_name,
            invitedBy: data.invited_by,
            role: data.role,
          });
          return;
        }

        if (res.ok && data.accepted) {
          if (data.already_had_access) {
            setState({ status: 'already_member', siteName: data.site?.name || 'the site' });
          } else {
            setState({ status: 'accepted', siteName: data.site?.name || 'the site', role: data.role });
          }
          return;
        }

        setState({ status: 'error', message: data.error || 'Something went wrong. The link may have expired.' });
      } catch {
        setState({ status: 'error', message: 'Unable to reach Siloq. Please try again.' });
      }
    };

    accept();
  }, [token]);

  if (state.status === 'loading') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-slate-600">Verifying your invitation…</p>
      </div>
    );
  }

  if (state.status === 'accepted') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">You&apos;re in!</h1>
        <p className="mb-6 text-slate-600">
          You now have <strong className="capitalize">{state.role}</strong> access to{' '}
          <strong>{state.siteName}</strong>.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  if (state.status === 'already_member') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
          👋
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Already a member</h1>
        <p className="mb-6 text-slate-600">
          You already have access to <strong>{state.siteName}</strong>.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  if (state.status === 'register') {
    const registerUrl = `/auth/register?invite=${encodeURIComponent(state.token)}&email=${encodeURIComponent(state.email)}`;
    const loginUrl = `/auth/login?invite=${encodeURIComponent(state.token)}`;
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl">
          🎉
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">You&apos;ve been invited!</h1>
        <p className="mb-1 text-slate-600">
          <strong>{state.invitedBy}</strong> invited you to join{' '}
          <strong>{state.siteName}</strong> as a{' '}
          <strong className="capitalize">{state.role}</strong>.
        </p>
        <p className="mb-6 text-sm text-slate-500">
          Invited as <strong>{state.email}</strong>
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={registerUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Create your account →
          </Link>
          <Link
            href={loginUrl}
            className="text-sm text-indigo-600 underline hover:text-indigo-800"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
        ❌
      </div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Invalid invitation</h1>
      <p className="mb-6 text-slate-600">{(state as { status: 'error'; message: string }).message}</p>
      <Link
        href="/auth/login"
        className="text-sm text-indigo-600 underline hover:text-indigo-800"
      >
        Go to login
      </Link>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-indigo-600">Siloq</h2>
        </div>
        <Suspense
          fallback={
            <div className="text-center text-slate-500">Loading…</div>
          }
        >
          <InviteContent />
        </Suspense>
      </div>
    </div>
  );
}
