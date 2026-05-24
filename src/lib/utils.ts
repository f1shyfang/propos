export function scoreToMatchPct(overall: number | null): number {
  if (overall == null) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

export function formatPrice(price: number | null, display: string | null): string {
  if (display && display !== "null" && display !== "NULL" && display !== "NaN") return display;
  if (!price || price === 0) return 'POA';
  return `$${price.toLocaleString("en-AU")}`;
}
