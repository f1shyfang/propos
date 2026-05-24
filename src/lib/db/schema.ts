import { boolean, index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Better Auth tables ────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  organization: text("organization"),
  role: text("role").notNull().default("agent"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

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
  suburbCode: text("suburb_code"),
  images: jsonb("images").$type<string[]>().default([]),
});

// ── CMA Records (comparable sales per subject property — see docs/DATA-MODEL.md §1d)
export const cmaRecordsTable = pgTable(
  "cma_records",
  {
    id: serial("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => propertiesTable.id, { onDelete: "cascade" }),
    comparableAddress: text("comparable_address"),
    salePrice: integer("sale_price"),
    saleDate: timestamp("sale_date", { withTimezone: true }),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    landSizeSqm: integer("land_size_sqm"),
    pricePerSqm: real("price_per_sqm"),
    distanceKm: real("distance_km"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("cma_records_property_id_idx").on(table.propertyId)],
);

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
  cmaRecords: many(cmaRecordsTable),
}));

export const cmaRecordsRelations = relations(cmaRecordsTable, ({ one }) => ({
  property: one(propertiesTable, {
    fields: [cmaRecordsTable.propertyId],
    references: [propertiesTable.id],
  }),
}));

// ── Buyer Briefs ──────────────────────────────────────────────────────────────
export const buyerBriefsTable = pgTable("buyer_briefs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id"),
  clientUserId: text("client_user_id").references(() => user.id),
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

// ── Intake transcriptions (audio/text → parsed brief audit trail) ─────────────
export const intakeTranscriptionsTable = pgTable("intake_transcriptions", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id"),
  source: text("source").notNull(), // "audio" | "text"
  originalFilename: text("original_filename"),
  rawTranscript: text("raw_transcript").notNull(),
  parsedJson: jsonb("parsed_json").$type<Record<string, unknown>>(),
  briefId: integer("brief_id").references(() => buyerBriefsTable.id),
  status: text("status").notNull().default("parsed"), // "parsed" | "saved" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Shortlists ────────────────────────────────────────────────────────────────
export const shortlistsTable = pgTable(
  "shortlists",
  {
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
  },
  (table) => [
    uniqueIndex("shortlists_brief_property_unique").on(table.briefId, table.propertyId),
  ],
);

// ── Deals ─────────────────────────────────────────────────────────────────────
export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  briefId: integer("brief_id").references(() => buyerBriefsTable.id),
  propertyId: text("property_id").references(() => propertiesTable.id),
  status: text("status").default("suggested"),
  offerSubState: text("offer_sub_state"),
  offerAmount: integer("offer_amount"),
  offerConditions: jsonb("offer_conditions").$type<string[]>().default([]),
  settlementDate: timestamp("settlement_date", { withTimezone: true }),
  exchangeDate: timestamp("exchange_date", { withTimezone: true }),
  isAuction: boolean("is_auction").default(false),
  priority: text("priority").default("standard"),
  listingAgentName: text("listing_agent_name"),
  listingAgentPhone: text("listing_agent_phone"),
  listingAgentEmail: text("listing_agent_email"),
  strategyNotes: text("strategy_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dealChecklistItemsTable = pgTable("deal_checklist_items", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => dealsTable.id),
  title: text("title").notNull(),
  assignee: text("assignee"),
  dayOffset: integer("day_offset"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dealMilestonesTable = pgTable("deal_milestones", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => dealsTable.id),
  title: text("title").notNull(),
  dayOffset: integer("day_offset"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").default("pending"),
  notes: text("notes"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dealContactsTable = pgTable("deal_contacts", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => dealsTable.id),
  role: text("role").notNull(),
  name: text("name"),
  company: text("company"),
  phone: text("phone"),
  email: text("email"),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dealDocumentsTable = pgTable("deal_documents", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => dealsTable.id),
  filename: text("filename").notNull(),
  tag: text("tag"),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by"),
  clientVisible: boolean("client_visible").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Off-Market Hub ────────────────────────────────────────────────────────────
export const offMarketPropertiesTable = pgTable("off_market_properties", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id"),
  address: text("address").notNull(),
  suburb: text("suburb").notNull(),
  state: text("state"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces"),
  landSize: integer("land_size"),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  sourceType: text("source_type").default("other"),
  sellingAgentName: text("selling_agent_name"),
  sellingAgentPhone: text("selling_agent_phone"),
  sellingAgentEmail: text("selling_agent_email"),
  howSourced: text("how_sourced"),
  accessStatus: text("access_status").default("not_inspected"),
  vendorMotivation: text("vendor_motivation").default("unknown"),
  expectedListingDate: timestamp("expected_listing_date", { withTimezone: true }),
  internalNotes: text("internal_notes"),
  confidential: boolean("confidential").default(false),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Beta signups ──────────────────────────────────────────────────────────────
export const betaSignupsTable = pgTable("beta_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
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

export const dealsRelations = relations(dealsTable, ({ one, many }) => ({
  brief: one(buyerBriefsTable, { fields: [dealsTable.briefId], references: [buyerBriefsTable.id] }),
  property: one(propertiesTable, { fields: [dealsTable.propertyId], references: [propertiesTable.id] }),
  checklistItems: many(dealChecklistItemsTable),
  milestones: many(dealMilestonesTable),
  contacts: many(dealContactsTable),
  documents: many(dealDocumentsTable),
}));

export const dealChecklistItemsRelations = relations(dealChecklistItemsTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [dealChecklistItemsTable.dealId], references: [dealsTable.id] }),
}));

export const dealMilestonesRelations = relations(dealMilestonesTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [dealMilestonesTable.dealId], references: [dealsTable.id] }),
}));

export const dealContactsRelations = relations(dealContactsTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [dealContactsTable.dealId], references: [dealsTable.id] }),
}));

export const dealDocumentsRelations = relations(dealDocumentsTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [dealDocumentsTable.dealId], references: [dealsTable.id] }),
}));
