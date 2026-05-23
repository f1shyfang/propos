# 01 - Vision & Strategy

## 1. Problem Statement

Australian buyer's agents operate in a fragmented technology landscape that forces them to juggle multiple disconnected tools to serve a single client. This "tab fatigue" drives operational inefficiency, missed opportunities, and a subpar client experience.

### The Fragmented Tool Stack

A typical buyer's agent works across 6-8 distinct software platforms per transaction:

- **CRM**: HubSpot, Follow Up Boss, or Salesforce for contact and pipeline management
- **Property Portals**: Domain.com.au and realestate.com.au for active listings
- **Data & Valuation**: CoreLogic RP Data or Pricefinder for comparable sales, property history, and automated valuations
- **Spreadsheets**: Excel or Google Sheets for feasibility analysis, cash flow modelling, and deposit tracking
- **Document Management**: DocuSign for contracts, Dropbox or Google Drive for file storage
- **Communication**: WhatsApp, SMS, email, and phone — all in separate channels
- **Off-Market Sourcing**: Excel files, phone notes, and personal relationships, with no centralised system

None of these tools are designed for the buyer's agent workflow. They are generic platforms that require manual integration, double-entry of data, and constant context-switching.

### Market Scale

The Australian residential property market is one of the world's largest by value, with approximately $11 trillion in total dwelling value [Source: CoreLogic, 2025]. In the March quarter 2026, there were 139,794 new loan commitments for dwellings nationally, representing $103.0 billion in new lending [Source: ABS Lending Indicators, March Quarter 2026]. The national median house price across combined capitals continues to rise, with Sydney at $1.79 million, Melbourne at $1.08 million, Brisbane at $1.21 million, and Perth at $1.18 million [Source: Domain House Price Report, March 2026].

The total number of buyer's agents practising in Australia is not centrally recorded by any government agency. REBAA, the industry association, maintains a member directory, but membership is voluntary, making the total population difficult to measure with precision. Best estimates based on industry association membership and licensing data suggest the market consists of several thousand active practitioners, predominantly sole operators and small agencies of 2-10 agents.

### Quantifying the Inefficiency

Specific time-loss data for Australian buyer's agents is not available from any published government or industry research. The following estimates are drawn from analogous studies in professional services and real estate:

- **Context switching cost**: Research on knowledge workers in general finds that switching between applications consumes approximately 20% of productive time. For a buyer's agent working a 50-hour week, this represents roughly 10 hours per week lost to tool-switching. *Note: This is extrapolated from general workplace productivity research and has not been specifically measured for Australian buyer's agents.*
- **Double data entry**: Client requirements entered into a CRM must be manually replicated in property alerts, emails to selling agents, and comparative market analysis tools. Each manual transfer introduces error risk and wastes billable time.
- **Deal lifecycle duration**: A typical buyer's agent engagement spans 1-6 months. The manual coordination overhead lengthens this cycle, reducing the number of concurrent clients an agent can manage.

### Why Now

The Australian property market is experiencing heightened competition and price sensitivity. Domain's March 2026 House Price Report notes that "buyers are more cautious, more price-sensitive, and increasingly selective about where and what they purchase" [Source: Domain House Price Report, March 2026]. In this environment, buyer's agents who can operate faster, with better data, and deliver a superior client experience will capture disproportionate market share. The technology gap represents both a vulnerability for incumbents and an opportunity for a purpose-built platform.

---

## 2. Target Users

### Primary: Australian Buyer's Agents

**Sole Operators (1 agent)**
- Manages every phase of the client journey personally
- Typically handles 1-3 active clients at any given time
- Relies heavily on personal relationships with selling agents
- Often operates without a formal CRM — managing clients via email, phone, and memory
- Price-sensitive but values time savings highly (time is their only non-scalable resource)
- Willing to pay $100-$300/month for software that demonstrably saves 10+ hours/week

**Small Agencies (2-10 agents)**
- Multiple agents working under a single brand/license
- Needs team collaboration: shared client pools, property shortlists, and activity tracking
- Often has a principal agent managing client relationships while junior agents handle research
- May have an existing CRM but lacks property-specific workflow tools
- Pain points include consistency across agents, client handoffs, and pipeline visibility
- Willing to pay $300-$1,000+/month for team-level tools

### Secondary: Property Buyers (via Client Portal)
- Investors, home buyers, and relocators who engage a buyer's agent
- Need visibility into the search process and confidence in their agent's work
- Desire a consumer-grade digital experience comparable to fintech or proptech platforms
- The client portal serves as both a service differentiator for the agent and a retention tool

### Workflow Archetype

A typical buyer's agent engagement follows this pattern:

1. **Intake (Week 1)**: Meet client, document buyer brief (budget, location preferences, property type, must-haves, deal-breakers), verify finance pre-approval capacity
2. **Sourcing (Weeks 1-8)**: Search portals daily, maintain off-market relationships, shortlist properties, conduct drive-by inspections
3. **Shortlisting (Ongoing)**: Present properties to client, collect feedback (like/dislike with reasons), refine search parameters
4. **Due Diligence (Per shortlisted property)**: Run comparable market analysis (CMA), check council overlays, flood/fire risk, school zones, strata reports, building inspection history
5. **Negotiation (Per offer)**: Contact selling agent, understand vendor motivation, structure offer (price, conditions, settlement terms), manage counter-offers
6. **Auction Support**: Register client, set bidding strategy, bid on auction day, manage post-auction negotiation if passed in
7. **Transaction (Post-acceptance)**: Coordinate conveyancer/solicitor, building and pest inspections, finance unconditional approval, settlement milestones
8. **Post-Settlement**: Manage property handover, rental listing if investor, ongoing relationship management for repeat/referral business

At present, no single platform supports this end-to-end workflow. Each phase relies on a different tool, creating a fragmented and manual process.

---

## 3. Platform Vision

### The Single Operating System for Buyer's Agents

The platform is the unified command centre that replaces the fragmented tool stack. Every phase of the buyer's agent workflow — from first client contact to post-settlement follow-up — lives in a single, purpose-built system.

### What "Done" Looks Like

A buyer's agent logs in each morning and sees:

- **A unified dashboard**: Active clients, hot properties matched overnight, offers in play, upcoming milestones (auctions, inspections, settlement dates), and tasks due today
- **Auto-matched properties**: Overnight, the system has pulled new listings from Domain, realestate.com.au, and off-market sources, scored them against each client's buyer brief, and surfaced the top matches — ranked and ready for review
- **One-click property actions**: From any property, the agent can add to a client shortlist, generate a CMA report, check risk overlays (flood, bushfire, zoning), send to client for feedback, or initiate contact with the selling agent — all without leaving the platform
- **A live client portal**: Clients see their shortlisted properties, provide Tinder-style yes/no feedback with notes, access due diligence documents in a secure vault, and track their purchase journey in real time
- **Automated selling agent outreach**: The platform tracks communication history with every selling agent, logs vendor motivation, and prompts follow-ups — turning relationship management from ad-hoc memory into systematic process
- **Integrated transaction management**: From offer acceptance to settlement, the platform tracks every milestone, manages document collection, and coordinates third-party providers (conveyancer, building inspector, mortgage broker)

### Platform Architecture (Conceptual)

The six-phase unified platform:

1. **CRM & Buyer Brief** — Dynamic intake forms, finance capacity tracking, buyer strategy builder with constraints engine
2. **Sourcing & Matching** — Multi-portal listing aggregation, off-market deal pipeline, AI-powered property-to-brief matching engine
3. **Due Diligence & Research** — Automated CMA generation, risk overlay mapping (flood, bushfire, overlays), investment return calculators
4. **Client Portal** — Branded client dashboard, Tinder-style property feedback, secure document vault, in-app messaging
5. **Negotiation & Offer Tracking** — Offer management pipeline, auction preparation and tracking tools, selling agent relationship CRM
6. **Transaction & Settlement** — Conveyancing milestone tracker, third-party service coordination, post-settlement follow-up automation

---

## 4. Core Value Proposition

### Time Saved Per Deal

By eliminating context-switching, manual data entry, and tool fragmentation, the platform is designed to save 15-25 hours per client engagement. This estimate is based on:

- Elimination of manual property searching and cross-referencing across portals (5-8 hours/week)
- Automated CMA and due diligence report generation (3-5 hours per property)
- Unified communication (no switching between WhatsApp, email, phone logs) (2-4 hours/week)
- Automated document management and milestone tracking (3-5 hours per transaction)
- Single-source-of-truth client brief eliminates re-explaining requirements (1-2 hours/client)

*Note: These savings estimates are targets derived from the platform's feature set and have not been validated through controlled user studies. They represent the design intent.*

### Deals Per Agent Per Month

A sole operator currently managing 1-3 active clients could increase capacity to 3-5 concurrent clients by reducing administrative overhead 30-50%. For a small agency, the platform enables junior agents to handle research and sourcing independently, freeing the principal agent to focus on client relationships and negotiation.

### Error Reduction

Manual processes introduce errors: missed properties that matched a client's brief, incorrect comparable sales in a CMA, overlooked council restrictions, forgotten contract conditions, missed settlement dates. A unified platform with automated data flows and alerts reduces these risks by ensuring data is entered once and flows to all relevant functions.

### Client Experience Improvement

The client portal transforms the buyer's agent experience from "black box" to transparent journey:
- Clients see what their agent is doing in real time
- Feedback loops are fast and structured
- All documents are accessible in one place
- The Tinder-style interface makes property reviewing engaging rather than overwhelming
- Higher client satisfaction drives referrals, the primary customer acquisition channel for buyer's agents

### Competitive Differentiation for Agents

Buyer's agents using the platform can demonstrate a materially faster, more data-driven, and more transparent service than competitors relying on manual processes. In a market where "buyers are more cautious, more price-sensitive, and increasingly selective" [Source: Domain House Price Report, March 2026], speed and data quality are decisive competitive advantages.

---

## 5. Success Metrics

### Platform Metrics

| Metric | Target (12 Months) | Measurement |
|--------|-------------------|-------------|
| Active agents (paying) | 50+ | MRR accounts |
| Properties sourced per agent per month | 200+ | Aggregated listings ingested per agent |
| AI match accuracy (% of matches shortlisted by agent) | >60% | Shortlisted / total matched |
| Client portal engagement (% of clients active weekly) | >70% | Unique logins per client per week |
| Offers managed through the platform | 100+ | Offer pipeline volume |
| Platform NPS (agent) | >50 | In-app survey |
| Time from intake to first property shortlist | <48 hours | Workflow timestamps |

### Agent Outcome Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Reduction in time spent on admin/research per deal | 30-50% | Time-tracking comparison (qualitative at launch) |
| Increase in concurrent clients per agent | +1-2 | Agent self-report |
| Reduction in "missed property" incidents | >80% | Agent self-report |
| Increase in client referral rate | +20% | Agent self-report |

### Leading Indicators (First 90 Days)

- Number of agents in free trial
- Trial-to-paid conversion rate (>25% target)
- Daily active usage (DAU) during trial
- Number of properties viewed per agent
- Number of buyer briefs created

---

## 6. Strategic Moats

### Moat 1: Property Data Normalisation Engine

Australian property data is fragmented across sources (Domain, realestate.com.au, CoreLogic, Pricefinder, government datasets) with inconsistent schemas, addresses, and property identifiers. The normalisation engine that ingests, deduplicates, and enriches listings from multiple sources creates a single unified property record. This is a hard technical problem that compounds in value as more data sources are added.

### Moat 2: AI Matching & Buyer Brief Engine

Generic property search (bedrooms, bathrooms, price range) produces noise. The matching engine combines:
- Structural brief constraints (budget, location, property type, bedroom/bathroom count)
- Qualitative preferences (architectural style, aspect, renovation potential)
- Financial constraints (borrowing capacity, LVR limits, stamp duty, ongoing costs)
- Risk profile (flood zones, bushfire overlay, council restrictions, strata health)

The proprietary scoring algorithm that ranks properties against a detailed buyer brief improves with usage data, creating a data network effect: more briefs → better matching → more agents → more briefs.

### Moat 3: Workflow Automation

While CRMs and portals exist independently, the integrated workflow that connects buyer brief → property match → client feedback → due diligence → offer → settlement is the defensible core. Partial competitors (CRM-only, portal-only) cannot match the efficiency of a single system where a property match triggers the CMA, populates the client portal, and generates the selling agent outreach in one automated flow.

### Moat 4: Selling Agent Relationship Network

Every interaction between a buyer's agent and a selling agent captured in the platform builds a relationship graph. Over time, the platform knows which selling agents respond fastest, which prefer email vs. phone, which typically represent motivated vendors, and which properties are coming to market before they appear on portals. This network effect increases in value with every agent and every interaction.

### Moat 5: Australia-Specific Compliance & Regulatory Knowledge

Australian real estate varies by state: different contract laws, cooling-off periods, stamp duty regimes, first home buyer grants, and foreign investment rules. A platform purpose-built for the Australian market embeds this regulatory complexity into the workflow, making it hard for generic international platforms to compete without significant localisation investment.

---

## 7. Key Risks & Mitigations

### Regulatory Risk

| Risk | Severity | Mitigation |
|------|----------|-----------|
| State-based licensing requirements for buyer's agents vary (NSW, VIC, QLD, etc.) | Medium | Platform designed as a workflow tool, not a replacement for licensed advice. Compliance checklists prompt agents to verify licensing requirements per state. |
| Privacy Act 1988 (Cth) — handling of client financial data, property valuations, and personal information | High | Australian-hosted infrastructure, SOC 2 equivalent security practices, consent management for client data sharing. Privacy by design in data model. |
| Changes to foreign investment rules (FIRB) affecting buyer pool | Low | Configurable rules engine for buyer brief constraints to adapt to regulatory changes without code changes. |

### Technical Risk

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Portal data scraping legality — Domain and REA Group (realestate.com.au) TOS restrict automated access | **Critical** | Primary strategy: negotiate API access agreements or use official data feeds. Fallback: partner with licensed data redistributors (CoreLogic, Pricefinder, Domain API). Do not build a business reliant on scraping. |
| CoreLogic/Pricefinder API costs — premium property data is expensive | High | Design data architecture to minimise API calls (caching, batch processing). Pass-through data costs as premium tier pricing. |
| AI matching quality — poor matches erode agent trust rapidly | High | Start with rule-based matching augmented by simple ML. Improve iteratively. Allow agents to override and provide feedback on every match, feeding a continuous improvement loop. |

### Competitive Risk

| Risk | Severity | Mitigation |
|------|----------|-----------|
| REA Group or Domain building workflow tools into their existing agent platforms | **CRITICAL** | REA Group (ASX:REA, ~$30B market cap) owns realestate.com.au, the dominant Australian property portal with unmatched listing data, agent relationships, and engineering resources. REA already operates `REA Agent Tools` for selling agents and could add buyer's agent workflow features (buyer brief management, property matching, client portal) as an extension. Domain Group (ASX:DHG) owns Pricefinder and has similar capability. What they would need: (a) buyer-brief-to-property matching engine, (b) client portal, (c) due-diligence workflow layer. Our defensive moat: (a) BA-specific workflow depth is a niche REA/Domain have historically ignored — building seller tools for 60K+ agents is their core business; (b) data normalisation across REA, Domain, and off-market sources is something neither portal would do for competitive reasons; (c) speed of execution and community trust built through deep BA relationships. The risk remains critical because either portal could decide tomorrow to build BA features and distribute to their existing agent user base at zero marginal cost of sales. |
| HubSpot or Salesforce adding property-specific modules | Low | Generic CRMs lack the domain-specific data, integrations, and workflow depth. The integration of property data + AI matching + client portal is a vertical solution, not a horizontal CRM feature. |
| Established proptech competitors (Reapit, Console, AgentBox) expanding into buyer's agent segment | Medium | These platforms are built for selling agents. The buyer's agent workflow is fundamentally different (sourcing vs. listing, representing buyer vs. vendor). Adapting a sell-side platform to buy-side is architecturally challenging. |

### Adoption Risk

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Buyer's agents are not traditionally heavy software adopters — many run businesses on Excel, email, and phone | High | Design for progressive onboarding: single-feature adoption (e.g., start with buyer brief and matching) before full platform rollout. Show immediate time savings (first hour of use). Offer data migration from existing spreadsheets/CRMs. |
| Chicken-and-egg: platform value increases with data, but early adopters get limited benefit | Medium | Pre-seed with publicly available property data, council overlays, and school zone data. Integrate with existing data providers (CoreLogic, Pricefinder) from day one so early adopters get immediate value. |
| All-in-one value proposition is unvalidated — assumes BAs want a unified platform over best-of-breed point solutions | High | The platform's core thesis is that workflow unification saves measurable time and that BAs will switch from existing tools to a single platform. This has not been validated with target users. Mitigation: MVP must demonstrate that workflow unification saves measurable time (target: 10+ hours/week in beta testing); beta feedback must validate willingness to switch from existing tools (target: 80%+ of beta users report they would pay for the platform over their current stack). If beta users report they prefer their existing tools, the value proposition must be re-examined before committing to full build-out. |
| Small total addressable market (Australian buyer's agents only) | Medium | Validate with Australian market first. Proven product-market fit enables expansion to adjacent segments: selling agent buy-side workflows, mortgage brokers, property investment advisors, and international markets with similar professional structures (UK, NZ). |

### Financial Risk

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Data licensing costs (CoreLogic, Domain API, realestate.com.au) consuming runway | High | Negotiate startup-friendly pricing with data vendors. Prioritise integrations with providers that offer metered or revenue-share pricing. Build a lean data model that minimises per-query costs. |
| Per-agent revenue must exceed per-agent variable costs (data, hosting, support) | Medium | Tiered pricing model: basic (aggregated data, limited reports), professional (full data access, CMA generation), agency (multi-agent, team features). Gross margin target: >70% at scale. |

---

## Document Status

- **Version**: 1.0 — Draft
- **Last Updated**: May 2026
- **Next Review**: After stakeholder feedback round
- **Data Freshness Note**: Property market statistics reflect the most recent publicly available data as of May 2026. Key sources: ABS Lending Indicators (March Quarter 2026), Domain House Price Report (March 2026), CoreLogic/Cotality research. Where specific data (e.g., number of buyer's agents, precise time-loss figures) is not available from published sources, this has been explicitly noted.

---

## Revision Notes (Post Adversarial Review — May 2026)

1. **REA Group competitive risk upgraded from Medium to CRITICAL (§7).** Added detailed analysis of what REA Group ($30B ASX, owner of realestate.com.au) and Domain Group would need to build to compete, plus assessment of our defensive moat (BA-specific workflow depth, data normalisation across competing portals, community trust).
2. **Added "All-in-one assumption" risk note (§7, Adoption Risk).** The core value proposition that BAs want an all-in-one platform over best-of-breed is unvalidated. Added mitigation requiring beta validation of willingness to switch and measurable time savings before full build-out.
