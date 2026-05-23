import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";
import * as schema from "../src/lib/db/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

const JSONL = resolve(import.meta.dir, "../data/property_images.jsonl");

const rl = createInterface({ input: createReadStream(JSONL), crlfDelay: Infinity });

let updated = 0;
let skipped = 0;
const promises: Promise<void>[] = [];

console.log("Injecting images & suburb codes...");

for await (const line of rl) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  const row: { id: string; postcode: string; images: string[] } = JSON.parse(trimmed);

  promises.push(
    db.update(schema.propertiesTable)
      .set({ images: row.images, suburbCode: row.postcode })
      .where(eq(schema.propertiesTable.id, row.id))
      .then((res) => {
        if ((res as unknown as { rowCount: number }).rowCount > 0) updated++;
        else skipped++;
      })
  );

  // flush every 200 to avoid overwhelming the pool
  if (promises.length >= 200) {
    await Promise.all(promises.splice(0, 200));
    process.stdout.write(`\r  → ${updated} updated, ${skipped} not found`);
  }
}

await Promise.all(promises);
console.log(`\n  → Done. ${updated} updated, ${skipped} not found.`);
