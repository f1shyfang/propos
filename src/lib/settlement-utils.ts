export function calcSettlementDaysRemaining(settlementDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(settlementDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Business days cooling-off by state. 0 = no cooling off.
const COOLING_OFF_BUSINESS_DAYS: Record<string, number> = {
  NSW: 5, VIC: 3, QLD: 5, SA: 2, ACT: 5, NT: 4, WA: 0, TAS: 0,
};

function addBusinessDays(start: Date, days: number): Date {
  const date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip weekends
  }
  return date;
}

export function calcCoolingOffExpiry(exchangeDate: Date, state: string, isAuction = false): Date {
  if (isAuction) return new Date(exchangeDate);
  const bDays = COOLING_OFF_BUSINESS_DAYS[state] ?? 0;
  if (bDays === 0) return new Date(exchangeDate);
  return addBusinessDays(exchangeDate, bDays);
}

// Simplified stamp duty calculation (approximate, OO vs investor varies by state)
export function calcStampDuty(price: number, state: string, isInvestor: boolean): number {
  if (!price) return 0;

  // NSW stamp duty brackets (2026 approximate)
  if (state === 'NSW') {
    if (price <= 17000) return Math.round(price * 0.014);
    if (price <= 36000) return Math.round(238 + (price - 17000) * 0.035);
    if (price <= 97000) return Math.round(903 + (price - 36000) * 0.045);
    if (price <= 364000) return Math.round(3648 + (price - 97000) * 0.0525);
    if (price <= 1087000) return Math.round(17663 + (price - 364000) * 0.07);
    if (price <= 3268000) return Math.round(68323 + (price - 1087000) * 0.045);
    return Math.round(166343 + (price - 3268000) * 0.07);
  }

  // VIC (simplified)
  if (state === 'VIC') {
    if (price <= 25000) return Math.round(price * 0.014);
    if (price <= 130000) return Math.round(350 + (price - 25000) * 0.024);
    if (price <= 960000) return Math.round(2870 + (price - 130000) * 0.06);
    return Math.round(55870 + (price - 960000) * 0.055);
  }

  // QLD (simplified)
  if (state === 'QLD') {
    if (price <= 350000) return Math.round(price * 0.01 + 1050);
    if (price <= 540000) return Math.round(3500 + (price - 350000) * 0.035);
    return Math.round(10150 + (price - 540000) * 0.0575);
  }

  // Other states: approximate 4% flat
  return Math.round(price * 0.04);
}
