import type { APIRequestContext } from '@playwright/test';

export const DEMO_CLIENT_EMAIL = 'sarah@demo.com';

export type BriefPayload = {
  clientName: string;
  email: string;
  phone?: string;
  preApprovalStatus: string;
  budgetMin: number;
  budgetMax: number;
  propertyTypes: string[];
  minBeds: number;
  minBaths: number;
  suburbs: string[];
  mustHaves: string[];
  dealBreakers: string[];
};

export function demoBriefPayload(suffix: string): BriefPayload {
  return {
    clientName: `Sarah & Tom E2E ${suffix}`,
    email: DEMO_CLIENT_EMAIL,
    phone: '0400000000',
    preApprovalStatus: 'Pre-Approved',
    budgetMin: 800_000,
    budgetMax: 1_100_000,
    propertyTypes: ['Apartment'],
    minBeds: 2,
    minBaths: 1,
    suburbs: ['Surry Hills', 'Newtown', 'Pyrmont'],
    mustHaves: ['balcony'],
    dealBreakers: ['ground floor'],
  };
}

async function json<T>(res: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok()) {
    throw new Error(
      `${res.status()} ${res.url()}: ${typeof body === 'object' && body && 'error' in body ? String((body as { error: string }).error) : JSON.stringify(body)}`,
    );
  }
  return body as T;
}

export async function createBrief(request: APIRequestContext, payload: BriefPayload) {
  const res = await request.post('/api/briefs', { data: payload });
  const data = await json<{ brief: { id: number; clientUserId: string | null } }>(res);
  return data.brief;
}

export async function fetchMatches(request: APIRequestContext, briefId: number) {
  const res = await request.get(`/api/briefs/${briefId}/matches?all=1`);
  const data = await json<{
    matches: Array<{ id: string; address: string; score: number }>;
    total: number;
  }>(res);
  return data;
}

export async function addToShortlist(
  request: APIRequestContext,
  briefId: number,
  propertyId: string,
) {
  const res = await request.post('/api/shortlists', {
    data: { briefId, propertyId },
  });
  if (res.status() === 409) {
    const briefRes = await request.get(`/api/briefs/${briefId}`);
    const brief = await json<{ shortlist: Array<{ shortlistId: number; property?: { id: string } }> }>(
      briefRes,
    );
    const row = brief.shortlist?.find((s) => s.property?.id === propertyId);
    if (!row) throw new Error('Shortlist conflict but row not found');
    return row.shortlistId;
  }
  const data = await json<{ shortlist: { id: number } }>(res);
  return data.shortlist.id;
}

export async function shareShortlist(
  request: APIRequestContext,
  briefId: number,
  shortlistIds: number[],
) {
  const res = await request.post('/api/shortlists/share', {
    data: { briefId, shortlistIds },
  });
  return json<{ sharedCount: number }>(res);
}

export async function submitFeedback(
  request: APIRequestContext,
  shortlistId: number,
  feedbackStatus: 'interested' | 'not_for_me',
  feedbackText?: string,
) {
  const res = await request.post('/api/feedback', {
    data: { shortlistId, feedbackStatus, feedbackText: feedbackText ?? null },
  });
  return json<{ shortlist: { feedbackStatus: string; feedbackText: string | null } }>(res);
}

export async function createDeal(
  request: APIRequestContext,
  briefId: number,
  propertyId: string,
  fromInterestedFeedback = true,
) {
  const res = await request.post('/api/deals', {
    data: { briefId, propertyId, fromInterestedFeedback },
  });
  if (res.status() === 409) {
    const body = await res.json();
    return { dealId: body.dealId as number, created: false };
  }
  const data = await json<{ deal: { id: number; status: string } }>(res);
  return { dealId: data.deal.id, created: true, status: data.deal.status };
}

export async function patchDeal(
  request: APIRequestContext,
  dealId: number,
  patch: Record<string, unknown>,
) {
  const res = await request.patch(`/api/deals/${dealId}`, { data: patch });
  return json<{ deal: Record<string, unknown> }>(res);
}

export async function fetchDeal(request: APIRequestContext, dealId: number) {
  const res = await request.get(`/api/deals/${dealId}`);
  return json<{
    deal: Record<string, unknown>;
    checklist: Array<{ id: number; title: string; status: string }>;
    milestones: Array<{ id: number; title: string; status: string }>;
    documents: unknown[];
  }>(res);
}

export async function completeChecklistItem(
  request: APIRequestContext,
  dealId: number,
  itemId: number,
) {
  const res = await request.patch(`/api/deals/${dealId}/checklist`, {
    data: { itemId, completed: true },
  });
  return json<{ item: { status: string } }>(res);
}

export async function fetchPortalShortlists(request: APIRequestContext) {
  const res = await request.get('/api/portal/shortlists');
  return json<{ items: Array<{ shortlistId: number; feedbackStatus: string }> }>(res);
}

export async function fetchDashboardFeedback(request: APIRequestContext) {
  const res = await request.get('/api/dashboard/feedback');
  return json<{
    rows: Array<{ shortlistId: number; feedbackStatus: string; feedbackText: string | null }>;
  }>(res);
}

export async function fetchCma(request: APIRequestContext, propertyId: string) {
  const res = await request.get(`/api/cma/${propertyId}`);
  if (res.status() === 404) return null;
  return json<{ comparables: unknown[]; estimatedValue: number | null }>(res);
}
