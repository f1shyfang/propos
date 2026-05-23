export const DEAL_STATUSES = [
  'suggested', 'approved', 'due_diligence', 'offer_made',
  'under_contract', 'settled', 'lost', 'withdrawn',
] as const;

export const OFFER_SUB_STATES = [
  'draft', 'sent', 'negotiating', 'counter_offer', 'accepted', 'rejected',
] as const;

export type DealStatus = typeof DEAL_STATUSES[number];
export type OfferSubState = typeof OFFER_SUB_STATES[number];

const DEAL_STATUS_LABELS: Record<string, string> = {
  suggested: 'Client Suggested',
  approved: 'Client Approved',
  due_diligence: 'Due Diligence',
  offer_made: 'Offer Made',
  under_contract: 'Under Contract',
  settled: 'Settled',
  lost: 'Lost',
  withdrawn: 'Withdrawn',
};

export function getDealStatusLabel(status: string): string {
  return DEAL_STATUS_LABELS[status] ?? status;
}

export function getOfferSubStateLabel(state: string): string {
  return state.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export interface ChecklistItem {
  title: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dayOffset: number; // days from exchange to complete
}

const isStrata = (type: string) =>
  ['Apartment', 'Townhouse', 'Villa Unit', 'Duplex'].includes(type);

export function generateDueDiligenceChecklist(propertyType: string, state: string): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { title: 'Contract reviewed by solicitor/conveyancer', assignee: 'conveyancer', status: 'pending', dayOffset: 3 },
    { title: 'Building inspection booked', assignee: 'agent', status: 'pending', dayOffset: 2 },
    { title: 'Building inspection completed', assignee: 'inspector', status: 'pending', dayOffset: 5 },
    { title: 'Pest inspection completed', assignee: 'inspector', status: 'pending', dayOffset: 5 },
    { title: 'Finance formally approved', assignee: 'broker', status: 'pending', dayOffset: 10 },
    { title: 'Flood & zoning check completed', assignee: 'agent', status: 'pending', dayOffset: 7 },
  ];

  if (state === 'NSW') {
    items.push({ title: 'Section 10.7 zoning certificate obtained', assignee: 'conveyancer', status: 'pending', dayOffset: 7 });
    items.push({ title: 'Land tax clearance confirmed', assignee: 'conveyancer', status: 'pending', dayOffset: 10 });
  }

  if (state === 'VIC') {
    items.push({ title: 'Section 32 vendor statement reviewed', assignee: 'conveyancer', status: 'pending', dayOffset: 2 });
    if (isStrata(propertyType)) {
      items.push({ title: 'Owners corporation certificate reviewed', assignee: 'conveyancer', status: 'pending', dayOffset: 7 });
    }
  }

  if (isStrata(propertyType)) {
    items.push({ title: 'Strata report reviewed', assignee: 'agent', status: 'pending', dayOffset: 7 });
    items.push({ title: 'AGM minutes reviewed', assignee: 'agent', status: 'pending', dayOffset: 9 });
    items.push({ title: 'Special levies identified', assignee: 'conveyancer', status: 'pending', dayOffset: 9 });
  }

  return items.sort((a, b) => a.dayOffset - b.dayOffset);
}

export interface Milestone {
  title: string;
  dayOffset: number;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

export function generateSettlementMilestones(
  exchangeDate: Date,
  settlementDate: Date,
  state: string,
  isAuction: boolean,
): Milestone[] {
  const totalDays = Math.round((settlementDate.getTime() - exchangeDate.getTime()) / (1000 * 60 * 60 * 24));

  function dateAtOffset(offset: number): Date {
    const d = new Date(exchangeDate);
    d.setDate(d.getDate() + offset);
    return d;
  }

  const ms: Milestone[] = [
    { title: 'Contract Exchange / Signed', dayOffset: 0, dueDate: dateAtOffset(0), status: 'pending' },
  ];

  if (!isAuction) {
    const coolingDays: Record<string, number> = { NSW: 5, VIC: 3, QLD: 5, SA: 2, ACT: 5, NT: 4 };
    const cd = coolingDays[state];
    if (cd) {
      ms.push({ title: `Cooling-off expires (${state} — ${cd} business days)`, dayOffset: cd + 2, dueDate: dateAtOffset(cd + 2), status: 'pending' });
    }
  }

  ms.push({ title: 'Building & pest inspection booked', dayOffset: 2, dueDate: dateAtOffset(2), status: 'pending' });
  ms.push({ title: 'Conveyancer engaged', dayOffset: 3, dueDate: dateAtOffset(3), status: 'pending' });
  ms.push({ title: 'Building & pest inspection completed', dayOffset: 5, dueDate: dateAtOffset(5), status: 'pending' });
  ms.push({ title: 'Finance formally approved', dayOffset: 10, dueDate: dateAtOffset(10), status: 'pending' });
  ms.push({ title: 'Pre-settlement inspection booked', dayOffset: totalDays - 7, dueDate: dateAtOffset(totalDays - 7), status: 'pending' });
  ms.push({ title: 'Pre-settlement inspection completed', dayOffset: totalDays - 5, dueDate: dateAtOffset(totalDays - 5), status: 'pending' });
  ms.push({ title: 'Settlement — title transfers', dayOffset: totalDays, dueDate: dateAtOffset(totalDays), status: 'pending' });
  ms.push({ title: 'Post-settlement check-in', dayOffset: totalDays + 7, dueDate: dateAtOffset(totalDays + 7), status: 'pending' });

  return ms.sort((a, b) => a.dayOffset - b.dayOffset);
}

export function calcCoolingOffStatus(expiryDate: Date): { expired: boolean; daysLeft: number } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { expired: daysLeft <= 0, daysLeft };
}
