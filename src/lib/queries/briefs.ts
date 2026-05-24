import { fetchJson } from '@/lib/api/fetch-json';

export type BriefListItem = {
  id: number;
  clientName: string;
};

export type BriefMatchItem = {
  id: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  price: string;
};

export function fetchBriefs() {
  return fetchJson<{ briefs: BriefListItem[] }>('/api/briefs');
}

export function fetchBriefMatchesAll(briefId: number | string) {
  return fetchJson<{ matches: BriefMatchItem[] }>(
    `/api/briefs/${briefId}/matches?all=1`,
  );
}
