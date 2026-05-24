# 05 — System Architecture

> **Canonical status:** Future/platform reference only. For the hackathon MVP, follow [../TECH-SPEC.md](../TECH-SPEC.md), [../DATA-MODEL.md](../DATA-MODEL.md), [../API-SPEC.md](../API-SPEC.md), [../ROUTE-MAP.md](../ROUTE-MAP.md), [../COMPONENT-TREE.md](../COMPONENT-TREE.md), and [../IMPLEMENTATION-PLAN.md](../IMPLEMENTATION-PLAN.md). Any API gateway, separate backend server, cron ingestion, live integrations, maps, document storage, queueing, or multi-agency architecture described here is post-MVP unless copied into the canonical docs.

## 1. High-Level Architecture

### 1.1 Overview

The platform is composed of the following top-level components, each communicating over well-defined HTTP APIs (REST) with JSON payloads. Background processing uses cron-based scheduling in Phase 1, evolving to a message queue in Phase 3+:

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│  ┌──────────────────┐   ┌──────────────────┐                     │
│  │ Agent Dashboard  │   │  Client Portal   │                     │
│  │ (SPA — Web)      │   │  (SPA — Web)     │                     │
│  └────────┬─────────┘   └────────┬─────────┘                     │
│           │                      │                                │
│           ▼                      ▼                                │
│  ┌────────────────────────────────────────┐                       │
│  │         API GATEWAY / REVERSE PROXY    │                       │
│  │   (TLS termination, rate limiting,     │                       │
│  │    authentication token validation)     │                       │
│  └────────────────┬───────────────────────┘                       │
│                   │                                               │
│                   ▼                                               │
│  ┌────────────────────────────────────────┐                       │
│  │         BACKEND API SERVER             │                       │
│  │   ┌──────────┐  ┌──────────────────┐   │                       │
│  │   │ REST/JSON │  │ Cron-Based       │   │                       │
│  │   │ Handlers  │  │ Task Dispatcher  │   │                       │
│  │   └──────────┘  │ (Phase 1)        │   │                       │
│  └──────────────────┴────────┬─────────┘   │                       │
│                              │             │                       │
│              ┌───────────────┼─────────────┐                      │
│              ▼               ▼             ▼                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │  PRIMARY DB   │  │  CRON JOBS    │  │ OBJECT STORE  │          │
│  │  (SQL)        │  │  (Phase 1)    │  │ (Files/Media) │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │              EXTERNAL INTEGRATIONS                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │ Property │  │ Govt/Map │  │ Payment  │  │ Email/   │   │    │
│  │  │ Portals  │  │ Services │  │ Gateway  │  │ SMS      │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Evolution of background processing:**
- **Phase 1 (Hackathon/MVP):** Cron-based scheduling. A cron process (or in-process scheduler) triggers batch jobs: property ingestion, matching re-runs, notification dispatch. Jobs read/write directly to the database. No separate queue infrastructure.
- **Phase 2 (Alpha):** Simple job queue (PostgreSQL-backed, e.g. `pgboss` or a custom `jobs` table with polling workers). Workers run as a separate process tier but share the same database.
- **Phase 3+ (Production):** Dedicated message queue (Redis Streams, RabbitMQ, or SQS) with at-least-once delivery, dead-letter queues, and horizontally scalable workers. Enables event-driven architecture with pub/sub for real-time features.

### 1.2 Monolith-First Decision

For the hackathon MVP and initial production launch, the system is deployed as a **modular monolith** — a single deployable artefact with logical component boundaries enforced by directory structure and interface conventions, not network boundaries.

**Rationale:**

- A 3-person team cannot afford the operational complexity of deploying, monitoring, and debugging a distributed system from day one. A monolith gives a single deploy pipeline, a single log stream, and zero network latency between internal components.
- The codebase is organised into discrete modules (e.g. `crm`, `sourcing`, `matching`, `portal`, `transaction`) with clear public interfaces. Each module owns its database tables within a single logical database, accessed only through its own data-access layer. This enforces separation of concerns without network hops.
- When a specific module reaches a scale or team-size threshold that justifies extraction, its bounded context is already well-defined. The extraction path is: define a service boundary → expose the module's public interface over HTTP → deploy as a standalone service → route traffic. No massive rewrite.

**Evolution Path:**

| Stage | Architecture | Team Size | Trigger |
|---|---|---|---|
| Hackathon (Month 1) | Monolith with hardcoded mocks for external APIs | 3 | Build core CRM + buyer brief |
| Alpha (Month 2-4) | Modular monolith, real integrations, CI/CD | 3-4 | Client onboarding begins |
| Production (Month 4+) | Monolith + separate worker tier for async jobs | 4-6 | >50 active agents |
| Scale (Month 12+) | Extract matching engine, search service, notification service as standalone services | 6+ | >500 agents or team split |

### 1.3 Key Architectural Principles

1. **Separation of Concerns.** Each domain module (CRM, Sourcing, Matching, Portal, Transaction) is self-contained with its own data ownership, public interface, and no direct cross-module database queries.
2. **API-First.** Every feature begins with its API contract. The frontend teams (dashboard and portal) develop against documented, versioned API endpoints from day one.
3. **Event-Driven When Needed.** Synchronous REST for request-response flows (e.g. creating a buyer brief, fetching a property shortlist). Asynchronous messaging for long-running or fire-and-forget operations (e.g. running the matching engine across 10,000 properties, sending notifications, ingesting property feeds).
4. **Stateless Application Tier.** The API server holds no in-memory session state. Authentication tokens carry all necessary context, enabling horizontal scaling of the application tier without sticky sessions.
5. **External Dependencies Are Swappable Adapters.** Every third-party integration (property portals, payment gateway, email provider) sits behind an interface/adapter pattern. This allows swapping providers without changing business logic and enables mock implementations for local development and testing.

---

## 2. Core Components

### 2.1 Agent Dashboard (Web Frontend SPA)

A single-page application served as static assets. Provides the agent's workspace: buyer brief builder, pipeline views (kanban-style), property search and matching results, due diligence tools, offer tracking, and transaction milestone dashboards.

**Interfaces:** Consumes REST API endpoints exclusively. Authenticates via JWT bearer tokens stored in secure HTTP-only cookies. All data fetching uses standard HTTPS requests.

### 2.2 Client Portal (Buyer-Facing Web App)

A separate SPA (or separate route tree within a shared SPA, gated by role) for the buyer. Provides: property shortlist with Tinder-style swipe feedback (like/dislike/undecided), document vault for contracts and reports, messaging with their agent, and transaction milestone visibility.

**Interfaces:** Same API server, different endpoint namespace (`/api/portal/*`). Authenticated as a client-role user, scoped to their own briefs and agent relationship.

**Why potentially separate from the dashboard:** Different navigation model (buyer-centric), different performance characteristics (heavier image/media loads for property browsing), and separate deployment cadence.

### 2.3 Backend API Server (Modular Monolith Core)

The heart of the system. Organised internally as:

- **CRM Module:** Buyer briefs, agent profiles, client management, finance tracking.
- **Sourcing Module:** Property feed ingestion, off-market property management, selling-agent CRM, property normalisation.
- **Matching Module:** Matching engine, scoring algorithms, shortlist generation.
- **Research Module:** CMA generation, risk overlays, investment calculators.
- **Portal Module:** Client-facing endpoints, feedback collection, document vault.
- **Negotiation Module:** Offer letters, auction tracking, negotiation workflow.
- **Transaction Module:** Milestone tracker, third-party coordination, settlement checklist.

Each module exposes its functionality through a versioned REST API under its namespace (e.g. `POST /api/v1/briefs`, `GET /api/v1/properties/{id}/matches`).

All modules share a common middleware stack: authentication, authorisation, request validation, logging, rate limiting.

### 2.4 Database Layer

A single relational SQL database in the monolith phase. The schema is namespaced per module. Full-text search is delegated to a dedicated search index (see Search Service) for property listings; the relational database handles structured transactional data (briefs, users, offers, milestones).

**Key data entities:** Users & Roles, Buyer Briefs, Properties (normalised), Matches & Scores, Offers, Milestones, Documents (metadata, with pointer to object store), Audit Log.

### 2.5 File / Media Storage (Object Store)

Dedicated blob/object storage for: property images, uploaded documents (contracts, building reports, offer letters), generated PDFs (CMA reports, offer letters). The database stores only metadata and a storage key; the object store holds the binary content. Files are served to clients via signed URLs with configurable expiry.

### 2.6 Authentication & Authorisation Service

Handles: user registration, login, password reset, OAuth 2.0 flows (Google, Microsoft for agents). Issues signed JWT access tokens (short-lived) and refresh tokens (long-lived, stored securely).

**Interface:** Auth endpoints under `/api/v1/auth/*`. All other endpoints validate the JWT on every request via middleware. Role-based access control (admin, agent, client) is enforced at the API handler level based on claims in the token.

Multi-tenancy: every agent's data is scoped by an `agency_id` claim in the JWT. Database queries are filtered by this identifier at the data-access layer, never at the API handler level, to prevent accidental cross-agency data leaks.

### 2.7 Background Job / Task Queue

**Phase 1 (Hackathon/MVP): Cron-based background processing.** Cron triggers (either OS-level cron or an in-process scheduler like `node-cron`) invoke batch tasks at defined intervals. The API server itself runs lightweight fire-and-forget operations synchronously (e.g., sending an email on brief creation). Heavier batch work (property ingestion, matching runs) is triggered by cron and executes in-process or as a forked child.

**Phase 2 (Alpha): Database-backed job queue.** A `jobs` table in PostgreSQL serves as a simple queue. Workers poll the table with `SELECT ... FOR UPDATE SKIP LOCKED`. This provides at-least-once delivery without introducing new infrastructure.

**Phase 3+ (Production): Dedicated message queue.** Redis Streams, RabbitMQ, or SQS with at-least-once delivery, dead-letter queues, and horizontally scalable workers.

**Job types across all phases:** property feed ingestion, matching engine batch runs, notification dispatch, PDF generation, email/SMS sending, scheduled reports.

### 2.8 Notification Service

Dispatches messages across channels: email (transactional and marketing), SMS (urgent updates, auction reminders), in-app (bell icon notifications in both dashboard and portal). All notifications are templated, and templates are stored in the database so non-technical users can edit them.

**Interface:** Any module calls a single `notify(user_id, channel, template_key, context_data)` function. The notification module enqueues delivery jobs. This decouples business logic from delivery mechanics.

### 2.9 AI / Matching Engine

Consumes a buyer brief (budget, location preferences, property type, must-haves, deal-breakers) and a corpus of normalised property listings. Produces a scored, ranked shortlist.

**Architecture:** A pipeline of scoring stages — hard filters (eliminate non-matching), soft scoring (weighted attribute comparison), and optional AI re-ranking (semantic similarity between brief narrative and listing descriptions). Each stage is a pluggable strategy so the team can start with simple rule-based matching and add ML later.

**Interface:** Enqueued as a background job (for batch re-scoring of all briefs against new listings) or called synchronously for a single brief (for Tinder-style swipe sessions). Returns a list of `(property_id, score, matched_criteria, unmatched_criteria)` tuples.

### 2.10 Data Ingestion Pipeline

Pulls property data from external sources (Domain API, off-market submissions, manual agent entry) on a scheduled cadence. Normalises disparate schemas into the platform's canonical property schema. Deduplicates listings that appear across multiple sources.

**Architecture:** A scheduled trigger enqueues ingestion jobs. Each job fetches from one source, transforms records through a source-specific adapter, and upserts into the property table (using external ID as the key).

### 2.11 Search Service

Provides fast, relevance-ranked search over the property corpus. Populated by the ingestion pipeline after normalisation.

**Architecture:** For the monolith phase, this is a dedicated search index (full-text engine) running alongside the database. The API server queries it directly for property search. In later phases, it can be extracted behind a thin search API service.

---

## 3. Data Flows

### 3.1 Property Data: External Source → Database → Frontend

```
[Property Portal API] → [Ingestion Worker] → [Normalisation Adapter]
                                                    ↓
[Object Store] ← [Image Fetcher] ←─ [Normalised Property Record]
                                             ↓
                               [Upsert into Property Table]
                               [Index into Search Engine]
                                             ↓
                          [Agent searches in Dashboard] → [Search Query]
                                                              ↓
                                              [Return paginated results]
```

### 3.2 Buyer Brief → Matching Engine Trigger

```
[Agent creates/edits Brief] → [API Handler: POST /api/v1/briefs]
       ↓
[Brief saved to DB] → [Enqueue match job: {brief_id, priority: normal}]
       ↓
[Match Worker] → [Load brief + all active properties]
       ↓
[Run scoring pipeline] → [Persist scored matches to match_results table]
       ↓
[If high-scoring matches above threshold] → [Enqueue notification to agent]
```

### 3.3 Client Feedback → Agent Dashboard

```
[Client swipes on property in Portal] → [PUT /api/v1/portal/feedback {property_id, action: like|dislike|undecided}]
       ↓
[Save feedback to DB] → [Update aggregate scores for the brief]
       ↓
[If action is 'like'] → [Agent sees property move to 'Client Interested' column in pipeline view]
```

### 3.4 Milestone Tracking → Notifications

```
[Agent marks milestone complete] → [API Handler updates milestone]
       ↓
[Check if milestone has auto-actions] → [e.g. "Contract Signed" → enqueue notification to client: "Next step: arrange building inspection"]
       ↓
[If milestone is deadline-sensitive] → [Schedule reminder jobs 7 days, 3 days, 1 day before deadline]
```

---

## 4. Integration Points

### 4.1 External API Integrations

All external integrations are abstracted behind interface/adapter pairs. Concrete adapters call the third-party API and translate responses to internal domain objects.

| Integration | Purpose | Data Direction | Protocol |
|---|---|---|---|
| Domain / Realestate.com.au API | Property listing feed | Inbound (pull) | REST/JSON over HTTPS |
| State government land data / Valuer-General APIs | Title data, zoning, flood overlays | Inbound | REST/JSON or SOAP |
| Mapping / Geocoding service (Google Maps or similar) | Address geocoding, heatmaps, suburb profiles | Inbound | REST/JSON |
| Document e-signature provider (DocuSign or similar) | Contract signing | Bidirectional | REST/JSON + webhooks |
| Email gateway (SendGrid / SES) | Transactional email | Outbound | REST/JSON or SMTP |
| SMS gateway (Twilio or similar) | SMS notifications | Outbound | REST/JSON |
| Payment processor (Stripe) | Subscription billing | Bidirectional | REST/JSON + webhooks |

### 4.2 Document Generation

Offer letters and CMA reports are generated server-side using HTML-to-PDF rendering. The workflow: load template → hydrate with data (property, brief, agent details) → render HTML → convert to PDF via headless browser or PDF engine → store in object store → return signed download URL.

### 4.3 Email / SMS Gateways

The notification module maintains a queue of outbound messages. A worker dequeues and calls the appropriate gateway adapter. All delivery statuses (sent, delivered, bounced, failed) are recorded for audit.

### 4.4 Payment Processing

Stripe (or equivalent) handles subscription billing via its Checkout flow. The platform stores a `stripe_customer_id` and `subscription_id` on the agency record. Webhook events (`invoice.paid`, `customer.subscription.deleted`) update subscription status. Payment card data never touches the platform's servers.

---

## 5. Security Architecture

### 5.1 Authentication

- **Agents** authenticate via email/password or social OAuth 2.0 (Google, Microsoft 365). The auth service issues a short-lived access JWT (15 minutes) and a long-lived refresh token (30 days, stored as an HTTP-only secure cookie).
- **Clients** authenticate via magic link emailed to their registered address. The link contains a one-time token that exchanges for a session JWT (24-hour expiry, scoped to their brief). (Note: for hackathon MVP, client auth uses email+password login for simplicity; magic link is a Phase 3 enhancement. See POST /auth/magic-link/send and GET /auth/magic-link/verify in Doc 07 API catalog.)
- API tokens are available for headless/integration access (e.g. ingestion pipeline calling partner APIs on behalf of the platform).

### 5.2 Authorisation

Three role tiers:

- **Admin:** Platform-level access. Manage agencies, billing, system configuration.
- **Agent:** Agency-scoped access. CRUD on own briefs, clients, properties within their agency. Read-only on shared resources (property corpus).
- **Client:** Brief-scoped access. View only properties and documents shared by their agent. Submit feedback on shortlisted properties.

All authorisation checks are role-based and enforced at the API middleware layer. Agency data isolation is enforced at the data-access layer by injecting the `agency_id` from the JWT claim into every query.

### 5.3 Multi-Tenancy

Each agency has a unique `agency_id`. All agency-owned data (briefs, clients, matches, offers, documents) includes this identifier. Database queries for agency-scoped resources always include a `WHERE agency_id = ?` clause, injected automatically by the data-access layer. Row-level security (RLS) at the database level provides a defence-in-depth second layer.

### 5.4 Data Protection

- **In transit:** All external communication over HTTPS (TLS 1.3 minimum). Internal service communication within the cloud VPC uses TLS where crossing network boundaries; plaintext within the monolith is acceptable since there is no network hop.
- **At rest:** Database encryption at rest via cloud provider KMS. Object storage encryption at rest (server-side). Personally identifiable information (PII) fields (client names, emails, phone numbers) are encrypted at the application layer before persistence.
- **Secrets:** API keys, database credentials, JWT signing keys are stored in a secrets manager, never in code or configuration files.

### 5.5 Rate Limiting

Enforced at the API gateway layer. Token-bucket algorithm per authenticated user per endpoint group. Stricter limits on auth endpoints (prevent brute-force) and public ingestion endpoints (prevent abuse). Configurable per tier (admin vs agent vs unauthenticated).

### 5.6 Privacy Compliance

The platform handles personal information of Australian residents, so it must comply with the Privacy Act 1988 (Australian Privacy Principles). Key measures:

- **Data minimisation:** Only collect PII necessary for the agent-client relationship.
- **Purpose limitation:** Client data used only for the property purchase process. No secondary use without consent.
- **Right to access/delete:** API endpoints for data export and account deletion.
- **Breach notification:** Automated alerting if anomalous data access patterns are detected.
- **Data residency:** All data stored within Australian cloud regions (`ap-southeast-2` Sydney or equivalent).

---

## 6. Deployment Architecture

### 6.1 Cloud Provider

**Primary recommendation: AWS.** Rationale: Australian region (`ap-southeast-2` Sydney), mature service ecosystem, strong IAM for multi-tenancy security, and wide availability of skills in the Australian market. Alternatives: GCP (`australia-southeast1` Sydney) or Azure (`Australia East`).

### 6.2 Infrastructure (Hackathon → Production)

| Stage | Compute | Database | Object Store | CI/CD |
|---|---|---|---|---|
| Hackathon | Single VM or PaaS (e.g. Render, Railway, Fly.io) | Managed SQL (smallest tier) | S3-compatible | GitHub Actions, push-to-deploy |
| Alpha | Containerised on managed compute (ECS/Fargate or Cloud Run) | Managed SQL with automated backups | S3 | GitHub Actions + staging environment |
| Production | Containerised + auto-scaling, separate worker tier | Managed SQL with read replicas | S3 with CDN for images | Full pipeline: lint → test → build → deploy staging → smoke test → deploy production |

### 6.3 CI/CD Pipeline

```
[Git Push to main] → [Lint + Static Analysis] → [Unit Tests] → [Build Container Image]
                                                                       ↓
                                                            [Push to Container Registry]
                                                                       ↓
                                                            [Deploy to Staging]
                                                                       ↓
                                                            [Smoke Tests (API + UI)]
                                                                       ↓
                                                            [Manual Approval Gate]
                                                                       ↓
                                                            [Deploy to Production]
```

Database migrations run as part of the deploy step (before the new application version starts). Migrations are backward-compatible (additive only); destructive changes use a two-deploy cycle (add new column, deploy, remove old column, deploy).

### 6.4 Environment Strategy

- **Development:** Local. Each developer runs the full stack via containers. External integrations use mock adapters by default, switchable to sandbox endpoints via configuration.
- **Staging:** Cloud-deployed, identical to production topology at smaller scale. Connected to sandbox versions of all external APIs. Used for integration testing and stakeholder demos.
- **Production:** Full-scale deployment. Zero-downtime deployments via rolling updates (container platform) or blue-green (VM-based).

### 6.5 Monitoring & Observability

- **Logging:** Structured JSON logs emitted to stdout, aggregated by a log platform. Every log line includes: timestamp, service name, trace ID, user ID (if authenticated), log level, message.
- **Metrics:** Request latency (p50, p95, p99), error rate, throughput per endpoint, job queue depth, worker throughput, database connection pool utilisation. Exposed via a metrics endpoint, scraped into a time-series database, visualised on dashboards.
- **Alerting:** Alerts on error rate spikes, p95 latency exceeding threshold, job queue backlog growth, database disk usage >80%, and external API failure rates.
- **Distributed Tracing:** Trace ID generated at the API gateway, propagated through all internal calls and background jobs, enabling end-to-end request tracing across the monolith and eventual microservices.

---

## 7. Scalability Considerations

### 7.1 Scaling Priorities

The monolith's stateless API tier scales horizontally first (add more instances behind a load balancer). This handles increased concurrent users (agents and clients) at minimal operational cost.

The next bottleneck is the database. Mitigations in order: connection pooling, read replicas for read-heavy queries (property search, client portal browsing), and query optimisation.

Third bottleneck: the matching engine. Batch matching across thousands of properties is CPU-intensive and benefits from a dedicated, independently scalable worker pool. The worker tier can scale based on queue depth.

### 7.2 Caching Strategy

| What | Where | TTL | Invalidation |
|---|---|---|---|
| Authenticated user session | In-memory cache (Redis or similar) | Token expiry | On logout or role change |
| Property search results | CDN edge cache (for static assets) + in-memory cache for API responses | 5 minutes | On property update via cache invalidation event |
| External API responses (geocoding, suburb data) | In-memory cache | 24 hours | Time-based expiry |
| CMA report PDFs | Object store + CDN | Indefinite (versioned) | New version on data update |
| Notification templates | In-memory, loaded at startup | Until restart | Cache clear on template edit |

### 7.3 Database Scaling Path

1. **Monolith phase:** Single managed SQL instance with automated backups and point-in-time recovery.
2. **Read-heavy growth:** Add read replicas. Route read queries (property search, listing views, report generation) to replicas. Write queries stay on primary.
3. **Write-heavy growth:** Vertical scaling of primary first. If that ceiling is hit, introduce sharding by `agency_id` (natural partition key for a multi-tenant system — each agency's data lives on one shard).
4. **Eventual microservice extraction:** As modules are extracted to services, each service gets its own logical database (or schema), removing the monolithic database bottleneck entirely. This is a long-term strategy only triggered by team growth and specific module bottlenecks.

---

## Revision Notes

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-05-23 | Adversarial review fixes: Removed job queue from architecture diagram, replaced with cron-based processing for Phase 1 + evolution path (cron → DB queue → message queue). Added magic-link enhancement note to client auth section (email+password for MVP). Added audit_logs table reference. |
