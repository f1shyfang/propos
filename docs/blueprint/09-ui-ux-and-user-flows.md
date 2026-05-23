# 09 — UI/UX & User Flows

## 1. Design Principles

### 1.1 Speed Over Beauty
Buyer's agents are time-poor professionals juggling multiple clients and properties. Every interaction must be optimised for speed. Favour dense, information-rich layouts over sparse, airy designs. Minimise clicks: critical actions must be reachable in two clicks or fewer. Keyboard shortcuts are first-class citizens on desktop. Defaults and smart pre-fills should reduce manual data entry. Animations and transitions must be under 200ms — decorative motion is discouraged unless it conveys state change meaningfully.

### 1.2 Contextual Information
Never force the user to navigate away from their current task to find related data. When viewing a property, surface the client brief it matches against, the deal it belongs to, and the most recent client feedback — all on one card. When viewing a client, show their active briefs, shortlisted properties, and upcoming milestones. Avoid information overload by using progressive disclosure: summary tiles expand into detail panels on demand.

### 1.3 Mobile-Responsive
Agents use phones in the field during property inspections, auctions, and open homes. Mobile views prioritise three actions: quick photo capture and note-taking during inspections, rapid client communication (feedback on properties on the go), and notification triage. The mobile experience is a companion to desktop, not a replacement — heavy data entry and analysis tasks remain desktop-first.

### 1.4 Consistency
The agent dashboard and client portal share the same component library, interaction patterns, and visual language. A property card looks and behaves identically whether viewed by an agent on desktop or a client on mobile. Consistency reduces cognitive load for agents who are not technically sophisticated and minimises the learning curve.

### 1.5 Accessibility
All views must satisfy WCAG 2.1 Level AA minimum. This includes keyboard-navigable Kanban boards, screen-reader-annotated map pins with address and price as alt text, colour-blind-safe status indicators (use shape and label in addition to colour), and minimum 4.5:1 contrast ratios. Touch targets on mobile must be at least 44x44 CSS pixels.

### 1.6 Australian Real Estate Conventions
- **Currency**: Display as $X,XXX,XXX (AUD). Do not show cents unless in offer amounts.
- **Dates**: DD/MM/YYYY format throughout.
- **Suburbs**: Display as "Suburb, State Postcode" (e.g. "Richmond, VIC 3121").
- **Property types**: Use Australian terminology — apartment (not flat), townhouse (not row house), villa unit, duplex.
- **Rooms**: Bed/Bath/Car convention (e.g. "3/2/2").
- **Auction vs private sale**: Clearly distinguish with "Auction — Sat 15 Jun, 11:00am" or "Private Sale — Offers closing 20 Jun".
- **Stamp duty**: Calculated per state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT) using current thresholds and concessions for first-home buyers and owner-occupiers.
- **Cooling-off**: Display state-specific cooling-off periods on deal cards. Note that auctions have ZERO cooling-off in all states.

---

## 2. Core User Journeys

### Journey 1: Onboarding a New Client

**Entry Point**: Agent clicks "Add Client" from the dashboard or sidebar.

**Flow**:

**Step 1 — Client Creation Form** (single screen, not multi-step): Agent enters client name, email, phone, and whether the client is an individual or couple/family. A toggle sets whether the client is purchasing as an owner-occupier or investor — this affects later stamp duty and grant calculations. A dropdown selects the state of purchase, which configures state-specific fields (e.g., NSW first-home buyer grant thresholds). On save, the system generates a portal invite email and SMS automatically.

**Step 2 — Buyer Brief Wizard** (6-step wizard with progress bar across top, explicitly mapped to Doc 08 §1.1 sections):

- *Step 1 — Basic Info & Administrative*: Client name(s), contact phone, contact email, preferred contact method (phone/email/SMS), referral source. Below a divider: engagement type (full-service, sourcing-only, negotiation-only), signed agreement upload, retainer details.
- *Step 2 — Budget & Finance*: Pre-approval status (dropdown: Not Started, In Progress, Pre-Approved, Formal Approval, Expired), max purchase price (numeric with AUD formatting), target purchase price, deposit amount, loan type (variable, fixed, split), lender/broker name and contact. Buyer type (first-home buyer, investor, upsizer, downsizer, SMSF purchaser).
- *Step 3 — Property Requirements*: Property type checkboxes (House, Apartment, Townhouse, Villa Unit, Duplex, Acreage, Vacant Land). Bed/bath/car ranges (sliders or paired dropdowns for min-max). Land size range (sqm), minimum living area (sqm). Preferred construction style (single-storey, double-storey, character, modern). Pool (must-have/nice-to-have/not wanted).
- *Step 4 — Location*: Suburbs of interest (multi-select autocomplete search, results groupable by LGA/region). Excluded suburbs. Radius tolerance from target suburb (km). School zone requirements (specific schools searchable). Proximity to public transport (metres to station). Proximity to specific amenities.
- *Step 5 — Must-Haves & Dealbreakers (incl. Tradeoffs)*: Two-column layout. Left column: Must-Have checklist. Right column: Dealbreaker checklist. Items include: school zone, public transport proximity, north-facing aspect, renovation potential, strata restrictions, pet-friendly, garage/off-street parking, separate laundry, granny flat potential, subdivision potential. Each item has a toggle plus optional notes field. Below: specific dislikes free-text (e.g. "no main-road frontage", "no west-facing living areas").
- *Step 6 — Strategy & Timeline*: Ready-to-buy date (datepicker). Urgency level (immediate, 3 months, 6 months, 12 months, no fixed timeline). Must-settle-by date (if applicable). Purchase purpose (PPOR, investment, SMSF, rentvesting). Auction willingness (Yes/No/Only). Preferred settlement period (30/42/60/90 days). Currently renting (Yes/No — if yes, lease end date). Need to sell existing property (Yes/No — if yes, estimated sale price and timeline).

Each step auto-saves on field blur. Agent can jump between steps via clickable progress bar segments. At completion, the brief is summarised on a single read-only page with an "Edit Brief" button to return to any step.

**Step 3 — Strategy Roadmap Builder** (optional but encouraged): A visual timeline builder where the agent drags milestone blocks into sequence. Default blocks: Brief Complete → Finance Approved → Property Search → Inspections → Shortlist Finalised → Offer Made → Due Diligence → Settlement. Estimated dates propagate forward as blocks are placed (each block has a configurable duration). Agent adds custom notes and sub-tasks to each milestone. The client sees a simplified read-only version in their portal showing only high-level milestones.

**Step 4 — Invite Confirmation**: A modal overlay confirms "Client created and portal invite sent." Displays the client portal URL for the agent to copy, and offers two action buttons: "Go to Client Profile" and "Add Another Client."

**Edge Cases & Exception Handling**:
- Duplicate client detection by email: modal prompts "A client with this email already exists. Merge into existing record or create anyway?"
- Finance pre-approval missing: a non-blocking amber warning badge appears on the client profile — "Finance pre-approval outstanding." Agent can dismiss or set a follow-up reminder.
- Client email bounces: agent receives a notification "Portal invite to sarah@email.com bounced. Verify email address." with a link back to the client form.

---

### Journey 2: Sourcing & Matching a Property

**Entry Point**: New listing ingested from API (REA, Domain, CoreLogic, or manually entered) or agent actively browsing the map discovery view.

**Flow**:

**Step 1 — AI Match Trigger** (automatic, background): When a new listing arrives via ingestion pipeline, the matching engine scores it against every active client brief (briefs with status "Searching"). Matches above a configurable threshold (default 50/100) appear in the agent's "Match Feed" inbox, sorted by match score descending.

**Step 2 — Match Feed Review**: Agent opens the Match Feed (accessible from dashboard or sidebar). Displayed as a vertically scrolling card feed. Each match card shows:
- Property thumbnail (hero image, 16:9 crop).
- Address line and suburb/postcode.
- List price or auction guide.
- Match Score badge (circular, colour-coded: 80+ green, 50-79 amber, below 50 grey).
- Top 3 matched clients (avatar initials + name) with brief criteria hit highlights — e.g., "+Suburb, +Price, -Land Size" in green/red.
- Days on market counter.
- A dismiss button (X icon) to remove the card from the feed. On mobile, a swipe-left gesture dismisses.
- Click anywhere on the card opens the full Property Card in a slide-out drawer.

**Step 3 — Property Card (Slide-Out Drawer)**: Full-width drawer slides in from the right over the map or list view. Tabbed interface with sections:

- *Overview tab*: Hero image gallery (carousel), key stats row (bed/bath/car/land size), price, property type, agency/listing agent, description (expandable).
- *Match tab*: Lists all clients who match this property, with a breakdown per client showing matched criteria in green checkmarks and missed criteria in red crosses with short explanations. A "Match Strength" progress bar per client.
- *Listing Details tab*: Full listing data — land size, floor area, year built, council rates, strata fees (if applicable), rental appraisal, zoning.
- *CMA tab*: Automated comparable market analysis — nearby recent sales in a comparison table, price estimate range, market commentary text area.
- *Feasibility tab*: Stamp duty calculator (state-specific), rental yield projection (for investors), cash flow worksheet.
- *Due Diligence tab*: Checklist and risk overlays.
- *Documents tab*: Contract of sale, section 32 (VIC), strata report, building report — attached or requested.
- *History tab*: Timeline of all actions on this property (listed, price changed, matched, shared with client, feedback received, under offer, sold).

Quick action buttons (persistent at bottom of drawer): "Add to Shortlist" (opens client selector), "Share with Client" (if already shortlisted), "Create Deal" (if client-approved), "Dismiss" (remove from match feed).

**Step 4 — Shortlist Management**: Accessible from the client profile or dashboard shortlist widget. Displays all properties shortlisted per client as a filterable, sortable grid. Each card shows property thumbnail, address, shortlist date, and a status badge:
- "New" (blue): Property shared but client has not yet viewed.
- "Viewed" (grey): Client has opened the property in their portal.
- "Feedback Received" (green/amber/red): Client has responded with Interested / Need More Info / Not For Me.
- A "Share All Unseen" bulk action button sends one notification for all new properties.

**Edge Cases**:
- A property matching 10+ clients creates a single property record with individual match scores and shortlist states per client — the property card's Match tab paginates if needed.
- If a listed price changes (vendor adjusts), all related shortlist cards and match scores update within minutes. Affected agents receive a notification.
- If a property status changes to "Under Offer" or "Sold," all shortlisted instances update with a strikethrough badge and "No Longer Available." Clients are auto-notified.

---

### Journey 3: Client Feedback Loop

**Entry Point**: Client receives email with subject "Your agent has shortlisted N properties for you" containing a direct link to their portal. SMS notification also sent for the first share of the day.

**Flow — Client Side**:

1. **Authentication**: Client clicks link from email/SMS, lands on portal. If first login, a magic link is generated and auto-validated from the URL token — no password to create or remember. Returning visitors may use a one-time code sent to email/phone. Social login (Google, Apple) is available but secondary.

2. **Portal Dashboard**: Clean, minimal interface with the agent's branding (logo, colour). Four sections:
   - *Welcome header*: Agent name, photo, and phone number for quick calls.
   - *My Properties grid*: Card-based gallery layout. Each card shows property photo, address line, price, bed/bath/car, and a coloured status badge matching their feedback (or "New" if unseen). Cards are ordered with newest/unreviewed first.
   - *Recent Activity timeline*: Chronological feed of agent actions — "Your agent added 12 Smith St to your shortlist," "Your agent sent an offer letter for review."
   - *My Documents link*: Quick access to the document vault filtered to client-visible files.
   - *My Settlement* (if applicable): Quick-access card showing settlement countdown for the client's active deal.

3. **Property Detail View**: Client clicks a property card. Full-page view with:
   - Photo gallery (swipeable on mobile, click-to-enlarge on desktop).
   - Address and price prominently displayed.
   - Key stats row.
   - "Why Your Agent Chose This" section: A free-text note the agent wrote explaining how this property fits the client's brief. Displays agent's name and timestamp.
   - Suburb profile panel: Median price, 12-month growth, school catchment zones, walk score, nearest public transport.
   - Map with property pin (same map component as agent view, with risk layers hidden by default).

4. **Feedback Interaction (Button-Based, Not Swipe)**:

   **Design Rationale**: Property purchase decisions involve hundreds of thousands of dollars and years of financial commitment. A Tinder-style swipe interface trivialises these decisions and encourages snap judgements. Instead, feedback is given within the full property detail view — where the client can review photos, floor plans, suburb data, CMA, and agent notes before making a considered decision.

   Persistent feedback strip anchored at the bottom of the property detail view (or a floating bar on mobile). Three large, tappable buttons:
   - Green **"Interested"** (thumbs-up icon) — Client is keen, wants to proceed.
   - Amber **"Need More Info"** (question-mark icon) — Client is interested but has reservations or questions. Tapping auto-focuses the comment field.
   - Red **"Not For Me"** (cross icon) — Client is not interested. Tapping reveals optional reason tags as selectable chips: "Wrong Area", "Over Budget", "Don't Like the Style", "Too Small", "Too Large", "Wrong Property Type", "Other".

   A comment text area with placeholder "Add a note for your agent…" is always visible below the buttons. On button press, the selected button fills with colour and white text; the other two grey out. Client can change their feedback at any time by tapping a different button.

5. **Comparison Grid View (Recommended Primary Evaluation Mode)**: Clients can view shortlisted properties in a side-by-side comparison grid (up to 3 properties simultaneously). This is the preferred evaluation mode for making informed property decisions. Each column shows: photo, address, price, bed/bath/car, land size, match score, agent notes, and the three feedback buttons. On mobile, columns stack vertically with swipe to compare.

6. **Real-Time Sync**: Feedback is pushed to the agent via WebSocket/Server-Sent Events. No page refresh needed on either side.

**Flow — Agent Side**:

1. **Notification**: The notification bell (sidebar) increments its unread count badge. Clicking opens the activity panel. The activity item reads: "Sarah marked 12 Smith St, Richmond VIC 3121 as Interested — 'Keen to inspect, can you book one in?'" with a relative timestamp.

2. **Response & Action**: Agent clicks the notification. The property card opens in a slide-out drawer, auto-scrolled to the History tab showing the feedback thread. Agent types a reply in a text input below the client's feedback. Agent can also take additional actions: "Schedule Inspection" (creates a calendar event and notifies client), "Move to Deal Pipeline," or "Dismiss Property" (removes from client's shortlist with a note).

3. **Bulk Feedback Review**: On the dashboard, a "Pending Client Feedback" counter shows how many shared properties are awaiting client response. Clicking navigates to a filtered list grouped by client.

**Co-Buyer / Partner Approval**:
- When a client record has linked co-buyers, each co-buyer logs into the portal with their own credentials (or a shared household account at the agency's discretion).
- Each co-buyer provides independent feedback on properties. Their feedback is tracked separately and visible to all co-buyers in the portal.
- A property is only marked as "Interested" for the agent's pipeline when ALL co-buyers have given "Interested" feedback. If one partner is "Interested" and another is "Not For Me", the property shows a "Split Decision" badge to the agent.
- The agent dashboard shows per-property co-buyer feedback status: e.g. "Sarah: Interested ✓, Tom: Need More Info".

**Edge Cases**:
- Client has not logged in for 7 days: the agent sees a nudge on the client profile and dashboard — "Sarah has 3 unreviewed properties. Send reminder?" with a one-click action that sends a templated email/SMS.
- Client changes feedback from "Interested" to "Not For Me": the History tab shows the full audit trail with timestamps. The agent is notified of any feedback change.
- Client provides feedback without a comment: the agent sees just the status with an "Add Note?" prompt to request more detail from the client.

---

### Journey 4: From Property to Offer

**Entry Point**: Client has marked a property as "Interested" (and all co-buyers concur if applicable). Agent moves it from shortlist into the unified deal pipeline.

**Flow**:

**Step 1 — Create Deal**: Agent drags the property card from the shortlist section (on client profile or dashboard) and drops it onto the Kanban board in the "Client Approved" column. Alternatively, a "Create Deal" button on the property card triggers the same flow. A lightweight modal confirms: "Create deal for 12 Smith St, Richmond VIC 3121?" with auto-populated fields — property details, client name, purchase purpose (OO/investor from brief), max budget. Agent optionally adds: listing agent name and contact, bidding/negotiation strategy notes, and priority flag (Standard, High, Urgent). On confirm, the deal card appears in the Kanban.

**Step 2 — Due Diligence Phase**: Within the deal card, a checklist auto-generates based on property type and state jurisdiction:
- NSW: strata report (if apartment/townhouse), building inspection, pest inspection, flood check, council zoning certificate (10.7), contract review by solicitor/conveyancer, land tax check.
- VIC: section 32 vendor statement review, building and pest inspection, flood/overlay check, owners corporation certificate (if applicable), contract review.
- Other states: appropriate equivalents.

Each checklist item is a task with: title, assignee (agent or third party), due date, completion checkbox. Completed items show a green tick and timestamp of completion. Incomplete items approaching their due date turn amber, overdue items turn red. A progress bar shows overall due diligence completion percentage.

**Step 3 — CMA Report Generation**: Agent opens the "CMA" tab on the deal card. The system auto-pulls 5–10 comparable recent sales from CoreLogic/PriceFinder based on: same suburb, similar bed/bath/car count, +/-30% land size, sold within last 6 months. Displayed in a comparison table with columns: address, sale date, sale price, bed/bath/car, land size, price per sqm, and a "Comparability" score. Agent can manually add or remove comps, adjust weightings, and write market commentary in a rich-text editor. A "Generate CMA PDF" button produces a professionally formatted, agent-branded PDF report. The report can be shared with the client via the portal.

**Step 4 — Risk Assessment Overlay**: On the property map (embedded in deal card), toggleable risk layers display:
- Flood zone (1-in-100-year overlay, sourced from state government spatial data).
- Bushfire Attack Level (BAL) zones.
- Heritage overlay boundaries.
- Easements and covenants (from title search).
- Contaminated land register.
- Flight path/busy road noise contours.

Each active layer renders as a semi-transparent coloured polygon over the property. A risk summary panel lists all active risks with severity badges: Low (green), Medium (amber), High (red), with explanatory text. High-risk items populate the due diligence checklist automatically.

**Step 5 — Offer Letter Generation**: Agent clicks "Generate Offer Letter" on the deal card. A template selector offers: "Standard Offer (Private Sale)," "Auction Registration," or "Expression of Interest." The selected template pre-fills with:
- Purchaser name(s) from client record.
- Property address and legal description.
- Offer price (agent enters, with budget max displayed as reference).
- Deposit amount (calculated as percentage of offer, default 10%).
- Settlement period (from brief, default 42 days).
- Special conditions (agent can add/remove from a library of common clauses: subject to finance, subject to building and pest, subject to sale of existing property, early release of deposit, Section 66W Certificate (NSW — cooling-off waiver)).

Agent edits the letter in a rich-text editor with preview capability. Once satisfied, clicks "Send for Signature." The client receives the document in their portal and via email. Integrated e-signature (via Annature or DocuSign API) allows the client to sign within the portal. Signature status is tracked on the deal card: "Awaiting Signature," "Signed — Client," "Signed — All Parties."

Once the offer letter is sent, the deal card moves to the "Offer Made" column in the Kanban pipeline. The offer sub-state displays as "Sent" on the card.

**Step 6 — Auction Tracker**: For auction properties, a dedicated "Auction Mode" view on the deal card displays:
- Auction date and time with a live countdown timer.
- Auction location (on-site or in-rooms).
- Registered bidder checklist: Bidder number obtained (Y/N), Deposit cheque/bond prepared (Y/N), ID verified (Y/N), Authority to bid form signed (Y/N).
- Agent's bidding strategy notes (free text, with a template prompt: "Opening bid strategy, walk-away price, bidding increments").
- Reserve price field (if disclosed by selling agent).
- Live bid recorder: A simple "+" and "-" stepper with bid amount input, timestamped bid log during the auction. Passed-in tracking with vendor bid recording.
- **Auction note**: Zero cooling-off period. Purchase at auction is unconditional in all states.

**Step 7 — Pipeline Progression (UNIFIED Pipeline)**:

The unified deal pipeline Kanban has these columns (consolidated from the separate Deal Pipeline and Offer Pipeline in the original specification):

1. **Client Suggested** — AI match or manual add, not yet shared with client.
2. **Client Approved** — Client (and all co-buyers, if applicable) has given "Interested" feedback.
3. **Due Diligence** — Active DD phase encompassing: physical inspection, building & pest, strata report, contract review, CMA, risk assessment, finance confirmation. DD checklist in progress.
4. **Offer Made** — Offer submitted to vendor. Card displays current offer sub-state badge: Draft, Sent, Negotiating, Counter Offer, Accepted (Offer), Rejected. Expanding the card reveals the detailed offer tracking sub-view with offer history, amounts, conditions, and days since last action.
5. **Under Contract** — Offer accepted, contracts exchanged. Cooling-off countdown begins (per state-specific periods). Settlement milestones auto-created.
6. **Settled** — Title transferred, keys collected. Post-settlement tasks tracked.
7. **Lost** — Deal did not proceed (sub-reasons: rejected, withdrawn by buyer, sold to another buyer, client changed mind, failed finance conditions).
8. **Withdrawn** — Offer withdrawn by buyer before acceptance (moved directly from Offer Made).

Column transitions trigger automations: "Due Diligence" to "Offer Made" auto-generates the offer letter template. "Offer Made" sub-state "Accepted" to "Under Contract" triggers settlement milestone creation. "Any" to "Lost" or "Withdrawn" prompts for a reason and archives the deal after 30 days.

**Edge Cases**:
- Multiple offers on the same property for different clients: tracked as separate deal cards with a visual "Same Property" link icon between them. The agent can compare deal cards side by side.
- Offer rejected but vendor counters: deal remains in "Offer Made" column; sub-state updates to "Negotiating" with counter-offer details recorded.
- Property bought at auction by the agent's client: deal moves directly from "Due Diligence" to "Under Contract" (skipping Offer Made, since auction = unconditional). The auction tracker log becomes the deal's negotiation record.
- Lost deal reactivation: agent can restore a lost deal if circumstances change (e.g., prior buyer's finance fell through). The deal returns to its last active column.

---

### Journey 5: Through to Settlement

**Entry Point**: Deal status changes to "Under Contract." The system auto-creates the settlement milestone timeline.

**Flow**:

**Step 1 — Milestone Timeline Generation**: A horizontal timeline appears on the deal view. Default milestones are created based on the settlement period specified in the contract. All day counts are relative offsets from the date of offer acceptance (Day 0). For a standard private treaty purchase:

- Day 0: Contract Signed / Exchange — Both parties have signed, deposit paid.
- Day 0 to cooling-off expiry: per state table (NSW +5 business days, VIC +3 business days, QLD +5 business days, SA +2 business days, ACT +5 business days, NT +4 business days; WA and TAS have no statutory cooling-off). Buyer may withdraw (with penalty in some states). Auctions: no cooling-off, deal is unconditional at Day 0.
- +2 days: Building & pest inspection booked.
- +3 days: Conveyancer engaged & contract reviewed.
- +5 days: Building & pest inspection completed & reviewed.
- +10 days (or per finance clause date): Formal finance approval obtained.
- Contract date: Contract signed (exchange), deposit paid.
- -7 days before settlement: Pre-settlement inspection booked.
- -5 days before settlement: Pre-settlement inspection completed.
- Settlement day: Settlement (title transfers, keys collected).
- +7 days after settlement: Post-settlement follow-up (7-day check-in).

For strata properties, additional milestones at offsets from acceptance: strata report ordered (+2 days), strata report reviewed (+7 days), AGM minutes reviewed (+2 days from strata completion), body corporate fees confirmed (+5 days), special levies identified (+5 days).

The timeline is interactive: agent can drag milestones to reorder, double-click to edit dates and details, add custom milestones via a "+" button between existing items, or remove non-essential ones. Each milestone has a status: Pending (grey), In Progress (blue), Completed (green tick), Overdue (red exclamation). Milestones surface on the dashboard "Upcoming Milestones" widget when within 7 days.

**Step 2 — Document Vault**: Embedded within the deal view. A drag-and-drop upload zone accepts PDFs, Word documents, images, and spreadsheets (max 50MB per file). Files are auto-tagged by the system — agent can override. Tags include: Contract of Sale, Section 32/ Vendor Statement, Strata Report, Building Inspection, Pest Inspection, Finance Approval, Stamp Duty Receipt, Certificate of Title, Transfer of Land, Correspondence, Other.

Each file shows: name, type badge, upload date, uploaded by (agent or third party via email-to-vault), file size. A visibility toggle per file controls whether the client sees it in their portal (default: off, agent must explicitly share). A "Share All Settlement Documents" bulk action shares all relevant docs.

On the client portal, the document vault shows only agent-shared documents, with clear labels and download buttons.

**Step 3 — Third-Party Coordination**: A "Contacts" tab on the deal card stores all parties involved:
- Conveyancer/Solicitor — name, firm, phone, email, reference number.
- Mortgage Broker/ Lender — name, company, phone, email, application reference.
- Building & Pest Inspector — name, company, phone, email, inspection date.
- Strata Manager (if applicable) — name, company, phone, email.
- Selling Agent — auto-populated from the property listing.

Each contact has a notes log (timestamped free-text entries). From the contact card, the agent can "Send Email" — a drawer opens with a template selector ("Request strata report," "Arrange pre-settlement inspection," "Follow up on finance approval," "Generic inquiry") that pre-fills property address, deal reference, and recipient details. The agent can edit and send. Sent emails are logged in the contact's notes log and the deal's History tab.

**Calendar Integration**: All key dates sync to the agent's Google Calendar or Outlook:
- Open home times from the listing
- Private inspection bookings
- Auction date and time
- Cooling-off expiry (per state)
- Finance clause deadline
- Settlement date
- Each milestone with a configurable reminder (default: 7 days, 3 days, 1 day before)

Clients see their relevant upcoming events (open homes, inspections, auction dates) in the portal, sourced from the agent's shared calendar.

**Step 4 — Settlement Countdown Dashboard**: The top of the deal view shows a prominent countdown timer: "Settlement in X days" (with day/hour granularity when under 48 hours). Below the countdown, a pre-settlement checklist shows incomplete items:
- Cooling-off expired (per state).
- Unconditional approval received.
- Building and pest reports reviewed.
- Stamp duty paid.
- Final inspection completed.
- Keys collection arranged.
- Utility connections arranged (optional — agent can toggle on a "Utilities concierge" checklist: electricity, gas, internet, water).

Items not yet complete show a hollow circle; completed items show a green filled circle with completion timestamp. Overdue items (past their milestone date) pulse red. The countdown syncs to the contract's settlement date and auto-adjusts if the date is changed via the milestone timeline.

**PEXA Workspace Status** (visible on deal view): PEXA Workspace ID, current status (Created, Ready, Settling, Completed, Exception), and lodgement exception flags. When status is "Exception", a red badge appears on the deal card.

On the client portal, a simplified settlement tracking view shows the date, days remaining, and a checklist of actions the client needs to take (sign documents, pay stamp duty, arrange insurance, book final inspection).

**Edge Cases**:
- Settlement delayed: Agent clicks "Delay Settlement," enters the new date and reason. All incomplete milestones shift forward proportionally. The countdown resets. Client and all third-party contacts receive an automated notification with the new date.
- Simultaneous settlements (client buying and selling same day): Two deal cards are linked with a "Linked Settlement" badge. A coordination notes field captures the settlement-day logistics (times, removalist, key handover sequence). Both countdowns sync to each other — delaying one can cascade the delay to the other.
- Settlement fails on the day: Agent can mark "Settlement Failed" with a reason (bank delay, document issue, vendor not ready, PEXA exception). The timeline reschedules to the next available date and all parties are notified.
- Off-the-plan purchases: Settlement timeline extends to the estimated completion date with additional milestones: builder progress updates, defect inspection, practical completion notice, final inspection, registration of plan of subdivision.

---

## 3. Key Screen Layouts

### 3a — Agent Main Dashboard

**Layout**: Three-column structure — fixed narrow left sidebar, fluid centre content area, toggleable right activity panel.

```
+--------+----------------------------------------+----------+
| SIDEBAR |           CENTRE CONTENT               | ACTIVITY |
|  icons  |                                        |  PANEL   |
|  +labels|  [Stat Cards Row - 4 across]          |          |
|         |                                        |  Real-   |
|  Dash-  |  [Shortlists] [Upcoming Milestones]    |  time    |
|  board  |   (60%)          (40%)                 |  feed    |
|         |                                        |          |
|  Clients|  [Recent Activity Feed]                |  Filters |
|         |                                        |          |
|  Prop-  |                                        |          |
|  erties |                                        |          |
|         |                                        |          |
|  Deals  |                                        |          |
|         |                                        |          |
|  Agents |                                        |          |
|  Docs   |                                        |          |
|  Reports|                                        |          |
|  Settings                                       |          |
|         |                                        |          |
| [avatar]|                                        |          |
+--------+----------------------------------------+----------+
```

**Interactions**:
- Click any stat card to navigate to the filtered list (e.g., "Active Clients: 23" -> Clients page filtered to Active status).
- Click shortlist item to open property card slide-out.
- Click milestone to open deal with timeline scrolled to that milestone.
- Click activity feed item to open the referenced record.
- Right activity panel can be collapsed via a toggle arrow, expanding the centre content area to full width.
- Sidebar is collapsible to icon-only mode (64px) for smaller screens; hover expands it temporarily.

### 3b — Map-First Discovery View

**Layout**: Full-screen interactive map with overlaid controls and a collapsible left panel.

**Left Panel** (380px default, collapsible via a tab on the edge):
- Search bar at top: autocomplete input accepting suburb, postcode, or full address. Search results appear as a dropdown and simultaneously pan the map.
- Filter chips row: Property Type, Price Range (range slider with AUD-formatted labels), Bed/Bath/Car (select inputs), Land Size (min-max inputs), Days on Market, Auction Date (date range picker), Listing Status (Active, Under Offer, Sold).
- Sort dropdown: Newest First, Price Low-High, Price High-Low, Match Score, Days on Market.
- Below filters: scrollable property list (cards or compact rows). Each list item shows thumbnail, address, price, bed/bath/car, and match score badge (if logged-in agent with active briefs). Hovering a list item highlights the corresponding map pin. Clicking opens the property card slide-out.
- "Save Search" button persists current filters as a named saved search for the agent.

**Map Area**:
- Map tile layer (Google Maps or Mapbox Streets with Australian address precision).
- Property pins colour-coded by status: green (For Sale), blue (Auction), orange (Under Offer), red (Sold). Pins cluster at lower zoom levels.
- Clicking a pin shows a mini info window with thumbnail, address, price, and "View Details" link.
- Layer toggles in top-right map control: Flood Zones, Bushfire Overlay, Heritage Overlays, School Catchments, Public Transport Stops, Walk Score Heatmap.
- Right-clicking the map drops a radius circle for radius-based search.
- Drawing tools (polygon for custom area search) available for power users.

**Interactions**: Pinch-to-zoom and drag-pan. Double-click to zoom in. Scroll wheel for zoom. Click and drag on filters updates both the list and map in real time (debounced 500ms).

### 3c — Kanban Deal Pipeline (Unified)

**Layout**: Full-width horizontal scrolling Kanban board. Columns represent deal stages with coloured headers. This is the single unified pipeline — there is no separate Offer Pipeline. Offer tracking is a sub-view within the "Offer Made" column.

**Columns** (left to right):
1. **Client Suggested** (grey) — AI-suggested, client-suggested (URL submitted), or manually added. Not yet shared with client.
2. **Client Approved** (blue) — Client (and all co-buyers) has given "Interested" feedback. Agent proceeds.
3. **Due Diligence** (amber) — DD checklist in progress: inspections, CMA, risk assessment, contract review, finance.
4. **Offer Made** (purple) — Offer submitted to vendor. Card shows offer sub-state badge: Draft, Sent, Negotiating, Counter Offer, Accepted (Offer), Rejected.
5. **Under Contract** (green) — Contracts exchanged. Cooling-off countdown active (per state). Settlement milestones tracking.
6. **Settled** (dark green) — Title transferred, keys collected. Post-settlement tasks.
7. **Lost** (red, collapsed by default) — Deals that did not proceed.
8. **Withdrawn** (red, collapsed by default) — Offers withdrawn before acceptance.

Each column has: a header showing stage name and deal count, a "+" button to manually add a deal, and a vertically scrollable card list.

**Deal Cards**: Each card displays:
- Property thumbnail (small, 4:3 crop, left-aligned or top).
- Address (bold, truncated to one line).
- Client name (smaller, below address).
- Price/offer amount (right-aligned).
- Days in current stage counter (e.g., "5d in DD").
- Priority flag (coloured triangle in top-right corner: red = Urgent, amber = High, no flag = Standard).
- Due diligence progress bar (only visible in Due Diligence column).
- Offer sub-state badge (only visible in Offer Made column).
- Cooling-off countdown (only visible in Under Contract column, per state).
- Next milestone date and PEXA status badge (only visible in Under Contract column).
- Co-buyer split-decision badge (if applicable).
- Clicking the card opens the full deal view (slide-out drawer with all tabs).

**Interactions**:
- Drag a card from one column to another to change the deal stage. On drop, a confirmation toast appears with any triggered automations (e.g., "Deal moved to Under Contract. Settlement milestones created.").
- Drag a card to Lost or Withdrawn and a prompt asks for a loss reason before confirming.
- Right-click a card for a context menu: Edit Deal, View Property, View Client, Delete Deal, Move to Top/Bottom.
- Column headers show a count badge that updates in real time.
- The board auto-scrolls horizontally when dragging a card to the edge.
- Expanding an "Offer Made" card reveals the offer sub-view with full offer history, amounts, and days-since-last-action.

**Filtering & Views**: A toolbar above the board provides:
- Filter by agent (for agency accounts).
- Filter by client.
- Filter by priority.
- Filter by property type.
- Toggle to show/hide Lost and Withdrawn columns.
- "Compact Mode" toggle to reduce card height for high-volume views.

### 3d — Property Card (Slide-Out Drawer)

**Layout**: A drawer panel slides in from the right side of the screen, overlaying the current view with a semi-transparent backdrop. On mobile, it occupies the full screen as a push navigation.

**Header** (sticky):
- Property thumbnail (hero image, 16:9) with image counter overlay ("3/12 photos").
- Address (large, bold).
- Suburb, State Postcode.
- Price or price guide.
- Status badge: For Sale, Auction, Under Offer, Sold.
- Quick action buttons row: Share, Save/Unsave (bookmark), More (dropdown with: Report Listing Error, Export PDF).

**Tab Bar** (sticky, horizontally scrollable on narrow widths):

1. **Overview**: Carousel gallery (swipe/click), key stats grid (Bed, Bath, Car, Land Size, Floor Area, Year Built), property type, title type (Torrens, Strata, Community), description (full text, expandable), listing agent details, open home times (if any), auction date/time (if applicable).

2. **Match** (agent only): List of matched clients with match score, criteria hit/miss breakdown, and "Add to Shortlist" action per client. A match radar chart showing how well the property aligns with each client's weighted criteria.

3. **Listing Details**: Full structured data — land dimensions, floor area, year built, last sold date and price, council rates (annual), strata/body corporate fees (quarterly), rental appraisal (weekly, with yield %), zoning classification, council area, lot/plan numbers.

4. **CMA**: Comparable sales table, automated valuation range, market trends chart (suburb median price over 12 months), agent notes and adjustments, "Generate CMA PDF" button.

5. **Feasibility** (agent only): Stamp duty calculator (state dropdown, purchase price input, first-home buyer toggle, investor toggle), rental yield projection, cash flow worksheet (income vs expenses for investors), total acquisition cost breakdown.

6. **Due Diligence**: Checklist view (synced with deal card if a deal exists), risk summary panel (flood, bushfire, heritage, easements), risk overlay map.

7. **Documents**: File list with type tags, upload button, visibility toggles. Links to request missing documents.

8. **History**: Chronological timeline of all actions — listed, price change, matched, shared, feedback, inspection booked, offer made, under offer, sold. Each entry has timestamp, actor, and action detail.

**Persistent Quick Actions Bar** (anchored at bottom of drawer):
- "Add to Shortlist" (primary, opens client selector).
- "Create Deal" (if already shortlisted and client-approved, opens deal creation modal).
- "Share" (copy link, email to client, SMS to client).
- "Dismiss/Archive" (secondary, with confirmation).

**Interactions**: Click backdrop or press Escape to close drawer. Swipe right on mobile to close. Keyboard shortcut: Escape. Tab switching persists across reopening — the last-viewed tab is remembered per session.

### 3e — Client Portal Dashboard

**Layout**: Single-column, centred, constrained to max-width 960px. Clean, minimal design with generous whitespace. Agent's branding (logo, primary colour) applied via tenant settings.

**Sections** (top to bottom):

1. **Header**: Agent logo/name, client's name in greeting ("Welcome back, Sarah"), agent's photo and phone number for quick contact.

2. **My Properties**: Section heading with count. Card grid layout (2 columns on desktop, 1 column on mobile). Each card:
   - Property photo (hero image, 16:9).
   - Address and suburb.
   - Price (formatted as price guide or auction).
   - Key stats: Bed/Bath/Car.
   - Feedback status badge (New/Viewed/Interested/Need More Info/Not For Me) colour-coded.
   - Co-buyer status indicator (if applicable): shows partner feedback state.
   - "Why your agent chose this" — a truncated note from the agent, expandable.
   - Clicking the card navigates to the property detail view.
   - A "Compare" button adds the property to the side-by-side comparison grid (up to 3 properties).

3. **My Settlement** (if client has an active deal): A settlement tracking card showing:
   - Property address and photo.
   - Days remaining countdown.
   - Progress bar of completed milestones.
   - Checklist of actions the client needs to complete (sign documents, pay stamp duty, arrange insurance, book final inspection).
   - Next upcoming milestone.

4. **Suggest a Property**: A simple input field where the client can paste a URL from Domain, RealEstate.com.au, or any listing site. An optional notes field. On submit, the suggestion appears in the agent's "Client Suggestions" inbox.

5. **Recent Activity**: A timeline list showing agent actions — "Your agent added 3 new properties," "Your agent sent an offer letter for 12 Smith St," "Contract signed — well done!" Each item has a relative timestamp and a link to the relevant detail.

6. **My Documents**: A simplified document list showing only agent-shared files. Each row: document name, type badge, upload date, download button. Grouped by deal/property.

**Navigation**: Bottom tab bar on mobile (Properties, Settlement, Documents, Agent). Top nav bar on desktop with the same items.

**Feedback** (within property detail): Prominent three-button feedback strip at the bottom of the page. See Journey 3 for full detail. Feedback is button-based, not swipe-based.

**Authentication**: Magic-link login. No password creation. Agent dashboard sessions persist for 24 hours of inactivity. Client portal sessions persist for 7 days of inactivity. Logout clears session.

**Calendar**: Client portal displays upcoming events relevant to the client — open home times for shortlisted properties, scheduled inspections, auction dates. Sourced from the agent's synced calendar.

---

## 4. Navigation & Information Architecture

### 4.1 Agent Sidebar Navigation

Primary navigation items (icon + label), ordered by usage frequency:

1. **Dashboard** — Main overview, stat cards, activity feed.
2. **Clients** — Client list with search, filter, and sort. Drill-down to client profile with tabs: Overview, Brief, Shortlist, Deals, Documents, Activity.
3. **Properties** — Property list with map toggle and discovery view. Drill-down to property card.
4. **Deals Pipeline** — Unified Kanban board view (default), list view alternative. Filter by stage, agent, client. Single pipeline (no separate Offer Pipeline).
5. **Client Suggestions** — Inbox of properties clients have submitted via the portal URL paste feature.
6. **Selling Agents** — CRM-style contact list of listing agents and agencies. Notes log per contact.
7. **Documents** — Global document vault across all deals and clients. Search, filter by tag, upload.
8. **Reports** — Generated reports: CMA reports, client activity summaries, pipeline health, revenue forecasts.
9. **Settings** — Agency profile, team management (for agencies), billing, integrations (REA/Domain/CoreLogic API keys, Google Calendar/Outlook, DocuSign/Annature, PEXA, email provider), notification preferences, template management (email, offer letter, CMA).

Global search bar at the top of the sidebar (or in a top header bar): type to search across clients, properties, deals, and documents simultaneously. Results grouped by entity type. Keyboard shortcut: Cmd/Ctrl+K.

Bottom of sidebar: agent avatar with dropdown (Profile, Switch Agency if multi-agency), notification bell with unread count, "What's New" (changelog), Help/Support link, Logout.

### 4.2 Client Portal Navigation

Simplified navigation:
- **My Properties** — Gallery of shortlisted properties with feedback statuses. Compare view. Suggest a property input.
- **My Settlement** — Settlement countdown and checklist (visible when client has an active deal).
- **Documents** — Agent-shared documents filtered to this client.
- **My Agent** — Agent contact card with photo, phone, email, and a simple contact form to send a message.

Settings gear icon (top-right) for: notification preferences (email/SMS frequency), logout.

### 4.3 Global Search

Accessible via Cmd/Ctrl+K from anywhere in the agent dashboard. Search modal with large input field. Results appear as a grouped dropdown:
- **Clients**: Name, email, active brief count.
- **Properties**: Address, price, status.
- **Deals**: Property address, client name, stage.
- **Documents**: File name, type tag, associated deal.

Each result row is clickable and navigates directly. Recent searches shown when input is empty.

---

## 5. Responsive Design Strategy

### 5.1 Breakpoints

| Breakpoint | Target Device | Width Range |
|---|---|---|
| Desktop | Laptops, monitors | >= 1280px |
| Tablet Landscape | iPad, large tablets | 1024px - 1279px |
| Tablet Portrait | Small tablets | 768px - 1023px |
| Mobile | Phones | < 768px |

### 5.2 Desktop-First Approach

The core platform (dashboard, Kanban, CMA reports, document management, settings) is designed for desktop first. These are cognitively heavy tasks that agents perform at their desks. Desktop gets the richest feature set: multi-column layouts, drag-and-drop, keyboard shortcuts, split views (map + list side by side), and data tables with advanced filtering.

### 5.3 Mobile-Optimised Views

Mobile is purpose-built for three field workflows:

**Inspection Mode**: When an agent is at a property inspection or open home, they need:
- Quick photo capture (camera integration, photos auto-attached to the property record).
- Voice-to-text notes (transcribed and saved to property History).
- One-tap client communication ("Share this property with Sarah").
- The inspection view is a streamlined single-column flow with large touch targets. It can be launched from a property card via an "Inspection Mode" button that opens a camera-first interface.

**Client Communication**: Push notifications open directly into the feedback thread. Agent can read client feedback and reply with minimal typing. Tap buttons for quick status changes.

**Notification Triage**: A mobile notification centre aggregates all alerts. Long-press a notification for quick actions (Reply, Dismiss, Mark Read). Pull-to-refresh fetches latest activity.

### 5.4 Tablet Support

On iPad and similar devices:
- The sidebar collapses to icon-only mode, expanding on tap.
- The Kanban board is scrollable horizontally with swipe gestures. Cards are slightly larger than mobile for touch-friendly dragging.
- The map view is full-screen with a floating bottom sheet for the property list (drag up to reveal, drag down to collapse), mimicking mobile map app patterns.
- Split view supported: two apps side by side on iPadOS — the platform should gracefully handle a width of 50% of the screen, collapsing to a single-column layout if below the tablet breakpoint.

### 5.5 Adaptive Component Behaviour

- **Property Card (Slide-Out)**: On mobile, it becomes a full-screen push navigation instead of a drawer. On tablet, it's a right-side drawer at 60% width.
- **Data Tables**: On mobile, tables collapse into card lists (each row becomes a card with label-value pairs stacked vertically).
- **Kanban Board**: On mobile, columns become a horizontally scrollable single-column view with swipe to advance cards between stages (swipe left = advance, swipe right = move back).
- **Maps**: Full-screen on mobile with the filter panel as a bottom sheet. On desktop, map and list share screen width.
- **Modals**: On mobile, modals become full-screen bottom sheets.
- **Comparison Grid**: On desktop, 3 properties side-by-side. On mobile, stacks vertically with swipe to advance between properties.

---

## 6. UI Component Library

The following reusable components form the design system. Each component should be built once and used identically across the agent dashboard and client portal.

### Data Display Components

- **PropertyCard**: Thumbnail, address, price, stats (bed/bath/car), status badge, match score badge (agent view), feedback status (client view). Clickable to open detail drawer. Variants: compact (list row), standard (grid card), detailed (full-page).
- **ClientCard**: Avatar/initials, name, email, phone, brief status indicator, active deals count, last activity timestamp. Clickable to client profile.
- **DealCard**: Property thumbnail, address, client name, offer amount, days in stage, priority flag, progress bar (DD stage only), offer sub-state badge (Offer Made stage), cooling-off countdown (Under Contract stage). Draggable in Kanban context.
- **MilestoneTimeline**: Horizontal scrolling timeline with nodes at each milestone. Each node shows: date (relative offset or absolute date), title, status icon. Click to expand detail. Lines connect completed nodes (green) and incomplete nodes (grey dashed).
- **StatCard**: Large number/ count + label + trend indicator (up/down arrow with percentage). Clickable to navigate to filtered list.
- **ActivityFeed**: Chronological list of events. Each item: icon (by event type), actor/action text, relative timestamp, link to source. Filterable by event type.
- **StatusBadge**: Coloured label indicating state. Variants: New, In Progress, Completed, Overdue, Lost, Won. Colour + icon + text label for accessibility.
- **MatchScoreBadge**: Circular or pill-shaped indicator showing 0-100 score. Colour: green (80+), amber (50-79), grey (below 50). Used on property cards and match lists.
- **FeedbackBadge**: Shows client's current feedback state. Colours: green (Interested), amber (Need More Info), red (Not For Me). Also shows co-buyer split status when applicable.

### Layout Components

- **Sidebar**: Fixed left navigation. Collapsible to icon-only. Supports nested sub-items (e.g., Reports -> CMA Reports, Pipeline Reports). Active item highlighted.
- **SlideOut**: Right-side drawer panel. Accepts any content as children. Supports configurable width (default 520px). Backdrop click or Escape closes. On mobile, renders as full-screen push.
- **Modal**: Centre-screen dialog with backdrop. Sizes: Small (400px), Medium (600px), Large (800px). Supports header, body, footer with action buttons. Traps focus for accessibility.
- **KanbanBoard**: Horizontal column layout with drag-and-drop support. Accepts configurable columns and card renderer. Supports horizontal scroll, column reordering, and card filtering. "Offer Made" column cards expand to reveal offer sub-view.
- **Tabs**: Horizontal tab bar with underline active indicator. Supports overflow scrolling for many tabs. Persists selected tab.
- **ComparisonGrid**: Side-by-side property comparison layout (max 3 properties). Each column shows full property card with feedback buttons. Responsive: stacks vertically on mobile with horizontal swipe.

### Input & Action Components

- **SearchBar**: Text input with search icon, clear button, and keyboard shortcut hint. Supports autocomplete dropdown with grouped results. Debounced input (300ms).
- **FilterPanel**: Horizontal chip row (selected filters) + dropdown filter builder. Each chip shows filter name and value with an X to remove. "Clear All" action.
- **FloatingQuickActions**: Persistent action bar anchored to bottom of a detail view. 2-4 primary action buttons. On mobile, adjusts to safe-area insets.
- **RichTextEditor**: Minimal toolbar (bold, italic, bullet list, numbered list, link, heading levels 1-3). Distraction-free mode for longer writing. Used for CMA commentary, offer letters, client notes.
- **FileUploader**: Drag-and-drop zone with file type validation, 50MB size limit enforcement, upload progress bar, preview for images, and error states. Supports multiple files simultaneously.
- **Toast/Notification**: Non-blocking temporary message appearing in bottom-right (desktop) or top (mobile). Variants: Success (green), Error (red), Warning (amber), Info (blue). Auto-dismiss after 5 seconds or manual dismiss via X. Stackable (up to 3 visible).
- **FeedbackButtonGroup**: Three-button strip (Interested / Need More Info / Not For Me) with associated comment field. Used in property detail views. Replaces any swipe-based interaction.
- **PropertyURLInput**: Simple text input for clients to paste a property listing URL with an optional notes field. "Send to Agent" submit button.

### Map & Visualisation Components

- **MapView**: Wrapper around the map provider (Google Maps or Mapbox). Accepts pin data, layer toggles, cluster configuration. Exposes methods: flyTo, fitBounds, addLayer, removeLayer. Emits events: pinClick, mapMove, zoomChange.
- **RiskOverlayMap**: Extension of MapView pre-configured with flood, bushfire, heritage, and easement layers. Toggle controls in top-right. Risk summary panel below.

### Feedback & Status Components

- **EmptyState**: Illustration + heading + descriptive text + call-to-action button. Used when a list has no items. Contextual: "No properties shortlisted yet" with "Browse Properties" button.
- **LoadingSkeleton**: Animated placeholder shapes matching the layout of the content being loaded (card skeletons, table row skeletons). Prevents layout shift.
- **ErrorState**: Error icon + message + retry button. Used for failed API calls or data loading failures.
- **ProgressBar**: Horizontal bar showing completion percentage. Variants: determinate (known total), indeterminate (unknown total, animated). Used for due diligence, profile completeness.
- **CountdownTimer**: Prominent display showing days/hours/minutes to a target date. Pulsing animation when under 48 hours. Used for settlement, auction, cooling-off expiry.
- **SettlementCountdown**: Client-facing simplified countdown with days remaining, milestone progress, and client action checklist.

---

## Document Metadata

- **Version:** 1.1
- **Last Updated:** 2026-05-23
- **Status:** Comprehensive UI/UX Specification — All User Journeys (Revised per product/UX review)
- **Revision Notes (v1.1):**
  - Consolidated Deal Pipeline and Offer Pipeline into single Unified Deal Pipeline (Journey 4)
  - Standardised match threshold to 50 (was 60), configurable (Journey 2)
  - Replaced "Love It/Maybe/Not For Me" feedback labels with "Interested/Need More Info/Not For Me" (Journey 3)
  - Replaced all Tinder-style swipe mechanics with button-based feedback in property detail view (Journey 3)
  - Added comparison grid view (3 properties side-by-side) as primary client evaluation mode (Journey 3, §3e, Components)
  - Added design rationale explaining why swipe UX is inappropriate for high-stakes property decisions (Journey 3)
  - Restructured Buyer Brief Wizard from 4 steps to 6 steps, explicitly mapped to Doc 08 sections (Journey 1)
  - Standardised milestone day counts to relative offsets from acceptance date (Journey 5)
  - Added state-by-state cooling-off references and auction zero cooling-off note (Journey 4, Journey 5)
  - Standardised file upload size to 50MB (Journey 5, Components)
  - Standardised CMA land size tolerance to ±30% (Journey 4)
  - Standardised session persistence: 24-hour agent dashboard, 7-day client portal (§3e)
  - Added calendar integration (Google Calendar/Outlook sync) to Journey 5 and §3e
  - Added co-buyer/partner approval workflow with split-decision badge (Journey 3)
  - Added "Suggest a Property" feature to client portal (§3e, Components)
  - Added client settlement tracking view (§3e, Components)
  - Added PEXA workspace status tracking to Journey 5
  - Added "Client Suggestions" inbox to agent sidebar navigation (§4.1)
  - Added Section 66W Certificate (NSW cooling-off waiver) to offer letter conditions (Journey 4)
  - Updated Kanban board columns to reflect unified pipeline (§3c, Journey 4)
  - Added FeedbackButtonGroup and PropertyURLInput to component library (Components)
- **Next Document:** None (end of blueprint)
