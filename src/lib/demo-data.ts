export type Role = "agent" | "client";
export type FeedbackStatus = "interested" | "need_more_info" | "not_for_me";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
};

export type BuyerBrief = {
  id: string;
  agent_id: string;
  client_id: string;
  client_name: string;
  status: "draft" | "active" | "paused" | "fulfilled" | "archived";
  budget_min: number;
  budget_max: number;
  property_types: string[];
  preferred_suburbs: string[];
  min_bedrooms: number;
  min_bathrooms: number;
  parking: "required" | "nice_to_have" | "not_needed";
  must_haves: string[];
  deal_breakers: string[];
  finance_status: "not_started" | "pre_approved" | "approved" | "cash";
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  canonical_address: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  car_spaces: number;
  land_size_sqm: number | null;
  floor_area_sqm: number | null;
  main_image_url: string | null;
  listing_price: number;
  listing_price_text: string;
  listing_source: string;
  listing_url: string;
  listed_date: string;
  raw_data: {
    description: string;
    features: string[];
    days_on_market: number;
  };
};

export type CMARecord = {
  id: string;
  property_id: string;
  comparable_address: string;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  land_size_sqm: number | null;
  price_per_sqm: number | null;
  distance_km: number;
  notes: string;
};

export type RiskOverlay = {
  id: string;
  property_id: string;
  risk_type: "flood" | "bushfire" | "heritage" | "zoning";
  risk_level: "low" | "medium" | "high";
  description: string;
};

export type MatchScore = {
  id: string;
  brief_id: string;
  property_id: string;
  match_score: number;
  match_reasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
  budget_match: number;
  suburb_match: number;
  type_match: number;
  features_match: number;
  created_at: string;
};

export type Shortlist = {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  client_id: string;
  agent_note: string | null;
  shared_at: string | null;
  viewed_at: string | null;
  feedback_status: FeedbackStatus | null;
  feedback_text: string | null;
  feedback_at: string | null;
  created_at: string;
};

export type UserAction = {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

const now = "2026-05-24T00:00:00.000Z";

export const demoProfiles: Profile[] = [
  { id: "profile-agent", role: "agent", full_name: "Jess Morgan", email: "agent@demo.com" },
  { id: "profile-sarah", role: "client", full_name: "Sarah Chen", email: "sarah@demo.com" },
];

export const demoBriefs: BuyerBrief[] = [
  {
    id: "brief-sarah",
    agent_id: "profile-agent",
    client_id: "profile-sarah",
    client_name: "Sarah Chen & Tom Williams",
    status: "active",
    budget_min: 800000,
    budget_max: 1100000,
    property_types: ["apartment", "unit"],
    preferred_suburbs: ["Surry Hills", "Newtown", "Pyrmont", "Redfern"],
    min_bedrooms: 2,
    min_bathrooms: 1,
    parking: "nice_to_have",
    must_haves: ["natural light", "public transport", "internal laundry"],
    deal_breakers: ["ground floor", "main road", "no balcony"],
    finance_status: "pre_approved",
    created_at: "2026-05-20T09:00:00.000Z",
    updated_at: now,
  },
  {
    id: "brief-family",
    agent_id: "profile-agent",
    client_id: "profile-sarah",
    client_name: "James & Priya Fernando",
    status: "active",
    budget_min: 1600000,
    budget_max: 2400000,
    property_types: ["house", "townhouse"],
    preferred_suburbs: ["Randwick", "Lane Cove", "Marrickville", "Dulwich Hill"],
    min_bedrooms: 3,
    min_bathrooms: 2,
    parking: "required",
    must_haves: ["backyard", "quiet street", "school"],
    deal_breakers: ["main road", "heritage restrictions"],
    finance_status: "approved",
    created_at: "2026-05-18T10:30:00.000Z",
    updated_at: now,
  },
  {
    id: "brief-investor",
    agent_id: "profile-agent",
    client_id: "profile-sarah",
    client_name: "Michael Tran",
    status: "active",
    budget_min: 550000,
    budget_max: 800000,
    property_types: ["apartment", "townhouse"],
    preferred_suburbs: ["Parramatta", "Homebush", "Ryde", "Canterbury"],
    min_bedrooms: 1,
    min_bathrooms: 1,
    parking: "required",
    must_haves: ["rental yield", "transport"],
    deal_breakers: ["cladding", "high strata"],
    finance_status: "cash",
    created_at: "2026-05-17T14:10:00.000Z",
    updated_at: now,
  },
];

const propertySeeds = [
  ["prop-001", "42 Union Street, Surry Hills NSW 2010", "Surry Hills", "2010", "apartment", 2, 1, 1, 78, 950000, "North-facing balcony, timber floors, internal laundry, two minutes to light rail.", ["balcony", "natural light", "internal laundry", "public transport"], 7],
  ["prop-002", "18 Hutchinson Street, Surry Hills NSW 2010", "Surry Hills", "2010", "apartment", 2, 1, 0, 72, 890000, "Quiet Art Deco apartment with updated kitchen and leafy outlook.", ["natural light", "character", "public transport"], 12],
  ["prop-003", "7/245 Devonshire Street, Surry Hills NSW 2010", "Surry Hills", "2010", "apartment", 2, 1, 1, 81, 1035000, "Renovated warehouse conversion with secure parking and storage.", ["parking", "internal laundry", "public transport"], 14],
  ["prop-004", "12 Wilson Street, Newtown NSW 2042", "Newtown", "2042", "apartment", 2, 1, 0, 75, 875000, "Top-floor apartment close to King Street dining and station.", ["natural light", "balcony", "public transport"], 9],
  ["prop-005", "5 Angel Lane, Newtown NSW 2042", "Newtown", "2042", "townhouse", 2, 2, 1, 94, 1080000, "Compact townhouse with courtyard and flexible study nook.", ["courtyard", "parking", "internal laundry"], 18],
  ["prop-006", "81 Harris Street, Pyrmont NSW 2009", "Pyrmont", "2009", "apartment", 2, 2, 1, 88, 1075000, "Harbour-edge apartment with lift access and secure parking.", ["parking", "water views", "internal laundry"], 21],
  ["prop-007", "20 Redfern Street, Redfern NSW 2016", "Redfern", "2016", "apartment", 2, 1, 0, 70, 840000, "Bright apartment above cafe strip, walk to Redfern station.", ["natural light", "public transport"], 6],
  ["prop-008", "31 Young Street, Randwick NSW 2031", "Randwick", "2031", "house", 3, 2, 2, 420, 2050000, "Family home on quiet street near schools and Centennial Park.", ["backyard", "school", "quiet street", "parking"], 11],
  ["prop-009", "66 Clovelly Road, Randwick NSW 2031", "Randwick", "2031", "house", 4, 2, 1, 360, 2320000, "Renovated semi with north-facing garden and DA potential.", ["backyard", "natural light", "school"], 25],
  ["prop-010", "14 Epping Road, Lane Cove NSW 2066", "Lane Cove", "2066", "house", 3, 2, 2, 520, 2180000, "Leafy family home with generous yard and lock-up garage.", ["backyard", "parking", "quiet street"], 16],
  ["prop-011", "3 River Road, Lane Cove NSW 2066", "Lane Cove", "2066", "townhouse", 3, 2, 2, 180, 1680000, "Low-maintenance townhouse in boutique complex.", ["parking", "school", "courtyard"], 8],
  ["prop-012", "91 Illawarra Road, Marrickville NSW 2204", "Marrickville", "2204", "house", 3, 1, 1, 310, 1720000, "Character house with scope to renovate near cafes.", ["backyard", "public transport"], 30],
  ["prop-013", "24 Dulwich Street, Dulwich Hill NSW 2203", "Dulwich Hill", "2203", "house", 3, 2, 1, 335, 1810000, "Freestanding home close to light rail and parks.", ["backyard", "quiet street", "public transport"], 19],
  ["prop-014", "8 Military Road, Mosman NSW 2088", "Mosman", "2088", "house", 4, 3, 2, 510, 3450000, "Elevated family residence with water glimpses.", ["parking", "water views", "backyard"], 22],
  ["prop-015", "11 Raglan Street, Mosman NSW 2088", "Mosman", "2088", "apartment", 2, 1, 1, 86, 1250000, "Village apartment with balcony and level lift access.", ["balcony", "parking", "natural light"], 10],
  ["prop-016", "33 Oxford Street, Paddington NSW 2021", "Paddington", "2021", "house", 3, 2, 1, 145, 2520000, "Classic terrace with rear-lane parking.", ["character", "parking", "courtyard"], 17],
  ["prop-017", "9 Glenmore Road, Paddington NSW 2021", "Paddington", "2021", "house", 3, 2, 0, 130, 2360000, "Designer terrace near Five Ways and cafes.", ["character", "public transport"], 27],
  ["prop-018", "71 The Corso, Manly NSW 2095", "Manly", "2095", "apartment", 2, 2, 1, 93, 1490000, "Beachside apartment with parking and ocean breezes.", ["parking", "balcony", "natural light"], 13],
  ["prop-019", "4 North Steyne, Manly NSW 2095", "Manly", "2095", "house", 4, 3, 2, 405, 3950000, "Premium beach house with north-facing entertaining deck.", ["backyard", "parking", "natural light"], 34],
  ["prop-020", "12 George Street, Parramatta NSW 2150", "Parramatta", "2150", "apartment", 2, 2, 1, 84, 740000, "Modern apartment near CBD, rail and light rail.", ["parking", "public transport", "rental yield"], 5],
  ["prop-021", "50 Church Street, Parramatta NSW 2150", "Parramatta", "2150", "apartment", 1, 1, 1, 58, 590000, "Investor-grade one bedroom with strong rental history.", ["parking", "rental yield", "public transport"], 15],
  ["prop-022", "18 Loftus Crescent, Homebush NSW 2140", "Homebush", "2140", "apartment", 2, 2, 1, 79, 720000, "Near station and Olympic Park, low-maintenance building.", ["parking", "public transport", "rental yield"], 20],
  ["prop-023", "29 Blaxland Road, Ryde NSW 2112", "Ryde", "2112", "townhouse", 2, 2, 1, 115, 790000, "Townhouse with courtyard and bus links.", ["parking", "courtyard", "rental yield"], 24],
  ["prop-024", "6 Canterbury Road, Canterbury NSW 2193", "Canterbury", "2193", "apartment", 2, 1, 1, 73, 650000, "Entry-level apartment with station access.", ["parking", "public transport"], 28],
  ["prop-025", "91 Railway Parade, Liverpool NSW 2170", "Liverpool", "2170", "apartment", 2, 1, 1, 76, 610000, "Affordable apartment near shops and transport.", ["parking", "public transport", "rental yield"], 32],
] as const;

export const demoProperties: Property[] = propertySeeds.map((seed, index) => {
  const [id, address, suburb, postcode, type, beds, baths, cars, floor, price, description, features, days] = seed;
  return {
    id,
    canonical_address: address,
    suburb,
    state: "NSW",
    postcode,
    property_type: type,
    bedrooms: beds,
    bathrooms: baths,
    car_spaces: cars,
    land_size_sqm: type === "house" || type === "townhouse" ? Math.max(120, floor * 3) : null,
    floor_area_sqm: floor,
    main_image_url: null,
    listing_price: price,
    listing_price_text: formatCurrency(price),
    listing_source: "manual",
    listing_url: `https://demo.example.com/listings/${id}`,
    listed_date: `2026-05-${String((index % 20) + 1).padStart(2, "0")}`,
    raw_data: { description, features: [...features], days_on_market: days },
  };
});

export const demoCMARecords: CMARecord[] = demoProperties.flatMap((property, propertyIndex) => {
  const base = property.listing_price;
  return [0.94, 0.99, 1.04].map((multiplier, index) => ({
    id: `cma-${property.id}-${index + 1}`,
    property_id: property.id,
    comparable_address: `${18 + index * 7} ${["Hutchinson", "Devonshire", "Bourke"][index]} Street, ${property.suburb} NSW ${property.postcode}`,
    sale_price: Math.round(base * multiplier),
    sale_date: `2026-0${(index % 3) + 2}-${String(10 + propertyIndex + index).padStart(2, "0")}`,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    property_type: property.property_type,
    land_size_sqm: property.land_size_sqm,
    price_per_sqm: property.floor_area_sqm ? Math.round((base * multiplier) / property.floor_area_sqm) : null,
    distance_km: Number((0.3 + index * 0.4).toFixed(1)),
    notes: index === 0 ? "Similar condition" : index === 1 ? "Recent sale with comparable fitout" : "Superior aspect or parking",
  }));
});

export const demoRisks: RiskOverlay[] = demoProperties.flatMap((property, index) => {
  const risks: RiskOverlay[] = [];
  if (["Surry Hills", "Paddington", "Newtown"].includes(property.suburb)) {
    risks.push({
      id: `risk-${property.id}-heritage`,
      property_id: property.id,
      risk_type: "heritage",
      risk_level: property.suburb === "Paddington" ? "high" : "medium",
      description: "Potential heritage controls apply. Confirm address-specific constraints before renovations.",
    });
  }
  if (["Marrickville", "Parramatta", "Canterbury"].includes(property.suburb)) {
    risks.push({
      id: `risk-${property.id}-flood`,
      property_id: property.id,
      risk_type: "flood",
      risk_level: "medium",
      description: "Suburb contains pockets of overland flow risk. Review council flood certificate.",
    });
  }
  if (["Mosman", "Manly"].includes(property.suburb)) {
    risks.push({
      id: `risk-${property.id}-bushfire`,
      property_id: property.id,
      risk_type: "bushfire",
      risk_level: "low",
      description: "Low bushfire exposure in fringe pockets; standard due diligence recommended.",
    });
  }
  if (index % 5 === 0) {
    risks.push({
      id: `risk-${property.id}-zoning`,
      property_id: property.id,
      risk_type: "zoning",
      risk_level: "low",
      description: "Residential zoning appears consistent with current use.",
    });
  }
  return risks;
});

export let demoShortlists: Shortlist[] = [
  {
    id: "shortlist-001",
    buyer_brief_id: "brief-sarah",
    property_id: "prop-001",
    client_id: "profile-sarah",
    agent_note: "Best fit for your lifestyle brief: balcony, light and transport access.",
    shared_at: "2026-05-24T01:00:00.000Z",
    viewed_at: null,
    feedback_status: null,
    feedback_text: null,
    feedback_at: null,
    created_at: "2026-05-24T00:40:00.000Z",
  },
  {
    id: "shortlist-002",
    buyer_brief_id: "brief-sarah",
    property_id: "prop-004",
    client_id: "profile-sarah",
    agent_note: "Strong Newtown option if you are flexible on parking.",
    shared_at: "2026-05-24T01:02:00.000Z",
    viewed_at: null,
    feedback_status: null,
    feedback_text: null,
    feedback_at: null,
    created_at: "2026-05-24T00:41:00.000Z",
  },
  {
    id: "shortlist-003",
    buyer_brief_id: "brief-sarah",
    property_id: "prop-006",
    client_id: "profile-sarah",
    agent_note: "Top of budget, but parking and second bathroom make it worth reviewing.",
    shared_at: "2026-05-24T01:04:00.000Z",
    viewed_at: null,
    feedback_status: null,
    feedback_text: null,
    feedback_at: null,
    created_at: "2026-05-24T00:42:00.000Z",
  },
];

export let demoUserActions: UserAction[] = [];

export function formatCurrency(value: number | null): string {
  if (!value) return "POA";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function computeDemoMatch(property: Property, brief: BuyerBrief): MatchScore {
  const budgetMid = (brief.budget_min + brief.budget_max) / 2;
  const budgetDistance = Math.abs(property.listing_price - budgetMid) / Math.max(brief.budget_max - brief.budget_min, 1);
  const budgetScore = property.listing_price >= brief.budget_min && property.listing_price <= brief.budget_max
    ? Math.max(72, Math.round(100 - budgetDistance * 24))
    : Math.max(20, Math.round(70 - budgetDistance * 40));
  const suburbScore = brief.preferred_suburbs.includes(property.suburb) ? 100 : 45;
  const typeScore = brief.property_types.includes(property.property_type) ||
    (brief.property_types.includes("apartment") && property.property_type === "unit") ? 100 : 35;
  const bedroomScore = property.bedrooms >= brief.min_bedrooms ? 100 : 30;
  const bathroomScore = property.bathrooms >= brief.min_bathrooms ? 100 : 55;
  const featureHits = brief.must_haves.filter((need) =>
    property.raw_data.features.some((feature) => feature.toLowerCase().includes(need.split(" ")[0].toLowerCase()))
  );
  const featureScore = Math.min(100, 55 + featureHits.length * 15);
  const score = Math.max(1, Math.min(100, Math.round(
    budgetScore * 0.3 + suburbScore * 0.22 + typeScore * 0.18 + bedroomScore * 0.12 + bathroomScore * 0.08 + featureScore * 0.1
  )));

  return {
    id: `match-${brief.id}-${property.id}`,
    brief_id: brief.id,
    property_id: property.id,
    match_score: score,
    match_reasons: {
      budget_fit: { score: budgetScore, detail: property.listing_price <= brief.budget_max ? "Inside or close to target budget" : "Above target budget" },
      suburb_match: { score: suburbScore, detail: brief.preferred_suburbs.includes(property.suburb) ? "Preferred suburb" : "Outside preferred suburbs" },
      property_type_match: { score: typeScore, detail: brief.property_types.includes(property.property_type) ? "Preferred property type" : "Different property type" },
      must_haves_pass: featureHits.length >= Math.min(2, brief.must_haves.length),
      deal_breakers_triggered: [],
    },
    budget_match: budgetScore,
    suburb_match: suburbScore,
    type_match: typeScore,
    features_match: featureScore,
    created_at: now,
  };
}

export function getMatchScores(briefId?: string): MatchScore[] {
  const briefs = briefId ? demoBriefs.filter((brief) => brief.id === briefId) : demoBriefs;
  return briefs.flatMap((brief) => demoProperties.map((property) => computeDemoMatch(property, brief)));
}

export function getPropertySummary(property: Property) {
  return {
    id: property.id,
    canonical_address: property.canonical_address,
    suburb: property.suburb,
    state: property.state,
    postcode: property.postcode,
    property_type: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    car_spaces: property.car_spaces,
    listing_price: property.listing_price,
    listing_price_text: property.listing_price_text,
    main_image_url: property.main_image_url,
    listed_date: property.listed_date,
    land_size_sqm: property.land_size_sqm,
  };
}

export function getShortlistItem(shortlist: Shortlist) {
  const property = demoProperties.find((item) => item.id === shortlist.property_id);
  return {
    id: shortlist.id,
    buyer_brief_id: shortlist.buyer_brief_id,
    property_id: shortlist.property_id,
    property: property ? getPropertySummary(property) : null,
    agent_note: shortlist.agent_note,
    shared_at: shortlist.shared_at,
    viewed_at: shortlist.viewed_at,
    feedback_status: shortlist.feedback_status,
    feedback_text: shortlist.feedback_text,
    feedback_at: shortlist.feedback_at,
    created_at: shortlist.created_at,
  };
}

export function logDemoAction(action: Omit<UserAction, "id" | "created_at">) {
  demoUserActions = [
    {
      ...action,
      id: `action-${demoUserActions.length + 1}`,
      created_at: new Date().toISOString(),
    },
    ...demoUserActions,
  ];
}

export function resetDemoState() {
  demoShortlists = demoShortlists.map((item) => ({
    ...item,
    viewed_at: null,
    feedback_status: null,
    feedback_text: null,
    feedback_at: null,
  }));
  demoUserActions = [];
}
