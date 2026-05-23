# 08 — Feature Specifications

## Document Purpose

This document specifies every feature across all six phases of the Buyer's Agent SaaS platform. Each feature is described with user stories, data requirements, business logic, dependencies, and acceptance criteria. The platform is purpose-built for sole operators and small Australian BA agencies (2–10 agents).

---

## Phase 1: CRM & Buyer Brief (Intake)

The intake phase captures everything known about a buyer before a single property is sourced. It replaces spreadsheets, notebooks, and scattered email threads with a structured system of record.

---

### 1.1 Dynamic Buyer Brief Form

**User Story:** As a buyer's agent, I want to create a comprehensive buyer brief through a dynamic, multi-section form so that I capture every client requirement in one structured place and never miss critical details.

**Input Fields / Data Requirements:**

| Section | Fields |
|---|---|
| **Basic Info** | Client name(s), contact phone, contact email, preferred contact method (phone/email/SMS), referral source |
| **Property Requirements** | Property type (house, apartment, townhouse, villa unit, duplex, acreage, vacant land), minimum bedrooms, minimum bathrooms, minimum car spaces, land size range (sqm), minimum living area (sqm), preferred construction style (single-storey, double-storey, character, modern), pool (must-have/nice-to-have/not wanted) |
| **Location** | Preferred suburbs (multi-select with priority ranking), excluded suburbs, radius tolerance from target suburb (km), school zone requirements (specific primary/secondary schools or "any in top N NAPLAN"), proximity to public transport (distance in metres), proximity to specific amenities |
| **Budget** | Max purchase price, target purchase price, deposit amount available, pre-approval status (linked to Finance Tracking), buyer type (first-home buyer, investor, upsizer, downsizer, SMSF purchaser) |
| **Timeline** | Desired purchase date (or range), urgency level (immediate/3 months/6 months/12 months/no fixed timeline), must-settle-by date if applicable (e.g. lease expiry, school enrolment) |
| **Strategy & Goals** | Purchase purpose (PPOR — principal place of residence, investment, SMSF purchase, rentvesting), desired yield range (for investors), capital growth expectations, renovation appetite, future plans linked to Strategy Builder |
| **Tradeoffs & Dislikes** | Must-have features, deal-breakers, willing-to-compromise features, specific dislikes (e.g. no main-road frontage, no west-facing living areas, no split-level) |
| **Administrative** | Engagement type (full-service, sourcing-only, negotiation-only), signed agreement on file (upload, date signed), retainer paid (amount, date, receipt), cooling-off period expiry date |

**Business Logic / Rules:**

- The brief form is sectioned with a progress indicator; each section validates independently.
- Postal address and contact details auto-populate from the Client Profile if already created.
- "Save as Draft" stores partial briefs with no validation; "Submit" requires all mandatory fields (marked with asterisk).
- Briefs can be cloned from a template (agent-created) or from another client's brief to accelerate intake for similar buyer profiles (e.g. repeat investors buying in the same suburb).
- A brief Version History is maintained — each edit increments a minor version, major changes (budget, location) flag a review-required alert on the Agent Dashboard.
- Pre-approval expiry dates are monitored; if a pre-approval is within 30 days of expiry, a renewal-reminder badge appears.

**Dependencies:** Client Profile (1.4), Finance Tracking (1.2), Document Vault (4.4 for signed agreements)

**Acceptance Criteria:**
1. Agent can create a new brief from blank, from template, or by cloning an existing brief.
2. All field sections validate independently; incomplete sections show red indicators.
3. Brief can be saved as draft with zero validation errors.
4. Brief submission requires all mandatory fields; validation errors display inline under each field.
5. Cloned brief carries forward all fields except client identity, date fields, and signed agreements.
6. Brief version history is viewable with who made changes and when.
7. On mobile (tablet), form adapts to a single-column scrollable layout.

---

### 1.2 Finance Tracking

**User Story:** As a buyer's agent, I want to track each client's financial position and pre-approval status so that I never waste time sourcing properties the client cannot afford or finance.

**Input Fields / Data Requirements:**

| Field | Type |
|---|---|
| Pre-approval status | Enum: Not Started, In Progress, Pre-Approved, Formal Approval, Expired |
| Lender / Broker name | Text |
| Broker contact details | Phone, Email |
| Max borrowing capacity | Currency (AUD) |
| Deposit amount | Currency (AUD) |
| Pre-approval reference number | Text |
| Pre-approval date | Date |
| Pre-approval expiry date | Date (auto-calculated +90 days from issue) |
| LMI applicable | Boolean |
| First Home Owner Grant eligible | Boolean (state-specific) |
| Stamp duty exemption/concession eligible | Boolean |
| SMSF lending | Boolean (for SMSF purchases, separate fields for fund name, ABN, trust structure) |
| Notes | Free text |

**Business Logic / Rules:**

- If pre-approval expiry is within 30 days AND client has active briefs, an alert appears on the Agent Dashboard.
- Max purchase price on the buyer brief cannot exceed max borrowing capacity + deposit (a soft warning, not a hard block, as agents may advise on stretch capacity).
- Finance status transitions are logged in an audit trail for compliance (Australian best-interest duty considerations).
- When pre-approval expires and brief status is still "Active", the client record is flagged for follow-up.
- LMI, FHOG, and stamp duty eligibility flags feed into the Investment Calculators (3.3) to auto-configure calculator defaults.

**Dependencies:** Dynamic Buyer Brief Form (1.1), Agent Dashboard (1.5), Investment Calculators (3.3)

**Acceptance Criteria:**
1. Agent can log and update all finance fields from the client profile or brief screen.
2. Status transitions (e.g. "In Progress" → "Pre-Approved") are timestamped and visible in activity audit.
3. Pre-approval expiry ≤ 30 days triggers a dashboard alert with a direct link to the client record.
4. Finance data is exposed via the Client Portal (read-only) if the agent enables finance visibility for that client.

---

### 1.3 Strategy Builder

**User Story:** As a buyer's agent, I want to build and visualise a long-term property strategy roadmap for my client so that I can demonstrate value beyond a single transaction and build a multi-purchase advisory relationship.

**Input Fields / Data Requirements:**

- Starting point: Current equity position, current PPOR value (if any), current investment property values and outstanding loans.
- Purchase roadmap nodes: Each node has — property type, target suburb, target price range, purchase year (projected), purpose (PPOR/Investment).
- Equity growth projections: Annual growth rate assumption (% p.a.), editable per node.
- Cash flow projections: Rental income, holding costs (strata, rates, insurance, water, property management fees), loan repayments.
- Visual output: Timeline layout (horizontal or vertical), node colour coding (green = PPOR, blue = investment, grey = sold), connecting arrows showing equity withdrawal for next deposit.

**Business Logic / Rules:**

- Default growth rate assumption is pulled from suburb-level capital growth data (integrated via CoreLogic or PriceFinder API where available; manual override for agents without subscription).
- When a property is purchased in Phase 6 (Transaction & Settlement), the system prompts the agent to mark which strategy node was achieved, updating the "Actual vs. Projected" comparison view.
- Equity available for next purchase = (current equity × 80% LVR) — existing debt. The system warns if the projected deposit shortfall exceeds 10% of the next target purchase price.
- Strategy can be exported as a branded PDF for client presentations.

**Dependencies:** Client Profile (1.4), Transaction & Settlement (6.1 for actual-vs-projected updates), External data (CoreLogic/PriceFinder API for suburb growth data)

**Acceptance Criteria:**
1. Agent can add, remove, and reorder strategy nodes via drag-and-drop.
2. Timeline auto-layouts horizontally on desktop and vertically on mobile.
3. Equity and cash flow projections calculate automatically from node data; all assumptions are editable.
4. Strategy PDF export includes all nodes, projections, and a disclaimer footer.
5. Historical actual performance (what was purchased vs. what was planned) is displayed in a side-by-side comparison when available.

---

### 1.4 Client Profile

**User Story:** As a buyer's agent, I want a unified client profile that consolidates all contact details, preferences, and relationship context so that I never need to search across multiple tools to understand who my client is.

**Input Fields / Data Requirements:**

| Section | Fields |
|---|---|
| **Identity** | Full name, preferred name, date of birth, TFN (optional, for FHOG), ABN (if buying via SMSF/trust) |
| **Contact** | Primary phone, secondary phone, primary email, secondary email, residential address, postal address |
| **Communication** | Preferred contact method, preferred contact times (business hours/after-hours/weekends), preferred language, communication frequency preference |
| **Relationship** | Relationship manager (assigned agent), date onboarded, engagement type, retainer status, referral source, notes |
| **Co-buyers** | Link to joint buyer profiles (spouse, partner, family member), define decision-making roles (primary decision-maker, secondary, financial contributor only) |
| **Admin** | Client status (Prospect, Active, Inactive, Closed-Won, Closed-Lost), NDIS participant (y/n), tags (custom labels for segmentation) |

**Business Logic / Rules:**

- A client may have multiple buyer briefs (e.g. PPOR brief + investment brief) linked to the same profile.
- Communication preferences drive notification behaviour in Phase 4 (Client Portal) — e.g. SMS for new matches vs. email digest.
- Client status transitions follow a defined workflow: Prospect → Active (retainer paid + agreement signed) → Closed-Won (property settled) or Closed-Lost (engagement ended without purchase). Inactive is a manual override.
- GDPR-equivalent (Australian Privacy Act 1988) data fields: consent for marketing communications, right-to-access flag, data deletion request flag.

**Dependencies:** Dynamic Buyer Brief Form (1.1), Finance Tracking (1.2), Client Portal (Phase 4)

**Acceptance Criteria:**
1. Agent can create, read, update, and archive client profiles.
2. Co-buyer relationships are visualised in a linked-people graph on the profile screen.
3. Client status history is audit-logged with timestamps.
4. Communication preferences sync to notification engine within 5 minutes of change.

---

### 1.5 Agent Dashboard

**User Story:** As a buyer's agent, I want a dashboard that shows me at a glance everything requiring my attention — active clients, pipeline value, and briefs needing action — so that I start every day knowing exactly what to work on.

**Input Fields / Data Requirements:**

Widgets and their data sources:

| Widget | Data Source |
|---|---|
| **Active Clients Counter** | Count of clients with status = "Active" |
| **Pipeline Value** | Sum of max purchase prices of all active briefs |
| **Briefs Needing Action** | Briefs with status "Draft" > 7 days, or briefs with a version flagged for review |
| **Upcoming Milestones** | Settlement milestones within 14 days (linked to Phase 6) |
| **Expiring Pre-Approvals** | Finance records with expiry within 30 days |
| **Recent Activity Stream** | Last 20 actions across all clients (brief updated, match viewed, offer sent, document uploaded) |
| **Revenue Forecast** | Estimated commissions based on engagement type and brief target price (formula: target price × commission rate configurable per engagement) |

**Business Logic / Rules:**

- Pipeline value calculation: SUM of target purchase price for all active briefs. For briefs with a range, use the mid-point.
- Dashboard is role-scoped: agency owner sees all clients; individual agent sees only their assigned clients.
- Widgets are customisable — agents can show/hide and reorder via drag-and-drop.
- Clicking any dashboard widget drills through to the underlying list view (e.g. clicking "Expiring Pre-Approvals" shows a filtered client list).

**Dependencies:** All Phase 1 features, Phase 6 Milestone Tracker (6.1)

**Acceptance Criteria:**
1. Dashboard loads within 2 seconds for an agency with up to 200 active clients.
2. All numeric widgets display as of "now" (no cache older than 5 minutes).
3. Dashboard layout persists per user across sessions.
4. Revenue forecast widget shows this financial year and next financial year estimates.

---

### 1.6 Calendar Integration

**User Story:** As a buyer's agent, I want to sync property-related events with my calendar so that I never miss an open home, auction, inspection, or settlement milestone.

**Input Fields / Data Requirements:**

| Field | Source |
|---|---|
| Calendar provider | Google Calendar, Outlook (OAuth-based) |
| Event types synced | Open home times, private inspection bookings, auction dates, settlement milestones, cooling-off expiry dates, finance clause deadlines, client meetings |
| Sync direction | Two-way — events created in the platform appear in the agent's calendar; events created in the agent's calendar with a recognised property address auto-link |

**Business Logic / Rules:**

- Calendar sync is set up once per agent via OAuth consent flow.
- Event details include property address, client name (if relevant), and a deep link back to the platform record.
- Settlement milestones auto-create calendar events with configurable reminder offsets (default: 7 days, 3 days, 1 day before).
- Auction dates sync with a 1-hour block; open homes use the published time window from the listing.
- The client portal displays upcoming events relevant to that client (open homes, inspections, auction dates) sourced from the agent's shared calendar.
- Calendar sync failures surface as a dashboard notification with a "Reconnect Calendar" link.

**Dependencies:** OAuth provider (Google, Microsoft), Milestone Tracker (6.1), Portal Aggregation (2.1), Auction Tracker (5.2), Client Portal (Phase 4)

**Acceptance Criteria:**
1. Agent authenticates Google or Outlook calendar via OAuth in under 1 minute.
2. New events created in the platform appear in the agent's external calendar within 60 seconds.
3. Settlement countdown milestones auto-create calendar reminders.
4. Client portal shows relevant upcoming events filtered to that client's shortlisted properties and active deals.

---

## Phase 2: Sourcing & Matching Engine

The sourcing engine brings properties into the platform and automatically pairs them with the right buyers.

---

### 2.1 Portal Aggregation

**User Story:** As a buyer's agent, I want to browse residential property listings from Domain (and eventually RealEstate.com.au) inside the platform so that I don't need to toggle between browser tabs and can keep all my sourcing activity in one place.

**Input Fields / Data Requirements:**

| Field | Source |
|---|---|
| Listing ID | Domain API |
| Property address | Domain API |
| Price guide / auction guide | Domain API (display-only, may be "Contact Agent") |
| Property type | Domain API |
| Bedrooms, bathrooms, car spaces | Domain API |
| Land size | Domain API |
| Listing description | Domain API (full text) |
| Agent name, agency, phone, email | Domain API |
| Open for inspection times | Domain API |
| Auction date (if applicable) | Domain API |
| Photo gallery URLs | Domain API |
| Days on market | Calculated from listing date |
| Price change history | Domain API (if available) |
| Is off-market? | Boolean (false for portal listings) |

**Business Logic / Rules:**

- Listings are ingested via scheduled polling of the Domain API (configurable frequency: hourly default, manual refresh on demand).
- Deduplication: If the same address appears from multiple sources, listings are merged based on address normalisation (see Acceptance Criteria).
- Each ingested listing is immediately run through the AI Auto-Matching engine (2.3) to score against all active buyer briefs.
- Listings are displayed in a unified list view with filters: suburb, property type, price range, bedrooms, date listed, match score.
- Agents can save listings to custom collections (equivalent to "watch lists") and assign them to specific clients.
- Listing data is cached for 24 hours; photos are proxied/stored as thumbnails (copyright compliance — full-res images linked to source).
- Australian-specific display: Price display respects auction guide vs. private treaty conventions. "Contact Agent" listings are flagged with an icon.

**Dependencies:** Domain API (external — requires API key and commercial agreement), AI Auto-Matching (2.3), Off-Market Hub (2.2), Match Feed (2.4)

**Acceptance Criteria:**
1. New Domain listings appear in the platform within the configured polling interval.
2. Address normalisation handles "U 3 / 45 Smith St" vs "3/45 Smith Street, Suburb, State, Postcode" as the same property.
3. Agents can filter listings by suburb (multi-select), property type, price range (min-max slider), bedrooms, and match score.
4. Clicking a listing opens a detail view with gallery, description, and agent contact info.
5. Manual refresh is available with a single button; response from external API failures displays a graceful error with retry option.
6. The system handles Domain API rate limits with exponential backoff and a dead-letter queue for failed fetches.

---

### 2.2 Off-Market & Pre-Market Hub

**User Story:** As a buyer's agent, I want to maintain a private database of off-market and pre-market properties that I've sourced through my network so that my clients get access to opportunities not available on public portals.

**Input Fields / Data Requirements:**

All fields from Portal Aggregation (2.1) are applicable, plus:

| Field | Source |
|---|---|
| Source type | Enum: Selling Agent Relationship, Direct Vendor Contact, Word of Mouth, Other |
| Selling agent contact | Linked to Selling Agent CRM (5.3) |
| How sourced | Free text |
| Property access status | Enum: Not Yet Inspected, Inspected, Under Negotiation, Sold, Lost |
| Vendor motivation | Enum: Highly Motivated, Motivated, Testing Market, Unknown |
| Expected listing date (pre-market) | Date |
| Expected price guide | Currency range |
| Internal notes | Free text |
| Photos (agent-taken) | File upload |
| Confidentiality flag | Boolean — restricts visibility to specific agents or the agency owner |

**Business Logic / Rules:**

- Off-market properties are NEVER visible in the Client Portal unless explicitly shared by the agent (unlike portal listings, which appear automatically via matching).
- Each off-market property has a "last contacted" date; if > 30 days since last contact, a follow-up reminder appears.
- Pre-market properties auto-transition to "listed" when matched against a newly ingested portal listing at the same address.
- Confidentiality flag enforces role-based access: if enabled, only the creating agent and agency owner can view the property.
- The hub displays a list view with filter toggles: All, Pre-Market Only, Off-Market Only, My Properties Only, Confidential.

**Dependencies:** Selling Agent CRM (5.3), Portal Aggregation (2.1 for auto-listing detection), Client Portal (4.0 — explicit sharing only)

**Acceptance Criteria:**
1. Agent can create an off-market property record with all specified fields, including photo uploads.
2. Confidentiality-flagged properties are invisible to other agents in the agency (unless agency owner).
3. When a portal listing at the same address is ingested and matched, the off-market record displays a "Now Listed" badge with link to the portal listing.
4. Follow-up reminders trigger when "last contacted" > 30 days and property is still "Available".

---

### 2.3 AI Auto-Matching Engine

**User Story:** As a buyer's agent, I want every new listing to be automatically scored against all active buyer briefs so that I can instantly identify which properties are worth investigating for which clients.

**Input Fields / Data Requirements:**

Inputs to the scoring algorithm:
- **Brief parameters:** Target suburb(s), excluded suburbs, max purchase price, property type, bedrooms (min), bathrooms (min), car spaces (min), land size min/max, living area min, desired features (pool, air-con, etc.), deal-breakers.
- **Listing parameters:** Suburb, listed price (or price guide mid-point), property type, bedrooms, bathrooms, car spaces, land size, living area (if available), features (parsed from description), days on market.

**Business Logic / Rules — Scoring Methodology:**

The match score is a weighted composite (0–100). Weights are configurable per agency and per brief.

| Factor | Weight (default) | Scoring Logic |
|---|---|---|
| **Budget Match** | 30% | Perfect: listed price ≤ max purchase price. Linear decay as listed price exceeds max; 0 score at >110% of max. If price guide is "Contact Agent", uses 15% weight and the remaining 15% redistributes to Location and Features. |
| **Location Match** | 30% | Exact suburb match = 100. Adjacent suburb = 70. Within radius tolerance = 50. Excluded suburb = 0 (and the entire listing score is forced to 0, overriding all other factors). |
| **Property Type** | 10% | Exact match = 100. Broad match (e.g. townhouse vs. villa unit) = 50. Mismatch = 0. If brief says "any" type, score = 100. |
| **Bedrooms / Bathrooms / Car Spaces** | 12% | Each attribute: exact match or above = 100. Each unit below = -25 cumulative (so 1 bedroom short = 75, 2 bedrooms short = 50, etc.). |
| **Land & Living Area** | 8% | Within brief range = 100. Outside range by ≤10% = 70. Outside range by >10% = 30. If no range specified, factor neutralised. |
| **Features & Keywords** | 10% | For each desired feature found in listing description or structured data: +1 point. For each deal-breaker found: -50 points (strong penalty). Normalised to 0–100. |

**Overall Score = Σ (factor_score × weight)**

**Additional Business Rules:**

- Score threshold: Default minimum match score to appear in the Match Feed is 50. Configurable per brief.
- The engine stores the score breakdown per factor for display in the match detail view (so the agent understands *why* a match scored 78).
- Re-matching: When a brief is updated, all active listings are re-scored against that brief within 5 minutes.
- The matching engine runs asynchronously — new listings are queued, scored, and results appear in the Match Feed progressively.
- Manual override: Agent can pin/unpin matches and adjust the displayed score manually with a note.

**Dependencies:** Portal Aggregation (2.1), Off-Market Hub (2.2), Match Feed (2.4), Dynamic Buyer Brief Form (1.1)

**Acceptance Criteria:**
1. Score calculation is deterministic — the same brief + listing always produces the same score.
2. Excluded suburb produces a score of 0 regardless of all other factors.
3. Score breakdown (per factor) is viewable from the Match Feed detail view.
4. Brief updates trigger re-scoring against all active listings within 5 minutes.
5. Score weights are configurable at the agency level (global default) and overridable per brief.
6. Performance: 1,000 listings scored against 200 briefs completes within 30 seconds.

---

### 2.4 Match Feed

**User Story:** As a buyer's agent, I want a chronological feed of new property matches scored against my clients' briefs so that I can quickly triage which properties to inspect and present to which clients.

**Input Fields / Data Requirements:**

Each match item displays:

| Field | Source |
|---|---|
| Property thumbnail | Listing data |
| Address (abbreviated until expanded) | Listing data |
| Client name(s) the property matches | Brief data |
| Match score (overall) | AI Auto-Matching Engine |
| Match score trend (↑ same property re-scored higher after brief update) | Historical match records |
| Matched date & time | System timestamp |
| Price guide | Listing data |
| Key matching factors (e.g. "Budget ✓ Location ✓ 3+ Bed ✓") | Score breakdown |
| Brief action buttons | UI |

**Business Logic / Rules:**

- Feed is filterable by: Client, suburb, score range, property type, listing source (portal/off-market), and status (new/reviewed/snoozed).
- Match status workflow: New → Reviewed → Shortlisted or Dismissed.
- "Snooze" action: Hide match for 7 days (e.g. property under contract but not yet sold).
- Matches can be bulk-selected and assigned to a client's shortlist (Phase 4) with one action.
- An agent viewing matches for Client A should not see matches for Client B unless they have access to both clients.
- Feed supports "group by client" view: shows each client as a card with their top 3 matches, expanding on click.

**Dependencies:** AI Auto-Matching Engine (2.3), Client Shortlists (4.2)

**Acceptance Criteria:**
1. New matches appear at the top of the feed within 1 minute of listing ingestion + scoring.
2. Feed is filterable by all specified dimensions; combined filters use AND logic.
3. Match status transitions are persisted and reflect in the feed colour coding (new = bold, reviewed = normal weight, dismissed = grey).
4. Bulk actions (shortlist 10 matches, dismiss 10 matches) complete within 2 seconds.
5. Infinite scroll loads matches in batches of 50 without jank on desktop and tablet.

---

### 2.5 Selling Agent Outreach

**User Story:** As a buyer's agent, I want to send professional, trackable outreach emails and SMS to selling agents about properties matching my clients' briefs so that I build relationships, get early access to listings, and advocate for my buyers.

**Input Fields / Data Requirements:**

| Field | Source |
|---|---|
| Selling agent name | Portal Aggregation or Selling Agent CRM (5.3) |
| Selling agent email & phone | Portal Aggregation or Selling Agent CRM (5.3) |
| Email template | Agent-configured templates with merge fields |
| SMS template | Agent-configured templates |
| Anonymised buyer brief snippet | Auto-generated from brief data |
| Property address (context) | The listing being queried |
| Campaign tracking | Open rate (email), click rate (email), response received (manual flag), follow-up date |

**Business Logic / Rules:**

- Template merge fields: `{{buyer_type}}` (e.g. "first-home buyer"), `{{budget_range}}`, `{{target_suburbs}}`, `{{property_type}}`, `{{agent_name}}`, `{{agency_name}}`, `{{agent_phone}}`, `{{agent_email}}`.
- Anonymised buyer brief snippet auto-generates: "Professional couple seeking a 3-bedroom home in [suburb], budget to [price], pre-approved and ready to purchase." Never includes client name, exact budget, or contact details.
- Email sending uses a transactional email service (SendGrid, SES); all outbound emails are logged to the client's activity feed (4.5).
- SMS sending uses an Australian SMS gateway (Twilio AU, SMS Central) with compliance for Australian spam laws (Spam Act 2003 — must include opt-out, sender identification).
- Campaign tracking: Each outreach is linked to a "campaign" (one campaign = one property being queried on behalf of one or more clients).
- The system prevents sending duplicate outreach to the same selling agent about the same property within 48 hours.

**Dependencies:** Portal Aggregation (2.1), Selling Agent CRM (5.3), Activity Feed (4.5)

**Acceptance Criteria:**
1. Agent can select a template, preview with merged data, and send with one click.
2. Anonymised buyer brief snippets are generated correctly with no PII leakage.
3. Email open tracking works via embedded tracking pixel.
4. All outreach is logged with timestamp, recipient, template used, and delivery status.
5. SMS messages include mandatory opt-out language and are limited to 160-character segments with auto-split.

---

## Phase 3: Due Diligence & Research

This phase transforms raw listing data into actionable intelligence — the core value proposition of a buyer's agent.

---

### 3.1 Integrated Comparative Market Analysis (CMA)

**User Story:** As a buyer's agent, I want to generate a Comparative Market Analysis for any property by pulling recent comparable sales and presenting them with key metrics on a map so that I can advise my client on fair market value and produce professional reports.

**Input Fields / Data Requirements:**

| Field | Source |
|---|---|
| Subject property address | Listing data or manual entry |
| Subject property attributes | Listing data: bedrooms, bathrooms, land size, living area |
| Comparable sales | External data API (PriceFinder, CoreLogic, or Domain API sold section) |
| Number of comparables | Agent-configurable (default 5) |
| Date range for comparables | Agent-configurable (default: last 6 months) |
| Radius for comparables | Agent-configurable (default: 2 km) |

**CMA Output Metrics per Comparable:**

- Address (abbreviated), sale date, sale price
- Price per sqm (land) and price per sqm (living area, if available)
- Bedrooms, bathrooms, car spaces, land size, property type
- Days on market (if listed before sale)
- Distance from subject property (km)
- Map marker with colour coding (green = most recent, red = oldest)

**Business Logic / Rules:**

- Comparables are filtered by: property type match, bedroom range (±1), bathroom range (±1), land size range (±30%), sale date within configured window, distance within configured radius.
- If fewer than the requested number of comparables are found after filtering, the system widens the radius in 1 km increments up to 5 km before notifying the agent of insufficient data.
- CMA report PDF includes: cover page (property photo, address, date generated), subject property summary table, comparable sales table, price/sq.m. chart (bar chart), mini-map with markers, methodology notes, and the agency's branding and ABN.
- The PDF is stored in the Document Vault (4.4) and linked to the property.
- Australian-specific: For apartments, the CMA emphasises strata-specific comparables (same building or complex, same approximate floor level, similar aspect). For houses, land value per sqm is the primary metric.

**Dependencies:** External data API (PriceFinder/CoreLogic/Domain sold), Document Vault (4.4), Property Report Generator (3.4)

**Acceptance Criteria:**
1. Agent can generate a CMA for any property with an address from within the listing detail view.
2. Comparables are fetched and displayed within 10 seconds for most suburban addresses.
3. Agent can manually add a comparable sale not found by the API (e.g. a private sale known only to the agent).
4. Agent can mark any comparable as "not truly comparable" with a reason, which excludes it from average calculations but keeps it visible.
5. CMA PDF includes all required sections with agency branding.
6. CMA parameters (count, radius, date range) are configurable per analysis and saved as defaults per agent.

---

### 3.2 Risk Overlays

**User Story:** As a buyer's agent, I want to visualise environmental and planning risk overlays on a property map so that I can identify deal-breaking risks before my client commits to a purchase.

**Input Fields / Data Requirements:**

| Risk Overlay | Data Source | Visualisation |
|---|---|---|
| **Flood Zone** | State government flood mapping APIs (e.g. NSW SES Flood Data Portal, Vic SES) | Blue semi-transparent polygon overlay on property map |
| **Bushfire Risk** | State government BAL (Bushfire Attack Level) data | Red-to-orange gradient overlay |
| **Heritage Overlay** | State/Local government planning scheme overlays | Purple boundary polygon |
| **Zoning** | State planning portal APIs (e.g. NSW Planning Portal, VicPlan) | Colour-coded parcel based on zone type |
| **Easements** | Land title data (via Landata or equivalent) | Yellow dashed lines |
| **Overland Flow Path** | Council flood studies | Light blue dashed lines |
| **Airport Noise** | Federal airport noise contours (if applicable) | Yellow gradient |

**Business Logic / Rules:**

- The property map (Leaflet.js or Mapbox) renders as the base layer. Risk overlays are individual toggleable layers.
- The default display shows only flood and bushfire overlays for the subject property parcel + 500 m buffer.
- Each overlay has a severity classification: Flood (Flood-Prone / Above PMF — Probable Maximum Flood), Bushfire (BAL-LOW / BAL-12.5 / BAL-19 / BAL-29 / BAL-40 / BAL-FZ — Flame Zone), Heritage (Contributory / Individually Significant / World Heritage).
- Planning zone description is displayed in a tooltip on hover (e.g. "R1 — General Residential — Allows dwelling houses, dual occupancies (attached), secondary dwellings").
- If the property intersects a Flood Zone polygon OR has BAL-FZ (Flame Zone), the system auto-flags the property with a "High Risk" badge.
- Risk data is cached for 90 days per property (planning schemes and flood maps change infrequently).

**Dependencies:** External government APIs and map tile services, Property Report Generator (3.4)

**Acceptance Criteria:**
1. All 7 risk overlays are toggleable on the property detail map.
2. Overlay data is fetched and rendered within 5 seconds of opening the property detail view.
3. High Risk badge is auto-applied and visible on listing cards in search and shortlist views.
4. Map supports zoom, pan, and pinch-to-zoom on touch devices.
5. If a government API is unavailable, the corresponding overlay toggle is disabled with a "Data Unavailable" tooltip.

---

### 3.3 Investment Calculators

**User Story:** As a buyer's agent, I want to run investment calculations for any property so that I can present my investor clients with clear, data-backed yield and cash flow projections.

**Calculator Modules:**

#### A. Gross Yield Calculator

| Input | Formula |
|---|---|
| Estimated weekly rent | Manual entry or suburb median rent from API |
| Purchase price | From listing or manual entry |
| **Output:** Gross Yield % | (Weekly Rent × 52) ÷ Purchase Price × 100 |

#### B. Net Yield Calculator

| Input | |
|---|---|
| Weekly rent | As above |
| Annual holding costs: council rates, water rates, strata/body corporate levies, building insurance, landlord insurance, property management fees (default 7.7% of rent inc. GST), repairs & maintenance allowance (default 0.5% of property value), vacancy allowance (default 2 weeks/year) | |
| **Output:** Net Yield % | (Annual Rent — Annual Holding Costs) ÷ Purchase Price × 100 |

#### C. Cash Flow Projection (Annual)

| Input | |
|---|---|
| Annual rental income | Weekly rent × 52 |
| Annual holding costs | As above |
| Annual loan interest | Loan amount × interest rate (agent-configurable default: current variable rate + buffer) |
| Annual depreciation estimate | Rough estimate based on property type, age, construction (or "Unknown — recommend quantity surveyor") |
| **Output:** Net annual cash flow (positive or negative) | Income — (Holding Costs + Interest + Depreciation) |
| **Output:** Weekly cash flow | Annual ÷ 52 |

#### D. Stamp Duty Calculator

State-specific calculation for all Australian states and territories.

| Input | |
|---|---|
| State/Territory | Dropdown (NSW, VIC, QLD, SA, WA, TAS, NT, ACT) |
| Property value | Purchase price |
| Property type | Established home / New home / Vacant land |
| Buyer type | First-home buyer / Non-first-home buyer / Investor |
| PPOR or Investment | Radio button |
| **Output:** Stamp duty payable | State-specific sliding scale formula |
| **Output:** FHOG applied (if eligible) | State-specific grant amount |
| **Output:** Concession/Exemption applied (if eligible) | State-specific |

#### E. LMI Estimator

| Input | |
|---|---|
| Purchase price | |
| Deposit amount | |
| LVR (auto-calculated) | (Purchase — Deposit) ÷ Purchase × 100 |
| **Output:** If LVR > 80%, estimated LMI premium | Genworth/Helia published rate card lookup |

#### F. Depreciation Schedule Estimate

| Input | |
|---|---|
| Property type | |
| Year built (approx.) | |
| Construction type | |
| New or established | |
| **Output:** Estimated first-year depreciation (Division 40 + Division 43) | Simplified heuristic based on ATO guidelines |

**Business Logic / Rules:**

- All calculators are accessible from the property detail screen and the Client Portal (if enabled for that client).
- Calculator inputs pre-populate from the listing data and the client's finance record where available.
- Calculator results can be saved as a "Scenario" (named, dated, linked to the property and client). Multiple scenarios can be compared side-by-side.
- Default holding cost assumptions (rates, insurance, management fees) are configurable per agency.
- Each calculator displays an "Assumptions" section listing every input and assumed value.
- Stamp duty calculator must be updated within 30 days of any state government announcement of rate changes (maintenance consideration).

**Dependencies:** Finance Tracking (1.2 — for deposit/LMI inputs), Property brief (for property type/attributes), State revenue office APIs (optional — manual rate tables as fallback)

**Acceptance Criteria:**
1. All five calculator modules load with correct pre-populated values from property and client data.
2. Stamp duty calculation is accurate for all 8 states/territories per current published rates.
3. Scenario saving and comparison works — agent can create "Scenario A" (optimistic rent) and "Scenario B" (conservative rent) and view side-by-side.
4. Calculator results include clear assumptions and disclaimer text.
5. LMI estimator produces results within ±5% of actual Genworth/Helia premiums for standard loans.
6. Cash flow projection clearly labels positive cash flow (green) and negative cash flow (red) with weekly and annual figures prominently displayed.

---

### 3.4 Property Report Generator

**User Story:** As a buyer's agent, I want to generate a branded, professional property report that combines listing data, CMA, risk overlays, and investment metrics into a single PDF so that I can present a comprehensive analysis to my client and reinforce my value as their adviser.

**Report Sections (in order):**

1. **Cover Page:** Agency logo, property photo, property address, report date, "Prepared for [Client Name]" (optional), "Confidential" watermark.
2. **Executive Summary:** AI-generated 3–5 bullet points synthesising the property's suitability for the client (based on match score factors).
3. **Property Details:** Photo gallery, key attributes table, listing description, price guide, agent details, days on market, open for inspection times.
4. **Location Analysis:** Suburb profile (median price, 12-month growth, days on market average), nearby amenities (schools, transport, shopping — sourced from location API), walk score equivalent.
5. **CMA Summary:** Subject property vs. comparables table, price per sqm chart, mini-map with markers, commentary on market conditions.
6. **Risk Assessment:** Visual risk map, summary of applicable overlays, severity ratings, implications for insurance and lending.
7. **Investment Analysis:** Gross yield, net yield, cash flow projection, stamp duty, LMI estimate, assumption summary.
8. **Recommendation:** Agent-editable text field with a verdict (Strong Buy / Buy / Hold / Pass) and rationale.
9. **Appendices:** Full comparable sales data, methodology notes, disclaimer, agency contact details.

**Business Logic / Rules:**

- Report template is brand-configurable: agency logo, primary/secondary colour, font family, footer text, disclaimer text.
- Report generation is asynchronous — agent clicks "Generate", receives a toast notification, and the PDF appears in the Document Vault (4.4) when ready (and a link is emailed if configured).
- Reports are versioned; regenerating a report creates a new version rather than overwriting.
- Reports respect the client portal visibility setting — if the agent sets visibility to "Client Visible", the report appears in the client's Document Vault.
- The AI-generated executive summary must be reviewable and editable by the agent before the report is finalised (never auto-send without human review).
- Report generation uses a headless Chrome/Puppeteer pipeline for PDF rendering from HTML templates.

**Dependencies:** Integrated CMA (3.1), Risk Overlays (3.2), Investment Calculators (3.3), Document Vault (4.4), Client Portal (4.0)

**Acceptance Criteria:**
1. Agent can generate a report from the property detail page with one click.
2. Report includes all 9 sections as specified.
3. Agency branding (logo, colours, disclaimer) renders correctly on all sections.
4. AI executive summary is generated but editable before report finalisation.
5. PDF generation completes within 30 seconds for a standard report.
6. Report versions are tracked; regenerating creates v2, v3, etc., with visibility into what changed.
7. Report renders correctly when printed (A4) and when viewed on mobile PDF readers.

---

## Phase 4: Client Portal (Collaboration)

The client portal is the client-facing side of the platform. Every interaction is branded to the buyer's agency and provides clients with real-time visibility into their property journey.

---

### 4.1 Client Authentication

**User Story:** As a buyer client, I want to log in to my buyer's agent's branded portal securely and easily so that I can view properties, provide feedback, and access documents without friction.

**Input Fields / Data Requirements:**

- Authentication methods (client-choice or agent-assigned):
  - **Magic Link:** Client enters email → system sends a one-time link valid for 15 minutes. Clicking the link authenticates the session. No password required.
  - **Password-Based:** Agent sets an initial temporary password. Client is forced to set a new password on first login. Password policy: minimum 8 characters, at least 1 number and 1 letter.
  - **Social Login (future):** Google and Apple sign-in for optional iteration.

**Business Logic / Rules:**

- Each client is linked to exactly one agency in the multi-tenant data model.
- Agent dashboard session timeout: 24 hours of inactivity → automatic logout, refresh token revoked.
- Client portal session timeout: 7 days of inactivity → automatic logout, refresh token revoked. Rationale: clients use the portal infrequently and should not need to re-authenticate on every visit; agents handle sensitive financial and contractual data and need shorter sessions.
- Magic links expire after 15 minutes and are single-use.
- Failed login attempts: 5 consecutive failures → account locked for 15 minutes. Agent can manually unlock.
- The portal is white-labelled: custom domain (CNAME), agency logo, agency primary colour, agency name in title bar. No platform branding visible to the client.
- Australian Privacy Act 1988 compliance: Privacy policy link in footer, consent checkbox on first login, data access request form.

**Dependencies:** Client Profile (1.4), all Client Portal features (4.2–4.5)

**Acceptance Criteria:**
1. Client receives a magic link email within 30 seconds of requesting login.
2. Magic link is single-use and expires after 15 minutes.
3. Password reset flow: client enters email → receives reset link → sets new password → old session invalidated.
4. Portal renders with agency branding (logo, colours, domain) and zero platform branding.
5. Account lockout after 5 failed attempts with agent-unlock capability.

---

### 4.2 Property Shortlists

**User Story:** As a buyer client, I want to browse properties my agent has shortlisted for me, filtered and sorted, so that I can efficiently review options and focus on the most relevant ones.

**Input Fields / Data Requirements:**

Each shortlist card displays:

| Element | Visibility |
|---|---|
| Primary photo | Always |
| Address (full or abbreviated — agent configurable) | Configurable per shortlist |
| Price guide | Always unless "Contact Agent" |
| Match score badge | Always |
| Key attributes: Beds, Baths, Cars, Land Size | Always |
| Date added to shortlist | Always |
| Agent notes (free text, per property per shortlist) | Client-visible if agent enables |

**Business Logic / Rules:**

- Each client has one "Primary" shortlist and can have multiple named shortlists (e.g. "Investment Options", "PPOR Candidates", "Auction this Saturday").
- Sort options: Newest first, Match Score (high to low), Price (low to high or high to low).
- Filter options: Property type, suburb, price range, bedrooms, status (all/unreviewed/feedback given).
- Agent can move properties between shortlists and reorder manually (drag-and-drop in agent view).
- When a property is removed from Domain/Realestate.com.au, the shortlist card shows a "No Longer Listed" overlay but remains visible with historical data.
- Shortlist state persists across sessions — client sees the same shortlist on mobile and desktop.

**Dependencies:** Match Feed (2.4 — for agent-shortlisting), Structured Client Feedback (4.3), Portal Aggregation (2.1 — for listing status)

**Acceptance Criteria:**
1. Client can view, filter, and sort their shortlists with responsive card layout (3 cards/row on desktop, 1 card/row on mobile).
2. Address visibility is controlled by the agent at the shortlist level (show full / show abbreviated / hide until approved).
3. "No Longer Listed" overlay displays within 1 hour of the listing being withdrawn from the source portal.
4. Multi-shortlist support: client can switch between named shortlists in a dropdown or tab interface.
5. Agent notes appear correctly in a distinct visual style when enabled.

---

### 4.3 Structured Client Feedback

**User Story:** As a buyer client, I want to provide clear, deliberate feedback on properties my agent sends me using a straightforward button-and-comment interface so that my agent understands exactly how I feel about each option. As a buyer's agent, I want structured feedback that I can act on, not a stream-of-consciousness chat.

**Design Rationale:** Property decisions are high-stakes financial commitments, not rapid-fire entertainment. A card-swipe interface (Tinder-style) is intentionally NOT used because it trivialises decisions worth hundreds of thousands of dollars and encourages snap judgements without due consideration. Instead, feedback is given within the property detail view where the client can review photos, floor plans, suburb data, and agent notes before making a considered decision.

**Input Fields / Data Requirements:**

Interaction modes — all accessed from buttons within the property detail view:

| Action | UI Element | Result |
|---|---|---|
| **Interested** | Green button (thumbs-up icon) | Property marked "Interested", green badge, added to "Interested" list, instant notification to agent |
| **Need More Info** | Amber button (question-mark icon) | Property marked "Need More Info", amber badge, comment field auto-opens with prompt "What would you like to know?" |
| **Not For Me** | Red button (cross icon) | Property marked "Not For Me", red badge, moved to "Not For Me" list, prompted with optional reason tags: "Wrong Area", "Over Budget", "Don't Like the Style", "Too Small", "Too Large", "Wrong Property Type", "Other" |
| **Comment** | Text field always visible below feedback buttons | Free-text comment sent to agent alongside any feedback action. Comment is optional when selecting "Interested" or "Not For Me", auto-focused when selecting "Need More Info". |
| **Undo** | "Undo" link appears for 10 seconds after any action | Reverses the last action |

**Comparison Grid View (Primary Client Evaluation Mode):**

In addition to the card gallery, clients can view shortlisted properties in a side-by-side comparison grid (up to 3 properties simultaneously). Each column shows: photo, address, price, bed/bath/car, land size, agent notes, and feedback buttons. This is the recommended default view for evaluating shortlisted properties because it enables direct, informed comparison — the way buyers naturally evaluate properties.

**Business Logic / Rules:**

- All feedback (Interested/Need More Info/Not For Me/comment) is recorded with timestamp and instantly visible on the Agent Dashboard activity feed.
- Comment notifications are pushed to the agent via in-app notification and optional push notification (mobile).
- The feedback UI is embedded in the property detail view; the shortlist card gallery shows the current feedback status badge on each card.
- Feedback reason tags are aggregated: The agent can view a summary chart showing feedback breakdown across a shortlist (e.g. "40% of Not For Me responses: Over Budget").
- Client can change their feedback at any time — viewing a property later and changing from "Interested" to "Not For Me" updates the status and notifies the agent with an audit trail of the change.
- The card-based gallery remains available as a secondary browse view for initial triage.

**Co-Buyer / Partner Approval Workflow:**

- When a client record has linked co-buyers, each co-buyer logs into the portal with their own credentials (or a shared household account at the agency's discretion).
- Each co-buyer provides independent feedback on properties. Their feedback is tracked separately and visible to all co-buyers in the portal.
- A property is only marked as "Interested" in the agent pipeline when ALL co-buyers have given "Interested" feedback. If one partner is "Interested" and another is "Not For Me", the property shows a "Split Decision" badge to the agent.
- The agent dashboard shows per-property co-buyer feedback status: e.g. "Sarah: Interested ✓, Tom: Need More Info".

**Dependencies:** Property Shortlists (4.2), Activity Feed (4.5), Client Profile (1.4 — co-buyer relationships)

**Acceptance Criteria:**
1. Three feedback buttons (Interested / Need More Info / Not For Me) are visible and clearly colour-coded on every property detail view.
2. Comment field is always visible below the feedback buttons; auto-focuses when "Need More Info" is selected.
3. Feedback reason tags display as selectable chips after "Not For Me" is tapped; at least one tag can be selected.
4. Undo link is visible and functional for 10 seconds after each action.
5. All feedback actions appear in the agent's activity feed within 5 seconds.
6. Feedback reason aggregation chart renders correctly for shortlists with >5 properties.
7. Comparison grid view supports up to 3 properties side-by-side on desktop, stacks vertically on mobile.
8. Co-buyer feedback is tracked per individual; "Interested" to agent only when unanimous. Split-decision badge visible.

---

### 4.4 Document Vault

**User Story:** As both a buyer's agent and a buyer client, I want a secure, organised document repository where all property-related documents are stored, accessible, and trackable so that nothing gets lost in email threads and due diligence documents are always at hand.

**Input Fields / Data Requirements:**

| Feature | Details |
|---|---|
| **Document Types** | Building & Pest Inspection Report, Strata Inspection Report, Contract of Sale, Section 32 Vendor Statement (VIC) / Zoning Certificate equivalent, Title Search, Council Rates Notice, Body Corporate Certificate, Depreciation Schedule, Finance Approval Letter, Signed Agency Agreement, CMA Report, Property Report, Offer Letter, Conveyancer Correspondence, Other |
| **Upload** | Drag-and-drop, file picker, email-to-vault (dedicated inbound email address) |
| **Metadata per document** | Document type, property (linked), client (linked), upload date, uploaded by, file name, file size, page count (for PDFs), review status (Unreviewed / Reviewed / Action Required) |
| **Permissions** | Per document: Agent Only, Agent + Client, Client Only (e.g. client uploads their own pre-approval letter) |

**Business Logic / Rules:**

- Documents are stored in an S3-compatible object store (S3, Cloudflare R2, etc.) with server-side encryption at rest.
- Download links are time-limited pre-signed URLs (valid 15 minutes) — never direct links to the storage bucket.
- The vault display is grouped by: All Documents, or filtered by property, document type, or review status.
- Document review workflow: Uploaded → "Unreviewed" badge appears on the agent dashboard. Agent reviews → marks as "Reviewed". If issues found → marks as "Action Required" with a note.
- The vault integrates with the Transaction Milestone checklist (6.3) — required documents auto-appear in the vault checklist with upload status.
- Maximum file size: 50 MB. Supported formats: PDF, DOCX, XLSX, JPG, PNG, HEIC. Virus scanning via ClamAV or cloud equivalent on upload (sandboxed).
- Email-to-vault: Each agency gets a unique inbound email address (e.g. `vault+agency-slug@inbound.buyersagent.app`). Emailed attachments are automatically ingested, matched to client/property by parsing the email subject for a reference code.

**Dependencies:** Transaction & Settlement — Document Checklist (6.3), CMA & Property Reports (3.1, 3.4)

**Acceptance Criteria:**
1. Agent and client can upload documents via drag-and-drop with a progress indicator.
2. Document types are correctly categorised; filtering by type shows the correct subset.
3. Pre-signed download URLs expire after 15 minutes and are not guessable.
4. The email-to-vault feature ingests attachments and auto-categorises them within 2 minutes of receipt.
5. Review status badges update in real-time; "Action Required" documents display a red badge on the dashboard.
6. Virus scanning rejects infected files with a user-facing error message explaining the rejection.

---

### 4.5 Activity Feed

**User Story:** As both an agent and a client, I want a chronological timeline of every action taken on a deal so that I have full transparency into progress and never need to ask "what's happening with my property search?"

**Input Fields / Data Requirements:**

Event types logged to the feed:

| Event | Trigger | Visible to |
|---|---|---|
| Brief created/updated | Phase 1 | Agent |
| New match found | Phase 2 (Match Feed) | Agent |
| Property shortlisted | Agent action | Agent + Client |
| Client feedback (Interested/Need More Info/Not For Me/comment) | Client action | Agent |
| Co-buyer feedback (per individual) | Client action | Agent |
| Property inspected | Agent manually logs | Agent + Client |
| Document uploaded | Phase 4 | Agent + Client |
| Document reviewed | Agent action | Agent |
| Offer drafted/sent/accepted/rejected | Phase 5 | Agent + Client (configurable) |
| Milestone completed/upcoming | Phase 6 | Agent + Client |
| Note added | Agent or Client | Mutual |
| Client suggested a property | Client action | Agent |

**Business Logic / Rules:**

- Feed is scoped: Client sees only events related to their own briefs and properties. Agent sees events across all their assigned clients.
- Filtering: By client, by property, by event type, by date range.
- Feed items are grouped by date (Today, Yesterday, This Week, Earlier).
- Each feed item has an optional "comment thread" — agent and client can have a conversation on a specific event (e.g. "Can you explain why this property scored so low?" → agent replies inline).
- The feed supports infinite scroll with "jump to date" date picker.
- Feed items link to the relevant entity (e.g. clicking "Document Uploaded" opens the document in the vault).

**Dependencies:** All platform features that generate auditable events.

**Acceptance Criteria:**
1. All specified event types appear in the feed with correct actor attribution (who did it).
2. Feed is scoped correctly — Client A cannot see Client B's events.
3. Feed supports filtering and infinite scroll with no noticeable lag at 5,000+ events.
4. Comment threads on feed items support rich text and @mentions (within the same agency for agents, agent-to-client for client comments).
5. Date grouping displays correctly across time zones (Australian AEST/AEDT).

---

### 4.6 Client Property Suggestion

**User Story:** As a buyer client, I want to send a property I've found (on Domain, RealEstate.com.au, or elsewhere) to my agent for evaluation so that my own research feeds into the buying process.

**Input Fields / Data Requirements:**

| Field | Source |
|---|---|
| Property URL | Client pastes URL from Domain, RealEstate.com.au, or other listing site |
| Client notes | Free text — "This looks perfect, what do you think?" or "Can we inspect this one?" |
| Listing data auto-fetch | System parses URL, fetches listing details where API available, otherwise stores raw URL |

**Business Logic / Rules:**

- When a client submits a property URL, it appears in the agent's "Client Suggestions" inbox on the dashboard.
- The system attempts to auto-fetch listing details from Domain API. If the URL is from RealEstate.com.au or another source, it stores the URL and a screenshot for the agent to review manually.
- Agent can accept the suggestion (creates a property record and runs it through the matching engine), ask for clarification (prompts client for more info), or decline with a note explaining why.
- Accepted suggestions are treated like any other property — they flow through the full shortlist, feedback, and deal pipeline.

**Dependencies:** Portal Aggregation (2.1), Match Feed (2.4), Agent Dashboard (1.5)

**Acceptance Criteria:**
1. Client can paste a URL and submit within the portal in under 30 seconds.
2. Domain URLs auto-fetch listing data within 1 minute.
3. Agent dashboard shows a "Client Suggestions" count badge and dedicated inbox view.
4. Agent accepting a suggestion creates a full property record identical to an ingested listing.

---

## Phase 5: Negotiation & Offer Tracking

The negotiation phase brings structure and transparency to what is typically the most opaque part of the buying process.

---

### 5.1 Offer Letter Generation

**User Story:** As a buyer's agent, I want to generate professional offer letters using templates with merge fields so that I can submit offers quickly, correctly, and with consistent branding for every client.

**Input Fields / Data Requirements:**

| Merge Field | Source |
|---|---|
| `{{buyer_name}}` / `{{buyer_names}}` | Client Profile |
| `{{buyer_address}}` | Client Profile |
| `{{property_address}}` | Listing data |
| `{{offer_price}}` | Manual entry |
| `{{offer_price_words}}` | Auto-generated from numeric (e.g. "One million two hundred and fifty thousand dollars") |
| `{{deposit_amount}}` | Manual or linked to finance record |
| `{{settlement_period}}` | Manual entry (days) + auto-calculated settlement date |
| `{{conditions}}` | Checkbox list: Subject to finance, Subject to building & pest inspection, Subject to strata report review (apartments), Subject to solicitor/conveyancer review of contract, Subject to sale of existing property, Subject to valuation, Section 66W Certificate (NSW — waiver of cooling-off rights). Custom condition free-text field. |
| `{{special_conditions}}` | Free text |
| `{{offer_expiry_date}}` | Manual date + auto-set default (48 hours from offer date for private treaty) |
| `{{deposit_terms}}` | Configurable default text (e.g. "5% deposit payable upon exchange, balance at settlement") |
| `{{agent_name}}` | Logged-in agent |
| `{{agency_name}}` | Agency settings |
| `{{agency_abn}}` | Agency settings |
| `{{office_address}}` | Agency settings |
| `{{date}}` | Auto = today |

**Business Logic / Rules:**

- Templates are agency-configurable: multiple templates for different scenarios (e.g. "Standard Private Treaty Offer", "Auction Pre-Registration", "Expression of Interest", "Conditional Offer — Subject to Sale").
- The offer letter is rendered as a PDF with the agency letterhead (logo, ABN, office address in header/footer).
- PDF is auto-saved to the Document Vault linked to the client and property.
- Agent can email the offer directly from the platform to the selling agent, with the PDF attached and a cover note.
- Offer versioning: Each edit to an unsent offer creates a draft version. Once sent, the offer is version-locked; a new offer letter must be created for revisions (to maintain a clean audit trail).
- Australian-specific: For Victorian properties, the offer letter includes the mandatory Section 32 acknowledgment clause. For private treaty sales, the applicable state cooling-off period is noted in the offer letter (see §5.4 State-by-State Cooling-Off Periods table below). For NSW purchases where the buyer has signed a Section 66W certificate waiving cooling-off rights, the offer letter notes the waiver.
- The offer letter integrates with the Unified Deal Pipeline (5.4) — generating and sending an offer automatically creates a pipeline entry in the "Offer Made" stage.

**Dependencies:** Unified Deal Pipeline (5.4), Document Vault (4.4), Client Profile (1.4), Agency settings, Selling Agent CRM (5.3)

**Acceptance Criteria:**
1. Agent can select a template, fill in offer details, preview the merged PDF, and send with a total of under 2 minutes.
2. Price-in-words is correctly generated for values up to $99,999,999.
3. Offer letters render correctly with agency branding on A4 PDF.
4. Sent offers are version-locked; attempting to edit shows a "Create New Offer" option.
5. The offer letter automatically populates the Unified Deal Pipeline with status "Offer Made" and all relevant metadata.
6. Cooling-off period disclaimer is included for applicable state/property type combinations.
7. Section 66W waiver is selectable as a condition for NSW properties.

---

### 5.2 Auction Tracker

**User Story:** As a buyer's agent, I want to track live auction bidding with real-time budget calculations so that I never lose track of my buyer's limit in the heat of an auction.

**Input Fields / Data Requirements:**

| Field | Description |
|---|---|
| Property address | Linked listing |
| Client name | Linked client |
| Hard limit (AUD) | The absolute maximum bid — set before auction |
| Opening bid | First bid recorded (manual entry or screen tap) |
| Current bid | Last recorded bid |
| Bid increments | Tap buttons: +$1,000, +$5,000, +$10,000, +$25,000, +$50,000 (configurable defaults), OR custom amount |
| Bidding history | Each bid logged: timestamp, amount, who bid (agent on behalf of buyer, or vendor bid) |
| Auction passed in? | Boolean — if yes, manual entry of highest vendor bid and reserve price (if disclosed) |

**Business Logic / Rules:**

- **Remaining Budget** = Hard Limit — Current Bid. Displayed prominently, colour-coded: Green (>$50k remaining), Amber ($10k–$50k), Red (<$10k).
- **Warning at 90% of hard limit:** Vibrate + visual pulse on the screen.
- **At hard limit:** Full-screen red "LIMIT REACHED" overlay, requires confirmation to record a bid above limit.
- If the auction is passed in and the client is the highest bidder, the tracker auto-creates an "Exclusive Negotiation" sub-state in the Unified Deal Pipeline (5.4) with the highest bid as the starting point.
- After the auction, the tracker generates a PDF summary of all bids with timestamps for the client's records.
- The auction tracker works offline — bidding continues even if the mobile connection drops, syncing when reconnected (critical for auction environments with poor reception).
- Multiple auctions can be tracked simultaneously (for agencies with multiple agents at different auctions).
- **Auction cooling-off:** Auctions have zero cooling-off period in all Australian states and territories. Properties purchased at auction are unconditional. The system notes this on the deal record.

**Dependencies:** Unified Deal Pipeline (5.4), Client Profile (1.4)

**Acceptance Criteria:**
1. One-tap bid increment buttons are large enough for gloved/thumb operation.
2. Remaining budget display updates in real-time with correct colour coding.
3. Offline mode: Bids recorded without connectivity sync correctly when reconnected, with conflict resolution for simultaneous multi-device bidding.
4. Warning and limit-reached alerts are impossible to dismiss accidentally (requires deliberate action).
5. PDF auction summary includes all bids, times, vendor bids marked separately, and final result.
6. Auction data survives app backgrounding/kill on mobile.

---

### 5.3 Selling Agent CRM

**User Story:** As a buyer's agent, I want a dedicated CRM for selling agents so that I can track my relationships, remember negotiation styles, and quickly find the right contact when a listing of interest appears.

**Input Fields / Data Requirements:**

| Section | Fields |
|---|---|
| **Identity** | Full name, agency, office location (suburb), role (Sales Agent, Director, Property Manager, etc.) |
| **Contact** | Phone (primary, DDI if available), email, LinkedIn profile URL |
| **Relationship** | Relationship strength (Strong / Neutral / Strained), first interaction date, source of introduction, last contact date |
| **Notes** | Free-text field for negotiation style notes, personality observations, preferred communication style, past dealings summary |
| **Properties** | Auto-populated list of this agent's current and past listings (from Portal Aggregation + Off-Market Hub + manually linked) |
| **Transactions** | History of successful and unsuccessful offers made through this agent (linked from Unified Deal Pipeline) |
| **Tags** | "High-Volume Lister", "Prefers Phone", "Responsive to Email", "Slow Responder", "Trusted", "Difficult", custom tags |

**Business Logic / Rules:**

- Selling agent records are auto-created when a listing is ingested from Domain (2.1) and the selling agent is not already in the CRM.
- De-duplication: Agents with the same name at the same agency are treated as the same person. Manual merge capability for edge cases.
- Relationship strength is a manual rating; the system does not auto-adjust it.
- "Last contact" auto-updates when an outreach email/SMS (2.5) is sent or an offer letter (5.1) is emailed to this agent.
- The Selling Agent CRM is agency-wide — all agents in the agency share the same selling agent database (collaborative relationship building).

**Dependencies:** Portal Aggregation (2.1), Selling Agent Outreach (2.5), Offer Letter Generation (5.1), Unified Deal Pipeline (5.4)

**Acceptance Criteria:**
1. Agent can view, search, filter, and edit selling agent records from a dedicated CRM view.
2. Auto-created records from Domain listings are instant and correctly associated with the property.
3. De-duplication logic does not falsely merge different agents with the same common name without manual confirmation.
4. "Last contacted" timestamp updates automatically when outreach or offers are sent.
5. The linked properties section correctly lists all current and historical properties associated with that selling agent.

---

### 5.4 Unified Deal Pipeline

**User Story:** As a buyer's agent, I want a single Kanban pipeline tracking every active deal from initial suggestion through to settlement (or loss) so that I never lose context switching between different pipeline views and always know where each deal stands.

**Design Rationale (CONSOLIDATED — replaces separate Deal Pipeline and Offer Pipeline):** The original specification had two conflicting pipeline models — a Deal Pipeline (Suggested → Client Approved → Inspected → Due Diligence → Offer Made → Accepted → Lost) and an Offer Pipeline (Draft → Sent → Negotiating → Counter Offer → Accepted → Rejected → Under Contract → Withdrawn). These have been consolidated into ONE unified pipeline with a sub-view for detailed offer tracking.

**Unified Pipeline Stages:**

| Stage | Description |
|---|---|
| **Client Suggested** | Property added by agent from a match, by client suggestion (4.6), or manually. Not yet shared with client for feedback. |
| **Client Approved** | Client has given "Interested" feedback (or unanimous "Interested" for co-buyers). Agent has decided to proceed with this property as a serious prospect. |
| **Due Diligence** | Active DD phase encompassing: physical inspection, building & pest inspection, strata report review (apartments), contract review, CMA report, risk assessment, finance confirmation. The due diligence checklist (6.3) drives this stage. |
| **Offer Made** | Offer has been submitted to the selling agent. This stage contains a detailed sub-view tracking offer status details: Draft → Sent (initial offer) → Negotiating → Counter Offer → Accepted → Rejected. The sub-view fields include: current offer amount, date of latest offer, conditions included, days since last action, selling agent name, next action notes, priority flag. |
| **Under Contract** | Contracts exchanged, cooling-off period tracking begins (see state-by-state table below). Settlement milestones auto-created. |
| **Settled** | Title transferred, keys collected. Post-settlement tasks tracked. |
| **Lost** | Deal did not proceed. Sub-reasons: rejected, withdrawn by buyer, sold to another buyer, client changed mind, failed finance conditions. |
| **Withdrawn** | Offer withdrawn by buyer before acceptance (moved directly from Offer Made sub-view). |

**Offer Made Sub-View (within the "Offer Made" pipeline stage):**

When a deal is in the "Offer Made" stage, expanding the deal card reveals detailed offer tracking:

| Sub-State | Description |
|---|---|
| Draft | Offer letter created but not yet sent |
| Sent | Offer delivered to selling agent |
| Negotiating | Counter-offer received or discussion underway |
| Counter Offer | Revised offer submitted by buyer |
| Accepted (Offer) | Offer accepted by vendor — transitions deal to "Under Contract" stage |
| Rejected | Offer declined by vendor |

Offer sub-view card data:

| Field | Source |
|---|---|
| Client name | Client Profile |
| Property address | Listing |
| Current offer amount (latest) | Offer letter or manual entry |
| Date of latest offer | Auto |
| Days since last action | Auto-calculated — colour-coded (green ≤ 3 days, amber 4–7, red > 7) |
| Conditions included | Offer letter |
| Selling agent name | Selling Agent CRM |
| Next action | Free text (e.g. "Call selling agent Friday", "Awaiting building inspection results") |
| Priority flag | Manual (high/medium/low) |

**State-by-State Cooling-Off Periods:**

Cooling-off periods apply to private treaty sales only. Auctions have ZERO cooling-off in all states. For private treaty sales, the cooling-off period by state is:

| State | Cooling-Off Period | Can Be Waived? | Notes |
|---|---|---|---|
| NSW | 5 business days | Yes — Section 66W Certificate (solicitor/conveyancer must sign) | 0.25% penalty of purchase price if buyer withdraws |
| VIC | 3 business days | Yes — Section 31 cooling-off waiver | 0.2% penalty of purchase price if buyer withdraws (or $100, whichever is greater) |
| QLD | 5 business days | Yes — signed waiver by buyer's solicitor | 0.25% penalty of purchase price if buyer withdraws |
| SA | 2 business days | Yes — Form 3 cooling-off notice | No penalty for withdrawing during cooling-off (for residential land) |
| WA | No statutory cooling-off | N/A | Cooling-off only exists if written into the contract by agreement |
| TAS | No statutory cooling-off | N/A | Cooling-off only exists if written into the contract by agreement |
| ACT | 5 business days | Yes | 0.25% penalty of purchase price if buyer withdraws |
| NT | 4 business days | Yes — signed waiver | No financial penalty for buyer withdrawal during cooling-off |

**Business Logic / Rules:**

- Pipeline view: Kanban board with columns per stage (Client Suggested → Client Approved → Due Diligence → Offer Made → Under Contract → Settled), plus terminal columns Lost and Withdrawn (collapsed by default). Cards are drag-and-droppable between stages.
- The "Offer Made" column displays the current offer sub-state as a badge on each card (Draft, Sent, Negotiating, Counter Offer, Accepted, Rejected). Clicking the card opens the deal detail with the Offer sub-view expanded.
- Stage transitions are logged with timestamp and user. Certain transitions trigger notifications:
  - "Client Suggested" → "Client Approved" triggers sharing the property with the client.
  - "Client Approved" → "Due Diligence" auto-populates the DD checklist based on property type and state.
  - "Due Diligence" → "Offer Made" auto-generates the offer letter template.
  - "Offer Made" sub-state "Accepted" → "Under Contract" triggers settlement milestone creation, cooling-off countdown (per state table above), and client notification.
  - "Offer Made" sub-state "Rejected" → prompts agent for debrief and potentially moves deal back to "Client Approved" for a new offer strategy.
  - Any stage → "Lost" or "Withdrawn" prompts for a reason and archives after 30 days.
- Pipeline filtering: By agent, by client, by stage, by property type, by priority, by selling agent.
- Full audit trail of every offer and counter-offer within the Offer Made sub-view.
- Cooling-off expiry date is auto-calculated based on the offer acceptance date + state-specific business days (per table above). A countdown and alert appears on the deal card and agent dashboard. Section 66W waiver (NSW) is tracked as a condition on the deal.
- Days since last action triggers agent alerts at red threshold (>7 days).
- Deal cards on the Kanban display: property thumbnail, address, client name, current stage badge, days in current stage, priority flag, DD progress bar (visible in Due Diligence column only), next milestone date (visible in Under Contract column).

**Dependencies:** Offer Letter Generation (5.1), Auction Tracker (5.2), Selling Agent CRM (5.3), Milestone Tracker (6.1), Client Portal (4.0), Structured Client Feedback (4.3)

**Acceptance Criteria:**
1. Single Kanban board displays all active deals with correct stage; drag-and-drop transitions function smoothly.
2. Offer sub-view within "Offer Made" stage shows full offer history and current sub-state.
3. Offer history is complete and immutable — historical stages and amounts cannot be edited.
4. Cooling-off countdown auto-calculates correctly per the state-by-state table above.
5. "Days since last action" triggers agent alerts at red threshold (>7 days).
6. Pipeline filtering works across all dimensions with OR logic for multi-select filters.
7. Terminal stages (Settled, Lost, Withdrawn) remove the card from active view to an archived view after 30 days.
8. Deal card correctly shows per-state cooling-off expiry with countdown.

---

## Phase 6: Transaction & Settlement Management

The final phase manages everything between offer acceptance and settlement — the period where the most things can go wrong without disciplined tracking.

---

### 6.1 Milestone Tracker

**User Story:** As a buyer's agent, I want a milestone tracker with pre-built templates for different deal types so that I know exactly what needs to happen and by when, from offer acceptance through to settlement and beyond.

**Input Fields / Data Requirements:**

Template Types:

| Template | Applicable To |
|---|---|
| **House — Standard Purchase** | Detached house, private treaty, conditional offer |
| **House — Auction** | Detached house, unconditional purchase |
| **Apartment / Strata Title** | Apartment, townhouse, villa unit (adds strata-specific milestones) |
| **Off-the-Plan** | New development — extended timeline |

**Standard Milestones (House — Standard Purchase):**

All day offsets are relative to the date of contract exchange / offer acceptance (Day 0). In Australian private treaty sales, acceptance of the offer = contracts exchanged = cooling-off period begins. For auctions, there is no cooling-off period and the contract is binding when the hammer falls.

| # | Milestone | Default Due (days from acceptance) | Required Docs |
|---|---|---|---|
| 1 | Contract signed & exchanged / cooling-off begins | Day 0 | Signed contract of sale, signed offer letter |
| 2 | Cooling-off period expires | Per state table (see §5.4) | — (or s66W certificate if waived in NSW) |
| 3 | Deposit paid | Day 0 (or per contract deadline) | Deposit receipt |
| 4 | Building & pest inspection booked | +2 days | — |
| 5 | Building & pest inspection completed & reviewed | +5 days | B&P report, agent review notes |
| 6 | Conveyancer engaged & contract reviewed | +3 days | Signed conveyancer engagement, contract review notes |
| 7 | Formal finance approval obtained | +10 days (or per finance clause date) | Unconditional approval letter |
| 8 | Pre-settlement inspection booked | -7 days before settlement | — |
| 9 | Pre-settlement inspection completed | -5 days before settlement | Inspection notes, defect list |
| 10 | Settlement | Settlement date | Settlement statement |
| 11 | Keys collected / possession | Settlement day | Key handover confirmation |
| 12 | Post-settlement follow-up (7-day check-in) | +7 days after settlement | Follow-up notes |

**Strata-Specific Additional Milestones:**

| # | Milestone | Default Due |
|---|---|---|
| S1 | Strata report ordered | +2 days from acceptance |
| S2 | Strata report received & reviewed | +7 days from acceptance |
| S3 | AGM minutes reviewed | +2 days from S2 completion |
| S4 | Body corporate fees & sinking fund confirmed | +5 days from acceptance |
| S5 | Any special levies identified | +5 days from acceptance |

**Business Logic / Rules:**

- Milestones auto-populate based on the deal type and the offer acceptance date (Day 0).
- Each milestone has: status (Pending, In Progress, Completed, Skipped, At Risk), due date (relative offset from acceptance), assigned to (agent or third-party), notes, linked documents.
- "At Risk" auto-flag: When a milestone is overdue AND it is on the critical path (blocks subsequent milestones), the milestone is flagged red. Non-critical path overdue is flagged amber.
- Third-party milestones (conveyancer, mortgage broker, building inspector) can be assigned to the third-party contact with automated email reminders.
- Milestones are viewable by the client in the portal with status visibility configurable by the agent.
- When settlement is delayed, all subsequent milestone due dates shift by the delay period (agent confirmation required before auto-shift executes).
- Template-based defaults are editable per deal — the agent can add, remove, or reorder milestones.

**Dependencies:** Unified Deal Pipeline (5.4 — acceptance triggers), Third-Party Coordination (6.2), Document Checklist (6.3), Settlement Countdown (6.4), Document Vault (4.4), Calendar Integration (1.6)

**Acceptance Criteria:**
1. Upon offer acceptance, the correct milestone template is applied within 30 seconds.
2. Milestones display on a Gantt-style timeline with status colour coding.
3. Overdue critical-path milestones trigger a dashboard alert and optional push notification.
4. Agent can add custom milestones, modify due dates, and skip optional milestones.
5. Client-facing view shows progress percentage and next-upcoming milestone.
6. Settlement date shift auto-recalculates dependent milestone dates with agent approval gate.

---

### 6.2 Third-Party Coordination

**User Story:** As a buyer's agent, I want to keep all third-party professionals (conveyancers, mortgage brokers, building inspectors) in the loop with automated status updates so that I reduce the administrative burden of emailing each party separately.

**Input Fields / Data Requirements:**

Third-party contacts per deal:

| Role | Fields |
|---|---|
| **Conveyancer / Solicitor** | Name, firm, phone, email, reference number |
| **Mortgage Broker** | Name, firm, phone, email, reference number |
| **Building & Pest Inspector** | Name, firm, phone, email |
| **Strata Inspector** (apartments) | Name, firm, phone, email |
| **Quantity Surveyor** (optional) | Name, firm, phone, email |

**Business Logic / Rules:**

- Automated email triggers at specific milestones:
  - **Offer accepted** → Conveyancer notified: "Please commence contract review for [property address]", auto-attaches contract of sale if uploaded.
  - **Contract exchanged** → Conveyancer notified: "Contracts exchanged for [property address], settlement date [date]."
  - **Building inspection booked** → Inspector receives calendar invite with property address and access details.
  - **Finance clause deadline approaching** → Broker receives a reminder 5 days before the finance clause deadline.
  - **Settlement confirmed** → All parties notified with final settlement details.
- Email templates are agency-configurable with merge fields.
- Manual email: Agent can send an ad-hoc email to any third-party from within the platform, auto-logged to the activity feed.
- The system tracks whether a third-party has "acknowledged" a notification (via read receipt or manual flag by agent).
- Third-party contacts are stored at the agency level and linked to deals — reusing the same conveyancer across deals auto-populates their details.

**Dependencies:** Milestone Tracker (6.1), Document Vault (4.4), Selling Agent Outreach templates (2.5 — shared email infrastructure)

**Acceptance Criteria:**
1. Automated emails trigger at the correct milestones with the correct attachments.
2. Agent receives a copy of every automated email sent to third parties.
3. Calendar invites include property address, date, time, and contact instructions.
4. Third-party acknowledgment status is visible on the milestone detail view.
5. Email templates are editable with merge field preview.
6. Ad-hoc email feature supports attachments from the Document Vault.

---

### 6.3 Document Checklist

**User Story:** As a buyer's agent, I want a document checklist linked to each transaction milestone so that I can ensure every required document is collected, reviewed, and stored before settlement.

**Input Fields / Data Requirements:**

| Document | Required For | Auto-Linked Milestone |
|---|---|---|
| Signed Buyer's Agency Agreement | All deals | Intake (Phase 1) |
| Pre-approval / finance letter | All deals | Finance approval milestone |
| Contract of Sale | All deals | Contract exchange milestone |
| Section 32 Vendor Statement (VIC) / equivalent | VIC properties | Conveyancer review milestone |
| Section 66W Certificate (NSW — cooling-off waiver) | NSW properties where cooling-off waived | Cooling-off expiry milestone |
| Building & Pest Inspection Report | Houses | B&P inspection milestone |
| Strata Inspection Report | Apartments | Strata report review milestone |
| Body Corporate Certificate | Apartments | Strata milestone |
| Title Search | All deals | Conveyancer review milestone |
| Council Rates Notice | All deals | Conveyancer review milestone |
| Depreciation Schedule | Investment properties | Post-settlement milestone |
| Deposit Receipt | All deals | Deposit paid milestone |
| Settlement Statement | All deals | Settlement milestone |
| Key Handover Confirmation | All deals | Keys collected milestone |
| Insurance Certificate of Currency | All deals | Pre-settlement milestone |

**Business Logic / Rules:**

- The checklist auto-populates based on deal type and state (VIC = Section 32, NSW = 66W option, other states = equivalent disclosure documents).
- Each document row shows: Document name, status (Not Uploaded / Uploaded / Reviewed / Action Required), linked to milestone, uploaded date, reviewed by.
- When all documents for a milestone are "Reviewed", the milestone auto-advances to "Completed" (agent can disable this behaviour).
- Missing documents at 7 days before settlement trigger a "Settlement at Risk" flag.
- Documents uploaded via Document Vault (4.4) that match a checklist item (by document type + property) are auto-linked to the checklist.

**Dependencies:** Document Vault (4.4), Milestone Tracker (6.1), Settlement Countdown (6.4)

**Acceptance Criteria:**
1. Checklist auto-populates upon milestone template creation with correct state-specific documents.
2. Uploading a document to the vault with matching type + property auto-links to the checklist.
3. Document status per row is clearly displayed with colour coding (green checkmark = reviewed).
4. Missing-document flag triggers a dashboard alert with a link to the specific checklist.
5. Checklist is client-visible (read-only) so the client knows what's still outstanding.

---

### 6.4 Settlement Countdown & PEXA Tracking

**User Story:** As a buyer's agent, I want a visual countdown to settlement day showing remaining tasks, risk flags, and PEXA workspace status so that I can proactively manage the most critical period of the transaction and ensure nothing is missed.

**Input Fields / Data Requirements:**

Display elements:

| Element | Data Source |
|---|---|
| **Countdown timer** | Days remaining until settlement date (from Contract of Sale) |
| **Progress bar** | Percentage of milestones completed vs. total |
| **Remaining tasks list** | Incomplete or in-progress milestones, sorted by due date |
| **Risk flags** | Overdue critical-path milestones, missing documents, finance not yet unconditional within 5 days of finance clause deadline |
| **Third-party status** | Conveyancer acknowledged? Broker acknowledged? Inspector confirmed? |
| **Settlement details** | Date, time, location (electronic via PEXA or physical), conveyancer attending |
| **Settlement adjustment estimate** | Estimated rates/water adjustments (if conveyancer has provided) |
| **Post-settlement tasks** | Tasks scheduled for after settlement (e.g. change locks, connect utilities, depreciation schedule, landlord insurance) |

**PEXA Workspace Tracking (MVP):**

PEXA (Property Exchange Australia) is the mandatory electronic settlement platform for all mainstream residential property transactions in Australia. Full API integration is a Phase 2 goal, but the MVP MUST support manual workspace reference tracking because agents need to monitor settlement status from the moment contracts are exchanged.

| Field | Description |
|---|---|
| PEXA Workspace ID | Manual entry (e.g. "WS-12345678"). Auto-suggested from conveyancer integration (future). |
| Workspace Status | Enum: Created, Ready, Settling, Completed, Exception. Manual update by agent or auto-synced via API (Phase 2). |
| Lodgement Exception Flags | Boolean flags for common PEXA exceptions: Title Issue, Duty Issue, Funds Shortfall, Document Discrepancy, Other. Free-text notes field for exception details. |
| Settlement Date/Time | From contract, synced with PEXA workspace schedule when API available. |

**Business Logic / Rules:**

- Countdown is calculated from current datetime to settlement date (typically 2pm on settlement day AEST).
- Countdown display: >30 days = standard, 14–30 days = amber highlight, <14 days = prominent red display.
- Risk of delay assessment (heuristic):
  - Finance not unconditional AND finance clause deadline < 5 days away → HIGH risk
  - Building & pest not completed AND cooling-off expired → MEDIUM risk
  - Any critical-path milestone overdue by > 3 days → HIGH risk
  - Conveyancer not acknowledged engagement within 5 days of offer acceptance → LOW risk
  - PEXA workspace status "Exception" → HIGH risk (auto-escalates to dashboard alert)
- Settlement countdown is visible on the Agent Dashboard as a widget and in the Client Portal (if enabled).
- Client settlement tracking view: Simplified read-only countdown showing days remaining, key milestone statuses, document checklist, and upcoming actions the client needs to take (sign documents, pay stamp duty, arrange insurance, book final inspection).
- When settlement is successfully completed, the countdown widget transitions to a "Settled — Congratulations" view with confetti animation, and a prompt to schedule a post-settlement follow-up and request a Google review.
- PEXA workspace ID and status are displayed alongside the countdown on the deal detail page. When status is "Exception", the deal card shows a red "PEXA Exception" badge.

**Dependencies:** Milestone Tracker (6.1), Document Checklist (6.3), Third-Party Coordination (6.2), Agent Dashboard (1.5), Client Portal (4.0), PEXA API (Phase 2 integration)

**Acceptance Criteria:**
1. Countdown timer displays days/hours remaining to 2pm on settlement day and updates in real-time.
2. Risk assessment flags are correctly calculated per the specified heuristic and displayed with severity colour.
3. The countdown widget on the agent dashboard is compact (fits in a 300×200 px widget) with drill-through to full settlement detail view.
4. "Settled" animation plays once when status transitions to complete.
5. Settlement adjustment estimates are optional (only display if conveyancer data is entered).
6. Post-settlement task list is editable by the agent with default suggestions.
7. PEXA workspace ID can be entered and saved; status field is updated manually by agent (MVP) or via API (Phase 2).
8. PEXA Exception status triggers a dashboard alert.
9. Client settlement tracking view shows days remaining, milestones, and client action items.

---

## Cross-Cutting Concerns

These concerns span multiple phases and are noted here as global requirements rather than repeated in each feature.

### Data & Privacy

- All data is stored in Australian-hosted infrastructure (Sydney or Melbourne region for AWS).
- Compliance with Australian Privacy Act 1988 (APP) including: data minimisation, purpose limitation, right to access and correction, data breach notification obligations.
- PII encryption at rest (AES-256) and in transit (TLS 1.3 minimum).
- Role-based access control (RBAC): Agency Owner, Agent, Assistant Agent, Client (portal-only).

### Offline & Mobile

- Key workflows must support offline operation: Auction Tracker (5.2), property inspection notes, document capture (photo upload).
- Offline data sync using a queue-based approach with conflict resolution (last-write-wins for most fields, manual merge for document conflicts).

### Notifications

- In-app notification bell with unread count.
- Email notifications via transactional email service (SendGrid, SES).
- SMS notifications via Australian gateway (Twilio AU, SMS Central).
- Push notifications via Firebase Cloud Messaging (FCM) for the companion mobile app (future or hackathon scope).
- Notification preferences configurable per user (agent and client).

### Audit & Compliance

- Every state-changing action is logged to an immutable audit trail with: timestamp, actor (who), action (what), entity (on what), before/after state (for critical fields), IP address.
- Audit logs are retained for 7 years (aligned with Australian tax record-keeping requirements).
- Export function for audit logs (CSV/JSON) for compliance reporting.

### Localisation

- All currency displays in AUD with `$` symbol and comma thousands separator (e.g. $1,250,000).
- Date formats: DD/MM/YYYY (Australian convention).
- Phone numbers: Australian format with mobile (04XX XXX XXX) and landline (0X XXXX XXXX) display.
- Address validation against Australia Post PA File or G-NAF (Geocoded National Address File) where available.
- Time zone: All times stored as UTC, displayed in Australian Eastern Time (AEST/AEDT) with UTC offset label.

### Integration Touchpoints

| External Service | Phases | Purpose |
|---|---|---|
| Domain API | 2, 3 | Listing ingestion, sold data for CMA |
| RealEstate.com.au API (future) | 2 | Secondary listing source |
| CoreLogic / PriceFinder | 3 | CMA comparables, suburb profile data |
| State Planning Portals | 3 | Risk overlays (flood, bushfire, heritage, zoning) |
| State Revenue Offices | 3 | Stamp duty calculator rates |
| Genworth / Helia | 3 | LMI premium rate cards |
| Australia Post / G-NAF | Global | Address validation and geocoding |
| SendGrid / Amazon SES | 2, 5, 6 | Transactional email |
| Twilio AU / SMS Central | 2, 4, 5, 6 | SMS notifications |
| Google Calendar API | 1, 5, 6 | Agent calendar sync for open homes, inspections, auctions, settlement milestones |
| Microsoft Graph API (Outlook) | 1, 5, 6 | Agent calendar sync (alternative provider) |
| PEXA | 6 | Electronic settlement workspace tracking (MVP: manual reference; Phase 2: full API integration) |
| Mapbox / Leaflet.js | 3 | Property maps and risk overlays |
| Firebase (FCM) | Global | Push notifications |
| DocuSign / Annature | 5 | E-signature integration for offer letters and contracts |

---

## Phase 7: Future Features (Post-MVP)

Features below are validated but deferred to subsequent releases.

### 7.1 Client Education Content

A library of buyer education articles and guides, curated or written by the agency, accessible in the client portal. Content types: "First Home Buyer's Guide", "Understanding Strata Reports", "What to Expect at Auction", "Stamp Duty Explained by State", "The Settlement Process Step by Step". Each guide is linked contextually — e.g. a "First Home Buyer's Guide" link appears when a client brief has buyer_type = first-home buyer. Content management is handled via a simple CMS integrated into the agency settings.

**Dependencies:** Client Portal (4.0)

**Acceptance Criteria:**
1. Agency can upload and categorise education content in a CMS.
2. Clients see relevant guides in their portal based on their buyer profile.
3. Content is searchable and mobile-responsive.

---

## Document Metadata

- **Version:** 1.1
- **Last Updated:** 2026-05-23
- **Status:** Comprehensive Specification — All Phases (Revised per product/UX review)
- **Revision Notes (v1.1):**
  - Consolidated Deal Pipeline and Offer Pipeline into Unified Deal Pipeline (§5.4)
  - Added state-by-state cooling-off period table with correct statutory periods (§5.4)
  - Added Section 66W Certificate (NSW cooling-off waiver) to conditions and document checklist (§5.1, §6.3)
  - Added auction zero cooling-off note (§5.2, §5.4)
  - PEXA upgraded from "future" to MVP manual workspace tracking (§6.4)
  - Standardised AI match threshold to 50 (was 40), configurable (§2.3)
  - Standardised file upload size to 50MB (already in Doc 08; reinforced) (§4.4)
  - Replaced "Approve/Reject/Comment" feedback labels with "Interested/Need More Info/Not For Me" (§4.2, §4.3, §4.5)
  - Replaced Tinder-style swipe UX with button-based feedback and comparison grid view (§4.3)
  - Added co-buyer/partner approval workflow (§4.3)
  - Added "Suggest a Property to My Agent" feature (§4.6)
  - Added client settlement tracking view (§6.4)
  - Added Calendar Integration as Phase 1 feature (§1.6, Integration Touchpoints)
  - Standardised session timeout: 24 hours agent, 7 days client (§4.1)
  - Standardised CMA land size tolerance to ±30% (§3.1)
  - Standardised milestone day counts to relative offsets from acceptance date (§6.1)
  - Added Client Education Content as Phase 7 future feature (§7.1)
  - Added Google Calendar and Outlook to Integration Touchpoints table
  - Updated PEXA entry in Integration Touchpoints table
- **Next Document:** 09-ui-ux-and-user-flows.md
