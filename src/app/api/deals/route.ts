import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealsTable, buyerBriefsTable, propertiesTable, dealOfferEventsTable } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { groupRecentOfferEventsByDeal } from '@/lib/offer-history';
import {
  createDeal,
  findDealByBriefAndProperty,
  DealAlreadyExistsError,
} from '@/lib/deals';
import { logAction } from '@/lib/log-action';

const dealSelect = {
  id: dealsTable.id,
  status: dealsTable.status,
  offerSubState: dealsTable.offerSubState,
  offerAmount: dealsTable.offerAmount,
  priority: dealsTable.priority,
  isAuction: dealsTable.isAuction,
  listingAgentName: dealsTable.listingAgentName,
  exchangeDate: dealsTable.exchangeDate,
  settlementDate: dealsTable.settlementDate,
  createdAt: dealsTable.createdAt,
  briefId: dealsTable.briefId,
  clientName: buyerBriefsTable.clientName,
  propertyId: propertiesTable.id,
  address: propertiesTable.address,
  suburb: propertiesTable.suburb,
  state: propertiesTable.state,
  price: propertiesTable.price,
  priceDisplay: propertiesTable.priceDisplay,
  overallScore: propertiesTable.overallScore,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const briefId = searchParams.get('briefId');
  const propertyId = searchParams.get('propertyId');

  if (briefId && propertyId) {
    const deal = await findDealByBriefAndProperty(Number(briefId), propertyId);
    if (!deal) {
      return NextResponse.json({ deal: null });
    }
    const [row] = await db
      .select(dealSelect)
      .from(dealsTable)
      .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
      .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
      .where(eq(dealsTable.id, deal.id));
    return NextResponse.json({ deal: row ?? null });
  }

  const deals = await db
    .select(dealSelect)
    .from(dealsTable)
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .orderBy(desc(dealsTable.createdAt));

  const dealIds = deals.map((d) => d.id);
  const offerEventRows =
    dealIds.length > 0
      ? await db
          .select()
          .from(dealOfferEventsTable)
          .where(inArray(dealOfferEventsTable.dealId, dealIds))
          .orderBy(desc(dealOfferEventsTable.createdAt))
      : [];

  const recentByDeal = groupRecentOfferEventsByDeal(
    offerEventRows.map((event) => ({
      ...event,
      createdAt: event.createdAt ?? new Date(),
    })),
  );

  const dealsWithHistory = deals.map((deal) => ({
    ...deal,
    recentOfferEvents: (recentByDeal[deal.id] ?? []).map((ev) => ({
      ...ev,
      createdAt: ev.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  }));

  return NextResponse.json({ deals: dealsWithHistory });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    briefId,
    propertyId,
    priority,
    listingAgentName,
    listingAgentPhone,
    listingAgentEmail,
    strategyNotes,
    isAuction,
    initialStatus,
    fromInterestedFeedback,
  } = body;

  if (!briefId || !propertyId) {
    return NextResponse.json({ error: 'briefId and propertyId required' }, { status: 400 });
  }

  try {
    const { deal } = await createDeal({
      briefId: Number(briefId),
      propertyId: String(propertyId),
      priority,
      isAuction,
      listingAgentName,
      listingAgentPhone,
      listingAgentEmail,
      strategyNotes,
      initialStatus,
      fromInterestedFeedback,
    });

    logAction({
      userId: 'agent',
      actionType: 'brief_create',
      entityType: 'brief',
      entityId: String(deal.id),
      metadata: { type: 'deal' },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (err) {
    if (err instanceof DealAlreadyExistsError) {
      return NextResponse.json(
        { error: 'Deal already exists', dealId: err.existingDealId },
        { status: 409 },
      );
    }
    if (err instanceof Error && err.message === 'Property or brief not found') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
