import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, desc, inArray, isNotNull, sql } from "drizzle-orm";

import * as schema from "../db/schema";

/** Inner-city suburbs with strong photo coverage in the portal dataset. */
export const OFF_MARKET_TARGET_SUBURBS = [
  "Surry Hills",
  "Paddington",
  "Mosman",
  "Redfern",
  "Newtown",
  "Balmain",
  "Darlinghurst",
  "Richmond",
  "Carlton",
] as const;

export type OffMarketSeedProperty = {
  id: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  landSize: number | null;
  price: number | null;
  appraisedValue: number | null;
  images: string[] | null;
};

export type OffMarketSeedOptions = {
  limit?: number;
  clearExisting?: boolean;
  agentId?: string | null;
};

const SELLING_AGENTS = [
  { name: "James Whitfield", phone: "0412 345 678", email: "j.whitfield@raywhite.com" },
  { name: "Sophie Nguyen", phone: "0423 891 204", email: "s.nguyen@mcgrath.com.au" },
  { name: "Marcus Chen", phone: "0401 772 330", email: "marcus.chen@belle.com.au" },
  { name: "Emma O'Sullivan", phone: "0438 556 901", email: "emma.osullivan@ljhooker.com.au" },
  { name: "David Park", phone: "0419 004 882", email: "d.park@bresicwhitney.com" },
];

const HOW_SOURCED = [
  "Selling agent called before Saturday campaign",
  "Met at agency roundtable — vendor considering quiet sale",
  "Referral from past client in the street",
  "Drive-by, letter dropped — vendor called back",
  "Pre-market brief from listing agent relationship",
];

const INTERNAL_NOTES = [
  "Vendor relocating interstate; prefers 60-day settlement. Comparable {street} sold ${comp} in March.",
  "Renovated circa 2019. Agent says guide is soft — motivated if clean offer before auction.",
  "Corner block; DA potential subject to council. Last comparable on street $150k above guide.",
  "Tenant in place until July. Inspection by appointment only — keys with agent.",
  "Price feedback from two recent sales on the street supports top of range.",
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

/** Buyer-agent style guide band around an appraised or list anchor. */
export function buildPriceGuide(anchor: number): { priceMin: number; priceMax: number } {
  const priceMin = Math.round((anchor * 0.92) / 10_000) * 10_000;
  const priceMax = Math.round((anchor * 1.05) / 10_000) * 10_000;
  return { priceMin: Math.max(priceMin, 10_000), priceMax: Math.max(priceMax, priceMin + 10_000) };
}

export function buildOffMarketRow(
  source: OffMarketSeedProperty,
  index: number,
  agentId: string | null,
): typeof schema.offMarketPropertiesTable.$inferInsert {
  const rng = createRng(hashString(source.id));
  const anchor =
    source.appraisedValue ??
    source.price ??
    Math.round(900_000 + rng() * 1_500_000);
  const { priceMin, priceMax } = buildPriceGuide(anchor);
  const agent = pick(rng, SELLING_AGENTS);
  const accessStatuses = [
    "not_inspected",
    "inspected",
    "inspected",
    "under_negotiation",
    "not_inspected",
  ] as const;
  const motivations = ["highly_motivated", "motivated", "testing_market", "unknown"] as const;
  const sourceTypes = ["selling_agent", "selling_agent", "word_of_mouth", "direct_vendor"] as const;

  const isPreMarket = index % 4 === 0;
  const expectedListingDate = isPreMarket
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14 + Math.floor(rng() * 21));
        return d;
      })()
    : null;

  const daysAgoContact = index % 5 === 0 ? 38 + Math.floor(rng() * 12) : Math.floor(rng() * 18);
  const lastContactedAt = new Date();
  lastContactedAt.setDate(lastContactedAt.getDate() - daysAgoContact);

  const compPrice = Math.round(anchor * (0.94 + rng() * 0.08));
  const notes = pick(rng, INTERNAL_NOTES)
    .replace("{street}", source.address?.split(/,\s/)[0] ?? "nearby")
    .replace("${comp}", `$${(compPrice / 1000).toFixed(0)}k`);

  const images = (source.images ?? []).filter(Boolean).slice(0, 4);

  return {
    agentId,
    address: source.address?.trim() ?? "Address withheld",
    suburb: source.suburb ?? "Sydney",
    state: source.state ?? "NSW",
    propertyType: source.propertyType ?? "house",
    bedrooms: source.bedrooms,
    bathrooms: source.bathrooms,
    parkingSpaces: source.parkingSpaces,
    landSize: source.landSize && source.landSize > 0 ? source.landSize : null,
    priceMin,
    priceMax,
    sourceType: pick(rng, sourceTypes),
    sellingAgentName: agent.name,
    sellingAgentPhone: agent.phone,
    sellingAgentEmail: agent.email,
    howSourced: pick(rng, HOW_SOURCED),
    accessStatus: pick(rng, accessStatuses),
    vendorMotivation: pick(rng, motivations),
    expectedListingDate,
    internalNotes: notes,
    confidential: index % 7 === 0,
    images,
    lastContactedAt,
  };
}

export async function selectOffMarketSeedSources(
  db: NodePgDatabase<typeof schema>,
  limit: number,
): Promise<OffMarketSeedProperty[]> {
  const rows = await db
    .select({
      id: schema.propertiesTable.id,
      address: schema.propertiesTable.address,
      suburb: schema.propertiesTable.suburb,
      state: schema.propertiesTable.state,
      propertyType: schema.propertiesTable.propertyType,
      bedrooms: schema.propertiesTable.bedrooms,
      bathrooms: schema.propertiesTable.bathrooms,
      parkingSpaces: schema.propertiesTable.parkingSpaces,
      landSize: schema.propertiesTable.landSize,
      price: schema.propertiesTable.price,
      appraisedValue: schema.propertiesTable.appraisedValue,
      images: schema.propertiesTable.images,
    })
    .from(schema.propertiesTable)
    .where(
      and(
        inArray(schema.propertiesTable.suburb, [...OFF_MARKET_TARGET_SUBURBS]),
        isNotNull(schema.propertiesTable.images),
        sql`jsonb_array_length(${schema.propertiesTable.images}) > 0`,
        isNotNull(schema.propertiesTable.address),
        sql`coalesce(${schema.propertiesTable.appraisedValue}, ${schema.propertiesTable.price}, 0) > 500000`,
      ),
    )
    .orderBy(desc(schema.propertiesTable.appraisedValue))
    .limit(limit * 3);

  const bySuburb = new Map<string, OffMarketSeedProperty[]>();
  for (const row of rows) {
    const suburb = row.suburb ?? "Other";
    const list = bySuburb.get(suburb) ?? [];
    list.push({
      ...row,
      images: (row.images as string[] | null) ?? [],
    });
    bySuburb.set(suburb, list);
  }

  const picked: OffMarketSeedProperty[] = [];
  const suburbs = [...bySuburb.keys()];
  let round = 0;
  while (picked.length < limit && suburbs.length > 0) {
    for (const suburb of suburbs) {
      const list = bySuburb.get(suburb);
      const next = list?.[round];
      if (next && !picked.some((p) => p.id === next.id)) {
        picked.push(next);
        if (picked.length >= limit) break;
      }
    }
    round++;
    if (round > 20) break;
  }

  return picked.slice(0, limit);
}

export async function seedOffMarketProperties(
  db: NodePgDatabase<typeof schema>,
  options: OffMarketSeedOptions = {},
): Promise<{ inserted: number }> {
  const limit = options.limit ?? 20;
  const clearExisting = options.clearExisting ?? true;

  const sources = await selectOffMarketSeedSources(db, limit);
  if (sources.length === 0) {
    return { inserted: 0 };
  }

  if (clearExisting) {
    await db.delete(schema.offMarketPropertiesTable);
  }

  const rows = sources.map((source, i) =>
    buildOffMarketRow(source, i, options.agentId ?? null),
  );

  await db.insert(schema.offMarketPropertiesTable).values(rows);

  return { inserted: rows.length };
}
