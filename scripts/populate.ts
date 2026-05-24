import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { readFileSync, createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";
import * as schema from "../src/lib/db/schema";
import { seedCmaRecords } from "../src/lib/seed/cma-seed";

const db = drizzle(process.env.DATABASE_URL!, { schema });

const DATA = resolve(import.meta.dir, "../data");
const CHUNK = 500;

async function insertChunked<T>(table: Parameters<typeof db.insert>[0], rows: T[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(table).values(rows.slice(i, i + CHUNK) as never).onConflictDoNothing();
  }
}

// ── 1. LGAs ──────────────────────────────────────────────────────────────────
console.log("Inserting LGAs...");
const schoolsRaw = JSON.parse(readFileSync(`${DATA}/schools_by_lga_enriched.json`, "utf-8"));

const lgas = Object.values(schoolsRaw).map((lga: any) => ({
  lgaId: String(lga.lga_id),
  lgaName: lga.lga_name,
  state: lga.state,
}));
await insertChunked(schema.lgasTable, lgas);
console.log(`  → ${lgas.length} LGAs`);

// ── 2. Suburbs ────────────────────────────────────────────────────────────────
console.log("Inserting suburbs...");
const suburbsRaw: any[] = JSON.parse(readFileSync(`${DATA}/suburbs_detailed_enriched.json`, "utf-8"));

const suburbs = suburbsRaw.map((s) => ({
  suburbId: s.suburb_id ? String(s.suburb_id) : null,
  lgaId: s.lga_id ? String(s.lga_id) : null,
  name: String(s.name),
  state: s.state ?? null,
  population: s.population ?? null,
  areaSizeKm2: s.area_size_km2 ?? null,
  crimeRank: s.crime_rank ?? null,
  violentPer1000: s.violent_per_1000 != null ? Number(s.violent_per_1000) : null,
  propertyPer1000: s.property_per_1000 != null ? Number(s.property_per_1000) : null,
  crimeTrendSummary: s.crime_trend_summary ?? null,
  dataPeriod: s.data_period ?? null,
  url: s.url ?? null,
  scrapedAt: s.scraped_at ?? null,
}));
await insertChunked(schema.suburbsTable, suburbs);
console.log(`  → ${suburbs.length} suburbs`);

// ── 3. Schools ────────────────────────────────────────────────────────────────
console.log("Inserting schools...");
const validSuburbIds = new Set(
  (await db.select({ suburbId: schema.suburbsTable.suburbId }).from(schema.suburbsTable))
    .map((r) => r.suburbId)
    .filter(Boolean)
);

const schools: any[] = [];
let schoolsDropped = 0;
for (const lga of Object.values(schoolsRaw) as any[]) {
  for (const s of lga.schools) {
    const suburbId = s.suburb_id ? String(s.suburb_id) : null;
    if (suburbId && !validSuburbIds.has(suburbId)) {
      schoolsDropped++;
      continue;
    }
    schools.push({
      lgaId: String(lga.lga_id),
      suburbId,
      name: String(s.name),
      type: s.type ?? null,
      sector: s.sector ?? null,
      suburb: s.suburb ?? null,
      specialSchool: s.special_school ?? null,
      campusType: s.campus_type ?? null,
      latitude: s.latitude != null ? Number(s.latitude) : null,
      longitude: s.longitude != null ? Number(s.longitude) : null,
    });
  }
}
await insertChunked(schema.schoolsTable, schools);
console.log(`  → ${schools.length} schools (${schoolsDropped} dropped, suburb_id not found)`);

// ── 4. Properties (JSONL) ─────────────────────────────────────────────────────
console.log("Inserting properties...");
let propCount = 0;
let propsDropped = 0;
let batch: any[] = [];

const rl = createInterface({
  input: createReadStream(`${DATA}/properties copy_coords.jsonl`),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.trim()) continue;
  const p = JSON.parse(line);

  const suburbId = p.ssc_id ? String(p.ssc_id) : null;
  if (suburbId && !validSuburbIds.has(suburbId)) {
    propsDropped++;
    continue;
  }

  batch.push({
    id: String(p.id),
    lgaId: p.lga_id ? String(p.lga_id) : null,
    suburbId,
    lgaName: p.lga_name ?? null,
    address: p.address ?? null,
    suburb: p.suburb ?? null,
    state: p.state ?? null,
    propertyType: p.property_type ?? null,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    parkingSpaces: p.parking_spaces ?? null,
    landSize: p.land_size ?? null,
    price: p.price ?? null,
    priceDisplay: p.price_display ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    url: p.url ?? null,
    created: p.created ? new Date(p.created) : null,
    days: p.days ?? null,
    appraisedValue: p.appraised_value ?? null,
    appraisedRent: p.appraised_rent ?? null,
    grossYield: p.gross_yield ?? null,
    sa1Yield: p.sa1_yield ?? null,
    sa1Rent: p.sa1_rent ?? null,
    confidenceScore: p.confidence_score ?? null,
    rScore: p.r_score ?? null,
    overallScore: p.overall_score ?? null,
    overallPerc: p.overall_perc ?? null,
    sweetspot: p.sweetspot ?? null,
    sweetspotScore: p.sweetspot_score ?? null,
    distress: p.distress ?? null,
    distressScore: p.distress_score ?? null,
    ownerOccupiers: p.owner_occupiers ?? null,
    privateRenters: p.private_renters ?? null,
    ooPerc: p.oo_perc ?? null,
    underOffer: p.under_offer ?? null,
  });

  if (batch.length >= CHUNK) {
    await db.insert(schema.propertiesTable).values(batch).onConflictDoNothing();
    propCount += batch.length;
    process.stdout.write(`\r  → ${propCount.toLocaleString()} properties...`);
    batch = [];
  }
}

if (batch.length > 0) {
  await db.insert(schema.propertiesTable).values(batch).onConflictDoNothing();
  propCount += batch.length;
}
console.log(`\r  → ${propCount.toLocaleString()} properties (${propsDropped.toLocaleString()} dropped, suburb_id not found)`);


// ── 5. CMA Records (demo comparables — see src/lib/seed/cma-seed.ts) ─────────
console.log("Inserting CMA records...");
const { subjects: cmaSubjects, records: cmaRecordCount } = await seedCmaRecords(db, {
  clearExisting: true,
});
console.log(`  → ${cmaRecordCount} CMA records for ${cmaSubjects} properties`);

// ── Summary ───────────────────────────────────────────────────────────────────
const [lgaCount, suburbCount, schoolCount, propTotal, cmaCount] = await Promise.all([
  db.select({ n: sql<number>`count(*)` }).from(schema.lgasTable),
  db.select({ n: sql<number>`count(*)` }).from(schema.suburbsTable),
  db.select({ n: sql<number>`count(*)` }).from(schema.schoolsTable),
  db.select({ n: sql<number>`count(*)` }).from(schema.propertiesTable),
  db.select({ n: sql<number>`count(*)` }).from(schema.cmaRecordsTable),
]);

console.log("\nDone!");
console.table({
  lgas: Number(lgaCount[0].n),
  suburbs: Number(suburbCount[0].n),
  schools: Number(schoolCount[0].n),
  properties: Number(propTotal[0].n),
  cma_records: Number(cmaCount[0].n),
});
