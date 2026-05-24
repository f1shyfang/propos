import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';
import { logAction } from '@/lib/log-action';

export async function GET() {
  const briefs = await db.select().from(buyerBriefsTable).orderBy(desc(buyerBriefsTable.createdAt));
  return NextResponse.json({ briefs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    clientName, email, phone, contactMethod, engagementType,
    preApprovalStatus, budgetMin, budgetMax, buyerType,
    propertyTypes, minBeds, minBaths, parking,
    suburbs, mustHaves, dealBreakers,
    urgency, purchasePurpose, auctionWillingness,
  } = body;

  if (!clientName?.trim()) return NextResponse.json({ error: 'clientName required' }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const [clientUser] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  const [brief] = await db.insert(buyerBriefsTable).values({
    clientName: clientName.trim(),
    email: normalizedEmail,
    clientUserId: clientUser?.role === 'client' ? clientUser.id : null,
    phone: phone?.trim() ?? '',
    contactMethod,
    engagementType,
    preApprovalStatus,
    budgetMin: budgetMin ? Number(budgetMin) : null,
    budgetMax: budgetMax ? Number(budgetMax) : null,
    buyerType,
    propertyTypes: propertyTypes ?? [],
    minBeds: minBeds ? Number(minBeds) : 1,
    minBaths: minBaths ? Number(minBaths) : 1,
    parking,
    suburbs: suburbs ?? [],
    mustHaves: mustHaves ?? [],
    dealBreakers: dealBreakers ?? [],
    urgency,
    purchasePurpose,
    auctionWillingness: auctionWillingness ?? true,
  }).returning();

  logAction({ userId: 'agent', actionType: 'brief_create', entityType: 'brief', entityId: String(brief.id) });
  return NextResponse.json({ brief }, { status: 201 });
}
