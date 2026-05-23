import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealsTable, buyerBriefsTable, propertiesTable, dealChecklistItemsTable, dealMilestonesTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateDueDiligenceChecklist, generateSettlementMilestones } from '@/lib/deal-utils';
import { logAction } from '@/lib/log-action';

export async function GET() {
  const deals = await db
    .select({
      id: dealsTable.id,
      status: dealsTable.status,
      offerSubState: dealsTable.offerSubState,
      offerAmount: dealsTable.offerAmount,
      priority: dealsTable.priority,
      isAuction: dealsTable.isAuction,
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
    })
    .from(dealsTable)
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .orderBy(desc(dealsTable.createdAt));

  return NextResponse.json({ deals });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { briefId, propertyId, priority, listingAgentName, listingAgentPhone, listingAgentEmail, strategyNotes, isAuction } = body;

  if (!briefId || !propertyId) {
    return NextResponse.json({ error: 'briefId and propertyId required' }, { status: 400 });
  }

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, String(propertyId)));
  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, Number(briefId)));

  if (!property || !brief) {
    return NextResponse.json({ error: 'Property or brief not found' }, { status: 404 });
  }

  const [deal] = await db.insert(dealsTable).values({
    briefId: Number(briefId),
    propertyId: String(propertyId),
    status: 'suggested',
    priority: priority ?? 'standard',
    isAuction: isAuction ?? false,
    listingAgentName: listingAgentName ?? null,
    listingAgentPhone: listingAgentPhone ?? null,
    listingAgentEmail: listingAgentEmail ?? null,
    strategyNotes: strategyNotes ?? null,
  }).returning();

  // Auto-generate DD checklist
  const checklistItems = generateDueDiligenceChecklist(property.propertyType ?? 'House', property.state ?? 'NSW');
  if (checklistItems.length) {
    await db.insert(dealChecklistItemsTable).values(
      checklistItems.map(item => ({
        dealId: deal.id,
        title: item.title,
        assignee: item.assignee,
        dayOffset: item.dayOffset,
        status: 'pending' as const,
      }))
    );
  }

  logAction({ userId: 'agent', actionType: 'brief_create', entityType: 'brief', entityId: String(deal.id), metadata: { type: 'deal' } });

  return NextResponse.json({ deal }, { status: 201 });
}
