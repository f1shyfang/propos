# 11 — Long-Term Roadmap

**Document scope:** Maps the journey from hackathon MVP (Phase 0) to full production SaaS platform serving the Australian buyer's agent market. Covers 30 months across four post-hackathon phases.

**Team assumption:** 3 full-time engineers after hackathon (co-founders), growing to 5–8 by Year 2. No dedicated designer, no dedicated sales team at launch — everyone sells in the early days.

**Reference baseline:** Typical B2B SaaS takes 18–24 months to reach $10K MRR with a team of 3–5 (ChartMogul, 2023). This roadmap targets viability at 12 months and scaling at 30 months. Australian real estate data licensing adds 3–6 months to any B2B SaaS timeline — this is factored into the extended Phase 1.

---

## 1. Development Phases Overview

| Phase | Duration | Goal | Team Size |
|-------|----------|------|-----------|
| **Phase 0** | Hackathon (48–72 hrs) | Working demo: mocked auth, demo listings, basic brief → property match UI. Proves concept to judges and early adopters. | 3 (hackathon mode) |
| **Phase 1** | Months 1–6 | Foundation. Productionise the MVP. Real auth, real data integrations, basic CRM. First 5–10 beta agents. Scope reduced by 50% vs. original plan to account for data licensing complexity. | 3 full-time |
| **Phase 2** | Months 7–12 | Intelligence. Iterated rule-based scoring, CMA generation, client portal redesign, notification system. Target 20 agents. PostGIS integration. | 3 full-time |
| **Phase 3** | Months 13–18 | Full Workflow. Due diligence, offer tracking, auction tools, billing. Launch to wider market. Target 50–100 paying agents. | 3–5 (first hires) |
| **Phase 4** | Months 19–30 | Ecosystem. Transaction management, ML-based matching (sustained by Phase 2-3 training data), mobile app, multi-state expansion. Target 200+ agents. | 5–8 |

Phase 0 is defined separately in the MVP specification. This document begins in detail at Phase 1.

---

## 2. Detailed Milestone Timeline

### Phase 1 — Foundation (Months 1–6)

**Objective:** Turn the hackathon prototype into a platform real agents will log into weekly. Scope is deliberately constrained — data licensing is the critical path, not feature breadth.

#### Month-by-month breakdown

| Month | Focus Area | Key Deliverables |
|---|---|---|
| **1–2** | Infrastructure + Auth + Data Pipeline | PostgreSQL migration from SQLite. Set up staging/production environments (Vercel + Railway or Supabase). Basic CI/CD (lint, type-check, deploy staging). Replace mocked auth with Clerk or Auth0. Password reset, session management, RBAC scaffolding (agent vs. admin). Row-level security for multi-tenant data isolation. Begin Domain/CoreLogic API integration: fetch → transform → store pipeline. |
| **3–4** | Property Search + Basic CRM | Complete Domain API data pipeline with caching layer and rate-limit queue. Basic property search with filters driven by brief parameters (suburb, price range, bedrooms, property type). Client management: create/edit/archive client profiles. Buyer brief CRUD with structured data. Brief status pipeline (draft → active → completed → archived). |
| **5–6** | Email Alerts + Beta Onboarding | Saved search email alerts (manual trigger initially). Notification templates. Onboard first 5–10 beta agents with deep manual onboarding. Built-in feedback widget. Weekly feedback calls with each beta user. Bug triage and rapid iteration based on real usage. |

**Deferred from original Phase 1 scope:**
- PostGIS geospatial queries → Month 7+ (Phase 2)
- Full CRM with pipeline reports → Phase 2
- Saved searches with schedule/auto-trigger → Phase 2
- Multi-tenancy agency features → Phase 3

> **CRITICAL DEPENDENCY: Domain/CoreLogic API Access**
>
> Without commercial API agreements, the product has no live property data. This is the single biggest existential risk to the platform.
>
> - **Start negotiations NOW** — before Phase 1, not at Week 5. Australian real estate data licensing negotiations routinely take 3-6 months. If you start at Month 1, data might not flow until Month 4-7.
> - **Fallback strategy:** Manual data entry via virtual assistant scraping public portals (Domain, REA) while commercial negotiations continue. This is not sustainable but keeps the product alive and beta agents seeing real listings during the negotiation period.
> - **Cost range:** Expect $500–$5,000+/mo depending on provider (Domain, CoreLogic, REA), data scope (single state vs. national), and call volume. This is a core COGS line item, not an infrastructure cost.
> - **Alternative data sources:** ABS census data, state planning portals, and government open data can provide suburb profiles, demographics, and risk overlays without licensing fees. Use these for Phase 1 richness while API negotiations progress.

#### Phase 1 exit criteria

- 5 beta agents actively using the platform at least weekly.
- Real property listings flowing into the system daily (or manual entry pipeline operating).
- Agents can create buyer briefs and see matching properties within the app.
- No dependency on the hackathon mock data path.
- Domain/CoreLogic API agreement signed OR fallback pipeline operational.

---

### Phase 2 — Intelligence (Months 7–12)

**Objective:** Move from "manual search tool" to "system that does the work for you."

#### Month-by-month breakdown

| Month | Focus Area | Key Deliverables |
|---|---|---|
| **7–8** | Iterated Rule-Based Scoring | Rule-based scoring engine with adjustable per-agent weights. Match quality explanation — why did this property score high/low? Agent feedback loop: "not interested" / "interested" flags tune weights over time. Log every match + agent action as future ML training data. |
| **7–8** | Search Infrastructure + PostGIS | Integrate Meilisearch or Typesense for full-text and faceted search. Replace simple DB `WHERE` queries. Typo tolerance, synonym support, relevance tuning. PostGIS integration (deferred from Phase 1): geospatial queries for suburb-level filtering and radius search. |
| **9–10** | CMA Generation | Comparable sales selection algorithm (radius, recency, property type similarity). Automated CMA report with selected comparables, price estimates, market commentary. PDF export of CMA reports for client sharing. |
| **9–10** | Client Portal Redesign | Professional branding and UI overhaul. Improved navigation, responsive design audit. Client-facing view (read-only brief, matched properties with agent notes). Photo galleries, map views, comparison views for clients. |
| **11–12** | Notifications & Outreach | Transactional emails: new match alert, brief status change, CMA ready. Drip email sequences: onboarding tips, market updates. Selling agent outreach automation: template-based email/LinkedIn message drafts with property-specific context. Off-market property logging (agent-entered with photo upload). |

**ML matching moved to Phase 4 (Month 19+).** Do not ship black-box ML matching until you have >1,000 labelled agent actions from Phases 2–3. Rule-based scoring with adjustable weights is transparent, debuggable, and builds agent trust. ML requires sufficient training data — deploying too early produces useless results and destroys credibility.

#### Phase 2 exit criteria

- 20 agents active, < 5% monthly churn.
- Agents averaging 3 deals tracked per month.
- Iterated rule-based scoring produces quality matches (agents use results without manual override >70% of the time).
- CMA reports actually used in client conversations (qualitative feedback).
- Search responds in under 200ms at current data scale.

---

### Phase 3 — Full Workflow (Months 13–18)

**Objective:** Be the system of record for everything a buyer's agent does from brief to settlement. Launch to paying customers.

#### Month-by-month breakdown

| Month | Focus Area | Key Deliverables |
|---|---|---|
| **13** | Due Diligence Module | Risk overlay on property maps (flood zones, bushfire risk, heritage overlays — using government GIS layers). Investment calculators: rental yield estimate, stamp duty calculator, cash-flow projection. Body corporate/strata report request automation. |
| **14** | Offer & Negotiation | Offer letter generation with PDF templates (customisable by agency). Offer tracking pipeline: drafted → submitted → counter-offer → accepted/rejected. Auction tracker: auction date, price guide, registered bidders, result logging. |
| **15** | Selling Agent CRM | Contact management for selling agents. Interaction logging (calls, emails, meeting notes). Property assignment (which selling agent has which listing). Relationship scoring: how often do deals close with this agent? |
| **16** | Document Management | S3 document storage with signed URLs. Per-client document vault. Document type tagging (contract, report, inspection, correspondence). Audit trail for document access and sharing. |
| **17** | Billing & Reporting | Stripe billing integration (subscription tiers: Starter / Pro / Agency). Usage-based components (active briefs, CMA reports generated). Agent dashboard: deals in pipeline, conversion rates, revenue tracked, time-to-close. Agency-level reporting for multi-agent teams. |
| **18** | Market Launch | Public launch. Pricing page live. Self-serve signup flow. Free trial (14 days) with credit card required. Onboarding wizard for new agents. Content marketing foundation (blog, case studies, property market insights). |

#### Phase 3 exit criteria (Gate 3)

- 50+ paying agents.
- MRR targets: at $179–$399/mo depending on tier, aiming for $10K–$15K MRR at 50 agents.
- LTV:CAC ratio > 3:1 (requires tracking acquisition cost and churn).
- Key workflow complete: agent can go from brief → match → CMA → offer → close within the platform.

---

### Phase 4 — Ecosystem & Scale (Months 19–30)

**Objective:** Become the operating system for buyer's agencies. Expand beyond core workflow into the broader transaction ecosystem.

#### Quarter-by-quarter breakdown

| Quarter | Focus Area | Key Deliverables |
|---|---|---|
| **Q7 (M19–21)** | ML-Based Matching | Deploy ML matching model trained on >1,000 labelled agent actions from Phases 2–3. Run in parallel with rule-based engine initially — compare results, surface disagreements. Agent overrides feed back into training. Goal: ML matches equal or exceed rule-based quality within 3 months of parallel operation. |
| **Q7 (M19–21)** | Transaction & Settlement | Milestone tracker (finance approved, building inspection, pest inspection, settlement booked). Third-party coordination: assign mortgage broker, conveyancer, building inspector to each deal. Status sharing with client (what's happening now, what's next). Settlement countdown and checklist. |
| **Q8 (M22–24)** | API & Marketplace | Public REST API for third-party integrations. Partner integrations with conveyancing platforms (e.g., PEXA ecosystem). Mortgage broker referral tracking. Webhook infrastructure for event-driven integrations. |
| **Q8 (M22–24)** | Mobile | React Native or PWA mobile app (PWA recommended for small team — single codebase, no app store friction). Push notifications for critical events (auction result, offer response, settlement milestone). Mobile-optimised property viewing and brief management. |
| **Q9 (M25–27)** | Multi-State Expansion | Geographic coverage beyond initial launch state. State-specific calculators and compliance (different stamp duty rules, different cooling-off periods). Data licensing for additional state coverage. |
| **Q9 (M25–27)** | White-Label & Analytics | White-label client portal for larger agencies. Custom domain, agency branding, custom colour schemes. Business intelligence dashboards: deal velocity, win/loss analysis, agent performance, suburb heatmaps. Data export for agency reporting. |
| **Q10 (M28–30)** | Team Growth & Maturation | First dedicated hires beyond engineering: customer success, sales, marketing. Engineering team grows to 5–8. Formal on-call rotation established. SOC 2 readiness assessment (important for enterprise agency clients). |

#### Phase 4 exit criteria (Gate 4)

- 200+ agents on platform.
- Profitable or clear, validated path to profitability.
- Product covers the full transaction lifecycle from brief to settlement.
- Infrastructure handles 1,000+ concurrent users without degradation.
- At least 2 Australian states fully supported.
- ML matching in production, outperforming or matching rule-based quality.

---

## 3. Technical Debt Strategy

### When to refactor

Refactoring happens **after** each major milestone gate, never during a feature sprint. The rhythm is:

- **End of Month 6:** Auth and data layer cleanup (before building intelligence features on a shaky foundation).
- **End of Month 12:** Search and matching engine refactor (before scaling to 50+ agents).
- **End of Month 18:** API architecture and performance review (before adding transactions, ML, and public API).

### Known MVP debt areas

| Area | MVP State | Target State | Priority |
|------|-----------|-------------|----------|
| Authentication | Mocked / hardcoded | Clerk/Auth0 with proper session management, RLS | **Highest** — security must be real before any real data enters the system |
| Data layer | Demo seed data, SQLite | Live API data, PostgreSQL, data integrity constraints. PostGIS in Phase 2. | **Highest** — cannot demo to real agents with fake listings |
| Search | Simple SQL `WHERE` / `LIKE` queries | Meilisearch/Typesense with faceted search, relevance tuning | **Medium** — fine while < 20 agents and < 10K listings |
| Client portal | Basic HTML templates | Branded, responsive, polished UI | **Lowest** — functional UX over pretty UX for early adopters |
| Matching engine | Pre-computed static scores | Rule-based scoring with adjustable weights → ML-based matching in Phase 4 | **Phased** — rule-based is sufficient through Phase 2; ML requires training data not available until Phase 4 |

### Testing strategy evolution

| Phase | Approach | Scope |
|-------|----------|-------|
| MVP | Manual testing only. Ship it. | Happy paths work for demo. |
| Month 1–6 | Critical path integration tests. Auth flow, listing ingestion, brief creation. | Don't let the core loop break. |
| Month 7–12 | CI/CD test suite with coverage targets. Unit tests for matching algorithm. E2E smoke tests for key user journeys. | > 70% coverage on core business logic. |
| Month 13–18 | Load testing for launch. Contract tests for API integrations. Visual regression tests for client portal. | Production-grade reliability. |
| Month 19–30 | Chaos engineering for distributed systems. Penetration testing (annual). SOC 2 audit preparation. | Enterprise-ready security posture. |

---

## 4. Scaling Considerations

### Database

| Stage | Technology | Rationale |
|-------|-----------|-----------|
| MVP | SQLite | Zero setup, single file, perfect for hackathon. |
| Month 1 | PostgreSQL | Production reliability, connection pooling. |
| Month 7–12 | PostGIS | Geospatial queries (suburb polygon contains point). Deferred from Phase 1 to focus on data pipeline. |
| Month 18+ | Read replicas | Separate read-heavy workloads (property search, reporting) from write workloads. |
| Month 24+ | Consider distributed SQL (e.g., CockroachDB) or sharding | If multi-region latency or write throughput becomes a bottleneck. |

### Search infrastructure

| Stage | Technology | Rationale |
|-------|-----------|-----------|
| MVP–Month 6 | PostgreSQL full-text search via GIN indexes | Simple, no additional infrastructure. Works for < 50K listings. |
| Month 7 | Meilisearch or Typesense | Faceted search, typo tolerance, relevance tuning, instant search UX. Self-hosted to control cost. |
| Month 24+ | Sharded search clusters | If listing volume exceeds 500K and query volume exceeds 100/second. |

### External API rate limits (Domain, CoreLogic, government data)

- **Caching layer (Redis):** Cache API responses for properties with TTL based on data freshness requirements. Listings: 1-hour TTL. Sold data: 24-hour TTL. Suburb profiles: 7-day TTL.
- **Request queuing:** BullMQ or similar job queue for property ingestion. Prioritise brief-matching ingestion over background refresh.
- **Graceful degradation:** If Domain API is down, serve cached data and show "last updated" timestamp. Never show blank pages.
- **Cost management:** Track API call costs per agent. This is the single biggest variable cost. If an agent's API usage exceeds their subscription value, throttling or plan upgrade prompts may be necessary.

### Concurrent user scaling

| Users | Architecture | Infrastructure Cost (est. AUD/mo) |
|-------|-------------|-----------------------------------|
| 1 (MVP) | Single VPS or serverless free tier | $0–50 |
| 10 agents (Month 6) | Serverless (Vercel + Supabase free/startup tier), single Redis instance | $50–150 |
| 100 agents (Month 18) | Serverless Pro tier, managed PostgreSQL, Meilisearch instance, S3, Stripe | $500–1,500 |
| 1,000+ agents (Year 2+) | Multi-region deployment, read replicas, dedicated search cluster, CDN, monitoring (Sentry, Datadog) | $2,000–5,000/mo |

These are infrastructure costs only and exclude data licensing fees, which can range from $500 to $5,000+/mo depending on provider and coverage. Data licensing warrants its own budget line item and should be treated as a core COGS component.

---

## 5. Key Risks by Phase

### Phase 1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Domain/CoreLogic API agreement delayed or denied | High | **Critical** | Start negotiations pre-Phase 1. Operate manual data entry fallback while negotiations continue. Use government open data (ABS, state planning portals) for non-listing data. |
| Data licensing costs kill unit economics | Medium | **Critical** | Start with government open data. Negotiate pricing once we have active users and usage data to justify cost. Consider per-request API pricing vs. flat-fee data licenses. |
| Beta agents don't stick | High | High | Deep onboarding (manual, high-touch). Weekly calls. Build features they specifically request. Target early-adopter agents who are tech-forward and dissatisfied with existing tools. |
| 3-person team can't ship fast enough | Medium | Medium | Ruthless scope cutting. Every feature must pass the "does a beta agent need this next week?" test. Say no to anything that doesn't directly serve the core workflow. |

### Phase 2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rule-based scoring produces poor or inconsistent matches | Medium | High | Start with transparent, explainable weights. Agents can see why a property scored 85 vs. 45 and adjust brief parameters. Agent feedback buttons ("interested" / "not interested") generate training data. Don't attempt ML until sufficient labelled data exists. |
| CMA quality is poor (bad comparable selection) | Medium | High | Begin with conservative algorithm (narrow radius, strict recency, tight type match) and allow agent manual override of comparables. Every override is a training signal. |
| Client portal redesign breaks existing workflows | Low | Medium | Redesign incrementally. Ship one page at a time. Keep the old version accessible during transition. |

### Phase 3 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Regulatory compliance for financial calculators (stamp duty, rental yield, investment projections) | Medium | **Critical** | Legal review before launch. All calculators must have prominent disclaimers ("not financial advice, consult a professional"). Outputs must cite data sources. Never present estimates as guarantees. |
| Stripe billing issues at launch (incorrect charges, failed payments) | Medium | High | Extensive billing QA before public launch. Test with real credit cards. Implement dunning management (failed payment retry logic, grace periods). Customer support process for billing disputes ready before launch. |
| Competition from incumbents (Rex, AgentBox, etc.) adding end-to-end features | Medium | Medium | Data moat: the more an agent uses the platform, the more their brief history and deal data is in our system, creating switching costs. Vertical focus: general CRMs can't compete on buyer's agent-specific workflows if we're deep enough. |

### Phase 4 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Expanding to a new state reveals fundamentally different market dynamics the product doesn't handle | Medium | High | Start multi-state expansion with one adjacent state that has similar market characteristics. Don't expand to all states simultaneously. Validate with 5 agents in the new state before broader rollout. |
| ML matching underperforms rule-based engine | Medium | High | Run ML in parallel with rule-based for at least 3 months before switching. Monitor match quality metrics. Keep rule-based as fallback. Require agent override signals as ground truth. |
| White-label requirements blow out scope (each agency wants different customisation) | High | Medium | Define clear white-label interface boundaries. What is configurable vs. what requires custom development. Charge custom development fees for anything outside the configurable scope. |
| Team burnout after 18+ months of intense building | High | **Critical** | Mandate sustainable pace after Month 18. No more hackathon mode. Rotate on-call. Actually take leave. Hire to reduce bus factor, not just to increase output. |

---

## 6. Success Gates

These are non-negotiable checkpoints. If a gate is not met, the team pauses feature development to address the gap before proceeding.

### Gate 1 — Viability (Month 6)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active beta agents | ≥ 5 | Weekly login count |
| Agent NPS | > 30 | In-app NPS survey, monthly |
| Core workflow completion | ≥ 3 agents completed brief → match → property view loop | Product analytics event funnel |
| System uptime | > 99% | Monitoring (excludes planned maintenance) |
| Domain/CoreLogic agreement | Signed OR fallback pipeline operational | Binary check |

**If not met:** Extend Phase 1. Do not build intelligence features until the foundation has real users who value it, and real data flowing.

### Gate 2 — Product-Market Fit Signal (Month 12)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active agents | ≥ 20 | Weekly login count |
| Monthly churn | < 5% | Active agents lost / total active agents |
| Deals tracked per agent per month | ≥ 3 (average) | Deals moving through pipeline |
| CMA reports generated per week | ≥ 5 | Feature usage analytics |
| Search performance | p95 latency < 200ms | APM tooling |

**If not met (churn > 5%):** Interview churned users to understand why. Fix the top reason before building anything new.

### Gate 3 — Revenue Readiness (Month 18)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Paying agents | ≥ 50 | Stripe active subscriptions |
| MRR | ≥ $10,000 AUD | Stripe dashboard |
| LTV:CAC ratio | > 3:1 | Cohort analysis of acquisition cost vs. lifetime value |
| Net revenue retention | > 90% | Expansion revenue minus churn, per cohort |
| Support ticket volume | < 5 per agent per month | Help desk metrics |

**If not met:** Do not hire beyond the founding team. Fix unit economics before scaling spend.

### Gate 4 — Scale Readiness (Month 30)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Paying agents | ≥ 200 | Stripe active subscriptions |
| Profitability | EBITDA positive or clear, board-validated path to profitability within 6 months | Financial model |
| Geographic coverage | ≥ 2 Australian states fully supported | Feature parity across states |
| Platform reliability | 99.9% uptime, p95 API latency < 500ms | Monitoring |
| Team | Founding team still intact, key-person dependency reduced | Bus factor ≥ 3 for all critical systems |

**If not met:** Assess whether the business is a viable standalone company or requires a strategic exit/acquisition.

---

## 7. Funding Requirements

The unit economics of a 3-person founding team in Australia are challenging at early-stage MRR levels. This section makes the funding gap explicit.

### Burn rate assumptions

| Item | Phase 1-2 (3 founders) | Phase 3 (3-5 people) | Phase 4 (5-8 people) |
|------|----------------------|---------------------|---------------------|
| Salaries (below-market, $80K–100K/person) | $20,000–25,000 | $27,000–42,000 | $33,000–67,000 |
| Infrastructure (startup tier → scaled) | $150–500 | $500–1,500 | $1,500–3,000 |
| Data licensing (post-negotiation) | $500–5,000 | $1,000–5,000 | $2,000–5,000 |
| Tools, services, misc | $500–1,000 | $1,000–2,000 | $1,500–3,000 |
| **Total monthly burn** | **$21,000–31,500** | **$29,500–50,500** | **$38,000–78,000** |

### Revenue trajectory vs. burn (with team growth)

| Stage | Agents | MRR (at $179/agent avg) | Monthly Burn | Gap |
|-------|--------|------------------------|-------------|-----|
| Phase 1 (Month 6) | 5 beta (free) | $0 | ~$25,000 | -$25,000/mo |
| Phase 2 (Month 12) | 20 (mixed free/paid) | ~$2,000–3,500 | ~$28,000 | -$25,000/mo |
| Phase 3 (Month 18) | 50 paying | ~$9,000 | ~$35,000 | -$26,000/mo |
| Phase 4 (Month 24) | 100 paying | ~$18,000 | ~$45,000 | -$27,000/mo |
| Phase 4 (Month 30) | 200 paying | ~$36,000 | ~$55,000 | -$19,000/mo |
| **Breakeven target** | **350–500 paying** | **$63,000–90,000** | **~$55,000–70,000** | **~$0/mo** |

**Key insight:** Breakeven with a growing team (5-8 people by Year 2) requires 350-500 paying agents, not 200. At 200 agents ($36K MRR) with a team that has grown to support the product, the burn rate outpaces revenue by ~$19K/month. The business requires either: (a) sustained funding until 350+ agents, (b) capping the team at 3-4 people until revenue justifies growth, or (c) higher ARPU through transaction fees and premium tiers.

### Funding requirements

| Scenario | Required Capital | Timeline |
|---|---|---|
| **Bootstrapped (founders take $50K/year)** | $150K–200K personal runway for 12–18 months | Breakeven at ~200 agents (Month 24–30) |
| **Pre-seed / angel ($500K–$750K)** | Covers 18 months at market salaries + infra + data licensing | Bridge to Gate 3 (50 paying agents, $9K MRR) |
| **Seed round ($1.5M–$2M)** | Covers 24–30 months at market salaries + first hires + multi-state data licensing | Bridge to 200-350 paying agents, approaching breakeven |

**Recommendation:** Pursue a pre-seed round ($500K–$750K) at or before Month 6, once Phase 1 exit criteria are met and real agent usage data exists. The bootstrapped path is viable only if all 3 founders can sustain below-market salaries for 18–24 months.

---

## Appendix: Realism Checklist

What this timeline assumes goes right:

- Data licensing is secured at a viable cost by Month 4 (negotiations started pre-Phase 1).
- The 3-person team works full-time (no day jobs) from Month 1 onward.
- Seed funding or revenue covers living expenses and infrastructure from Month 6 onward (see Section 7).
- At least one team member can handle frontend and one backend without bottlenecking each other.
- Beta agents are willing to tolerate rough edges in exchange for early access and influence on the product.

What will slow things down (realistically):

- Any team member going part-time or leaving. At 3 people, every person is 33% of output.
- Data licensing negotiations taking months (very common in Australian real estate) — the single biggest timeline risk.
- Real estate market downturns reducing agent willingness to pay for new software.
- Australian-specific compliance requirements discovered late (state-based trust account rules, privacy regulations).
- Underestimating the complexity of geospatial queries and GIS data quality at Australian scale.
- ML matching requiring more training data than anticipated — rule-based scoring must sustain the product through Phase 3.

This roadmap should be reviewed quarterly and updated based on actual velocity, market conditions, and user feedback. The gates are fixed; the paths between them are adaptable.

---

## Document Status

- **Version:** 2.0
- **Last Updated:** May 2026 (revision: Phase 1 restructured to 6 months with 50% scope reduction, PostGIS deferred to Phase 2, ML matching moved from Phase 2 to Phase 4, CRM scope reduced in Phase 1, Domain/CoreLogic critical dependency section added, funding requirements section added with burn rate vs. revenue analysis, success gate timelines updated, exit criteria revised, technical debt table updated)
- **Next:** Quarterly review against actual velocity and market conditions
