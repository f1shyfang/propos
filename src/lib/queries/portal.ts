import { fetchJson } from '@/lib/api/fetch-json';

export type PortalShortlistItem = {
  shortlistId: number;
  briefId: number | null;
  agentNote: string | null;
  feedbackStatus: string;
  feedbackText: string | null;
  feedbackReason: string | null;
  property: {
    id: string;
    address: string;
    suburb: string | null;
    state: string | null;
    price: string;
    propertyType: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parkingSpaces: number | null;
    score: number;
  } | null;
};

export type PortalShortlistsResponse = {
  items: PortalShortlistItem[];
  groups?: unknown[];
};

export type MeResponse = {
  name?: string | null;
  email?: string | null;
};

export function fetchPortalShortlists() {
  return fetchJson<PortalShortlistsResponse>('/api/portal/shortlists');
}

export function fetchMe() {
  return fetchJson<MeResponse>('/api/me');
}
