# DATA MODEL — Hackathon MVP

**Database:** Supabase (hosted PostgreSQL 16)
**Auth:** Supabase Auth (`auth.users` managed automatically)
**Strategy:** Canonical subset of the full blueprint schema (Doc 07), simplified for a 48-hour demo. All data is pre-seeded; no live API integrations.

---

## 1. Tables (MVP Subset)

### 1a) `profiles` — extends Supabase `auth.users`

Supabase Auth manages `auth.users` automatically. This table extends it with role and display data. A trigger auto-creates a profile row on each new signup.

```sql
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('agent', 'client')),
    full_name   TEXT NOT NULL,
    email       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 1b) `buyer_briefs`

```sql
CREATE TABLE buyer_briefs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id          UUID NOT NULL REFERENCES profiles(id),
    client_id         UUID REFERENCES profiles(id),
    client_name       TEXT,
    status            TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('draft','active','paused','fulfilled','archived')),
    budget_min        INTEGER CHECK (budget_min > 0),
    budget_max        INTEGER CHECK (budget_max >= budget_min),
    property_types    JSONB,          -- ["house", "apartment", "townhouse"]
    preferred_suburbs JSONB,           -- ["Surry Hills", "Newtown", "Pyrmont"]
    min_bedrooms      SMALLINT DEFAULT 1,
    min_bathrooms     SMALLINT DEFAULT 1,
    must_haves        JSONB,           -- ["natural_light", "near_transport", "internal_laundry"]
    deal_breakers     JSONB,           -- ["ground_floor", "main_road", "no_balcony"]
    parking           TEXT CHECK (parking IN ('required','nice_to_have','not_needed')),
    finance_status    TEXT CHECK (finance_status IN ('not_started', 'pre_approved', 'approved', 'cash')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 1c) `properties` — canonical columns from Doc 07 (subset for MVP)

Matches the blueprint's `properties` table exactly for all non-spatial columns. Omits `location` and `boundary` (PostGIS) since the MVP does not need spatial queries.

```sql
CREATE TABLE properties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gnaf_pid            VARCHAR(14),
    canonical_address   TEXT NOT NULL,
    unit_number         VARCHAR(20),
    street_number       VARCHAR(20),
    street_name         VARCHAR(200),
    street_type         VARCHAR(20),
    suburb              TEXT NOT NULL,
    state               TEXT NOT NULL CHECK (state IN ('VIC','NSW','QLD','WA','SA','TAS','ACT','NT')),
    postcode            VARCHAR(4) NOT NULL,
    property_type       TEXT CHECK (property_type IN ('house','townhouse','apartment','unit','villa','duplex','land')),
    bedrooms            SMALLINT,
    bathrooms           SMALLINT,
    car_spaces          SMALLINT,
    land_size_sqm       NUMERIC(10,1),
    floor_area_sqm      NUMERIC(10,1),
    main_image_url      TEXT,
    listing_price       INTEGER,
    listing_price_text  TEXT,
    listing_source      TEXT NOT NULL DEFAULT 'manual',
    listing_url         TEXT,
    listed_date         DATE,
    sold_date           DATE,
    sold_price          INTEGER,
    sale_type           VARCHAR(30),
    transfer_type       VARCHAR(30),
    raw_data            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 1d) `cma_records`

```sql
CREATE TABLE cma_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    comparable_address TEXT,
    sale_price      INTEGER,
    sale_date       DATE,
    bedrooms        SMALLINT,
    bathrooms       SMALLINT,
    land_size_sqm   NUMERIC(10,1),
    price_per_sqm   NUMERIC(10,1),
    distance_km     NUMERIC(5,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 1e) `risk_overlays`

```sql
CREATE TABLE risk_overlays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    risk_type       TEXT NOT NULL CHECK (risk_type IN ('flood','bushfire','heritage','zoning')),
    risk_level      TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
    description     TEXT
);
```

### 1f) `shortlists`

A flat table combining the canonical `shortlists` + `shortlist_items`. A row links one property to one brief for one client.

```sql
CREATE TABLE shortlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_brief_id  UUID NOT NULL REFERENCES buyer_briefs(id) ON DELETE CASCADE,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES profiles(id),
    status          TEXT NOT NULL DEFAULT 'interested'
                        CHECK (status IN ('interested','need_more_info','not_for_me')),
    feedback_text   TEXT,
    shared_at       TIMESTAMPTZ,
    feedback_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(buyer_brief_id, property_id)
);
```

### 1g) `match_scores`

Pre-computed scores stored at seed time. No live matching engine runs during the demo.

```sql
CREATE TABLE match_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id        UUID NOT NULL REFERENCES buyer_briefs(id) ON DELETE CASCADE,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    match_score     INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons   JSONB,
    budget_match    INTEGER CHECK (budget_match >= 0 AND budget_match <= 100),
    suburb_match    INTEGER CHECK (suburb_match >= 0 AND suburb_match <= 100),
    type_match      INTEGER CHECK (type_match >= 0 AND type_match <= 100),
    features_match  INTEGER CHECK (features_match >= 0 AND features_match <= 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(brief_id, property_id)
);
```

### 1h) `user_actions`

Lightweight event log for future analytics/ML training.

```sql
CREATE TABLE user_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id),
    action_type     TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 2. RLS Policies

For the hackathon MVP, RLS is kept simple. A "demo mode" approach relaxes strict ownership checks to avoid debugging RLS during the 48-hour window.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cma_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own; authenticated users can read all (demo mode)
CREATE POLICY "Users read own profile"
    ON profiles FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Demo: authenticated can read all profiles"
    ON profiles FOR SELECT TO authenticated
    USING (true);

-- Buyer briefs: agent reads/writes their own; all authenticated can read (demo)
CREATE POLICY "Agents manage own briefs"
    ON buyer_briefs FOR ALL TO authenticated
    USING (agent_id = auth.uid());

-- Properties: all authenticated users can read
CREATE POLICY "Authenticated read properties"
    ON properties FOR SELECT TO authenticated
    USING (true);

-- CMA records: all authenticated can read
CREATE POLICY "Authenticated read cma"
    ON cma_records FOR SELECT TO authenticated
    USING (true);

-- Risk overlays: all authenticated can read
CREATE POLICY "Authenticated read risks"
    ON risk_overlays FOR SELECT TO authenticated
    USING (true);

-- Shortlists: clients read their own, agents manage all
CREATE POLICY "Clients read own shortlist"
    ON shortlists FOR SELECT TO authenticated
    USING (client_id = auth.uid());

CREATE POLICY "Agents insert shortlist items"
    ON shortlists FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

CREATE POLICY "Agents update shortlist items"
    ON shortlists FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

CREATE POLICY "Agents delete shortlist items"
    ON shortlists FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

-- Match scores: all authenticated can read
CREATE POLICY "Authenticated read scores"
    ON match_scores FOR SELECT TO authenticated
    USING (true);

-- User actions: users insert their own
CREATE POLICY "Users insert own actions"
    ON user_actions FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
```

---

## 3. Indexes

```sql
-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- Buyer briefs
CREATE INDEX idx_briefs_agent ON buyer_briefs(agent_id);
CREATE INDEX idx_briefs_client ON buyer_briefs(client_id);
CREATE INDEX idx_briefs_budget ON buyer_briefs(budget_min, budget_max);

-- Properties (primary search columns)
CREATE INDEX idx_properties_suburb ON properties(suburb);
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_price ON properties(listing_price);
CREATE INDEX idx_properties_listed_date ON properties(listed_date DESC) WHERE listing_price IS NOT NULL;

-- CMA records
CREATE INDEX idx_cma_property ON cma_records(property_id);
CREATE INDEX idx_cma_sale_date ON cma_records(sale_date DESC);

-- Risk overlays
CREATE INDEX idx_risk_property ON risk_overlays(property_id);
CREATE INDEX idx_risk_type ON risk_overlays(risk_type, risk_level);

-- Shortlists
CREATE INDEX idx_shortlists_brief ON shortlists(buyer_brief_id);
CREATE INDEX idx_shortlists_client ON shortlists(client_id);
CREATE INDEX idx_shortlists_status ON shortlists(status);

-- Match scores (primary access pattern: all matches for a brief ranked by score)
CREATE INDEX idx_scores_brief ON match_scores(brief_id, match_score DESC);
CREATE INDEX idx_scores_property ON match_scores(property_id);

-- User actions
CREATE INDEX idx_actions_user ON user_actions(user_id, created_at DESC);
CREATE INDEX idx_actions_entity ON user_actions(entity_type, entity_id);
```

---

## 4. Seed Data

All data is pre-loaded before the demo. The seed script runs once in the Supabase SQL Editor.

### 4.1 Demo Users

Supabase Auth handles user creation. After creating `agent@demo.com` and `sarah@demo.com` via the Supabase dashboard (or API), the profile trigger fires automatically. For the seed SQL, insert directly into profiles referencing the known auth UUIDs:

```sql
-- Insert demo profiles (replace UUIDs with actual auth.users IDs)
INSERT INTO profiles (id, role, full_name, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'agent',  'Alex Morgan',    'agent@demo.com'),
    ('22222222-2222-2222-2222-222222222222', 'client', 'Sarah Chen',     'sarah@demo.com');
```

### 4.2 Properties (25 total — 5 explicit, 20 follow the same pattern)

```sql
INSERT INTO properties (id, canonical_address, street_number, street_name, street_type, suburb, state, postcode, property_type, bedrooms, bathrooms, car_spaces, land_size_sqm, floor_area_sqm, main_image_url, listing_price, listing_price_text, listing_source, listing_url, listed_date, raw_data) VALUES
    ('a0000000-0000-0000-0000-000000000001', '42 Union Street, Surry Hills NSW 2010',
     '42', 'Union', 'Street', 'Surry Hills', 'NSW', '2010', 'apartment', 2, 1, 0, NULL, 78,
     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
     950000, '$950,000', 'manual', 'https://demo.example.com/listing/prop-001',
     '2026-05-01',
     '{"description":"Renovated two-bedroom apartment in a quiet tree-lined street. Open-plan living with polished timber floors, gas kitchen, and a sunny north-facing balcony. Walk to cafes and light rail.","features":["balcony","timber_floors","gas_cooking","internal_laundry"],"days_on_market":7}'),

    ('a0000000-0000-0000-0000-000000000002', '18A Hutchinson Street, Surry Hills NSW 2010',
     '18A', 'Hutchinson', 'Street', 'Surry Hills', 'NSW', '2010', 'apartment', 2, 1, 0, NULL, 72,
     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
     875000, 'Offers Over $850,000', 'manual', 'https://demo.example.com/listing/prop-002',
     '2026-04-28',
     '{"description":"Ground-floor Art Deco apartment with high ceilings and original features. Shared courtyard garden. Walk to Crown Street dining and Central Station.","features":["high_ceilings","courtyard","original_features"],"days_on_market":14}'),

    ('a0000000-0000-0000-0000-000000000005', '7/245 Devonshire Street, Surry Hills NSW 2010',
     '7', 'Devonshire', 'Street', 'Surry Hills', 'NSW', '2010', 'apartment', 2, 1, 1, NULL, 82,
     'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
     985000, '$985,000', 'manual', 'https://demo.example.com/listing/prop-005',
     '2026-04-15',
     '{"description":"Top-floor apartment with city skyline views, secure parking, and modern finishes throughout. Split-system A/C and internal laundry.","features":["city_views","secure_parking","air_conditioning","internal_laundry"],"days_on_market":21}'),

    ('a0000000-0000-0000-0000-000000000007', '34 King Street, Newtown NSW 2042',
     '34', 'King', 'Street', 'Newtown', 'NSW', '2042', 'apartment', 2, 1, 0, NULL, 68,
     'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
     820000, '$820,000', 'manual', 'https://demo.example.com/listing/prop-007',
     '2026-05-05',
     '{"description":"Character-filled Victorian-era apartment on iconic King Street. Exposed brick, sash windows, and a charming Juliet balcony. Seconds from Newtown Station.","features":["exposed_brick","balcony","near_station"],"days_on_market":3}'),

    ('a0000000-0000-0000-0000-000000000010', '12/88 Harris Street, Pyrmont NSW 2009',
     '12', 'Harris', 'Street', 'Pyrmont', 'NSW', '2009', 'apartment', 2, 2, 1, NULL, 95,
     'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
     1050000, '$1,050,000', 'manual', 'https://demo.example.com/listing/prop-010',
     '2026-04-22',
     '{"description":"Contemporary waterside apartment with harbour glimpses. Open-plan living, stone benchtops, ducted A/C, and resort-style building facilities including pool and gym.","features":["harbour_glimpses","pool","gym","ducted_ac","secure_parking"],"days_on_market":28}')
;
```

**Remaining 20 properties** follow the same INSERT pattern covering Surry Hills, Newtown, Pyrmont, Glebe, Redfern, Paddington, Mosman, Randwick, Marrickville, Lane Cove (see `seed.sql` commit for the full file).

### 4.3 CMA Records (2-3 per property)

```sql
INSERT INTO cma_records (property_id, comparable_address, sale_price, sale_date, bedrooms, bathrooms, land_size_sqm, price_per_sqm, distance_km, notes) VALUES
    -- CMA for prop-001 (42 Union St)
    ('a0000000-0000-0000-0000-000000000001', '18A Hutchinson Street, Surry Hills NSW 2010', 920000, '2026-02-15', 2, 1, NULL, 11795, 0.3, 'Similar condition, no balcony'),
    ('a0000000-0000-0000-0000-000000000001', '7/245 Devonshire Street, Surry Hills NSW 2010', 985000, '2026-03-08', 2, 1, NULL, 12628, 0.6, 'Renovated, parking included'),

    -- CMA for prop-002 (18A Hutchinson St)
    ('a0000000-0000-0000-0000-000000000002', '42 Union Street, Surry Hills NSW 2010', 950000, '2026-01-20', 2, 1, NULL, 12179, 0.3, 'Nicely renovated, north-facing balcony'),
    ('a0000000-0000-0000-0000-000000000002', '5/112 Albion Street, Surry Hills NSW 2010', 895000, '2025-12-10', 2, 1, NULL, 11474, 0.5, 'Similar layout, ground floor'),

    -- CMA for prop-005 (7/245 Devonshire St)
    ('a0000000-0000-0000-0000-000000000005', '42 Union Street, Surry Hills NSW 2010', 950000, '2026-01-20', 2, 1, NULL, 12179, 0.5, 'Renovated, no parking'),
    ('a0000000-0000-0000-0000-000000000005', '3/89 Foveaux Street, Surry Hills NSW 2010', 1005000, '2026-04-02', 2, 1, NULL, 12885, 0.3, 'Similar spec, parking included'),

    -- CMA for prop-007 (34 King St, Newtown)
    ('a0000000-0000-0000-0000-000000000007', '22 Wilson Street, Newtown NSW 2042', 840000, '2026-02-28', 2, 1, NULL, 12000, 0.4, 'Renovated, quieter street'),
    ('a0000000-0000-0000-0000-000000000007', '18/200 Australia Street, Newtown NSW 2042', 798000, '2025-11-15', 2, 1, NULL, 11400, 0.7, 'Unrenovated, larger floorplan'),

    -- CMA for prop-010 (12/88 Harris St, Pyrmont)
    ('a0000000-0000-0000-0000-000000000010', '22/50 Jones Street, Pyrmont NSW 2009', 1020000, '2026-03-01', 2, 2, NULL, 10737, 0.2, 'Similar spec, no harbour view'),
    ('a0000000-0000-0000-0000-000000000010', '5/120 Pyrmont Street, Pyrmont NSW 2009', 1080000, '2026-04-10', 2, 2, NULL, 11368, 0.4, 'Water views, premium building')
;
```

### 4.4 Risk Overlays

```sql
INSERT INTO risk_overlays (property_id, risk_type, risk_level, description) VALUES
    -- Surry Hills risks
    ('a0000000-0000-0000-0000-000000000001', 'heritage', 'medium', 'Part of the Surry Hills Heritage Conservation Area. External modifications require council approval (DCP 2016).'),
    ('a0000000-0000-0000-0000-000000000001', 'flood', 'low', 'Minor overland flow risk in low-lying streets near South Dowling Street.'),
    ('a0000000-0000-0000-0000-000000000002', 'heritage', 'medium', 'Part of the Surry Hills Heritage Conservation Area.'),
    ('a0000000-0000-0000-0000-000000000005', 'heritage', 'medium', 'Part of the Surry Hills Heritage Conservation Area.'),

    -- Newtown risks
    ('a0000000-0000-0000-0000-000000000007', 'flood', 'medium', 'Moderate flood risk along King Street corridor near the Cooks River catchment.'),
    ('a0000000-0000-0000-0000-000000000007', 'heritage', 'low', 'Some Newtown streets have heritage character protections under Inner West Council LEP 2022.'),

    -- Pyrmont risks
    ('a0000000-0000-0000-0000-000000000010', 'heritage', 'medium', 'Portions of Pyrmont are heritage-listed (Ultimo/Pyrmont Heritage Study).'),
    ('a0000000-0000-0000-0000-000000000010', 'zoning', 'low', 'Mixed-use B4 zone. Nearby commercial activity along Harris Street may affect amenity.')
;
```

### 4.5 Buyer Brief (Sarah & Tom)

```sql
INSERT INTO buyer_briefs (id, agent_id, client_id, client_name, status, budget_min, budget_max, property_types, preferred_suburbs, min_bedrooms, min_bathrooms, must_haves, deal_breakers, parking, finance_status) VALUES
    ('b0000000-0000-0000-0000-000000000001',
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     'Sarah Chen', 'active',
     800000, 1100000,
     '["apartment"]',
     '["Surry Hills","Newtown","Pyrmont","Redfern"]',
     2, 1,
     '["natural_light","walk_to_transport","internal_laundry"]',
     '["ground_floor","no_balcony","main_road"]',
     'nice_to_have',
     'pre_approved');
```

### 4.6 Match Scores (brief-001 vs all 5 properties)

```sql
INSERT INTO match_scores (brief_id, property_id, match_score, match_reasons, budget_match, suburb_match, type_match, features_match) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 89,
     '{"budget_fit":{"score":95,"detail":"Within budget range $800K-$1.1M ($950K listing)"},"suburb_match":{"score":100,"detail":"Surry Hills is a preferred suburb"},"property_type_match":{"score":100,"detail":"Apartment matches preference"},"must_haves_pass":true,"deal_breakers_triggered":[]}',
     95, 100, 100, 65),  -- 42 Union St, Surry Hills
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 45,
     '{"budget_fit":{"score":90,"detail":"Within budget at $875K listing"},"suburb_match":{"score":100,"detail":"Surry Hills is a preferred suburb"},"property_type_match":{"score":100,"detail":"Apartment matches preference"},"must_haves_pass":false,"deal_breakers_triggered":["ground_floor"]}',
     90, 100, 100, 10),  -- 18A Hutchinson St (ground floor = deal-breaker)
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 76,
     '{"budget_fit":{"score":95,"detail":"Within budget at $985K listing"},"suburb_match":{"score":100,"detail":"Surry Hills is a preferred suburb"},"property_type_match":{"score":100,"detail":"Apartment matches preference"},"must_haves_pass":true,"deal_breakers_triggered":[]}',
     95, 100, 100, 50),  -- 7/245 Devonshire St
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 72,
     '{"budget_fit":{"score":90,"detail":"At $820K, good value within range"},"suburb_match":{"score":100,"detail":"Newtown is a preferred suburb"},"property_type_match":{"score":100,"detail":"Apartment matches preference"},"must_haves_pass":true,"deal_breakers_triggered":[]}',
     90, 100, 100, 50),  -- 34 King St, Newtown
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 82,
     '{"budget_fit":{"score":80,"detail":"At ceiling of budget ($1.05M)"},"suburb_match":{"score":100,"detail":"Pyrmont is a preferred suburb"},"property_type_match":{"score":100,"detail":"Apartment matches preference"},"must_haves_pass":true,"deal_breakers_triggered":[]}',
     80, 100, 100, 60);  -- 12/88 Harris St, Pyrmont
```

**Additional briefs** (Brief 2 — Upgrading Family, Brief 3 — First-Home Investor) follow the same pattern with their own scoring. See full `seed.sql` for all 75 match rows.

---

## 5. Supabase-Specific Notes

### 5.1 Auto-creating profiles on signup

Supabase Auth manages `auth.users` automatically. Create a trigger so every new auth user gets a profile row:

```sql
CREATE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name, email)
    VALUES (NEW.id, 'client', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5.2 Running the Schema

1. **Option A (recommended for hackathon):** Paste each `CREATE TABLE` / `CREATE POLICY` / `INSERT` block into the Supabase SQL Editor (`https://app.supabase.com/project/<ref>/sql`). Run in order: tables first, then RLS policies, then indexes, then seed INSERTs.
2. **Option B (migrations):** Save as migration files in `supabase/migrations/` and run `supabase db push`.

### 5.3 Auth Setup

- Create two users in the Supabase dashboard: `agent@demo.com` and `sarah@demo.com`.
- Note their UUIDs from `auth.users` and replace the placeholder UUIDs in the seed INSERTs above.
- A simpler alternative for the demo: use the Supabase client SDK's `signUp()` in the app startup to create both users programmatically, letting the trigger handle profile creation.

### 5.4 Free Tier Limits

Supabase free tier includes 500 MB of database and 2 GB of bandwidth — more than sufficient for 25 properties, 75 CMA records, and a weekend of demo traffic.

---

*Version: 1.1 | Last Updated: 2026-05-23*

**Revision 1.1** — Adversarial review fixes: added `main_image_url`, `client_name`, `status`, `parking`, `updated_at` to buyer_briefs; added `match_reasons` JSONB and renamed `score` → `match_score` in match_scores; added `created_at` to cma_records; tightened RLS shortlist policies to check agent role.
