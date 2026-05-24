export type CreateDealResult =
  | { ok: true; dealId: number; created: true }
  | { ok: true; dealId: number; created: false; existing: true }
  | { ok: false; error: string };

export type CreateDealOptions = {
  briefId: number;
  propertyId: string;
  fromInterestedFeedback?: boolean;
  initialStatus?: string;
  priority?: string;
  isAuction?: boolean;
  strategyNotes?: string;
};

export async function createDealViaApi(options: CreateDealOptions): Promise<CreateDealResult> {
  const res = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  const body = await res.json().catch(() => ({}));

  if (res.status === 409 && body.dealId) {
    return { ok: true, dealId: body.dealId, created: false, existing: true };
  }

  if (!res.ok) {
    return { ok: false, error: body.error ?? 'Could not create deal' };
  }

  return { ok: true, dealId: body.deal.id, created: true };
}

export async function fetchDealForBriefProperty(
  briefId: number,
  propertyId: string,
): Promise<{ id: number } | null> {
  const res = await fetch(
    `/api/deals?briefId=${briefId}&propertyId=${encodeURIComponent(propertyId)}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.deal?.id ? { id: data.deal.id } : null;
}

export async function patchDealStatus(dealId: number, status: string): Promise<boolean> {
  const res = await fetch(`/api/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.ok;
}
