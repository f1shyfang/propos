export type BriefTableRow = {
  id: number;
  clientName: string;
  email: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  suburbs: string[];
  status: string | null;
  propertyTypes: string[];
  createdAt: string | null;
};

export type SortKey = 'client' | 'budget' | 'created';
export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export type BriefTableFilters = {
  search: string;
  status: string;
  propertyType: string;
};

export const CRM_DEMO_BRIEFS: BriefTableRow[] = [
  {
    id: -1,
    clientName: 'Sarah & Tom',
    email: 'sarah.tom@example.com',
    budgetMin: 800000,
    budgetMax: 1100000,
    suburbs: ['Surry Hills', 'Newtown', 'Pyrmont'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-24T00:00:00.000Z',
  },
  {
    id: -2,
    clientName: 'Mina Patel',
    email: 'mina.patel@example.com',
    budgetMin: 1200000,
    budgetMax: 1800000,
    suburbs: ['Marrickville', 'Dulwich Hill'],
    status: 'qualified',
    propertyTypes: ['House', 'Townhouse'],
    createdAt: '2026-05-22T00:00:00.000Z',
  },
  {
    id: -3,
    clientName: 'James O\'Connor',
    email: 'james.oconnor@example.com',
    budgetMin: 950000,
    budgetMax: 1350000,
    suburbs: ['Randwick', 'Coogee'],
    status: 'searching',
    propertyTypes: ['Apartment', 'Unit'],
    createdAt: '2026-05-21T00:00:00.000Z',
  },
  {
    id: -4,
    clientName: 'Anika & Leo Chen',
    email: 'anika.chen@example.com',
    budgetMin: 1600000,
    budgetMax: 2400000,
    suburbs: ['Lane Cove', 'Artarmon'],
    status: 'active',
    propertyTypes: ['House'],
    createdAt: '2026-05-18T00:00:00.000Z',
  },
  {
    id: -5,
    clientName: 'Michael Tran',
    email: 'michael.tran@example.com',
    budgetMin: 550000,
    budgetMax: 800000,
    suburbs: ['Parramatta', 'Homebush'],
    status: 'paused',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-17T00:00:00.000Z',
  },
];

function compactAud(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
}

export function formatBudgetRange(min: number | null, max: number | null): string {
  if (min && max) return `${compactAud(min)} - ${compactAud(max)}`;
  if (max) return `up to ${compactAud(max)}`;
  if (min) return `from ${compactAud(min)}`;
  return '—';
}

export function isTestNoiseBrief(row: BriefTableRow): boolean {
  const haystack = [row.clientName, row.email ?? ''].join(' ').toLowerCase();
  return /\be2e\b|\btest\b|generated|mpj/.test(haystack);
}

export function getDisplayBriefRows(inputRows: BriefTableRow[]): {
  rows: BriefTableRow[];
  hiddenTestRows: number;
  usingDemoRows: boolean;
} {
  const rows = inputRows.filter((row) => !isTestNoiseBrief(row));
  const hiddenTestRows = inputRows.length - rows.length;
  if (rows.length === 0) return { rows: CRM_DEMO_BRIEFS, hiddenTestRows, usingDemoRows: true };
  return { rows, hiddenTestRows, usingDemoRows: false };
}

export function filterBriefRows(rows: BriefTableRow[], filters: BriefTableFilters): BriefTableRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const statusOk = filters.status === 'all' || (row.status ?? 'searching') === filters.status;
    const typeOk = filters.propertyType === 'all' || row.propertyTypes.includes(filters.propertyType);
    const searchOk = !q || [
      row.clientName,
      row.email ?? '',
      row.status ?? '',
      ...row.suburbs,
      ...row.propertyTypes,
    ].join(' ').toLowerCase().includes(q);
    return statusOk && typeOk && searchOk;
  });
}

function budgetSortValue(row: BriefTableRow): number {
  return row.budgetMax ?? row.budgetMin ?? 0;
}

export function sortBriefRows(rows: BriefTableRow[], sort: SortState): BriefTableRow[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'client') return a.clientName.localeCompare(b.clientName) * dir;
    if (sort.key === 'budget') return (budgetSortValue(a) - budgetSortValue(b)) * dir;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (aTime - bTime) * dir;
  });
}

export function paginateBriefRows(rows: BriefTableRow[], page: number, pageSize: number): {
  rows: BriefTableRow[];
  page: number;
  totalPages: number;
  from: number;
  to: number;
} {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return {
    rows: pageRows,
    page: safePage,
    totalPages,
    from: rows.length === 0 ? 0 : start + 1,
    to: start + pageRows.length,
  };
}
