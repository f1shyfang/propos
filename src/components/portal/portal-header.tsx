'use client';

import { useEffect, useState } from 'react';

type Me = { name: string };

export function PortalHeader() {
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

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      borderBottom: '1px solid var(--pg-border)',
      background: 'var(--pg-bg)',
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto', width: '100%',
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', gap: 20,
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

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="pg-avatar pg-avatar-sm" style={{ background: '#E5B100', color: '#1A1814', border: 'none' }}>{initials}</div>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{me?.name ?? 'Loading…'}</div>
        </div>
      </div>
    </header>
  );
}
