import { test, expect } from '@playwright/test';
import {
  addToShortlist,
  completeChecklistItem,
  createBrief,
  createDeal,
  demoBriefPayload,
  fetchCma,
  fetchDashboardFeedback,
  fetchDeal,
  fetchMatches,
  fetchOfferEvents,
  fetchPortalShortlists,
  logPropertyOutreach,
  patchDeal,
  shareShortlist,
  submitFeedback,
  DEMO_CLIENT_EMAIL,
} from './helpers/demo-api';
import { writeDemoIds } from './helpers/demo-ids';

/**
 * End-to-end demo lifecycle (presenter script phases 1–11, API-backed).
 *
 * Prerequisites:
 *   - DATABASE_URL in .env.local with properties populated (see scripts/populate.ts)
 *   - pnpm seed:demo  (links sarah@demo.com client to briefs for share + portal)
 *
 * Run:  pnpm test:e2e
 */
test.describe('Buyer agent demo flow', () => {
  test.describe.configure({ mode: 'serial' });

  const runId = Date.now().toString(36);
  let briefId: number;
  let leadPropertyId: string;
  let leadShortlistId: number;
  let secondShortlistId: number | undefined;
  let dealId: number;

  test('phase 1 — create brief', async ({ request }) => {
    const brief = await createBrief(request, demoBriefPayload(runId));
    briefId = brief.id;
    expect(briefId).toBeGreaterThan(0);
    expect(brief.clientUserId, `Link client with: pnpm seed:demo (${DEMO_CLIENT_EMAIL})`).toBeTruthy();
  });

  test('phase 2 — legacy /matches redirects to tab=matches', async ({ request }) => {
    const res = await request.get(`/briefs/${briefId}/matches`, { maxRedirects: 0 });
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    const location = res.headers()['location'] ?? '';
    expect(location).toContain(`tab=matches`);
  });

  test('phase 2 — scored matches for brief', async ({ request }) => {
    const { matches, total } = await fetchMatches(request, briefId);
    expect(total, 'No properties in DB — run populate script first').toBeGreaterThan(0);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThan(0);
    leadPropertyId = matches[0].id;
  });

  test('phase 3 — CMA comparables for lead property', async ({ request }) => {
    const cma = await fetchCma(request, leadPropertyId);
    test.skip(!cma, 'No CMA seed for lead property — run: pnpm seed:cma');
    expect(cma!.comparables.length).toBeGreaterThanOrEqual(1);
    expect(cma!.estimatedValue).toBeTruthy();
  });

  test('phases 5–6 — shortlist, share, client feedback', async ({ request }) => {
    leadShortlistId = await addToShortlist(request, briefId, leadPropertyId);
    const share = await shareShortlist(request, briefId, [leadShortlistId]);
    expect(share.sharedCount).toBe(1);

    const portalBefore = await fetchPortalShortlists(request);
    expect(portalBefore.items.some((i) => i.shortlistId === leadShortlistId)).toBe(true);

    await submitFeedback(
      request,
      leadShortlistId,
      'interested',
      'Love the balcony - inspect weekend?',
    );

    const { matches } = await fetchMatches(request, briefId);
    if (matches.length > 1) {
      const secondId = matches[1].id;
      secondShortlistId = await addToShortlist(request, briefId, secondId);
      await shareShortlist(request, briefId, [secondShortlistId]);
      await submitFeedback(request, secondShortlistId, 'not_for_me');
    }

    const dashboard = await fetchDashboardFeedback(request);
    const leadRow = dashboard.rows.find((r) => r.shortlistId === leadShortlistId);
    expect(leadRow?.feedbackStatus).toBe('interested');
    expect(leadRow?.feedbackText).toContain('balcony');
  });

  test('phase 7 — create deal and offer details', async ({ request }) => {
    const { dealId: id, status } = await createDeal(request, briefId, leadPropertyId, true);
    dealId = id;
    expect(status).toBe('approved');

    await patchDeal(request, dealId, {
      offerAmount: 950_000,
      offerSubState: 'sent',
      offerConditions: ['Subject to finance', 'Subject to building & pest'],
    });

    const { deal } = await fetchDeal(request, dealId);
    expect(deal.offerAmount).toBe(950_000);
    expect(deal.offerSubState).toBe('sent');
  });

  test('phase 4 — property outreach logged', async ({ request }) => {
    const outreach = await logPropertyOutreach(request, leadPropertyId, briefId);
    expect(outreach.outreach.templateId).toBe('intro_anonymised');
  });

  test('phase 8 — negotiation sub-states and offer history', async ({ request }) => {
    await patchDeal(request, dealId, { offerSubState: 'counter_offer' });
    await patchDeal(request, dealId, {
      offerSubState: 'accepted',
      strategyNotes: 'Vendor counter $965k — client approved $950k firm',
    });
    const { deal } = await fetchDeal(request, dealId);
    expect(deal.offerSubState).toBe('accepted');

    const { events } = await fetchOfferEvents(request, dealId);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.some((e) => e.newValue === 'counter_offer')).toBe(true);
    expect(events.some((e) => e.newValue === 'accepted')).toBe(true);
  });

  test('phases 9–11 — under contract, due diligence, settlement milestones', async ({
    request,
  }) => {
    await patchDeal(request, dealId, { status: 'due_diligence' });
    await patchDeal(request, dealId, { status: 'offer_made' });

    const exchange = new Date();
    const settlement = new Date();
    settlement.setDate(settlement.getDate() + 42);

    await patchDeal(request, dealId, {
      status: 'under_contract',
      exchangeDate: exchange.toISOString().slice(0, 10),
      settlementDate: settlement.toISOString().slice(0, 10),
    });

    const afterContract = await fetchDeal(request, dealId);
    expect(afterContract.deal.status).toBe('under_contract');
    expect(afterContract.milestones.length).toBeGreaterThan(0);

    const buildingItem = afterContract.checklist.find((i) =>
      i.title.toLowerCase().includes('building inspection'),
    );
    expect(buildingItem).toBeTruthy();
    await completeChecklistItem(request, dealId, buildingItem!.id);

    const financeItem = afterContract.checklist.find((i) =>
      i.title.toLowerCase().includes('finance'),
    );
    if (financeItem) {
      await completeChecklistItem(request, dealId, financeItem.id);
    }

    const afterDd = await fetchDeal(request, dealId);
    const completed = afterDd.checklist.filter((i) => i.status === 'completed').length;
    expect(completed).toBeGreaterThanOrEqual(1);

    await patchDeal(request, dealId, { status: 'unconditional' });
    const afterUnconditional = await fetchDeal(request, dealId);
    expect(afterUnconditional.deal.status).toBe('unconditional');
  });

  test('expose ids for optional UI smoke run', async ({}, testInfo) => {
    const ids = {
      DEMO_E2E_BRIEF_ID: String(briefId),
      DEMO_E2E_PROPERTY_ID: leadPropertyId,
      DEMO_E2E_DEAL_ID: String(dealId),
    };
    writeDemoIds(ids);
    await testInfo.attach('demo-ids', {
      body: JSON.stringify(ids),
      contentType: 'application/json',
    });
  });
});
