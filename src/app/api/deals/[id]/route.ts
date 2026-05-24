import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  dealsTable,
  buyerBriefsTable,
  propertiesTable,
  dealChecklistItemsTable,
  dealMilestonesTable,
  dealContactsTable,
  dealDocumentsTable,
  dealOfferEventsTable,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSettlementMilestones } from '@/lib/deal-utils';
import { validateStatusTransition } from '@/lib/deals';
import { buildOfferHistoryEntries } from '@/lib/offer-history';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);

  const [deal] = await db
    .select({
      id: dealsTable.id,
      status: dealsTable.status,
      offerSubState: dealsTable.offerSubState,
      offerAmount: dealsTable.offerAmount,
      offerConditions: dealsTable.offerConditions,
      priority: dealsTable.priority,
      isAuction: dealsTable.isAuction,
      exchangeDate: dealsTable.exchangeDate,
      settlementDate: dealsTable.settlementDate,
      listingAgentName: dealsTable.listingAgentName,
      listingAgentPhone: dealsTable.listingAgentPhone,
      listingAgentEmail: dealsTable.listingAgentEmail,
      strategyNotes: dealsTable.strategyNotes,
      createdAt: dealsTable.createdAt,
      briefId: buyerBriefsTable.id,
      clientName: buyerBriefsTable.clientName,
      clientEmail: buyerBriefsTable.email,
      budgetMax: buyerBriefsTable.budgetMax,
      purchasePurpose: buyerBriefsTable.purchasePurpose,
      propertyId: propertiesTable.id,
      address: propertiesTable.address,
      suburb: propertiesTable.suburb,
      state: propertiesTable.state,
      propertyType: propertiesTable.propertyType,
      bedrooms: propertiesTable.bedrooms,
      bathrooms: propertiesTable.bathrooms,
      parkingSpaces: propertiesTable.parkingSpaces,
      landSize: propertiesTable.landSize,
      price: propertiesTable.price,
      priceDisplay: propertiesTable.priceDisplay,
      overallScore: propertiesTable.overallScore,
      appraisedValue: propertiesTable.appraisedValue,
      grossYield: propertiesTable.grossYield,
      latitude: propertiesTable.latitude,
      longitude: propertiesTable.longitude,
    })
    .from(dealsTable)
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .where(eq(dealsTable.id, dealId));

  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const [checklist, milestones, contacts, documents] = await Promise.all([
    db.select().from(dealChecklistItemsTable).where(eq(dealChecklistItemsTable.dealId, dealId)),
    db.select().from(dealMilestonesTable).where(eq(dealMilestonesTable.dealId, dealId)),
    db.select().from(dealContactsTable).where(eq(dealContactsTable.dealId, dealId)),
    db.select().from(dealDocumentsTable).where(eq(dealDocumentsTable.dealId, dealId)),
  ]);

  return NextResponse.json({ deal, checklist, milestones, contacts, documents });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  const allowed = ['status', 'offerSubState', 'offerAmount', 'offerConditions', 'settlementDate', 'exchangeDate', 'isAuction', 'priority', 'listingAgentName', 'listingAgentPhone', 'listingAgentEmail', 'strategyNotes'];
  for (const key of allowed) {
    if (!(key in body)) continue;
    if ((key === 'exchangeDate' || key === 'settlementDate') && body[key]) {
      updates[key] = new Date(body[key] as string);
    } else {
      updates[key] = body[key];
    }
  }

  const [before] = await db
    .select({
      status: dealsTable.status,
      offerAmount: dealsTable.offerAmount,
      offerSubState: dealsTable.offerSubState,
    })
    .from(dealsTable)
    .where(eq(dealsTable.id, dealId));

  if (!before) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  if ('status' in body && body.status) {
    if (!validateStatusTransition(before.status ?? 'suggested', body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${before.status} → ${body.status}` },
        { status: 422 },
      );
    }
  }

  updates.updatedAt = new Date();

  const offerHistory = buildOfferHistoryEntries(
    {
      offerAmount: before.offerAmount,
      offerSubState: before.offerSubState,
    },
    {
      offerAmount: body.offerAmount,
      offerSubState: body.offerSubState,
    },
  );

  const [updated] = await db.update(dealsTable).set(updates).where(eq(dealsTable.id, dealId)).returning();
  if (!updated) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  if (offerHistory.length > 0) {
    await db.insert(dealOfferEventsTable).values(
      offerHistory.map((entry) => ({
        dealId,
        eventType: entry.eventType,
        previousValue: entry.previousValue,
        newValue: entry.newValue,
      })),
    );
  }

  // When moving to under_contract with an exchange date, generate milestones if none exist
  if (body.status === 'under_contract' && body.exchangeDate && body.settlementDate) {
    const existing = await db.select().from(dealMilestonesTable).where(eq(dealMilestonesTable.dealId, dealId));
    if (!existing.length) {
      const [row] = await db
        .select({ state: propertiesTable.state, isAuction: dealsTable.isAuction })
        .from(dealsTable)
        .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
        .where(eq(dealsTable.id, dealId));
      const state = row?.state ?? 'NSW';
      const milestones = generateSettlementMilestones(
        new Date(body.exchangeDate),
        new Date(body.settlementDate),
        state,
        row?.isAuction ?? updated.isAuction ?? false,
      );
      await db.insert(dealMilestonesTable).values(
        milestones.map((m, i) => ({ dealId, title: m.title, dayOffset: m.dayOffset, dueDate: m.dueDate, status: 'pending' as const, sortOrder: i }))
      );
    }
  }

  return NextResponse.json({ deal: updated });
}
