'use client';

import { useRouter, usePathname } from 'next/navigation';

interface Brief { id: number; clientName: string }

interface BriefSelectorProps {
  briefs: Brief[];
  currentBriefId?: number;
}

export function BriefSelector({ briefs, currentBriefId }: BriefSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val ? `${pathname}?briefId=${val}` : pathname);
  }

  return (
    <select
      value={currentBriefId ?? ''}
      onChange={handleChange}
      style={{
        padding: '5px 10px',
        border: '1px solid var(--pg-border)',
        borderRadius: 6,
        background: 'var(--pg-bg)',
        color: currentBriefId ? 'var(--pg-text)' : 'var(--pg-text-dim)',
        fontSize: 12,
        fontFamily: 'var(--pg-font-body)',
        cursor: 'pointer',
      }}
    >
      <option value="">Select client…</option>
      {briefs.map(b => (
        <option key={b.id} value={b.id}>{b.clientName}</option>
      ))}
    </select>
  );
}
