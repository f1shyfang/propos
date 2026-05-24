import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealsTable, buyerBriefsTable, propertiesTable, dealChecklistItemsTable, dealMilestonesTable, dealContactsTable, dealDocumentsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSettlementMilestones } from '@/lib/deal-utils';
import { z } from 'zod';

const patchDealSchema = z.object({
  status: z.enum(['prospect', 'appraisal', 'research', 'viewing', 'shortlist', 'due_diligence', 'offering', 'negotiating', 'under_contract', 'settled', 'lost']).optional(),
  offerSubState: z.string().optional().nullable(),
  offerAmount: z.number().positive().optional().nullable(),
  offerConditions: z.string().optional().nullable(),
  settlementDate: z.string().optional().nullable(),
  exchangeDate: z.string().optional().nullable(),
  isAuction: z.boolean().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  listingAgentName: z.string().optional().nullable(),
  listingAgentPhone: z.string().optional().nullable(),
  listingAgentEmail: z.string().email().optional().nullable(),
  strategyNotes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = parseInt(id, 10);
  
  if (isNaN(dealId) || dealId <= 0) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 });
  }

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
  const dealId = parseInt(id, 10);
  
  if (isNaN(dealId) || dealId <= 0) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validatedData = patchDealSchema.parse(body);

    const updates: Record<string, unknown> = { ...validatedData, updatedAt: new Date() };

    const [updated] = await db.update(dealsTable).set(updates).where(eq(dealsTable.id, dealId)).returning();
    if (!updated) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    // When moving to under_contract with an exchange date, generate milestones if none exist
    if (updated.status === 'under_contract' && updated.exchangeDate && updated.settlementDate) {
      const existing = await db.select().from(dealMilestonesTable).where(eq(dealMilestonesTable.dealId, dealId));
      if (!existing.length) {
        const [dealInfo] = await db.select().from(dealsTable).leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id)).where(eq(dealsTable.id, dealId));
        const state = dealInfo?.properties?.state ?? 'NSW';
        const milestones = generateSettlementMilestones(
          new Date(updated.exchangeDate),
          new Date(updated.settlementDate),
          state,
          updated.isAuction ?? false,
        );
        await db.insert(dealMilestonesTable).values(
          milestones.map((m, i) => ({ dealId, title: m.title, dayOffset: m.dayOffset, dueDate: m.dueDate, status: 'pending' as const, sortOrder: i }))
        );
      }
    }

    return NextResponse.json({ deal: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
