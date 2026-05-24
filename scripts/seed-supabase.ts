import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

import {
  computeDemoMatch,
  demoBriefs,
  demoCMARecords,
  demoProperties,
  demoProfiles,
  demoRisks,
  demoShortlists,
  getMatchScores,
} from "../src/lib/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "password123";

async function ensureUser(email: string, fullName: string) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (created.user) return created.user.id;

  if (!createError?.message.toLowerCase().includes("already")) {
    throw createError;
  }

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const existing = data.users.find((user) => user.email === email);
  if (!existing) throw new Error(`Could not find existing user ${email}`);
  return existing.id;
}

async function upsert(table: string, rows: unknown[], label: string) {
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw new Error(`${label}: ${error.message}`);
  console.log(`Seeded ${label}: ${rows.length}`);
}

async function main() {
  const agentId = await ensureUser("agent@demo.com", "Jess Morgan");
  const clientId = await ensureUser("sarah@demo.com", "Sarah Chen");

  await upsert("profiles", [
    { ...demoProfiles[0], id: agentId },
    { ...demoProfiles[1], id: clientId },
  ], "profiles");

  const briefIdMap = new Map(demoBriefs.map((brief) => [brief.id, crypto.randomUUID()]));
  const propertyIdMap = new Map(demoProperties.map((property) => [property.id, crypto.randomUUID()]));
  const shortlistIdMap = new Map(demoShortlists.map((shortlist) => [shortlist.id, crypto.randomUUID()]));

  await upsert("properties", demoProperties.map((property) => ({
    id: propertyIdMap.get(property.id),
    canonical_address: property.canonical_address,
    suburb: property.suburb,
    state: property.state,
    postcode: property.postcode,
    property_type: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    car_spaces: property.car_spaces,
    land_size_sqm: property.land_size_sqm,
    floor_area_sqm: property.floor_area_sqm,
    main_image_url: property.main_image_url,
    listing_price: property.listing_price,
    listing_price_text: property.listing_price_text,
    listing_source: property.listing_source,
    listing_url: property.listing_url,
    listed_date: property.listed_date,
    raw_data: property.raw_data,
  })), "properties");

  await upsert("buyer_briefs", demoBriefs.map((brief) => ({
    id: briefIdMap.get(brief.id),
    agent_id: agentId,
    client_id: clientId,
    client_name: brief.client_name,
    status: brief.status,
    budget_min: brief.budget_min,
    budget_max: brief.budget_max,
    property_types: brief.property_types,
    preferred_suburbs: brief.preferred_suburbs,
    min_bedrooms: brief.min_bedrooms,
    min_bathrooms: brief.min_bathrooms,
    parking: brief.parking,
    must_haves: brief.must_haves,
    deal_breakers: brief.deal_breakers,
    finance_status: brief.finance_status,
    created_at: brief.created_at,
    updated_at: brief.updated_at,
  })), "buyer_briefs");

  await upsert("cma_records", demoCMARecords.map((record) => ({
    property_id: propertyIdMap.get(record.property_id),
    comparable_address: record.comparable_address,
    sale_price: record.sale_price,
    sale_date: record.sale_date,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    property_type: record.property_type,
    land_size_sqm: record.land_size_sqm,
    price_per_sqm: record.price_per_sqm,
    distance_km: record.distance_km,
    notes: record.notes,
  })), "cma_records");

  await upsert("risk_overlays", demoRisks.map((risk) => ({
    property_id: propertyIdMap.get(risk.property_id),
    risk_type: risk.risk_type,
    risk_level: risk.risk_level,
    description: risk.description,
  })), "risk_overlays");

  const matches = demoBriefs.flatMap((brief) => demoProperties.map((property) => computeDemoMatch(property, brief)));
  await upsert("match_scores", matches.map((match) => ({
    brief_id: briefIdMap.get(match.brief_id),
    property_id: propertyIdMap.get(match.property_id),
    match_score: match.match_score,
    match_reasons: match.match_reasons,
    budget_match: match.budget_match,
    suburb_match: match.suburb_match,
    type_match: match.type_match,
    features_match: match.features_match,
  })), "match_scores");

  await upsert("shortlists", demoShortlists.map((shortlist) => ({
    id: shortlistIdMap.get(shortlist.id),
    buyer_brief_id: briefIdMap.get(shortlist.buyer_brief_id),
    property_id: propertyIdMap.get(shortlist.property_id),
    client_id: clientId,
    agent_note: shortlist.agent_note,
    shared_at: shortlist.shared_at,
    viewed_at: shortlist.viewed_at,
    feedback_status: shortlist.feedback_status,
    feedback_text: shortlist.feedback_text,
    feedback_at: shortlist.feedback_at,
    created_at: shortlist.created_at,
  })), "shortlists");

  console.log(`Prepared ${getMatchScores().length} deterministic match scores.`);
  console.log("Demo users: agent@demo.com / password123 and sarah@demo.com / password123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
