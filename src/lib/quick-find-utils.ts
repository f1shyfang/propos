export type QuickFindItemType = 'property' | 'brief' | 'deal';

export interface QuickFindItem {
  id: string;
  type: QuickFindItemType;
  label: string;
  sublabel: string;
  href: string;
}

export function filterQuickFindResults(query: string, items: QuickFindItem[]): QuickFindItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(item =>
    item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)
  );
}
