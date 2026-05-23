import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── LGAs ─────────────────────────────────────────────────────────────────────
export const lgasTable = pgTable("lgas", {
  lgaId: text("lga_id").primaryKey(),
  lgaName: text("lga_name").notNull(),
  state: text("state").notNull(),
});

// ── Suburbs ───────────────────────────────────────────────────────────────────
export const suburbsTable = pgTable("suburbs", {
  id: serial("id").primaryKey(),
  suburbId: text("suburb_id").unique(), // ssc_id in properties
  lgaId: text("lga_id").references(() => lgasTable.lgaId),
  name: text("name").notNull(),
  state: text("state"),
  population: integer("population"),
  areaSizeKm2: text("area_size_km2"),
  crimeRank: integer("crime_rank"),
  violentPer1000: real("violent_per_1000"),
  propertyPer1000: real("property_per_1000"),
  crimeTrendSummary: text("crime_trend_summary"),
  dataPeriod: text("data_period"),
  url: text("url"),
  scrapedAt: text("scraped_at"),
});

// ── Schools ───────────────────────────────────────────────────────────────────
export const schoolsTable = pgTable("schools", {
  id: serial("id").primaryKey(),
  lgaId: text("lga_id").references(() => lgasTable.lgaId),
  suburbId: text("suburb_id").references(() => suburbsTable.suburbId),
  name: text("name").notNull(),
  type: text("type"), // primary | secondary | combined
  sector: text("sector"), // government | catholic | independent
  suburb: text("suburb"),
  specialSchool: boolean("special_school"),
  campusType: text("campus_type"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

// ── Properties ────────────────────────────────────────────────────────────────
export const propertiesTable = pgTable("properties", {
  id: text("id").primaryKey(),
  lgaId: text("lga_id").references(() => lgasTable.lgaId),
  suburbId: text("suburb_id").references(() => suburbsTable.suburbId), // maps to ssc_id in the raw data
  lgaName: text("lga_name"),
  address: text("address"),
  suburb: text("suburb"),
  state: text("state"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces"),
  landSize: integer("land_size"),
  price: integer("price"),
  priceDisplay: text("price_display"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  url: text("url"),
  created: timestamp("created", { withTimezone: true }),
  days: integer("days"),
  // Appraisal / scoring
  appraisedValue: integer("appraised_value"),
  appraisedRent: integer("appraised_rent"),
  grossYield: real("gross_yield"),
  sa1Yield: real("sa1_yield"),
  sa1Rent: integer("sa1_rent"),
  confidenceScore: integer("confidence_score"),
  rScore: integer("r_score"),
  overallScore: integer("overall_score"),
  overallPerc: integer("overall_perc"),
  sweetspot: integer("sweetspot"),
  sweetspotScore: integer("sweetspot_score"),
  distress: integer("distress"),
  distressScore: integer("distress_score"),
  ownerOccupiers: integer("owner_occupiers"),
  privateRenters: integer("private_renters"),
  ooPerc: real("oo_perc"),
  underOffer: integer("under_offer"),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const lgasRelations = relations(lgasTable, ({ many }) => ({
  suburbs: many(suburbsTable),
  schools: many(schoolsTable),
  properties: many(propertiesTable),
}));

export const suburbsRelations = relations(suburbsTable, ({ one, many }) => ({
  lga: one(lgasTable, {
    fields: [suburbsTable.lgaId],
    references: [lgasTable.lgaId],
  }),
  schools: many(schoolsTable),
  properties: many(propertiesTable),
}));

export const schoolsRelations = relations(schoolsTable, ({ one }) => ({
  lga: one(lgasTable, {
    fields: [schoolsTable.lgaId],
    references: [lgasTable.lgaId],
  }),
  suburb: one(suburbsTable, {
    fields: [schoolsTable.suburbId],
    references: [suburbsTable.suburbId],
  }),
}));

export const propertiesRelations = relations(propertiesTable, ({ one, many }) => ({
  lga: one(lgasTable, {
    fields: [propertiesTable.lgaId],
    references: [lgasTable.lgaId],
  }),
  suburb: one(suburbsTable, {
    fields: [propertiesTable.suburbId],
    references: [suburbsTable.suburbId],
  }),
  shortlists: many(shortlistsTable),
}));

// ── Buyer Briefs ──────────────────────────────────────────────────────────────
export const buyerBriefsTable = pgTable("buyer_briefs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id"),
  clientName: text("client_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  contactMethod: text("contact_method").default("email"),
  engagementType: text("engagement_type").default("full-service"),
  preApprovalStatus: text("pre_approval_status").default("Not Started"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  buyerType: text("buyer_type").default("owner-occupier"),
  propertyTypes: jsonb("property_types").$type<string[]>().default([]),
  minBeds: integer("min_beds").default(1),
  minBaths: integer("min_baths").default(1),
  parking: text("parking").default("nice_to_have"),
  suburbs: jsonb("suburbs").$type<string[]>().default([]),
  mustHaves: jsonb("must_haves").$type<string[]>().default([]),
  dealBreakers: jsonb("deal_breakers").$type<string[]>().default([]),
  urgency: text("urgency").default("3 months"),
  purchasePurpose: text("purchase_purpose").default("PPOR"),
  auctionWillingness: boolean("auction_willingness").default(true),
  status: text("status").default("searching"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Shortlists ────────────────────────────────────────────────────────────────
export const shortlistsTable = pgTable("shortlists", {
  id: serial("id").primaryKey(),
  briefId: integer("brief_id").references(() => buyerBriefsTable.id),
  propertyId: text("property_id").references(() => propertiesTable.id),
  agentNote: text("agent_note"),
  status: text("status").default("shortlisted"),
  feedbackStatus: text("feedback_status").default("new"),
  feedbackText: text("feedback_text"),
  feedbackReason: text("feedback_reason"),
  sharedAt: timestamp("shared_at", { withTimezone: true }),
  feedbackAt: timestamp("feedback_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── User Actions ──────────────────────────────────────────────────────────────
export const userActionsTable = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────
export const buyerBriefsRelations = relations(buyerBriefsTable, ({ many }) => ({
  shortlists: many(shortlistsTable),
}));

export const shortlistsRelations = relations(shortlistsTable, ({ one }) => ({
  brief: one(buyerBriefsTable, {
    fields: [shortlistsTable.briefId],
    references: [buyerBriefsTable.id],
  }),
  property: one(propertiesTable, {
    fields: [shortlistsTable.propertyId],
    references: [propertiesTable.id],
  }),
}));
