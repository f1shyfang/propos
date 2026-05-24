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
