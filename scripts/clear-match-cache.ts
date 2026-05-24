import * as dotenv from "dotenv";
dotenv.config();
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Clearing all brief match cache entries...");
  const res = await db.delete(schema.briefMatchCacheTable);
  console.log("Brief match cache cleared successfully.");
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
