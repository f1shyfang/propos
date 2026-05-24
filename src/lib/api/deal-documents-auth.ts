import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dealDocumentsTable, dealsTable } from '@/lib/db/schema';
import { getSession } from '@/lib/auth-server';
import { isS3Configured } from '@/lib/storage/s3';

export async function requireAgentForDeal(dealId: number) {
  const [deal] = await db.select({ id: dealsTable.id }).from(dealsTable).where(eq(dealsTable.id, dealId));
  if (!deal) return { error: Response.json({ error: 'Deal not found' }, { status: 404 }) };

  if (!isS3Configured()) {
    return { error: Response.json({ error: 'File storage is not configured' }, { status: 503 }) };
  }

  const session = await getSession();
  return { session };
}

export async function getDealDocument(dealId: number, documentId: number) {
  const [doc] = await db
    .select()
    .from(dealDocumentsTable)
    .where(eq(dealDocumentsTable.id, documentId));
  if (!doc || doc.dealId !== dealId) return null;
  return doc;
}
