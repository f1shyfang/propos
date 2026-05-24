import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { isNotNull, sql } from 'drizzle-orm';

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export async function GET() {
  const rows = await db
    .select({
      suburb: sql<string>`lower(${propertiesTable.suburb})`,
      state: sql<string>`upper(${propertiesTable.state})`,
    })
    .from(propertiesTable)
    .where(isNotNull(propertiesTable.suburb))
    .groupBy(sql`lower(${propertiesTable.suburb})`, sql`upper(${propertiesTable.state})`)
    .orderBy(sql`upper(${propertiesTable.state})`, sql`lower(${propertiesTable.suburb})`);

  const suburbs = rows
    .filter(r => r.suburb)
    .map(r => r.state ? `${r.state} - ${toTitleCase(r.suburb)}` : toTitleCase(r.suburb));

  return NextResponse.json({ suburbs });
}
