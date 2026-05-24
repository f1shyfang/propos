export const BRIEF_STEPS = [
  'Client Info',
  'Budget & Finance',
  'Property Requirements',
  'Location',
  'Must-Haves',
  'Strategy',
] as const;

export const PROPERTY_TYPES = [
  'House',
  'Apartment',
  'Townhouse',
  'Villa Unit',
  'Duplex',
  'Acreage',
  'Vacant Land',
] as const;

export const MUST_HAVE_OPTIONS = [
  { id: 'natural_light', label: 'Natural light' },
  { id: 'near_transport', label: 'Near public transport' },
  { id: 'internal_laundry', label: 'Internal laundry' },
  { id: 'garage', label: 'Garage / off-street parking' },
  { id: 'north_facing', label: 'North-facing aspect' },
  { id: 'backyard', label: 'Backyard / outdoor area' },
  { id: 'school_zone', label: 'School catchment zone' },
  { id: 'granny_flat', label: 'Granny flat potential' },
] as const;

export const DEAL_BREAKER_OPTIONS = [
  { id: 'ground_floor', label: 'Ground floor' },
  { id: 'main_road', label: 'Main road frontage' },
  { id: 'no_balcony', label: 'No balcony (apartment)' },
  { id: 'cladding', label: 'Cladding issues' },
  { id: 'high_strata', label: 'High strata fees' },
  { id: 'west_facing', label: 'West-facing living areas' },
] as const;

export const SYDNEY_SUBURBS = [
  'Surry Hills', 'Newtown', 'Pyrmont', 'Redfern', 'Darlinghurst',
  'Paddington', 'Glebe', 'Rozelle', 'Marrickville', 'Randwick',
  'Lane Cove', 'Mosman', 'Manly', 'Parramatta', 'Homebush',
  'Ryde', 'Canterbury', 'Liverpool', 'Dulwich Hill', 'Caulfield',
  'Hawthorn', 'Richmond', 'Fitzroy', 'Collingwood', 'South Yarra',
] as const;

export const CONTACT_METHODS = ['email', 'phone', 'sms'] as const;
export const ENGAGEMENT_TYPES = ['full-service', 'sourcing-only', 'negotiation-only'] as const;
export const PRE_APPROVAL_STATUSES = ['Not Started', 'In Progress', 'Pre-Approved', 'Formal Approval', 'Expired'] as const;
export const BUYER_TYPES = ['owner-occupier', 'investor', 'first-home buyer', 'upsizer', 'downsizer'] as const;
export const PARKING_OPTIONS = ['required', 'nice_to_have', 'not_needed'] as const;
export const URGENCY_OPTIONS = ['Immediate', '3 months', '6 months', '12 months', 'No fixed timeline'] as const;
export const PURCHASE_PURPOSES = ['PPOR', 'Investment', 'SMSF', 'Rentvesting'] as const;

export const MUST_HAVE_IDS = MUST_HAVE_OPTIONS.map((o) => o.id);
export const DEAL_BREAKER_IDS = DEAL_BREAKER_OPTIONS.map((o) => o.id);

export type BriefFormPayload = {
  clientName: string;
  email: string;
  phone: string;
  contactMethod: string;
  engagementType: string;
  preApprovalStatus: string;
  budgetMin: string;
  budgetMax: string;
  buyerType: string;
  propertyTypes: string[];
  minBeds: number;
  minBaths: number;
  parking: string;
  suburbs: string[];
  mustHaves: string[];
  dealBreakers: string[];
  urgency: string;
  purchasePurpose: string;
  auctionWillingness: boolean;
};

export const EMPTY_BRIEF_FORM: BriefFormPayload = {
  clientName: '',
  email: '',
  phone: '',
  contactMethod: 'email',
  engagementType: 'full-service',
  preApprovalStatus: 'Not Started',
  budgetMin: '',
  budgetMax: '',
  buyerType: 'owner-occupier',
  propertyTypes: [],
  minBeds: 2,
  minBaths: 1,
  parking: 'nice_to_have',
  suburbs: [],
  mustHaves: [],
  dealBreakers: [],
  urgency: '3 months',
  purchasePurpose: 'PPOR',
  auctionWillingness: true,
};
