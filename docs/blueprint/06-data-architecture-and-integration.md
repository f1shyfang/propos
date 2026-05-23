# 06 — Data Architecture & Integration

**Version:** 1.2-draft  
**Audience:** Hackathon team (3 engineers)  
**Constraint:** Near-zero cost, one working city region, MVP-grade reliability  

---

## 1. Data Source Inventory

### 1.1 Active Listings

| Attribute | Domain API | realestate.com.au |
|---|---|---|
| **What it provides** | Residential listings, photos, agent contact, open times, price guide, property features | Same, plus school catchment overlays and suburb profiles |
| **Access method** | REST API, OAuth2, documented at `developer.domain.com.au` | No public API; data served via SSR React with GraphQL backend |
| **Free tier** | Yes — 2,000 calls/day, 10 calls/min, listing endpoints included | N/A |
| **Rate limits** | 10 req/min, 2,000 req/day on free tier | N/A |
| **Reliability** | Production-grade, 99.5%+ uptime SLA on paid; no SLA on free | High but intentionally hostile to automated access |
| **Legal** | API ToS permit commercial use within rate caps | ToS explicitly prohibit scraping; robots.txt disallows listing paths |
| **MVP play** | **Primary source.** Register a free API key, use `/v2/listings/residential/search` | **Avoid.** Do not scrape. It is legally risky, technically time-consuming, and unnecessary when Domain's free tier exists. |

**Domain free tier endpoints of interest:**

| Endpoint | Purpose |
|---|---|
| `GET /v1/listings/residential/search` | Search active listings by suburb/postcode |
| `GET /v1/listings/{id}` | Single listing detail with description, photos, floorplan |
| `GET /v1/agencies/{id}` | Agency profile |
| `GET /v1/suburbPerformanceStatistics/{state}/{suburb}/{postcode}` | Median price, growth, days on market |

Documentation: `https://developer.domain.com.au/docs/v1`  
Pricing: Domain's developer portal — free tier details at registration.

### 1.2 Historical Sales & Valuations

| Data Source | What It Provides | Access | Cost | Lag | MVP Suitability |
|---|---|---|---|---|---|
| **NSW Valuer General** | Bulk property sales data (CSV), land values | `valuation.property.nsw.gov.au` — download portal | Free | 6–8 weeks behind settlement | Pre-download the latest CSV |
| **VIC Valuer General** | Residential sales by suburb/month, median prices | `discover.data.vic.gov.au` — "Property Sales Statistics" | Free | Quarterly release | Pre-download |
| **QLD Valuer General** | Annual property market movement, land valuations | `data.qld.gov.au` — "Property Data" | Free | Annual | Too stale for MVP; skip |
| **CoreLogic / Pricefinder** | Full transaction history, hedonic valuations, CMA reports | Subscription portal | AUD $500–2,000+/month | Near real-time | Budget-prohibitive for hackathon |
| **APM PriceFinder** | Same category as CoreLogic | Proprietary login | Similar cost | Near real-time | Same reason |

**State sales data URLs:**

- NSW: `https://valuation.property.nsw.gov.au/embed/propertySalesInformation`
- VIC: `https://discover.data.vic.gov.au/dataset/property-sales-statistics-victoria`
- QLD: `https://www.data.qld.gov.au/dataset/property-market-movement-statistics`

**Hackathon verdict:** Pre-download one state's (NSW) bulk sales CSV. It will have ~500,000 records. Filter to the relevant council area. Use it for historical context and rough price floor/ceiling validation — not for algorithmic valuation.

### 1.3 Geospatial & Risk Data

| Dataset | Provider | URL | Format | Coverage |
|---|---|---|---|---|
| **G-NAF** (Geocoded National Address File) | PSMA/Geoscape via data.gov.au | `https://data.gov.au/dataset/geocoded-national-address-file-g-naf` | Pipe-delimited TXT + SHP | National, every Australian address |
| **NSW Flood Data Portal** | NSW SES / Spatial Services | `https://flooddata.ses.nsw.gov.au/` | GeoJSON, WMS | NSW floodplains |
| **NSW Bushfire Prone Land** | NSW Rural Fire Service | `https://datasets.seed.nsw.gov.au/dataset/bush-fire-prone-land` | GeoJSON | NSW |
| **Environmental Planning Instruments** (zoning, heritage) | NSW Planning Portal | `https://www.planningportal.nsw.gov.au/opendata` | GeoJSON via ArcGIS REST | NSW LGA-level |
| **VIC Vicmap Planning** | DataVic | `https://discover.data.vic.gov.au/dataset/vicmap-planning` | SHP/GeoJSON | All VIC |
| **National Flood Risk Information Portal** | Geoscience Australia | `https://www.ga.gov.au/scientific-topics/community-safety/flood` | WMS/WFS | Selected catchments |

**G-NAF specifics:**
- 15.4M addresses, each with a unique 14-character `GNAF_PID`
- Each address has latitude/longitude, street name, number, suburb, postcode, state
- Updated quarterly; static for hackathon purposes
- File is ~2.5 GB uncompressed; pre-download and filter to one city to get ~200 MB

**Hackathon play:**
1. Pre-download G-NAF, filter to Greater Sydney or Greater Melbourne → one CSV.
2. Grab 3–4 GeoJSON overlays for the same city: flood risk, bushfire, heritage overlay, zoning.
3. Load them all into PostGIS once. They are static for the demo period.
4. Spatial queries: `ST_Within` / `ST_DWithin` to check whether a property point intersects a risk polygon.

### 1.4 Socioeconomic & Demographic

| Dataset | Provider | URL | Format | Cost |
|---|---|---|---|---|
| **ABS Census 2021** (SA1/SA2 level) | ABS | `https://www.abs.gov.au/census/find-census-data/datapacks` | CSV + boundaries | Free |
| **ABS QuickStats API** | ABS | `https://api.data.abs.gov.au/` | JSON REST | Free, rate-limited (500/day) |
| **School intake zones** | NSW DoE, VIC Ed Dept | Varies by state (see below) | GeoJSON/KML | Free |
| **Crime stats** (NSW) | BOCSAR | `https://www.bocsar.nsw.gov.au/` | CSV by LGA | Free |
| **Crime stats** (VIC) | CSA | `https://www.crimestatistics.vic.gov.au/` | CSV by LGA | Free |

**School zone data URLs:**
- NSW: `https://data.cese.nsw.gov.au/data/dataset/nsw-government-schools-master-dataset` (includes intake zone shapefiles)
- VIC: `https://www.findmyschool.vic.gov.au/` (interactive map; zones available as KML at `https://discover.data.vic.gov.au/dataset/school-zones-2024`)

**Hackathon play:** Grab one state's school zone GeoJSON. Use ABS QuickStats API for suburb-level demographics (median income, owner/renter split, household composition). The DataPack approach is too heavy for MVP — the API is enough.

---

## 2. Master Property Schema

Every data source gets mapped into a single `properties` table. The schema is deliberately flat for hackathon speed; a production system would normalise addresses, parcel data, and risk flags into separate tables.

### 2.1 Core Table: `properties`

```sql
CREATE TABLE properties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gnaf_pid            VARCHAR(14),                    -- G-NAF persistent ID (14 chars)
    canonical_address   TEXT NOT NULL,                   -- Normalised full address string (derived from structured components)
    unit_number         VARCHAR(20),
    street_number       VARCHAR(20),
    street_name         VARCHAR(200),
    street_type         VARCHAR(20),
    suburb              TEXT NOT NULL,
    state               TEXT NOT NULL CHECK (state IN ('VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
    postcode            VARCHAR(4) NOT NULL,
    location            GEOMETRY(Point, 4326) NOT NULL,  -- PostGIS spatial index; lat/lon derived via ST_X/ST_Y

    -- Property characteristics
    property_type       TEXT CHECK (property_type IN ('house', 'townhouse', 'apartment', 'unit', 'villa', 'duplex', 'land')),
    bedrooms            SMALLINT,
    bathrooms           SMALLINT,
    car_spaces          SMALLINT,
    land_size_sqm       NUMERIC(10,1),
    floor_area_sqm      NUMERIC(10,1),

    -- Pricing & valuation
    listing_price       INTEGER,                         -- current listing, if active
    listing_price_text  TEXT,                            -- "Contact Agent", "Offers Over $X"
    listing_source      TEXT NOT NULL,                   -- 'domain', 'realestate', 'manual'
    listing_url         TEXT,
    listed_date         DATE,
    sold_date           DATE,
    sold_price          INTEGER,
    sale_type           VARCHAR(30),                     -- 'auction', 'private_treaty', 'arm''s_length', 'non_arm''s_length'
    transfer_type       VARCHAR(30),                     -- 'full', 'partial', 'related_party'

    -- Spatial
    boundary            GEOMETRY(MultiPolygon, 4326),    -- cadastral lot boundary

    -- Lineage
    raw_data            JSONB,                           -- source listing data preserved verbatim
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_properties_gnaf_unit ON properties(gnaf_pid, unit_number) WHERE gnaf_pid IS NOT NULL;
CREATE INDEX idx_properties_suburb            ON properties(suburb, postcode);
CREATE INDEX idx_properties_type_price        ON properties(property_type, listing_price);
CREATE INDEX idx_properties_location          ON properties USING GIST(location);
CREATE INDEX idx_properties_boundary          ON properties USING GIST(boundary);
```
**Note:** Risk flags (flood_risk, bushfire_zone, heritage_overlay) are NOT stored inline on `properties`. They live in the normalised `property_risks` table (see Doc 07 §5g). This allows multiple risk types per property, each with severity levels and source data provenance. The spatial join pipeline populates `property_risks` during enrichment (see §3 Enrichment Layer).

**Note:** `canonical_address` is derived from the structured address components (`unit_number || ' ' || street_number || ' ' || street_name || ' ' || street_type || ', ' || suburb || ' ' || state || ' ' || postcode`). It is stored as a computed/generated field for display and full-text search convenience.

**Note on G-NAF unit/apartment limitation:** G-NAF stores addresses at the lot/building level, NOT the individual unit level. Two apartments in the same building (e.g., "3/12 Smith St" and "5/12 Smith St") share the same `gnaf_pid`. The uniqueness constraint uses the composite key `(gnaf_pid, unit_number)` — see §4.3 for detailed handling.

### 2.2 Field Mapping from Sources

| Master Field | Domain API | VG Sales (NSW) | ABS Census | G-NAF |
|---|---|---|---|---|---|
| `gnaf_pid` | N/A (geocode address → match) | N/A (match on address) | N/A | `GNAF_PID` |
| `location` | `geoLocation.latitude` / `.longitude` → combine to Point | N/A (derive from G-NAF) | N/A | `LATITUDE` / `LONGITUDE` → combine to Point |
| `property_type` | `propertyTypes[]` → map to enum | `property_type` field | N/A | N/A |
| `bedrooms` / `bathrooms` / `car_spaces` | `bedrooms`, `bathrooms`, `carspaces` | CSV columns | N/A | N/A |
| `land_size_sqm` | `landArea` (m²) | `land_area` | N/A | N/A |
| `listing_price` | `priceDetails.displayPrice` (parse) | N/A | N/A | N/A |
| `sold_price` | N/A | `purchase_price` | N/A | N/A |
| `sold_date` | N/A | `sale_date` | N/A | N/A |
| `listing_source` | `'domain'` (static) | `'vg_nsw'` (static) | N/A | N/A |
| `listing_url` | domain listing URL | N/A | N/A | N/A |
| `listed_date` | listing creation date | N/A | N/A | N/A |
| `boundary` | N/A | N/A | N/A | N/A (cadastral from state land registry) |
| suburb demographics | N/A | N/A | ABS QuickStats API → `suburb_demographics` table | N/A |

### 2.3 Conflict Resolution

When two sources disagree (e.g., Domain says 3 bedrooms, VG sales CSV says 4):

1. **Recency wins** for active listing fields (bedrooms, bathrooms, price). Domain is updated daily; VG data is months old.
2. **Authoritative source wins** for static fields: G-NAF for address geometry, state planning portal for zoning.
3. **Log conflicts** in a `data_lineage` table for auditing, not for MVP.

### 2.4 VG Sales Data Quality

NSW/VIC Valuer-General bulk sales data contains non-arm's-length transactions (family transfers, $0/$1 consideration, mortgagee sales) that would corrupt any valuation model. A pre-processing step MUST filter them:

- **Exclude** transactions where `sale_price <= 1000` ($0/$1 conveyancing transfers).
- **Exclude** transactions where `sale_type` = `non_arm's_length` or `transfer_type` = `related_party`.
- **Flag** anomalous records (sale price > 5x median suburb) for manual review.
- Record `sale_type` and `transfer_type` on each ingested sale for auditability.

These filters reduce the typical VG CSV by ~15–20% (mostly family transfers and minor subdivisions) but dramatically improve data quality.

---

## 3. Data Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                           │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐      │
│  │ Domain   │  │ VG Sales CSV │  │ Geospatial Files      │      │
│  │ Fetcher  │  │ Processor    │  │ (GeoJSON, SHP → PG)   │      │
│  │ (API)    │  │ (Bulk Load)  │  │ ogr2ogr loader        │      │
│  └────┬─────┘  └──────┬───────┘  └───────────┬───────────┘      │
│       │               │                      │                   │
└───────┼───────────────┼──────────────────────┼───────────────────┘
        │               │                      │
        ▼               ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NORMALIZATION LAYER                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Address Standardizer                                   │     │
│  │  - Parse address strings → structured components         │     │
│  │  - Match against G-NAF to get PID + lat/lon             │     │
│  │  - Fallback: Google Geocoding or Nominatim               │     │
│  └─────────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Schema Mapper                                          │     │
│  │  - Map source fields → master schema                    │     │
│  │  - Flag missing/conflicting data                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Deduplicator                                           │     │
│  │  - Match by G-NAF PID → merge                            │     │
│  │  - Match by fuzzy address → log for review               │     │
│  └─────────────────────────────────────────────────────────┘     │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     ENRICHMENT LAYER                             │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │ Spatial Joins    │  │ Risk Flag    │  │ Demographic    │     │
│  │ (PostGIS ST_*)   │  │ Computation  │  │ Lookup         │     │
│  │ → property_risks │  │ (populates   │  │                │     │
│  │   table          │  │ property_    │  │                │     │
│  │                   │  │ risks rows)  │  │                │     │
│  └──────────────────┘  └──────────────┘  └────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     STORAGE LAYER                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL 15 + PostGIS 3                                │    │
│  │  - properties table (active listings + merged history)    │    │
│  │  - geospatial layers (flood, bushfire, zoning, schools)  │    │
│  │  - materialized view: property_summary_view               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SERVING LAYER                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  API Server                                               │    │
│  │  GET /api/v1/properties?filter[suburb]=X&filter[property_type]=house&filter[price][lte]=1200000 │
│  │  GET /api/v1/properties/:property_id                                                        │    │
│  │  GET /api/v1/properties/:property_id/risk-overlays                                          │    │
│  │  GET /api/v1/properties/:property_id/comparables?radius_km=2                                │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key design decisions for hackathon:**

1. **No streaming/message queue.** Cron triggers on the ingestion scripts are fine for 3 days.
2. **No data warehouse.** Postgres is the source of truth and the query engine. At MVP scale, a single instance will handle all spatial queries.
3. **No real-time pipeline.** Everything is batch. The Domain API fetcher runs once, the CSVs are bulk-loaded once, and geospatial data is static.

---

## 4. Address Matching Strategy

The hardest data integration problem: a Domain listing says "12A Smith Street, Surry Hills" but the VG sales record says "12A SMITH ST SURRY HILLS 2010". Without matching, we cannot connect a listing to its sale history.

### 4.0 G-NAF Unit/Apartment Limitation (Critical)

**G-NAF stores addresses at the lot/building level, not the individual unit level.** Two apartments in the same building (e.g., "Unit 3, 12 Smith St" and "Unit 5, 12 Smith St") will share the same `gnaf_pid`. This is a significant limitation for Australian residential property where strata-title units are common.

**Workaround:**

1. The properties table uses a composite unique constraint: `UNIQUE(gnaf_pid, unit_number)`. Two units in the same building share a G-NAF PID but have different `unit_number` values.
2. The `unit_number` field is extracted from the raw address string by the address parser (see §4.4).
3. When matching: match `gnaf_pid` first, then compare `unit_number`. If both match, it is the same unit. If `gnaf_pid` matches but `unit_number` differs, it is a different unit in the same building — do NOT merge.
4. For properties without a unit (houses, standalone dwellings), `unit_number` is `NULL` and the unique constraint on `(gnaf_pid, NULL)` is treated as unique per gnaf_pid.

**Implications for data matching:**
- VG sales data typically includes unit numbers. A sale record for "U3/12 Smith St" must match to the correct unit in the properties table, not just any unit in the building.
- When ingesting Domain listings, always extract and store the unit number. Without it, you cannot correctly deduplicate apartment listings.
- The `canonical_address` field should include the unit number to prevent two different units from appearing to have the same address.

### 4.2 The Canonical Key: G-NAF PID

1. Parse the raw address string into components (unit, number, street, type, suburb, postcode, state).
2. Query G-NAF with the structured components: exact match on street number + street name + suburb + state.
3. If match found → assign the `GNAF_PID`. All subsequent enrichment (spatial joins, demographic lookups) use this PID as the join key.
4. If no exact match → attempt fuzzy matching (below).

### 4.3 Fuzzy Matching Algorithm

For addresses that do not cleanly parse:

1. **Normalise** both strings: uppercase, strip punctuation, expand abbreviations (`ST` → `STREET`, `RD` → `ROAD`), remove unit/level prefixes.
2. **Levenshtein distance** on the normalised string against G-NAF `FULL_ADDRESS` candidates filtered to the same suburb.
3. **Scoring threshold:** Accept matches with Levenshtein ratio ≥ 0.85 and require suburb/postcode agreement.
4. **Manual queue:** Matches with score 0.70–0.85 are logged for later human inspection. For hackathon, unmatched addresses are skipped. Production would use a `review_queue` table.

### 4.4 Unit/Apartment Number Handling

Units are the trickiest case. "3/12 Smith Street" and "Unit 3, 12 Smith Street" are the same place.

**Strategy:**
- Split on `/`, `-`, and keyword separators (`UNIT`, `APT`, `U`) before street number.
- Extract the unit number as a separate field.
- Match the street address portion first, then compare unit numbers.
- If unit numbers differ but street address matches → likely a different unit in the same building; do not merge.

### 4.5 Practical Hackathon Route

For 3 days, do not build a fuzzy matcher from scratch. **Do NOT use libpostal** — it is unmaintained (last release 2018), has known build failures on macOS (Apple Silicon), and requires compiling C libraries. Use a simple regex-based Australian address parser instead.

**Recommended approach: regex-based AU address parser**

Australian residential addresses follow predictable patterns. A simple regex handles 90%+ of cases:

```
Pattern: /((\d+[A-Z]?)\/)?(\d+[A-Z]?)\s+(.+?)\s+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parade|Pde|Place|Pl|Close|Cl|Court|Ct|Lane|Ln|Way|Crescent|Cr|Circuit|Cct|Loop|Grove|Gr|Terrace|Tce|Highway|Hwy)\b,?\s*(.+?),?\s*(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s*(\d{4})/i
```

Groups: `[1]` = full unit prefix (e.g., "3/"), `[2]` = unit number, `[3]` = street number, `[4]` = street name, `[5]` = street type, `[6]` = suburb, `[7]` = state, `[8]` = postcode.

**Fallback for unmatched addresses:** Use Google Geocoding API (2500 free requests/day) or Nominatim (OpenStreetMap, rate-limited but free). For hackathon, pre-geocode all seed addresses and cache results.

**Production note:** For a production system handling diverse AU address formats (rural properties, corner blocks, multi-level commercial), use a purpose-built parser or Google Address Validation API. The regex approach handles typical suburban residential addresses — which covers the MVP scope of one metro area.

```
Raw address → regex parser → {unit_number, street_number, street_name, street_type, suburb, state, postcode}
→ SELECT gnaf_pid FROM gnaf_addresses WHERE street_number = ? AND street_name = ? AND locality = ? AND postcode = ?
```

---

## 5. Data Freshness & Caching

### 5.1 Freshness SLAs

| Data Layer | Acceptable Staleness | Refresh Strategy | Rationale |
|---|---|---|---|
| Active listings | 1 hour | Cron every 60 min, Domain API search by suburb | Listings can go under offer quickly; stale data = wasted site visits |
| Sold prices | 1 week | Re-download VG CSV weekly | No choice — source data lags 6–8 weeks anyway |
| Geospatial overlays | 1 month | Static load at deploy, refresh on request | Flood maps and zoning do not change mid-hackathon |
| School zones | 1 month | Pre-loaded GeoJSON | Updated annually by state governments |
| ABS demographics | 3 months | Cache QuickStats API responses | Census data is every 5 years; slight staleness irrelevant |

### 5.2 Caching Strategy

The free Domain API tier has a hard 2,000 calls/day limit. Every suburb search costs 1 call; every listing detail costs 1 call. For a demo covering 10 suburbs with 50 listings each: 10 search calls + 500 detail calls = 510 calls. That fits within the limit but leaves no headroom for retries or multiple team members testing.

**Cache design:**

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  API Server  │────▶│  LRU Cache (TTL) │────▶│  PostgreSQL  │
│              │     │  (in-memory)     │     │  (source)    │
└──────────────┘     └──────────────────┘     └──────────────┘
```

- **Listing search results:** Cache in-memory with a 30-minute TTL. Key: `search:{suburb}:{filters_hash}`.
- **Individual listing detail:** Cache with 60-minute TTL. Key: `listing:{listing_id}`.
- **Stale-while-revalidate:** When a cache entry expires, serve the stale entry and re-fetch in the background. This means the demo always loads instantly even if the Domain API is slow.
- **Bust on mutation:** A "refresh" button in the UI force-revalidates for that listing only, using 1 API call.

For hackathon, **in-memory LRU cache** (`lru-cache` npm package, 200 MB limit) is sufficient. Three developers banging on the same localhost API will never saturate 2,000 calls/day with a 30-minute cache.

---

## 6. Hackathon Data Strategy

### 6.1 What We Can Realistically Get

| Capability | How | Files | Size | Effort |
|---|---|---|---|---|
| Active listings for 1 city | Domain API free tier, pre-fetch 500 listings | JSON dump → Postgres | <10 MB | 1 hour |
| Address geocoding for all listings | G-NAF pre-filtered to city | 1 CSV | ~200 MB | 1 hour |
| Historical sales for that city | NSW/VIC VG CSV, filtered | 1 CSV | ~50 MB | 30 min |
| Flood risk overlay | NSW Flood Data Portal GeoJSON | 1 GeoJSON | ~20 MB | 30 min |
| Bushfire risk overlay | NSW RFS BFP GeoJSON | 1 GeoJSON | ~5 MB | 15 min |
| Heritage + zoning overlay | NSW Planning Portal GeoJSON | 1 GeoJSON | ~10 MB | 30 min |
| School zone overlay | NSW DoE school zones KML → GeoJSON | 1 GeoJSON | ~5 MB | 30 min |
| Suburb demographics | ABS QuickStats API (on-demand, not bulk) | API only | N/A | 1 hour |

**Total pre-downloaded data:** ~300 MB. All load into PostGIS once and are static for the weekend.

### 6.2 Seed Data Approach

1. **Week before hackathon:** One team member pre-downloads all static files (G-NAF, GeoJSON overlays, VG sales CSV). Store them in a private S3 bucket or shared Drive folder.

2. **Hour 1 of hackathon:** Scrape 500 Domain listings for the target city. Export as JSON. This is the seed dataset for the demo.

3. **During development:** PostGIS is populated via a single `seed.sh` script that:
   - Creates tables
   - Runs `ogr2ogr` to load GeoJSON overlays into spatial tables (flood_zones, bushfire_areas, heritage_overlays, school_zones)
   - Loads G-NAF CSV with `COPY`
   - Loads seed listings JSON with a Node script
   - Runs spatial joins to populate `property_risks` from the overlay tables
   - Creates the `property_summary_view` materialized view

4. **Demo flow:** The API reads from Postgres. The user "searches" — it hits the cached listings. The user "analyzes a property" — it returns risk flags from the `property_risks` table via spatial join. No live API calls during the demo. A live "refresh" button can hit the real Domain API as a demo flourish.

### 6.3 What to Fake vs. Real

| Component | Use Real Data | Fake / Mock | Rationale |
|---|---|---|---|
| Property listings | Real (pre-fetched Domain) | N/A | Must look real for buyers agents |
| Property photos | Real (Domain CDN URLs) | N/A | Thumbnails come with the API response |
| Addresses | Real (G-NAF validated) | N/A | Core platform value prop |
| Geospatial risk overlays | Real (government portals) | N/A | Public data, no cost, killer demo feature |
| AVM (valuation estimate) | **Fake.** Simple heuristic only | Hardcoded: median suburb price × (bedrooms/3) ± 10% | Real AVM requires CoreLogic/PEXA access and ML model training |
| Comparable sales | Real (VG sales data) | N/A | Filter by suburb + property type + date |
| Demographic summaries | Real (ABS API) | N/A | 1 API call per suburb, cache it |
| Suburb "score" or "rating" | **Fake.** Subjective composite | Weighted score from risk flags + demographics | This is editorial content for the demo. Do not pretend it is scientific. |
| Live "offer accepted" status | **Fake.** Randomly toggle one listing | Toggle 1 of 20 demo listings after 10 minutes to simulate the market | Dramatic demo effect |

### 6.4 The $0 Cost Boundary

Everything listed above is achievable at zero cost:

- Domain API free tier: $0
- G-NAF: $0 (government open data)
- All GeoJSON overlays: $0 (government open data)
- VG sales data: $0
- ABS QuickStats API: $0 (500 calls/day)
- PostGIS: $0 (Docker on the dev machine, or Supabase free tier, or Railway hobby)

The moment we need CoreLogic, PEXA, RP Data, or real-time sold price feeds, the cost goes to AUD $500–2,000+/month. The hackathon MVP stays entirely within the free boundary.

---

## Appendix A: Key Files & Scripts

```
data-pipeline/
├── seed.sh                            # Master setup: creates DB, loads all static data
├── fetchers/
│   └── domain_fetcher.ts              # Fetches listings from Domain API, caches, normalises
├── loaders/
│   ├── load_gnaf.sql                  # COPY G-NAF CSV into Postgres
│   ├── load_vg_sales.sql              # COPY VG sales CSV (with arm's-length filtering)
│   └── load_geojson.sh                # ogr2ogr wrapper for all overlay layers (flood_zones, bushfire_areas, heritage_overlays, school_zones)
├── enrich/
│   ├── compute_property_risks.sql     # PostGIS spatial joins → property_risks table
│   └── compute_demographics.ts        # ABS API fetcher, caches to Postgres
├── parse/
│   └── au_address_parser.ts           # Regex-based AU address parser (see §4.5)
└── views/
    └── property_summary_view.sql      # Materialized denormalized view
```

---

## Revision Notes

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-05-23 | Schema sync with Doc 07 (canonical): Replaced `geom`/`lat`/`lon` with `location GEOMETRY(Point,4326)`; renamed `land_area_sqm`→`land_size_sqm`, `last_sale_price`→`sold_price`, `last_sale_date`→`sold_date`, `source`→`listing_source`; changed `suburb`/`state`/`property_type` to TEXT with CHECK constraints; `floor_area_sqm`→`NUMERIC(10,1)`; `listing_price_text`→TEXT. Removed: `year_built`, `estimated_value`, `median_suburb_price`, `zoning_code`, `school_zone_primary`, `school_zone_secondary`, `source_id`, `data_version`. Added: `listing_url`, `listed_date`, `boundary`, `raw_data`. Updated API paths to `/api/v1/` and `:property_id`; `risks` endpoint → `risk-overlays`. G-NAF query now references `gnaf_addresses` table. Fixed review_queue reference in §4.3. |
| 1.1 | 2026-05-23 | Adversarial review fixes: Removed inline BOOLEAN risk flags from properties table — risks now in normalised `property_risks` table (Doc 07 §5g). Added `sale_type` and `transfer_type` columns with VG data quality filtering logic (§2.4). Added G-NAF unit/apartment limitation section (§4.0) with composite unique constraint workaround. Replaced libpostal recommendation with regex-based AU address parser (§4.5). Updated seed script and enrichment layer sections to reference spatial source tables and property_risks. Changed canonical_address to be derived from structured components. |
