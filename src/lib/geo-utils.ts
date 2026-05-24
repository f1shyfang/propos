/** Normalize lat/lng for AU properties (handles swapped coordinates). */
export function normalizePropertyCoords(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { lat: number; lng: number } | null {
  if (latitude == null || longitude == null) return null;
  const isSwapped = latitude > 0 && longitude < 0;
  const rawLat = isSwapped ? longitude : latitude;
  const rawLng = isSwapped ? latitude : longitude;
  if (rawLat < -45 || rawLat > -10) return null;
  return { lat: rawLat, lng: rawLng };
}

export const DEFAULT_MAP_CENTER: [number, number] = [-33.8891, 151.175];

export function centerFromPins(pins: { lat: number; lng: number }[]): [number, number] {
  if (pins.length === 0) return DEFAULT_MAP_CENTER;
  const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
  const lng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
  return [lat, lng];
}
