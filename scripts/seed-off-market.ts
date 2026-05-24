import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { seedOffMarketProperties } from "../src/lib/seed/off-market-seed";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function main() {
  const limit = Number(process.env.OFF_MARKET_SEED_LIMIT ?? 20);

  const agents = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, "agent@demo.com"))
    .limit(1);

  console.log(`Seeding off-market hub (${limit} properties from portal data)…`);

  const { inserted } = await seedOffMarketProperties(db, {
    limit,
    clearExisting: true,
    agentId: agents[0]?.id ?? null,
  });

  if (inserted === 0) {
    console.log("  No suitable properties found — run populate.ts and inject-images first.");
    process.exit(1);
  }

  console.log(`  → ${inserted} off-market properties with real addresses and photos.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
