import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

function missingDatabaseProxy() {
  return new Proxy({}, {
    get() {
      throw new Error("DATABASE_URL is not configured. The canonical MVP routes use the deterministic demo service until Supabase credentials are provided.");
    },
  });
}

export const db = process.env.DATABASE_URL
  ? drizzle(process.env.DATABASE_URL)
  : missingDatabaseProxy() as ReturnType<typeof drizzle>;
