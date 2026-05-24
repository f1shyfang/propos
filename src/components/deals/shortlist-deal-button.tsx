'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { createDealViaApi, fetchDealForBriefProperty } from '@/lib/create-deal-client';

export function ShortlistDealButton({
  briefId,
  propertyId,
  feedbackStatus,
  size = 'sm',
}: {
  briefId: number;
  propertyId: string;
  feedbackStatus?: string;
  size?: 'sm' | 'default';
}) {
  const router = useRouter();
  const [dealId, setDealId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchDealForBriefProperty(briefId, propertyId).then((d) => setDealId(d?.id ?? null));
  }, [briefId, propertyId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (dealId) {
      router.push(`/deals/${dealId}`);
      return;
    }
    setBusy(true);
    const result = await createDealViaApi({
      briefId,
      propertyId,
      fromInterestedFeedback: feedbackStatus === 'interested',
    });
    setBusy(false);
    if (result.ok) {
      setDealId(result.dealId);
      router.push(`/deals/${result.dealId}`);
    }
  }

  if (feedbackStatus !== 'interested' && !dealId) return null;

  const cls = size === 'sm' ? 'pg-btn pg-btn-sm' : 'pg-btn';

  return (
    <button
      type="button"
      className={cls}
      disabled={busy}
      onClick={handleClick}
    >
      <Icon name="pipeline" size={12} />
      {busy ? '…' : dealId ? 'View deal' : 'Create deal'}
    </button>
  );
}
