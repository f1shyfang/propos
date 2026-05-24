import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  dealsTable,
  buyerBriefsTable,
  propertiesTable,
  dealChecklistItemsTable,
} from '@/lib/db/schema';
import {
  DEAL_STATUSES,
  generateDueDiligenceChecklist,
  calcCoolingOffStatus,
  type DealStatus,
} from '@/lib/deal-utils';

const ACTIVE_STATUSES = [
  'suggested',
  'approved',
  'due_diligence',
  'offer_made',
  'under_contract',
  'unconditional',
] as const;
const PIPELINE_STATUSES = [...ACTIVE_STATUSES, 'settled'] as const;
const TERMINAL_STATUSES = ['settled', 'lost', 'withdrawn'] as const;

export type DealSummaryRow = {
  id: number;
  status: string;
  price: number | null;
  offerAmount: number | null;
  settlementDate?: string | null;
  exchangeDate?: string | null;
  priority?: string;
  address?: string | null;
  suburb?: string | null;
  clientName?: string | null;
  state?: string | null;
  isAuction?: boolean;
};

export type PipelineSummary = {
  activeCount: number;
  totalValue: number;
  stageCounts: Record<string, number>;
};

export type AttentionItem = {
  type: 'settlement_soon' | 'cooling_off' | 'urgent';
  dealId: number;
  title: string;
  detail: string;
  meta: string;
  urgency: 'Today' | 'Reply needed' | 'Decision' | 'Nudge';
  accent: 'red' | 'amber' | 'gray';
  href: string;
};

export type CreateDealInput = {
  briefId: number;
  propertyId: string;
  priority?: string;
  isAuction?: boolean;
  listingAgentName?: string | null;
  listingAgentPhone?: string | null;
  listingAgentEmail?: string | null;
  strategyNotes?: string | null;
  initialStatus?: string;
  fromInterestedFeedback?: boolean;
};

export class DealAlreadyExistsError extends Error {
  constructor(public existingDealId: number) {
    super('Deal already exists for this brief and property');
    this.name = 'DealAlreadyExistsError';
  }
}

export function resolveCreateDealStatus(input: {
  initialStatus?: string;
  fromInterestedFeedback?: boolean;
}): DealStatus {
  if (input.initialStatus && isValidDealStatus(input.initialStatus)) {
    return input.initialStatus;
  }
  if (input.fromInterestedFeedback) {
    return 'approved';
  }
  return 'suggested';
}

function isValidDealStatus(status: string): status is DealStatus {
  return (DEAL_STATUSES as readonly string[]).includes(status);
}

export function validateStatusTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (from === 'lost' || from === 'withdrawn') return false;

  const fromIdx = PIPELINE_STATUSES.indexOf(from as typeof PIPELINE_STATUSES[number]);
  const toIdx = PIPELINE_STATUSES.indexOf(to as typeof PIPELINE_STATUSES[number]);

  if (fromIdx >= 0 && toIdx >= 0) {
    return true;
  }

  if (fromIdx >= 0 && (to === 'lost' || to === 'withdrawn')) return true;

  return false;
}

function dealValue(row: DealSummaryRow): number {
  return row.offerAmount ?? row.price ?? 0;
}

function isActiveDeal(status: string): boolean {
  return !TERMINAL_STATUSES.includes(status as typeof TERMINAL_STATUSES[number]);
}

export function computePipelineSummary(deals: DealSummaryRow[]): PipelineSummary {
  const stageCounts: Record<string, number> = {};
  let activeCount = 0;
  let totalValue = 0;

  for (const deal of deals) {
    stageCounts[deal.status] = (stageCounts[deal.status] ?? 0) + 1;
    if (isActiveDeal(deal.status)) {
      activeCount += 1;
      totalValue += dealValue(deal);
    }
  }

  return { activeCount, totalValue, stageCounts };
}

export function formatPipelineValue(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

export function getAttentionItems(deals: DealSummaryRow[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = Date.now();

  for (const deal of deals) {
    if (!isActiveDeal(deal.status)) continue;

    const label = [deal.address, deal.suburb].filter(Boolean).join(', ') || 'Unknown property';
    const client = deal.clientName ?? 'Client';

    if (deal.settlementDate) {
      const daysLeft = Math.round((new Date(deal.settlementDate).getTime() - now) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 7) {
        items.push({
          type: 'settlement_soon',
          dealId: deal.id,
          title: daysLeft === 0 ? 'Settlement today' : `Settlement in ${daysLeft}d`,
          detail: `${label} · ${client}`,
          meta: deal.state ? `${deal.state} · ${daysLeft === 0 ? 'today' : `${daysLeft} days`}` : '',
          urgency: daysLeft <= 1 ? 'Today' : 'Decision',
          accent: daysLeft <= 1 ? 'red' : 'amber',
          href: `/deals/${deal.id}?tab=settlement`,
        });
      }
    }

    if (deal.exchangeDate && !deal.isAuction && deal.state) {
      const coolingDays: Record<string, number> = { NSW: 5, VIC: 3, QLD: 5, SA: 2, ACT: 5, NT: 4 };
      const cd = coolingDays[deal.state];
      if (cd) {
        const expiry = new Date(deal.exchangeDate);
        expiry.setDate(expiry.getDate() + cd + 2);
        const { expired, daysLeft } = calcCoolingOffStatus(expiry);
        if (!expired && daysLeft <= 2) {
          items.push({
            type: 'cooling_off',
            dealId: deal.id,
            title: 'Cooling-off expires',
            detail: `${label} · ${client}`,
            meta: `${deal.state} · ${daysLeft} business day${daysLeft === 1 ? '' : 's'} left`,
            urgency: 'Today',
            accent: 'red',
            href: `/deals/${deal.id}?tab=settlement`,
          });
        }
      }
    }

    if (deal.priority === 'urgent') {
      items.push({
        type: 'urgent',
        dealId: deal.id,
        title: 'Urgent deal needs action',
        detail: `${label} · ${client}`,
        meta: deal.status.replace(/_/g, ' '),
        urgency: 'Decision',
        accent: 'amber',
        href: `/deals/${deal.id}`,
      });
    }
  }

  const urgencyOrder = { Today: 0, 'Reply needed': 1, Decision: 2, Nudge: 3 };
  return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export async function findDealByBriefAndProperty(briefId: number, propertyId: string) {
  const [deal] = await db
    .select()
    .from(dealsTable)
    .where(and(eq(dealsTable.briefId, briefId), eq(dealsTable.propertyId, propertyId)))
    .limit(1);
  return deal ?? null;
}

export async function createDeal(input: CreateDealInput): Promise<{ deal: typeof dealsTable.$inferSelect; created: boolean }> {
  const existing = await findDealByBriefAndProperty(input.briefId, input.propertyId);
  if (existing) {
    throw new DealAlreadyExistsError(existing.id);
  }

  const [property] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, String(input.propertyId)));
  const [brief] = await db
    .select()
    .from(buyerBriefsTable)
    .where(eq(buyerBriefsTable.id, Number(input.briefId)));

  if (!property || !brief) {
    throw new Error('Property or brief not found');
  }

  const status = resolveCreateDealStatus({
    initialStatus: input.initialStatus,
    fromInterestedFeedback: input.fromInterestedFeedback,
  });

  const [deal] = await db
    .insert(dealsTable)
    .values({
      briefId: Number(input.briefId),
      propertyId: String(input.propertyId),
      status,
      priority: input.priority ?? 'standard',
      isAuction: input.isAuction ?? false,
      listingAgentName: input.listingAgentName ?? null,
      listingAgentPhone: input.listingAgentPhone ?? null,
      listingAgentEmail: input.listingAgentEmail ?? null,
      strategyNotes: input.strategyNotes ?? null,
    })
    .returning();

  const checklistItems = generateDueDiligenceChecklist(
    property.propertyType ?? 'House',
    property.state ?? 'NSW',
  );
  if (checklistItems.length) {
    await db.insert(dealChecklistItemsTable).values(
      checklistItems.map((item) => ({
        dealId: deal.id,
        title: item.title,
        assignee: item.assignee,
        dayOffset: item.dayOffset,
        status: 'pending' as const,
      })),
    );
  }

  return { deal, created: true };
}
