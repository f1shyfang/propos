import "dotenv/config";
import { db } from "../src/lib/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating PostGIS extension if it doesn't exist...");
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("PostGIS extension created successfully.");
  } catch (error) {
    console.error("Error creating PostGIS extension:", error);
    process.exit(1);
  }
  process.exit(0);
}

main();
