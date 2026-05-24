import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { buyerBriefsTable, intakeTranscriptionsTable } from '@/lib/db/schema';
import { validateBriefForm } from '@/lib/intake/validate-brief-form';
import { logAction } from '@/lib/log-action';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intakeId, ...fields } = body as {
      intakeId?: number;
      clientName?: string;
      email?: string;
      phone?: string;
      contactMethod?: string;
      engagementType?: string;
      preApprovalStatus?: string;
      budgetMin?: number | string | null;
      budgetMax?: number | string | null;
      buyerType?: string;
      propertyTypes?: string[];
      minBeds?: number;
      minBaths?: number;
      parking?: string;
      suburbs?: string[];
      mustHaves?: string[];
      dealBreakers?: string[];
      urgency?: string;
      purchasePurpose?: string;
      auctionWillingness?: boolean;
    };

    const formForValidation = {
      clientName: fields.clientName ?? '',
      email: fields.email ?? '',
      phone: fields.phone ?? '',
      contactMethod: fields.contactMethod ?? 'email',
      engagementType: fields.engagementType ?? 'full-service',
      preApprovalStatus: fields.preApprovalStatus ?? 'Not Started',
      budgetMin: fields.budgetMin != null ? String(fields.budgetMin) : '',
      budgetMax: fields.budgetMax != null ? String(fields.budgetMax) : '',
      buyerType: fields.buyerType ?? 'owner-occupier',
      propertyTypes: fields.propertyTypes ?? [],
      minBeds: fields.minBeds ?? 2,
      minBaths: fields.minBaths ?? 1,
      parking: fields.parking ?? 'nice_to_have',
      suburbs: fields.suburbs ?? [],
      mustHaves: fields.mustHaves ?? [],
      dealBreakers: fields.dealBreakers ?? [],
      urgency: fields.urgency ?? '3 months',
      purchasePurpose: fields.purchasePurpose ?? 'PPOR',
      auctionWillingness: fields.auctionWillingness ?? true,
    };

    const validation = validateBriefForm(formForValidation);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.errors }, { status: 400 });
    }

    const [brief] = await db.insert(buyerBriefsTable).values({
      clientName: formForValidation.clientName.trim(),
      email: formForValidation.email.trim(),
      phone: formForValidation.phone.trim(),
      contactMethod: formForValidation.contactMethod,
      engagementType: formForValidation.engagementType,
      preApprovalStatus: formForValidation.preApprovalStatus,
      budgetMin: formForValidation.budgetMin ? Number(formForValidation.budgetMin) : null,
      budgetMax: formForValidation.budgetMax ? Number(formForValidation.budgetMax) : null,
      buyerType: formForValidation.buyerType,
      propertyTypes: formForValidation.propertyTypes,
      minBeds: formForValidation.minBeds,
      minBaths: formForValidation.minBaths,
      parking: formForValidation.parking,
      suburbs: formForValidation.suburbs,
      mustHaves: formForValidation.mustHaves,
      dealBreakers: formForValidation.dealBreakers,
      urgency: formForValidation.urgency,
      purchasePurpose: formForValidation.purchasePurpose,
      auctionWillingness: formForValidation.auctionWillingness,
    }).returning();

    if (intakeId) {
      await db.update(intakeTranscriptionsTable)
        .set({ briefId: brief.id, status: 'saved' })
        .where(eq(intakeTranscriptionsTable.id, intakeId));
    }

    logAction({
      userId: 'agent',
      actionType: 'brief_create',
      entityType: 'brief',
      entityId: String(brief.id),
      metadata: intakeId ? { intakeId, source: 'intake' } : { source: 'intake' },
    });

    return NextResponse.json({ brief }, { status: 201 });
  } catch (error) {
    console.error('Intake save error:', error);
    return NextResponse.json({ error: 'Failed to save brief' }, { status: 500 });
  }
}
