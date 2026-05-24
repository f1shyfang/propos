'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/shared/icon';
import { authClient } from '@/lib/auth-client';

type Me = { name: string; email: string };

export function PortalHeader() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMe(data); })
      .catch(() => {});
  }, []);

  const initials = me?.name
    ? me.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '…';

  async function signOut() {
    await authClient.signOut();
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      padding: '18px 32px',
      borderBottom: '1px solid var(--pg-border)',
      display: 'flex', alignItems: 'center', gap: 20,
      background: 'var(--pg-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#1A1814', color: '#FAFAF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--pg-font-display)', fontWeight: 600, fontSize: 16,
        }}>B</div>
        <div>
          <div style={{ fontFamily: 'var(--pg-font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Bayside Buyer&apos;s</div>
          <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Your private property dashboard</div>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
        <Link href="/portal" style={{
          padding: '7px 12px', borderRadius: 7, fontSize: 13, fontWeight: 500,
          color: 'var(--pg-text)', background: 'var(--pg-bg-2)', textDecoration: 'none',
        }}>My properties</Link>
      </nav>

      <div style={{ flex: 1 }} />

      <button type="button" className="pg-btn pg-btn-sm pg-btn-ghost" onClick={signOut} style={{ color: 'var(--pg-text-dim)' }}>
        Sign out
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div className="pg-avatar pg-avatar-sm" style={{ background: '#E5B100', color: '#1A1814', border: 'none' }}>{initials}</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{me?.name ?? 'Loading…'}</div>
          <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{me?.email ?? ''}</div>
        </div>
      </div>
    </header>
  );
}
