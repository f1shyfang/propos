import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  buildMatchCriteriaHash,
  getOrComputeBriefMatches,
  parseMatchOverrides,
} from '@/lib/brief-match-cache';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const sp = req.nextUrl.searchParams;
  const offset = parseInt(sp.get('offset') ?? '0', 10) || 0;
  const all = sp.get('all') === '1';

  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, briefId));
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const criteriaHash = buildMatchCriteriaHash(sp);
  const overrides = parseMatchOverrides(sp);
  const allMatches = await getOrComputeBriefMatches(brief, criteriaHash, overrides);

  const total = allMatches.length;
  const pageSize = all ? total : PAGE_SIZE;
  const matches = allMatches.slice(offset, offset + pageSize);

  return NextResponse.json({ matches, total, offset, hasMore: all ? false : offset + pageSize < total });
}
