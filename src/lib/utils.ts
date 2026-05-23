export function scoreToMatchPct(overall: number | null): number {
  if (overall == null) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

export function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price || price === 0) return 'POA';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}
