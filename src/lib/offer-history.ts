export type OfferSnapshot = {
  offerAmount: number | null;
  offerSubState: string | null;
};

export type OfferHistoryEntryInput = {
  eventType: 'sub_state' | 'amount';
  previousValue: string | null;
  newValue: string | null;
};

export function buildOfferHistoryEntries(
  previous: OfferSnapshot,
  patch: Partial<OfferSnapshot>,
): OfferHistoryEntryInput[] {
  const entries: OfferHistoryEntryInput[] = [];

  if (
    patch.offerSubState !== undefined &&
    patch.offerSubState !== previous.offerSubState
  ) {
    entries.push({
      eventType: 'sub_state',
      previousValue: previous.offerSubState,
      newValue: patch.offerSubState,
    });
  }

  if (patch.offerAmount !== undefined && patch.offerAmount !== previous.offerAmount) {
    entries.push({
      eventType: 'amount',
      previousValue:
        previous.offerAmount != null ? String(previous.offerAmount) : null,
      newValue: String(patch.offerAmount),
    });
  }

  return entries;
}

const SUB_STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  negotiating: 'Negotiating',
  counter_offer: 'Counter Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

function labelSubState(value: string | null): string {
  if (!value) return '—';
  return SUB_STATE_LABELS[value] ?? value.replace(/_/g, ' ');
}

function formatAmountShort(value: string | null): string {
  if (!value) return '—';
  const n = Number(value);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString('en-AU')}`;
}

export function formatOfferEventLabel(entry: OfferHistoryEntryInput): string {
  if (entry.eventType === 'sub_state') {
    return `Offer status: ${labelSubState(entry.previousValue)} → ${labelSubState(entry.newValue)}`;
  }
  const prev = entry.previousValue
    ? `$${Number(entry.previousValue).toLocaleString('en-AU')}`
    : '—';
  const next = entry.newValue
    ? `$${Number(entry.newValue).toLocaleString('en-AU')}`
    : '—';
  return `Offer amount: ${prev} → ${next}`;
}

/** Short label for pipeline cards and compact overview. */
export function formatOfferEventShort(entry: OfferHistoryEntryInput): string {
  if (entry.eventType === 'sub_state') {
    return `${labelSubState(entry.previousValue)} → ${labelSubState(entry.newValue)}`;
  }
  return `${formatAmountShort(entry.previousValue)} → ${formatAmountShort(entry.newValue)}`;
}

const MAX_RECENT_OFFER_EVENTS_PER_DEAL = 3;

export type OfferEventRecord = {
  id: number;
  dealId: number;
  eventType: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

export function groupRecentOfferEventsByDeal(
  rows: OfferEventRecord[],
  limitPerDeal = MAX_RECENT_OFFER_EVENTS_PER_DEAL,
): Record<number, Omit<OfferEventRecord, 'dealId'>[]> {
  const byDeal: Record<number, Omit<OfferEventRecord, 'dealId'>[]> = {};
  for (const row of rows) {
    const list = byDeal[row.dealId] ?? [];
    if (list.length >= limitPerDeal) continue;
    const { dealId: _dealId, ...rest } = row;
    list.push(rest);
    byDeal[row.dealId] = list;
  }
  return byDeal;
}
