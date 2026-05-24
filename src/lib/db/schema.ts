import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, customType, varchar, smallint, numeric, date, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Custom PostGIS Types ──────────────────────────────────────────────────────
const geometryPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
});

const geometryMultiPolygon = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(MultiPolygon, 4326)';
  },
});

const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(Geometry, 4326)';
  },
});

// ── Better Auth tables ────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  organization: text("organization"),
  role: text("role").default("agent"), // agent, client, admin
  agencyId: text("agency_id"),
  phone: text("phone"),
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

// ── Spatial Source Tables (Open Data Overlays) ────────────────────────────────
export const floodZonesTable = pgTable("flood_zones", {
  id: text("id").primaryKey(), // uuid
  name: text("name").notNull(),
  riskLevel: text("risk_level").notNull(), // low, moderate, high, extreme
  source: text("source").notNull(),
  sourceId: text("source_id"),
  boundary: geometryMultiPolygon("boundary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bushfireAreasTable = pgTable("bushfire_areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  boundary: geometryMultiPolygon("boundary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const heritageOverlaysTable = pgTable("heritage_overlays", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // heritage_conservation_area, individual_place, archaeological
  source: text("source").notNull(),
  sourceId: text("source_id"),
  boundary: geometryMultiPolygon("boundary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const schoolZonesTable = pgTable("school_zones", {
  id: text("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  schoolType: text("school_type").notNull(), // primary, secondary, combined
  source: text("source").notNull(),
  boundary: geometryMultiPolygon("boundary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

export const suburbDemographicsTable = pgTable("suburb_demographics", {
  suburb: text("suburb").notNull(),
  state: text("state").notNull(),
  postcode: varchar("postcode", { length: 4 }).notNull(),
  medianHouseholdIncome: integer("median_household_income"),
  ownerOccupiedPct: numeric("owner_occupied_pct", { precision: 5, scale: 2 }),
  population: integer("population"),
  dataSource: text("data_source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
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

// ── G-NAF Addresses ───────────────────────────────────────────────────────────
export const gnafAddressesTable = pgTable("gnaf_addresses", {
  gnafPid: varchar("gnaf_pid", { length: 14 }).primaryKey(),
  buildingName: varchar("building_name", { length: 200 }),
  unitNumber: varchar("unit_number", { length: 20 }),
  streetNumber: varchar("street_number", { length: 20 }),
  streetName: varchar("street_name", { length: 200 }),
  streetType: varchar("street_type", { length: 20 }),
  locality: varchar("locality", { length: 100 }),
  postcode: varchar("postcode", { length: 4 }),
  state: varchar("state", { length: 3 }),
  location: geometryPoint("location"),
});

// ── Properties ────────────────────────────────────────────────────────────────
export const propertiesTable = pgTable("properties", {
  id: text("id").primaryKey(),
  gnafPid: varchar("gnaf_pid", { length: 14 }),
  canonicalAddress: text("canonical_address"),
  unitNumber: varchar("unit_number", { length: 20 }),
  streetNumber: varchar("street_number", { length: 20 }),
  streetName: varchar("street_name", { length: 200 }),
  streetType: varchar("street_type", { length: 20 }),
  postcode: varchar("postcode", { length: 4 }),
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
  floorAreaSqm: numeric("floor_area_sqm", { precision: 10, scale: 1 }),
  price: integer("price"),
  priceDisplay: text("price_display"),
  listingPriceText: text("listing_price_text"),
  listingSource: text("listing_source").default("manual"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location: geometryPoint("location"), // PostGIS Point
  boundary: geometryMultiPolygon("boundary"), // PostGIS Cadastral
  url: text("url"),
  created: timestamp("created", { withTimezone: true }),
  days: integer("days"),
  soldDate: date("sold_date"),
  soldPrice: integer("sold_price"),
  saleType: varchar("sale_type", { length: 30 }),
  transferType: varchar("transfer_type", { length: 30 }),
  
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
  
  // Financials & Investment
  propertyFinancials: jsonb("property_financials").$type<{
    strataAdminFundQuarterly?: number;
    strataCapitalWorksQuarterly?: number;
    councilRatesAnnual?: number;
    waterRatesQuarterly?: number;
    specialLeviesActive?: boolean;
    specialLeviesDescription?: string;
  }>().default({}),
  investmentMetrics: jsonb("investment_metrics").$type<{
    rentalAppraisalMin?: number;
    rentalAppraisalMax?: number;
    grossYieldEstimate?: number;
  }>().default({}),
  
  images: jsonb("images").$type<string[]>().default([]),
  rawData: jsonb("raw_data").default({}),
});

export const propertyRisksTable = pgTable("property_risks", {
  id: text("id").primaryKey(), // uuid
  propertyId: text("property_id").notNull().references(() => propertiesTable.id, { onDelete: "cascade" }),
  riskType: text("risk_type").notNull(), // flood, bushfire, heritage_overlay, etc.
  riskLevel: text("risk_level").notNull(), // low, moderate, high, extreme
  description: text("description"),
  sourceData: jsonb("source_data").default({}),
  intersectionGeometry: geometry("intersection_geometry"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const propertyHistoryTable = pgTable("property_history", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull().references(() => propertiesTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // listed, price_change, sold, passed_in, withdrawn
  salePrice: integer("sale_price"),
  saleDate: date("sale_date"),
  saleType: text("sale_type"),
  source: text("source"),
  rawEvent: jsonb("raw_event").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Selling Agents CRM ────────────────────────────────────────────────────────
export const sellingAgentsTable = pgTable("selling_agents", {
  id: text("id").primaryKey(),
  buyerAgencyId: text("buyer_agency_id"),
  name: text("name").notNull(),
  agencyName: text("agency_name"),
  phone: text("phone"),
  email: text("email"),
  negotiationStyle: text("negotiation_style"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Buyer Briefs ──────────────────────────────────────────────────────────────
export const buyerBriefsTable = pgTable("buyer_briefs", {
  id: serial("id").primaryKey(),
  agencyId: text("agency_id"),
  agentId: text("agent_id"),
  clientId: text("client_id"),
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

// ── Shortlists & Suggestions ──────────────────────────────────────────────────
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

export const clientSuggestionsTable = pgTable("client_suggestions", {
  id: serial("id").primaryKey(),
  briefId: integer("brief_id").references(() => buyerBriefsTable.id),
  url: text("url").notNull(),
  propertyId: text("property_id").references(() => propertiesTable.id),
  clientId: text("client_id"),
  status: text("status").default("pending_review"), // pending_review, approved_to_shortlist, dismissed_by_agent
  agentFeedback: text("agent_feedback"),
  clientNote: text("client_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Deals & Offers ────────────────────────────────────────────────────────────
export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  briefId: integer("brief_id").references(() => buyerBriefsTable.id),
  propertyId: text("property_id").references(() => propertiesTable.id),
  sellingAgentId: text("selling_agent_id").references(() => sellingAgentsTable.id),
  status: text("status").default("suggested"), // suggested, inspected, due_diligence, offer_made, under_contract, unconditional, accepted, settled, lost
  
  // Legacy fields preserved for MVP compatibility
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
  contractPrice: integer("contract_price"),
  stageHistory: jsonb("stage_history").$type<any[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dealOffersTable = pgTable("deal_offers", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => dealsTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  depositPercentage: numeric("deposit_percentage", { precision: 5, scale: 2 }),
  depositAmount: integer("deposit_amount"),
  settlementDays: integer("settlement_days"),
  conditions: jsonb("conditions").$type<string[]>().default([]),
  status: text("status").default("draft"), // draft, submitted, countered, accepted, rejected
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
  category: text("category"), // contract, section32, building_report, pest_report, etc.
  s3Key: text("s3_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => dealsTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").default("draft"), // draft, sent, paid, void
  dueDate: timestamp("due_date", { withTimezone: true }),
  generatedPdfUrl: text("generated_pdf_url"),
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

// ── User Actions & Auditing ───────────────────────────────────────────────────
export const userActionsTable = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data").default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(), // e.g., 'brief.created', 'deal.stage_changed'
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changes: jsonb("changes").default({}), // { before: {...}, after: {...} }
  ipAddress: text("ip_address"), // INET ideally, but text works for compatibility
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const privacyConsentsTable = pgTable("privacy_consents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // privacy_policy, marketing, data_sharing
  consentedAt: timestamp("consented_at", { withTimezone: true }).defaultNow(),
  policyVersion: text("policy_version").notNull(),
  ipAddress: text("ip_address"),
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
  risks: many(propertyRisksTable),
  history: many(propertyHistoryTable),
}));

export const propertyRisksRelations = relations(propertyRisksTable, ({ one }) => ({
  property: one(propertiesTable, {
    fields: [propertyRisksTable.propertyId],
    references: [propertiesTable.id],
  }),
}));

export const propertyHistoryRelations = relations(propertyHistoryTable, ({ one }) => ({
  property: one(propertiesTable, {
    fields: [propertyHistoryTable.propertyId],
    references: [propertiesTable.id],
  }),
}));

export const buyerBriefsRelations = relations(buyerBriefsTable, ({ many }) => ({
  shortlists: many(shortlistsTable),
  clientSuggestions: many(clientSuggestionsTable),
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

export const clientSuggestionsRelations = relations(clientSuggestionsTable, ({ one }) => ({
  brief: one(buyerBriefsTable, {
    fields: [clientSuggestionsTable.briefId],
    references: [buyerBriefsTable.id],
  }),
  property: one(propertiesTable, {
    fields: [clientSuggestionsTable.propertyId],
    references: [propertiesTable.id],
  }),
}));

export const dealsRelations = relations(dealsTable, ({ one, many }) => ({
  brief: one(buyerBriefsTable, { fields: [dealsTable.briefId], references: [buyerBriefsTable.id] }),
  property: one(propertiesTable, { fields: [dealsTable.propertyId], references: [propertiesTable.id] }),
  sellingAgent: one(sellingAgentsTable, { fields: [dealsTable.sellingAgentId], references: [sellingAgentsTable.id] }),
  offers: many(dealOffersTable),
  checklistItems: many(dealChecklistItemsTable),
  milestones: many(dealMilestonesTable),
  contacts: many(dealContactsTable),
  documents: many(dealDocumentsTable),
  invoices: many(invoicesTable),
}));

export const invoicesRelations = relations(invoicesTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [invoicesTable.dealId], references: [dealsTable.id] }),
}));

export const dealOffersRelations = relations(dealOffersTable, ({ one }) => ({
  deal: one(dealsTable, { fields: [dealOffersTable.dealId], references: [dealsTable.id] }),
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

export const sellingAgentsRelations = relations(sellingAgentsTable, ({ many }) => ({
  deals: many(dealsTable),
}));
