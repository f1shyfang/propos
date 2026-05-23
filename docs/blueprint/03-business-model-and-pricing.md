# 03 — Business Model & Pricing

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Draft for Validation

---

## 1. SaaS Pricing Model

### 1.1 Price Anchoring Rationale

A sole-operator buyer's agent in Australia currently pays for a fragmented tool stack. Based on market research of commonly cited tools in BA communities, the approximate monthly cost is:

| Tool | Approximate Monthly Cost (AUD) |
|---|---|
| CRM (e.g. Pipedrive, HubSpot) | $50–$80 |
| Property data (e.g. RP Data Pro, PriceFinder) | $150–$300 |
| Domain/REA CoreLogic access | $200–$400 |
| Electronic signing (e.g. DocuSign Standard) | $25–$45 |
| Communication tools (WhatsApp Business, email marketing) | $20–$50 |
| Spreadsheets / manual tracking | (labour) |
| **Approximate total per agent/month** | **$450–$875** |

This provides a reference price anchor: the platform replaces this stack at a price point below the combined cost while delivering workflow unification that the fragmented stack cannot.

**Important note on cost anchor:** This table assumes a BA subscribes to ALL tools listed. Actual spend varies significantly: some BAs use free CRM tiers, others rely on agency-wide data licences that reduce per-agent cost, and some tools may be provided by their brokerage. The $450–$875/month figure should be treated as a **ceiling for pricing anchor purposes**, not a validated average spend survey. Before finalising pricing, the team should conduct a survey of 20–30 practising BAs to understand actual current tool spend distribution.

### 1.2 Tiered Plans

All pricing in AUD, exclusive of GST.

#### Starter — Sole Operator
**$199/agent/month** (monthly) | **$179/agent/month** (annual, billed yearly)

- 1 agent seat
- Core CRM: lead capture, pipeline management, deal tracking
- Property shortlist with basic data fields (price guide, address, inspections)
- Basic CMA report generation (up to 5/month)
- Email & SMS communication from within platform
- Electronic offer submission with basic e-signature
- Client portal (read-only property viewing)
- Mobile-responsive web app
- Email support (business hours)

#### Professional — Small Team (2–5 agents)
**$179/agent/month** (monthly) | **$159/agent/month** (annual, billed yearly)

- Everything in Starter, plus:
- Up to 10 agent seats
- Advanced property data integration (Domain API, automated comparable sales pull)
- Unlimited CMA reports with export to branded PDF
- Automated inspection scheduling and calendar sync
- Team pipeline visibility and workload dashboards
- Role-based permissions (admin, agent, assistant)
- Client portal with messaging and document upload
- WhatsApp integration (single number)
- Document template library (authority to purchase, exclusivity agreements)
- Priority email support

#### Agency (6+ agents)
**Custom pricing** — starting at approximately $139/agent/month (annual)

- Everything in Professional, plus:
- Unlimited agent seats
- White-label client portal (optional add-on)
- Dedicated account manager
- Advanced analytics and agency-wide reporting
- Custom workflow automation
- Bulk data export and API access
- SSO integration
- Phone support
- Onboarding and migration assistance

### 1.2a Launch / Founding Member Discount

For the first 50 agents onboarded, a **30% Founding Member discount** off standard pricing applies, locked in for the first 24 months of paid subscription:

| Tier | Standard Price (monthly) | Standard Price (annual) | Founding Member (monthly) | Founding Member (annual) |
|---|---|---|---|---|
| Starter | $199 | $179 | $139 | $125 |
| Professional | $179 | $159 | $125 | $111 |
| Agency | Custom | Custom | Custom (30% off negotiated rate) | Custom |

**Rationale:** Early adopters in a tight-knit professional community are also the most credible reference customers. A time-limited Founding Member discount (first 50 agents, 24-month lock) provides (a) an incentive to commit early, (b) a lower barrier to switch from existing tools, and (c) a cohort of reference customers with a financial stake in the platform's success. This discount is explicitly accounted for in Year 1 revenue projections (see §2.2) and phases out as the founding cohort converts to standard pricing in Year 3.

### 1.3 Free Trial Strategy

**30-day free trial**, full-featured (Professional tier), no credit card required. Rationale:
- Buyer's agents evaluate tools around deal cycles (typically 4–8 weeks). A 14-day trial is too short to close a deal on the platform.
- No-credit-card barrier reduces sign-up friction for a market segment that is not highly SaaS-literate.
- Full-featured trial allows the user to experience the value of unification before hitting tier gates.

**Freemium consideration deferred.** A limited free tier (e.g., 1 active deal, no data integrations) could be evaluated post-launch if organic growth targets require a wider top-of-funnel. Australian B2B SaaS companies (e.g. Deputy, SafetyCulture) typically favour trial-to-paid over freemium.

---

## 2. Revenue Projections

### 2.1 Key Assumptions

| Assumption | Value | Source Type |
|---|---|---|
| Starter:Professional:Agency mix (YR1) | 70:25:5 | Projection |
| Monthly churn (Starter) | 5% | Benchmark — typical B2B SMB SaaS per [ProfitWell/KBCM] |
| Monthly churn (Professional) | 3.5% | Benchmark — mid-market B2B SaaS |
| Monthly churn (Agency) | 2% | Benchmark — enterprise B2B SaaS |
| Free trial to paid conversion | 12% | Benchmark — typical B2B SaaS per [OpenView/Totango] |
| Annual:Monthly billing mix | 60:40 | Projection |
| Average agents per Professional account | 3 | Projection |
| Average agents per Agency account | 8 | Projection |
| Annual price increase | None modelled in YR1–3 | Projection |
| CAC payback period | 8–12 months | Benchmark — acceptable B2B SaaS per [David Skok] |

### 2.2 Scenario Projections — Year 1

#### Conservative

| Month | Total Paying Accounts | Total Paid Seats | MRR (monthly billers) | ARR Contribution (annual billers) | Blended MRR Equivalent |
|---|---|---|---|---|---|
| M3 | 12 | 18 | $2,880 | — | $2,880 |
| M6 | 35 | 52 | $6,240 | ~$32,220/yr annual accounts | $8,925 |
| M9 | 65 | 95 | $11,400 | 28 annual accounts | $15,600 |
| M12 | 90 | 135 | $16,200 | 40 annual accounts | $22,200 |

YR1 ending **ARR (run-rate): ~$266,000** | YR1 total revenue: ~$140,000

#### Realistic

| Month | Total Paying Accounts | Total Paid Seats | Blended MRR Equivalent |
|---|---|---|---|
| M3 | 20 | 30 | $4,800 |
| M6 | 55 | 85 | $13,600 |
| M9 | 100 | 155 | $24,800 |
| M12 | 150 | 230 | $36,800 |

YR1 ending **ARR (run-rate): ~$442,000** | YR1 total revenue: ~$250,000

#### Optimistic

| Month | Total Paying Accounts | Total Paid Seats | Blended MRR Equivalent |
|---|---|---|---|
| M3 | 30 | 48 | $7,680 |
| M6 | 80 | 130 | $20,800 |
| M9 | 150 | 250 | $40,000 |
| M12 | 220 | 370 | $59,200 |

YR1 ending **ARR (run-rate): ~$710,000** | YR1 total revenue: ~$420,000

### 2.3 Year 2–3 Projections (Realistic Scenario)

| Metric | YR1 | YR2 | YR3 |
|---|---|---|---|
| Ending ARR | $442,000 | $750,000 | $950,000 |
| Total revenue | $250,000 | $520,000 | $780,000 |
| Ending accounts | 150 | 230 | 275 |
| Implied net account growth rate | — | ~53% | ~20% |
| Ending total seats | 230 | 380 | 480 |

**Note on Y3 ceiling:** The Y3 projection of 275 accounts (~28–55% penetration of the estimated 500–1,000 BA population) is consistent with Doc 02's Serviceable Obtainable Market analysis (Y3: 200–300 at 20–30% penetration). The previous projection of 650 accounts was inconsistent with TAM and implied an impossible 65–130% penetration. Growth beyond Y3's ~275 accounts requires expansion into adjacent segments (see §6.4 Revenue Ceiling Analysis).

### 2.4 Break-Even Timeline

Assuming monthly operating costs of ~$25,000/month (see Section 5), the platform reaches cash-flow break-even when **$25,000/month in received cash** covers operating costs. This is distinct from "blended MRR" used in the revenue tables, which amortises annual contracts over 12 months.

In the realistic scenario:
- **Month 9–10 (blended MRR break-even):** Blended MRR Equivalent reaches ~$25,000. However, this includes amortised annual revenue that has not yet been collected in cash.
- **Month 12–14 (cash-flow break-even):** Actual cash received exceeds $25,000/month, assuming 60% of accounts on annual billing (collecting 12 months upfront) and 40% on monthly. Annual prepayments accelerate cash receipts relative to blended MRR.

**Key caveat:** Break-even timing is sensitive to the annual:monthly billing mix. If annual adoption falls below 50%, cash receipts lag blended MRR and break-even shifts to Month 16+. Conversely, if 70%+ of accounts are on annual billing, cash break-even could occur as early as Month 8–9 due to upfront annual collections. The blended MRR metric should not be used as a cash-flow proxy — cash received is the relevant break-even measure.

---

## 3. Unit Economics

### 3.1 Customer Acquisition Cost (CAC)

| Channel | Est. cost per lead | Conversion to trial | Conversion to paid | Cost per paid account |
|---|---|---|---|---|
| Organic / community (BA Facebook groups, REB) | $0 | 8% | 15% | $0 |
| Content marketing (SEO, newsletter) | $15 | 5% | 12% | $2,500 |
| Paid social (Facebook/Instagram, agent-targeted) | $30 | 4% | 10% | $7,500 |
| Industry events & partnerships | $100 | 20% | 15% | $3,333 |
| **Blended CAC (YR1)** | — | — | — | **$3,500–$5,000** *(projection)* |

Benchmark: B2B SaaS CAC ranges $200–$5,000+ depending on deal size. SMB-focused SaaS typically operates at $500–$2,000 per [ProfitWell]. Our blended CAC is higher in YR1 due to a concentrated, low-volume market.

### 3.2 Lifetime Value (LTV)

Assumptions for LTV calculation:
- Average monthly revenue per seat: **$179** (annual-plan-weighted)
- Average seats per account: **1.7** (YR1 mix)
- Average monthly revenue per account: **~$305**
- Average customer lifespan: **20 months** (at 5% blended monthly churn)
- Expansion revenue: modest — an operator may add 1 assistant seat (not modelled in base LTV)

**Base LTV: ~$305 × 20 = $6,100**

### 3.3 LTV:CAC Ratio

| Scenario | LTV | CAC | LTV:CAC |
|---|---|---|---|
| Conservative | $5,200 | $5,000 | 1.04:1 |
| Realistic | $6,100 | $4,000 | 1.53:1 |
| Optimistic | $7,500 | $3,500 | 2.14:1 |

Benchmark: A healthy B2B SaaS business targets **LTV:CAC ≥ 3:1** per [David Skok, Matrix Partners]. Our YR1 ratios are below this threshold, which is expected for a pre-scale startup. The path to 3:1 requires reducing CAC through organic channels and increasing LTV through lower churn and expansion revenue (see Section 4).

**LTV:CAC realism note:** These ratios reflect a pre-scale, bootstrapped entry into a niche professional market. The conservative scenario (1.04:1) is below sustainability and the realistic scenario (1.53:1) is marginal. Path to 3:1 requires (a) reducing CAC through organic/community channels to below $2,000 per paid account, and (b) increasing LTV through transaction fees, referral commissions, and expansion beyond pure subscriptions. Even the optimistic scenario (2.14:1) falls short of the 3:1 benchmark, confirming that this is a **lifestyle-business model initially, not venture-scale**. A venture-scale outcome would require the adjacent market expansion or transaction fee strategies described in §6.5.

### 3.4 Churn Assumptions by Segment

| Segment | Monthly churn | Source |
|---|---|---|
| Sole operator | 5–6% | Benchmark — SMB SaaS churn per [ProfitWell] |
| Small team (2–5) | 3–4% | Benchmark — mid-market SaaS |
| Agency (6+) | 1.5–2.5% | Benchmark — enterprise SaaS |

---

## 4. Additional Revenue Streams

These are modelled as future revenue lines (YR2+), not included in YR1 projections.

### 4.1 Transaction Success Fee
A 0.25–0.5% fee on property purchase value, collected from the buyer's agent (who invoices their client). At a $1M median Sydney property and 5% market share of transactions on-platform:
- 100 agents × 12 deals/year × $1M × 0.25% = **$300,000/year** at modest volume.

### 4.2 Referral Commissions
Partner integrations with mortgage brokers, conveyancers, building & pest inspectors. Revenue-share arrangement (10–25% of partner fee). Estimated **$20–$50/transaction per partner category**.

### 4.3 Premium Data Add-Ons
Additional property data layers beyond the base integration: suburb profile reports, planning overlays, flood/fire zone data. Priced at **$29–$59/month per agent**.

### 4.4 White-Label Client Portal
Custom-branded portal for agencies with 6+ agents. **$99–$199/month** add-on.

### 4.5 Marketplace
Connecting buyer's agents with service providers (conveyancers, mortgage brokers, buyer's advocates interstate). Revenue via listing fees or referral commissions. **No revenue modelled for YR1–3** — this is a long-term network-effect play.

---

## 5. Cost Structure

### Monthly Operating Costs (Steady State, YR1)

| Category | Estimated Monthly Cost (AUD) | Notes |
|---|---|---|
| Cloud hosting (AWS/Azure) | $800–$1,500 | Modest usage at initial scale; scales with seats |
| Domain API / property data | $1,500–$3,000 | Licensing for commercial use — single largest data cost |
| Mapping APIs (Mapbox/Google) | $200–$500 | Usage-based |
| Email delivery (SendGrid/Postmark) | $100–$250 | Transactional + marketing email |
| SMS (Twilio or AU provider) | $150–$300 | Per-message pricing for AU numbers |
| Electronic signature (DocuSign API or similar) | $300–$500 | API envelope pricing |
| Document generation | $50–$150 | PDF generation, template rendering |
| Third-party total | **$3,100–$6,200** | |
| Personnel (3 FTE, below-market salaries as founders) | $15,000–$20,000 | Founders drawing reduced salaries |
| Marketing & advertising | $2,000–$5,000 | Scaled up as revenue grows |
| Professional services (legal, accounting) | $500–$1,000 | Australian company setup, SaaS terms |
| Insurance (PI, cyber) | $300–$500 | Required for handling property transaction data |
| Miscellaneous | $500 | |
| **Total monthly burn (YR1)** | **~$22,000–$33,000** | |
| **Modelled at** | **$25,000/month** | |

### Key Cost Ratios

| Metric | Benchmark (B2B SaaS) | Our YR1 Projection |
|---|---|---|
| Gross margin | 70–80% | ~75% (data costs are meaningful) |
| Sales & marketing as % of revenue | 30–50% (early stage) | ~50–60% |
| Cloud infra as % of revenue | 5–15% | ~10% |

Benchmarks sourced from [KeyBanc SaaS Survey 2023] and [OpenView SaaS Benchmarks].

---

## 6. Key Financial Assumptions & Risks

### 6.1 What Must Be True

1. **The unification value proposition resonates with a meaningful fraction of AU buyer's agents.** The total addressable market is small — estimated 500–1,000 active buyer's agents nationally — so high penetration rate is required for viable SaaS economics.
2. **Buyer's agents are willing to adopt an all-in-one platform.** Switching from known point solutions to a unified tool carries adoption risk. Onboarding, migration support, and data import are critical.
3. **Property data licensing costs can be negotiated at rates that preserve ~75% gross margins.** Domain/CoreLogic pricing for commercial API use by a SaaS platform is the single largest cost variable.
4. **Annual billing adoption exceeds 50%.** Annual contracts improve cash flow and reduce effective churn. If the market prefers monthly billing, runway shortens.

### 6.2 Biggest Cost Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Domain API / RP Data licensing** — cost is opaque, may require minimum commits or revenue share | Erodes gross margin from 75% to <60% | Engage early with Domain, CoreLogic, and PriceFinder to understand commercial terms; consider data aggregation middleware |
| **Scaling cloud costs** — property data enrichment, CMA generation, and document rendering are compute-heavy per deal | Cloud costs grow faster than seat revenue initially | Use serverless architecture; batch processing for CMAs; cache property data aggressively |
| **Customer support costs for non-SaaS-literate users** | Support burden per account higher than typical B2B SaaS | Invest in onboarding content, in-app guidance, and self-serve help centre early |

### 6.3 Currency Risk

- **Pricing revenue is in AUD.** All customer billing is AUD.
- **Cloud infrastructure (AWS), most API services, and many SaaS tools are billed in USD.** A declining AUD/USD exchange rate directly increases operating costs.
- At a $25,000/month burn with ~40% of costs in USD, a 10% AUD depreciation = ~$1,000/month additional cost.
- **Mitigation:** Pre-purchase infrastructure credits where possible; consider AUD-denominated cloud marketplace purchases if available through AWS's Australian region; maintain pricing in AUD and review if sustained depreciation exceeds 15%.

### 6.4 Market Concentration Risk

The Australian buyer's agent market is small and concentrated in Sydney, Melbourne, and Brisbane. This has two implications:
- **Revenue ceiling:** If the total market is ~500–1,000 agents and we capture 30% at $200/month/agent, the maximum ARR from subscriptions alone is ~$720K–$1.4M. Beyond this, growth must come from adjacent segments (selling agents, property managers) or additional revenue streams (transaction fees, marketplace).
- **Concentration risk:** A single large agency account (20+ agents) may represent significant revenue, making churn volatility high in early stages.

### 6.5 Revenue Ceiling Analysis & Growth Beyond Subscriptions

The Australian buyer's agent market imposes a natural revenue ceiling on subscription-only growth:

| Penetration Rate | Agents (at 750 midpoint) | Annual Revenue/Agent | Implied ARR |
|---|---|---|---|
| 30% | 225 | ~$2,040/yr (blended annual) | ~$460K |
| 50% | 375 | ~$2,040/yr | ~$765K |
| 70% | 525 | ~$2,040/yr | ~$1.07M |
| 100% | 750 | ~$2,040/yr | ~$1.53M |

**This is a lifestyle-business ceiling, not venture scale.** At the realistic Y3 projection of 275 accounts (~$950K ARR), the business is approaching the upper bound of subscription-only revenue from the Australian BA market. Exceeding this ceiling requires one or more of:

1. **Transaction success fees** (§4.1): A 0.25–0.5% fee on property purchases. At 30% market penetration with 12 deals/year per agent and $1M median property value, this adds ~$300K–$600K/year. This is the highest-margin path to breaking the subscription ceiling.

2. **Adjacent market expansion** — Selling agents' buy-side workflows: There are ~60K–80K licensed real estate agents in Australia, many of whom handle buyer-side transactions as part of their practice. Adapting the platform for dual-practice agents (selling + buying) expands TAM by ~100×.

3. **International expansion**: The UK, NZ, and parts of the US have similar buyer's agent / property finder professional structures. Each market would require local property data integrations, regulatory adaptation, and local GTM.

4. **Marketplace and referral commissions** (§4.2, §4.5): Connecting BAs with mortgage brokers, conveyancers, and other service providers generates transaction-based revenue that scales with usage, not seat count.

5. **Premium data and analytics** (§4.3): Additional data layers beyond base integrations that command premium pricing.

6. **Raising BA adoption of software**: If the total BA population grows (currently 5–10% of purchases use a BA vs. 80%+ in the US), the TAM itself expands. This is a market development play with long time horizons.

**Strategic implication:** The company must decide early whether it is building (a) a profitable lifestyle business serving a niche professional community (valid, sustainable, ~$1M–$1.5M ARR ceiling from subscriptions), or (b) pursuing a venture-scale outcome that requires expansion beyond the Australian BA market within 2–3 years. The product and go-to-market strategy differ materially between these two paths.

---

## Revision Notes (Post Adversarial Review — May 2026)

1. **Harmonised pricing model (§1.2, §1.2a).** Retained the per-agent pricing model ($199/$179/$139) from this document as the authoritative pricing reference. Added §1.2a Launch/Founding Member Discount: 30% off for first 50 agents ($139 Starter, $125 Professional), locked for 24 months.

2. **Corrected Y2–Y3 revenue projections (§2.3).** Previous Y3 projection of 650 accounts implied 65–130% market penetration (impossible given 500–1,000 TAM). Updated to 275 accounts consistent with Doc 02's SOM analysis (20–30% penetration). Recalculated: Y2 at 230 accounts/$750K ARR, Y3 at 275 accounts/$950K ARR. Added explicit note on the correction.

3. **Clarified break-even timeline (§2.4).** Distinguishes between blended MRR break-even (Month 9–10) and cash-flow break-even (Month 12–14). Added analysis of how annual:monthly billing mix affects cash receipts. Previous version conflated blended MRR with cash received.

4. **Added Revenue Ceiling Analysis (§6.5).** Quantifies the natural subscription revenue ceiling at $460K–$1.53M ARR depending on penetration, from 30% to 100% of the BA market. Details six paths to exceed the ceiling: transaction fees, adjacent markets, international expansion, marketplace, premium data, and market development.

5. **Added tool stack cost anchor caveat (§1.1).** Notes the $450–$875/month estimate assumes full tool adoption and is a ceiling estimate, not a validated average. Recommends surveying 20–30 practising BAs before finalising pricing.

6. **Added LTV:CAC ratio realism note (§3.3).** Explicitly acknowledges that ratios never reach 3:1 even in the optimistic scenario (2.14:1), confirming a lifestyle-business model initially. Path to 3:1 requires CAC <$2,000 and transaction fee-based LTV expansion.
