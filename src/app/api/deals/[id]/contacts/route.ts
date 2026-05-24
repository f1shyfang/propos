import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealContactsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacts = await db.select().from(dealContactsTable).where(eq(dealContactsTable.dealId, Number(id)));
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { role, name, company, phone, email, reference, notes } = body;
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });

  const [contact] = await db.insert(dealContactsTable).values({
    dealId: Number(id),
    role,
    name: name ?? null,
    company: company ?? null,
    phone: phone ?? null,
    email: email ?? null,
    reference: reference ?? null,
    notes: notes ?? null,
  }).returning();

  return NextResponse.json({ contact }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const { contactId, ...updates } = await req.json();
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });

  const [contact] = await db.update(dealContactsTable).set(updates).where(eq(dealContactsTable.id, Number(contactId))).returning();
  return NextResponse.json({ contact });
}
