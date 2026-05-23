'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export function PropertySearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`/properties?${params.toString()}`);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    router.push('/properties');
  }

  return (
    <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--pg-surface)', border: '1px solid var(--pg-border-strong)', borderRadius: 8 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--pg-text-dim)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search suburb, address…"
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--pg-text)' }}
      />
      {defaultValue && (
        <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--pg-text-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
}
