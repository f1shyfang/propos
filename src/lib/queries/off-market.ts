import { fetchJson } from '@/lib/api/fetch-json';

export type OffMarketProperty = {
  id: number;
  address: string;
  suburb: string;
  state: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sourceType: string;
  accessStatus: string;
  vendorMotivation: string;
  sellingAgentName: string | null;
  sellingAgentPhone: string | null;
  howSourced: string | null;
  internalNotes: string | null;
  confidential: boolean;
  lastContactedAt: string | null;
  createdAt: string;
  expectedListingDate: string | null;
  images?: string[] | null;
};

export function fetchOffMarketProperties() {
  return fetchJson<{ properties: OffMarketProperty[] }>('/api/off-market');
}

export function touchOffMarketContact(id: number) {
  return fetchJson(`/api/off-market/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ touchLastContacted: true }),
  });
}

export function deleteOffMarketProperty(id: number) {
  return fetchJson(`/api/off-market/${id}`, { method: 'DELETE' });
}

export function createOffMarketProperty(data: Record<string, unknown>) {
  return fetchJson('/api/off-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
