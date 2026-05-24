/** Buyer's agency fee in AUD (default 1.5% of purchase price). */
export function calcBuyersAgentFee(
  listPrice: number | null,
  offerAmount?: number | null,
  ratePercent = 1.5,
): number {
  const base = offerAmount ?? listPrice;
  if (!base || base <= 0) return 0;
  return Math.round(base * (ratePercent / 100));
}
