import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.mtsdxlrihqzizoeaofjb:b3PeHUhBFh8zSEV0@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
  },
});
