export type BriefTableRow = {
  id: number;
  clientName: string;
  email: string | null;
  phone?: string | null;
  agent?: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  suburbs: string[];
  status: string | null;
  propertyTypes: string[];
  createdAt: string | null;
};

export type SortKey = 'client' | 'budget' | 'created' | 'status' | 'suburbs' | 'type';
export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export type BriefTableFilters = {
  search: string;
  status: string;
  propertyType: string;
  suburb?: string;
};

export type CsvColumnKey = 'client' | 'email' | 'phone' | 'budget' | 'suburbs' | 'status' | 'type' | 'created' | 'agent';

export const CRM_DEMO_BRIEFS: BriefTableRow[] = [
  {
    id: -1,
    clientName: 'Sarah & Tom',
    email: 'sarah.tom@example.com',
    phone: '0412 884 019',
    agent: 'Jess Morgan',
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
    phone: '0407 331 660',
    agent: 'Noah Bennett',
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
    phone: '0420 118 443',
    agent: 'Jess Morgan',
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
    phone: '0435 221 904',
    agent: 'Priya Shah',
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
    phone: '0418 908 115',
    agent: 'Noah Bennett',
    budgetMin: 550000,
    budgetMax: 800000,
    suburbs: ['Parramatta', 'Homebush'],
    status: 'paused',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-17T00:00:00.000Z',
  },
  {
    id: -6,
    clientName: 'Grace Wilkinson',
    email: 'grace.wilkinson@example.com',
    phone: '0401 774 266',
    agent: 'Jess Morgan',
    budgetMin: 900000,
    budgetMax: 1250000,
    suburbs: ['Balmain', 'Rozelle', 'Annandale'],
    status: 'active',
    propertyTypes: ['Townhouse'],
    createdAt: '2026-05-16T00:00:00.000Z',
  },
  {
    id: -7,
    clientName: 'Oliver Hughes',
    email: 'oliver.hughes@example.com',
    phone: '0490 611 432',
    agent: 'Mia Clarke',
    budgetMin: 700000,
    budgetMax: 950000,
    suburbs: ['Erskineville', 'Alexandria'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-14T00:00:00.000Z',
  },
  {
    id: -8,
    clientName: 'Nadia Rahman',
    email: 'nadia.rahman@example.com',
    phone: '0448 019 702',
    agent: 'Priya Shah',
    budgetMin: 1800000,
    budgetMax: 2850000,
    suburbs: ['Mosman', 'Cremorne', 'Neutral Bay'],
    status: 'qualified',
    propertyTypes: ['House'],
    createdAt: '2026-05-13T00:00:00.000Z',
  },
  {
    id: -9,
    clientName: 'Ben & Elise Martin',
    email: 'ben.elise@example.com',
    phone: '0415 667 980',
    agent: 'Mia Clarke',
    budgetMin: 1300000,
    budgetMax: 1700000,
    suburbs: ['Leichhardt', 'Lilyfield', 'Five Dock'],
    status: 'active',
    propertyTypes: ['House', 'Duplex'],
    createdAt: '2026-05-11T00:00:00.000Z',
  },
  {
    id: -10,
    clientName: 'Clara Nguyen',
    email: 'clara.nguyen@example.com',
    phone: '0432 115 874',
    agent: 'Jess Morgan',
    budgetMin: 650000,
    budgetMax: 880000,
    suburbs: ['Canterbury', 'Dulwich Hill', 'Ashfield'],
    status: 'archived',
    propertyTypes: ['Unit'],
    createdAt: '2026-05-09T00:00:00.000Z',
  },
  {
    id: -11,
    clientName: 'Harrison Walsh',
    email: 'harrison.walsh@example.com',
    phone: '0406 882 130',
    agent: 'Noah Bennett',
    budgetMin: 2200000,
    budgetMax: 3400000,
    suburbs: ['Paddington', 'Woollahra', 'Bellevue Hill'],
    status: 'high intent',
    propertyTypes: ['Terrace', 'House'],
    createdAt: '2026-05-07T00:00:00.000Z',
  },
  {
    id: -12,
    clientName: 'Ava Robinson',
    email: 'ava.robinson@example.com',
    phone: '0455 093 612',
    agent: 'Priya Shah',
    budgetMin: 1000000,
    budgetMax: 1450000,
    suburbs: ['Manly', 'Freshwater', 'Balgowlah'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-06T00:00:00.000Z',
  },
  {
    id: -13,
    clientName: 'Samir Haddad',
    email: 'samir.haddad@example.com',
    phone: '0427 774 381',
    agent: 'Mia Clarke',
    budgetMin: 780000,
    budgetMax: 1050000,
    suburbs: ['Parramatta', 'Westmead', 'Northmead'],
    status: 'paused',
    propertyTypes: ['Townhouse', 'Apartment'],
    createdAt: '2026-05-04T00:00:00.000Z',
  },
  {
    id: -14,
    clientName: 'Eleanor Price',
    email: 'eleanor.price@example.com',
    phone: '0411 508 928',
    agent: 'Jess Morgan',
    budgetMin: 1450000,
    budgetMax: 2100000,
    suburbs: ['Newtown', 'Camperdown', 'Glebe'],
    status: 'active',
    propertyTypes: ['Terrace'],
    createdAt: '2026-05-02T00:00:00.000Z',
  },
  {
    id: -15,
    clientName: 'Daniel Kim',
    email: 'daniel.kim@example.com',
    phone: '0491 330 004',
    agent: 'Noah Bennett',
    budgetMin: 1100000,
    budgetMax: 1550000,
    suburbs: ['Chatswood', 'Willoughby', 'Lane Cove'],
    status: 'qualified',
    propertyTypes: ['Apartment', 'Townhouse'],
    createdAt: '2026-04-30T00:00:00.000Z',
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
    const suburbOk = !filters.suburb || filters.suburb === 'all' || row.suburbs.some((s) => s === filters.suburb);
    const searchOk = !q || [
      row.clientName,
      row.email ?? '',
      row.phone ?? '',
      row.agent ?? '',
      row.status ?? '',
      ...row.suburbs,
      ...row.propertyTypes,
    ].join(' ').toLowerCase().includes(q);
    return statusOk && typeOk && suburbOk && searchOk;
  });
}

function budgetSortValue(row: BriefTableRow): number {
  return row.budgetMax ?? row.budgetMin ?? 0;
}

export function sortBriefRows(rows: BriefTableRow[], sort: SortState): BriefTableRow[] {
  return sortBriefRowsMulti(rows, [sort]);
}

function sortValue(row: BriefTableRow, key: SortKey): string | number {
  if (key === 'client') return row.clientName.toLowerCase();
  if (key === 'budget') return budgetSortValue(row);
  if (key === 'created') return row.createdAt ? new Date(row.createdAt).getTime() : 0;
  if (key === 'status') return (row.status ?? 'searching').toLowerCase();
  if (key === 'suburbs') return (row.suburbs[0] ?? '').toLowerCase();
  return (row.propertyTypes[0] ?? '').toLowerCase();
}

export function sortBriefRowsMulti(rows: BriefTableRow[], sortRules: SortState[]): BriefTableRow[] {
  if (sortRules.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const sort of sortRules) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      const aValue = sortValue(a, sort.key);
      const bValue = sortValue(b, sort.key);
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
      if (result !== 0) return result * dir;
    }
    return 0;
  });
}

export function reorderColumnKeys<T extends string>(columns: T[], dragged: T, target: T): T[] {
  if (dragged === target) return columns;
  const next = columns.filter((column) => column !== dragged);
  const targetIndex = next.indexOf(target);
  if (targetIndex < 0) return columns;
  next.splice(targetIndex, 0, dragged);
  return next;
}

export function resizeColumnWidth(current: number, delta: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, current + delta));
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function csvCell(row: BriefTableRow, column: CsvColumnKey): string {
  if (column === 'client') return row.clientName;
  if (column === 'email') return row.email ?? '';
  if (column === 'phone') return row.phone ?? '';
  if (column === 'budget') return formatBudgetRange(row.budgetMin, row.budgetMax);
  if (column === 'suburbs') return row.suburbs.join(', ');
  if (column === 'status') return row.status ?? 'searching';
  if (column === 'type') return row.propertyTypes.join(', ');
  if (column === 'agent') return row.agent ?? '';
  return row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-AU') : '';
}

const CSV_LABELS: Record<CsvColumnKey, string> = {
  client: 'Client',
  email: 'Email',
  phone: 'Phone',
  budget: 'Budget',
  suburbs: 'Suburbs',
  status: 'Status',
  type: 'Type',
  created: 'Created',
  agent: 'Agent',
};

export function rowsToCsv(rows: BriefTableRow[], columns: CsvColumnKey[]): string {
  return [
    columns.map((column) => CSV_LABELS[column]).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(csvCell(row, column))).join(',')),
  ].join('\n');
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
