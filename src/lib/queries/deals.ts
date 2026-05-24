import { fetchJson } from '@/lib/api/fetch-json';

export type PipelineDeal = {
  id: number;
  status: string;
  offerSubState: string | null;
  offerAmount: number | null;
  priority: string;
  isAuction: boolean;
  exchangeDate: string | null;
  settlementDate: string | null;
  clientName: string | null;
  propertyId: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  price: number | null;
  priceDisplay: string | null;
  overallScore: number | null;
  createdAt: string;
};

export function fetchDeals() {
  return fetchJson<{ deals: PipelineDeal[] }>('/api/deals');
}

export type CreateDealInput = {
  briefId: string;
  propertyId: string;
  priority: string;
  isAuction: boolean;
  strategyNotes: string;
};

export async function createDeal(input: CreateDealInput) {
  const res = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409 && body.dealId) {
    return { ok: true as const, dealId: body.dealId as number };
  }
  if (!res.ok) {
    throw new Error(body.error ?? 'Could not create deal');
  }
  return { ok: true as const, deal: body.deal };
}

export async function patchDealStatus(dealId: number, status: string) {
  const res = await fetch(`/api/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Could not update deal status');
  }
  return true;
}
