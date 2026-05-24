import { db } from '@/lib/db';
import { buyerBriefsTable } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { BriefsCrmTable } from '@/components/briefs/briefs-crm-table';
import type { BriefTableRow } from '@/lib/briefs-table-utils';

export const dynamic = 'force-dynamic';

function cleanSuburb(s: string): string {
  // Strip state prefix like "NSW - " from "NSW - Camperdown"
  const idx = s.indexOf(' - ');
  return idx >= 0 ? s.slice(idx + 3).trim() : s.trim();
}

export default async function BriefsPage() {
  const briefs = await db.select().from(buyerBriefsTable).orderBy(desc(buyerBriefsTable.createdAt));

  const rows: BriefTableRow[] = briefs.map((b) => ({
    id: b.id,
    clientName: b.clientName,
    email: b.email,
    phone: b.phone,
    agent: 'Jess Morgan',
    budgetMin: b.budgetMin,
    budgetMax: b.budgetMax,
    suburbs: ((b.suburbs as string[]) ?? []).map(cleanSuburb),
    status: b.status ?? 'searching',
    propertyTypes: (b.propertyTypes as string[]) ?? [],
    createdAt: b.createdAt ? b.createdAt.toISOString() : null,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={`${rows.length} active brief${rows.length !== 1 ? 's' : ''}`}
        title="Buyer Briefs"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/briefs/intake" className="pg-btn">
              <Icon name="mic" size={13} />Import from recording
            </Link>
            <Link href="/briefs/new" className="pg-btn pg-btn-accent">
              <Icon name="plus" size={13} />New brief
            </Link>
          </div>
        }
      />
      <BriefsCrmTable rows={rows} />
    </div>
  );
}
