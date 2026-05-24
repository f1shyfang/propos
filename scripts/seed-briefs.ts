import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { seedBuyerBriefs } from "../src/lib/seed/briefs-seed";

const pool = new Pool({
  connectionString: "postgresql://postgres:propos@43.157.202.127:32112/postgres",
});
const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding buyer briefs…");
  const { inserted, skipped } = await seedBuyerBriefs(db);
  console.log(`  inserted: ${inserted}, skipped (already exist): ${skipped}`);
  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
