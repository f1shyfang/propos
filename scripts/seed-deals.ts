import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { generateDueDiligenceChecklist } from '../src/lib/deal-utils';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

const STAGES = ['suggested', 'approved', 'due_diligence', 'offer_made', 'under_contract', 'settled'] as const;

async function seedDeal(
  briefId: number,
  property: { id: string; propertyType: string | null; state: string | null },
  status: (typeof STAGES)[number],
  extras: Partial<typeof schema.dealsTable.$inferInsert> = {},
) {
  const existing = await db
    .select()
    .from(schema.dealsTable)
    .where(eq(schema.dealsTable.briefId, briefId))
    .limit(20);

  if (existing.some((d) => d.propertyId === property.id)) {
    console.log(`  skip ${property.id} — deal exists`);
    return;
  }

  const [deal] = await db
    .insert(schema.dealsTable)
    .values({
      briefId,
      propertyId: property.id,
      status,
      priority: extras.priority ?? 'standard',
      isAuction: extras.isAuction ?? false,
      offerSubState: extras.offerSubState ?? null,
      offerAmount: extras.offerAmount ?? null,
      exchangeDate: extras.exchangeDate ?? null,
      settlementDate: extras.settlementDate ?? null,
      strategyNotes: extras.strategyNotes ?? null,
    })
    .returning();

  const checklistItems = generateDueDiligenceChecklist(
    property.propertyType ?? 'House',
    property.state ?? 'NSW',
  );
  if (checklistItems.length) {
    await db.insert(schema.dealChecklistItemsTable).values(
      checklistItems.map((item) => ({
        dealId: deal.id,
        title: item.title,
        assignee: item.assignee,
        dayOffset: item.dayOffset,
        status: 'pending' as const,
      })),
    );
  }

  console.log(`  created deal #${deal.id} (${status}) for property ${property.id}`);
}

async function main() {
  console.log('Seeding demo deals…');

  const briefs = await db.select().from(schema.buyerBriefsTable).limit(3);
  const properties = await db.select().from(schema.propertiesTable).limit(12);

  if (briefs.length === 0 || properties.length === 0) {
    console.log('  need briefs and properties in DB first');
    process.exit(1);
  }

  const brief = briefs[0];
  const props = properties.slice(0, 6);

  const now = new Date();
  const inFiveDays = new Date(now);
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const exchangeRecent = new Date(now);
  exchangeRecent.setDate(exchangeRecent.getDate() - 3);

  if (props[0]) await seedDeal(brief.id, props[0], 'suggested');
  if (props[1]) await seedDeal(brief.id, props[1], 'approved');
  if (props[2]) await seedDeal(brief.id, props[2], 'due_diligence', { priority: 'high' });
  if (props[3]) await seedDeal(brief.id, props[3], 'offer_made', { offerSubState: 'sent', offerAmount: props[3].price ?? 950000 });
  if (props[4]) {
    await seedDeal(brief.id, props[4], 'under_contract', {
      exchangeDate: exchangeRecent,
      settlementDate: inFiveDays,
      offerAmount: props[4].price ?? 1200000,
    });
  }
  if (props[5]) {
    await seedDeal(brief.id, props[5], 'settled', {
      settlementDate: new Date(now.getTime() - 7 * 86400000),
    });
  }

  if (briefs[1] && properties[6]) {
    await seedDeal(briefs[1].id, properties[6], 'due_diligence', { priority: 'urgent' });
  }

  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
