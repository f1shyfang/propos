/**
 * Standalone CMA seed — (re)builds cma_records for demo properties.
 *
 * Plan:
 *   1. Pick top N properties by overall_score (+ any shortlisted listings).
 *   2. Generate 3 deterministic comparables per subject (suburb-matched addresses, ±price spread).
 *   3. Replace existing rows for those subjects (or full table with --clear).
 *
 * Usage:
 *   pnpm seed:cma
 *   CMA_PROPERTY_LIMIT=25 pnpm seed:cma
 */
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/lib/db/schema";
import {
  countCmaRecords,
  DEFAULT_CMA_PROPERTY_LIMIT,
  seedCmaRecords,
} from "../src/lib/seed/cma-seed";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

const propertyLimit = Number(process.env.CMA_PROPERTY_LIMIT) || DEFAULT_CMA_PROPERTY_LIMIT;

async function main() {
  console.log(`Seeding CMA records (limit=${propertyLimit} subjects, 3 comps each)…`);

  const before = await countCmaRecords(db);
  const { subjects, records } = await seedCmaRecords(db, {
    propertyLimit,
    clearExisting: process.env.CMA_APPEND === "1" ? false : true,
  });
  const after = await countCmaRecords(db);

  console.log(`  → ${subjects} subject properties, ${records} comparables inserted`);
  console.log(`  → cma_records: ${before} → ${after}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
