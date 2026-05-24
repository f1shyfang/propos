-- Propos hackathon MVP schema.
-- Run in Supabase SQL editor before loading seed data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('agent', 'client')),
  full_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE TABLE IF NOT EXISTS buyer_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID REFERENCES profiles(id),
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','fulfilled','archived')),
  budget_min INTEGER NOT NULL CHECK (budget_min > 0),
  budget_max INTEGER NOT NULL CHECK (budget_max >= budget_min),
  property_types JSONB NOT NULL DEFAULT '[]',
  preferred_suburbs JSONB NOT NULL DEFAULT '[]',
  min_bedrooms SMALLINT NOT NULL DEFAULT 1,
  min_bathrooms SMALLINT NOT NULL DEFAULT 1,
  parking TEXT NOT NULL DEFAULT 'nice_to_have' CHECK (parking IN ('required','nice_to_have','not_needed')),
  must_haves JSONB NOT NULL DEFAULT '[]',
  deal_breakers JSONB NOT NULL DEFAULT '[]',
  finance_status TEXT DEFAULT 'not_started' CHECK (finance_status IN ('not_started','pre_approved','approved','cash')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('VIC','NSW','QLD','WA','SA','TAS','ACT','NT')),
  postcode TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('house','townhouse','apartment','unit','villa','duplex','land')),
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  car_spaces SMALLINT,
  land_size_sqm NUMERIC(10,1),
  floor_area_sqm NUMERIC(10,1),
  main_image_url TEXT,
  listing_price INTEGER,
  listing_price_text TEXT,
  listing_source TEXT NOT NULL DEFAULT 'manual',
  listing_url TEXT,
  listed_date DATE,
  raw_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cma_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  comparable_address TEXT NOT NULL,
  sale_price INTEGER,
  sale_date DATE,
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  property_type TEXT,
  land_size_sqm NUMERIC(10,1),
  price_per_sqm NUMERIC(10,1),
  distance_km NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('flood','bushfire','heritage','zoning')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES buyer_briefs(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reasons JSONB NOT NULL DEFAULT '{}',
  budget_match INTEGER CHECK (budget_match BETWEEN 0 AND 100),
  suburb_match INTEGER CHECK (suburb_match BETWEEN 0 AND 100),
  type_match INTEGER CHECK (type_match BETWEEN 0 AND 100),
  features_match INTEGER CHECK (features_match BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brief_id, property_id)
);

CREATE TABLE IF NOT EXISTS shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_brief_id UUID NOT NULL REFERENCES buyer_briefs(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  agent_note TEXT,
  shared_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  feedback_status TEXT CHECK (feedback_status IN ('interested','need_more_info','not_for_me')),
  feedback_text TEXT,
  feedback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_brief_id, property_id)
);

CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cma_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Agents read demo profiles" ON profiles;
CREATE POLICY "Agents read demo profiles" ON profiles FOR SELECT TO authenticated USING (public.current_profile_role() = 'agent');

DROP POLICY IF EXISTS "Agents manage own briefs" ON buyer_briefs;
CREATE POLICY "Agents manage own briefs" ON buyer_briefs FOR ALL TO authenticated USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS "Clients read own briefs" ON buyer_briefs;
CREATE POLICY "Clients read own briefs" ON buyer_briefs FOR SELECT TO authenticated USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Agents read properties" ON properties;
CREATE POLICY "Agents read properties" ON properties FOR SELECT TO authenticated USING (public.current_profile_role() = 'agent');

DROP POLICY IF EXISTS "Clients read shared properties" ON properties;
CREATE POLICY "Clients read shared properties" ON properties FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM shortlists s WHERE s.property_id = properties.id AND s.client_id = auth.uid() AND s.shared_at IS NOT NULL)
);

DROP POLICY IF EXISTS "Agents read cma" ON cma_records;
CREATE POLICY "Agents read cma" ON cma_records FOR SELECT TO authenticated USING (public.current_profile_role() = 'agent');

DROP POLICY IF EXISTS "Clients read shared cma" ON cma_records;
CREATE POLICY "Clients read shared cma" ON cma_records FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM shortlists s WHERE s.property_id = cma_records.property_id AND s.client_id = auth.uid() AND s.shared_at IS NOT NULL)
);

DROP POLICY IF EXISTS "Agents read risks" ON risk_overlays;
CREATE POLICY "Agents read risks" ON risk_overlays FOR SELECT TO authenticated USING (public.current_profile_role() = 'agent');

DROP POLICY IF EXISTS "Clients read shared risks" ON risk_overlays;
CREATE POLICY "Clients read shared risks" ON risk_overlays FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM shortlists s WHERE s.property_id = risk_overlays.property_id AND s.client_id = auth.uid() AND s.shared_at IS NOT NULL)
);

DROP POLICY IF EXISTS "Agents read own match scores" ON match_scores;
CREATE POLICY "Agents read own match scores" ON match_scores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM buyer_briefs b WHERE b.id = match_scores.brief_id AND b.agent_id = auth.uid())
);

DROP POLICY IF EXISTS "Agents manage shortlist rows for own briefs" ON shortlists;
CREATE POLICY "Agents manage shortlist rows for own briefs" ON shortlists FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM buyer_briefs b WHERE b.id = shortlists.buyer_brief_id AND b.agent_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM buyer_briefs b WHERE b.id = shortlists.buyer_brief_id AND b.agent_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients read shared shortlist rows" ON shortlists;
CREATE POLICY "Clients read shared shortlist rows" ON shortlists FOR SELECT TO authenticated USING (client_id = auth.uid() AND shared_at IS NOT NULL);

DROP POLICY IF EXISTS "Users insert own actions" ON user_actions;
CREATE POLICY "Users insert own actions" ON user_actions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
