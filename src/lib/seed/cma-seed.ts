import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { desc, inArray, sql } from "drizzle-orm";

import { calculatePricePerSqm } from "../cma-utils";
import * as schema from "../db/schema";

/** Hackathon target: 3 comparables × 25 demo properties = 75 rows (see docs/blueprint/10-hackathon-mvp-spec.md §2.3). */
export const DEFAULT_CMA_COMPS_PER_PROPERTY = 3;
export const DEFAULT_CMA_PROPERTY_LIMIT = 50;

export type CmaSeedProperty = {
  id: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  landSize: number | null;
  price: number | null;
  appraisedValue: number | null;
  overallScore: number | null;
};

export type CmaSeedInsert = typeof schema.cmaRecordsTable.$inferInsert;

export type CmaSeedOptions = {
  /** Max subject properties to seed (highest overall_score first). */
  propertyLimit?: number;
  /** Comparables per subject property. */
  compsPerProperty?: number;
  /** Delete all existing cma_records before insert. */
  clearExisting?: boolean;
  /** Always include these property IDs (e.g. shortlisted demo listings). */
  includePropertyIds?: string[];
};

const STREETS = [
  "Hutchinson Street",
  "Devonshire Street",
  "Crown Street",
  "Bourke Street",
  "Foveaux Street",
  "Riley Street",
  "Bourke Lane",
  "Palmer Street",
  "Chalmers Street",
  "Elizabeth Street",
];

const COMP_NOTES = [
  "Similar condition, comparable land size",
  "Renovated kitchen, parking included",
  "Corner block, slightly larger land",
  "Original condition, quick sale",
  "North-facing, similar bed/bath mix",
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function monthsAgo(months: number, rng: () => number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1 + Math.floor(rng() * 20));
  return d;
}

/** Build 3 deterministic comparable rows for one subject property. */
export function buildCmaRecordsForProperty(
  subject: CmaSeedProperty,
  compsPerProperty = DEFAULT_CMA_COMPS_PER_PROPERTY,
): CmaSeedInsert[] {
  const rng = createRng(hashString(subject.id));
  const suburb = subject.suburb ?? "Sydney";
  const state = subject.state ?? "NSW";
  const baseBeds = subject.bedrooms ?? 3;
  const baseBaths = subject.bathrooms ?? 2;
  const baseLand = subject.landSize ?? 300;
  const anchor =
    subject.appraisedValue ?? subject.price ?? Math.round(750_000 + rng() * 500_000);

  const priceSpreads = [-0.08, 0.04, 0.11];
  const records: CmaSeedInsert[] = [];

  for (let i = 0; i < compsPerProperty; i++) {
    const salePrice = Math.round(anchor * (1 + priceSpreads[i] ?? (rng() - 0.5) * 0.1));
    const landSizeSqm = Math.max(
      80,
      Math.round(baseLand * (0.88 + rng() * 0.24)),
    );
    const bedrooms = Math.max(1, baseBeds + (i === 0 ? 0 : i === 1 ? -1 : 0));
    const bathrooms = Math.max(1, baseBaths + (i === 2 ? 1 : 0));
    const streetNum = 2 + Math.floor(rng() * 180);
    const unitPrefix = i === 1 && rng() > 0.5 ? `${Math.floor(rng() * 12) + 1}/` : "";

    records.push({
      propertyId: subject.id,
      comparableAddress: `${unitPrefix}${streetNum} ${pick(rng, STREETS)}, ${suburb} ${state}`,
      salePrice,
      saleDate: monthsAgo(1 + i * 2 + Math.floor(rng() * 2), rng),
      bedrooms,
      bathrooms,
      landSizeSqm,
      pricePerSqm: calculatePricePerSqm(salePrice, landSizeSqm),
      distanceKm: Math.round((0.2 + rng() * 1.3) * 10) / 10,
      notes: pick(rng, COMP_NOTES),
    });
  }

  return records;
}

export async function selectCmaSeedTargets(
  db: NodePgDatabase<typeof schema>,
  options: Pick<CmaSeedOptions, "propertyLimit" | "includePropertyIds">,
): Promise<CmaSeedProperty[]> {
  const limit = options.propertyLimit ?? DEFAULT_CMA_PROPERTY_LIMIT;
  const includeIds = options.includePropertyIds ?? [];

  const scored = await db
    .select({
      id: schema.propertiesTable.id,
      address: schema.propertiesTable.address,
      suburb: schema.propertiesTable.suburb,
      state: schema.propertiesTable.state,
      bedrooms: schema.propertiesTable.bedrooms,
      bathrooms: schema.propertiesTable.bathrooms,
      landSize: schema.propertiesTable.landSize,
      price: schema.propertiesTable.price,
      appraisedValue: schema.propertiesTable.appraisedValue,
      overallScore: schema.propertiesTable.overallScore,
    })
    .from(schema.propertiesTable)
    .orderBy(desc(schema.propertiesTable.overallScore))
    .limit(limit);

  const byId = new Map(scored.map((p) => [p.id, p]));

  if (includeIds.length > 0) {
    const extra = await db
      .select({
        id: schema.propertiesTable.id,
        address: schema.propertiesTable.address,
        suburb: schema.propertiesTable.suburb,
        state: schema.propertiesTable.state,
        bedrooms: schema.propertiesTable.bedrooms,
        bathrooms: schema.propertiesTable.bathrooms,
        landSize: schema.propertiesTable.landSize,
        price: schema.propertiesTable.price,
        appraisedValue: schema.propertiesTable.appraisedValue,
        overallScore: schema.propertiesTable.overallScore,
      })
      .from(schema.propertiesTable)
      .where(inArray(schema.propertiesTable.id, includeIds));

    for (const p of extra) {
      byId.set(p.id, p);
    }
  }

  return [...byId.values()];
}

export async function seedCmaRecords(
  db: NodePgDatabase<typeof schema>,
  options: CmaSeedOptions = {},
): Promise<{ subjects: number; records: number }> {
  const compsPerProperty = options.compsPerProperty ?? DEFAULT_CMA_COMPS_PER_PROPERTY;
  const clearExisting = options.clearExisting ?? true;

  const shortlisted = await db
    .select({ propertyId: schema.shortlistsTable.propertyId })
    .from(schema.shortlistsTable);
  const includePropertyIds = [
    ...new Set([
      ...(options.includePropertyIds ?? []),
      ...shortlisted.map((s) => s.propertyId).filter((id): id is string => Boolean(id)),
    ]),
  ];

  const targets = await selectCmaSeedTargets(db, {
    propertyLimit: options.propertyLimit,
    includePropertyIds,
  });

  if (clearExisting) {
    await db.delete(schema.cmaRecordsTable);
  } else if (targets.length > 0) {
    await db
      .delete(schema.cmaRecordsTable)
      .where(
        inArray(
          schema.cmaRecordsTable.propertyId,
          targets.map((t) => t.id),
        ),
      );
  }

  const rows = targets.flatMap((subject) =>
    buildCmaRecordsForProperty(subject, compsPerProperty),
  );

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(schema.cmaRecordsTable).values(rows.slice(i, i + CHUNK));
  }

  return { subjects: targets.length, records: rows.length };
}

export async function countCmaRecords(db: NodePgDatabase<typeof schema>): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.cmaRecordsTable);
  return Number(row?.n ?? 0);
}
