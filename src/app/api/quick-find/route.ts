import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertiesTable, buyerBriefsTable, dealsTable } from '@/lib/db/schema';
import { like, or, desc } from 'drizzle-orm';
import { filterQuickFindResults, type QuickFindItem } from '@/lib/quick-find-utils';

function fmt(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price) return '';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';

  const [properties, briefs, deals] = await Promise.all([
    db
      .select({ id: propertiesTable.id, address: propertiesTable.address, suburb: propertiesTable.suburb, state: propertiesTable.state, price: propertiesTable.price, priceDisplay: propertiesTable.priceDisplay })
      .from(propertiesTable)
      .orderBy(desc(propertiesTable.created))
      .limit(200),
    db
      .select({ id: buyerBriefsTable.id, clientName: buyerBriefsTable.clientName, budgetMin: buyerBriefsTable.budgetMin, budgetMax: buyerBriefsTable.budgetMax, status: buyerBriefsTable.status })
      .from(buyerBriefsTable)
      .orderBy(desc(buyerBriefsTable.createdAt))
      .limit(100),
    db
      .select({ id: dealsTable.id, propertyId: dealsTable.propertyId, status: dealsTable.status })
      .from(dealsTable)
      .orderBy(desc(dealsTable.createdAt))
      .limit(100),
  ]);

  const items: QuickFindItem[] = [
    ...properties.map(p => ({
      id: p.id,
      type: 'property' as const,
      label: p.address ?? p.id,
      sublabel: [p.suburb, p.state].filter(Boolean).join(' ') + (p.price || p.priceDisplay ? ` · ${fmt(p.price, p.priceDisplay)}` : ''),
      href: `/properties/${p.id}`,
    })),
    ...briefs.map(b => ({
      id: `b${b.id}`,
      type: 'brief' as const,
      label: b.clientName,
      sublabel: `Budget ${fmt(b.budgetMin, null)}–${fmt(b.budgetMax, null)} · ${b.status ?? 'searching'}`,
      href: `/briefs/${b.id}`,
    })),
    ...deals.map(d => ({
      id: `d${d.id}`,
      type: 'deal' as const,
      label: `Deal #${d.id}`,
      sublabel: `${d.status?.replace(/_/g, ' ') ?? ''}`,
      href: `/deals/${d.id}`,
    })),
  ];

  const results = filterQuickFindResults(q, items);

  return NextResponse.json({ items: results.slice(0, 30) });
}
