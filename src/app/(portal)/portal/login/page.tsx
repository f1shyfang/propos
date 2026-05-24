'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

import { authClient } from '@/lib/auth-client';

function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/portal';
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

    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const me = await meRes.json();
      if (me.role === 'agent') {
        router.push('/dashboard');
        router.refresh();
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: '#1A1814', color: '#FAFAF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--pg-font-display)', fontWeight: 600, fontSize: 18, marginBottom: 16,
        }}>B</div>
        <h1 className="pg-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Client portal</h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--pg-text-dim)' }}>
          Sign in to review properties your agent has shared with you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="pg-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          Email
          <input name="email" type="email" required autoComplete="email" className="pg-input" defaultValue="sarah@demo.com" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          Password
          <input name="password" type="password" required autoComplete="current-password" className="pg-input" />
        </label>
        {error ? <p style={{ fontSize: 13, color: 'var(--pg-red)', margin: 0 }}>{error}</p> : null}
        <button type="submit" disabled={pending} className="pg-btn pg-btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--pg-text-dim)' }}>
        Are you an agent? <Link href="/login" style={{ color: 'var(--pg-text)' }}>Agent sign in</Link>
      </p>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--pg-text-dim)' }}>Loading…</div>}>
      <PortalLoginForm />
    </Suspense>
  );
}
