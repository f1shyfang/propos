'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Logo } from '@/components/shared/logo';
import { authClient } from '@/lib/auth-client';

function AgentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const { error: signInError } = await authClient.signIn.email({ email, password });
    if (signInError) {
      setError(signInError.message ?? 'Sign in failed.');
      setPending(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Link href="/" className="no-underline" aria-label="PropOS home">
        <Logo />
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Agent sign in</h1>
        <p className="text-sm text-gray-500">Sign in to upload documents, manage deals, and run your pipeline.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue="agent@demo.com"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Demo password: <code>demo12345</code> (after running <code>pnpm seed:demo</code>)
      </p>
      <p className="text-sm text-gray-600">
        No account?{' '}
        <Link href="/signup" className="underline">
          Create one
        </Link>
        {' · '}
        <Link href="/portal/login" className="underline">
          Client portal
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Loading…</div>}>
      <AgentLoginForm />
    </Suspense>
  );
}
